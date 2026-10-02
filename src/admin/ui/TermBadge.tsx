import clsx from 'clsx'
import { swatchColor } from '@shared/palette'
import type { Term } from '@shared/types'

/** A category's name with its colour dot, as the dashboard lists show it. */
export function TermBadge({ term, className }: { term: Term; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2 text-xs font-medium text-muted', className)}>
      <span className="inline-block size-2 rounded-full" style={{ background: swatchColor(term.swatch) }} />
      {term.name}
    </span>
  )
}
