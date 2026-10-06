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
import { EYEBROW, bool, frame, ratio, text, type WidgetProps, columns } from './types'
import { FilterBar, LoadMore } from './FilterBar'
import type { PhotoMeta, Post } from '@shared/types'

export function postDate(post: Post): string {
  const when = post.publishedAt ?? post.createdAt
  return new Date(when * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export interface PostCardOptions {
  ratio?: string
  showDate?: boolean
  showCategory?: boolean
  showExcerpt?: boolean
  showReadingTime?: boolean
}

export function cardOptions(content: Record<string, unknown>): PostCardOptions {
  return {
    ratio: text(content, 'ratio') || '4/5',
    showDate: bool(content, 'show_date', true),
    showCategory: bool(content, 'show_category', true),
    showExcerpt: bool(content, 'show_excerpt', true),
    showReadingTime: bool(content, 'show_reading_time', true),
  }
}

function Meta({ post, o }: { post: Post; o: PostCardOptions }) {
  const parts = [o.showDate !== false ? postDate(post) : '', o.showReadingTime !== false ? `${post.readingMinutes} min read` : ''].filter(Boolean)
  if (parts.length === 0) return null
  return <p className="label text-faint">{parts.join(' · ')}</p>
}

/** One post as a card — the same proportions and type as an album card. */
export function PostCard({ post, index = 0, options = {}, lead = false }: { post: Post; index?: number; options?: PostCardOptions; lead?: boolean }) {
  const o = options
  return (
    <Reveal as="li" delay={(index % 3) * 0.08} className={lead ? 'sm:col-span-full' : undefined}>
      <Link to={`/blog/${post.slug}`} className={clsx('group block', lead && 'grid items-center gap-10 lg:grid-cols-12')}>
        <div className={clsx('relative overflow-hidden bg-surface', lead && 'lg:col-span-7')}>
          {post.featuredImage ? (
            <Photo
              src={post.featuredImage}
              alt={post.featuredAlt ?? post.title}
              sizes={lead ? '(min-width: 1024px) 58vw, 92vw' : '(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw'}
              style={ratio(lead ? '3/2' : o.ratio, '4/5')}
              imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
            />
          ) : (
            <div className="grid place-items-center border border-line" style={ratio(lead ? '3/2' : o.ratio, '4/5')}>
              <span className="display text-[3rem] text-faint">{post.title.slice(0, 1)}</span>
            </div>
          )}
          {o.showCategory !== false && post.category && (
            <span className="label absolute bottom-5 left-5 rounded-full bg-canvas/85 px-4 py-2 text-ink backdrop-blur-sm">
              {post.category.name}
            </span>
          )}
        </div>
        <div className={clsx(lead ? 'lg:col-span-5' : 'mt-6 border-t border-line pt-4')}>
          <Meta post={post} o={o} />
          <h3 className={clsx('display mt-3 text-ink transition-colors duration-400 group-hover:text-accent', lead ? 'text-[clamp(2rem,4vw,3.2rem)]' : 'text-[1.8rem]')}>
            {post.title}
          </h3>
          {o.showExcerpt !== false && post.excerpt && <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{post.excerpt}</p>}
        </div>
      </Link>
    </Reveal>
  )
}

/** A post as a row — photograph beside the words. */
function PostRow({ post, index, options }: { post: Post; index: number; options: PostCardOptions }) {
  return (
    <Reveal as="li" delay={Math.min(index * 0.05, 0.3)} className="border-b border-line">
      <Link to={`/blog/${post.slug}`} className="group grid items-center gap-6 py-8 sm:grid-cols-12 sm:gap-10">
        {post.featuredImage && (
          <div className="overflow-hidden sm:col-span-4 lg:col-span-3">
            <Photo
              src={post.featuredImage}
              alt={post.featuredAlt ?? post.title}
              sizes="(min-width: 640px) 25vw, 92vw"
              style={ratio(options.ratio, '4/5')}
              imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
            />
          </div>
        )}
        <div className={post.featuredImage ? 'sm:col-span-8 lg:col-span-9' : 'sm:col-span-12'}>
          <div className="flex flex-wrap items-center gap-4">
            {options.showCategory !== false && post.category && <span className="label text-accent">{post.category.name}</span>}
            <Meta post={post} o={options} />
          </div>
          <h3 className="display mt-3 text-[calc(clamp(1.7rem,3vw,2.4rem)*var(--hs,1))] text-ink transition-colors duration-400 group-hover:text-accent">{post.title}</h3>
          {options.showExcerpt !== false && post.excerpt && <p className="mt-3 max-w-2xl text-[0.98rem] leading-relaxed text-muted">{post.excerpt}</p>}
        </div>
      </Link>
    </Reveal>
  )
}

/** A post as a line in a typographic index. */
function PostIndexRow({ post, index, options }: { post: Post; index: number; options: PostCardOptions }) {
  return (
    <li className="border-b border-line">
      <Link to={`/blog/${post.slug}`} className="group grid grid-cols-12 items-baseline gap-4 py-6">
        <span className="label col-span-2 text-faint md:col-span-1">{String(index + 1).padStart(2, '0')}</span>
        <span className="display col-span-10 text-[calc(clamp(1.4rem,2.8vw,2.2rem)*var(--hs,1))] text-ink transition-colors duration-400 group-hover:text-accent md:col-span-7">
          {post.title}
        </span>
        <span className="label col-span-6 col-start-3 text-muted md:col-span-2 md:col-start-auto">
          {options.showCategory !== false ? (post.category?.name ?? '') : ''}
        </span>
        <span className="col-span-4 text-right text-[0.9rem] text-muted italic md:col-span-2">
          {options.showDate !== false ? postDate(post) : ''}
        </span>
      </Link>
    </li>
  )
}

/** Posts in one of the four layouts. */
export function PostList({ posts, layout, columnCount, options }: { posts: Post[]; layout: string; columnCount: string; options: PostCardOptions }) {
  if (layout === 'list') {
    return (
      <ul className="border-t border-line">
        {posts.map((post, i) => (
          <PostRow key={post.id} post={post} index={i} options={options} />
        ))}
      </ul>
    )
  }
  if (layout === 'index') {
    return (
      <ol className="border-t border-line">
        {posts.map((post, i) => (
          <PostIndexRow key={post.id} post={post} index={i} options={options} />
        ))}
      </ol>
    )
  }
  return (
    <ul className={clsx('grid gap-x-8 gap-y-16', columns(columnCount, '3'))}>
      {posts.map((post, i) => (
        <PostCard key={post.id} post={post} index={i} options={options} lead={layout === 'editorial' && i === 0} />
      ))}
    </ul>
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
            <Heading content={content} className="display mt-6 text-[calc(clamp(2rem,4.4vw,3.4rem)*var(--hs,1))] text-ink" />
          </div>
          <Reveal delay={0.12}>
            <ArrowLink href={text(content, 'link_href')} label={text(content, 'link_label')} />
          </Reveal>
        </div>
        <div className="mt-14">
          <PostList posts={posts} layout={text(content, 'layout') || 'grid'} columnCount={text(content, 'columns') || '3'} options={cardOptions(content)} />
        </div>
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
  const [search, setSearch] = useState('')
  const perPage = typeof content.per_page === 'number' && content.per_page > 0 ? content.per_page : 24
  const [shown, setShown] = useState(perPage)
  const sort = text(content, 'default_sort') || 'newest'

  const categories = useMemo(
    () => postTerms.filter((t) => t.kind === 'category' && (t.count ?? 0) > 0),
    [postTerms],
  )

  useEffect(() => {
    let canceled = false
    setPosts(null)
    const query = category === 'all' ? '' : `&category=${encodeURIComponent(category)}`
    api
      .get<{ items: Post[]; photos: Record<string, PhotoMeta> }>(`/posts?limit=96${query}`)
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

  const visible = useMemo(() => {
    if (!posts) return null
    const q = search.trim().toLowerCase()
    const out = posts.filter((p) => !q || `${p.title} ${p.excerpt ?? ''}`.toLowerCase().includes(q))
    if (sort === 'oldest') out.sort((a, b) => (a.publishedAt ?? a.createdAt) - (b.publishedAt ?? b.createdAt))
    else if (sort === 'title') out.sort((a, b) => a.title.localeCompare(b.title))
    return out
  }, [posts, search, sort])

  const options = [{ id: 'all', label: text(content, 'all_label') || 'Everything' }, ...categories.map((c) => ({ id: c.slug, label: c.name }))]

  return (
    <div id={f.id} className={f.className}>
      <FilterBar
        options={options}
        value={category}
        onChange={(id) => {
          setShown(perPage)
          setParams(id === 'all' ? {} : { category: id }, { replace: true })
        }}
        style={text(content, 'filter_style') || 'pills'}
        showFilters={bool(content, 'show_categories', true) && categories.length > 0}
        search={bool(content, 'show_search') ? search : undefined}
        onSearch={bool(content, 'show_search') ? setSearch : undefined}
        searchPlaceholder="Search the journal"
      />

      <section className={clsx('shell', f.pad)} style={f.style}>
        {categories.length === 0 && !bool(content, 'show_search') && <DrawRule className="mb-16" />}
        <AnimatePresence mode="wait">
          {visible && (
            <motion.div
              key={`${category}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              <PostList
                posts={visible.slice(0, shown)}
                layout={text(content, 'style') || 'grid'}
                columnCount={text(content, 'columns') || '3'}
                options={cardOptions(content)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {visible && visible.length > shown && (
          <LoadMore label={text(content, 'more_label') || 'More stories'} onClick={() => setShown((n) => n + perPage)} />
        )}
        {visible && visible.length === 0 && (
          <Reveal className="py-24 text-center text-muted italic">{text(content, 'empty')}</Reveal>
        )}
      </section>
    </div>
  )
}
