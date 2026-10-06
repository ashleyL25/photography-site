import { useEffect, useMemo, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { api } from '@/lib/api'
import { useSite } from '@/lib/site'
import { SETTINGS_GROUPS, type SettingsKey } from '@shared/settings'
import { AdminHeader } from '../AdminLayout'
import { FieldList } from '../ui/Fields'
import { Panel } from '../ui/controls'
import { useToast } from '../ui/Toast'
import { usePhotoLookup } from '../photos'

const GROUPS: { key: SettingsKey; label: string; description: string }[] = [
  {
    key: 'site',
    label: 'Site',
    description: 'Your name and contact details, the menu across the top of every page, the footer, and what search engines see.',
  },
  {
    key: 'pricing',
    label: 'Pricing',
    description:
      'The rate card every tier is priced from, the private-pricing link, what every session includes, the add-ons and how booking works. Each session’s own tiers are on that session.',
  },
  {
    key: 'policy',
    label: 'Policies',
    description: 'Copy that appears in several places at once — how photographs are edited, the weather policy and moving a date. Change it here and it changes everywhere.',
  },
  {
    key: 'library',
    label: 'Recommendations',
    description: 'The hair and makeup salons, lunch stops and locations the prep guides suggest.',
  },
  {
    key: 'inquiry',
    label: 'Inquiry form',
    description: 'The choices on the contact form and what it says once a message is sent.',
  },
]

/** One settings group, edited with the same form renderer as every widget. */
export default function SettingsPage() {
  const { group = 'site' } = useParams<{ group: SettingsKey }>()
  const notify = useToast()
  const { refresh, sessions } = useSite()
  const [all, setAll] = useState<Record<string, Record<string, unknown>> | null>(null)
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null)
  const [saving, setSaving] = useState(false)

  const key: SettingsKey = group in SETTINGS_GROUPS && group !== 'theme' ? group : 'site'
  const meta = GROUPS.find((g) => g.key === key)!

  useEffect(() => {
    api
      .get<{ settings: Record<string, Record<string, unknown>> }>('/admin/settings')
      .then((data) => setAll(data.settings))
      .catch((err) => notify(err instanceof Error ? err.message : 'Could not load settings', 'error'))
  }, [notify])

  useEffect(() => {
    if (all) setDraft(structuredClone(all[key]))
  }, [all, key])

  usePhotoLookup(draft)
  const dirty = useMemo(() => Boolean(all && draft && JSON.stringify(all[key]) !== JSON.stringify(draft)), [all, draft, key])

  async function save() {
    if (!draft) return
    setSaving(true)
    try {
      const data = await api.put<{ value: Record<string, unknown> }>(`/admin/settings/${key}`, { value: draft })
      setAll((current) => (current ? { ...current, [key]: data.value } : current))
      notify('Saved — the site now uses these')
      void refresh()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AdminHeader
        title="Settings"
        description={meta.description}
        actions={
          <button type="button" onClick={() => void save()} disabled={!dirty || saving} className="btn btn-primary disabled:opacity-40">
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        }
      />

      <nav className="flex gap-1 overflow-x-auto border-b border-line px-6 md:px-10">
        {GROUPS.map((g) => (
          <NavLink
            key={g.key}
            to={`/dashboard/settings/${g.key}`}
            className={({ isActive }) =>
              clsx(
                'relative shrink-0 px-4 py-3 text-sm transition-colors',
                isActive ? 'font-semibold text-gilt after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-gilt' : 'text-muted hover:text-ink',
              )
            }
          >
            {g.label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8 md:px-10">
        {!draft ? (
          <div className="h-96 animate-pulse rounded-lg bg-ink/[0.04]" />
        ) : (
          <>
            {key === 'pricing' && <RateCardSummary sessions={sessions} />}
            <Panel>
              <FieldList fields={SETTINGS_GROUPS[key]} values={draft} onChange={setDraft} openGroups />
            </Panel>
          </>
        )}
      </div>
    </>
  )
}

/**
 * What the rate card currently makes of every tier priced from it — so
 * changing one number shows its consequences before it is saved.
 */
function RateCardSummary({ sessions }: { sessions: ReturnType<typeof useSite>['sessions'] }) {
  if (sessions.length === 0) return null
  return (
    <Panel title="What the tiers cost right now" description="Saved figures. Tiers priced off the rate card update when you save.">
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {sessions.map((s) => (
          <div key={s.id}>
            <p className="text-sm font-semibold">
              {s.title}
              {s.privatePricing && <span className="ml-2 text-xs font-normal text-faint">private</span>}
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-muted">
              {s.tiers.map((t) => (
                <li key={t.id} className="flex justify-between gap-4">
                  <span>{t.name}</span>
                  <span className="font-medium text-ink">{t.price}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  )
}
