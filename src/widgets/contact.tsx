import clsx from 'clsx'
import { Photo } from '@/components/Photo'
import { InquiryForm } from '@/components/InquiryForm'
import { MaskText, Reveal } from '@/components/motion'
import { useSiteInfo } from '@/lib/site'
import { bool, frame, text, type WidgetProps } from './types'

/** The inquiry form on a darkened photograph — the end of the homepage. */
export function InquiryCta({ content, styles }: WidgetProps) {
  const site = useSiteInfo()
  const f = frame(styles, { id: 'contact', pad: 'py-28 md:py-40' })
  const facts = [
    { term: 'Based in', detail: site.base },
    { term: 'Traveling to', detail: site.serves },
    { term: 'Typically replies', detail: site.reply },
  ].filter((row) => row.detail)

  return (
    <section id={f.id} className={clsx('relative scroll-mt-24 overflow-hidden', f.className)}>
      <div className="absolute inset-0">
        <Photo src={text(content, 'image')} alt="" sizes="100vw" className="h-full w-full" />
        <div aria-hidden className="absolute inset-0 bg-[rgb(var(--scrim))]/60" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--scrim))]/45 to-[rgb(var(--scrim))]/85" />
      </div>

      <div className={clsx('shell relative text-beige', f.pad)}>
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            {text(content, 'eyebrow') && (
              <Reveal className="label flex items-center gap-4 text-champagne">
                <span className="h-px w-10 bg-champagne" />
                {text(content, 'eyebrow')}
              </Reveal>
            )}

            <MaskText text={text(content, 'heading')} className="display mt-8 text-[clamp(2.4rem,5.6vw,4.6rem)] text-beige" />

            {text(content, 'body') && (
              <Reveal delay={0.15} as="p" className="mt-8 max-w-md leading-[1.85] text-beige/70">
                {text(content, 'body')}
              </Reveal>
            )}

            {bool(content, 'show_facts', true) && (
              <dl className="mt-14 space-y-7">
                {facts.map((row, i) => (
                  <Reveal key={row.term} delay={0.2 + i * 0.08}>
                    <dt className="label text-beige/45">{row.term}</dt>
                    <dd className="mt-2 text-[1.05rem] text-beige/90">{row.detail}</dd>
                  </Reveal>
                ))}
                {site.instagram && (
                  <Reveal delay={0.45}>
                    <dt className="label text-beige/45">Elsewhere</dt>
                    <dd className="mt-2">
                      <a
                        href={site.instagram}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 border-b border-beige/30 pb-1 text-[1.05rem] text-beige/90 transition-colors hover:border-champagne hover:text-champagne"
                      >
                        {site.instagramHandle}
                        <span aria-hidden>↗</span>
                      </a>
                    </dd>
                  </Reveal>
                )}
              </dl>
            )}
          </div>

          <div className="lg:col-span-7">
            <InquiryForm tone="onPhoto" action={text(content, 'action')} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** The contact page's form, with the direct route beside it. */
export function InquiryFormWidget({ content, styles }: WidgetProps) {
  const site = useSiteInfo()
  const f = frame(styles, { id: 'inquire' })
  const facts = [
    { term: 'Based in', detail: site.base },
    { term: 'Traveling to', detail: site.serves },
    { term: 'Typically replies', detail: site.reply },
  ].filter((row) => row.detail)

  return (
    <section id={f.id} className={clsx('scroll-mt-24', f.className)}>
      <div className={clsx('shell grid gap-16 lg:grid-cols-12 lg:gap-20', f.pad)}>
        <div className="lg:col-span-7">
          <Reveal className="label text-accent">{text(content, 'form_label')}</Reveal>
          <div className="mt-10">
            <InquiryForm tone="onCanvas" action={text(content, 'action')} />
          </div>
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <Reveal className="label text-faint">{text(content, 'direct_label')}</Reveal>

          <dl className="mt-10 space-y-8">
            {site.email && (
              <Reveal>
                <dt className="label text-faint">Email</dt>
                <dd className="mt-2">
                  <a
                    href={`mailto:${site.email}`}
                    className="border-b border-line pb-1 text-[1.05rem] text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    {site.email}
                  </a>
                </dd>
              </Reveal>
            )}

            {site.instagram && (
              <Reveal delay={0.08}>
                <dt className="label text-faint">Instagram</dt>
                <dd className="mt-2">
                  <a
                    href={site.instagram}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 border-b border-line pb-1 text-[1.05rem] text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    {site.instagramHandle}
                    <span aria-hidden>↗</span>
                  </a>
                </dd>
              </Reveal>
            )}

            {facts.map((row, i) => (
              <Reveal key={row.term} delay={0.16 + i * 0.08}>
                <dt className="label text-faint">{row.term}</dt>
                <dd className="mt-2 text-[1.05rem] text-ink">{row.detail}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
