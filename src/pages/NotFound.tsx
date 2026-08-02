import { Link } from 'react-router-dom'
import { Photo } from '@/components/Photo'
import { MaskText, Reveal } from '@/components/motion'
import { useDocumentMeta } from '@/lib/hooks'

export default function NotFound() {
  useDocumentMeta('Page not found — Ashley Photography')

  return (
    <section className="relative isolate flex min-h-[80svh] items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Photo
          id="backgrounds-italy-2025-320"
          alt=""
          sizes="100vw"
          priority
          className="h-full w-full"
        />
        <div aria-hidden className="absolute inset-0 bg-[rgb(var(--scrim))]/75" />
      </div>

      <div className="shell py-32 text-beige">
        <Reveal className="label text-champagne">Error 404</Reveal>
        <MaskText
          as="h1"
          text="This one is not in the gallery."
          className="display mt-8 max-w-3xl text-[clamp(2.4rem,7vw,5.5rem)]"
        />
        <Reveal delay={0.15} as="p" className="mt-8 max-w-md leading-[1.85] text-beige/75">
          The page you were after has moved or never existed. The work is all still here, though.
        </Reveal>
        <Reveal delay={0.25} className="mt-12 flex flex-wrap gap-4">
          <Link
            to="/"
            className="label rounded-full border border-beige px-8 py-4 text-beige transition-colors duration-400 hover:border-champagne hover:bg-champagne hover:text-charcoal"
          >
            Back home
          </Link>
          <Link
            to="/portfolio"
            className="label rounded-full border border-beige/40 px-8 py-4 text-beige/80 transition-colors duration-400 hover:border-champagne hover:text-champagne"
          >
            See the portfolio
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
