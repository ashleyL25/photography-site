import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type NextFunction, type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import { configErrors, env, isProduction, mediaConfigured } from './env.js'
import { assertDatabaseReachable } from './db.js'
import { assertR2Reachable } from './r2.js'
import { mailConfigured } from './lib/mail.js'

import auth from './routes/auth.js'
import users from './routes/users.js'
import pages from './routes/pages.js'
import posts from './routes/posts.js'
import sessions from './routes/sessions.js'
import albums from './routes/albums.js'
import guides from './routes/guides.js'
import taxonomy from './routes/taxonomy.js'
import media from './routes/media.js'
import settings from './routes/settings.js'
import inquiries from './routes/inquiries.js'
import publicRoutes from './routes/public.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** dist/server/index.js → dist/client */
const CLIENT_DIR = path.resolve(__dirname, '../client')

const app = express()

/**
 * Hostinger fronts the Node app with a proxy, so `req.ip` would otherwise be the
 * loopback address for every request — which would make the login throttle
 * global instead of per-client, and one determined bot would lock everybody out.
 * Passenger sets X-Forwarded-For correctly.
 */
app.set('trust proxy', true)
app.disable('x-powered-by')

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  /**
   * SAMEORIGIN rather than DENY: the dashboard previews a page by rendering it
   * in an iframe of the same origin, which DENY would break. Nothing else on the
   * site is framed, and cross-origin framing is still refused.
   */
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})

/**
 * 512 KB. No file ever passes through this server — media goes browser → R2 via
 * a presigned PUT — so request bodies only carry JSON. A page with forty
 * sections of rich text is the largest realistic payload, and that is well
 * inside this.
 */
app.use(express.json({ limit: '512kb' }))
app.use(cookieParser())

/**
 * Reports what is and is not configured, and is the only `/api` route that
 * answers while configuration is broken.
 *
 * This exists because Passenger turns a dead process into a bare 503 and
 * Hostinger exposes build logs but not runtime logs — so without it, a
 * misconfigured deploy is a blank page with no way to ask it what is wrong.
 */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: configErrors.length === 0,
    errors: configErrors,
    media: mediaConfigured,
    mail: mailConfigured,
    node: process.version,
  })
})

app.use('/api', (_req, res, next) => {
  if (configErrors.length > 0) {
    res.status(503).json({ error: 'The site is not configured yet. See /api/health.' })
    return
  }
  next()
})

/* ---------------------------------------------------------------- Public */
app.use('/api', publicRoutes)

/* ---------------------------------------------------------------- Admin */
app.use('/api/admin/auth', auth)
app.use('/api/admin/users', users)
app.use('/api/admin/pages', pages)
app.use('/api/admin/posts', posts)
app.use('/api/admin/sessions', sessions)
app.use('/api/admin/albums', albums)
app.use('/api/admin/guides', guides)
app.use('/api/admin/terms', taxonomy)
app.use('/api/admin/media', media)
app.use('/api/admin/settings', settings)
app.use('/api/admin/inquiries', inquiries)

/** An unmatched `/api` path is a 404 as JSON, never the SPA's index.html. */
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'No such endpoint' })
})

/* ---------------------------------------------------------------- Client */

app.use(
  express.static(CLIENT_DIR, {
    /**
     * Hashed asset filenames are immutable by construction, so they are cached
     * for a year. `index.html` is not hashed and must never be, or a deploy
     * would leave returning visitors on an old bundle pointing at assets that
     * no longer exist.
     */
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache')
      } else if (/\.[0-9a-f]{8,}\./.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else if (/[\\/]photos[\\/]/.test(filePath)) {
        // The photographs that ship with the site. Not fingerprinted, but a
        // rendition is only ever replaced by re-running the image script, so a
        // month is safe and keeps repeat visits off the server entirely.
        res.setHeader('Cache-Control', 'public, max-age=2592000')
      }
    },
  }),
)

/** Client-side routing: everything else is the SPA. */
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'))
})

/**
 * The error handler.
 *
 * The message is deliberately generic and the detail goes to the log: a stack
 * trace in a JSON response tells an attacker the file layout, the ORM and often
 * the query. Express needs the unused `next` parameter to recognize this as an
 * error handler rather than ordinary middleware.
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err)
  if (res.headersSent) return
  res.status(500).json({ error: 'Something went wrong' })
})

/* ---------------------------------------------------------------- Boot */

async function start() {
  if (configErrors.length === 0) {
    /**
     * Connectivity is checked at boot so a bad password fails here, loudly, and
     * not on the first sign-in. Both checks warn rather than exit: `/api/health`
     * can then say which one failed, whereas a dead process says nothing at all.
     */
    try {
      await assertDatabaseReachable()
      console.log('✓ MySQL reachable')
    } catch (err) {
      console.error('✗ MySQL unreachable:', err instanceof Error ? err.message : err)
    }

    if (mediaConfigured) {
      try {
        await assertR2Reachable()
        console.log('✓ R2 bucket reachable')
      } catch (err) {
        console.error('✗ R2 unreachable:', err instanceof Error ? err.message : err)
      }
    } else {
      console.log('· R2 not configured — uploads are off, the shipped photographs still serve')
    }
  }

  app.listen(env.PORT, () => {
    console.log(
      `Ashley Photography — API listening on :${env.PORT} (${isProduction ? 'production' : 'development'})`,
    )
  })
}

void start()
