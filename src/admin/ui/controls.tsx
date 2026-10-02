import { useId, type ReactNode } from 'react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { SWATCHES } from '@shared/palette'

/**
 * The form controls the dashboard is built from.
 *
 * Deliberately a small, complete set rather than a component library. Every
 * editor screen — page sections, post details, theme settings — renders itself
 * from a field schema, so these are used hundreds of times and are worth having
 * exactly right; and there is nothing here a library would do better for a form
 * this regular.
 */

export function Label({
  children,
  htmlFor,
  help,
}: {
  children: ReactNode
  htmlFor?: string
  help?: string
}) {
  return (
    <div className="mb-2">
      <label htmlFor={htmlFor} className="label block text-muted">
        {children}
      </label>
      {help && <p className="mt-1.5 text-xs leading-relaxed text-faint">{help}</p>}
    </div>
  )
}

export const inputClass =
  'w-full rounded-[3px] border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint/60 focus:border-gilt'

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  id,
  className,
  ...rest
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  id?: string
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(inputClass, className)}
      {...rest}
    />
  )
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  id,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  id?: string
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(inputClass, 'resize-y leading-relaxed')}
    />
  )
}

export function Select({
  value,
  onChange,
  options,
  id,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly { readonly value: string; readonly label: string }[]
  id?: string
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(inputClass, 'cursor-pointer appearance-none pr-9')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface text-ink">
            {option.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-faint"
        fill="none"
        stroke="currentColor"
      >
        <path d="m6 9 6 6 6-6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/**
 * Segmented control, for a choice of two to four.
 *
 * Preferred over a select when the options are short, because it shows what is
 * available without a click — which matters for things like alignment and
 * padding, where the point is comparing options rather than knowing them.
 */
export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: readonly { readonly value: string; readonly label: string }[]
}) {
  /**
   * A stable id for this control's shared layout animation.
   *
   * Derived from the option values rather than from `useId`: the highlight is
   * rendered inside a map, and calling a hook there would be a hooks-order
   * violation. Two identical controls on one screen would share a highlight,
   * which is a far smaller problem than a crash.
   */
  const layoutId = `segmented-${options.map((o) => o.value).join('-')}`

  return (
    <div className="flex rounded-[3px] border border-line bg-canvas p-1">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={clsx(
              'relative flex-1 rounded-[2px] px-3 py-1.5 text-xs transition-colors',
              active ? 'text-canvas' : 'text-muted hover:text-ink',
            )}
          >
            {active && (
              // One shared layoutId, so the highlight slides between options
              // rather than cross-fading in place.
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[2px] bg-gilt"
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <span className="relative whitespace-nowrap">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
}) {
  const generated = useId()
  const inputId = id ?? generated

  return (
    <label htmlFor={inputId} className="flex cursor-pointer items-center gap-3">
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300',
          checked ? 'border-gilt bg-gilt/25' : 'border-line bg-canvas',
        )}
      >
        <motion.span
          className={clsx('absolute top-[3px] h-[16px] w-[16px] rounded-full', checked ? 'bg-gilt' : 'bg-faint')}
          animate={{ left: checked ? 22 : 3 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        />
      </button>
      {label && <span className="text-sm text-muted">{label}</span>}
    </label>
  )
}

/**
 * A slider with the number beside it, editable.
 *
 * Both together because they answer different questions: the slider is for
 * "a bit more", the field is for "exactly 96".
 */
export function NumberField({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix,
  id,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  id?: string
}) {
  return (
    <div className="flex items-center gap-4">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-[var(--gilt)]"
      />
      <div className="flex w-28 shrink-0 items-center gap-1.5">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value)
            // Clamped on the way in: a typed value outside the range would
            // otherwise render as a slider pinned to one end and lying about it.
            if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)))
          }}
          className={clsx(inputClass, 'px-2 py-1.5 text-center text-xs')}
        />
        {suffix && <span className="shrink-0 text-[0.65rem] text-faint">{suffix}</span>}
      </div>
    </div>
  )
}

/**
 * A color well plus its hex.
 *
 * The native picker handles choosing; the text field handles pasting a value
 * from a brand sheet, which is how a color usually arrives. `transparent` is
 * accepted as typed, because several of the button settings need it and no
 * color picker can express it.
 */
export function ColorField({
  value,
  onChange,
  id,
}: {
  value: string
  onChange: (value: string) => void
  id?: string
}) {
  const isHex = /^#[0-9a-f]{6}$/i.test(value)

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-[3px] border border-line">
        {!isHex && (
          // A checkerboard behind a non-hex value, so `transparent` looks
          // transparent rather than looking like black.
          <span
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(45deg, rgb(var(--faint-rgb)/0.3) 25%, transparent 25%, transparent 75%, rgb(var(--faint-rgb)/0.3) 75%), linear-gradient(45deg, rgb(var(--faint-rgb)/0.3) 25%, transparent 25%, transparent 75%, rgb(var(--faint-rgb)/0.3) 75%)',
              backgroundSize: '10px 10px',
              backgroundPosition: '0 0, 5px 5px',
            }}
          />
        )}
        <input
          id={id}
          type="color"
          value={isHex ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer border-0 bg-transparent p-0 opacity-0"
        />
        {isHex && <span className="absolute inset-0" style={{ background: value }} />}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={clsx(inputClass, 'font-mono text-xs')}
      />
    </div>
  )
}

/** Picks one of the brand palette names — not a free color. */
export function SwatchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((swatch) => {
        const active = swatch.value === value
        return (
          <button
            key={swatch.value}
            type="button"
            onClick={() => onChange(swatch.value)}
            title={swatch.label}
            aria-label={swatch.label}
            aria-pressed={active}
            className={clsx(
              'grid size-9 place-items-center rounded-full border-2 transition-all',
              active ? 'border-gilt' : 'border-transparent hover:border-line',
            )}
          >
            <span
              className="block size-6 rounded-full"
              style={{ background: swatch.color }}
            />
          </button>
        )
      })}
    </div>
  )
}

export function MultiChoice({
  value,
  onChange,
  options,
}: {
  value: string[]
  onChange: (value: string[]) => void
  options: readonly { readonly value: string; readonly label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              onChange(on ? value.filter((v) => v !== option.value) : [...value, option.value])
            }
            aria-pressed={on}
            className={clsx(
              'rounded-full border px-3.5 py-1.5 text-xs transition-colors',
              on ? 'border-gilt bg-gilt/15 text-gilt' : 'border-line text-muted hover:border-gilt/50',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/** A bordered panel with a heading. The unit every editor screen is built from. */
export function Panel({
  title,
  description,
  children,
  actions,
  className,
}: {
  title?: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <section className={clsx('rounded-[var(--card-radius)] border border-line bg-surface', className)}>
      {(title || actions) && (
        <header className="flex items-start gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0 flex-1">
            {title && <h2 className="display text-lg">{title}</h2>}
            {description && <p className="mt-1 text-xs text-faint">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className="p-6">{children}</div>
    </section>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[var(--card-radius)] border border-dashed border-line px-8 py-16 text-center">
      <p className="display text-xl">{title}</p>
      {body && <p className="max-w-sm text-sm text-faint">{body}</p>}
      {action}
    </div>
  )
}
