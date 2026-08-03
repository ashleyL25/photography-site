import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { NAV, SITE } from '@/data/site'
import { useScrolled } from '@/lib/hooks'
import { ThemeToggle } from './ThemeToggle'
import { Wordmark } from './Brand'

/**
 * The header is light-on-photo only where it actually sits on one — the
 * homepage hero and the interior page mastheads, both of which are scrimmed
 * images. Everywhere else it uses the palette.
 */
const PHOTO_BACKED = (pathname: string) =>
  pathname === '/' ||
  pathname === '/about' ||
  pathname === '/contact' ||
  pathname.startsWith('/sessions') ||
  pathname.startsWith('/guides') ||
  pathname.startsWith('/portfolio')

export function Header() {
  const { pathname } = useLocation()
  const scrolled = useScrolled(80)
  const [open, setOpen] = useState(false)

  const over = !scrolled && PHOTO_BACKED(pathname)

  // Close the drawer whenever navigation happens.
  useEffect(() => setOpen(false), [pathname])

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
          scrolled
            ? 'border-b border-line bg-canvas/85 py-3 backdrop-blur-xl'
            : 'border-b border-transparent py-6',
          over && 'text-beige [text-shadow:0_1px_18px_rgb(0_0_0/0.35)]',
        )}
      >
        <div className="shell flex items-center justify-between gap-6">
          <Link to="/" className="shrink-0" aria-label={`${SITE.name} — home`}>
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.to}
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
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="label hidden rounded-full border border-ink px-6 py-3 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas group-data-[over=true]/head:border-beige/60 group-data-[over=true]/head:text-beige group-data-[over=true]/head:hover:border-champagne group-data-[over=true]/head:hover:bg-champagne group-data-[over=true]/head:hover:text-charcoal sm:inline-block"
            >
              Enquire
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
            className="fixed inset-0 z-60 flex flex-col justify-center bg-canvas px-8 lg:hidden"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {[...NAV, { label: 'Contact', to: '/contact' }].map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="display block border-b border-line py-5 text-[clamp(2.4rem,11vw,3.6rem)] text-ink"
                  >
                    <span className="label mr-4 align-middle text-[0.55rem] text-faint">
                      0{i + 1}
                    </span>
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.p
              className="label mt-12 text-faint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {SITE.serves}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
