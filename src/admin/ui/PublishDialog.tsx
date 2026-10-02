import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Ornament } from './Brand'
import { useEscape } from '@/admin/hooks'
import { Overlay } from './Overlay'

export interface PublishResult {
  status: 'published' | 'draft'
  /** The public path, e.g. `/blog/notes-on-editing`. */
  path: string
  /** Whether it was already live before this action. Decides the wording. */
  wasPublished: boolean
}

/**
 * What appears after a publish, an update, or a return to draft.
 *
 * It exists to answer the one question the dashboard cannot otherwise answer:
 * *where is it now?* A toast saying "Saved" leaves Ashley hunting for the URL to
 * check it or send it, so this shows the address, offers to open it, and offers
 * to copy it — which between them cover every reason anyone looks at this dialog.
 *
 * It appears after the action rather than before it. The confirmation already
 * happened, by holding the button.
 */
export function PublishDialog({
  result,
  onClose,
}: {
  result: PublishResult | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  useEscape(onClose, Boolean(result))

  if (!result) return null

  const { status, path, wasPublished } = result
  const url = `${location.origin}${path}`

  const heading =
    status === 'draft'
      ? 'Back to draft'
      : wasPublished
        ? 'Your page has been updated'
        : 'Your page has been published'

  const blurb =
    status === 'draft'
      ? 'It is no longer visible on the site. Everything you wrote is still here.'
      : wasPublished
        ? 'The live page now shows your changes.'
        : 'It is live and anyone with the link can read it.'

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Some browsers refuse clipboard access without a gesture they recognize.
      // The address is on screen and selectable, so there is nothing to recover.
    }
  }

  return (
    <AnimatePresence>
      <Overlay className="z-[10080] grid place-items-center px-6" role="dialog" aria-modal="true">
        <motion.button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-canvas/85 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        />

        <motion.div
          className="relative w-full max-w-lg rounded-[var(--card-radius)] border border-line bg-surface p-10 text-center shadow-[0_40px_90px_-30px_rgb(0_0_0/0.7)]"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex justify-center">
            <Ornament className="h-3 w-32 text-gilt/55" />
          </div>

          <h2 className="display mt-7 text-h3">{heading}</h2>
          <p className="mt-4 text-muted">{blurb}</p>

          {status === 'published' && (
            <>
              <div className="mt-9 rounded-[var(--card-radius)] border border-line bg-canvas px-5 py-4">
                <p className="label mb-2 text-faint">Address</p>
                <p className="font-mono text-sm break-all text-gilt">{url}</p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a href={path} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  Open the page
                </a>
                <button type="button" onClick={copy} className="btn btn-secondary">
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="label mt-8 text-faint transition-colors hover:text-gilt"
          >
            {status === 'published' ? 'Keep editing' : 'Close'}
          </button>
        </motion.div>
      </Overlay>
    </AnimatePresence>
  )
}
