import { Router } from 'express'
import { execute, query, queryOne } from '../db.js'
import { nowSeconds, requireAuth } from '../auth.js'
import { mailConfigError, mailConfigured } from '../lib/mail.js'
import type { InquiryRow } from '../../shared/types.js'

/** Messages from the contact form, and the newsletter list. */
const router = Router()
router.use(requireAuth)

router.get('/', (req, res, next) => {
  void (async () => {
    try {
      const q = req.query as Record<string, string | undefined>
      const limit = Math.min(Number(q.limit) || 50, 200)
      const offset = Math.max(Number(q.offset) || 0, 0)
      const unreadOnly = q.unread === '1'

      const [rows, total] = await Promise.all([
        query<InquiryRow>(
          `SELECT * FROM inquiries ${unreadOnly ? 'WHERE read_at IS NULL' : ''}
            ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        ),
        queryOne<{ n: number }>(
          `SELECT COUNT(*) AS n FROM inquiries ${unreadOnly ? 'WHERE read_at IS NULL' : ''}`,
        ),
      ])

      res.json({
        inquiries: rows,
        total: Number(total?.n ?? 0),
        // Surfaced so the dashboard can say "these were saved but not emailed"
        // rather than letting a misconfigured mailer look like no enquiries.
        mail: { configured: mailConfigured, error: mailConfigError() },
      })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.post('/:id/read', (req, res, next) => {
  void (async () => {
    try {
      const { read } = (req.body ?? {}) as Record<string, unknown>
      await execute(`UPDATE inquiries SET read_at = ? WHERE id = ?`, [
        read === false ? null : nowSeconds(),
        req.params.id,
      ])
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.delete('/:id', (req, res, next) => {
  void (async () => {
    try {
      await execute(`DELETE FROM inquiries WHERE id = ?`, [req.params.id])
      res.json({ ok: true })
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
