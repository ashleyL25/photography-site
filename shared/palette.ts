/**
 * The colours a category can wear in the dashboard — the brand palette.
 *
 * Only the dashboard draws these (as the dot beside a category), so they are
 * fixed hex values rather than theme variables: the site's own palette swaps
 * between light and dark, and a category should look the same in both.
 */
export const SWATCHES = [
  { value: 'accent', label: 'Copper', color: '#9a562a' },
  { value: 'forest', label: 'Forest', color: '#2c401e' },
  { value: 'sage', label: 'Sage', color: '#5b7343' },
  { value: 'champagne', label: 'Champagne', color: '#d9b8a9' },
  { value: 'charcoal', label: 'Charcoal', color: '#222222' },
  { value: 'beige', label: 'Beige', color: '#f0e8e1' },
  { value: 'ink', label: 'The text colour', color: '#5f584f' },
] as const

export function swatchColor(value: string): string {
  return SWATCHES.find((s) => s.value === value)?.color ?? SWATCHES[0].color
}

/**
 * A swatch as a CSS colour for the site itself. Copper and the text colour
 * follow the section they sit in — copper is the accent, which a dark band
 * lightens — so a motif on a forest band still reads.
 */
export function swatchCss(value: string): string {
  if (value === 'accent') return 'var(--accent)'
  if (value === 'ink') return 'var(--ink)'
  return SWATCHES.find((s) => s.value === value)?.color ?? 'var(--accent)'
}
