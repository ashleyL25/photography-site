import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { Header } from './Header'
import { Footer } from './Footer'
import { IndexRail, SocialRail } from './Rails'
import { Preloader } from './Preloader'
import { resetScroll, scrollToElement, useSmoothScroll } from '@/lib/hooks'

/**
 * Restores scroll position on navigation, and honors a `/#section` hash by
 * scrolling to it once the destination page has rendered.
 *
 * `useLocation` here is the *deferred* location published by `<Routes location>`
 * (see PageTransition), so this fires the moment the page swaps behind the
 * curtain rather than while the outgoing page is still on screen.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  const first = useRef(true)

  useEffect(() => {
    if (!hash) {
      // Skip the very first render so a deep link or a browser restore is
      // not stomped on the way in.
      if (first.current) {
        first.current = false
        return
      }
      resetScroll()
      return
    }

    first.current = false

    // Two things have to be true before this can work, and neither is true on
    // the frame after navigation:
    //
    //  1. The target must exist. Interior pages are lazy, so on a direct hit of
    //     /sessions#pets the Suspense fallback is still mounted.
    //  2. The body must be scrollable. The preloader locks it for the first
    //     second; scrolling into that lock silently clamps part-way and the
    //     animation finishes against a wall.
    //
    // So: retry until both hold, then confirm we actually arrived.
    let frame = 0
    let verify: ReturnType<typeof setTimeout> | undefined
    const deadline = performance.now() + 4000

    const attempt = () => {
      const locked = document.body.style.overflow === 'hidden'
      const target = document.getElementById(hash.slice(1))

      if (target && !locked) {
        scrollToElement(target)
        verify = setTimeout(() => {
          const now = document.getElementById(hash.slice(1))
          if (now && Math.abs(now.getBoundingClientRect().top) > 120) scrollToElement(now)
        }, 900)
        return
      }

      if (performance.now() < deadline) frame = requestAnimationFrame(attempt)
    }

    frame = requestAnimationFrame(attempt)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(verify)
    }
  }, [pathname, hash])

  return null
}

export function Layout() {
  const { pathname } = useLocation()
  useSmoothScroll()

  return (
    // `reducedMotion="user"` makes every motion component drop its transform
    // animations when the OS asks for reduced motion — the CSS override alone
    // cannot reach JS-driven animations.
    <MotionConfig reducedMotion="user">
      <div className="grain relative flex min-h-screen flex-col">
        <Preloader />
        <ScrollManager />

        <a
          href="#main"
          className="label sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-accent focus:px-6 focus:py-3 focus:text-canvas"
        >
          Skip to content
        </a>

        <Header />
        {/* The index rail tracks homepage sections, so it only belongs there. */}
        {pathname === '/' && <IndexRail />}
        <SocialRail />

        {/* Keyed on the pathname so a page is torn down and rebuilt rather than
            reconciled. Without it, navigating between two of the same kind of
            page — guide to guide, session to session — leaves every scroll
            reveal already spent, and the masked headings never appear. The
            curtain covers the remount. */}
        <main id="main" key={pathname} className="flex-1">
          <Outlet />
        </main>

        <Footer />
      </div>
    </MotionConfig>
  )
}
