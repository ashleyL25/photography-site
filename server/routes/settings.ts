import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { cleanAgainst } from '../lib/content.js'
import { getSettings, saveSettings } from '../lib/settings.js'
import { buildSitePayload } from './public.js'
import { SETTINGS_GROUPS, type SettingsKey } from '../../shared/settings.js'

/**
 * The settings screens — site, pricing, policy, library, inquiry form.
 *
 * Each group is cleaned against its own field list in shared/settings.ts, the
 * same way a section is cleaned against its widget, so a request cannot store a
 * key the dashboard never offered.
 */
const router = Router()
router.use(requireAuth)

const isKey = (value: string): value is SettingsKey => value in SETTINGS_GROUPS

router.get('/', (_req, res, next) => {
  void (async () => {
    try {
      const keys = Object.keys(SETTINGS_GROUPS) as SettingsKey[]
      const values = await Promise.all(keys.map((k) => getSettings(k)))
      res.json({ settings: Object.fromEntries(keys.map((k, i) => [k, values[i]])) })
    } catch (err) {
      next(err as Error)
    }
  })()
})

router.put('/:key', (req, res, next) => {
  void (async () => {
    try {
      const key = String(req.params.key)
      if (!isKey(key)) {
        res.status(404).json({ error: 'No such settings group' })
        return
      }
      const cleaned = cleanAgainst(SETTINGS_GROUPS[key], req.body?.value)
      await saveSettings(key, cleaned)
      res.json({ value: cleaned })
    } catch (err) {
      next(err as Error)
    }
  })()
})

/**
 * The site payload as the dashboard's previews need it: drafts included, and
 * private prices shown, so a session being written previews with its figures.
 */
router.get('/site', (_req, res, next) => {
  void (async () => {
    try {
      res.set('Cache-Control', 'private, no-store').json(await buildSitePayload({ published: false, unlocked: true }))
    } catch (err) {
      next(err as Error)
    }
  })()
})

export default router
