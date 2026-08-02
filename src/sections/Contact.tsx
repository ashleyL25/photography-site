import { CTA, SITE } from '@/data/site'
import { Photo } from '@/components/Photo'
import { EnquiryForm } from '@/components/EnquiryForm'
import { MaskText, Reveal } from '@/components/motion'

export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden">
      <div className="absolute inset-0">
        <Photo id={CTA.photoId} alt="" sizes="100vw" className="h-full w-full" />
        <div aria-hidden className="absolute inset-0 bg-[rgb(var(--scrim))]/60" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--scrim))]/45 to-[rgb(var(--scrim))]/85"
        />
      </div>

      <div className="shell relative py-28 text-beige md:py-40">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal className="label flex items-center gap-4 text-champagne">
              <span className="h-px w-10 bg-champagne" />
              {CTA.eyebrow}
            </Reveal>

            <MaskText
              text={CTA.heading}
              className="display mt-8 text-[clamp(2.4rem,5.6vw,4.6rem)] text-beige"
            />

            <Reveal delay={0.15} as="p" className="mt-8 max-w-md leading-[1.85] text-beige/70">
              {CTA.body}
            </Reveal>

            <dl className="mt-14 space-y-7">
              {[
                { term: 'Based in', detail: SITE.base },
                { term: 'Travelling to', detail: SITE.serves },
                { term: 'Typically replies', detail: 'Within 48 hours' },
              ].map((row, i) => (
                <Reveal key={row.term} delay={0.2 + i * 0.08}>
                  <dt className="label text-beige/45">{row.term}</dt>
                  <dd className="mt-2 text-[1.05rem] text-beige/90">{row.detail}</dd>
                </Reveal>
              ))}
              <Reveal delay={0.45}>
                <dt className="label text-beige/45">Elsewhere</dt>
                <dd className="mt-2">
                  <a
                    href={SITE.instagram}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 border-b border-beige/30 pb-1 text-[1.05rem] text-beige/90 transition-colors hover:border-champagne hover:text-champagne"
                  >
                    {SITE.instagramHandle}
                    <span aria-hidden>↗</span>
                  </a>
                </dd>
              </Reveal>
            </dl>
          </div>

          <div className="lg:col-span-7">
            <EnquiryForm tone="onPhoto" action={CTA.action} />
          </div>
        </div>
      </div>
    </section>
  )
}
