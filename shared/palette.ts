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
] as const

export function swatchColor(value: string): string {
  return SWATCHES.find((s) => s.value === value)?.color ?? SWATCHES[0].color
}
