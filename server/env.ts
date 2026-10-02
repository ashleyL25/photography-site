import { loadEnv } from '../shared/load-env.js'

/**
 * Environment validation, run once at boot.
 *
 * Config comes from either source, whichever is present:
 *   1. Real environment variables — hPanel → Node.js → Environment variables
 *   2. A `.env` file next to the app on the server
 *
 * Environment variables win when both exist.
 */
loadEnv()

const missing: string[] = []

function required(name: string): string {
  const v = process.env[name]
  if (!v) {
    missing.push(name)
    return ''
  }
  return v
}

function optional(name: string, fallback = ''): string {
  return process.env[name] || fallback
}

export const env = {
  /**
   * Defaults to 'production', not 'development'.
   *
   * Inverted from the usual convention deliberately. Setting NODE_ENV=production
   * in hPanel makes npm omit devDependencies, which on this hosting means the
   * build toolchain is never installed and `vite build` fails with "command not
   * found" — no dist/, nothing for Passenger to start, a bare 503. So NODE_ENV
   * has to stay unset on the server, which means unset must mean production
   * here. It also fails safe: the only thing keying off this is the `Secure`
   * flag on the session cookie, and a missing value now yields a Secure cookie
   * rather than silently dropping it.
   */
  NODE_ENV: optional('NODE_ENV', 'production'),
  PORT: Number(optional('PORT', '3000')),

  /** openssl rand -base64 32 */
  SESSION_SECRET: required('SESSION_SECRET'),

  DB_HOST: optional('DB_HOST', 'localhost'),
  DB_PORT: Number(optional('DB_PORT', '3306')),
  DB_USER: required('DB_USER'),
  DB_PASSWORD: required('DB_PASSWORD'),
  DB_NAME: required('DB_NAME'),

  /**
   * Cloudflare R2 — optional. Without it the site runs in full and serves the
   * photographs that ship with it; only uploading new ones is switched off,
   * and the media library says so.
   */
  R2_ACCOUNT_ID: optional('R2_ACCOUNT_ID'),
  R2_ACCESS_KEY_ID: optional('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY: optional('R2_SECRET_ACCESS_KEY'),
  R2_BUCKET: optional('R2_BUCKET', 'img-ashleyphotography'),

  /**
   * The public read origin in front of the bucket — the r2.dev development URL,
   * or a custom domain attached in the Cloudflare dashboard.
   *
   * It cannot be derived the way the private S3 endpoint can, because it is
   * whatever hostname was pointed at the bucket. Every media row stores the
   * absolute URL built from this at upload time rather than recomputing it on
   * read, so changing it later is a data migration and not a silent breakage.
   */
  R2_PUBLIC_URL: optional('R2_PUBLIC_URL'),

  /**
   * Optional override. Normally derived from R2_ACCOUNT_ID, since Cloudflare's
   * endpoint is always `https://<account-id>.r2.cloudflarestorage.com`. Kept
   * configurable for a jurisdiction-specific endpoint or a local S3 mock.
   */
  S3_API_ENDPOINT: optional('S3_API_ENDPOINT'),

  /**
   * Absolute origin, used only for links that leave the app: canonical tags, the
   * sitemap, og:url. A request's own Host header is the obvious source and the
   * wrong one — it is attacker-controlled, and a poisoned value would put
   * somebody else's domain in this site's canonical tag.
   */
  PUBLIC_BASE_URL: optional('PUBLIC_BASE_URL', 'http://localhost:5173'),

  /**
   * Contact-form delivery. Optional: without it an enquiry is still recorded in
   * full and the dashboard shows it as not emailed, rather than the form
   * pretending it went somewhere.
   */
  RESEND_API_KEY: optional('RESEND_API_KEY'),
  MAIL_FROM: optional('MAIL_FROM'),
  MAIL_TO: optional('MAIL_TO'),
} as const

/**
 * Missing required variables, reported over `/api/health` rather than killed
 * with `process.exit(1)`.
 *
 * Exiting is the textbook move and it is the wrong one here: Passenger turns a
 * dead process into a bare 503, and Hostinger exposes build logs but not runtime
 * logs — so the actual reason would be unreachable. A misconfigured deploy
 * should be able to explain itself.
 *
 * When this is non-empty, every `/api/*` route except `/api/health` refuses to
 * serve. That matters most for SESSION_SECRET: signing cookies with an empty key
 * would be worse than being down.
 */
export const configErrors: string[] = missing.length
  ? [`Missing environment variable(s): ${missing.join(', ')}`]
  : []

if (configErrors.length > 0) {
  console.error(
    `\n${configErrors[0]}\n\n` +
      `Locally: copy .env.example to .env and fill it in.\n` +
      `On Hostinger: hPanel → Websites → your app → Node.js → Environment variables.\n`,
  )
}

export const isProduction = env.NODE_ENV !== 'development'

/** True once the bucket and the public origin in front of it are both set. */
export const mediaConfigured = Boolean(
  env.R2_PUBLIC_URL && env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY,
)

export function mediaConfigError(): string | null {
  return mediaConfigured
    ? null
    : 'Uploads are switched off until the R2 keys and R2_PUBLIC_URL are set on the server'
}
