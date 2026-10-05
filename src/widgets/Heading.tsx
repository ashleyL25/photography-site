import { MaskText } from '@/components/motion'

/**
 * Sizes a heading can be set to from the dashboard. Each is the same fluid
 * clamp the site's own headings use at that step, so a resized heading still
 * scales between a phone and a wide screen the way the designed ones do.
 */
const SIZES: Record<string, string> = {
  display: 'text-[clamp(3rem,9vw,7.5rem)]',
  xl: 'text-[clamp(2.4rem,6vw,5.2rem)]',
  lg: 'text-[clamp(2.2rem,5vw,4rem)]',
  md: 'text-[clamp(1.9rem,4vw,3rem)]',
  sm: 'text-[clamp(1.5rem,2.6vw,2.1rem)]',
}

/**
 * A widget's heading, with the level and size chosen in the dashboard.
 *
 * Both default to "as designed": the widget's own size stays and the level is
 * an h2. Choosing a size swaps only the size class, so spacing and colour stay
 * with the design.
 */
export function Heading({
  content,
  text,
  className,
}: {
  content: Record<string, unknown>
  /** The words, when they are not simply `content.heading` (tokens filled in). */
  text?: string
  className: string
}) {
  const words = text ?? (typeof content.heading === 'string' ? content.heading : '')
  if (!words) return null
  const size = typeof content.heading_size === 'string' ? SIZES[content.heading_size] : undefined
  const tag = content.heading_tag
  const as = tag === 'h1' || tag === 'h3' || tag === 'p' ? tag : 'h2'
  const classes = size ? className.replace(/text-\[clamp\([^\]]+\)\]/, size) : className
  return <MaskText as={as} text={words} className={classes} />
}
