import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { api } from '@/lib/api'
import { useSite } from '@/lib/site'
import { THEME_FIELDS } from '@shared/theme'
import { fieldDefaults, type FieldDef } from '@shared/widgets'
import { AdminHeader } from '../AdminLayout'
import { FieldList } from '../ui/Fields'
import { Panel, Segmented, Select } from '../ui/controls'
import { useToast } from '../ui/Toast'
import { usePhotoLookup } from '../photos'

type Theme = Record<string, Record<string, unknown>>

const GROUPS = THEME_FIELDS as readonly (FieldDef & { children: readonly FieldDef[] })[]
const DEFAULTS = fieldDefaults(THEME_FIELDS) as Theme

/**
 * Theme settings — the site's colours, type, buttons, header, footer and
 * motion, in tabs like the Pollywog theme's settings, beside a live preview.
 *
 * The preview is the real site in a frame. Every change is posted into it and
 * applied there at once, before anything is saved; Save writes it for
 * visitors. Each tab can be put back to how the site was designed on its own.
 */
export default function ThemePage() {
  const { group = 'colors' } = useParams<{ group: string }>()
  const notify = useToast()
  const { refresh, sessions } = useSite()
  const [saved, setSaved] = useState<Theme | null>(null)
  const [draft, setDraft] = useState<Theme | null>(null)
  const [saving, setSaving] = useState(false)
  const [path, setPath] = useState('/')
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [dark, setDark] = useState(false)

  const current = GROUPS.find((g) => g.name === group) ?? GROUPS[0]

  useEffect(() => {
    api
      .get<{ settings: Record<string, Theme> }>('/admin/settings')
      .then((data) => {
        setSaved(data.settings.theme)
        setDraft(structuredClone(data.settings.theme))
      })
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not load the theme', 'error'))
  }, [notify])

  usePhotoLookup(draft)
  const dirty = useMemo(() => Boolean(saved && draft && JSON.stringify(saved) !== JSON.stringify(draft)), [saved, draft])
  const groupChanged = useMemo(
    () => Boolean(draft && JSON.stringify(draft[current.name]) !== JSON.stringify(DEFAULTS[current.name])),
    [draft, current.name],
  )

  async function save() {
    if (!draft) return
    setSaving(true)
    try {
      const data = await api.put<{ value: Theme }>('/admin/settings/theme', { value: draft })
      setSaved(data.value)
      setDraft(structuredClone(data.value))
      notify('Saved — visitors now see the new theme')
      void refresh()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const pages = [
    { value: '/', label: 'Home' },
    { value: '/sessions', label: 'Sessions' },
    ...sessions.slice(0, 6).map((s) => ({ value: `/sessions/${s.slug}`, label: `Session — ${s.title}` })),
    { value: '/portfolio', label: 'Portfolio' },
    { value: '/experience', label: 'Experience' },
    { value: '/about', label: 'About' },
    { value: '/contact', label: 'Contact' },
    { value: '/blog', label: 'Blog' },
  ]

  return (
    <>
      <AdminHeader
        title="Theme"
        description="Colours, typography, buttons, header, footer and motion for the whole site. Changes show in the preview straight away; Save makes them live."
        actions={
          <div className="flex items-center gap-3">
            {dirty && (
              <button type="button" onClick={() => saved && setDraft(structuredClone(saved))} className="btn btn-secondary">
                Discard
              </button>
            )}
            <button type="button" onClick={() => void save()} disabled={!dirty || saving} className="btn btn-primary disabled:opacity-40">
              {saving ? 'Saving…' : dirty ? 'Save theme' : 'Saved'}
            </button>
          </div>
        }
      />

      <nav className="flex gap-1 overflow-x-auto border-b border-line px-6 md:px-10">
        {GROUPS.map((g) => (
          <NavLink
            key={g.name}
            to={`/dashboard/theme/${g.name}`}
            className={({ isActive }) =>
              clsx(
                'relative shrink-0 px-4 py-3 text-sm transition-colors',
                isActive || (g.name === 'colors' && !GROUPS.some((x) => x.name === group))
                  ? 'font-semibold text-gilt after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-gilt'
                  : 'text-muted hover:text-ink',
              )
            }
          >
            {g.label}
          </NavLink>
        ))}
      </nav>

      <div className="grid gap-6 px-6 py-8 md:px-10 xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        <div className="space-y-6">
          {!draft ? (
            <div className="h-96 animate-pulse rounded-lg bg-ink/[0.04]" />
          ) : (
            <Panel
              title={current.label}
              description={current.help}
              actions={
                groupChanged ? (
                  <button
                    type="button"
                    onClick={() => setDraft((d) => (d ? { ...d, [current.name]: structuredClone(DEFAULTS[current.name]) } : d))}
                    className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
                  >
                    Put {current.label.toLowerCase()} back as designed
                  </button>
                ) : undefined
              }
            >
              <FieldList
                fields={current.children}
                values={(draft[current.name] ?? {}) as never}
                onChange={(next) => setDraft((d) => (d ? { ...d, [current.name]: next as Record<string, unknown> } : d))}
              />
            </Panel>
          )}
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="min-w-[14rem] flex-1">
              <Select value={path} onChange={setPath} options={pages} />
            </div>
            <Segmented
              value={viewport}
              onChange={(v) => setViewport(v as 'desktop' | 'mobile')}
              options={[
                { value: 'desktop', label: 'Desktop' },
                { value: 'mobile', label: 'Phone' },
              ]}
            />
            <Segmented
              value={dark ? 'dark' : 'light'}
              onChange={(v) => setDark(v === 'dark')}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </div>
          <div className="h-[calc(100dvh-14rem)] min-h-[32rem] overflow-hidden rounded-[var(--card-radius)] border border-line bg-surface">
            {draft && <ThemePreview path={path} theme={draft} viewport={viewport} dark={dark} />}
          </div>
        </div>
      </div>
    </>
  )
}

const WIDTHS = { desktop: 1280, mobile: 390 } as const

/** The site in a frame, scaled to fit, with the draft theme posted into it. */
function ThemePreview({ path, theme, viewport, dark }: { path: string; theme: Theme; viewport: 'desktop' | 'mobile'; dark: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [loaded, setLoaded] = useState(0)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Post the draft whenever it changes, and again once the page inside has
  // loaded — its own first fetch would otherwise put the saved theme back.
  useEffect(() => {
    const win = frame.current?.contentWindow
    if (!win) return
    const send = () => win.postMessage({ type: 'ap-theme:preview', theme }, window.location.origin)
    send()
    const late = setTimeout(send, 600)
    try {
      const html = frame.current?.contentDocument?.documentElement
      html?.classList.toggle('dark', dark)
      html?.classList.toggle('light', !dark)
    } catch {
      /* Same origin; cannot fail in practice. */
    }
    return () => clearTimeout(late)
  }, [theme, loaded, dark])

  const logical = viewport === 'mobile' ? WIDTHS.mobile : Math.max(WIDTHS.desktop, size.width)
  const scale = size.width > 0 ? Math.min(1, size.width / logical) : 1

  return (
    <div ref={box} className="relative h-full w-full overflow-hidden">
      <div className="mx-auto h-full overflow-hidden" style={{ width: logical * scale }}>
        <iframe
          ref={frame}
          key={path}
          src={path}
          title="Theme preview"
          onLoad={() => setLoaded((n) => n + 1)}
          style={{ width: logical, height: size.height / scale, transform: `scale(${scale})`, transformOrigin: 'top left', border: 0 }}
        />
      </div>
    </div>
  )
}
