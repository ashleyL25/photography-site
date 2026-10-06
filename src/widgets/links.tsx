import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { ReactNode } from 'react'

/**
 * A link that goes through the router when it can.
 *
 * Internal paths use `Link` so the page curtain runs; a bare `#anchor` stays a
 * plain anchor so it scrolls in place; anything else opens in a new tab.
 */
export function SmartLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className={className}>
      {children}
    </a>
  )
}

/** The underlined label with an arrow — "Full portfolio →". */
export function ArrowLink({
  href,
  label,
  quiet = false,
  className,
}: {
  href: string
  label: string
  /** The muted variant, with a hairline instead of an ink rule. */
  quiet?: boolean
  className?: string
}) {
  if (!href || !label) return null
  return (
    <SmartLink
      href={href}
      className={clsx(
        'label group inline-flex items-center gap-3 border-b pb-2 transition-colors',
        quiet ? 'border-line text-muted hover:border-accent hover:text-accent' : 'cta-link',
        className,
      )}
    >
      {label}
      <span
        aria-hidden
        className="cta-link-arrow inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5"
      >
        →
      </span>
    </SmartLink>
  )
}

export interface ButtonValue {
  label: string
  href: string
  style: 'primary' | 'secondary' | 'link'
}

const PILL = {
  primary:
    'cta cta-primary',
  secondary:
    'label rounded-full border border-line px-9 py-4 text-muted transition-colors duration-400 hover:border-accent hover:text-accent',
}

/** The buttons a widget carries, in the site's two pill styles and its arrow link. */
export function Buttons({
  buttons,
  className,
  tokens,
}: {
  buttons: ButtonValue[]
  className?: string
  /** `{slug}` and friends, for buttons on a session page. */
  tokens?: Record<string, string>
}) {
  const shown = buttons.filter((b) => b.label && b.href)
  if (shown.length === 0) return null
  const sub = (v: string) => (tokens ? v.replace(/\{(\w+)\}/g, (w, k: string) => tokens[k] ?? w) : v)

  return (
    <div className={clsx('flex flex-wrap items-center gap-4', className)}>
      {shown.map((button, i) =>
        button.style === 'link' ? (
          <ArrowLink key={i} href={sub(button.href)} label={sub(button.label)} />
        ) : (
          <SmartLink key={i} href={sub(button.href)} className={PILL[button.style] ?? PILL.primary}>
            {sub(button.label)}
          </SmartLink>
        ),
      )}
    </div>
  )
}
