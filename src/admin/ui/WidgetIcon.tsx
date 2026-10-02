import clsx from 'clsx'

/**
 * Icons for the widget picker.
 *
 * Drawn as wireframes of the layout each widget produces rather than as
 * symbols — a hero is a big block with lines under it, a two-column is two
 * columns. Somebody scanning the picker is asking "what shape is this", and a
 * tiny picture of the shape answers that faster than a pictogram of a concept.
 */
export function WidgetIcon({ type, className }: { type: string; className?: string }) {
  const classes = clsx('h-5 w-5', className)
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.2 } as const

  const shapes: Record<string, React.ReactNode> = {
    mediaText: (
      <>
        <rect x="2" y="4" width="9" height="13" rx="4.5" {...stroke} />
        <path d="M14 7h8M14 11h8M14 15h5" {...stroke} strokeLinecap="round" />
      </>
    ),
    list: (
      <>
        <path d="M3 5h18M3 10h18M3 15h18M3 20h18" {...stroke} strokeLinecap="round" opacity={0.45} />
        <path d="M3 7.5h9M3 12.5h11M3 17.5h7" {...stroke} strokeLinecap="round" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1" {...stroke} />
        <rect x="13" y="3" width="8" height="8" rx="1" {...stroke} />
        <rect x="3" y="13" width="8" height="8" rx="1" {...stroke} />
        <rect x="13" y="13" width="8" height="8" rx="1" {...stroke} />
      </>
    ),
    services: (
      <>
        <rect x="3" y="4" width="18" height="6" rx="1" {...stroke} />
        <rect x="5" y="12" width="14" height="5" rx="1" {...stroke} opacity={0.7} />
        <rect x="7" y="19" width="10" height="2" rx="1" {...stroke} opacity={0.45} />
      </>
    ),
    pricing: (
      <>
        <rect x="2" y="4" width="6" height="16" rx="1" {...stroke} />
        <rect x="9" y="3" width="6" height="18" rx="1" {...stroke} />
        <rect x="16" y="4" width="6" height="16" rx="1" {...stroke} />
        <path d="M10.5 7h3" {...stroke} strokeLinecap="round" />
      </>
    ),
    guide: (
      <>
        <path d="M4 4h11l5 5v11H4z" {...stroke} strokeLinejoin="round" />
        <path d="M7.5 12l2 2 4-4" {...stroke} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 17h8" {...stroke} strokeLinecap="round" />
      </>
    ),
    contact: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="1.5" {...stroke} />
        <path d="M3.5 6l8.5 7 8.5-7" {...stroke} strokeLinejoin="round" />
      </>
    ),
    hero: (
      <>
        <rect x="2" y="3" width="20" height="12" rx="1" {...stroke} />
        <path d="M5 18h9M5 21h6" {...stroke} strokeLinecap="round" />
      </>
    ),
    header: (
      <>
        <path d="M3 5h12M3 9h18M3 13h8" {...stroke} strokeLinecap="round" />
        <path d="M3 18h18" {...stroke} strokeLinecap="round" opacity={0.5} />
      </>
    ),
    text: (
      <path d="M4 5h16M4 9h16M4 13h16M4 17h10" {...stroke} strokeLinecap="round" />
    ),
    columns: (
      <>
        <path d="M3 5h7M3 9h5" {...stroke} strokeLinecap="round" />
        <path d="M13 5h8M13 9h8M13 13h8M13 17h5" {...stroke} strokeLinecap="round" />
      </>
    ),
    quote: (
      <>
        <path d="M6 7h4v5c0 2-1.5 3.5-4 4" {...stroke} strokeLinejoin="round" />
        <path d="M15 7h4v5c0 2-1.5 3.5-4 4" {...stroke} strokeLinejoin="round" />
      </>
    ),
    timeline: (
      <>
        <path d="M6 3v18" {...stroke} strokeLinecap="round" />
        <circle cx="6" cy="7" r="1.6" fill="currentColor" />
        <circle cx="6" cy="15" r="1.6" fill="currentColor" />
        <path d="M10 6h10M10 9h6M10 14h10M10 17h6" {...stroke} strokeLinecap="round" />
      </>
    ),
    cards: (
      <>
        <rect x="2" y="5" width="6" height="14" rx="1" {...stroke} />
        <rect x="9" y="5" width="6" height="14" rx="1" {...stroke} />
        <rect x="16" y="5" width="6" height="14" rx="1" {...stroke} />
      </>
    ),
    stats: (
      <>
        <path d="M4 16V9M10 16V5M16 16v-4M22 16V7" {...stroke} strokeLinecap="round" />
        <path d="M2 20h20" {...stroke} strokeLinecap="round" opacity={0.5} />
      </>
    ),
    accordion: (
      <>
        <rect x="3" y="4" width="18" height="4" rx="1" {...stroke} />
        <rect x="3" y="10" width="18" height="10" rx="1" {...stroke} />
        <path d="M6 15h9" {...stroke} strokeLinecap="round" opacity={0.6} />
      </>
    ),
    image: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="1" {...stroke} />
        <circle cx="8.5" cy="10" r="1.5" {...stroke} />
        <path d="m4 17 5-4 4 3 3-2 5 4" {...stroke} strokeLinejoin="round" />
      </>
    ),
    'media-text': (
      <>
        <rect x="2" y="6" width="9" height="12" rx="1" {...stroke} />
        <path d="M14 7h8M14 11h8M14 15h5" {...stroke} strokeLinecap="round" />
      </>
    ),
    gallery: (
      <>
        <rect x="2" y="4" width="8" height="7" rx="1" {...stroke} />
        <rect x="12" y="4" width="10" height="7" rx="1" {...stroke} />
        <rect x="2" y="13" width="10" height="7" rx="1" {...stroke} />
        <rect x="14" y="13" width="8" height="7" rx="1" {...stroke} />
      </>
    ),
    book: (
      <>
        <path d="M12 6c-2.5-2-5.5-2.6-9-2.4v14c3.5-.2 6.5.4 9 2.4" {...stroke} strokeLinejoin="round" />
        <path d="M12 6c2.5-2 5.5-2.6 9-2.4v14c-3.5-.2-6.5.4-9 2.4" {...stroke} strokeLinejoin="round" />
        <path d="M12 6v14" {...stroke} />
      </>
    ),
    marquee: (
      <>
        <path d="M2 12h20" {...stroke} strokeLinecap="round" opacity={0.3} />
        <path d="M5 9h5M13 9h6M3 15h7M14 15h5" {...stroke} strokeLinecap="round" />
      </>
    ),
    embed: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="1.5" {...stroke} />
        <path d="m10 9 5 3-5 3z" fill="currentColor" />
      </>
    ),
    portfolio: (
      <>
        <rect x="3" y="4" width="5" height="16" rx="0.8" {...stroke} />
        <rect x="9.5" y="4" width="5" height="16" rx="0.8" {...stroke} />
        <rect x="16" y="6" width="5" height="14" rx="0.8" {...stroke} />
      </>
    ),
    blog: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="1.5" {...stroke} />
        <path d="M7 8h10M7 12h10M7 16h6" {...stroke} strokeLinecap="round" />
      </>
    ),
    featured: (
      <>
        <rect x="2" y="4" width="9" height="16" rx="1" {...stroke} />
        <path d="M14 7h8M14 11h8M14 15h6M14 19h4" {...stroke} strokeLinecap="round" opacity={0.85} />
      </>
    ),
    cta: (
      <>
        <path d="M5 7h14M8 11h8" {...stroke} strokeLinecap="round" />
        <rect x="7" y="14" width="10" height="5" rx="2.5" {...stroke} />
      </>
    ),
    divider: (
      <>
        <path d="M3 12h6M15 12h6" {...stroke} strokeLinecap="round" />
        <path d="m12 9 2.2 3L12 15l-2.2-3z" fill="currentColor" />
      </>
    ),
    spacer: (
      <>
        <path d="M3 5h18M3 19h18" {...stroke} strokeLinecap="round" />
        <path d="M12 8v8M9.5 10.5 12 8l2.5 2.5M9.5 13.5 12 16l2.5-2.5" {...stroke} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    logos: (
      <>
        <circle cx="5" cy="12" r="2.4" {...stroke} />
        <rect x="10" y="9.5" width="5" height="5" rx="1" {...stroke} />
        <path d="m19.5 9.5 2.5 5h-5z" {...stroke} strokeLinejoin="round" />
      </>
    ),
    mail: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="1.5" {...stroke} />
        <path d="m3 7 9 6 9-6" {...stroke} strokeLinejoin="round" />
      </>
    ),
    author: (
      <>
        <circle cx="8" cy="9" r="3.2" {...stroke} />
        <path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5" {...stroke} strokeLinecap="round" />
        <path d="M16 8h6M16 12h6M16 16h4" {...stroke} strokeLinecap="round" opacity={0.7} />
      </>
    ),
    newsletter: (
      <>
        <path d="M3 8 12 4l9 4v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...stroke} strokeLinejoin="round" />
        <path d="m3 8 9 6 9-6" {...stroke} strokeLinejoin="round" />
      </>
    ),
  }

  return (
    <svg viewBox="0 0 24 24" className={classes} aria-hidden>
      {shapes[type] ?? shapes.text}
    </svg>
  )
}
