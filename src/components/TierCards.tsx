import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { PackageSet } from '@/data/packages'
import { Reveal } from './motion'

/** Small plus-tick used as the list bullet wherever inclusions are listed. */
export function Tick({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={clsx('size-2.5 shrink-0 text-accent', className)}
      aria-hidden
    >
      <path d="M8 0v16M0 8h16" stroke="currentColor" strokeWidth="1.4" opacity=".8" />
    </svg>
  )
}

const SPEC_LABELS = [
  ['time', 'Time'],
  ['locations', 'Locations'],
  ['outfits', 'Outfits'],
  ['images', 'You get'],
] as const

/**
 * The three-tier ladder for one session type.
 *
 * All three cards are one grid with `grid-rows-subgrid`, so the name, price,
 * spec table and CTA sit on the same baselines across the row even though the
 * copy lengths differ. That is the whole reason for the row-span dance — drop
 * it and the prices stop lining up, which makes the ladder much harder to read.
 */
export function TierCards({
  set,
  cta,
}: {
  set: PackageSet
  cta: { label: string; to?: string; href?: string }
}) {
  return (
    <div className="grid gap-px overflow-hidden bg-line md:grid-cols-3 md:grid-rows-[auto_auto_auto_auto_auto_1fr_auto]">
      {set.tiers.map((tier, i) => (
        <Reveal
          key={tier.id}
          delay={i * 0.1}
          className={clsx(
            'group relative flex flex-col bg-canvas p-8 transition-colors duration-500 md:row-span-6 md:grid md:grid-rows-subgrid md:p-10',
            tier.featured && 'bg-surface',
          )}
        >
          {tier.featured && (
            <span className="label absolute top-8 right-8 text-accent md:top-10 md:right-10">
              Most booked
            </span>
          )}

          <span className="label text-faint">{String(i + 1).padStart(2, '0')}</span>

          <h3 className="display mt-6 text-[clamp(1.9rem,3vw,2.6rem)] text-ink">{tier.name}</h3>
          <p className="mt-2 max-w-[22rem] text-[0.9rem] leading-relaxed text-muted italic">
            {tier.summary}
          </p>

          <div className="mt-8 border-b border-line pb-8">
            {/* Never wrap: a two-line price breaks the subgrid row that keeps
                all three cards on the same baselines. */}
            <span className="display block text-[clamp(2.1rem,3.5vw,3.1rem)] leading-none whitespace-nowrap text-accent">
              {tier.price}
            </span>
            <span className="label mt-3 block text-faint">{tier.unit}</span>
          </div>

          <dl className="mt-8 space-y-3 border-b border-line pb-8">
            {SPEC_LABELS.map(([key, label]) => (
              <div key={key} className="flex items-baseline justify-between gap-4">
                <dt className="label shrink-0 text-faint">{label}</dt>
                <dd className="text-right text-[0.9rem] leading-snug text-ink">
                  {tier.spec[key]}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-8 space-y-4">
            {tier.includes.map((line) => (
              <li key={line} className="flex gap-4 text-[0.93rem] leading-relaxed text-muted">
                <Tick className="mt-[0.5rem]" />
                {line}
              </li>
            ))}
          </ul>

          {cta.to ? (
            <Link
              to={cta.to}
              className="label mt-10 inline-flex items-center justify-between gap-4 border-b border-ink pb-3 text-ink transition-colors duration-400 hover:border-accent hover:text-accent"
            >
              {cta.label}
              <span className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">
                →
              </span>
            </Link>
          ) : (
            <a
              href={cta.href}
              className="label mt-10 inline-flex items-center justify-between gap-4 border-b border-ink pb-3 text-ink transition-colors duration-400 hover:border-accent hover:text-accent"
            >
              {cta.label}
              <span className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">
                →
              </span>
            </a>
          )}
        </Reveal>
      ))}
    </div>
  )
}
