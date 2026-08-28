import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import type { Block } from '@/data/guides'
import { Reveal } from './motion'
import { Tick } from './TierCards'
import { LocationCards } from './LocationCards'

/* ------------------------------------------------------------------ *
 * Checklist
 * ------------------------------------------------------------------ */

/**
 * Ticks persist in localStorage, keyed by guide and chapter, so a client can
 * pack over two evenings without losing their place. Storage is wrapped because
 * Safari in private mode throws on access rather than returning null.
 */
function readTicks(key: string, length: number): boolean[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return Array(length).fill(false)
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return Array(length).fill(false)
    return Array.from({ length }, (_, i) => Boolean(parsed[i]))
  } catch {
    return Array(length).fill(false)
  }
}

function Checklist({ storageKey, items }: { storageKey: string; items: string[] }) {
  const [ticks, setTicks] = useState<boolean[]>(() => readTicks(storageKey, items.length))

  // Re-read when the key changes — one component instance is reused across
  // chapters and across guides as the router swaps pages.
  useEffect(() => setTicks(readTicks(storageKey, items.length)), [storageKey, items.length])

  const write = useCallback(
    (next: boolean[]) => {
      setTicks(next)
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        /* Storage unavailable — the list still works, it just will not persist. */
      }
    },
    [storageKey],
  )

  const done = ticks.filter(Boolean).length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <p className="label text-faint">
          {done} of {items.length} packed
        </p>
        {done > 0 && (
          <button
            type="button"
            onClick={() => write(Array(items.length).fill(false))}
            className="label text-faint underline decoration-line underline-offset-4 transition-colors hover:text-accent print:hidden"
          >
            Clear
          </button>
        )}
      </div>

      {/* Progress bar — the only moving part on the page that is about them
          rather than about the design. */}
      <div aria-hidden className="mt-4 h-px w-full bg-line print:hidden">
        <div
          className="h-px bg-accent transition-[width] duration-500 ease-[var(--ease-out-expo)]"
          style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
        />
      </div>

      <ul className="mt-6">
        {items.map((item, i) => (
          <li key={item} className="border-b border-line last:border-0">
            <label className="group flex cursor-pointer items-start gap-5 py-4">
              <input
                type="checkbox"
                checked={ticks[i] ?? false}
                onChange={() => write(ticks.map((t, j) => (j === i ? !t : t)))}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="mt-[0.15rem] grid size-5 shrink-0 place-items-center rounded-full border border-line transition-colors duration-300 group-hover:border-accent peer-checked:border-accent peer-checked:bg-accent peer-checked:[&>svg]:opacity-100"
              >
                <svg
                  viewBox="0 0 12 12"
                  className="size-2.5 text-canvas opacity-0 transition-opacity duration-300"
                  fill="none"
                >
                  <path
                    d="M1.5 6.2 4.4 9 10.5 2.6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span
                className={clsx(
                  'text-[1rem] leading-relaxed transition-colors duration-300',
                  ticks[i] ? 'text-faint line-through' : 'text-muted',
                )}
              >
                {item}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Blocks
 * ------------------------------------------------------------------ */

/**
 * Renders one block of a guide chapter. `storageKey` is only used by the
 * checklist kind; it is passed down rather than derived here so the page owns
 * the naming scheme.
 */
export function GuideBlock({ block, storageKey }: { block: Block; storageKey: string }) {
  switch (block.kind) {
    case 'prose':
      return (
        <div className="max-w-2xl space-y-6 text-[1.05rem] leading-[1.9] text-muted">
          {block.text.map((paragraph, i) => (
            <Reveal key={i} as="p" delay={i * 0.05}>
              {paragraph}
            </Reveal>
          ))}
        </div>
      )

    case 'timeline':
      return (
        <ol className="border-t border-line">
          {block.items.map((item, i) => (
            <Reveal
              as="li"
              key={item.title}
              delay={i * 0.05}
              className="grid gap-2 border-b border-line py-7 sm:grid-cols-[10rem_1fr] sm:gap-8"
            >
              <span className="label pt-1 text-accent">{item.time}</span>
              <div>
                <h4 className="display text-[1.5rem] text-ink">{item.title}</h4>
                <p className="mt-2 max-w-xl text-[0.98rem] leading-relaxed text-muted">
                  {item.detail}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      )

    case 'steps':
      return (
        <ol className="grid gap-px overflow-hidden bg-line sm:grid-cols-2">
          {block.items.map((item, i) => (
            <Reveal key={item.label} delay={i * 0.05} className="bg-canvas p-7">
              <div className="flex items-baseline gap-3">
                <span className="label text-faint">{String(i + 1).padStart(2, '0')}</span>
                <h4 className="display text-[1.4rem] text-ink">{item.label}</h4>
              </div>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{item.detail}</p>
            </Reveal>
          ))}
        </ol>
      )

    case 'checklist':
      return <Checklist storageKey={storageKey} items={block.items} />

    case 'vendors':
      return (
        <ul className="grid gap-px overflow-hidden bg-line sm:grid-cols-2 lg:grid-cols-3">
          {block.items.map((vendor, i) => (
            <Reveal
              as="li"
              key={vendor.name}
              delay={(i % 3) * 0.06}
              className="flex flex-col bg-canvas p-7"
            >
              <h4 className="display text-[1.5rem] text-ink">
                {vendor.url ? (
                  <a
                    href={vendor.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="transition-colors hover:text-accent"
                  >
                    {vendor.name}
                    <span aria-hidden className="ml-2 text-[0.7em] align-middle text-faint">↗</span>
                  </a>
                ) : (
                  vendor.name
                )}
              </h4>
              <p className="label mt-3 text-accent">{vendor.area}</p>
              {vendor.address && (
                <p className="mt-3 text-[0.85rem] text-faint">{vendor.address}</p>
              )}
              <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">{vendor.does}</p>
              {vendor.note && (
                <p className="mt-4 border-l border-accent/40 pl-4 text-[0.88rem] leading-relaxed text-muted italic">
                  {vendor.note}
                </p>
              )}
            </Reveal>
          ))}
        </ul>
      )

    case 'columns':
      return (
        <div
          className={clsx(
            'grid gap-x-12 gap-y-10 sm:grid-cols-2',
            block.items.length === 3 && 'lg:grid-cols-3',
          )}
        >
          {block.items.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 0.07}>
              <h4 className="display text-[1.6rem] text-ink">{item.title}</h4>
              <p className="mt-4 text-[0.98rem] leading-[1.85] text-muted">{item.body}</p>
            </Reveal>
          ))}
        </div>
      )

    case 'compare':
      return (
        <div className="grid gap-px overflow-hidden bg-line md:grid-cols-2">
          {[
            { ...block.yes, tone: 'yes' as const },
            { ...block.no, tone: 'no' as const },
          ].map((side, i) => (
            <Reveal key={side.title} delay={i * 0.08} className="bg-canvas p-8 md:p-10">
              <p
                className={clsx(
                  'label flex items-center gap-3',
                  side.tone === 'yes' ? 'text-accent' : 'text-faint',
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    'h-px w-8',
                    side.tone === 'yes' ? 'bg-accent' : 'bg-faint',
                  )}
                />
                {side.title}
              </p>
              <ul className="mt-7 space-y-4">
                {side.items.map((line) => (
                  <li
                    key={line}
                    className="flex gap-4 text-[0.96rem] leading-relaxed text-muted"
                  >
                    {side.tone === 'yes' ? (
                      <Tick className="mt-[0.5rem]" />
                    ) : (
                      <svg
                        viewBox="0 0 16 16"
                        className="mt-[0.5rem] size-2.5 shrink-0 text-faint"
                        aria-hidden
                      >
                        <path d="M0 8h16" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    )}
                    {line}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      )

    case 'locationCards':
      return <LocationCards items={block.items} />

    case 'locations':
      return (
        <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2">
          {block.items.map((group, i) => (
            <Reveal key={group.group} delay={(i % 2) * 0.08}>
              <h4 className="display text-[1.7rem] text-ink">{group.group}</h4>
              <p className="mt-3 max-w-sm text-[0.92rem] leading-relaxed text-muted italic">
                {group.blurb}
              </p>
              <ul className="mt-6 space-y-3">
                {group.places.map((place) => (
                  <li key={place} className="flex gap-4 text-[0.95rem] leading-relaxed text-muted">
                    <Tick className="mt-[0.5rem]" />
                    {place}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      )

    case 'note':
      return (
        <Reveal className="border-l-2 border-accent bg-surface p-7 md:p-9">
          <p className="label text-accent">One thing</p>
          <p className="mt-4 max-w-2xl text-[1.02rem] leading-[1.85] text-ink">{block.text}</p>
        </Reveal>
      )
  }
}
