import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * Light or dark, for the dashboard only.
 *
 * The dashboard keeps its own light and dark, separate from the site's own
 * toggle: it is a tool rather than the brand, and somebody laying out pages for
 * an afternoon in a bright room should be able to say so.
 *
 * The switch reaches the chrome and nothing else. Whatever is showing the
 * *page* — the section editor's preview column, the widget thumbnails — stays
 * on the site's own palette, because a preview that changed color with the
 * dashboard would be a picture of a page that does not exist. See
 * `.site-preview` in index.css.
 */

export type Appearance = 'light' | 'dark'

const KEY = 'ap:dashboard-appearance'

interface AppearanceValue {
  appearance: Appearance
  setAppearance: (next: Appearance) => void
  toggle: () => void
}

const Context = createContext<AppearanceValue>({
  appearance: 'dark',
  setAppearance: () => {},
  toggle: () => {},
})

/**
 * The stored choice, or the system's.
 *
 * Reads can throw outright rather than return null — Safari in private
 * browsing does exactly that — so this never assumes it worked. Falling back to
 * the OS preference rather than to dark means the first visit already looks
 * like the rest of the machine.
 */
function initial(): Appearance {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* no storage — fall through to the system */
  }
  try {
    return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setStored] = useState<Appearance>(initial)

  const setAppearance = useCallback((next: Appearance) => {
    setStored(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // A preference that cannot be saved is still worth honoring for this
      // session; it just will not survive a reload.
    }
  }, [])

  /**
   * The attribute goes on `<body>`, and it has to be `<body>` rather than
   * `<html>`.
   *
   * `themeCssVars` writes the site's palette onto `document.documentElement` as
   * an *inline style*, and no stylesheet rule outranks an inline declaration on
   * the same element — so `[data-appearance='light']` on `<html>` sets nothing
   * and the dashboard stays dark with the attribute sitting there looking
   * correct. On `<body>` there is no contest: a custom property declared on a
   * descendant wins for that descendant's subtree whatever the ancestor said.
   *
   * It also has to be something that contains the dialogs. Those portal to
   * `document.body` — which is what stops them being trapped under the section
   * editor's preview — so an attribute on the dashboard's own wrapper would
   * leave every dialog dark while the page behind it was light.
   */
  useEffect(() => {
    document.body.dataset.appearance = appearance
    return () => {
      delete document.body.dataset.appearance
    }
  }, [appearance])

  return (
    <Context.Provider
      value={{
        appearance,
        setAppearance,
        toggle: () => setAppearance(appearance === 'dark' ? 'light' : 'dark'),
      }}
    >
      {children}
    </Context.Provider>
  )
}

export function useAppearance(): AppearanceValue {
  return useContext(Context)
}

export function AppearanceToggle({ compact = false }: { compact?: boolean }) {
  const { appearance, toggle } = useAppearance()
  const next = appearance === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
      className={
        compact
          ? 'grid size-9 shrink-0 place-items-center rounded-[3px] text-faint transition-colors hover:text-gilt'
          : 'flex min-h-10 w-full items-center gap-3 rounded-[3px] px-3 text-sm text-muted transition-colors hover:text-gilt'
      }
    >
      {appearance === 'dark' ? <SunIcon /> : <MoonIcon />}
      {!compact && <span>{appearance === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="4" strokeWidth="1.4" />
      <path
        d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor">
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
