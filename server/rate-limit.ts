import { execute, queryOne } from './db.js'
import { nowSeconds } from './auth.js'

/**
 * Login throttling, per client IP, in the database rather than in memory.
 *
 * In-process counters look simpler and are wrong on this hosting: Passenger will
 * happily run more than one worker and restarts them freely, so a memory counter
 * is both partitioned and amnesiac — exactly the two properties a throttle must
 * not have. A table costs one indexed insert per failed attempt.
 */

const WINDOW_SECONDS = 15 * 60
const MAX_ATTEMPTS = 8

export async function isLoginBlocked(ip: string): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND attempted_at > ?`,
    [ip, nowSeconds() - WINDOW_SECONDS],
  )
  return (row?.n ?? 0) >= MAX_ATTEMPTS
}

export async function recordFailedLogin(ip: string): Promise<void> {
  await execute(`INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)`, [ip, nowSeconds()])
}

/**
 * Clears this IP's failures and sweeps everyone's expired rows.
 *
 * The sweep rides along on a successful login rather than a timer: the table is
 * only ever read through the window above, so old rows are inert, and a cron job
 * for a handful of rows would be machinery for its own sake.
 */
export async function clearFailedLogins(ip: string): Promise<void> {
  await execute(`DELETE FROM login_attempts WHERE ip = ? OR attempted_at <= ?`, [
    ip,
    nowSeconds() - WINDOW_SECONDS,
  ])
}

/**
 * A blunt throttle for the public write endpoints — the contact form and the
 * newsletter signup — reusing the same table with a prefixed key so those cannot
 * exhaust anyone's login budget.
 */
export async function isPublicPostBlocked(ip: string, scope: string, max = 5): Promise<boolean> {
  const row = await queryOne<{ n: number }>(
    `SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND attempted_at > ?`,
    [`${scope}:${ip}`, nowSeconds() - WINDOW_SECONDS],
  )
  return (row?.n ?? 0) >= max
}

export async function recordPublicPost(ip: string, scope: string): Promise<void> {
  await execute(`INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)`, [
    `${scope}:${ip}`,
    nowSeconds(),
  ])
}
