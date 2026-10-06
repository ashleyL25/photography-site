import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { Monogram, Wordmark } from './ui/Brand'
import { useEscape, useScrollLock } from '@/admin/hooks'
import { useAdminAuth } from './AdminAuth'
import { AppearanceToggle, useAppearance } from './ui/appearance'

/**
 * The dashboard chrome.
 *
 * Structured the way WordPress is: a persistent left rail of sections, a
 * working area on the right. Set in Inter on the photography palette — a tool
 * that reads easily, wearing the brand's colors so it still feels like the same
 * place as the site.
 */

interface NavGroup {
  label: string
  items: { to: string; label: string; end?: boolean; ownerOnly?: boolean }[]
}

const NAV: NavGroup[] = [
  {
    label: 'Site',
    items: [
      { to: '/dashboard', label: 'Overview', end: true },
      { to: '/dashboard/pages', label: 'Pages' },
    ],
  },
  {
    label: 'Photography',
    items: [
      { to: '/dashboard/sessions', label: 'Sessions' },
      { to: '/dashboard/albums', label: 'Albums' },
      { to: '/dashboard/albums/categories', label: 'Portfolio categories' },
      { to: '/dashboard/guides', label: 'Guides' },
    ],
  },
  {
    label: 'Journal',
    items: [
      { to: '/dashboard/blog', label: 'Blog posts' },
      { to: '/dashboard/blog/taxonomy', label: 'Categories & tags' },
    ],
  },
  {
    label: 'Library',
    items: [
      { to: '/dashboard/media', label: 'Media' },
      { to: '/dashboard/inquiries', label: 'Inquiries' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/dashboard/theme/colors', label: 'Theme' },
      { to: '/dashboard/settings/site', label: 'Site & menu' },
      { to: '/dashboard/settings/pricing', label: 'Pricing' },
      { to: '/dashboard/settings/policy', label: 'Policies' },
      { to: '/dashboard/settings/library', label: 'Recommendations' },
      { to: '/dashboard/settings/inquiry', label: 'Inquiry form' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dashboard/account', label: 'Your account' },
      { to: '/dashboard/users', label: 'People', ownerOnly: true },
    ],
  },
]

/**
 * Whether the desktop rail is closed, remembered across navigations and reloads.
 *
 * `localStorage` can throw outright rather than return null — Safari in private
 * browsing, a browser with site data switched off — and a dashboard that refuses
 * to render because it could not recall a cosmetic preference would be a poor
 * trade. Both directions fall back to the default in silence.
 */
const RAIL_KEY = 'ap_dashboard_rail_closed'

function readRailClosed(): boolean {
  try {
    return localStorage.getItem(RAIL_KEY) === '1'
  } catch {
    return false
  }
}

export default function AdminLayout() {
  const { user, signOut, isOwner } = useAdminAuth()
  const { appearance } = useAppearance()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [railClosed, setRailClosed] = useState(readRailClosed)

  // The drawer exists to navigate, so it closes itself once that has happened
  // rather than leaving the panel over the page just arrived at.
  useEffect(() => setOpen(false), [location.pathname])
  useScrollLock(open)
  useEscape(() => setOpen(false), open)

  useEffect(() => {
    try {
      localStorage.setItem(RAIL_KEY, railClosed ? '1' : '0')
    } catch {
      // The rail still works; it just will not be remembered next time.
    }
  }, [railClosed])

  async function onSignOut() {
    await signOut()
    navigate('/dashboard/login', { replace: true })
  }

  const visible = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.ownerOnly || isOwner),
  })).filter((group) => group.items.length > 0)

  const current = visible
    .flatMap((g) => g.items)
    .filter((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))
    // The longest matching path wins, so /dashboard/blog/taxonomy does not
    // report itself as "Blog posts".
    .sort((a, b) => b.to.length - a.to.length)[0]

  return (
    <div
      data-appearance={appearance}
      className="admin-ui relative flex min-h-dvh flex-col bg-canvas md:flex-row"
    >
      {/* The phone bar. Slim: where you are, and the way to everywhere else. */}
      <header className="sticky top-0 z-50 flex items-center gap-4 border-b border-line bg-surface/94 px-5 py-3 backdrop-blur-lg md:hidden">
        <Wordmark sub={current?.label ?? 'Dashboard'} />
        <div className="ml-auto">
          <AppearanceToggle compact />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-label="Open menu"
          className="grid size-11 shrink-0 place-items-center text-muted transition-colors active:text-gilt"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
            <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        groups={visible}
        user={user}
        onSignOut={onSignOut}
      />

      {/**
       * The desktop rail, which slides closed.
       *
       * A laptop running the section editor is already showing three columns —
       * this rail, the section panel and the preview — and the preview is the one
       * being judged. Closing the rail hands it 200px without anything having to
       * float above the work or overlap it, and what is left is wide enough to
       * keep the way back always on screen.
       */}
      <aside
        className={clsx(
          'hidden shrink-0 flex-col overflow-hidden border-line bg-surface transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none md:sticky md:top-0 md:flex md:h-dvh md:border-r',
          railClosed ? 'md:w-14' : 'md:w-64',
        )}
      >
        <div
          className={clsx(
            'flex shrink-0 items-center',
            railClosed ? 'flex-col gap-4 px-2 py-6' : 'gap-2 py-7 pr-3 pl-6',
          )}
        >
          {railClosed ? (
            <Monogram className="h-7 w-auto shrink-0 text-gilt" />
          ) : (
            <Wordmark sub="Dashboard" />
          )}

          <RailToggle closed={railClosed} onToggle={() => setRailClosed((v) => !v)} />
        </div>

        {/* Unmounted rather than hidden, so nothing in here is reachable by tab
            while it is off screen. */}
        {!railClosed && (
          <>
            <nav className="flex-1 overflow-y-auto px-3 pb-4">
              {visible.map((group) => (
                <div key={group.label} className="mb-6">
                  <p className="label px-3 pb-2 text-[0.58rem] text-faint/70">{group.label}</p>
                  {group.items.map((item) => (
                    <SidebarLink key={item.to} to={item.to} label={item.label} end={item.end} />
                  ))}
                </div>
              ))}
            </nav>

            <div className="border-t border-line px-6 py-5">
              <div className="-mx-3 mb-3">
                <AppearanceToggle />
              </div>

              <p className="truncate text-sm text-ink">{user?.displayName || user?.name}</p>
              <p className="truncate text-xs text-faint">{user?.email}</p>

              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="label text-faint transition-colors hover:text-gilt"
                >
                  Sign out
                </button>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label ml-auto text-faint transition-colors hover:text-gilt"
                >
                  View site
                </a>
              </div>
            </div>
          </>
        )}
      </aside>

      {/**
       * A short fade-and-rise between screens.
       *
       * Keyed on the pathname so each screen is a fresh mount, which also resets
       * scroll position and any half-finished entrance animation from the screen
       * being left. Deliberately quick and small — 0.28s and 10px. The public
       * site can afford a full curtain because a visitor is being shown
       * something; somebody working through the dashboard is trying to get
       * somewhere, and anything longer than this starts costing them time.
       *
       * `mode="wait"` would double the duration by running the exit before the
       * entrance, so the two overlap instead.
       */}
      <main className="min-w-0 flex-1">
        <AnimatePresence initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

/**
 * Opens and closes the rail.
 *
 * The same chevron the editors use for "back", turned around when the rail is
 * closed so it points the way it is about to move. It keeps its place in the
 * closed rail rather than becoming a button floating over the page, which is what
 * makes this a column that narrows rather than a panel that covers things.
 */
function RailToggle({ closed, onToggle }: { closed: boolean; onToggle: () => void }) {
  const label = closed ? 'Open the menu' : 'Close the menu'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!closed}
      aria-label={label}
      title={label}
      className={clsx(
        'grid size-9 shrink-0 place-items-center rounded-[3px] text-faint transition-colors hover:text-gilt',
        !closed && 'ml-auto',
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className={clsx(
          'h-4 w-4 transition-transform duration-300 motion-reduce:transition-none',
          closed && 'rotate-180',
        )}
        fill="none"
        stroke="currentColor"
      >
        <path d="M15 5 8 12l7 7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function SidebarLink({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'relative flex min-h-10 items-center rounded-[3px] px-3 text-sm transition-colors',
          isActive ? 'text-gilt' : 'text-muted hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* A hairline marker rather than a filled pill — the same vocabulary
              as the rules used across the site. */}
          <span
            className={clsx(
              'absolute top-1/2 -left-1 h-4 w-px -translate-y-1/2 bg-gilt transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          {label}
        </>
      )}
    </NavLink>
  )
}

