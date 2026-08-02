import { INTRO } from '@/data/site'
import { Photo } from '@/components/Photo'
import { DrawRule, MaskText, Parallax, Reveal, Unveil } from '@/components/motion'

/**
 * First read after the hero: the thesis of the whole site, set against a pair
 * of offset plates that drift at different rates.
 */
export function Story() {
  return (
    <section id="story" className="relative scroll-mt-24 py-28 md:py-44">
      <div className="shell grid gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7 lg:pr-12">
          <Reveal className="label flex items-center gap-4 text-accent">
            <span className="h-px w-10 bg-accent" />
            {INTRO.eyebrow}
          </Reveal>

          <MaskText
            text={INTRO.heading}
            className="display mt-8 text-[clamp(2.2rem,5.4vw,4.6rem)] text-ink"
          />

          <div className="mt-10 max-w-xl space-y-6 text-[1.05rem] leading-[1.85] text-muted">
            {INTRO.body.map((paragraph, i) => (
              <Reveal key={i} as="p" delay={0.1 + i * 0.12}>
                {paragraph}
              </Reveal>
            ))}
          </div>

          <DrawRule className="mt-14" delay={0.2} />

          <dl className="mt-10 grid grid-cols-3 gap-6">
            {INTRO.stats.map((stat, i) => (
              <Reveal key={stat.label} delay={0.15 + i * 0.1}>
                <dt className="label mb-3 text-faint">{stat.label}</dt>
                <dd className="display text-[clamp(2.2rem,4vw,3.4rem)] text-ink">{stat.value}</dd>
              </Reveal>
            ))}
          </dl>
        </div>

        {/* `self-start` keeps this column the height of the photograph rather
            than the (much taller) text column, so the offset plate below can
            anchor to the plate's real bottom edge. */}
        <div className="relative lg:col-span-5 lg:self-start">
          <Parallax speed={0.06}>
            <Unveil className="arch" delay={0.05}>
              <Photo
                id="seniors-elise-portrait-55"
                alt="A senior in a blue floral dress standing on a tree-lined path in late afternoon light"
                sizes="(min-width: 1024px) 34vw, 90vw"
                className="aspect-[3/4.2]"
              />
            </Unveil>
          </Parallax>

          {/* Offset second plate — deliberately breaks the column edge. The
              canvas ring makes the overlap read as two stacked prints rather
              than a mis-positioned box. */}
          <div className="absolute -bottom-20 left-0 w-[46%] sm:left-4 lg:-bottom-28 lg:-left-28 lg:w-[54%]">
            <Parallax speed={-0.14}>
              <Unveil delay={0.25} direction="left" className="ring-8 ring-canvas">
                <Photo
                  id="backgrounds-2024-07-05-park-practice-122"
                  alt="White wildflowers catching the light against deep green undergrowth"
                  sizes="(min-width: 1024px) 18vw, 42vw"
                  className="aspect-[5/4]"
                />
              </Unveil>
            </Parallax>
            <Reveal delay={0.5} className="label mt-5 text-faint">
              Central Iowa · 2024
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
