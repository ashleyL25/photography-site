import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { NAV, NAV_CHILDREN, SITE } from '@/data/site'
import { useScrolled } from '@/lib/hooks'
import { ThemeToggle } from './ThemeToggle'
import { Wordmark } from './Brand'

const MOBILE_NAV = [...NAV, { label: 'Contact', to: '/contact' }]

/**
 * The header is light-on-photo only where it actually sits on one — the
 * homepage hero and the interior page mastheads, both of which are scrimmed
 * images. Everywhere else it uses the palette.
 */
const PHOTO_BACKED = (pathname: string) =>
  pathname === '/' ||
  pathname === '/about' ||
  pathname === '/contact' ||
  pathname === '/experience' ||
  pathname.startsWith('/sessions') ||
  pathname.startsWith('/guides') ||
  pathname.startsWith('/portfolio')

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
      <AnimatePresence>
        {open && (
          <motion.div
            // The padding is the hover bridge. The header sits 1.5rem above its
            // own bottom edge when unscrolled, and a panel that started at the
            // card's top edge would leave a dead gap the pointer crosses — the
            // panel closing halfway to the thing it was opened to reach.
            className="absolute left-1/2 top-full z-10 -translate-x-1/2 pt-5"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Its own palette rather than the header's. Over a photograph the
                bar is light-on-dark, and inheriting that would put beige text on
                the panel's own light background. */}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Header() {
  const { pathname } = useLocation()
  const scrolled = useScrolled(80)
  const [open, setOpen] = useState(false)
  /** Which drawer item has its children showing — one at a time, or none. */
  const [expanded, setExpanded] = useState<string | null>(null)

  const over = !scrolled && PHOTO_BACKED(pathname)

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
  const SECTION_ROOTS = ['/portfolio', '/sessions', '/guides']

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
          'group/head fixed inset-x-0 top-0 z-70 transition-all duration-500 ease-[var(--ease-out-expo)]',
          // The top padding carries the iOS status-bar inset on top of its own
          // spacing, so the bar's background and blur reach the physical top
          // edge rather than leaving a strip the page scrolls through.
          scrolled
            ? 'border-b border-line bg-canvas pt-[calc(1.25rem+env(safe-area-inset-top))] pb-3 backdrop-blur-xl'
            : 'border-b border-transparent pt-[calc(1.25rem+env(safe-area-inset-top))] pb-6',
          over && 'text-beige [text-shadow:0_1px_18px_rgb(0_0_0/0.35)]',
        )}
      >
        <div className="shell flex items-center justify-between gap-6">
          <Link to="/" className="shrink-0" aria-label={`${SITE.name} — home`}>
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const link = (
                <Link
                  to={item.to}
                  aria-current={isActive(item.to) ? 'page' : undefined}
                  className={clsx(
                    'label group relative py-2 transition-colors duration-300',
                    isActive(item.to)
                      ? 'text-accent group-data-[over=true]/head:text-champagne'
                      : 'text-muted hover:text-ink group-data-[over=true]/head:text-beige/75 group-data-[over=true]/head:hover:text-beige',
                  )}
                >
                  {item.label}
                  <span
                    className={clsx(
                      'absolute inset-x-0 -bottom-0.5 h-px origin-left bg-accent transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100 group-data-[over=true]/head:bg-champagne',
                      isActive(item.to) ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </Link>
              )

              const children = NAV_CHILDREN[item.to]
              if (!children) return <span key={item.to}>{link}</span>

              return (
                <NavDropdown key={item.to} label={item.label} items={children} pathname={pathname}>
                  {link}
                </NavDropdown>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="label hidden rounded-full border border-ink px-6 py-3 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas group-data-[over=true]/head:border-beige/60 group-data-[over=true]/head:text-beige group-data-[over=true]/head:hover:border-champagne group-data-[over=true]/head:hover:bg-champagne group-data-[over=true]/head:hover:text-charcoal sm:inline-block"
            >
              Inquire
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="grid size-10 place-items-center rounded-full border border-line text-ink group-data-[over=true]/head:border-beige/40 group-data-[over=true]/head:text-beige lg:hidden"
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
            className="fixed inset-0 z-60 flex flex-col overflow-y-auto bg-canvas px-8 pt-[calc(5rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] lg:hidden"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="m-auto w-full py-8">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {MOBILE_NAV.map((item, i) => {
                const children = NAV_CHILDREN[item.to]
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
                        className="display block flex-1 py-5 text-[clamp(2.4rem,11vw,3.6rem)] text-ink"
                      >
                        <span className="label mr-4 align-middle text-[0.55rem] text-faint">
                          0{i + 1}
                        </span>
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

                    <AnimatePresence initial={false}>
                      {children && expanded === item.to && (
                        <motion.ul
                          className="overflow-hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        >
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
                        </motion.ul>
                      )}
                    </AnimatePresence>
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
              {SITE.serves}
            </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
