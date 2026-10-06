import { useRef, useState } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'motion/react'
import { Photo } from '@/components/Photo'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/motion'
import { useReducedMotion } from '@/lib/hooks'
import { useSiteInfo } from '@/lib/site'
import clsx from 'clsx'
import { Buttons, type ButtonValue } from './links'
import { NeedsSession, useSourceSession } from './sessions'
import { bool, fill, frame, list, text, useHost, type WidgetProps } from './types'

const INTRO_DELAY = 1.15

/** Letters rise out of a clipped line box, staggered left to right. */
function Letters({ text: value, className, delay }: { text: string; className?: string; delay: number }) {
  return (
    <span className={className} aria-label={value}>
      {value.split('').map((char, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className="inline-block will-change-transform"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ delay: delay + i * 0.055, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/**
 * The homepage opening: a full-screen plate that draws itself in and grows an
 * arch as the page moves, turning the opening frame into a hung print.
 */
export function HomeHero({ content, styles }: WidgetProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const site = useSiteInfo()
  const f = frame(styles, { id: 'hero', pad: '' })

  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] })

  const sideInset = useTransform(scrollYProgress, [0, 1], ['0%', '11%'])
  const topInset = useTransform(scrollYProgress, [0, 1], ['0%', '4%'])
  // Held under half the inset plate's width. Past that the browser scales every
  // radius down to fit, by a factor that itself moves with the insets, so on a
  // phone the corners snapped to a dome partway down and then drifted.
  const archPx = useTransform(scrollYProgress, [0, 1], [0, 320])
  const arch = useMotionTemplate`min(${archPx}px, 38vw)`
  const foot = useTransform(scrollYProgress, [0, 1], ['0px', '6px'])
  const clipPath = useMotionTemplate`inset(${topInset} ${sideInset} ${topInset} ${sideInset} round ${arch} ${arch} ${foot} ${foot})`

  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-38%'])
  // Clear the type early — a half-faded wordmark lying over someone's face
  // reads as a rendering fault, not a transition.
  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const scrim = useTransform(scrollYProgress, [0, 1], [0.42, 0.12])

  return (
    <div ref={wrap} id={f.id} className={`relative h-[168svh] ${f.className}`}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div className="absolute inset-0" style={reduced ? undefined : { clipPath, willChange: 'clip-path' }}>
          <Photo
            src={text(content, 'image')}
            alt={text(content, 'alt')}
            sizes="100vw"
            priority
            className="h-full w-full"
            imgClassName={reduced ? undefined : 'ken-burns'}
          />
          <motion.div className="absolute inset-0" style={{ opacity: reduced ? 0.45 : scrim }} aria-hidden>
            <div className="absolute inset-0 bg-[rgb(var(--scrim))]" />
          </motion.div>
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--scrim)/0.55)] via-transparent to-[rgb(var(--scrim)/0.75)]"
          />
        </motion.div>

        {/* The hero always sits on a photograph, so its text is fixed light
            rather than themed — contrast has to hold in both palettes. */}
        <motion.div
          className="shell relative z-10 flex h-full flex-col justify-between py-24 text-beige md:py-28"
          style={reduced ? undefined : { y: textY, opacity: textOpacity }}
        >
          <motion.p
            className="label self-center text-beige/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: INTRO_DELAY + 0.7, duration: 1.2 }}
          >
            {text(content, 'eyebrow')}
          </motion.p>

          {/* Dropped below the optical center so the wordmark crosses the
              couple's torsos rather than their faces. */}
          <div className="flex translate-y-[9vh] flex-col items-center text-center">
            <h1 className="display flex flex-col items-center">
              <Letters
                text={text(content, 'lead')}
                delay={INTRO_DELAY}
                className="block text-[clamp(4.5rem,20vw,17rem)] leading-[0.86] tracking-[0.02em]"
              />
              <span className="mt-6 flex w-full items-center gap-5 md:mt-8 md:gap-8">
                <motion.span
                  className="h-px flex-1 origin-right bg-beige/35"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: INTRO_DELAY + 0.5, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
                <Letters
                  text={text(content, 'script')}
                  delay={INTRO_DELAY + 0.32}
                  className="label shrink-0 text-[clamp(0.6rem,1.5vw,0.95rem)] tracking-[0.55em] text-beige/90"
                />
                <motion.span
                  className="h-px flex-1 origin-left bg-beige/35"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: INTRO_DELAY + 0.5, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
            </h1>
          </div>

          <div className="flex flex-col items-center gap-8 md:flex-row md:items-end md:justify-between">
            <motion.p
              className="max-w-sm text-center text-[0.95rem] leading-relaxed text-beige/80 md:text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: INTRO_DELAY + 0.9, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {text(content, 'sub')}
            </motion.p>

            <motion.a
              href={text(content, 'scroll_target') || '#about'}
              className="group flex items-center gap-4 text-beige"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: INTRO_DELAY + 1.1, duration: 1.1 }}
            >
              <span className="label text-beige/70 transition-colors group-hover:text-beige">
                {text(content, 'scroll_label')}
              </span>
              <span className="relative block h-12 w-px overflow-hidden bg-beige/30">
                <motion.span
                  className="absolute inset-x-0 top-0 block h-4 bg-beige"
                  animate={{ y: [-16, 48] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: [0.76, 0, 0.24, 1] }}
                />
              </span>
            </motion.a>
          </div>
        </motion.div>

        <span className="sr-only">
          {site.name} — {site.tagline}
        </span>
      </div>
    </div>
  )
}

