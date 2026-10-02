import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { POST_TEMPLATES } from '@shared/templates'
import { useEscape, useScrollLock } from '@/admin/hooks'
import { Label, TextInput } from '../ui/controls'
import { Overlay } from '../ui/Overlay'

/**
 * Starting a post.
 *
 * A title and a template. The templates are shown with their actual structure
 * spelled out, section by section — "Rich text, pull quote, rich text, author
 * card" — rather than as a thumbnail, because a thumbnail of a text layout is
 * five gray rectangles and tells nobody anything.
 *
 * Applying a template creates exactly those sections and then forgets it. There
 * is no live link, so a post can be rearranged afterwards without a template
 * reasserting itself, and editing a template never touches a published post.
 */
export function NewPostDialog({
  open,
  onClose,
  onCreate,
  busy,
}: {
  open: boolean
  onClose: () => void
  onCreate: (title: string, template: string) => void
  busy: boolean
}) {
  const [title, setTitle] = useState('')
  const [template, setTemplate] = useState('essay')

  useScrollLock(open)
  useEscape(onClose, open)

  if (!open) return null

  return (
    <AnimatePresence>
      <Overlay className="z-[10070] flex items-center justify-center p-4 md:p-10">
        <motion.button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 bg-canvas/88 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--card-radius)] border border-line bg-surface"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <header className="border-b border-line px-7 py-5">
            <h2 className="display text-xl">A new post</h2>
            <p className="mt-1 text-xs text-faint">
              Pick a starting point. You can add, remove and reorder sections afterwards.
            </p>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
            <div className="mb-8">
              <Label htmlFor="new-post-title">Working title</Label>
              <TextInput
                id="new-post-title"
                value={title}
                onChange={setTitle}
                placeholder="Untitled post"
              />
              <p className="mt-2 text-xs text-faint">
                The address follows this until you override it. Change it whenever you like.
              </p>
            </div>

            <Label>Template</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {POST_TEMPLATES.map((item) => {
                const active = item.id === template
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplate(item.id)}
                    aria-pressed={active}
                    className={clsx(
                      'flex flex-col rounded-[3px] border bg-canvas p-5 text-left transition-all duration-300',
                      active
                        ? 'border-gilt ring-1 ring-gilt'
                        : 'border-line hover:-translate-y-0.5 hover:border-gilt/60',
                    )}
                  >
                    <span className="display text-lg">{item.name}</span>
                    <span className="mt-1.5 text-xs leading-relaxed text-faint">{item.tagline}</span>

                    {item.outline.length > 0 && (
                      <ol className="mt-4 space-y-1.5 border-t border-line pt-4">
                        {item.outline.map((line, i) => (
                          <li key={i} className="flex gap-2.5 text-xs text-muted">
                            <span className="shrink-0 text-faint/70">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            {line}
                          </li>
                        ))}
                      </ol>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-line px-7 py-4">
            <button type="button" onClick={onClose} className="label px-3 py-2 text-faint hover:text-ink">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onCreate(title.trim() || 'Untitled post', template)}
              disabled={busy}
              className="btn btn-primary py-3 text-[0.62rem] disabled:opacity-50"
            >
              {busy ? 'Creating…' : 'Start writing'}
            </button>
          </footer>
        </motion.div>
      </Overlay>
    </AnimatePresence>
  )
}
