import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

/**
 * The rich-text field.
 *
 * ## Why `contentEditable` and `execCommand`
 *
 * `document.execCommand` is deprecated, and it is still the right choice here.
 * The alternative is a editor framework — ProseMirror, Lexical, TipTap — each of
 * which is 100–300 KB and, more to the point, a schema to keep in step with the
 * sanitizer on the server. This field produces a handful of tags: paragraphs,
 * emphasis, links, lists, a heading level or two. `execCommand` produces exactly
 * those in every browser that ships today, and the server's allowlist is the
 * thing that actually decides what survives.
 *
 * Deprecated here means "no longer specified and no longer changing", not
 * "removed" — no browser has a removal plan, because removing it would break a
 * large fraction of the web's editors. If one ever does, the replacement is a
 * contained change to this one file.
 *
 * ## The two rules that make contentEditable behave
 *
 *   1. **Never** write `value` back into the DOM while the field has focus.
 *      React would replace the node the caret lives in, and the caret jumps to
 *      the start on every keystroke. So the DOM is the source of truth while
 *      editing, and `value` is only pushed in when it differs *and* the field is
 *      not focused.
 *   2. Paste is intercepted and reduced to plain text unless it is already
 *      simple HTML. A paste from Word otherwise arrives carrying `<style>`
 *      blocks and a hundred spans, and while the server strips them, it is the
 *      difference between what she sees and what she gets.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 150,
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [focused, setFocused] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const savedRange = useRef<Range | null>(null)

  // Rule 1: only sync inward when not being edited.
  useEffect(() => {
    const node = ref.current
    if (!node || focused) return
    if (node.innerHTML !== value) node.innerHTML = value || ''
  }, [value, focused])

  const emit = useCallback(() => {
    const node = ref.current
    if (!node) return
    // An empty contentEditable reports `<br>`, which would be stored as content
    // and then render as a mysterious blank line.
    const html = node.innerHTML
    onChange(html === '<br>' || html === '<div><br></div>' ? '' : html)
  }, [onChange])

  function exec(command: string, argument?: string) {
    ref.current?.focus()
    document.execCommand(command, false, argument)
    emit()
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')

    /**
     * Simple HTML is kept, everything else becomes text.
     *
     * "Simple" means it carries no style attributes, no class attributes and no
     * Microsoft Office namespace — which is the honest test for "came from a
     * website" versus "came from Word or Google Docs".
     */
    const simple =
      html &&
      !/style\s*=/i.test(html) &&
      !/class\s*=/i.test(html) &&
      !/<(o:p|xml|style)/i.test(html)

    document.execCommand('insertHTML', false, simple ? html : escapeToParagraphs(text))
    emit()
  }

  function openLink() {
    const selection = getSelection()
    // The selection is lost the moment focus moves to the URL field, so it is
    // captured here and restored before the link is applied.
    savedRange.current = selection && selection.rangeCount > 0 ? selection.getRangeAt(0).cloneRange() : null
    setLinkUrl('')
    setLinkOpen(true)
  }

  function applyLink() {
    const node = ref.current
    if (!node) return

    node.focus()
    if (savedRange.current) {
      const selection = getSelection()
      selection?.removeAllRanges()
      selection?.addRange(savedRange.current)
    }

    const url = linkUrl.trim()
    if (url) {
      // A bare domain typed into the field is meant as an external link, and
      // `createLink` would otherwise make it relative to the current page.
      const href = /^(https?:|mailto:|tel:|\/|#)/i.test(url) ? url : `https://${url}`
      document.execCommand('createLink', false, href)
    } else {
      document.execCommand('unlink')
    }

    setLinkOpen(false)
    emit()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey
    if (!meta) return

    const key = e.key.toLowerCase()
    if (key === 'b') {
      e.preventDefault()
      exec('bold')
    } else if (key === 'i') {
      e.preventDefault()
      exec('italic')
    } else if (key === 'k') {
      e.preventDefault()
      openLink()
    }
  }

  const empty = !value || value === '<br>'

  return (
    <div
      className={clsx(
        'rounded-[3px] border bg-canvas transition-colors',
        focused ? 'border-gilt' : 'border-line',
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
        <ToolButton onClick={() => exec('bold')} title="Bold (⌘B)">
          <span className="font-bold">B</span>
        </ToolButton>
        <ToolButton onClick={() => exec('italic')} title="Italic (⌘I)">
          <span className="italic">I</span>
        </ToolButton>
        <ToolButton onClick={() => exec('underline')} title="Underline">
          <span className="underline">U</span>
        </ToolButton>

        <Divider />

        <ToolButton onClick={() => exec('formatBlock', '<h2>')} title="Heading">
          H2
        </ToolButton>
        <ToolButton onClick={() => exec('formatBlock', '<h3>')} title="Sub-heading">
          H3
        </ToolButton>
        <ToolButton onClick={() => exec('formatBlock', '<p>')} title="Paragraph">
          ¶
        </ToolButton>
        <ToolButton onClick={() => exec('formatBlock', '<blockquote>')} title="Quote">
          &ldquo;
        </ToolButton>

        <Divider />

        <ToolButton onClick={() => exec('insertUnorderedList')} title="Bulleted list">
          <ListIcon ordered={false} />
        </ToolButton>
        <ToolButton onClick={() => exec('insertOrderedList')} title="Numbered list">
          <ListIcon ordered />
        </ToolButton>

        <Divider />

        <ToolButton onClick={openLink} title="Link (⌘K)">
          <LinkIcon />
        </ToolButton>
        <ToolButton onClick={() => exec('unlink')} title="Remove link">
          <LinkIcon broken />
        </ToolButton>

        <Divider />

        <ToolButton
          onClick={() => exec('removeFormat')}
          title="Clear formatting"
          className="ml-auto"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
            <path d="M6 5h12M9 19h6M13 5 10 19" strokeWidth="1.4" strokeLinecap="round" />
            <path d="m4 15 5 5" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </ToolButton>
      </div>

      <div className="relative">
        {empty && placeholder && !focused && (
          <span className="pointer-events-none absolute top-3.5 left-4 text-sm text-faint/60">
            {placeholder}
          </span>
        )}

        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={emit}
          onBlur={() => {
            setFocused(false)
            emit()
          }}
          onFocus={() => setFocused(true)}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          className="prose max-w-none px-4 py-3.5 text-sm leading-relaxed outline-none [&_h2]:text-lg [&_h3]:text-base"
          style={{ minHeight }}
        />
      </div>

      {linkOpen && (
        <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyLink()
              }
              if (e.key === 'Escape') setLinkOpen(false)
            }}
            placeholder="https://… or /portfolio"
            className="flex-1 rounded-[3px] border border-line bg-canvas px-3 py-1.5 text-xs outline-none focus:border-gilt"
          />
          <button type="button" onClick={applyLink} className="label px-2 py-1.5 text-gilt">
            Apply
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen(false)}
            className="label px-2 py-1.5 text-faint"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function ToolButton({
  onClick,
  title,
  children,
  className,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      // `onMouseDown` with preventDefault, not `onClick`: a click would move
      // focus out of the editable region first, and the selection the command
      // is meant to act on would already be gone.
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={clsx(
        'grid h-8 min-w-8 place-items-center rounded-[2px] px-1.5 text-xs text-muted transition-colors hover:bg-ink/5 hover:text-gilt',
        className,
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-line" />
}

function ListIcon({ ordered }: { ordered: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
      <path d="M9 6h11M9 12h11M9 18h11" strokeWidth="1.4" strokeLinecap="round" />
      {ordered ? (
        <text x="3" y="8" fontSize="7" fill="currentColor" stroke="none">
          1
        </text>
      ) : (
        <>
          <circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  )
}

function LinkIcon({ broken = false }: { broken?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
      <path
        d="M10 13a5 5 0 0 0 7.1 0l2.4-2.4a5 5 0 0 0-7.1-7.1L11 4.9"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M14 11a5 5 0 0 0-7.1 0L4.5 13.4a5 5 0 0 0 7.1 7.1L13 19.1"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {broken && <path d="m3 3 18 18" strokeWidth="1.4" strokeLinecap="round" />}
    </svg>
  )
}

/** Plain text turned into paragraphs, with blank lines as the break. */
function escapeToParagraphs(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${escape(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}
