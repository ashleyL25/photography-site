import { useId, useState } from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { repeaterRow, type FieldDef, type VisibleWhen } from '@shared/widgets'
import {
  inputClass,
  Label,
  MultiChoice,
  NumberField,
  Segmented,
  Select,
  Switch,
  SwatchField,
  TextArea,
  TextInput,
} from './controls'
import { RichTextEditor } from './RichTextEditor'
import { MediaField, MediaListField } from './MediaPicker'
import { CollectionPicker } from './CollectionPicker'
import { CategorySelect, GuideSelect, OrderedPicker, SessionSelect } from './ContentPickers'
import { ArtworkChoice, ElementField } from './ArtworkFields'
import { FontField, ThemeColorField } from './ThemeFields'

/**
 * Renders a field schema as a form.
 *
 * This is what makes the whole dashboard possible at this size: the widget
 * library, the portfolio piece types and the theme settings are all descriptions
 * of fields, and all three are edited by this one component. Adding a control to
 * a widget is a line in `shared/widgets.ts` — there is no form to write.
 *
 * Values are addressed by path (`['image', 'alt']`, `['buttons', 1, 'label']`)
 * and written immutably, so the editor's undo-by-cancel and its dirty check both
 * work by comparing objects rather than by tracking every control.
 */

export type FieldValue = Record<string, unknown>

export function FieldList({
  fields,
  values,
  onChange,
  collectionKind,
  openGroups = false,
}: {
  fields: readonly FieldDef[]
  values: FieldValue
  onChange: (next: FieldValue) => void
  /** Which content type a `collection` field in this schema picks from. */
  collectionKind?: 'post'
  /** Groups start open — for settings screens, where the groups are the content. */
  openGroups?: boolean
}) {
  function set(name: string, value: unknown) {
    onChange({ ...values, [name]: value })
  }

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        if (!isVisible(field, values)) return null
        return (
          <Field
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(value) => set(field.name, value)}
            collectionKind={collectionKind}
            openGroups={openGroups}
          />
        )
      })}
    </div>
  )
}

/**
 * Conditional fields.
 *
 * `visibleWhen.equals` is a list of values, plus the sentinel `__truthy__` for
 * "whenever that field has anything in it" — which is what the background
 * overlay and parallax controls need, since they depend on an image having been
 * chosen rather than on it being any particular image.
 *
 * Several conditions are read as "and": the piece cover's overlay color depends
 * both on the cover being an image and on the overlay being switched on, and
 * either test alone would leave it showing under a cloth binding.
 */
function isVisible(field: FieldDef, values: FieldValue): boolean {
  if (!field.visibleWhen) return true
  const conditions: readonly VisibleWhen[] = Array.isArray(field.visibleWhen)
    ? field.visibleWhen
    : [field.visibleWhen]
  return conditions.every((condition) => {
    const current = values[condition.field]
    return condition.equals.some((expected) =>
      expected === '__truthy__' ? Boolean(current) : current === expected,
    )
  })
}

