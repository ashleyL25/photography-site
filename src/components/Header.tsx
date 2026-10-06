import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { useScrolled } from '@/lib/hooks'
import { useOverPhoto } from '@/lib/chrome'
import { useSiteInfo, useThemeSettings } from '@/lib/site'
import { ThemeToggle } from './ThemeToggle'
import { Wordmark } from './Brand'

/**
 * The header is light-on-photo only where it actually sits on one — a hero or
 * an interior masthead, both scrimmed photographs. Each page reports whether it
 * opens on one (see lib/chrome); everywhere else the header uses the palette.
 */

/**
 * A nav item that keeps its own link and gains a panel of children.
 *
 * The parent stays a plain `Link`, which is the point: /sessions is a real page
 * and clicking the word still goes there. The panel is a shortcut for someone who
 * already knows they want Graduation, not a replacement for the index.
 *
 * Opens on pointer *and* on focus, so it is reachable by keyboard — tab onto
 * "Sessions" and the list appears, tab through it and it stays, tab past it or
 * press Escape and it closes. `onBlur` checks `relatedTarget` because focus
 * moving between two children would otherwise close the panel out from under
 * the one being focused.
 */
function NavDropdown({
  label,
  items,
  pathname,
  children,
}: {
  label: string
  items: { label: string; to: string }[]
  pathname: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  // A click through the panel navigates but leaves the pointer where it is, so
  // nothing would fire `onPointerLeave` and the panel would hang over the new
  // page until the mouse moved.
  useEffect(() => setOpen(false), [pathname])

  return (
    <div
      className="relative"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      {children}

      {/*
        Always mounted and hidden with CSS, rather than conditionally rendered
        inside an AnimatePresence like the mobile drawer below.

        The reason is the keyboard path. This panel opens on focus, and focus can
        only reach a link that is already in the tab order — a panel that mounts
        when it opens can never be opened by tabbing to what is inside it. Keeping
        it mounted makes "tab to Sessions, keep tabbing into the list" work
        without a roving-tabindex or a keydown handler simulating one.

        `pointer-events-none` is therefore part of the closed state rather than a
        consequence of unmounting: the panel sits over the page at all times and
        must not intercept clicks meant for what is beneath it.

        Deliberately not `aria-hidden` or `inert` when closed — unlike the mobile
        submenu, whose links are unreachable until its disclosure button is
        pressed. Here they are the way in, and hiding a focusable element from the
        accessibility tree is the contradiction screen readers report as an error.
      */}
      <div
        // The padding is the hover bridge. The header sits 1.5rem above its own
        // bottom edge when unscrolled, and a panel that started at the card's top
        // edge would leave a dead gap the pointer crosses — the panel closing
        // halfway to the thing it was opened to reach.
        className={clsx(
          'absolute left-1/2 top-full z-10 -translate-x-1/2 pt-5 transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)]',
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
        )}
      >
        {/* Its own palette rather than the header's. Over a photograph the bar is
            light-on-dark, and inheriting that would put beige text on the panel's
            own light background. */}
        <ul
          aria-label={label}
          className="min-w-[15rem] border border-line bg-canvas py-2 shadow-[0_24px_70px_-40px_rgb(0_0_0/0.55)]"
        >
          {items.map((child) => (
            <li key={child.to}>
              <Link
                to={child.to}
                aria-current={pathname === child.to ? 'page' : undefined}
                className={clsx(
                  'label block px-5 py-3 transition-colors duration-300',
                  pathname === child.to
                    ? 'text-accent'
                    : 'text-muted hover:bg-surface hover:text-ink',
                )}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Literal classes for the mobile-menu breakpoint, so Tailwind sees each one. */
const DESKTOP_NAV: Record<string, string> = { md: 'md:flex', lg: 'lg:flex', xl: 'xl:flex' }
const MOBILE_ONLY: Record<string, string> = { md: 'md:hidden', lg: 'lg:hidden', xl: 'xl:hidden' }

/** True while the page is moving down past the header, for "hide on scroll". */
function useScrollingDown(enabled: boolean) {
  const [down, setDown] = useState(false)
  useEffect(() => {
    if (!enabled) return setDown(false)
    let last = scrollY
    const onScroll = () => {
      const y = scrollY
      if (Math.abs(y - last) > 6) {
        setDown(y > last && y > 240)
        last = y
      }
    }
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [enabled])
  return down
}

const CTA_CLASS: Record<string, string> = {
  primary: 'cta cta-primary cta-sm',
  secondary: 'cta cta-secondary cta-sm',
  link: 'cta-link label border-b pb-2 transition-colors',
}

export function Header() {
  const { pathname } = useLocation()
  const scrolled = useScrolled(80)
  const site = useSiteInfo()
  const behaviour = useThemeSettings('header', 'behaviour')
  const logo = useThemeSettings('header', 'logo')
  const navTheme = useThemeSettings('header', 'nav')
  const ctaTheme = useThemeSettings('header', 'cta')
  const mobile = useThemeSettings('header', 'mobile')
  const modeTheme = useThemeSettings('colors', 'mode')
  const sticky = typeof behaviour.sticky === 'string' ? behaviour.sticky : 'always'
  const bp = typeof mobile.breakpoint === 'string' && mobile.breakpoint in DESKTOP_NAV ? mobile.breakpoint : 'lg'
  const indicator = typeof navTheme.indicator === 'string' ? navTheme.indicator : 'underline'
  const scrolledBg = behaviour.scrolled_bg === 'surface' ? 'bg-surface' : behaviour.scrolled_bg === 'glass' ? 'bg-canvas/75 backdrop-blur-xl' : 'bg-canvas backdrop-blur-xl'
  const photoBacked = useOverPhoto() && behaviour.over_photo !== false
  const NAV = site.nav
  const MOBILE_NAV = [...NAV, { label: 'Contact', to: '/contact', children: undefined }]
  const [open, setOpen] = useState(false)
  const hidden = useScrollingDown(sticky === 'hide')
  /** Which drawer item has its children showing — one at a time, or none. */
  const [expanded, setExpanded] = useState<string | null>(null)

  const over = !scrolled && photoBacked

  // Close the drawer whenever navigation happens.
  useEffect(() => setOpen(false), [pathname])

  // Collapse the submenu with it, so reopening the drawer is not left holding
  // whatever was expanded two pages ago.
  useEffect(() => {
    if (!open) setExpanded(null)
  }, [open])

  // Only touch the scroll lock while the drawer is actually open, so this does
  // not race the preloader's own lock on first paint.
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Section roots stay lit on their children — /sessions/seniors keeps
  // "Sessions" marked as the current page.
  const SECTION_ROOTS = ['/portfolio', '/sessions', '/guides', '/blog']

  const isActive = (to: string) =>
    to.startsWith('/#')
      ? false
      : SECTION_ROOTS.includes(to)
        ? pathname.startsWith(to)
        : pathname === to

  return (
    <>
      <header
        data-over={over}
        className={clsx(
          'group/head inset-x-0 top-0 z-70 transition-all duration-500 ease-[var(--ease-out-expo)]',
          sticky === 'none' ? 'absolute' : 'fixed',
          hidden && !open && '-translate-y-full',
          // The top padding carries the iOS status-bar inset on top of its own
          // spacing, so the bar's background and blur reach the physical top
          // edge rather than leaving a strip the page scrolls through.
          scrolled && sticky !== 'none'
            ? clsx(
                'border-b pt-[calc(1.25rem*var(--header-pad,1)+env(safe-area-inset-top))] pb-[calc(0.75rem*var(--header-pad,1))]',
                scrolledBg,
                behaviour.scrolled_border === false ? 'border-transparent' : 'border-line',
                behaviour.shadow === true && 'shadow-[0_12px_40px_-24px_rgb(0_0_0/0.45)]',
              )
            : 'border-b border-transparent pt-[calc(1.25rem*var(--header-pad,1)+env(safe-area-inset-top))] pb-[calc(1.5rem*var(--header-pad,1))]',
          over && 'text-beige [text-shadow:0_1px_18px_rgb(0_0_0/0.35)]',
        )}
      >
        <div className="shell flex items-center justify-between gap-6">
          <Link to="/" className="shrink-0" aria-label={`${site.name} — home`}>
            {logo.kind === 'image' && typeof logo.image === 'string' && logo.image ? (
              <span className="relative block" style={{ height: typeof logo.height === 'number' ? logo.height : 40 }}>
                <img
                  src={logo.image}
                  alt=""
                  className={clsx('h-full w-auto', typeof logo.image_dark === 'string' && logo.image_dark && 'dark:hidden group-data-[over=true]/head:hidden')}
                />
                {typeof logo.image_dark === 'string' && logo.image_dark && (
                  <img src={logo.image_dark} alt="" className="hidden h-full w-auto group-data-[over=true]/head:block dark:block" />
                )}
              </span>
            ) : logo.kind === 'text' ? (
              <span className="display block whitespace-nowrap" style={{ fontSize: typeof logo.height === 'number' ? logo.height * 0.7 : 28 }}>
                {site.name}
              </span>
            ) : (
              <Wordmark />
            )}
          </Link>

          <nav className={clsx('hidden items-center', DESKTOP_NAV[bp])} style={{ gap: 'var(--nav-gap, 2.25rem)' }} aria-label="Primary">
            {NAV.map((item) => {
              const link = (
                <Link
                  to={item.to}
                  aria-current={isActive(item.to) ? 'page' : undefined}
                  className={clsx(
                    'nav-link group relative py-2 transition-colors duration-300',
                    isActive(item.to)
                      ? 'text-accent group-data-[over=true]/head:text-champagne'
                      : 'text-muted hover:text-ink group-data-[over=true]/head:text-beige/75 group-data-[over=true]/head:hover:text-beige',
                  )}
                >
                  {item.label}
                  {indicator !== 'none' && (
                    <span
                      className={clsx(
                        'absolute bg-accent transition-transform duration-500 ease-[var(--ease-out-expo)] group-data-[over=true]/head:bg-champagne',
                        indicator === 'dot'
                          ? 'left-1/2 -bottom-1.5 size-1 -translate-x-1/2 rounded-full group-hover:scale-100'
                          : 'inset-x-0 -bottom-0.5 h-px origin-left group-hover:scale-x-100',
                        isActive(item.to) ? (indicator === 'dot' ? 'scale-100' : 'scale-x-100') : indicator === 'dot' ? 'scale-0' : 'scale-x-0',
                      )}
                    />
                  )}
                </Link>
              )

              const children = item.children
              if (!children?.length) return <span key={item.to}>{link}</span>

              return (
                <NavDropdown key={item.to} label={item.label} items={children} pathname={pathname}>
                  {link}
                </NavDropdown>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            {ctaTheme.show !== false && (
            <Link
              to={site.headerCta.href}
              className={clsx(CTA_CLASS[String(ctaTheme.style ?? 'primary')] ?? CTA_CLASS.primary, 'hidden group-data-[over=true]/head:border-beige/60 group-data-[over=true]/head:text-beige group-data-[over=true]/head:hover:border-champagne group-data-[over=true]/head:hover:bg-champagne group-data-[over=true]/head:hover:text-charcoal sm:inline-block')}
            >
              {site.headerCta.label}
            </Link>
            )}
            {modeTheme.toggle !== false && <ThemeToggle />}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className={clsx('grid size-10 place-items-center rounded-full border border-line text-ink group-data-[over=true]/head:border-beige/40 group-data-[over=true]/head:text-beige', MOBILE_ONLY[bp])}
            >
              <span className="relative block h-3 w-4">
                <motion.span
                  className="absolute inset-x-0 top-0 h-px bg-current"
                  animate={{ y: open ? 6 : 0, rotate: open ? 45 : 0 }}
                  transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                />
                <motion.span
                  className="absolute inset-x-0 bottom-0 h-px bg-current"
                  animate={{ y: open ? -6 : 0, rotate: open ? -45 : 0 }}
                  transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            // Wipes down out of the bar it belongs to, which is back at the top.
            // Centred by `m-auto` on the content below rather than by
            // `justify-center` here. Six items plus an expanded submenu overflows
            // a short phone, and a centred flex column that overflows clips its
            // top items somewhere unreachable — auto margins collapse instead of
            // overflowing, so the content centres when it fits and scrolls when
            // it does not.
            className={clsx('fixed inset-0 z-60 flex flex-col overflow-y-auto bg-canvas px-8 pt-[calc(5rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]', MOBILE_ONLY[bp])}
            {...(mobile.animation === 'fade'
              ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
              : mobile.animation === 'slide'
                ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
                : {
                    initial: { clipPath: 'inset(0% 0% 100% 0%)' },
                    animate: { clipPath: 'inset(0% 0% 0% 0%)' },
                    exit: { clipPath: 'inset(0% 0% 100% 0%)' },
                  })}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="m-auto w-full py-8">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {MOBILE_NAV.map((item, i) => {
                const children = item.children?.length ? item.children : undefined
                return (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="flex items-center border-b border-line">
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="display block flex-1 py-5 text-[calc(clamp(2.4rem,11vw,3.6rem)*var(--mnav-scale,1))] text-ink"
                      >
                        {mobile.numbers !== false && (
                          <span className="label mr-4 align-middle text-[0.55rem] text-faint">
                            0{i + 1}
                          </span>
                        )}
                        {item.label}
                      </Link>
                      {/* A separate control, not a tap on the word. Making the
                          label itself toggle would take /sessions away from a
                          phone entirely — the parent page is where the pricing
                          and the full descriptions are. */}
                      {children && (
                        <button
                          type="button"
                          onClick={() => setExpanded((v) => (v === item.to ? null : item.to))}
                          aria-expanded={expanded === item.to}
                          aria-label={`${expanded === item.to ? 'Hide' : 'Show'} ${item.label.toLowerCase()}`}
                          className="grid size-12 shrink-0 place-items-center text-muted"
                        >
                          <motion.span
                            aria-hidden
                            className="block text-lg leading-none"
                            animate={{ rotate: expanded === item.to ? 180 : 0 }}
                            transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                          >
                            ⌄
                          </motion.span>
                        </button>
                      )}
                    </div>

                    {/*
                      Collapsed with CSS rather than unmounted, to match the
                      desktop panel — `grid-template-rows: 0fr -> 1fr` animates to
                      an auto height without measuring anything.

                      `inert` is doing the real work. A collapsed list that stays
                      mounted keeps its six links in the tab order, so a keyboard
                      user would tab through a menu that is not open; `inert`
                      takes the subtree out of the tab order and the accessibility
                      tree without hiding it visually, so the collapse still
                      animates on the way out instead of blinking away.

                      Unlike the desktop panel, focus must NOT open this one —
                      the disclosure button beside the label is what opens it,
                      which is why these links are inert when closed and the
                      desktop ones are not.
                    */}
                    {children && (
                      <div
                        inert={expanded !== item.to}
                        className={clsx(
                          'grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out-expo)]',
                          expanded === item.to
                            ? 'grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] opacity-0',
                        )}
                      >
                        <ul className="overflow-hidden">
                          {children.map((child) => (
                            <li key={child.to}>
                              <Link
                                to={child.to}
                                onClick={() => setOpen(false)}
                                className="label block border-b border-line/60 py-4 pl-10 text-muted"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </nav>
            <motion.p
              className="label mt-12 text-faint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {site.serves}
            </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
