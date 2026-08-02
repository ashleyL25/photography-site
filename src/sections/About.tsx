import { ABOUT, SITE } from '@/data/site'
import { Photo } from '@/components/Photo'
import { MaskText, Parallax, Reveal, Unveil } from '@/components/motion'

export function About() {
  return (
    <section
      id="about"
      className="relative scroll-mt-24 overflow-hidden border-t border-line bg-surface py-28 md:py-40"
    >
      <div className="shell grid items-center gap-16 lg:grid-cols-12 lg:gap-20">
        <div className="relative lg:col-span-5">
          <Parallax speed={0.05}>
            <Unveil className="arch" direction="left">
              <Photo
                id={ABOUT.photoId}
                alt="Ashley, sitting at an outdoor table on a summer afternoon"
                sizes="(min-width: 1024px) 36vw, 88vw"
                className="aspect-[4/5]"
              />
            </Unveil>
          </Parallax>

          {/* Framing rule that overshoots the plate — a printed-page gesture. */}
          <Reveal
            delay={0.4}
            className="pointer-events-none absolute -top-6 -right-6 hidden h-[calc(100%+3rem)] w-[70%] border border-accent/40 lg:block"
          >
            <span className="sr-only" />
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal className="label flex items-center gap-4 text-accent">
            <span className="h-px w-10 bg-accent" />
            {ABOUT.eyebrow}
          </Reveal>

          <MaskText
            text={ABOUT.heading}
            className="display mt-8 text-[clamp(2.1rem,4.8vw,4rem)] text-ink"
          />

          <div className="mt-10 max-w-2xl space-y-6 text-[1.05rem] leading-[1.85] text-muted">
            {ABOUT.body.map((paragraph, i) => (
              <Reveal key={i} as="p" delay={0.1 + i * 0.1}>
                {paragraph}
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4} className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6">
            <span
              className="display text-[2.6rem] leading-none text-accent"
              aria-hidden
              style={{ transform: 'rotate(-4deg)' }}
            >
              {ABOUT.signature}
            </span>
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="label inline-flex items-center gap-3 border-b border-line pb-2 text-muted transition-colors hover:border-accent hover:text-accent"
            >
              {SITE.instagramHandle}
              <span aria-hidden>↗</span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
