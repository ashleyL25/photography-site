import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import Lenis from 'lenis'

/** `true` once the user has asked the OS to cut down on motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * The live Lenis instance, or null when smooth scrolling is disabled (reduced
 * motion, or a coarse pointer). Route changes need to reach it directly —
 * `window.scrollTo` alone leaves Lenis's internal position stale.
 */
let lenisInstance: Lenis | null = null

/** Jump to the top immediately, through Lenis when it is running. */
export function resetScroll() {
  if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true })
  else window.scrollTo(0, 0)
}

/** Scroll an element into view, through Lenis when it is running. */
export function scrollToElement(el: HTMLElement, offset = -8) {
  if (lenisInstance) lenisInstance.scrollTo(el, { offset })
  else el.scrollIntoView({ behavior: 'smooth' })
}

/**
 * Inertial smooth scrolling. Skipped entirely when the user prefers reduced
 * motion, and on coarse pointers where native momentum is already better.
 */
export function useSmoothScroll() {
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || matchMedia('(pointer: coarse)').matches) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
    })

    lenisInstance = lenis

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    // Same-page anchors only. Cross-page links like `/#sessions` are the
    // router's job and are handled by useHashScroll after navigation.
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest('a[href^="#"]')
      if (!anchor) return
      const id = anchor.getAttribute('href')!.slice(1)
      const target = document.getElementById(id)
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { offset: -8 })
      history.replaceState(null, '', `#${id}`)
    }
    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisInstance = null
    }
  }, [reduced])
}

/**
 * Number of masonry columns for the current breakpoint. Driven by matchMedia
 * rather than CSS so the column-balancing maths matches what is rendered.
 */
export function useColumnCount() {
  const read = () => {
    if (typeof matchMedia === 'undefined') return 3
    if (matchMedia('(min-width: 1024px)').matches) return 3
    if (matchMedia('(min-width: 640px)').matches) return 2
    return 1
  }

  const [count, setCount] = useState(read)

  useEffect(() => {
    const onResize = () => setCount(read())
    addEventListener('resize', onResize)
    return () => removeEventListener('resize', onResize)
  }, [])

  return count
}

/** Sets the document title and meta description for the current page. */
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title
    if (!description) return
    const tag = document.querySelector('meta[name="description"]')
    const previous = tag?.getAttribute('content')
    tag?.setAttribute('content', description)
    return () => {
      if (previous) tag?.setAttribute('content', previous)
    }
  }, [title, description])
}

export type Theme = 'light' | 'dark'

/**
 * Theme state, persisted to localStorage. The swap is wrapped in a View
 * Transition when supported so the palette wipes in from the toggle.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
  )

  const apply = useCallback((next: Theme) => {
    document.documentElement.classList.toggle('dark', next === 'dark')
    document.documentElement.classList.toggle('light', next === 'light')
    localStorage.setItem('ap-theme', next)
    setTheme(next)
  }, [])

  const toggle = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === 'dark' ? 'light' : 'dark'
      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { ready: Promise<void> }
      }

      if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        apply(next)
        return
      }

      const { x, y } = origin ?? { x: innerWidth - 64, y: 48 }
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

      doc.startViewTransition(() => apply(next)).ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: 620,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
      })
    },
    [apply, theme],
  )

  return { theme, toggle }
}

/**
 * Tracks which of `ids` is currently the dominant section, for the index rail.
 * Uses the section nearest the upper third of the viewport rather than raw
 * intersection ratio, which is far steadier across wildly different heights.
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => Boolean(n))

    const measure = () => {
      const anchor = innerHeight * 0.35
      let best = nodes[0]
      let bestDistance = Infinity
      for (const node of nodes) {
        const { top, bottom } = node.getBoundingClientRect()
        if (bottom < 0 || top > innerHeight) continue
        const distance = Math.abs(top - anchor)
        if (distance < bestDistance) {
          bestDistance = distance
          best = node
        }
      }
      if (best) setActive(best.id)
    }

    measure()
    addEventListener('scroll', measure, { passive: true })
    addEventListener('resize', measure)
    return () => {
      removeEventListener('scroll', measure)
      removeEventListener('resize', measure)
    }
  }, [ids])

  return active
}

/** `true` once the page has scrolled past `offset` pixels. */
export function useScrolled(offset = 24) {
  const [scrolled, setScrolled] = useState(false)
  useLayoutEffect(() => {
    const onScroll = () => setScrolled(scrollY > offset)
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [offset])
  return scrolled
}
