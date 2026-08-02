import clsx from 'clsx'

/**
 * Stand-in brand mark until a real logo exists: a boho arch window with a
 * setting-sun rule and a display-serif "A". Vector, so it inherits `currentColor`
 * and stays crisp at any size.
 *
 * Size it from the caller with a height utility — the SVG deliberately sets no
 * intrinsic height, because an `h-full` here would outrank `h-8`/`h-12` in the
 * cascade and let the mark fill its container.
 */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 34 42"
      fill="none"
      aria-hidden
      className={clsx('w-auto shrink-0', className)}
    >
      <path
        d="M1 41V17C1 8.163 8.163 1 17 1s16 7.163 16 16v24"
        stroke="currentColor"
        strokeWidth="1.1"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M6 30h22" stroke="currentColor" strokeWidth="1.1" opacity=".45" />
      <path d="M9 34h16" stroke="currentColor" strokeWidth="1.1" opacity=".28" />
      <path d="M12 38h10" stroke="currentColor" strokeWidth="1.1" opacity=".16" />
      <text
        x="17"
        y="25"
        textAnchor="middle"
        fill="currentColor"
        style={{ font: '400 20px var(--font-display)' }}
      >
        A
      </text>
    </svg>
  )
}

/**
 * The `group-data-[over=true]/head:` variants only bite inside the header while
 * it is sitting on the hero photograph; everywhere else they are inert.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx('flex items-center gap-3', className)}>
      <Monogram className="h-8 text-accent group-data-[over=true]/head:text-champagne" />
      <span className="flex flex-col leading-none">
        <span className="display text-[1.35rem] tracking-[0.06em]">Ashley</span>
        <span className="label mt-1 text-[0.5rem] text-muted group-data-[over=true]/head:text-beige/70">
          Photography
        </span>
      </span>
    </span>
  )
}
