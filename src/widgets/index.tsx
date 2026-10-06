import type { ComponentType } from 'react'
import clsx from 'clsx'
import { DrawRule } from '@/components/motion'
import { GuideHero, HomeHero, PageHeroWidget, SessionHero } from './opening'
import {
  AboutEssays,
  AboutIntro,
  AsideCta,
  ChecklistSplit,
  CtaClose,
  Faq,
  Marquee,
  Milestones,
  NumberedCards,
  Quote,
  Story,
  TextBlock,
  TimelineArc,
} from './text'
import { ImageBlock, ImageText, PhotoGallery, Process, SelectedWork } from './photos'
import {
  AlwaysIncluded,
  SessionAlbums,
  SessionCards,
  SessionGuide,
  SessionLinks,
  SessionNav,
  SessionOverview,
  SessionPricing,
  SessionsIndex,
} from './sessions'
import { FinishingLevels, GalleryTimeline, Investment, WeatherPolicy } from './pricing'
import { PortfolioListing } from './portfolio'
import { GUIDE_BLOCK_TYPES, GuideChapters, GuideClose, GuideLetter, GuidePiecePreview, GuidesListing } from './guides'
import { BlogGrid, BlogListing } from './blog'
import { InquiryCta, InquiryFormWidget } from './contact'
import {
  AlbumGrid,
  AuthorCard,
  BeforeAfter,
  Cards,
  CtaBand,
  Instagram,
  Logos,
  MapEmbed,
  Stats,
  Testimonials,
  TwoColumn,
  Video,
} from './extra'
import { frame, text, type WidgetProps } from './types'
import { StyledSection } from './StyledSection'
import { ButtonsRow, ColumnsBlock, EmbedCode, HeadingBlock, ListBlock, RichTextBlock, TextPhotosBlock } from './basics'
import type { Section as SectionData } from '@shared/types'
import { swatchCss } from '@shared/palette'
import { ArtworkSvg } from '@/components/Decor'

function Divider({ content, styles }: WidgetProps) {
  const f = frame(styles, { pad: 'py-6' })
  const style = text(content, 'style') || 'line'
  const width = text(content, 'width') || 'full'
  const colour = swatchCss(text(content, 'swatch') || 'accent')
  const measure = width === 'short' ? 'mx-auto max-w-xs' : width === 'wide' ? 'mx-auto max-w-3xl' : ''
  const ornament = (child: React.ReactNode) => (
    <div className={clsx('flex items-center gap-6', measure)} style={{ color: colour }}>
      <span className="h-px flex-1 bg-line" />
      {child}
      <span className="h-px flex-1 bg-line" />
    </div>
  )
  return (
    <div id={f.id} className={clsx(f.pad, f.className)} style={f.style}>
      <div className="shell">
        {style === 'arch' ? (
          ornament(
            <svg viewBox="0 0 24 30" className="h-7 w-6 shrink-0" aria-hidden>
              <path d="M1 29V12a11 11 0 0 1 22 0v17" fill="none" stroke="currentColor" strokeWidth="1.3" />
            </svg>,
          )
        ) : style === 'motif' ? (
          ornament(<ArtworkSvg slug={text(content, 'motif') || 'sprig'} className="h-12 w-12 shrink-0" weight={1.3} />)
        ) : style === 'asterism' ? (
          <p aria-hidden className="text-center text-[1.4rem] tracking-[0.6em]" style={{ color: colour }}>
            ⁂
          </p>
        ) : style === 'dots' ? (
          <div className="flex justify-center gap-3" style={{ color: colour }} aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-current" />
            ))}
          </div>
        ) : (
          <div className={measure}>
            <DrawRule />
          </div>
        )}
      </div>
    </div>
  )
}

function Spacer({ content, styles }: WidgetProps) {
  const f = frame(styles, { pad: '' })
  const size = text(content, 'size')
  const exact = typeof content.height === 'number' && content.height > 0 ? content.height : 0
  return (
    <div
      id={f.id}
      aria-hidden
      className={clsx(!exact && (size === 'sm' ? 'h-12' : size === 'lg' ? 'h-40' : 'h-24'), f.className)}
      style={exact ? { height: exact } : undefined}
    />
  )
}

/**
 * Widget type → component. The one place the two halves meet: shared/widgets.ts
 * describes what a widget *has*, and this says what draws it.
 */
