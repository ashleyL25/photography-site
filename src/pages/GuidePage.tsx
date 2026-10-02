import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { usePageData } from '@/lib/content'
import { useDocumentMeta } from '@/lib/hooks'
import { setOverPhoto } from '@/lib/chrome'
import { useSite, useSiteInfo } from '@/lib/site'
import { renderSections } from '@/widgets'
import { HostContext } from '@/widgets/types'
import { PageFallback } from './DynamicPage'
import type { Guide } from '@shared/types'

/** One prep guide — the page Ashley sends a client on booking. */
export default function GuidePage() {
  const { slug = '' } = useParams()
  const { sessions } = useSite()
  const site = useSiteInfo()
  const { data, missing } = usePageData<{ guide: Guide }>(`/guides/${slug}`)
  const guide = data?.guide
  const session = guide ? (sessions.find((s) => s.id === guide.sessionTypeId) ?? null) : null

  useDocumentMeta(
    guide ? guide.metaTitle || `${guide.title} prep guide${site.titleSuffix}` : site.name,
    guide ? guide.metaDescription || (typeof guide.details.subtitle === 'string' ? guide.details.subtitle : undefined) : undefined,
  )

  useEffect(() => setOverPhoto(true), [])

  if (missing) return <Navigate to="/guides" replace />
  if (!guide) return <PageFallback />

  return (
    <HostContext.Provider value={{ kind: 'guide', guide, session }}>
      {renderSections(guide.sections, { guideSlug: guide.slug })}
    </HostContext.Provider>
  )
}
