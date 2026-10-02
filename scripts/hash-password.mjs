#!/usr/bin/env node
/**
 * Prints a stored-password hash for a password given on stdin.
 *
 * For the occasion the only way back in is an UPDATE against the database by
 * hand — a locked-out owner, a restored backup with a stale password. Reads from
 * stdin rather than taking an argument so the password never lands in the shell
 * history or in the process list, where `ps` would show it to anyone on the box.
 *
 *   echo -n 'the password' | npm run hash-password
 */

import { hashPassword } from '../shared/password.js'

const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const password = Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '')

if (!password) {
  console.error("\nNothing on stdin. Use:  echo -n 'the password' | npm run hash-password\n")
  process.exit(1)
}

console.log(await hashPassword(password))