const REGISTRY: Record<string, ComponentType<WidgetProps>> = {
  rich_text: RichTextBlock,
  heading_block: HeadingBlock,
  text_photos: TextPhotosBlock,
  buttons_row: ButtonsRow,
  list_block: ListBlock,
  columns_block: ColumnsBlock,
  embed_code: EmbedCode,

  home_hero: HomeHero,
  page_hero: PageHeroWidget,
  session_hero: SessionHero,
  guide_hero: GuideHero,

  marquee: Marquee,
  story: Story,
  text_block: TextBlock,
  about_intro: AboutIntro,
  numbered_cards: NumberedCards,
  checklist_split: ChecklistSplit,
  timeline_arc: TimelineArc,
  about_essays: AboutEssays,
  milestones: Milestones,
  aside_cta: AsideCta,
  cta_close: CtaClose,
  quote: Quote,
  faq: Faq,

  selected_work: SelectedWork,
  process: Process,
  photo_gallery: PhotoGallery,
  image_block: ImageBlock,
  image_text: ImageText,

  sessions_index: SessionsIndex,
  session_cards: SessionCards,
  always_included: AlwaysIncluded,
  session_links: SessionLinks,
  session_overview: SessionOverview,
  session_pricing: SessionPricing,
  session_guide: SessionGuide,
  session_albums: SessionAlbums,
  session_nav: SessionNav,

  investment: Investment,
  finishing_levels: FinishingLevels,
  weather_policy: WeatherPolicy,
  gallery_timeline: GalleryTimeline,

  portfolio_listing: PortfolioListing,

  guides_listing: GuidesListing,
  guide_letter: GuideLetter,
  guide_close: GuideClose,

  blog_listing: BlogListing,
  blog_grid: BlogGrid,

  inquiry_cta: InquiryCta,
  inquiry_form: InquiryFormWidget,

  testimonials: Testimonials,
  stats: Stats,
  cards: Cards,
  before_after: BeforeAfter,
  album_grid: AlbumGrid,
  video: Video,
  logos: Logos,
  cta_band: CtaBand,
  two_column: TwoColumn,
  map: MapEmbed,
  instagram: Instagram,
  author_card: AuthorCard,

  divider: Divider,
  spacer: Spacer,
}

export function getWidgetComponent(type: string): ComponentType<WidgetProps> | undefined {
  return REGISTRY[type]
}

export function renderSection(section: SectionData) {
  const Component = getWidgetComponent(section.type)
  if (!Component) {
    if (import.meta.env.DEV) console.warn(`No renderer for widget type "${section.type}" (section ${section.id})`)
    return null
  }
  return (
    <StyledSection key={section.id} styles={section.styles}>
      <Component content={section.content} styles={section.styles} data={section.data} />
    </StyledSection>
  )
}

/**
 * Renders a page's sections in order.
 *
 * A guide's chapters are the exception: a Chapter widget and the blocks after it
 * are gathered into one run and drawn together, with the chapter index above
 * them, because chapters are a structure across several sections rather than a
 * thing any one section can draw by itself.
 *
 * Hidden sections are dropped here rather than by the API, because the
 * dashboard's preview renders the same list and shows a hidden one dimmed.
 */
export function renderSections(sections: SectionData[] | undefined, opts: { showHidden?: boolean; guideSlug?: string } = {}) {
  if (!sections) return null
  const visible = sections.filter((s) => !s.hidden || opts.showHidden)
  const out: React.ReactNode[] = []

  for (let i = 0; i < visible.length; i++) {
    const section = visible[i]
    if (section.type === 'guide_chapter' || GUIDE_BLOCK_TYPES.has(section.type)) {
      const run: SectionData[] = []
      while (i < visible.length && (visible[i].type === 'guide_chapter' || GUIDE_BLOCK_TYPES.has(visible[i].type))) {
        run.push(visible[i])
        i++
      }
      i--
      out.push(<GuideChapters key={`chapters-${run[0].id}`} sections={run} guideSlug={opts.guideSlug ?? 'guide'} />)
      continue
    }
    out.push(renderSection(section))
  }
  return out
}

/** Widgets whose opening frame sits on a photograph, so the header goes light over it. */
export const PHOTO_OPENERS = new Set(['home_hero', 'page_hero', 'session_hero', 'guide_hero'])

/** The homepage index rail: every section with an anchor and a rail label, in order. */
export function railEntries(sections: SectionData[] | undefined) {
  return (sections ?? [])
    .filter((s) => !s.hidden)
    .map((s) => ({
      id: typeof s.styles.anchor === 'string' ? s.styles.anchor : '',
      label: typeof s.styles.rail_label === 'string' ? s.styles.rail_label : '',
    }))
    .filter((e) => e.id && e.label)
}

/** One section by itself, as the dashboard previews it. */
export function renderPreview(section: SectionData, guideSlug = 'guide') {
  if (section.type === 'guide_chapter' || GUIDE_BLOCK_TYPES.has(section.type)) {
    return <GuidePiecePreview key={section.id} section={section} guideSlug={guideSlug} />
  }
  return renderSection(section)
}
