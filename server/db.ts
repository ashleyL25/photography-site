import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise'
import { env } from './env.js'

/**
 * One pool for the process. `connectionLimit` is deliberately low: Hostinger
 * shared MySQL caps concurrent connections per user, and a pool that opens more
 * than its share fails with ER_CON_COUNT_ERROR under load rather than queueing.
 *
 * `dateStrings` is irrelevant here because every timestamp column is an INT of
 * unix seconds — see the conventions note at the top of migrations/0001_init.sql.
 */
/**
 * Force IPv4 for loopback.
 *
 * Node 18+ resolves `localhost` with the system's verbatim DNS ordering, which on
 * this host returns IPv6 first — so the driver connected from `::1`. MySQL treats
 * `::1` as a different host from `localhost`, and the account is granted for
 * `localhost`, so every connection failed with:
 *
 *   Access denied for user 'u628890763_picgal'@'::1' (using password: YES)
 *
 * which reads like wrong credentials and is not. Hostinger's API also refuses to
 * whitelist `::1` as a remote host, so pinning to 127.0.0.1 here is the fix that
 * doesn't depend on an environment variable being right.
 */
const host = env.DB_HOST === 'localhost' ? '127.0.0.1' : env.DB_HOST

export const pool: Pool = mysql.createPool({
  host,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 8,
  queueLimit: 0,
  enableKeepAlive: true,
  charset: 'utf8mb4',

  /**
   * Hostinger's MySQL runs `wait_timeout = 20` — it drops any connection idle for
   * 20 seconds. The pool has no idea that happened, so it hands out a dead socket
   * and the query fails with `read ECONNRESET`. On a gallery that sees a request
   * every few minutes, that is *most* requests.
   *
   * These must stay strictly below the server's 20s. `enableKeepAlive` alone does
   * not help: TCP keepalive keeps the socket open at the network layer while MySQL
   * closes the session at the protocol layer regardless.
   *
   * Check with: SHOW VARIABLES LIKE 'wait_timeout'
   */
  idleTimeout: 10_000,
  maxIdle: 2,
  // Never enable multipleStatements. It turns any missed parameter binding into
  // a full statement-injection vector.
  multipleStatements: false,
})

/**
 * Force strict mode on every pooled connection.
 *
 * Hostinger runs MariaDB with `sql_mode = IGNORE_SPACE,NO_AUTO_CREATE_USER,
 * NO_ENGINE_SUBSTITUTION` — note the absence of STRICT_TRANS_TABLES. Without it
 * the server *silently coerces* bad writes instead of rejecting them: a string
 * longer than its VARCHAR is truncated, an out-of-range number is clamped, and a
 * missing NOT NULL value becomes ''. Every one of those returns success.
 *
 * For this schema that would mean a 300-character album title quietly becoming
 * 200 characters, or an invalid ENUM landing as ''. Strict mode turns each into
 * an error at the point of the bug.
 *
 * Set per-session because shared hosting gives no access to the server config.
 */
pool.on('connection', (conn) => {
  conn.query("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'")
})

/**
 * What may be bound to a `?` placeholder. Narrower than `unknown[]` on purpose —
 * it makes passing an object or array (which mysql2 would serialize in a way you
 * almost never intend) a compile error rather than a runtime surprise.
 *
 * **A bound string cannot be compared against a string literal.** Both helpers
 * below use prepared statements, and MariaDB gives a bound string the character
 * set's *default* collation — `utf8mb4_general_ci` — while a literal in the
 * statement text takes `collation_connection`, which for this database is
 * `utf8mb4_unicode_ci`. Both are COERCIBLE, so there is no rule deciding which
 * side converts, and `CASE WHEN ? = 'published'` fails outright with
 * ER_CANT_AGGREGATE_2COLLATIONS rather than returning a wrong answer.
 *
 * Comparing a parameter against a *column* is fine, which is why this is rare:
 * a column's collation is IMPLICIT, that outranks COERCIBLE, and the parameter
 * converts. Setting `collation_connection` does not help either, because it
 * moves the literal and never the parameter. So a test against a fixed string
 * belongs in Node, which already knows the value — see the three `/status`
 * routes, which decide `published_at` there and pass the result down.
 */
export type SqlParam = string | number | boolean | null | Date | Buffer

/**
 * Errors that mean "this connection is dead", not "this query is wrong".
 *
 * Retrying these once is safe and necessary: shrinking idleTimeout below the
 * server's wait_timeout narrows the window but cannot close it, because a
 * connection can be reaped in the moment between the pool handing it over and the
 * query reaching the wire. Without the retry that race surfaces as a random 500.
 */
const TRANSIENT = new Set([
  'ECONNRESET',
  'EPIPE',
  'ETIMEDOUT',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_SEQUENCE_TIMEOUT',
  'ER_CON_COUNT_ERROR',
])

function isTransient(err: unknown): boolean {
  const code = (err as { code?: string })?.code
  return typeof code === 'string' && TRANSIENT.has(code)
}

/**
 * Retries once on a dead connection. Deliberately not a general retry: a failed
 * INSERT that actually reached the server must not be replayed, and only
 * connection-level codes guarantee the statement never executed.
 */
async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (err) {
    if (!isTransient(err)) throw err
    return run()
  }
}

/** SELECT returning many rows. */
export async function query<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
  const [rows] = await withRetry(() => pool.execute<RowDataPacket[]>(sql, params))
  return rows as T[]
}

/** SELECT returning one row or null. */
export async function queryOne<T>(sql: string, params: SqlParam[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

/** INSERT / UPDATE / DELETE. */
export async function execute(
  sql: string,
  params: SqlParam[] = [],
): Promise<ResultSetHeader> {
  const [result] = await withRetry(() => pool.execute<ResultSetHeader>(sql, params))
  return result
}

/** Verifies connectivity at boot so a bad DB config fails fast, not on first login. */
export async function assertDatabaseReachable(): Promise<void> {
  const conn = await pool.getConnection()
  try {
    await conn.ping()
  } finally {
    conn.release()
  }
}
