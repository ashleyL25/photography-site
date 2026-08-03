import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { CONTACT_PAGE, FAQ, SITE } from '@/data/site'
import { BOOKING } from '@/data/packages'
import { PageHero } from '@/components/PageHero'
import { Investment } from '@/sections/Investment'
import { Delivery } from '@/sections/Delivery'
import { InquiryForm } from '@/components/InquiryForm'
import { DrawRule, MaskText, Reveal } from '@/components/motion'
import { useDocumentMeta } from '@/lib/hooks'

function Question({
  item,
  open,
  onToggle,
}: {
  item: { q: string; a: string }
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-line">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="group flex w-full items-center justify-between gap-8 py-6 text-left"
        >
          <span
            className={clsx(
              'text-[1.08rem] transition-colors duration-400',
              open ? 'text-accent' : 'text-ink group-hover:text-accent',
            )}
          >
            {item.q}
          </span>
          <span className="relative grid size-6 shrink-0 place-items-center">
            <span className="absolute h-px w-4 bg-current transition-colors duration-400 group-hover:bg-accent" />
            <motion.span
              className="absolute h-4 w-px bg-current transition-colors duration-400 group-hover:bg-accent"
              animate={{ scaleY: open ? 0 : 1, rotate: open ? 90 : 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pr-10 pb-7 text-[1rem] leading-[1.85] text-muted">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ContactPage() {
  useDocumentMeta(
    'Contact — Ashley Photography',
    'Pricing and inquiries for senior, graduation, engagement, couples, family and pet sessions across the Des Moines metro and central Iowa.',
  )

  const [open, setOpen] = useState<number | null>(0)
  const [openTerm, setOpenTerm] = useState<number | null>(0)

  return (
    <>
      <PageHero
        eyebrow={CONTACT_PAGE.eyebrow}
        heading={CONTACT_PAGE.heading}
        body={CONTACT_PAGE.body}
        photoId={CONTACT_PAGE.photoId}
      />

      <section id="inquire" className="shell grid gap-16 scroll-mt-24 py-24 md:py-32 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-7">
          <Reveal className="label text-accent">The form</Reveal>
          <div className="mt-10">
            <InquiryForm tone="onCanvas" action="Send it" />
          </div>
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <Reveal className="label text-faint">Or the direct route</Reveal>

          <dl className="mt-10 space-y-8">
            <Reveal>
              <dt className="label text-faint">Email</dt>
              <dd className="mt-2">
                <a
                  href={`mailto:${SITE.email}`}
                  className="border-b border-line pb-1 text-[1.05rem] text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {SITE.email}
                </a>
              </dd>
            </Reveal>

            <Reveal delay={0.08}>
              <dt className="label text-faint">Instagram</dt>
              <dd className="mt-2">
                <a
                  href={SITE.instagram}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 border-b border-line pb-1 text-[1.05rem] text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  {SITE.instagramHandle}
                  <span aria-hidden>↗</span>
                </a>
              </dd>
            </Reveal>

            {[
              { term: 'Based in', detail: SITE.base },
              { term: 'Traveling to', detail: SITE.serves },
              { term: 'Typically replies', detail: 'Within 48 hours' },
            ].map((row, i) => (
              <Reveal key={row.term} delay={0.16 + i * 0.08}>
                <dt className="label text-faint">{row.term}</dt>
                <dd className="mt-2 text-[1.05rem] text-ink">{row.detail}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <Investment />

      <section className="border-t border-line bg-surface py-24 md:py-32">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-4">
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              Questions
            </Reveal>
            <MaskText
              text="The things people ask first"
              className="display mt-6 text-[clamp(2rem,4vw,3.2rem)] text-ink"
            />
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <DrawRule />
            {FAQ.map((item, i) => (
              <Question
                key={item.q}
                item={item}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Booking terms — separated from the general FAQ because these are the
          questions with money and dates in them. */}
      <section id="terms" className="scroll-mt-24 border-t border-line py-24 md:py-32">
        <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-4">
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              Terms
            </Reveal>
            <MaskText
              text="Dates, deposits and bad weather"
              className="display mt-6 text-[clamp(2rem,4vw,3.2rem)] text-ink"
            />
            <Reveal delay={0.16} className="mt-8 max-w-sm text-[0.95rem] leading-relaxed text-muted">
              No contracts you need a lawyer for. Everything that could cost you money or move
              your date is on this list.
            </Reveal>
            <Reveal delay={0.22} className="mt-8">
              <Link
                to="/guides"
                className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors hover:border-accent hover:text-accent"
              >
                And once you have booked
                <span aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <DrawRule />
            {BOOKING.terms.map((item, i) => (
              <Question
                key={item.q}
                item={item}
                open={openTerm === i}
                onToggle={() => setOpenTerm(openTerm === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* What happens to the photographs afterwards. This is delivery detail
          rather than a reason to book, so it sits at the very bottom. */}
      <Delivery />
    </>
  )
}
