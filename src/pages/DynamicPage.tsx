import { lazy, Suspense, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usePageData } from '@/lib/content'
import { useDocumentMeta } from '@/lib/hooks'
import { setOverPhoto } from '@/lib/chrome'
import { useSiteInfo } from '@/lib/site'
import { setRailEntries } from '@/components/Rails'
import { PHOTO_OPENERS, railEntries, renderSections } from '@/widgets'
import type { Page } from '@shared/types'

const NotFound = lazy(() => import('./NotFound'))

/** Holds the viewport height while a page resolves, so nothing jumps. */
export function PageFallback() {
  return <div className="min-h-[80svh]" />
}

/**
 * Any page built in the dashboard — the home page, the indexes, About,
 * Experience, Contact, and anything added later.
 *
 * The router reaches the fixed pages by key (`home`, `sessions`, `portfolio`,
 * `guides`, `blog`) and everything else by slug, so renaming About in the
 * dashboard never breaks the homepage.
 */
export default function DynamicPage({ pageKey }: { pageKey?: string }) {
  const { slug } = useParams()
  const site = useSiteInfo()
  const path = pageKey ? `/page-by-key/${pageKey}` : slug ? `/page/${slug}` : null
  const { data, missing } = usePageData<{ page: Page }>(path)
  const page = data?.page

  const title = page ? page.metaTitle || (pageKey === 'home' ? site.name : `${page.title}${site.titleSuffix}`) : site.name
  useDocumentMeta(title, page?.metaDescription || site.description || undefined)

  useEffect(() => {
    if (!page) return
    const first = (page.sections ?? []).find((s) => !s.hidden)
    setOverPhoto(Boolean(first && PHOTO_OPENERS.has(first.type)))
    setRailEntries(pageKey === 'home' ? railEntries(page.sections) : [])
  }, [page, pageKey])

  if (missing) {
    return (
      <Suspense fallback={<PageFallback />}>
        <NotFound />
      </Suspense>
    )
  }
  if (!page) return <PageFallback />

  return <>{renderSections(page.sections)}</>
}
