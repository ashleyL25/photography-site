import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { FEATURED } from '@/data/site'
import { Photo } from '@/components/Photo'
import { MaskText, Parallax, Reveal, Unveil } from '@/components/motion'

/**
 * Asymmetric gallery. Column spans and offsets are hand-placed rather than
 * generated so the grid breaks in the right places, and alternating parallax
 * speeds keep the whole block from scrolling as one flat sheet.
 */
const LAYOUT = [
  'col-span-12 sm:col-span-6 lg:col-span-4 lg:col-start-1',
  'col-span-12 sm:col-span-6 lg:col-span-5 lg:col-start-6 lg:mt-32',
  'col-span-12 sm:col-span-5 lg:col-span-3 lg:col-start-1 lg:-mt-16',
  'col-span-12 sm:col-span-7 lg:col-span-5 lg:col-start-5 lg:mt-16',
  'col-span-12 sm:col-span-5 lg:col-span-3 lg:col-start-10 lg:-mt-40',
  'col-span-12 sm:col-span-7 lg:col-span-6 lg:col-start-2 lg:mt-4',
  'col-span-12 sm:col-span-5 lg:col-span-3 lg:col-start-9 lg:-mt-24',
  'col-span-12 sm:col-span-6 lg:col-span-4 lg:col-start-2 lg:mt-8',
  'col-span-12 sm:col-span-6 lg:col-span-4 lg:col-start-7 lg:-mt-16',
]

const RATIO = { tall: 'aspect-[3/4.3]', wide: 'aspect-[4/2.9]', std: 'aspect-[4/5]' } as const

export function Selected() {
  return (
    <section
      id="work"
      className="relative scroll-mt-24 overflow-hidden border-t border-line py-28 md:py-40"
    >
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Reveal className="label flex items-center gap-4 text-accent">
              <span className="h-px w-10 bg-accent" />
              Selected work
            </Reveal>
            <MaskText
              text="Afternoons around Des Moines"
              className="display mt-6 max-w-2xl text-[clamp(2.4rem,6vw,5.2rem)] text-ink"
            />
          </div>
          <Reveal delay={0.2}>
            <Link
              to="/portfolio"
              className="label group inline-flex items-center gap-3 border-b border-ink pb-2 text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Full portfolio
              <span className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">
                →
              </span>
            </Link>
          </Reveal>
        </div>

        <div className="mt-20 grid grid-cols-12 gap-x-5 gap-y-14 md:gap-x-8 md:gap-y-20">
          {FEATURED.map((item, i) => (
            <figure key={item.photoId} className={clsx('group', LAYOUT[i])}>
              <Parallax speed={i % 2 === 0 ? 0.05 : -0.05}>
                <Unveil direction={i % 3 === 1 ? 'left' : 'up'}>
                  <Photo
                    id={item.photoId}
                    alt={item.caption}
                    sizes="(min-width: 1024px) 34vw, (min-width: 640px) 48vw, 92vw"
                    className={clsx('w-full', RATIO[item.span])}
                    imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                  />
                </Unveil>
              </Parallax>
              <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                <span className="text-[0.9rem] text-muted italic">{item.caption}</span>
                <span className="label text-faint">
                  {String(i + 1).padStart(2, '0')} / {String(FEATURED.length).padStart(2, '0')}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
