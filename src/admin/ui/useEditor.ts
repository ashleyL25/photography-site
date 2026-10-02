import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { registerPhotos } from '@/lib/photos'
import { useSite } from '@/lib/site'
import { useToast } from './Toast'
import type { PublishResult } from './PublishDialog'
import type { ContentStatus, PhotoMeta, Section } from '@shared/types'

interface Editable {
  id: string
  status: ContentStatus
  updatedAt: number
  sections?: Section[]
}

/**
 * Load, edit, save and publish one thing — the same cycle for a session, an
 * album and a guide.
 *
 * The draft is held whole and compared against the last saved copy, so
 * "unsaved changes" is true exactly when something differs, and typing a
 * character and deleting it again leaves the editor clean.
 */
export function useEditor<T extends Editable>(opts: {
  /** e.g. `/admin/sessions` */
  base: string
  id: string | undefined
  /** The response key the item arrives under, e.g. `session`. */
  key: string
  /** What PATCH receives, built from the draft. */
  body: (draft: T) => Record<string, unknown>
  /** Strips anything that changes on its own, for the dirty check. */
  volatile?: (item: T) => unknown
}) {
  const notify = useToast()
  const { refresh } = useSite()
  const [saved, setSaved] = useState<T | null>(null)
  const [draft, setDraft] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<PublishResult | null>(null)

  useEffect(() => {
    let canceled = false
    setLoading(true)
    api
      .get<Record<string, T> & { photos?: Record<string, PhotoMeta> }>(`${opts.base}/${opts.id}`)
      .then((data) => {
        if (canceled) return
        registerPhotos(data.photos)
        const item = data[opts.key] as T
        setSaved(item)
        setDraft(structuredClone(item))
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not load', 'error'))
      .finally(() => !canceled && setLoading(false))
    return () => {
      canceled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.base, opts.id, opts.key])

  const strip = useCallback(
    (item: T) => {
      const base = opts.volatile ? opts.volatile(item) : item
      return JSON.stringify({
        ...(base as object),
        updatedAt: 0,
        status: 'x',
        sections: (item.sections ?? []).map((s) => ({ type: s.type, hidden: s.hidden, content: s.content, styles: s.styles })),
      })
    },
    [opts],
  )

  const dirty = useMemo(() => Boolean(saved && draft && strip(saved) !== strip(draft)), [saved, draft, strip])

  const patch = useCallback((next: Partial<T>) => {
    setDraft((current) => (current ? { ...current, ...next } : current))
  }, [])

  const save = useCallback(async (): Promise<T | null> => {
    if (!draft) return null
    setSaving(true)
    try {
      const data = await api.patch<Record<string, T> & { photos?: Record<string, PhotoMeta> }>(
        `${opts.base}/${opts.id}`,
        {
          ...opts.body(draft),
          ...(draft.sections
            ? {
                sections: draft.sections.map((s) => ({
                  // A client-minted `new-…` id is not sent: the server mints the real one.
                  id: s.id.startsWith('new-') ? undefined : s.id,
                  type: s.type,
                  hidden: s.hidden,
                  content: s.content,
                  styles: s.styles,
                })),
              }
            : {}),
        },
      )
      registerPhotos(data.photos)
      const item = data[opts.key] as T
      setSaved(item)
      setDraft(structuredClone(item))
      notify('Saved')
      void refresh()
      return item
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save', 'error')
      return null
    } finally {
      setSaving(false)
    }
  }, [draft, opts, notify, refresh])

  const setStatus = useCallback(
    async (status: ContentStatus) => {
      setPublishing(true)
      try {
        // Saved first, always: publishing with the latest edits still in the
        // browser is the most confusing thing an editor can do.
        if (dirty && !(await save())) return
        const response = await api.post<PublishResult & { ok: boolean }>(`${opts.base}/${opts.id}/status`, { status })
        setSaved((current) => (current ? { ...current, status } : current))
        setDraft((current) => (current ? { ...current, status } : current))
        setResult({ status: response.status, path: response.path, wasPublished: response.wasPublished })
        void refresh()
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Could not change the status', 'error')
      } finally {
        setPublishing(false)
      }
    },
    [dirty, save, opts, notify, refresh],
  )

  return { saved, draft, loading, saving, publishing, dirty, patch, save, setStatus, result, setResult }
}
