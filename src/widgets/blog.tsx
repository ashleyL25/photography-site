import { Heading } from './Heading'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { Photo } from '@/components/Photo'
import { DrawRule, Reveal } from '@/components/motion'
import { api } from '@/lib/api'
import { registerPhotos } from '@/lib/photos'
import { useSite } from '@/lib/site'
import { ArrowLink } from './links'
import { EYEBROW, frame, text, type WidgetProps, columns } from './types'
import type { PhotoMeta, Post } from '@shared/types'

export function postDate(post: Post): string {
  const when = post.publishedAt ?? post.createdAt
  return new Date(when * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/** One post as a card — the same proportions and type as an album card. */
export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  return (
    <Reveal as="li" delay={(index % 3) * 0.08}>
      <Link to={`/blog/${post.slug}`} className="group block">
        <div className="relative overflow-hidden bg-surface">
          {post.featuredImage ? (
            <Photo
              src={post.featuredImage}
              alt={post.featuredAlt ?? post.title}
              sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
              className="aspect-[4/5]"
              imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
            />
          ) : (
            <div className="grid aspect-[4/5] place-items-center border border-line">
              <span className="display text-[3rem] text-faint">{post.title.slice(0, 1)}</span>
            </div>
          )}
          {post.category && (
            <span className="label absolute bottom-5 left-5 rounded-full bg-canvas/85 px-4 py-2 text-ink backdrop-blur-sm">
              {post.category.name}
            </span>
          )}
        </div>
        <div className="mt-6 border-t border-line pt-4">
          <p className="label text-faint">
            {postDate(post)} · {post.readingMinutes} min read
          </p>
          <h3 className="display mt-3 text-[1.8rem] text-ink transition-colors duration-400 group-hover:text-accent">
            {post.title}
          </h3>
          {post.excerpt && <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{post.excerpt}</p>}
        </div>
      </Link>
    </Reveal>
  )
}

/** A few posts as cards, chosen in the dashboard. */
export function BlogGrid({ content, styles, data }: WidgetProps) {
  const f = frame(styles, { rule: true })
  const posts = data ?? []
  if (posts.length === 0) return null

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)} style={f.style}>
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            {text(content, 'eyebrow') && (
              <Reveal className={EYEBROW}>
                <span className="h-px w-10 bg-accent" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}
            <Heading content={content} className="display mt-6 text-[clamp(2rem,4.4vw,3.4rem)] text-ink" />
          </div>
          <Reveal delay={0.12}>
            <ArrowLink href={text(content, 'link_href')} label={text(content, 'link_label')} />
          </Reveal>
        </div>
        <ul className={clsx('mt-14 grid gap-x-8 gap-y-14', columns(content.columns, '3'))}>
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Every published post, newest first, with category filters. */
export function BlogListing({ content, styles }: WidgetProps) {
  const { postTerms } = useSite()
  const f = frame(styles, { pad: 'py-16 md:py-24' })
  const [posts, setPosts] = useState<Post[] | null>(null)
  const [params, setParams] = useSearchParams()
  const category = params.get('category') ?? 'all'

  const categories = useMemo(
    () => postTerms.filter((t) => t.kind === 'category' && (t.count ?? 0) > 0),
    [postTerms],
  )

  useEffect(() => {
    let canceled = false
    setPosts(null)
    const query = category === 'all' ? '' : `&category=${encodeURIComponent(category)}`
    api
      .get<{ items: Post[]; photos: Record<string, PhotoMeta> }>(`/posts?limit=48${query}`)
      .then((data) => {
        if (canceled) return
        registerPhotos(data.photos)
        setPosts(data.items)
      })
      .catch(() => !canceled && setPosts([]))
    return () => {
      canceled = true
    }
  }, [category])

  return (
    <div id={f.id} className={f.className}>
      {categories.length > 0 && (
        <div className="sticky top-16 z-40 border-y border-line bg-canvas/90 backdrop-blur-xl">
          <div className="shell flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[{ slug: 'all', name: text(content, 'all_label') || 'Everything' }, ...categories].map((c) => {
              const on = category === c.slug
              return (
                <button
                  key={c.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setParams(c.slug === 'all' ? {} : { category: c.slug }, { replace: true })}
                  className={clsx(
                    'label shrink-0 rounded-full border px-5 py-2.5 whitespace-nowrap transition-colors duration-400',
                    on ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink',
                  )}
                >
                  {c.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <section className={clsx('shell', f.pad)} style={f.style}>
        {categories.length === 0 && <DrawRule className="mb-16" />}
        <AnimatePresence mode="wait">
          {posts && (
            <motion.ul
              key={category}
              className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              {posts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        {posts && posts.length === 0 && (
          <Reveal className="py-24 text-center text-muted italic">{text(content, 'empty')}</Reveal>
        )}
      </section>
    </div>
  )
}
