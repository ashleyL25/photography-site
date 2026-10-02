import { createHmac, randomBytes } from 'node:crypto'
import type { Request, Response, RequestHandler } from 'express'
import { env, isProduction } from './env.js'
import { execute, queryOne } from './db.js'
import type { UserPublic, UserRole } from '../shared/types.js'

export const SESSION_COOKIE = 'ap_session'

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14 // 14 days

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/** 256 bits of entropy. The only value the client ever holds. */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * HMAC-SHA256 rather than a bare SHA-256 digest.
 *
 * The token is already high-entropy, so a plain hash would resist brute force
 * fine. HMAC buys something different: someone holding a read-only copy of the
 * database — a leaked backup, a misconfigured phpMyAdmin — still cannot mint a
 * working cookie, because forging one needs SESSION_SECRET, which lives in the
 * environment and never in MySQL.
 */
export function hashSessionToken(token: string): string {
  return createHmac('sha256', env.SESSION_SECRET).update(token).digest('base64url')
}

export async function createSession(req: Request, res: Response, userId: string): Promise<void> {
  const token = generateSessionToken()
  const expiresAt = nowSeconds() + SESSION_TTL_SECONDS

  await execute(
    `INSERT INTO user_sessions (token_hash, user_id, expires_at, user_agent)
     VALUES (?, ?, ?, ?)`,
    [hashSessionToken(token), userId, expiresAt, req.get('User-Agent')?.slice(0, 255) ?? null],
  )

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    // Local development runs over http, where a Secure cookie is silently dropped.
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS * 1000,
  })
}

export async function destroySession(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE]
  if (typeof token === 'string' && token) {
    await execute(`DELETE FROM user_sessions WHERE token_hash = ?`, [hashSessionToken(token)])
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' })
}

/** Signs out every device for one account. Used after a password change. */
export async function destroyAllSessionsFor(userId: string, keepToken?: string): Promise<void> {
  if (keepToken) {
    await execute(`DELETE FROM user_sessions WHERE user_id = ? AND token_hash <> ?`, [
      userId,
      hashSessionToken(keepToken),
    ])
    return
  }
  await execute(`DELETE FROM user_sessions WHERE user_id = ?`, [userId])
}

interface SessionUserRow {
  id: string
  email: string
  name: string
  display_name: string | null
  role: UserRole
  avatar_url: string | null
  bio: string | null
  created_at: number
  last_login_at: number | null
}

export function toPublicUser(row: SessionUserRow): UserPublic {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    // The byline falls back to the account name, so a new account is signed
    // sensibly before anyone has thought about how they want to appear.
    displayName: row.display_name || row.name,
    role: row.role,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  }
}

/** Resolves the current user from the session cookie, or null. */
export async function getSessionUser(req: Request): Promise<UserPublic | null> {
  const token = req.cookies?.[SESSION_COOKIE]
  if (typeof token !== 'string' || !token) return null

  const row = await queryOne<SessionUserRow>(
    `SELECT u.id, u.email, u.name, u.display_name, u.role, u.avatar_url, u.bio,
            u.created_at, u.last_login_at
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`,
    [hashSessionToken(token), nowSeconds()],
  )

  return row ? toPublicUser(row) : null
}

/** Deletes expired sessions. Cheap; called opportunistically on login. */
export async function pruneExpiredSessions(): Promise<void> {
  await execute(`DELETE FROM user_sessions WHERE expires_at <= ?`, [nowSeconds()])
}

/**
 * The authorization boundary. Every `/api/admin` route that touches data goes
 * through this — the guard in the SPA protects nothing, it only avoids showing
 * a screen that would fail.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  void (async () => {
    try {
      const user = await getSessionUser(req)
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      res.locals.user = user
      next()
    } catch (err) {
      next(err as Error)
    }
  })()
}

/**
 * The owner-only boundary.
 *
 * Guards the handful of actions that can break the site rather than change it:
 * managing accounts, and creating or deleting pages. 403 rather than 404,
 * because the caller is a signed-in colleague who should be told plainly that
 * this one is not theirs.
 */
export const requireOwner: RequestHandler = (req, res, next) => {
  void (async () => {
    try {
      const user = await getSessionUser(req)
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      if (user.role !== 'owner') {
        res.status(403).json({ error: 'That action is limited to the site owner' })
        return
      }
      res.locals.user = user
      next()
    } catch (err) {
      next(err as Error)
    }
  })()
}

/** Typed accessor for what requireAuth put on the response. */
export function currentUser(res: Response): UserPublic {
  return res.locals.user as UserPublic
}
