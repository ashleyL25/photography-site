/**
 * Reads a `.env` file sitting next to the app, without overwriting anything
 * already present in the real environment.
 *
 * Two sources exist because the hosting only reliably offers one of them.
 * Hostinger's hPanel can set process-level variables, but its API cannot, so a
 * fully scripted deploy has to ship a file. Supporting both means switching
 * later is a deployment change and not a code change.
 *
 * Deliberately not `dotenv`: this is twenty lines, and the dependency would be
 * installed on the server on every deploy for those twenty lines.
 *
 * Node's own `--env-file` covers local development (see package.json). This
 * function is what covers production, where the start command is fixed by
 * Passenger and cannot carry the flag.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Candidate locations, in order. `shared/` sits one level under the app root in
 * source and two under it once compiled to `dist/shared`, so both are tried
 * rather than assuming which one is running.
 */
const CANDIDATES = [
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
]

let loaded = false

export function loadEnv() {
  if (loaded) return
  loaded = true

  for (const file of CANDIDATES) {
    let raw
    try {
      raw = readFileSync(file, 'utf8')
    } catch {
      continue
    }

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue

      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()

      // Strip one matched pair of quotes, so a value with a trailing space or a
      // `#` can be written as "…" without the quotes becoming part of it.
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      // A real environment variable always wins. Without this, redeploying a
      // file would silently override a value set in hPanel.
      if (process.env[key] === undefined) process.env[key] = value
    }

    return
  }
}
