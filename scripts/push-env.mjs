#!/usr/bin/env node
/**
 * Pushes the local `.env` up to Hostinger's Node.js environment variables.
 *
 *   npm run env:push          # show what would be sent
 *   npm run env:push -- --yes # actually send it
 *
 * ## Why this exists
 *
 * **A git auto-deploy build clears the environment variables.** It has happened
 * once, without warning: the site had been live and serving for half an hour,
 * then `/api/health` started reporting every variable missing and the whole API
 * went to 503 with the front end rendering an empty shell. The build history had
 * been pruned at the same time, so this looks like something on Hostinger's side
 * rather than anything the app did.
 *
 * Until that is understood, the cure has to be cheap: **check `/api/health`
 * after every deploy, and run this if it reports missing variables.**
 *
 * The endpoint is a *full replace* — anything not sent is deleted — so this
 * always sends the complete set from `.env`. That is also why it will not send a
 * partial file: a `.env` missing `DB_PASSWORD` would otherwise quietly delete the
 * live one.
 *
 * `NODE_ENV` is never sent, whatever `.env` says. Setting it on this hosting
 * makes npm skip devDependencies, the build toolchain goes missing, and the
 * deploy produces no `dist/` at all.
 */

import { loadEnv } from '../shared/load-env.js'

loadEnv()

const CONFIRM = process.argv.includes('--yes')

const TOKEN = process.env.HOSTINGER_API_TOKEN
const ACCOUNT = process.env.HOSTINGER_ACCOUNT || 'u628890763'
const DOMAIN = process.env.HOSTINGER_DOMAIN || 'ashleyphotographyia.com'

if (!TOKEN) {
  console.error(
    '\nSet HOSTINGER_API_TOKEN in .env.\n' +
      'hPanel → Account → API, or copy the one already in D:\\Clients\\AM\\.claude.json\n',
  )
  process.exit(1)
}

/**
 * What the running app actually needs.
 *
 * An allowlist rather than "everything in .env", because `.env` also holds
 * developer-machine values that would be wrong or dangerous in production —
 * `DB_HOST` is the remote hostname locally and must be `localhost` there, and
 * `HOSTINGER_API_TOKEN` itself has no business being readable by the web app.
 */
const KEYS = [
  'SESSION_SECRET',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_URL',
  'PUBLIC_BASE_URL',
  'RESEND_API_KEY',
  'MAIL_FROM',
  'MAIL_TO',
]

/** Required for the app to boot at all — see `configErrors` in server/env.ts. */
const REQUIRED = ['SESSION_SECRET', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']

const env_vars = [
  // The app and the database share a host in production; `.env` points at the
  // remote hostname so that migrations can be run from a developer machine.
  { key: 'DB_HOST', value: 'localhost' },
]
// `.env` carries the local origin; production always answers on the domain.
process.env.PUBLIC_BASE_URL = `https://${DOMAIN}`

for (const key of KEYS) {
  const value = process.env[key]
  if (value) env_vars.push({ key, value })
}

const absent = REQUIRED.filter((k) => !process.env[k])
if (absent.length > 0) {
  console.error(
    `\nRefusing to send: .env is missing ${absent.join(', ')}.\n` +
      `This endpoint replaces the whole set, so an incomplete push would delete\n` +
      `the live values and take the site down.\n`,
  )
  process.exit(1)
}

const url = `https://developers.hostinger.com/api/hosting/v1/accounts/${ACCOUNT}/websites/${DOMAIN}/nodejs/builds/settings/env`

console.log(`\n${DOMAIN} — ${env_vars.length} variables`)
for (const { key, value } of env_vars) {
  // Values are masked. This prints to a terminal that is often shared.
  const shown = value.length > 8 ? `${value.slice(0, 2)}${'•'.repeat(6)}` : '•'.repeat(6)
  console.log(`  ${key.padEnd(22)} ${shown}`)
}
console.log('\n  NODE_ENV                 deliberately not sent')

if (!CONFIRM) {
  console.log('\nNothing sent. Re-run with --yes to apply.\n')
  process.exit(0)
}

const response = await fetch(url, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  body: JSON.stringify({ env_vars }),
})

const body = await response.text()
if (!response.ok) {
  console.error(`\nFailed (${response.status}): ${body}\n`)
  process.exit(1)
}

console.log(`\n✓ Sent. ${body}`)
console.log('The Node process restarts automatically; give it a few seconds, then:')
console.log(`  curl https://${DOMAIN}/api/health\n`)

// Saving restarts the process, so the check is worth doing here rather than
// leaving it to whoever ran this to remember.
await new Promise((r) => setTimeout(r, 8000))
try {
  const health = await fetch(`https://${DOMAIN}/api/health`).then((r) => r.json())
  console.log(
    health.ok
      ? '✓ /api/health reports ok\n'
      : `✗ /api/health still reports: ${health.errors?.join('; ')}\n`,
  )
} catch {
  console.log('Could not reach /api/health — check it by hand.\n')
}
