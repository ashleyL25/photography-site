import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { api } from '@/lib/api'
import { registerPhotos } from '@/lib/photos'
import { useSite } from '@/lib/site'
import { AdminHeader } from '../AdminLayout'
import { useToast } from '../ui/Toast'
import { StatusBadge } from '../ui/EditorShell'
import { EmptyState } from '../ui/controls'
import { thumbOf } from '../photos'
import type { AlbumSummary, ContentStatus, PhotoMeta } from '@shared/types'

type Row = AlbumSummary & { status: ContentStatus; updatedAt: number }

/**
 * The portfolio, as albums — newest shoot first, which is the order the site
 * shows them. Filtered by category, the same way visitors filter it.
 */
export default function AlbumsListPage() {
  const navigate = useNavigate()
  const notify = useToast()
  const { categories } = useSite()
  const [albums, setAlbums] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api
      .get<{ albums: Row[]; photos: Record<string, PhotoMeta> }>('/admin/albums')
      .then((data) => {
        registerPhotos(data.photos)
        setAlbums(data.albums)
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not load albums', 'error'))
      .finally(() => setLoading(false))
  }, [notify])

  const visible = useMemo(() => (filter === 'all' ? albums : albums.filter((a) => a.category === filter)), [albums, filter])

  async function create() {
    try {
      const category = categories.find((c) => c.slug === filter)
      const data = await api.post<{ album: { id: string } }>('/admin/albums', { title: 'New album', categoryId: category?.id })
      navigate(`/dashboard/albums/${data.album.id}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the album', 'error')
    }
  }

  return (
    <>
      <AdminHeader
        title="Albums"
        description="The portfolio. Each album is one shoot — its photographs, its story, and the category that decides which session page it appears on."
        actions={
          <button type="button" onClick={create} className="btn btn-primary">
            New album
          </button>
        }
      />

      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {[{ slug: 'all', name: 'Everything' }, ...categories].map((c) => {
            const count = c.slug === 'all' ? albums.length : albums.filter((a) => a.category === c.slug).length
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setFilter(c.slug)}
                className={clsx(
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  filter === c.slug ? 'border-gilt bg-gilt/10 text-gilt' : 'border-line text-muted hover:border-gilt/50',
                )}
              >
                {c.name} <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-ink/[0.04]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState title="No albums here yet" body="Add one, then choose its photographs from the media library." />
        ) : (
          <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
            {visible.map((album) => (
              <li key={album.id}>
                <Link to={`/dashboard/albums/${album.id}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-line bg-canvas">
                    {album.cover && (
                      <img
                        src={thumbOf(album.cover)}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <span className="absolute top-2.5 left-2.5 rounded-full bg-surface/90 px-2.5 py-1 backdrop-blur-sm">
                      <StatusBadge status={album.status} />
                    </span>
                  </div>
                  <p className="mt-3 truncate font-semibold transition-colors group-hover:text-gilt">{album.title}</p>
                  <p className="mt-0.5 truncate text-xs text-faint">
                    {[categories.find((c) => c.slug === album.category)?.name, album.dateLabel, `${album.count} photos`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
