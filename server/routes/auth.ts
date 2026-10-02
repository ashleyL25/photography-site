import { Router } from 'express'
import { hashPassword, verifyPassword } from '../../shared/password.js'
import { execute, queryOne } from '../db.js'
import type { OverviewCounts, UserRow } from '../../shared/types.js'
import {
  SESSION_COOKIE,
  createSession,
  currentUser,
  destroyAllSessionsFor,
  destroySession,
  getSessionUser,
  nowSeconds,
  pruneExpiredSessions,
  requireAuth,
  toPublicUser,
} from '../auth.js'
import { isLoginBlocked, recordFailedLogin, clearFailedLogins } from '../rate-limit.js'

/**
 * A structurally valid hash that no password matches.
 *
 * When the submitted email is unknown a full derivation still runs against this,
 * so a wrong email and a wrong password take the same measurable time. A generic
 * error message alone does not prevent account enumeration — response latency
 * tells you which addresses exist just as clearly.
 */
const DUMMY_HASH = `scrypt$32768$8$1$${Buffer.alloc(16).toString('base64')}$${Buffer.alloc(32).toString('base64')}`

const router = Router()

router.post('/login', (req, res, next) => {
  void (async () => {
    try {
      const ip = req.ip ?? 'unknown'
      const { email, password } = (req.body ?? {}) as Record<string, unknown>

      if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
        res.status(400).json({ error: 'Email and password are required' })
        return
      }

      if (await isLoginBlocked(ip)) {
        res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' })
        return
      }

      const user = await queryOne<UserRow>(
        `SELECT * FROM users WHERE email = ?`,
        [email.trim().toLowerCase()],
      )

      const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH)

      if (!user || !ok) {
        await recordFailedLogin(ip)
        // One message for both failure modes.
        res.status(401).json({ error: 'Incorrect email or password' })
        return
      }

      await clearFailedLogins(ip)
      await pruneExpiredSessions()
      await createSession(req, res, user.id)
      await execute(`UPDATE users SET last_login_at = ? WHERE id = ?`, [nowSeconds(), user.id])

      res.json({ user: toPublicUser({ ...user, last_login_at: nowSeconds() }) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/logout', (req, res, next) => {
  void (async () => {
    try {
      await destroySession(req, res)
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/** Session probe, called by the dashboard on boot. A 401 when signed out is expected. */
router.get('/me', (req, res, next) => {
  void (async () => {
    try {
      const user = await getSessionUser(req)
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      res.json({ user })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.get('/overview', requireAuth, (_req, res, next) => {
  void (async () => {
    try {
      const counts = await queryOne<OverviewCounts>(
        `SELECT
           (SELECT COUNT(*) FROM pages)                                AS pages,
           (SELECT COUNT(*) FROM posts)                                AS posts,
           (SELECT COUNT(*) FROM posts WHERE status = 'draft')         AS drafts,
           (SELECT COUNT(*) FROM session_types)                        AS sessions,
           (SELECT COUNT(*) FROM albums)                               AS albums,
           (SELECT COUNT(*) FROM guides)                               AS guides,
           (SELECT COUNT(*) FROM media)                                AS media,
           (SELECT COUNT(*) FROM inquiries)                            AS inquiries,
           (SELECT COUNT(*) FROM inquiries WHERE read_at IS NULL)      AS unread`,
      )
      res.json({ user: currentUser(res), counts })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/* ------------------------------------------------------------------ *
 * Account settings — the signed-in user's own profile
 * ------------------------------------------------------------------ */

router.patch('/account', requireAuth, (req, res, next) => {
  void (async () => {
    try {
      const me = currentUser(res)
      const { name, displayName, bio, avatarUrl } = (req.body ?? {}) as Record<string, unknown>

      const str = (v: unknown, max: number): string | null => {
        if (typeof v !== 'string') return null
        const trimmed = v.trim()
        return trimmed ? trimmed.slice(0, max) : null
      }

      const nextName = str(name, 120)
      if (name !== undefined && !nextName) {
        res.status(400).json({ error: 'A name is required' })
        return
      }

      await execute(
        `UPDATE users
            SET name = COALESCE(?, name),
                display_name = ?,
                bio = ?,
                avatar_url = ?
          WHERE id = ?`,
        [nextName, str(displayName, 120), str(bio, 2000), str(avatarUrl, 512), me.id],
      )

      const row = await queryOne<UserRow>(`SELECT * FROM users WHERE id = ?`, [me.id])
      res.json({ user: row ? toPublicUser(row) : me })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/account/password', requireAuth, (req, res, next) => {
  void (async () => {
    try {
      const me = currentUser(res)
      const { currentPassword, newPassword } = (req.body ?? {}) as Record<string, unknown>

      if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
        res.status(400).json({ error: 'Both the current and the new password are required' })
        return
      }

      /**
       * Length is the only rule.
       *
       * Composition rules — a capital, a digit, a symbol — measurably push people
       * toward `Password1!` and toward reuse. NIST dropped them for that
       * reason. Twelve characters of anything is stronger than eight of theater.
       */
      if (newPassword.length < 12) {
        res.status(400).json({ error: 'Use at least 12 characters' })
        return
      }

      const row = await queryOne<UserRow>(`SELECT * FROM users WHERE id = ?`, [me.id])
      if (!row || !(await verifyPassword(currentPassword, row.password_hash))) {
        res.status(401).json({ error: 'That is not your current password' })
        return
      }

      await execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [
        await hashPassword(newPassword),
        me.id,
      ])

      /**
       * Every other device is signed out, this one kept.
       *
       * Changing a password is what someone does when they think it has been
       * seen, so leaving other sessions alive would make the change ceremonial.
       * Keeping the current session avoids the surprise of being ejected by the
       * act of securing the account.
       */
      const token = req.cookies?.[SESSION_COOKIE]
      await destroyAllSessionsFor(me.id, typeof token === 'string' ? token : undefined)

      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
