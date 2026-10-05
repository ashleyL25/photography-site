import { useMemo, useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import clsx from 'clsx'
import { artworkMarkup, decorDensity, getDecorPreset, isArtwork, textureImage, type DecorItem } from '@shared/artwork'
import { swatchCss } from '@shared/palette'
import { useSite } from '@/lib/site'
import { useReducedMotion } from '@/lib/hooks'
import { Photo } from './Photo'

/**
 * The decorative layers the Style tab can add behind or in front of a
 * section: floating elements, a background motif, a texture and particles.
 *
 * All of it is `pointer-events: none` and `aria-hidden` — decoration never
 * catches a click or reaches a screen reader — and all of it holds still for a
 * visitor who has asked for reduced motion.
 */

const g = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

/** One of the line drawings, at a fixed line weight however large it is drawn. */
export function ArtworkSvg({ slug, className, weight = 1.4, colour = 'currentColor' }: { slug: string; className?: string; weight?: number; colour?: string }) {
  const markup = artworkMarkup(slug)
  if (!markup) return null
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke={colour}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: markup.replace(/<(path|circle|rect)/g, '<$1 vector-effect="non-scaling-stroke"') }}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Floating elements
 * ------------------------------------------------------------------ */

type Placed = DecorItem & { print: boolean }

export function FloatingElements({ config }: { config: Record<string, unknown> }) {
  const { sessions } = useSite()
  const preset = typeof config.preset === 'string' ? config.preset : 'none'

  const items = useMemo<Placed[]>(() => {
    const chosen = Array.isArray(config.items) ? (config.items as Record<string, unknown>[]).filter((i) => typeof i.src === 'string' && i.src) : []
    // Hand-placed elements replace the arrangement entirely: the moment
    // somebody composes a section themselves, nothing else should appear in it.
    if (chosen.length) {
      return chosen.map((i) => ({
        src: String(i.src),
        x: num(i.x, 50),
        y: num(i.y, 50),
        size: num(i.size, 180),
        speed: num(i.speed, 1),
        rotate: num(i.rotate, 0),
        opacity: num(i.opacity, 100) / 100,
        flip: i.flip === true,
        desktopOnly: i.desktopOnly === true,
        print: i.print !== false,
      }))
    }
    return decorDensity(getDecorPreset(preset)?.items ?? [], String(config.density ?? 'balanced')).map((i) => ({ ...i, print: true }))
  }, [config.items, config.density, preset])

  if (preset === 'none' || items.length === 0) return null

  const strength = num(config.opacity, 70) / 100
  const colour = swatchCss(String(config.swatch ?? 'accent'))

  return (
    <div
      aria-hidden
      className={clsx(
        // Gone below lg: a phone has no margin, so anything here would sit on the words.
        'pointer-events-none absolute inset-0 hidden overflow-hidden lg:block',
        config.layer === 'front' ? 'z-[2]' : 'z-0',
      )}
    >
      {items.map((item, i) => {
        const src = item.src.startsWith('print:') ? (sessions[Number(item.src.slice(6)) - 1]?.photo ?? '') : item.src
        if (!src) return null
        return <FloatingElement key={`${item.src}-${i}`} item={item} src={src} colour={colour} strength={strength} />
      })}
    </div>
  )
}

