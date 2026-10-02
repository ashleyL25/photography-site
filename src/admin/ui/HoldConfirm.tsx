import clsx from 'clsx'
import { motion } from 'motion/react'
import { useHoldToConfirm } from '@/admin/hooks'

/**
 * Press and hold to confirm.
 *
 * Used for every action that changes what the public sees: publish, update,
 * return to draft. A confirm dialog is the conventional answer and it does not
 * work — after the third time it is dismissed without being read, which means it
 * stops being a check and becomes a keystroke.
 *
 * Holding is different in kind. It cannot happen by accident, it cannot happen
 * absent-mindedly, and letting go part-way leaves nothing behind. It is also
 * faster than reading a dialog, so it is not a tax on the times Ashley does mean
 * it.
 *
 * The ring fills clockwise from the top over the hold. `progress` comes from
 * `useHoldToConfirm`, which also handles pointer, touch and keyboard.
 */
export function HoldConfirm({
  label,
  holdingLabel,
  onConfirm,
  variant = 'primary',
  disabled = false,
  busy = false,
  holdMs = 1100,
  className,
}: {
  label: string
  /** What it says while being held. Defaults to "Keep holding". */
  holdingLabel?: string
  onConfirm: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  busy?: boolean
  holdMs?: number
  className?: string
}) {
  const { progress, holding, handlers } = useHoldToConfirm(onConfirm, holdMs)

  const circumference = 2 * Math.PI * 15

  return (
    <button
      type="button"
      disabled={disabled || busy}
      {...(disabled || busy ? {} : handlers)}
      aria-label={`${label} — press and hold to confirm`}
      className={clsx(
        'btn relative select-none overflow-hidden',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        /**
         * The destructive variant reads in rose, not in the accent red.
         *
         * Blood red is gorgeous as a fill and nearly invisible as text on a
         * near-black brown — it measured well under 3:1 against the canvas. The
         * fill and the border keep it unmistakably the red button; the label
         * uses the lighter red in the same family so it can actually be read.
         */
        variant === 'danger' &&
          'border border-accent/70 bg-accent/12 text-rose hover:bg-accent hover:text-ink hover:border-accent',
        (disabled || busy) && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {/* The fill sweeps left to right behind the label, so there are two
          readings of the same progress — useful on a wide button where a small
          ring alone is easy to miss. */}
      <span
        aria-hidden
        className="absolute inset-0 origin-left bg-current opacity-[0.18]"
        style={{ transform: `scaleX(${progress})`, transition: holding ? 'none' : 'transform 200ms' }}
      />

      <span className="relative flex items-center gap-3">
        <svg viewBox="0 0 34 34" className="h-[18px] w-[18px] -rotate-90" aria-hidden>
          <circle cx="17" cy="17" r="15" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.28" />
          <circle
            cx="17"
            cy="17"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: holding ? 'none' : 'stroke-dashoffset 200ms' }}
          />
        </svg>

        <span>
          {busy ? 'Working…' : holding ? (holdingLabel ?? 'Keep holding') : label}
        </span>
      </span>
    </button>
  )
}

/**
 * The same gesture as a small icon button, for a row in a list.
 *
 * Used for deleting a post from the listing screen, where a full-width hold
 * button would dominate the row it belongs to.
 */
export function HoldIconButton({
  label,
  onConfirm,
  children,
  holdMs = 900,
  className,
}: {
  label: string
  onConfirm: () => void
  children: React.ReactNode
  holdMs?: number
  className?: string
}) {
  const { progress, holding, handlers } = useHoldToConfirm(onConfirm, holdMs)
  const circumference = 2 * Math.PI * 17

  return (
    <button
      type="button"
      {...handlers}
      title={`${label} — press and hold`}
      aria-label={`${label} — press and hold to confirm`}
      className={clsx(
        'relative grid size-10 place-items-center rounded-full text-faint transition-colors hover:text-accent',
        className,
      )}
    >
      <svg viewBox="0 0 38 38" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="19"
          cy="19"
          r="17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: holding ? 'none' : 'stroke-dashoffset 200ms' }}
        />
      </svg>
      <motion.span animate={{ scale: holding ? 0.86 : 1 }} transition={{ duration: 0.2 }}>
        {children}
      </motion.span>
    </button>
  )
}
