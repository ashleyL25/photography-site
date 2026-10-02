import { useState } from 'react'
import clsx from 'clsx'
import { RATE_LENGTHS, emptyTier, tierLabel } from '@shared/settings'
import { useSite } from '@/lib/site'
import { Label, MultiChoice, Panel, Segmented, Switch, TextArea, TextInput, inputClass } from '../ui/controls'
import type { PackageSet, Tier } from '@shared/types'

/**
 * A session's tier ladder.
 *
 * Each tier says *how* it is priced rather than carrying a typed figure: off
 * the rate card (one length, or several added together for a two-session
 * bundle), a fixed price for a hand-set collection, or words like "Quoted".
 * Anything priced off the rate card moves when the rate card does, which is
 * the whole point of having one.
 */
export function PackagesEditor({ value, onChange }: { value: PackageSet; onChange: (value: PackageSet) => void }) {
  const { settings } = useSite()
  const [open, setOpen] = useState<number | null>(0)

  const setTier = (index: number, next: Partial<Tier>) =>
    onChange({ ...value, tiers: value.tiers.map((t, i) => (i === index ? { ...t, ...next } : t)) })

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= value.tiers.length) return
    const tiers = [...value.tiers]
    ;[tiers[index], tiers[target]] = [tiers[target], tiers[index]]
    onChange({ ...value, tiers })
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-5 py-8 md:px-8">
      <Panel title="Above and below the tiers">
        <div className="space-y-5">
          <div>
            <Label help="One or two sentences above the cards.">Intro</Label>
            <TextArea value={value.intro} onChange={(intro) => onChange({ ...value, intro })} rows={3} />
          </div>
          <div>
            <Label help="Optional — a caveat in small italics under the cards.">Note</Label>
            <TextArea value={value.note} onChange={(note) => onChange({ ...value, note })} rows={3} />
          </div>
        </div>
      </Panel>

      {value.tiers.map((tier, i) => {
        const expanded = open === i
        return (
          <section key={i} className="rounded-[var(--card-radius)] border border-line bg-surface">
            <header className="flex flex-wrap items-center gap-3 px-6 py-4">
              <button type="button" onClick={() => setOpen(expanded ? null : i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className="text-xs font-semibold text-faint">{String(i + 1).padStart(2, '0')}</span>
                <span className="truncate font-semibold">{tier.name || 'Untitled tier'}</span>
                <span className="shrink-0 rounded-full bg-gilt/10 px-2.5 py-0.5 text-xs font-semibold text-gilt">
                  {tierLabel(tier.price, settings.pricing)}
                </span>
                {tier.featured && <span className="shrink-0 text-xs text-faint">Most booked</span>}
              </button>
              <div className="flex items-center gap-1">
                <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </IconButton>
                <IconButton label="Move down" disabled={i === value.tiers.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </IconButton>
                <IconButton
                  label="Remove tier"
                  onClick={() => {
                    if (confirm(`Remove “${tier.name}”?`)) onChange({ ...value, tiers: value.tiers.filter((_, j) => j !== i) })
                  }}
                >
                  ×
                </IconButton>
              </div>
            </header>

            {expanded && (
              <div className="grid gap-5 border-t border-line px-6 py-6 sm:grid-cols-2">
                <div>
                  <Label>Name</Label>
                  <TextInput value={tier.name} onChange={(name) => setTier(i, { name })} />
                </div>
                <div>
                  <Label help="Under the price. Three or four words.">Unit</Label>
                  <TextInput value={tier.unit} onChange={(unit) => setTier(i, { unit })} placeholder="two hours" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Summary</Label>
                  <TextInput value={tier.summary} onChange={(summary) => setTier(i, { summary })} />
                </div>

                <div className="rounded-lg border border-line bg-canvas p-5 sm:col-span-2">
                  <Label>Price</Label>
                  <Segmented
                    value={tier.price.mode}
                    onChange={(mode) => setTier(i, { price: { ...tier.price, mode: mode as Tier['price']['mode'] } })}
                    options={[
                      { value: 'rate', label: 'Rate card' },
                      { value: 'fixed', label: 'Fixed' },
                      { value: 'text', label: 'Words' },
                    ]}
                  />
                  <div className="mt-4 space-y-4">
                    {tier.price.mode === 'rate' && (
                      <div>
                        <p className="mb-2 text-xs text-faint">
                          Tick the length — or several, for a bundle that adds them together.
                        </p>
                        <MultiChoice
                          value={tier.price.lengths}
                          onChange={(lengths) => setTier(i, { price: { ...tier.price, lengths } })}
                          options={RATE_LENGTHS}
                        />
                      </div>
                    )}
                    {tier.price.mode === 'fixed' && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-faint">$</span>
                        <input
                          type="number"
                          min={0}
                          step={5}
                          value={tier.price.amount}
                          onChange={(e) => setTier(i, { price: { ...tier.price, amount: Number(e.target.value) || 0 } })}
                          className={clsx(inputClass, 'w-36')}
                        />
                      </div>
                    )}
                    {tier.price.mode === 'text' && (
                      <TextInput
                        value={tier.price.text}
                        onChange={(text) => setTier(i, { price: { ...tier.price, text } })}
                        placeholder="Quoted"
                      />
                    )}
                    {tier.price.mode !== 'text' && (
                      <Switch
                        checked={tier.price.album}
                        onChange={(album) => setTier(i, { price: { ...tier.price, album } })}
                        label="Includes the printed album (adds the album price)"
                      />
                    )}
                    <p className="text-sm">
                      Shows as <strong className="text-gilt">{tierLabel(tier.price, settings.pricing)}</strong>
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Time</Label>
                  <TextInput value={tier.time} onChange={(time) => setTier(i, { time })} />
                </div>
                <div>
                  <Label>Locations</Label>
                  <TextInput value={tier.locations} onChange={(locations) => setTier(i, { locations })} />
                </div>
                <div>
                  <Label>Outfits</Label>
                  <TextInput value={tier.outfits} onChange={(outfits) => setTier(i, { outfits })} />
                </div>
                <div>
                  <Label>You get</Label>
                  <TextInput value={tier.images} onChange={(images) => setTier(i, { images })} placeholder="80+ edited photos" />
                </div>
                <div className="sm:col-span-2">
                  <Label help="One per line.">What it includes</Label>
                  <TextArea
                    value={tier.includes.join('\n')}
                    rows={Math.max(4, tier.includes.length + 1)}
                    onChange={(text) => setTier(i, { includes: text.split('\n').filter((l, j, all) => l.trim() || j === all.length - 1) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Switch
                    checked={tier.featured}
                    onChange={(featured) =>
                      // Exactly one per ladder renders as the highlighted card.
                      onChange({
                        ...value,
                        tiers: value.tiers.map((t, j) => ({ ...t, featured: j === i ? featured : featured ? false : t.featured })),
                      })
                    }
                    label="Most booked — the highlighted card"
                  />
                </div>
              </div>
            )}
          </section>
        )
      })}

      {value.tiers.length < 6 && (
        <button
          type="button"
          onClick={() => {
            onChange({ ...value, tiers: [...value.tiers, { ...emptyTier(), id: `tier-${Date.now()}` }] })
            setOpen(value.tiers.length)
          }}
          className="w-full rounded-[var(--card-radius)] border border-dashed border-line py-5 text-sm font-medium text-faint transition-colors hover:border-gilt hover:text-gilt"
        >
          Add a tier
        </button>
      )}
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center rounded-md text-faint transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  )
}
