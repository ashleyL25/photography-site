import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { formatRelative } from '@/lib/format'
import { Ornament } from './ui/Brand'
import { AdminHeader } from './AdminLayout'
import { useAdminAuth } from './AdminAuth'
import { Panel } from './ui/controls'
import type { AlbumSummary, ContentStatus, OverviewCounts, Post } from '@shared/types'

/**
 * The first screen.
 *
 * Deliberately not a chart. What somebody wants on opening their own site's
 * dashboard is: what did I leave half-finished, and what do I click to carry on.
 * So this is a short count, the things most recently touched, and the four
 * places anything new begins.
 */
export default function OverviewPage() {
  const { user } = useAdminAuth()

  const [counts, setCounts] = useState<OverviewCounts | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [albums, setAlbums] = useState<(AlbumSummary & { status: ContentStatus; updatedAt: number })[]>([])

  useEffect(() => {
    void Promise.all([
      api.get<{ counts: OverviewCounts }>('/admin/auth/overview').then((d) => setCounts(d.counts)),
      api.get<{ items: Post[] }>('/admin/posts?limit=5').then((d) => setPosts(d.items)),
      api
        .get<{ albums: (AlbumSummary & { status: ContentStatus; updatedAt: number })[] }>('/admin/albums')
        .then((d) => setAlbums([...d.albums].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5))),
    ]).catch(() => {
      /* Each panel handles its own empty state; a failed count is not worth a banner. */
    })
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = (user?.displayName || user?.name || '').split(' ')[0]

  return (
    <>
      <AdminHeader
        title={`${greeting}${firstName ? `, ${firstName}` : ''}`}
        description="Everything on the site lives here. Start with whatever is unfinished."
      />

      <div className="space-y-8 px-6 py-8 md:px-10 md:py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Sessions" value={counts?.sessions} hint={counts ? `${counts.guides} guides` : undefined} to="/dashboard/sessions" />
          <Stat label="Albums" value={counts?.albums} to="/dashboard/albums" />
          <Stat
            label="Journal"
            value={counts?.posts}
            hint={counts?.drafts ? `${counts.drafts} in draft` : undefined}
            to="/dashboard/blog"
          />
          <Stat
            label="Inquiries"
            value={counts?.inquiries}
            hint={counts?.unread ? `${counts.unread} unread` : undefined}
            to="/dashboard/inquiries"
            alert={Boolean(counts?.unread)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Panel
            title="Recent posts"
            actions={
              <Link to="/dashboard/blog" className="label text-faint transition-colors hover:text-gilt">
                All posts
              </Link>
            }
          >
            <RecentList
              items={posts.map((p) => ({
                id: p.id,
                title: p.title,
                to: `/dashboard/blog/${p.id}`,
                meta: `${p.status === 'draft' ? 'Draft' : 'Published'} · ${formatRelative(p.updatedAt)}`,
                draft: p.status === 'draft',
              }))}
              emptyTitle="No posts yet"
              emptyAction={{ to: '/dashboard/blog', label: 'Write the first one' }}
            />
          </Panel>

          <Panel
            title="Recent albums"
            actions={
              <Link to="/dashboard/albums" className="label text-faint transition-colors hover:text-gilt">
                All albums
              </Link>
            }
          >
            <RecentList
              items={albums.map((a) => ({
                id: a.id,
                title: a.title,
                to: `/dashboard/albums/${a.id}`,
                meta: `${a.status === 'draft' ? 'Draft' : 'Published'} · ${a.count} photos · ${formatRelative(a.updatedAt)}`,
                draft: a.status === 'draft',
              }))}
              emptyTitle="No albums yet"
              emptyAction={{ to: '/dashboard/albums', label: 'Add the first one' }}
            />
          </Panel>
        </div>

        <Panel title="Start something">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Shortcut to="/dashboard/albums" label="Add an album" body="A shoot for the portfolio." />
            <Shortcut to="/dashboard/media" label="Upload photographs" body="Resized for the web as they upload." />
            <Shortcut to="/dashboard/settings/pricing" label="Update pricing" body="The rate card, add-ons, booking." />
            <Shortcut to="/dashboard/blog" label="Write a post" body="For the journal." />
          </div>
        </Panel>

        <div className="flex justify-center py-6">
          <Ornament className="h-3 w-32 text-gilt/30" />
        </div>
      </div>
    </>
  )
}

function Stat({
  label,
  value,
  hint,
  to,
  alert,
}: {
  label: string
  value?: number
  hint?: string
  to: string
  alert?: boolean
}) {
  return (
    <Link
      to={to}
      className="group rounded-[var(--card-radius)] border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-gilt/50"
    >
      <p className="label text-faint">{label}</p>
      <p className="display mt-3 text-4xl text-gilt">
        {/* An em dash, not a zero, while the count is still loading — a real
            zero and an unloaded zero should not look the same. */}
        {value === undefined ? '—' : value}
      </p>
      {hint && (
        <p className={`mt-2 text-xs ${alert ? 'text-accent' : 'text-faint'}`}>{hint}</p>
      )}
    </Link>
  )
}

function RecentList({
  items,
  emptyTitle,
  emptyAction,
}: {
  items: { id: string; title: string; to: string; meta: string; draft: boolean }[]
  emptyTitle: string
  emptyAction: { to: string; label: string }
}) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-faint">{emptyTitle}</p>
        <Link to={emptyAction.to} className="label mt-3 inline-block text-gilt">
          {emptyAction.label}
        </Link>
      </div>
    )
  }

  return (
    <ul className="-my-1 divide-y divide-line">
      {items.map((item) => (
        <li key={item.id}>
          <Link to={item.to} className="group flex items-center gap-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm transition-colors group-hover:text-gilt">
                {item.title}
              </span>
              <span className="mt-0.5 block text-xs text-faint">{item.meta}</span>
            </span>
            {item.draft && <span className="label shrink-0 text-accent">Draft</span>}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Shortcut({ to, label, body }: { to: string; label: string; body: string }) {
  return (
    <Link
      to={to}
      className="group rounded-[3px] border border-line bg-canvas p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-gilt"
    >
      <p className="text-sm transition-colors group-hover:text-gilt">{label}</p>
      <p className="mt-1.5 text-xs text-faint">{body}</p>
    </Link>
  )
}
