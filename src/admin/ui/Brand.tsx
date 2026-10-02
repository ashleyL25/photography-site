import clsx from 'clsx'
import { Monogram } from '@/components/Brand'

export { Monogram }

/** The dashboard's wordmark: the arch monogram, the name, and where you are. */
export function Wordmark({ sub, className }: { sub?: string; className?: string }) {
  return (
    <span className={clsx('flex min-w-0 items-center gap-3', className)}>
      <Monogram className="h-8 text-gilt" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[0.95rem] font-semibold tracking-[-0.01em] text-ink">Ashley Photography</span>
        {sub && <span className="truncate text-[0.72rem] text-faint">{sub}</span>}
      </span>
    </span>
  )
}

/** A short rule with an arch at its middle — the site's arch motif, as a divider. */
export function Ornament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" fill="none" aria-hidden className={clsx('shrink-0', className)}>
      <path d="M0 10h48M72 10h48" stroke="currentColor" strokeWidth="1" />
      <path d="M52 11V7a8 8 0 0 1 16 0v4" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}
