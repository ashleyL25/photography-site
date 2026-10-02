import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { hashPassword } from '../../shared/password.js'
import { execute, query, queryOne } from '../db.js'
import { currentUser, requireOwner, toPublicUser } from '../auth.js'
import type { UserRow } from '../../shared/types.js'

/**
 * Account management. Owner only, throughout.
 *
 * This is the clearest line between the two roles: the owner holds every piece of
 * content on the site and none of the accounts. Not because she is not trusted
 * with them, but because the failure mode is unrecoverable from inside the app —
 * an account deleted or an email typo'd on the last owner locks everybody out,
 * and the fix is a hand-written UPDATE against the production database.
 */
const router = Router()
router.use(requireOwner)

router.get('/', (_req, res, next) => {
  void (async () => {
    try {
      const rows = await query<UserRow>(`SELECT * FROM users ORDER BY created_at ASC`)
      res.json({ users: rows.map(toPublicUser) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/', (req, res, next) => {
  void (async () => {
    try {
      const { email, name, password, role } = (req.body ?? {}) as Record<string, unknown>

      if (
        typeof email !== 'string' ||
        typeof name !== 'string' ||
        typeof password !== 'string' ||
        !email.trim() ||
        !name.trim()
      ) {
        res.status(400).json({ error: 'Email, name and password are required' })
        return
      }
      if (password.length < 12) {
        res.status(400).json({ error: 'Use at least 12 characters for the password' })
        return
      }

      const normalized = email.trim().toLowerCase()
      const existing = await queryOne<{ id: string }>(`SELECT id FROM users WHERE email = ?`, [
        normalized,
      ])
      if (existing) {
        res.status(409).json({ error: 'An account with that email already exists' })
        return
      }

      const id = randomUUID()
      await execute(
        `INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`,
        [id, normalized, await hashPassword(password), name.trim().slice(0, 120), role === 'owner' ? 'owner' : 'editor'],
      )

      const row = await queryOne<UserRow>(`SELECT * FROM users WHERE id = ?`, [id])
      res.status(201).json({ user: row ? toPublicUser(row) : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.patch('/:id', (req, res, next) => {
  void (async () => {
    try {
      const me = currentUser(res)
      const target = await queryOne<UserRow>(`SELECT * FROM users WHERE id = ?`, [req.params.id])
      if (!target) {
        res.status(404).json({ error: 'No such account' })
        return
      }

      const { name, email, role, bio, displayName } = (req.body ?? {}) as Record<string, unknown>

      /**
       * An owner may not demote themselves.
       *
       * Not paternalism — arithmetic. The owner role is the only one that can
       * grant the owner role, so the last owner demoting themselves leaves the
       * site with no way back in short of editing MySQL by hand.
       */
      if (role !== undefined && req.params.id === me.id && role !== 'owner') {
        res.status(400).json({ error: 'You cannot remove your own owner access' })
        return
      }

      let nextEmail: string | null = null
      if (typeof email === 'string' && email.trim()) {
        nextEmail = email.trim().toLowerCase()
        const clash = await queryOne<{ id: string }>(
          `SELECT id FROM users WHERE email = ? AND id <> ?`,
          [nextEmail, req.params.id],
        )
        if (clash) {
          res.status(409).json({ error: 'Another account already uses that email' })
          return
        }
      }

      await execute(
        `UPDATE users
            SET name = COALESCE(?, name),
                email = COALESCE(?, email),
                role = COALESCE(?, role),
                display_name = COALESCE(?, display_name),
                bio = COALESCE(?, bio)
          WHERE id = ?`,
        [
          typeof name === 'string' && name.trim() ? name.trim().slice(0, 120) : null,
          nextEmail,
          role === 'owner' || role === 'editor' ? role : null,
          typeof displayName === 'string' ? displayName.trim().slice(0, 120) : null,
          typeof bio === 'string' ? bio.slice(0, 2000) : null,
          req.params.id,
        ],
      )

      const row = await queryOne<UserRow>(`SELECT * FROM users WHERE id = ?`, [req.params.id])
      res.json({ user: row ? toPublicUser(row) : null })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/** Sets a password for somebody else. The current password is not required — that is the point. */
router.post('/:id/password', (req, res, next) => {
  void (async () => {
    try {
      const { password } = (req.body ?? {}) as Record<string, unknown>
      if (typeof password !== 'string' || password.length < 12) {
        res.status(400).json({ error: 'Use at least 12 characters' })
        return
      }

      const target = await queryOne<{ id: string }>(`SELECT id FROM users WHERE id = ?`, [
        req.params.id,
      ])
      if (!target) {
        res.status(404).json({ error: 'No such account' })
        return
      }

      await execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [
        await hashPassword(password),
        req.params.id,
      ])
      // Every session for that account ends. A password reset by somebody else
      // is a response to losing control of it.
      await execute(`DELETE FROM user_sessions WHERE user_id = ?`, [req.params.id])

      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.delete('/:id', (req, res, next) => {
  void (async () => {
    try {
      const me = currentUser(res)
      if (req.params.id === me.id) {
        res.status(400).json({ error: 'You cannot delete the account you are signed in with' })
        return
      }

      const owners = await queryOne<{ n: number }>(
        `SELECT COUNT(*) AS n FROM users WHERE role = 'owner'`,
      )
      const target = await queryOne<UserRow>(`SELECT * FROM users WHERE id = ?`, [req.params.id])
      if (!target) {
        res.status(404).json({ error: 'No such account' })
        return
      }
      if (target.role === 'owner' && (owners?.n ?? 0) <= 1) {
        res.status(400).json({ error: 'That is the only owner account' })
        return
      }

      // Posts written by this account survive — `posts.author_id` is ON DELETE
      // SET NULL. Removing somebody must not remove their writing.
      await execute(`DELETE FROM users WHERE id = ?`, [req.params.id])
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
