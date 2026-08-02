import clsx from 'clsx'
import { ALWAYS_INCLUDED, BLACK_AND_WHITE, PACKAGES } from '@/data/site'
import { DrawRule, MaskText, Reveal } from '@/components/motion'

/**
 * Pricing. Lives on the contact page, directly above the FAQ — hence the
 * same-page `#enquire` links rather than a route change.
 */

/** Small plus-tick used as the list bullet throughout this section. */
function Tick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={clsx('size-2.5 shrink-0 text-accent', className)} aria-hidden>
      <path d="M8 0v16M0 8h16" stroke="currentColor" strokeWidth="1.4" opacity=".8" />
    </svg>
  )
}

export function Investment() {
  return (
    <section id="investment" className="relative scroll-mt-24 border-t border-line py-28 md:py-40">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              Investment
            </Reveal>
            <MaskText
              text="One set package, and everything else built for you"
              className="display mt-6 max-w-2xl text-[clamp(2.2rem,5.2vw,4.4rem)] text-ink"
            />
          </div>
          <Reveal delay={0.15} className="max-w-sm pb-3 text-[0.95rem] leading-relaxed text-muted">
            Senior sessions are the same for everyone, so they have a fixed price. Everything else
            is shaped around what you actually want — so those start somewhere and we go from there.
          </Reveal>
        </div>

        <DrawRule className="mt-14" />

        {/* Subgrid keeps the number, title, price and CTA of all three cards on
            the same baselines even though the copy lengths differ. */}
        <div className="grid gap-px overflow-hidden bg-line md:grid-cols-3 md:grid-rows-[auto_auto_auto_auto_1fr_auto]">
          {PACKAGES.map((pkg, i) => (
            <Reveal
              key={pkg.id}
              delay={i * 0.12}
              className={clsx(
                'group relative flex flex-col bg-canvas p-8 transition-colors duration-500 md:row-span-6 md:grid md:grid-rows-subgrid md:p-10',
                pkg.featured && 'bg-surface',
              )}
            >
              {pkg.featured && (
                <span className="label absolute top-8 right-8 text-accent md:top-10 md:right-10">
                  Set package
                </span>
              )}

              <span className="label text-faint">{String(i + 1).padStart(2, '0')}</span>

              <h3 className="display mt-6 text-[clamp(2rem,3.2vw,2.8rem)] text-ink">{pkg.name}</h3>
              <p className="mt-2 text-[0.9rem] text-muted italic">{pkg.summary}</p>

              <div className="mt-8 border-b border-line pb-8">
                {/* Never wrap: a two-line price breaks the subgrid row that
                    keeps all three cards on the same baselines. */}
                <span className="display block text-[clamp(2.1rem,3.5vw,3.1rem)] leading-none whitespace-nowrap text-accent">
                  {pkg.price}
                </span>
                <span className="label mt-3 block text-faint">{pkg.unit}</span>
              </div>

              <ul className="mt-8 space-y-4">
                {pkg.includes.map((line) => (
                  <li key={line} className="flex gap-4 text-[0.95rem] leading-relaxed text-muted">
                    <Tick className="mt-[0.55rem]" />
                    {line}
                  </li>
                ))}
              </ul>

              <a
                href="#enquire"
                className="label mt-10 inline-flex items-center justify-between gap-4 border-b border-ink pb-3 text-ink transition-colors duration-400 hover:border-accent hover:text-accent"
              >
                Enquire
                <span className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">
                  →
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        {/* What every session carries, regardless of which card you picked. */}
        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal className="label text-faint">In every session</Reveal>
            <ul className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {ALWAYS_INCLUDED.map((line, i) => (
                <Reveal
                  as="li"
                  key={line}
                  delay={i * 0.06}
                  className="flex gap-4 text-[0.95rem] leading-relaxed text-muted"
                >
                  <Tick className="mt-[0.55rem]" />
                  {line}
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal delay={0.2} className="lg:col-span-5">
            <p className="label text-accent">{BLACK_AND_WHITE.eyebrow}</p>
            <p className="mt-6 border-l border-accent/40 pl-6 text-[1.02rem] leading-[1.85] text-muted italic">
              {BLACK_AND_WHITE.body}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="mt-16 text-[0.85rem] text-faint italic">
          Extra edited images can be added to any gallery after delivery. Travel anywhere in the
          Des Moines metro is included; further afield is welcome for a travel fee, quoted before
          you commit to anything.
        </Reveal>
      </div>
    </section>
  )
}
