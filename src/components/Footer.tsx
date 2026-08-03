import { Link } from 'react-router-dom'
import { NAV, SITE } from '@/data/site'
import { Monogram } from './Brand'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    // The bottom inset clears the home indicator, which now overlaps the page
    // because of viewport-fit=cover.
    <footer className="border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)]">
      <div className="shell py-16 md:py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Monogram className="h-12 text-accent" />
            <p className="display mt-6 text-[1.8rem] text-ink">{SITE.name}</p>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
              {SITE.tagline}. Based in {SITE.base}, photographing across {SITE.serves}.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-4">
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
          </nav>

          <div className="flex flex-col gap-4">
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
            <Link
              to="/contact"
              className="label mt-4 inline-block w-max rounded-full border border-ink px-7 py-3 text-ink transition-colors duration-400 hover:border-accent hover:bg-accent hover:text-canvas"
            >
              Inquire
            </Link>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-faint">
            © {year} {SITE.name}
          </p>
          <p className="label text-faint">
            Every photograph on this site is my own work · Booking since {SITE.since}
          </p>
        </div>
      </div>
    </footer>
  )
}
