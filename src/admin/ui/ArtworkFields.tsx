import { useState } from 'react'
import clsx from 'clsx'
import { artworkMarkup, isArtwork } from '@shared/artwork'
import { useSite } from '@/lib/site'
import { MediaField } from './MediaPicker'
import { thumbOf } from '../photos'

/** One drawing, stroked in the current colour. */
export function ArtworkGlyph({ slug, className }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      dangerouslySetInnerHTML={{ __html: artworkMarkup(slug) }}
    />
  )
}

/**
 * A choice among the drawings, picked by looking at them.
 *
 * A motif's name — "Corner flourish" — tells you less than the drawing does,
 * so the options are a grid of tiles rather than a dropdown of words.
 */
export function ArtworkChoice({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly { readonly value: string; readonly label: string }[]
}) {
  const selected = options.find((o) => o.value === value)
  return (
    <div>
      <p className="mb-2 truncate text-xs text-muted">{selected?.label ?? 'None'}</p>
      <div className="max-h-60 overflow-y-auto rounded-[3px] border border-line p-2">
        <div className="grid grid-cols-6 gap-1.5">
          {options.map((tile) => {
            const active = tile.value === value
            return (
              <button
                key={tile.value || 'none'}
                type="button"
                onClick={() => onChange(tile.value)}
                title={tile.label}
                aria-label={tile.label}
                aria-pressed={active}
                className={clsx(
                  'grid aspect-square place-items-center rounded-[2px] border bg-canvas p-1.5 transition-colors',
                  active ? 'border-gilt text-gilt' : 'border-line text-muted hover:border-gilt/60',
                )}
              >
                {tile.value ? <ArtworkGlyph slug={tile.value} className="h-full w-full" /> : <span className="text-[0.55rem] tracking-wide">None</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * A floating element: one of the drawings, a print of a session photograph,
 * or any photograph from the library.
 */
export function ElementField({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly { readonly value: string; readonly label: string }[]
}) {
  const { sessions } = useSite()
  const builtIn = value === '' || isArtwork(value) || value.startsWith('print:')
  const [mode, setMode] = useState<'built-in' | 'library'>(builtIn ? 'built-in' : 'library')

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-full border border-line p-1 text-xs">
        {(['built-in', 'library'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={clsx('flex-1 rounded-full px-3 py-1.5 transition-colors', mode === m ? 'bg-gilt/15 text-gilt' : 'text-muted hover:text-ink')}
          >
            {m === 'built-in' ? 'Drawings and prints' : 'From your library'}
          </button>
        ))}
      </div>

      {mode === 'library' ? (
        <MediaField value={builtIn ? '' : value} onChange={onChange} />
      ) : (
        <div className="max-h-60 overflow-y-auto rounded-[3px] border border-line p-2">
          <div className="grid grid-cols-6 gap-1.5">
            {options.map((tile) => {
              const active = tile.value === value
              const print = tile.value.startsWith('print:')
              const photo = print ? sessions[Number(tile.value.slice(6)) - 1]?.photo : ''
              return (
                <button
                  key={tile.value}
                  type="button"
                  onClick={() => onChange(tile.value)}
                  title={tile.label}
                  aria-label={tile.label}
                  aria-pressed={active}
                  className={clsx(
                    'grid aspect-square place-items-center overflow-hidden rounded-[2px] border bg-canvas transition-colors',
                    print ? 'p-1' : 'p-1.5',
                    active ? 'border-gilt text-gilt' : 'border-line text-muted hover:border-gilt/60',
                  )}
                >
                  {print ? (
                    photo ? (
                      <img src={thumbOf(photo)} alt="" className="h-full w-full bg-white object-cover p-0.5" />
                    ) : (
                      <span className="text-[0.55rem]">Print {tile.value.slice(6)}</span>
                    )
                  ) : (
                    <ArtworkGlyph slug={tile.value} className="h-full w-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
