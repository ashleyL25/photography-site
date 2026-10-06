import { useEffect } from 'react'
import { FONTS, fontStack } from '@shared/theme'
import { ColorField, Select } from './controls'

/**
 * A colour, or nothing — empty means "as designed", which is the default for
 * every colour in the theme, so a reset is one click and never a guess at the
 * original hex.
 */
export function ThemeColorField({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <ColorField id={id} value={value} onChange={onChange} />
      </div>
      {value ? (
        <button type="button" onClick={() => onChange('')} className="shrink-0 text-xs text-muted underline-offset-2 hover:text-ink hover:underline">
          As designed
        </button>
      ) : (
        <span className="shrink-0 text-xs text-faint">As designed</span>
      )}
    </div>
  )
}

/** Loads one Google Font into the dashboard, so its picker can show it. */
function useFontPreview(value: string) {
  useEffect(() => {
    const f = FONTS.find((x) => x.value === value)
    if (!f) return
    const id = `font-preview-${f.value}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.family).replace(/%20/g, '+')}${f.axis ? `:${f.axis}` : ''}&display=swap`
    document.head.appendChild(link)
  }, [value])
}

const KIND_LABEL = { serif: 'Serif', sans: 'Sans serif', script: 'Script' } as const

/** A typeface, shown in itself. */
export function FontField({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  useFontPreview(value)
  return (
    <div className="space-y-3">
      <Select
        id={id}
        value={value}
        onChange={onChange}
        options={FONTS.map((f) => ({ value: f.value, label: `${f.label} — ${KIND_LABEL[f.kind]}` }))}
      />
      <p className="truncate rounded-[3px] border border-line bg-canvas px-4 py-3 text-[1.6rem] leading-tight text-ink" style={{ fontFamily: fontStack(value) }}>
        Portraits worth keeping — Aa Bb 123
      </p>
    </div>
  )
}