function FloatingElement({ item, src, colour, strength }: { item: Placed; src: string; colour: string; strength: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  // Drift measured against the viewport, so an object near the top of a tall
  // section still gets its full travel. Different speeds read as depth.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const travel = item.speed * 70
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [travel, -travel]), { stiffness: 70, damping: 24, mass: 0.6 })
  const drawing = isArtwork(src)
  const opacity = (item.opacity ?? 1) * strength

  return (
    <div
      ref={ref}
      className={clsx('absolute', item.desktopOnly && 'hidden xl:block')}
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `clamp(${Math.round(item.size * 0.45)}px, ${item.size / 14}vw, ${item.size}px)`,
        transform: `translate(-50%, -50%)${item.flip ? ' scaleX(-1)' : ''}`,
      }}
    >
      <motion.div
        style={{ y: reduced ? 0 : y, rotate: item.rotate ?? 0 }}
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity, scale: 1 }}
        viewport={{ once: true, margin: '0px 0px -8% 0px' }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {drawing ? (
          <ArtworkSvg slug={src} className="w-full" colour={colour} weight={1.4} />
        ) : item.print ? (
          <div className="bg-[#fbf8f4] p-[6%] pb-[18%] shadow-[0_18px_40px_-18px_rgb(0_0_0/0.45)]">
            <Photo src={src} alt="" sizes={`${item.size}px`} className="aspect-[4/5] w-full" />
          </div>
        ) : (
          <Photo src={src} alt="" sizes={`${item.size}px`} className="w-full" />
        )}
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Background motif
 * ------------------------------------------------------------------ */

const PLACE: Record<string, string> = {
  right: 'top-1/2 right-[-6%] -translate-y-1/2',
  left: 'top-1/2 left-[-6%] -translate-y-1/2',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  'top-right': 'top-[-4%] right-[2%]',
  'bottom-left': 'bottom-[-4%] left-[2%]',
}

export function Watermark({ config }: { config: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const motif = typeof config.motif === 'string' ? config.motif : ''
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useSpring(useTransform(scrollYProgress, [0, 1], ['8%', '-8%']), { stiffness: 60, damping: 26 })
  const markup = artworkMarkup(motif)
  if (!markup) return null

  const size = num(config.size, 460)
  const drift = config.drift !== false && !reduced

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <motion.div
        className={clsx('absolute', PLACE[String(config.position)] ?? PLACE.right)}
        style={{
          y: drift ? y : 0,
          width: `clamp(${Math.round(size * 0.5)}px, ${size / 12}vw, ${size}px)`,
          opacity: num(config.opacity, 10) / 100,
          color: swatchCss(String(config.swatch ?? 'accent')),
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full"
          fill="none"
          stroke="currentColor"
          strokeWidth={num(config.weight, 1.2)}
          strokeLinecap="round"
          strokeLinejoin="round"
          // A fixed line weight however large the drawing is set.
          style={{ vectorEffect: 'non-scaling-stroke' }}
          dangerouslySetInnerHTML={{
            __html: markup.replace(/<(path|circle|rect)/g, '<$1 vector-effect="non-scaling-stroke"'),
          }}
        />
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Texture
 * ------------------------------------------------------------------ */

export function Texture({ value, strength }: { value: string; strength: number }) {
  const image = textureImage(value)
  if (!image) return null
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 mix-blend-overlay"
      style={{ backgroundImage: image, opacity: strength / 100 }}
    />
  )
}

/* ------------------------------------------------------------------ *
 * Particles
 * ------------------------------------------------------------------ */

/**
 * Dust, bokeh or sparkle. CSS keyframes rather than a canvas, so nothing runs
 * on the main thread after the first paint; positions are seeded so the field
 * does not reshuffle on every re-render while somebody types in the editor.
 */
export function Particles({ config, seed }: { config: Record<string, unknown>; seed: string }) {
  const style = typeof config.style === 'string' ? config.style : 'none'
  const count = Math.min(num(config.count, 30), 80)
  const from = num(config.from, 40)
  const speed = Math.max(num(config.speed, 100), 10)
  const colour = swatchCss(String(config.swatch ?? 'champagne'))

  const motes = useMemo(() => {
    if (style === 'none') return []
    let state = 0
    for (let i = 0; i < seed.length; i++) state = (state * 31 + seed.charCodeAt(i)) | 0
    const random = () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff
      return state / 0x7fffffff
    }
    const factor = 100 / speed
    return Array.from({ length: count }, () => ({
      left: random() * 100,
      top: from + random() * (100 - from),
      duration: (style === 'bokeh' ? 10 + random() * 14 : style === 'sparkle' ? 2 + random() * 3 : 4 + random() * 8) * factor,
      delay: random() * 6,
      scale: 0.6 + random() * 1.1,
      peak: 0.35 + random() * 0.45,
    }))
  }, [style, count, from, speed, seed])

  if (motes.length === 0) return null
  const base = style === 'bokeh' ? 34 : style === 'sparkle' ? 3 : 2.4

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {motes.map((m, i) => (
        <span
          key={i}
          className={clsx('particle', `particle-${style}`)}
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            width: `${base * m.scale}px`,
            height: `${base * m.scale}px`,
            background: style === 'bokeh' ? `radial-gradient(circle, ${colour} 0%, transparent 70%)` : colour,
            boxShadow: style === 'bokeh' ? undefined : `0 0 ${base * 2.5}px ${colour}`,
            animationDuration: `${m.duration}s`,
            animationDelay: `${m.delay}s`,
            ['--particle-peak' as string]: m.peak,
          }}
        />
      ))}
    </div>
  )
}

export function decorationsOf(styles: Record<string, unknown>) {
  const bg = g(styles.background)
  const decor = g(styles.decor)
  const particles = g(styles.particles)
  const watermark = g(styles.watermark)
  return {
    texture: typeof bg.texture === 'string' && bg.texture ? bg.texture : '',
    textureStrength: num(bg.texture_opacity, 30),
    decor: typeof decor.preset === 'string' && decor.preset !== 'none' ? decor : null,
    particles: typeof particles.style === 'string' && particles.style !== 'none' ? particles : null,
    watermark: typeof watermark.motif === 'string' && watermark.motif ? watermark : null,
  }
}