/** Compact masthead for interior pages. */
export function PageHeroWidget({ content, styles }: WidgetProps) {
  const f = frame(styles, { pad: '' })
  return (
    <PageHero
      id={f.id}
      className={f.className}
      eyebrow={text(content, 'eyebrow')}
      heading={text(content, 'heading')}
      body={text(content, 'body') || undefined}
      rich
      image={text(content, 'image')}
      height={text(content, 'height') || 'auto'}
      align={text(content, 'align') || 'left'}
      vertical={text(content, 'vertical') || 'bottom'}
      overlay={typeof content.overlay === 'number' ? content.overlay : 68}
      focus={FOCUS[text(content, 'focal')]}
      slowZoom={bool(content, 'slow_zoom')}
      scrollCue={bool(content, 'scroll_cue')}
      after={
        list<ButtonValue>(content, 'buttons').length > 0 ? (
          <Reveal delay={0.25}>
            <Buttons
              buttons={list<ButtonValue>(content, 'buttons')}
              className={clsx('mt-10 [&_a]:border-beige/70 [&_a]:text-beige', text(content, 'align') === 'center' && 'justify-center')}
            />
          </Reveal>
        ) : undefined
      }
    />
  )
}

const FOCUS: Record<string, string | undefined> = { top: 'center 20%', bottom: 'center 80%', left: '20% center', right: '80% center' }

/** A session's masthead, filled in from the session itself. */
export function SessionHero({ content, styles }: WidgetProps) {
  const session = useSourceSession(content)
  const f = frame(styles, { pad: '' })
  if (!session) return <NeedsSession label="Session masthead" />

  return (
    <PageHero
      id={f.id}
      className={f.className}
      eyebrow={fill(text(content, 'eyebrow'), { index: session.index })}
      heading={session.title}
      body={session.blurb}
      image={session.heroPhoto}
    >
      <Reveal delay={0.25} className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
        <span className="label text-champagne">{session.fromPrice}</span>
        <span aria-hidden className="hidden h-px w-10 bg-beige/30 sm:block" />
        <span className="label leading-[1.6] text-beige/70">{session.runs}</span>
      </Reveal>
    </PageHero>
  )
}

/** Copies the current URL, which is how Ashley actually sends these out. */
function ShareRow({ copyLabel, printLabel }: { copyLabel: string; printLabel: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      /* Clipboard blocked — the address bar still works. */
    }
  }

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        type="button"
        onClick={copy}
        className="label rounded-full border border-beige/50 px-6 py-3 text-beige transition-colors duration-400 hover:border-champagne hover:bg-champagne hover:text-charcoal"
      >
        {copied ? 'Link copied' : copyLabel}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="label rounded-full border border-beige/30 px-6 py-3 text-beige/75 transition-colors duration-400 hover:border-champagne hover:text-champagne"
      >
        {printLabel}
      </button>
    </div>
  )
}

/** A guide's masthead, with the share row a client uses to send it on. */
export function GuideHero({ content, styles }: WidgetProps) {
  const host = useHost()
  const f = frame(styles, { pad: '' })
  if (host.kind !== 'guide') return null
  const { guide } = host
  const d = guide.details

  return (
    <PageHero
      id={f.id}
      className={f.className}
      eyebrow={typeof d.eyebrow === 'string' ? d.eyebrow : ''}
      heading={guide.title}
      body={typeof d.subtitle === 'string' ? d.subtitle : undefined}
      image={typeof d.photo === 'string' ? d.photo : ''}
    >
      <div className="mt-12">
        <ShareRow
          copyLabel={text(content, 'copy_label') || 'Copy link'}
          printLabel={fill(text(content, 'print_label') || 'Print', { title: guide.title.toLowerCase() })}
        />
      </div>
    </PageHero>
  )
}
