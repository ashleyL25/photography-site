import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { PageHero } from '@/components/PageHero'
import { MaskText, Reveal } from '@/components/motion'
import { usePageData } from '@/lib/content'
import { useDocumentMeta } from '@/lib/hooks'
import { setOverPhoto } from '@/lib/chrome'
import { useSiteInfo } from '@/lib/site'
import { renderSections } from '@/widgets'
import { HostContext } from '@/widgets/types'
import { PostCard, postDate } from '@/widgets/blog'
import { ArrowLink } from '@/widgets/links'
import { PageFallback } from './DynamicPage'
import type { Post } from '@shared/types'

/**
 * One journal post. Opens on its featured photograph the way every other page
 * opens on one; a post without a photograph gets a plain masthead instead, so
 * there is never a gray box standing in for an image.
 */
export default function BlogPost() {
  const { slug = '' } = useParams()
  const site = useSiteInfo()
  const { data, missing } = usePageData<{ post: Post; related: Post[] }>(`/posts/${slug}`)
  const post = data?.post

  useDocumentMeta(
    post ? post.metaTitle || `${post.title}${site.titleSuffix}` : site.name,
    post ? post.metaDescription || post.excerpt || undefined : undefined,
  )

  useEffect(() => {
    if (post) setOverPhoto(Boolean(post.featuredImage))
  }, [post])

  if (missing) return <Navigate to="/blog" replace />
  if (!post) return <PageFallback />

  const eyebrow = [post.category?.name, postDate(post)].filter(Boolean).join(' · ')

  return (
    <HostContext.Provider value={{ kind: 'post' }}>
      {post.featuredImage ? (
        <PageHero eyebrow={eyebrow} heading={post.title} body={post.subtitle ?? undefined} image={post.featuredImage}>
          <Reveal delay={0.25} className="label mt-10 text-beige/70">
            {post.readingMinutes} min read{post.author ? ` · ${post.author.name}` : ''}
          </Reveal>
        </PageHero>
      ) : (
        <section className="shell pt-40 pb-16 md:pt-52 md:pb-20">
          <Reveal className="label flex items-center gap-4 text-accent">
            <span className="h-px w-10 bg-accent" />
            {eyebrow}
          </Reveal>
          <MaskText as="h1" text={post.title} className="display mt-8 max-w-4xl text-[calc(clamp(2.8rem,8vw,6.5rem)*var(--hs,1))] text-ink" />
          {post.subtitle && (
            <Reveal delay={0.15} as="p" className="mt-8 max-w-xl leading-[1.85] text-muted">
              {post.subtitle}
            </Reveal>
          )}
        </section>
      )}

      {renderSections(post.sections)}

      {data.related.length > 0 && (
        <section className="border-t border-line bg-surface py-24 md:py-32">
          <div className="shell">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <MaskText text="Keep reading" className="display text-[calc(clamp(2rem,4.4vw,3.2rem)*var(--hs,1))] text-ink" />
              <Reveal delay={0.12}>
                <ArrowLink href="/blog" label="Every post" />
              </Reveal>
            </div>
            <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {data.related.map((related, i) => (
                <PostCard key={related.id} post={related} index={i} />
              ))}
            </ul>
          </div>
        </section>
      )}
    </HostContext.Provider>
  )
}