function Field({
  field,
  value,
  onChange,
  collectionKind,
  openGroups = false,
}: {
  field: FieldDef
  value: unknown
  onChange: (value: unknown) => void
  collectionKind?: 'post'
  openGroups?: boolean
}) {
  const id = useId()

  /* ------------------------------------------------------- Group */
  if (field.type === 'group') {
    return (
      <Collapsible title={field.label} help={field.help} defaultOpen={openGroups}>
        <FieldList
          fields={field.children ?? []}
          values={(value ?? {}) as FieldValue}
          onChange={onChange}
          collectionKind={collectionKind}
        />
      </Collapsible>
    )
  }

  /* ------------------------------------------------------- Repeater */
  if (field.type === 'repeater') {
    return (
      <Repeater
        field={field}
        rows={Array.isArray(value) ? (value as FieldValue[]) : []}
        onChange={onChange}
        collectionKind={collectionKind}
      />
    )
  }

  /* ------------------------------------------------------- Collection */
  if (field.type === 'collection') {
    return (
      <div>
        <Label help={field.help}>{field.label}</Label>
        <CollectionPicker value={value} onChange={(next) => onChange(next)} />
      </div>
    )
  }

  /* ------------------------------------------------------- Boolean */
  if (field.type === 'boolean') {
    return (
      <div>
        <Switch
          id={id}
          checked={value === true}
          onChange={onChange}
          label={field.label}
        />
        {field.help && <p className="mt-1.5 ml-14 text-xs text-faint">{field.help}</p>}
      </div>
    )
  }

  const control = (() => {
    switch (field.type) {
      case 'textarea':
        return (
          <TextArea
            id={id}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            placeholder={field.placeholder}
            rows={3}
          />
        )

      case 'richtext':
        return (
          <RichTextEditor
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            placeholder={field.placeholder}
          />
        )

      case 'number':
        // Without a declared range a slider means nothing — a price has no
        // natural maximum — so it is a plain number box instead.
        if (field.max === undefined) {
          return (
            <div className="flex items-center gap-2">
              {field.suffix === '$' && <span className="text-sm text-faint">$</span>}
              <input
                id={id}
                type="number"
                min={field.min ?? 0}
                step={field.step ?? 1}
                value={typeof value === 'number' ? value : 0}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                className={clsx(inputClass, 'w-36')}
              />
              {field.suffix && field.suffix !== '$' && <span className="text-xs text-faint">{field.suffix}</span>}
            </div>
          )
        }
        return (
          <NumberField
            id={id}
            value={typeof value === 'number' ? value : (field.default as number) || 0}
            onChange={onChange}
            min={field.min ?? 0}
            max={field.max ?? 100}
            step={field.step ?? 1}
            suffix={field.suffix}
          />
        )

      case 'choice': {
        const options = field.options ?? []

        if (field.artwork) {
          return <ArtworkChoice value={typeof value === 'string' ? value : ''} onChange={onChange} options={options} />
        }

        // Two or three short options read better as a segmented control; more
        // than that, or anything wordy, belongs in a select.
        const short =
          options.length <= 3 && options.every((o) => o.label.length <= 14)
        return short ? (
          <Segmented
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            options={options}
          />
        ) : (
          <Select
            id={id}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            options={options}
          />
        )
      }

      case 'multichoice':
        return (
          <MultiChoice
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={onChange}
            options={field.options ?? []}
          />
        )

      case 'sessions':
      case 'albums':
        return (
          <OrderedPicker
            kind={field.type}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={onChange}
          />
        )

      case 'color':
        return <ThemeColorField id={id} value={typeof value === 'string' ? value : ''} onChange={onChange} />

      case 'font':
        return <FontField id={id} value={typeof value === 'string' ? value : ''} onChange={onChange} />

      case 'session':
        return <SessionSelect id={id} value={typeof value === 'string' ? value : ''} onChange={onChange} />

      case 'guide':
        return <GuideSelect id={id} value={typeof value === 'string' ? value : ''} onChange={onChange} />

      case 'category':
        return <CategorySelect id={id} value={typeof value === 'string' ? value : ''} onChange={onChange} />

      case 'image':
        // Options on an image field are built-in artwork offered beside the library.
        return field.options ? (
          <ElementField value={typeof value === 'string' ? value : ''} onChange={onChange} options={field.options} />
        ) : (
          <MediaField value={typeof value === 'string' ? value : ''} onChange={onChange} />
        )

      case 'swatch':
        return <SwatchField value={typeof value === 'string' ? value : 'accent'} onChange={onChange} />

      case 'images':
        return (
          <MediaListField
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={onChange}
          />
        )

      case 'lines':
        // One item per line: far quicker to edit than a repeater of single
        // fields, and pasting a list from anywhere just works. The trailing
        // empty line is kept while typing so Enter starts a new item.
        return (
          <LinesField id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />
        )

      case 'link':
        return (
          <TextInput
            id={id}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            placeholder={field.placeholder ?? '/portfolio, #section or https://…'}
          />
        )

      default:
        return (
          <TextInput
            id={id}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            placeholder={field.placeholder}
          />
        )
    }
  })()

  return (
    <div className={clsx(field.wide && 'col-span-full')}>
      <Label htmlFor={id} help={field.help}>
        {field.label}
      </Label>
      {control}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Group
 * ------------------------------------------------------------------ */

function Collapsible({
  title,
  help,
  children,
  defaultOpen = false,
}: {
  title: string
  help?: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-[3px] border border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="text-faint"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
            <path d="m9 5 7 7-7 7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.span>
        <span className="label flex-1 text-muted">{title}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-4 py-5">
              {help && <p className="mb-4 text-xs text-faint">{help}</p>}
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Repeater
 * ------------------------------------------------------------------ */

/**
 * A list of repeating rows — buttons, timeline entries, accordion items.
 *
 * Reordering is by explicit up/down buttons rather than drag-and-drop. Drag is
 * nicer with a mouse and considerably worse with a trackpad inside a scrolling
 * panel, which is where this lives; and buttons work from the keyboard without
 * any extra machinery.
 */
function Repeater({
  field,
  rows,
  onChange,
  collectionKind,
}: {
  field: FieldDef
  rows: FieldValue[]
  onChange: (rows: FieldValue[]) => void
  collectionKind?: 'post'
}) {
  const [openRow, setOpenRow] = useState<number | null>(rows.length === 0 ? null : 0)

  const noun = field.itemLabel ?? 'Item'
  const atMax = field.maxItems !== undefined && rows.length >= field.maxItems

  function update(index: number, next: FieldValue) {
    onChange(rows.map((row, i) => (i === index ? next : row)))
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= rows.length) return
    const next = [...rows]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    setOpenRow(target)
  }

  function add() {
    onChange([...rows, repeaterRow(field)])
    setOpenRow(rows.length)
  }

  return (
    <div>
      <Label help={field.help}>{field.label}</Label>

      <div className="space-y-2">
        {rows.map((row, index) => {
          const open = openRow === index
          return (
            <div key={index} className="rounded-[3px] border border-line bg-canvas">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpenRow(open ? null : index)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  aria-expanded={open}
                >
                  <span className="label w-6 shrink-0 text-faint">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-muted">
                    {rowSummary(row) || `${noun} ${index + 1}`}
                  </span>
                </button>

                <RowButton onClick={() => move(index, -1)} disabled={index === 0} label="Move up">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                    <path d="m6 15 6-6 6 6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </RowButton>
                <RowButton
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  label="Move down"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                    <path d="m6 9 6 6 6-6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </RowButton>
                <RowButton
                  onClick={() => {
                    onChange(rows.filter((_, i) => i !== index))
                    setOpenRow(null)
                  }}
                  label={`Remove ${noun.toLowerCase()}`}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                    <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </RowButton>
              </div>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-line px-4 py-5">
                      <FieldList
                        fields={field.children ?? []}
                        values={row}
                        onChange={(next) => update(index, next)}
                        collectionKind={collectionKind}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={add}
        disabled={atMax}
        className={clsx(
          'label mt-3 inline-flex items-center gap-2 text-gilt transition-opacity',
          atMax && 'cursor-not-allowed opacity-40',
        )}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
          <path d="M12 5v14M5 12h14" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add {noun.toLowerCase()}
        {atMax && ` (max ${field.maxItems})`}
      </button>
    </div>
  )
}

/**
 * A one-line description of a collapsed row.
 *
 * Takes the first plain-text field with something in it, so a row header reads
 * "Read the piece" or "2025–2026" rather than "Button 1". Rich text is stripped
 * rather than skipped, because for an accordion row the answer is often the only
 * field filled in.
 */
function rowSummary(row: FieldValue): string {
  for (const key of ['title', 'label', 'name', 'period', 'value', 'quote', 'alt', 'caption', 'body']) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) {
      const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      if (text) return text.length > 70 ? `${text.slice(0, 70)}…` : text
    }
  }
  return ''
}

function RowButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        'grid size-8 shrink-0 place-items-center text-faint transition-colors hover:text-gilt',
        disabled && 'cursor-not-allowed opacity-30 hover:text-faint',
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ *
 * One item per line
 * ------------------------------------------------------------------ */

function LinesField({ id, value, onChange }: { id: string; value: string[]; onChange: (value: string[]) => void }) {
  // The raw text is held locally so an empty line being typed is not stripped
  // out from under the cursor; the list is what gets saved.
  const [draft, setDraft] = useState(value.join('\n'))
  const [lastSaved, setLastSaved] = useState(value)
  if (value !== lastSaved && value.join('\n') !== draft.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')) {
    setLastSaved(value)
    setDraft(value.join('\n'))
  }

  return (
    <TextArea
      id={id}
      value={draft}
      rows={Math.min(14, Math.max(3, draft.split('\n').length + 1))}
      onChange={(next) => {
        setDraft(next)
        const items = next.split('\n').map((l) => l.trim()).filter(Boolean)
        setLastSaved(items)
        onChange(items)
      }}
      placeholder="One per line"
    />
  )
}
