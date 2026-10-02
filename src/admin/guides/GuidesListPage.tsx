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
import type { Guide } from '@shared/types'

/** Every prep guide, and the session each one belongs to. */
export default function GuidesListPage() {
  const navigate = useNavigate()
  const notify = useToast()
  const { isOwner } = useAdminAuth()
  const { sessions, refresh } = useSite()
  const [guides, setGuides] = useState<(Guide & { chapters: number })[]>([])
  const [loading, setLoading] = useState(true)
  usePhotoLookup(guides.map((g) => g.details.photo))

  useEffect(() => {
    api
      .get<{ guides: (Guide & { chapters: number })[] }>('/admin/guides')
      .then((data) => setGuides(data.guides))
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not load guides', 'error'))
      .finally(() => setLoading(false))
  }, [notify])

  async function create() {
    try {
      const data = await api.post<{ guide: Guide }>('/admin/guides', { title: 'New guide' })
      navigate(`/dashboard/guides/${data.guide.id}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the guide', 'error')
    }
  }

  async function duplicate(guide: Guide) {
    try {
      const data = await api.post<{ guide: Guide }>(`/admin/guides/${guide.id}/duplicate`)
      navigate(`/dashboard/guides/${data.guide.id}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not duplicate', 'error')
    }
  }

  async function remove(guide: Guide) {
    try {
      await api.del(`/admin/guides/${guide.id}`)
      setGuides((current) => current.filter((g) => g.id !== guide.id))
      notify(`“${guide.title}” deleted`)
      void refresh()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete', 'error')
    }
  }

  return (
    <>
      <AdminHeader
        title="Guides"
        description="The prep guide each client is sent when they book. Chapters are built with the page builder; connect a guide to its session to show it on that session’s page."
        actions={
          <button type="button" onClick={create} className="btn btn-primary">
            New guide
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
        ) : guides.length === 0 ? (
          <EmptyState title="No guides yet" body="Write one for the session people book most." />
        ) : (
          <ul className="divide-y divide-line rounded-[var(--card-radius)] border border-line bg-surface">
            {guides.map((guide) => {
              const photo = typeof guide.details.photo === 'string' ? guide.details.photo : ''
              const session = sessions.find((s) => s.id === guide.sessionTypeId)
              return (
                <li key={guide.id} className="group flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="size-14 shrink-0 overflow-hidden rounded-md bg-canvas">
                    {photo && <img src={thumbOf(photo)} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <Link to={`/dashboard/guides/${guide.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-semibold transition-colors group-hover:text-gilt">{guide.title}</span>
                    <span className="mt-1 block truncate text-xs text-faint">
                      {guide.chapters} chapters · {session ? `for ${session.title}` : 'not connected to a session'}
                      <span className="mx-2 opacity-50">·</span>
                      {formatRelative(guide.updatedAt)}
                    </span>
                  </Link>
                  <StatusBadge status={guide.status} />
                  <button type="button" onClick={() => void duplicate(guide)} className="label text-faint transition-colors hover:text-gilt">
                    Duplicate
                  </button>
                  {isOwner && (
                    <HoldIconButton label={`Delete ${guide.title}`} onConfirm={() => void remove(guide)}>
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
