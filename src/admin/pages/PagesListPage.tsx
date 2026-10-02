import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { api } from '@/lib/api'
import { formatRelative } from '@/lib/format'
import { AdminHeader } from '../AdminLayout'
import { useAdminAuth } from '../AdminAuth'
import { useToast } from '../ui/Toast'
import { StatusBadge } from '../ui/EditorShell'
import { HoldIconButton } from '../ui/HoldConfirm'
import { EmptyState } from '../ui/controls'
import type { Page } from '@shared/types'

type PageRow = Page & { sectionCount: number }

/**
 * Every page on the site.
 *
 * The four pages the router depends on — home, blog, portfolio, contact — are
 * marked and cannot be deleted or renamed; the rest behave normally. Creating
 * and deleting is owner-only, editing is not, which is the whole shape of the
 * two roles in one screen.
 */
export default function PagesListPage() {
  const { isOwner } = useAdminAuth()
  const navigate = useNavigate()
  const notify = useToast()

  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      const data = await api.get<{ pages: PageRow[] }>('/admin/pages')
      setPages(data.pages)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load pages', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // Loaded once on mount; every mutation below refreshes it explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function create() {
    setCreating(true)
    try {
      const data = await api.post<{ page: Page }>('/admin/pages', { title: 'New page' })
      if (data.page) navigate(`/dashboard/pages/${data.page.id}`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the page', 'error')
    } finally {
      setCreating(false)
    }
  }

  async function remove(page: PageRow) {
    try {
      await api.del(`/admin/pages/${page.id}`)
      setPages((current) => current.filter((p) => p.id !== page.id))
      notify(`“${page.title}” deleted`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete', 'error')
    }
  }

  const fixed = pages.filter((p) => p.pageKey)
  const rest = pages.filter((p) => !p.pageKey)

  return (
    <>
      <AdminHeader
        title="Pages"
        description="The structure of each page is fixed; the words, the images and which sections show are yours."
        actions={
          isOwner && (
            <button type="button" onClick={create} disabled={creating} className="btn btn-primary">
              {creating ? 'Creating…' : 'New page'}
            </button>
          )
        }
      />

      <div className="space-y-10 px-6 py-8 md:px-10 md:py-10">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-[3px] bg-ink/[0.04]" />
            ))}
          </div>
        ) : (
          <>
            <Group
              title="Core pages"
              description="The site routes to these directly, so their addresses are fixed."
              pages={fixed}
              onRemove={remove}
              canDelete={false}
            />

            {rest.length > 0 ? (
              <Group
                title="Other pages"
                pages={rest}
                  onRemove={remove}
                canDelete={isOwner}
              />
            ) : (
              isOwner && (
                <EmptyState
                  title="No other pages yet"
                  body="Add one for anything the core pages do not cover — a FAQ, a page for a seasonal mini-session."
                  action={
                    <button type="button" onClick={create} className="btn btn-secondary mt-2">
                      New page
                    </button>
                  }
                />
              )
            )}
          </>
        )}
      </div>
    </>
  )
}

function Group({
  title,
  description,
  pages,
  onRemove,
  canDelete,
}: {
  title: string
  description?: string
  pages: PageRow[]
  onRemove: (page: PageRow) => void
  canDelete: boolean
}) {
  if (pages.length === 0) return null

  return (
    <section>
      <h2 className="display text-xl">{title}</h2>
      {description && <p className="mt-1.5 text-xs text-faint">{description}</p>}

      <ul className="mt-5 divide-y divide-line rounded-[var(--card-radius)] border border-line bg-surface">
        {pages.map((page) => (
          <li key={page.id} className="group flex flex-wrap items-center gap-4 px-5 py-4">
            <Link to={`/dashboard/pages/${page.id}`} className="min-w-0 flex-1">
              <span className="flex items-center gap-3">
                <span className="truncate text-sm transition-colors group-hover:text-gilt">
                  {page.title}
                </span>
                {page.pageKey && <span className="label shrink-0 text-faint/70">Core</span>}
              </span>
              <span className="mt-1 block truncate font-mono text-xs text-faint">
                {page.pageKey === 'home' ? '/' : `/${page.slug}`}
                <span className="mx-2 opacity-50">·</span>
                {page.sectionCount} section{page.sectionCount === 1 ? '' : 's'}
                <span className="mx-2 opacity-50">·</span>
                {formatRelative(page.updatedAt)}
              </span>
            </Link>

            <StatusBadge status={page.status} />

            {canDelete && (
              <HoldIconButton label={`Delete ${page.title}`} onConfirm={() => onRemove(page)}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </HoldIconButton>
            )}

            <Link
              to={`/dashboard/pages/${page.id}`}
              className={clsx('label shrink-0 text-faint transition-colors hover:text-gilt')}
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
