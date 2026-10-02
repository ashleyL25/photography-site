/**
 * Password hashing, shared verbatim between the API server and the seeding
 * script (`scripts/hash-password.mjs`).
 *
 * Plain ESM on purpose: the seed script cannot import TypeScript, and one
 * implementation matters more here than types — if the cost parameters ever
 * drifted between the hasher and the verifier, every login would fail.
 *
 * ## Why scrypt
 *
 * scrypt is in Node's standard library (`node:crypto`), so this adds no
 * dependency and, critically, **no native compile step**. Argon2id is the
 * nominally stronger choice, but every Node binding for it either needs node-gyp
 * or ships prebuilt binaries — both of which are a recurring failure mode on
 * shared hosting, where you don't control the toolchain and a failed `npm
 * install` takes the whole site down.
 *
 * scrypt is also memory-hard, which PBKDF2 is not. Moving off Cloudflare Workers
 * removed the 10 ms CPU ceiling that forced PBKDF2 earlier, so this is a
 * straight upgrade on both axes.
 *
 * N=2^15, r=8, p=1 → ~32 MB and ~100 ms per hash. The OWASP-recommended
 * baseline. `maxmem` has to be raised explicitly because Node's 32 MB default
 * is just under what these parameters need, and the failure is a thrown error
 * rather than a silent downgrade.
 */

import { scrypt as _scrypt, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(_scrypt)

const N = 32768 // CPU/memory cost, 2^15
const R = 8 // block size
const P = 1 // parallelisation
const KEY_BYTES = 32
const SALT_BYTES = 16
const MAX_MEM = 64 * 1024 * 1024

/**
 * @param {string} password
 * @param {Buffer} salt
 * @param {{N: number, r: number, p: number}} params
 * @returns {Promise<Buffer>}
 */
async function derive(password, salt, params) {
  return /** @type {Buffer} */ (
    await scrypt(password.normalize('NFKC'), salt, KEY_BYTES, {
      N: params.N,
      r: params.r,
      p: params.p,
      maxmem: MAX_MEM,
    })
  )
}

/**
 * Hash a password for storage.
 * @param {string} password
 * @returns {Promise<string>} `scrypt$<N>$<r>$<p>$<salt-b64>$<hash-b64>`
 */
export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES)
  const hash = await derive(password, salt, { N, r: R, p: P })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${hash.toString('base64')}`
}

/**
 * Verify a password against a stored hash. Never throws on malformed input — a
 * corrupt row must read as "wrong password", not as a 500.
 *
 * Cost parameters are read back out of the stored string rather than assumed, so
 * raising N later does not lock out existing accounts.
 *
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  try {
    const parts = stored.split('$')
    if (parts.length !== 6) return false
    const [scheme, nStr, rStr, pStr, saltB64, hashB64] = parts
    if (scheme !== 'scrypt') return false

    const params = { N: Number(nStr), r: Number(rStr), p: Number(pStr) }
    if (!Object.values(params).every((v) => Number.isSafeInteger(v) && v > 0)) return false

    const expected = Buffer.from(hashB64, 'base64')
    if (expected.length !== KEY_BYTES) return false

    const actual = await derive(password, Buffer.from(saltB64, 'base64'), params)
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}
