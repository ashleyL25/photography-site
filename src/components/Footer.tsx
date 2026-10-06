import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useSiteInfo, useThemeSettings } from '@/lib/site'
import { Monogram } from './Brand'

export function Footer() {
  const year = new Date().getFullYear()
  const SITE = useSiteInfo()
  const NAV = SITE.nav
  const look = useThemeSettings('footer', 'style')
  const show = useThemeSettings('footer', 'show')
  const scheme = typeof look.scheme === 'string' ? look.scheme : 'canvas'

  return (
    // The bottom inset clears the home indicator, which overlaps the page
    // because of viewport-fit=cover. Zero anywhere without one.
    <footer
      className={clsx(
        'pb-[env(safe-area-inset-bottom)]',
        look.border !== false && 'border-t border-line',
        scheme === 'surface' ? 'bg-surface' : scheme === 'canvas' ? 'bg-canvas' : `scheme-${scheme} bg-canvas text-ink`,
      )}
    >
      <div className="shell py-[calc(4rem*var(--footer-pad,1))] md:py-[calc(5rem*var(--footer-pad,1))]">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            {show.monogram !== false && <Monogram className="h-12 text-accent" />}
            <p className="display mt-6 text-[1.8rem] text-ink">{SITE.name}</p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
              {SITE.tagline}. Based in {SITE.base}, photographing across {SITE.serves}.
            </p>
          </div>

          {show.explore !== false && <nav aria-label="Footer" className="flex flex-col gap-4">
            <span className="label text-faint">Explore</span>
            {[...NAV, { label: 'Contact', to: '/contact' }].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-[0.95rem] text-muted transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>}

          {(show.contact !== false || show.cta !== false) && <div className="flex flex-col gap-4">
            {show.contact !== false && <>
            <span className="label text-faint">Get in touch</span>
            <a
              href={`mailto:${SITE.email}`}
              className="text-[0.95rem] text-muted transition-colors hover:text-accent"
            >
              {SITE.email}
            </a>
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="text-[0.95rem] text-muted transition-colors hover:text-accent"
            >
              {SITE.instagramHandle}
            </a>
            </>}
            {show.cta !== false && <Link
              to="/contact"
              className="cta cta-primary cta-sm mt-4 inline-block w-max px-7"
            >
              {SITE.footerCta}
            </Link>}
          </div>}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-faint">
            © {year} {SITE.name}
          </p>
          <p className="label text-faint">
            {[SITE.footerNote, SITE.since && `Booking since ${SITE.since}`].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
    </footer>
  )
}