function MobileDrawer({
  open,
  onClose,
  groups,
  user,
  onSignOut,
}: {
  open: boolean
  onClose: () => void
  groups: NavGroup[]
  user: { name: string; displayName?: string; email: string } | null
  onSignOut: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10060] md:hidden">
          <motion.button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] flex-col border-l border-line bg-surface"
          >
            <div className="flex items-center gap-4 border-b border-line px-5 py-4">
              <Wordmark sub="Dashboard" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="ml-auto grid size-11 shrink-0 place-items-center text-muted active:text-gilt"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                  <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              {groups.map((group) => (
                <div key={group.label} className="mb-5">
                  <p className="label px-3 pb-1.5 text-[0.58rem] text-faint/70">{group.label}</p>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        clsx(
                          'flex min-h-11 items-center rounded-[3px] px-3 text-sm transition-colors',
                          isActive ? 'bg-gilt/10 text-gilt' : 'text-muted active:bg-ink/5',
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            <div className="border-t border-line px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              <div className="-mx-3 mb-3">
                <AppearanceToggle />
              </div>

              <p className="truncate text-sm text-ink">{user?.displayName || user?.name}</p>
              <p className="truncate text-xs text-faint">{user?.email}</p>
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={onSignOut}
                  className="label flex min-h-11 items-center text-faint active:text-gilt"
                >
                  Sign out
                </button>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label ml-auto flex min-h-11 items-center text-faint active:text-gilt"
                >
                  View site
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/** The standard page heading inside the dashboard. */
export function AdminHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  back?: { to: string; label: string }
}) {
  return (
    <header className="border-b border-line px-6 py-7 md:px-10 md:py-9">
      {back && (
        <NavLink
          to={back.to}
          className="label group mb-4 inline-flex items-center gap-2 text-faint transition-colors hover:text-gilt"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor">
            <path d="M15 5 8 12l7 7" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {back.label}
        </NavLink>
      )}

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <h1 className="display text-3xl md:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-faint">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  )
}
