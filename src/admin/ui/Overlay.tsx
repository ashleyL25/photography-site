import { createPortal } from 'react-dom'
import clsx from 'clsx'
import type { ReactNode } from 'react'

/**
 * The full-screen layer every dashboard dialog sits on.
 *
 * `position: fixed` is not enough on its own, and the media picker is how we
 * found that out. The section editor animates its panel with a motion `x`, and
 * a transform makes an element a stacking context — so a picker rendered inside
 * that panel had its `z-index: 10070` clamped to the panel's own place in the
 * order, and the preview column beside it (whose sections carry `z-10` and
 * whose toolbar carries `z-20`) drew straight over the top of it. Raising the
 * number does nothing: the child cannot climb out of the context it is in.
 *
 * A portal to `document.body` is the fix, and it is the fix for every dialog
 * rather than for this one, because the next dialog opened from inside an
 * animated panel would have exactly the same bug and no reason to expect it.
 * Rendering through here also means a dialog's own z-index is comparable with
 * every other dialog's — they are all siblings on the body, in one order:
 *
 *   9000   the public site's sticky header
 *   10050  the search overlay
 *   10060  the dashboard's mobile navigation
 *   10070  a dialog
 *   10075  a dialog opened from a dialog
 *   10080  publish confirmation
 *   10090  toasts
 *   10100  the preloader, and the skip link
 */
export function Overlay({
  className,
  children,
  ...rest
}: {
  className?: string
  children: ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  // Rendered only in the browser. Nothing here is server-rendered today, but an
  // overlay that reaches for `document` at module scope is the kind of thing
  // that breaks a build the first time anything is.
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className={clsx('fixed inset-0', className)} {...rest}>
      {children}
    </div>,
    document.body,
  )
}
