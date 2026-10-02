import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { api, qs } from '@/lib/api'
import { formatRelative } from '@/lib/format'
import { useDebounced } from '@/admin/hooks'
import { useSite } from '@/lib/site'
import { AdminHeader } from '../AdminLayout'
import { useToast } from '../ui/Toast'
import { StatusBadge } from '../ui/EditorShell'
import { HoldIconButton } from '../ui/HoldConfirm'
import { EmptyState, Select, inputClass } from '../ui/controls'
import { TermBadge } from '../ui/TermBadge'
import { NewPostDialog } from './NewPostDialog'
import type { Post } from '@shared/types'

export default function PostsListPage() {
  const navigate = useNavigate()
  const notify = useToast()
  const { terms, refresh } = useSite()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const debounced = useDebounced(search, 250)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: Post[] }>(
        `/admin/posts${qs({ search: debounced, category, limit: 100 })}`,
      )
      setPosts(data.items)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load posts', 'error')
    } finally {
      setLoading(false)
    }
  }, [debounced, category, notify])

  useEffect(() => {
    void load()
  }, [load])

  async function create(title: string, template: string) {
    setCreating(true)
    try {
      const data = await api.post<{ post: Post }>('/admin/posts', { title, template })
      if (data.post) navigate(`/dashboard/blog/${data.post.id}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the post', 'error')
      setCreating(false)
    }
  }

  async function duplicate(post: Post) {
    try {
      const data = await api.post<{ post: Post }>(`/admin/posts/${post.id}/duplicate`)
      if (data.post) navigate(`/dashboard/blog/${data.post.id}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not duplicate', 'error')
    }
  }

  async function remove(post: Post) {
    try {
      await api.del(`/admin/posts/${post.id}`)
      setPosts((current) => current.filter((p) => p.id !== post.id))
      // The public filter counts come from `/site`, so they go stale the moment
      // a post is deleted.
      void refresh()
      notify(`“${post.title}” deleted`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete', 'error')
    }
  }

  // Status is filtered here rather than on the server: the dashboard always
  // loads every post anyway, and doing it locally keeps the toggle instant.
  const visible = posts.filter((p) => !status || p.status === status)
  const categories = terms.post.filter((t) => t.kind === 'category')

  return (
    <>
      <AdminHeader
        title="Blog posts"
        description="Essays, notes and anything else worth publishing under your own name."
        actions={
          <button type="button" onClick={() => setDialogOpen(true)} className="btn btn-primary">
            New post
          </button>
        }
      />

      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className={clsx(inputClass, 'w-full sm:w-64')}
          />

          <div className="w-44">
            <Select
              value={status}
              onChange={setStatus}
              options={[
                { value: '', label: 'Every status' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Drafts' },
              ]}
            />
          </div>

          {categories.length > 0 && (
            <div className="w-52">
              <Select
                value={category}
                onChange={setCategory}
                options={[
                  { value: '', label: 'Every category' },
                  ...categories.map((c) => ({ value: c.slug, label: c.name })),
                ]}
              />
            </div>
          )}

          <span className="ml-auto text-xs text-faint">
            {visible.length} post{visible.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-[3px] bg-ink/[0.04]" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={search || category || status ? 'Nothing matches' : 'No posts yet'}
            body={
              search || category || status
                ? 'Try a different search, or clear the filters.'
                : 'Start with a template — a session story, a guide to a location, a few favourites from the season.'
            }
            action={
              !search && !category && !status ? (
                <button
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className="btn btn-primary mt-2"
                >
                  Write the first one
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line rounded-[var(--card-radius)] border border-line bg-surface">
            {visible.map((post) => (
              <li key={post.id} className="group flex flex-wrap items-center gap-4 px-5 py-4">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt=""
                    loading="lazy"
                    className="h-14 w-20 shrink-0 rounded-[2px] object-cover"
                  />
                ) : (
                  <span className="grid h-14 w-20 shrink-0 place-items-center rounded-[2px] border border-line bg-canvas">
                    <span className="script text-xl text-gilt/40">{post.title.slice(0, 1)}</span>
                  </span>
                )}

                <Link to={`/dashboard/blog/${post.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm transition-colors group-hover:text-gilt">
                    {post.title}
                  </span>
                  <span className="mt-1 block truncate text-xs text-faint">
                    /blog/{post.slug}
                    <span className="mx-2 opacity-50">·</span>
                    {formatRelative(post.updatedAt)}
                    <span className="mx-2 opacity-50">·</span>
                    {post.readingMinutes} min
                  </span>
                </Link>

                {post.category && <TermBadge term={post.category} className="shrink-0" />}

                <StatusBadge status={post.status} />

                <div className="flex shrink-0 items-center gap-1">
                  {post.status === 'published' && (
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View live"
                      aria-label="View live"
                      className="grid size-10 place-items-center text-faint transition-colors hover:text-gilt"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M7 17 17 7M9 7h8v8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => void duplicate(post)}
                    title="Duplicate"
                    aria-label="Duplicate"
                    className="grid size-10 place-items-center text-faint transition-colors hover:text-gilt"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <rect x="8" y="8" width="12" height="12" rx="1.5" strokeWidth="1.3" />
                      <path d="M16 5H5.5A1.5 1.5 0 0 0 4 6.5V17" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  </button>

                  <HoldIconButton label={`Delete ${post.title}`} onConfirm={() => void remove(post)}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </HoldIconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NewPostDialog
        open={dialogOpen}
        busy={creating}
        onClose={() => setDialogOpen(false)}
        onCreate={create}
      />
    </>
  )
}
