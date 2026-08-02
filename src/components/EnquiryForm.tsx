import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { ENQUIRY_SUBJECTS, SITE } from '@/data/site'
import { Reveal } from './motion'

/** Where the form posts. The bundled PHP handler works as-is on Hostinger. */
const ENDPOINT = '/php/contact.php'

type Status = 'idle' | 'sending' | 'sent' | 'error'

/**
 * `onPhoto` is for the scrimmed homepage block, `onCanvas` for the contact
 * page where the form sits on the themed background.
 */
type Tone = 'onPhoto' | 'onCanvas'

const TONE = {
  onPhoto: {
    label: 'text-beige/55 group-focus-within:text-champagne',
    input: 'border-beige/25 text-beige placeholder:text-beige/30 focus:border-champagne',
    option: 'bg-charcoal text-beige',
    button:
      'border-beige text-beige hover:text-charcoal disabled:opacity-50 [--sweep:var(--color-champagne)]',
    panel: 'border-beige/20',
    heading: 'text-champagne',
    body: 'text-beige/70',
    note: 'text-champagne',
  },
  onCanvas: {
    label: 'text-faint group-focus-within:text-accent',
    input: 'border-line text-ink placeholder:text-faint focus:border-accent',
    option: 'bg-canvas text-ink',
    button:
      'border-ink text-ink hover:text-canvas disabled:opacity-50 [--sweep:var(--color-accent)]',
    panel: 'border-line',
    heading: 'text-accent',
    body: 'text-muted',
    note: 'text-accent',
  },
} satisfies Record<Tone, Record<string, string>>

function Field({
  label,
  tone,
  children,
}: {
  label: string
  tone: Tone
  children: ReactNode
}) {
  return (
    <label className="group block">
      <span className={clsx('label mb-3 block transition-colors', TONE[tone].label)}>{label}</span>
      {children}
    </label>
  )
}

export function EnquiryForm({
  tone = 'onPhoto',
  action = 'Start an enquiry',
}: {
  tone?: Tone
  action?: string
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const t = TONE[tone]

  const inputClass = clsx(
    'w-full border-b bg-transparent pb-3 text-[1.05rem] transition-colors duration-300 outline-none',
    t.input,
  )

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))

    // Honeypot: bots fill hidden fields, humans never see them.
    if (data.website) return

    setStatus('sending')
    setError('')
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      setStatus('sent')
      form.reset()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <AnimatePresence mode="wait">
      {status === 'sent' ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'flex h-full min-h-[24rem] flex-col justify-center border p-10 text-center md:p-16',
            t.panel,
          )}
        >
          <p className={clsx('display text-[clamp(2rem,4vw,3rem)]', t.heading)}>Message sent.</p>
          <p className={clsx('mx-auto mt-5 max-w-sm leading-relaxed', t.body)}>
            Thank you — I will get back to you within a couple of days. If it is urgent, a DM on
            Instagram is the fastest way to reach me.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={submit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-9 sm:grid-cols-2"
          noValidate
        >
          <Reveal>
            <Field label="Your name" tone={tone}>
              <input
                name="name"
                required
                autoComplete="name"
                placeholder="Jane Doe"
                className={inputClass}
              />
            </Field>
          </Reveal>

          <Reveal delay={0.06}>
            <Field label="Email" tone={tone}>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jane@example.com"
                className={inputClass}
              />
            </Field>
          </Reveal>

          <Reveal delay={0.12} className="sm:col-span-2">
            <Field label="What is this about?" tone={tone}>
              <select name="subject" required defaultValue="" className={inputClass}>
                <option value="" disabled className={t.option}>
                  Choose one
                </option>
                {ENQUIRY_SUBJECTS.map((s) => (
                  <option key={s} value={s} className={t.option}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </Reveal>

          <Reveal delay={0.18} className="sm:col-span-2">
            <Field label="Tell me about it" tone={tone}>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Who is in the photos, roughly when, and where you picture it."
                className={clsx(inputClass, 'resize-none')}
              />
            </Field>
          </Reveal>

          {/* Honeypot — visually and semantically hidden from people. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="pointer-events-none absolute -left-[9999px] opacity-0"
          />

          <Reveal delay={0.24} className="flex flex-wrap items-center gap-6 sm:col-span-2">
            <button
              type="submit"
              disabled={status === 'sending'}
              className={clsx(
                'label group relative overflow-hidden rounded-full border px-10 py-4 transition-colors duration-500',
                t.button,
              )}
            >
              <span className="relative z-10">
                {status === 'sending' ? 'Sending…' : action}
              </span>
              <span className="absolute inset-0 origin-bottom scale-y-0 bg-[var(--sweep)] transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-y-100" />
            </button>

            {status === 'error' && (
              <p role="alert" className={clsx('text-[0.85rem]', t.note)}>
                Could not send ({error}). Email{' '}
                <a className="underline" href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>{' '}
                instead.
              </p>
            )}
          </Reveal>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
