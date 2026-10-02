import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { formatRelative } from '@/lib/format'
import { useSite } from '@/lib/site'
import { AdminHeader } from '../AdminLayout'
import { useAdminAuth } from '../AdminAuth'
import { useToast } from '../ui/Toast'
import { StatusBadge } from '../ui/EditorShell'
import { HoldIconButton } from '../ui/HoldConfirm'
import { EmptyState } from '../ui/controls'
import { thumbOf, usePhotoLookup } from '../photos'
import type { SessionType } from '@shared/types'

/**
 * Every session type, in the order the site lists them. The order here is the
 * order of the homepage list, the sessions page, the pricing tabs and the
 * previous/next links — so it is set here, once.
 */
export default function SessionsListPage() {
  const navigate = useNavigate()
  const notify = useToast()
  const { isOwner } = useAdminAuth()
  const { guides, categories, refresh } = useSite()
  const [sessions, setSessions] = useState<SessionType[]>([])
  const [loading, setLoading] = useState(true)
  usePhotoLookup(sessions.map((s) => s.details.photo))

  async function load() {
    try {
      const data = await api.get<{ sessions: SessionType[] }>('/admin/sessions')
      setSessions(data.sessions)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load sessions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function create() {
    try {
      const data = await api.post<{ session: SessionType }>('/admin/sessions', { title: 'New session' })
      navigate(`/dashboard/sessions/${data.session.id}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the session', 'error')
    }
  }

  async function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= sessions.length) return
    const next = [...sessions]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSessions(next)
    try {
      await api.post('/admin/sessions/reorder', { order: next.map((s) => s.id) })
      void refresh()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not reorder', 'error')
      void load()
    }
  }

  async function duplicate(session: SessionType) {
    try {
      const data = await api.post<{ session: SessionType }>(`/admin/sessions/${session.id}/duplicate`)
      navigate(`/dashboard/sessions/${data.session.id}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not duplicate', 'error')
    }
  }

  async function remove(session: SessionType) {
    try {
      await api.del(`/admin/sessions/${session.id}`)
      setSessions((current) => current.filter((s) => s.id !== session.id))
      notify(`“${session.title}” deleted`)
      void refresh()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete', 'error')
    }
  }

  return (
    <>
      <AdminHeader
        title="Sessions"
        description="Each session has its own page, its tiers, a prep guide and the albums that show it. The order here is the order everywhere on the site."
        actions={
          <button type="button" onClick={create} className="btn btn-primary">
            New session
          </button>
        }
      />

      <div className="px-6 py-8 md:px-10 md:py-10">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-ink/[0.04]" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState title="No sessions yet" body="Add the first kind of session you offer." />
        ) : (
          <ul className="divide-y divide-line rounded-[var(--card-radius)] border border-line bg-surface">
            {sessions.map((session, i) => {
              const photo = typeof session.details.photo === 'string' ? session.details.photo : ''
              const guide = guides.find((g) => g.id === session.guideId)
              const category = categories.find((c) => c.id === session.portfolioCategoryId)
              return (
                <li key={session.id} className="group flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => void move(i, -1)}
                      className="text-xs text-faint hover:text-ink disabled:opacity-25"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={i === sessions.length - 1}
                      onClick={() => void move(i, 1)}
                      className="text-xs text-faint hover:text-ink disabled:opacity-25"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="size-14 shrink-0 overflow-hidden rounded-md bg-canvas">
                    {photo && <img src={thumbOf(photo)} alt="" className="h-full w-full object-cover" />}
                  </div>

                  <Link to={`/dashboard/sessions/${session.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-semibold transition-colors group-hover:text-gilt">{session.title}</span>
                    <span className="mt-1 block truncate text-xs text-faint">
                      {session.packages.tiers.length} tiers
                      {session.privatePricing && ' · private pricing'}
                      {guide ? ` · guide: ${guide.title}` : ' · no guide'}
                      {category ? ` · ${category.name}` : ''}
                      <span className="mx-2 opacity-50">·</span>
                      {formatRelative(session.updatedAt)}
                    </span>
                  </Link>

                  <StatusBadge status={session.status} />

                  <button type="button" onClick={() => void duplicate(session)} className="label text-faint transition-colors hover:text-gilt">
                    Duplicate
                  </button>

                  {isOwner && (
                    <HoldIconButton label={`Delete ${session.title}`} onConfirm={() => void remove(session)}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </HoldIconButton>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
