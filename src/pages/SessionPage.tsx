import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { usePageData } from '@/lib/content'
import { useDocumentMeta } from '@/lib/hooks'
import { setOverPhoto } from '@/lib/chrome'
import { useSite, useSiteInfo } from '@/lib/site'
import { renderSections } from '@/widgets'
import { HostContext } from '@/widgets/types'
import { PageFallback } from './DynamicPage'
import type { Section } from '@shared/types'

/**
 * One session type: its facts and prices come from the site payload, its page
 * body from its own sections.
 */
export default function SessionPage() {
  const { slug = '' } = useParams()
  const { sessions, ready } = useSite()
  const site = useSiteInfo()
  const { data, missing } = usePageData<{ session: { metaTitle: string | null; metaDescription: string | null }; sections: Section[] }>(
    `/sessions/${slug}`,
  )
  const session = sessions.find((s) => s.slug === slug)

  useDocumentMeta(
    session ? data?.session.metaTitle || `${session.title}${site.titleSuffix}` : site.name,
    // Never the unlocked figure: a meta description is for search engines,
    // which are exactly who the private list is being kept from.
    session
      ? data?.session.metaDescription ||
          `${session.blurb} ${session.runs}.${session.privatePricing ? '' : ` ${session.fromPrice}.`}`
      : undefined,
  )

  useEffect(() => setOverPhoto(true), [])

  // An unknown slug is a mistyped URL rather than a missing page, so it goes
  // back to the index instead of showing a 404.
  if (missing || (ready && !session)) return <Navigate to="/sessions" replace />
  if (!data || !session) return <PageFallback />

  return (
    <HostContext.Provider value={{ kind: 'session', session }}>
      {renderSections(data.sections)}
    </HostContext.Provider>
  )
}
