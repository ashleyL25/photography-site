import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { useInquirySettings, useSite, useSiteInfo } from '@/lib/site'
import { Reveal } from './motion'

/** Where the form posts: stored, then emailed, by the site's own API. */
const ENDPOINT = '/api/inquiry'

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
    hint: 'text-beige/45',
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
    hint: 'text-faint',
  },
} satisfies Record<Tone, Record<string, string>>

function Field({
  label,
  tone,
  optional,
  children,
}: {
  label: string
  tone: Tone
  optional?: boolean
  children: ReactNode
}) {
  return (
    <label className="group block">
      <span className={clsx('label mb-3 block transition-colors', TONE[tone].label)}>
        {label}
        {optional && <span className="ml-2 opacity-60">optional</span>}
      </span>
      {children}
    </label>
  )
}

export function InquiryForm({
  tone = 'onPhoto',
  action = 'Start an inquiry',
}: {
  tone?: Tone
  action?: string
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const { sessions } = useSite()
  const site = useSiteInfo()
  const INQUIRY = useInquirySettings()

  // A session page links here as /contact?session=seniors, so the first select
  // arrives already answered.
  const [params] = useSearchParams()
  const preset = sessions.find((s) => s.slug === params.get('session'))?.title ?? ''
  const [chosen, setSession] = useState<string | null>(null)
  // The sessions arrive with the site payload, which may land after this form
  // mounts — so the preset is read live until somebody picks something.
  const session = chosen ?? preset

  const t = TONE[tone]

  const inputClass = clsx(
    'site-field w-full border-b bg-transparent pb-3 text-[1.05rem] transition-colors duration-300 outline-none',
    t.input,
  )

  // The tier select only makes sense once a real session type is chosen, and
  // its options come from that session's own ladder.
  const picked = INQUIRY.sessionFor(session)
  const tiers = picked && picked.tiers.length > 0 ? picked.tiers : undefined
  const hidePrices = picked ? !picked.pricesShown : true

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data: Record<string, unknown> = { ...Object.fromEntries(new FormData(form)), sourcePath: window.location.pathname }

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
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Server responded ${res.status}`)
      }
      setStatus('sent')
      form.reset()
      setSession('')
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
          <p className={clsx('display text-[calc(clamp(2rem,4vw,3rem)*var(--hs,1))]', t.heading)}>{INQUIRY.sentHeading}</p>
          <p className={clsx('mx-auto mt-5 max-w-sm leading-relaxed', t.body)}>{INQUIRY.sentBody}</p>
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

          <Reveal delay={0.1}>
            <Field label="Phone" tone={tone} optional>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="515 555 0100"
                className={inputClass}
              />
            </Field>
          </Reveal>

          <Reveal delay={0.14}>
            <Field label="Which session?" tone={tone}>
              <select
                name="session"
                required
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled className={t.option}>
                  Choose one
                </option>
                {INQUIRY.sessions.map((s) => (
                  <option key={s} value={s} className={t.option}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </Reveal>

          {/* Appears once a session type is picked. Not required — plenty of
              people genuinely do not know yet, and that is a valid answer. */}
          <AnimatePresence initial={false}>
            {tiers && (
              <motion.div
                key="tier"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <Field label="Which tier are you thinking?" tone={tone} optional>
                  <select name="tier" defaultValue="" className={inputClass}>
                    <option value={INQUIRY.undecided} className={t.option}>
                      {INQUIRY.undecided}
                    </option>
                    {tiers.map((tier) => {
                      // The label carries the price so the mail says which tier
                      // at which figure — except where the price is private, in
                      // which case this select would be the one place it leaked.
                      const label = hidePrices ? tier.name : `${tier.name} — ${tier.price}`
                      return (
                        <option key={tier.id} value={label} className={t.option}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </Field>
              </motion.div>
            )}
          </AnimatePresence>

          <Reveal delay={0.18}>
            <Field label="When are you hoping for?" tone={tone}>
              <select name="timeframe" required defaultValue="" className={inputClass}>
                <option value="" disabled className={t.option}>
                  Choose one
                </option>
                {INQUIRY.timeframes.map((s) => (
                  <option key={s} value={s} className={t.option}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </Reveal>

          <Reveal delay={0.22}>
            <Field label="Where do you picture it?" tone={tone} optional>
              <input
                name="location"
                placeholder="A park, downtown, our own backyard…"
                className={inputClass}
              />
            </Field>
          </Reveal>

          <Reveal delay={0.26}>
            <Field label="How did you find me?" tone={tone} optional>
              <select name="heardFrom" defaultValue="" className={inputClass}>
                <option value="" className={t.option}>
                  No need to say
                </option>
                {INQUIRY.heardFrom.map((s) => (
                  <option key={s} value={s} className={t.option}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </Reveal>

          <Reveal delay={0.3} className="sm:col-span-2">
            <Field label="Tell me about it" tone={tone}>
              <textarea
                name="message"
                required
                rows={5}
                placeholder="Who is in the photos, what you have in mind, and anything you are unsure about."
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

          <Reveal delay={0.34} className="flex flex-wrap items-center gap-6 sm:col-span-2">
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

            <p className={clsx('text-[0.82rem]', t.hint)}>{INQUIRY.hint}</p>

            {status === 'error' && (
              <p role="alert" className={clsx('text-[0.85rem]', t.note)}>
                Could not send ({error}). Email{' '}
                <a className="underline" href={`mailto:${site.email}`}>
                  {site.email}
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
