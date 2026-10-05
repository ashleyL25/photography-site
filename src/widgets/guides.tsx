import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Photo } from '@/components/Photo'
import { ChapterNav } from '@/components/ChapterNav'
import { GuideBlock, type Block } from '@/components/GuideBlocks'
import { DrawRule, MaskText, Reveal, RichParagraphs } from '@/components/motion'
import { useActiveSection } from '@/lib/hooks'
import { useLibrary, useRetouching, useSite, useWeather } from '@/lib/site'
import { EYEBROW, frame, list, text, useHost, type WidgetProps } from './types'
import type { Section } from '@shared/types'

/* ------------------------------------------------------------------ *
 * Guide list — /guides
 * ------------------------------------------------------------------ */

export function GuidesListing({ content, styles }: WidgetProps) {
  const { guides, sessions } = useSite()
  const f = frame(styles)

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell', f.pad)}>
        <ul className="border-t border-line">
          {guides.map((guide, i) => {
            const session = sessions.find((s) => s.slug === guide.sessionSlug)
            return (
              <Reveal as="li" key={guide.id} delay={(i % 3) * 0.06} className="border-b border-line">
                <Link to={`/guides/${guide.slug}`} className="group grid gap-8 py-10 md:grid-cols-12 md:items-center">
                  <div className="hidden overflow-hidden md:col-span-2 md:block">
                    <Photo
                      src={guide.photo}
                      alt=""
                      sizes="16vw"
                      className="aspect-[4/5]"
                      imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <div className="flex items-baseline gap-4">
                      <span className="label text-faint">{String(i + 1).padStart(2, '0')}</span>
                      <h2 className="display text-[clamp(1.9rem,4vw,2.9rem)] text-ink transition-colors duration-500 group-hover:text-accent">
                        {guide.title}
                      </h2>
                    </div>
                    <p className="mt-4 max-w-xl text-[0.98rem] leading-[1.85] text-muted">{guide.subtitle}</p>
                    <p className="label mt-5 text-faint">
                      {guide.chapters} chapters
                      {session ? ` · ${session.runs}` : ''}
                    </p>
                  </div>

                  <div className="md:col-span-3 md:col-start-10">
                    <span className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors duration-400 group-hover:border-accent group-hover:text-accent">
                      {text(content, 'link_label')}
                      <span
                        aria-hidden
                        className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * The letter
 * ------------------------------------------------------------------ */

export function GuideLetter({ content, styles }: WidgetProps) {
  const host = useHost()
  const f = frame(styles)
  if (host.kind !== 'guide') return null
  const d = host.guide.details
  const meta = Array.isArray(d.meta) ? (d.meta as { label: string; value: string }[]) : []

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell grid gap-14 lg:grid-cols-12 lg:gap-20', f.pad)}>
        <div className="lg:col-span-7">
          {text(content, 'eyebrow') && (
            <Reveal className={EYEBROW}>
              <span className="h-px w-10 bg-accent" />
              {text(content, 'eyebrow')}
            </Reveal>
          )}

          <RichParagraphs
            html={typeof d.intro === 'string' ? d.intro : ''}
            className="mt-10 max-w-2xl space-y-6 text-[1.08rem] leading-[1.95] text-muted"
            step={0.07}
            start={0.06}
          />

          {typeof d.sign_off === 'string' && d.sign_off && (
            <Reveal delay={0.3} className="display mt-10 text-[2.4rem] text-accent">
              {d.sign_off}
            </Reveal>
          )}
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <Reveal className="label text-faint">{text(content, 'glance_label')}</Reveal>
          <dl className="mt-8">
            {meta.map((row, i) => (
              <Reveal key={`${row.label}-${i}`} delay={i * 0.05} className="flex items-baseline justify-between gap-6 border-b border-line py-4">
                <dt className="label shrink-0 text-faint">{row.label}</dt>
                <dd className="text-right text-[0.97rem] leading-snug text-ink">{row.value}</dd>
              </Reveal>
            ))}
          </dl>

          {host.session && (
            <Reveal delay={0.3} className="mt-10 flex flex-col items-start gap-4">
              <Link
                to={`/sessions/${host.session.slug}`}
                className="label inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {text(content, 'link_label')}
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Chapters
 * ------------------------------------------------------------------ */

/** The widget types that are blocks inside a chapter. */
export const GUIDE_BLOCK_TYPES = new Set([
  'guide_prose',
  'guide_timeline',
  'guide_steps',
  'guide_checklist',
  'guide_columns',
  'guide_compare',
  'guide_note',
  'guide_vendors',
  'guide_locations',
  'guide_location_cards',
  'guide_editing',
  'guide_weather',
])

export function chapterAnchor(section: Section): string {
  const anchor = text(section.content, 'anchor')
  const source = anchor || text(section.content, 'title') || section.id
  return (
    source
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || section.id
  )
}

/**
 * One chapter block, turned into the shape GuideBlocks draws. Several are
 * filled from settings rather than from the widget — the vendor lists, the
 * locations, the editing note and the weather — so a change in Settings
 * reaches every guide at once.
 */
function useBlocks(sections: Section[]): { block: Block; key: string }[][] {
  const library = useLibrary()
  const retouching = useRetouching()
  const host = useHost()
  // The token is kept so each weather block can name its own word.
  const weather = useWeather('{session}')
  const style = host.kind === 'guide' && host.session ? host.session.editingStyle : 'natural'

  return useMemo(() => {
    const toBlocks = (section: Section): Block[] => {
      const c = section.content
      switch (section.type) {
        case 'guide_prose':
          return [{ kind: 'prose', html: text(c, 'body') }]
        case 'guide_timeline':
          return [{ kind: 'timeline', items: list(c, 'items') }]
        case 'guide_steps':
          return [{ kind: 'steps', items: list(c, 'items') }]
        case 'guide_checklist':
          return [{ kind: 'checklist', items: list(c, 'items') }]
        case 'guide_columns':
          return [{ kind: 'columns', items: list(c, 'items') }]
        case 'guide_compare':
          return [
            {
              kind: 'compare',
              yes: { title: text(c, 'yes_title'), items: list(c, 'yes_items') },
              no: { title: text(c, 'no_title'), items: list(c, 'no_items') },
            },
          ]
        case 'guide_note':
          return [{ kind: 'note', text: text(c, 'text') }]
        case 'guide_vendors':
          return [{ kind: 'vendors', items: text(c, 'list') === 'lunch_stops' ? library.lunch_stops : library.hair_and_makeup }]
        case 'guide_locations':
          return [{ kind: 'locations', items: library.locations }]
        case 'guide_location_cards':
          return [{ kind: 'locationCards', items: library.locationCards }]
        case 'guide_editing': {
          const level = retouching[style]
          return [
            {
              kind: 'columns',
              items: [
                { title: level.label, body: level.body },
                { title: text(c, 'why_title'), body: level.why },
              ],
            },
          ]
        }
        case 'guide_weather': {
          const word = text(c, 'word') || 'session'
          const columns = weather.columns.map((col) => ({ title: col.title, body: col.body.replaceAll('{session}', word) }))
          const blocks: Block[] = [{ kind: 'columns', items: columns }]
          if (c.show_reschedule !== false && weather.reschedule) blocks.push({ kind: 'prose', html: `<p>${weather.reschedule}</p>` })
          return blocks
        }
        default:
          return []
      }
    }
    return sections.map((s) => toBlocks(s).map((block, i) => ({ block, key: `${s.id}-${i}` })))
  }, [sections, library, retouching, style, weather])
}

/**
 * A run of chapters and their blocks, with the chapter index above them.
 *
 * Chapters are not nested in the data — a Chapter widget simply starts one and
 * the blocks after it belong to it — so the page groups them here before
 * drawing. That keeps a guide editable in the ordinary page builder while it
 * still renders as numbered chapters.
 */
export function GuideChapters({ sections, guideSlug }: { sections: Section[]; guideSlug: string }) {
  const chapters = useMemo(() => {
    const out: { section: Section; id: string; blocks: Section[] }[] = []
    for (const section of sections) {
      if (section.type === 'guide_chapter') out.push({ section, id: chapterAnchor(section), blocks: [] })
      else if (out.length > 0 && GUIDE_BLOCK_TYPES.has(section.type)) out[out.length - 1].blocks.push(section)
    }
    return out
  }, [sections])

  const ids = useMemo(() => chapters.map((c) => c.id), [chapters])
  const active = useActiveSection(ids)
  const nav = useMemo(() => chapters.map((c) => ({ id: c.id, title: text(c.section.content, 'title') })), [chapters])

  const allBlocks = useMemo(() => chapters.flatMap((c) => c.blocks), [chapters])
  const resolved = useBlocks(allBlocks)
  const byId = new Map(allBlocks.map((s, i) => [s.id, resolved[i]]))

  return (
    <>
      {/* Chapter index: a sticky strip on desktop, a floating island on a
          phone. See ChapterNav for why they are not the same control. */}
      <ChapterNav chapters={nav} active={active} />

      {/* The mobile scroll margin clears the floating island, which sits below
          the status-bar inset. */}
      {chapters.map((chapter, i) => (
        <section
          key={chapter.section.id}
          id={chapter.id}
          className={`scroll-mt-[calc(12rem+env(safe-area-inset-top))] border-t border-line py-20 lg:scroll-mt-32 md:py-28 ${
            i % 2 === 1 ? 'bg-surface' : ''
          }`}
        >
          <div className="shell">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                <Reveal className="label text-accent">Chapter {String(i + 1).padStart(2, '0')}</Reveal>
                <MaskText
                  as="h2"
                  text={text(chapter.section.content, 'title')}
                  className="display mt-5 text-[clamp(2rem,4.2vw,3.2rem)] text-ink"
                />
                {text(chapter.section.content, 'lead') && (
                  <Reveal delay={0.14} className="mt-6 max-w-sm text-[1rem] leading-[1.85] text-muted italic">
                    {text(chapter.section.content, 'lead')}
                  </Reveal>
                )}
              </div>

              <div className="space-y-12 lg:col-span-8">
                {chapter.blocks.flatMap((section) =>
                  (byId.get(section.id) ?? []).map(({ block, key }) => (
                    <GuideBlock key={key} block={block} storageKey={`guide:${guideSlug}:${chapter.id}:${key}`} />
                  )),
                )}
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ *
 * The ending
 * ------------------------------------------------------------------ */

export function GuideClose({ content, styles }: WidgetProps) {
  const host = useHost()
  const { guides } = useSite()
  const f = frame(styles, { rule: true })
  if (host.kind !== 'guide') return null
  const others = guides.filter((g) => g.slug !== host.guide.slug)

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.pad, f.className)}>
      <div className="shell">
        <div className="max-w-2xl">
          {text(content, 'eyebrow') && <Reveal className="label text-accent">{text(content, 'eyebrow')}</Reveal>}
          <MaskText text={text(content, 'heading')} className="display mt-6 text-[clamp(2.2rem,5.2vw,3.8rem)] text-ink" />
          {text(content, 'body') && (
            <Reveal delay={0.15} className="mt-8 text-[1.04rem] leading-[1.9] text-muted">
              {text(content, 'body')}
            </Reveal>
          )}
          <Reveal delay={0.22} className="mt-10 flex flex-wrap gap-4 print:hidden">
            <Link
              to="/contact"
              className="label rounded-full border border-ink px-9 py-4 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
            >
              {text(content, 'button_label')}
            </Link>
            {host.session && (
              <Link
                to={`/sessions/${host.session.slug}`}
                className="label rounded-full border border-line px-9 py-4 text-muted transition-colors duration-400 hover:border-accent hover:text-accent"
              >
                The {host.session.title.toLowerCase()} session
              </Link>
            )}
          </Reveal>
        </div>

        {others.length > 0 && (
          <>
            <DrawRule className="mt-20" />
            <div className="mt-10 print:hidden">
              <p className="label text-faint">{text(content, 'others_label')}</p>
              <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
                {others.map((other) => (
                  <li key={other.id}>
                    <Link
                      to={`/guides/${other.slug}`}
                      className="display text-[1.6rem] text-muted transition-colors duration-400 hover:text-accent"
                    >
                      {other.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/**
 * One chapter or block on its own, for the dashboard's preview.
 *
 * The preview draws each section separately so each can be clicked, and a block
 * by itself has no chapter to sit in — so it is drawn in the chapter's right
 * column with the left one empty, and a Chapter widget as the chapter's heading.
 * The live page groups them as GuideChapters does.
 */
export function GuidePiecePreview({ section, guideSlug }: { section: Section; guideSlug: string }) {
  const [blocks] = useBlocks([section])

  if (section.type === 'guide_chapter') {
    return (
      <section className="border-t border-line pt-20 pb-6 md:pt-28">
        <div className="shell">
          <div className="lg:w-1/3">
            <p className="label text-accent">Chapter</p>
            <h2 className="display mt-5 text-[clamp(2rem,4.2vw,3.2rem)] text-ink">{text(section.content, 'title')}</h2>
            {text(section.content, 'lead') && (
              <p className="mt-6 max-w-sm text-[1rem] leading-[1.85] text-muted italic">{text(section.content, 'lead')}</p>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="py-6">
      <div className="shell grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-12 lg:col-span-8 lg:col-start-5">
          {(blocks ?? []).map(({ block, key }) => (
            <GuideBlock key={key} block={block} storageKey={`guide:${guideSlug}:preview:${key}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
