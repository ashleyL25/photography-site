/**
 * Theme settings — the site-wide styling the dashboard's Theme screen edits.
 *
 * Modeled on the Pollywog HubSpot theme's `fields.json`: colours for a light and
 * a dark scheme, typography down to each heading level, buttons, element
 * styling, layout, header, footer and animation. Trimmed to what this site can
 * actually honour — every setting here changes something.
 *
 * Every value defaults to the site as it was designed. A colour left empty
 * means "as designed", and the numbers default to the values the stylesheet
 * already used, so saving an untouched theme changes nothing. The stylesheet
 * reads these as CSS custom properties (see `themeCss`), so a change needs no
 * rebuild and the dashboard can preview it live.
 */

import type { FieldDef } from './widgets.js'

/* ------------------------------------------------------------------ *
 * Fonts
 * ------------------------------------------------------------------ */

export interface FontOption {
  value: string
  label: string
  /** The family name Google Fonts knows it by. */
  family: string
  /** Weights and styles to request; omitted for a single-weight face. */
  axis?: string
  fallback: string
  kind: 'serif' | 'sans' | 'script'
}

const serif = `Georgia, 'Times New Roman', serif`
const sans = `'Helvetica Neue', Arial, sans-serif`
const script = `'Snell Roundhand', cursive`

export const FONTS: readonly FontOption[] = [
  /* Display serifs */
  { value: 'italiana', label: 'Italiana', family: 'Italiana', fallback: `'Cormorant Garamond', ${serif}`, kind: 'serif' },
  { value: 'cormorant', label: 'Cormorant Garamond', family: 'Cormorant Garamond', axis: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500', fallback: serif, kind: 'serif' },
  { value: 'playfair', label: 'Playfair Display', family: 'Playfair Display', axis: 'ital,wght@0,400..900;1,400..900', fallback: serif, kind: 'serif' },
  { value: 'bodoni', label: 'Bodoni Moda', family: 'Bodoni Moda', axis: 'ital,wght@0,400..900;1,400..900', fallback: `Didot, ${serif}`, kind: 'serif' },
  { value: 'cinzel', label: 'Cinzel', family: 'Cinzel', axis: 'wght@400..900', fallback: serif, kind: 'serif' },
  { value: 'marcellus', label: 'Marcellus', family: 'Marcellus', fallback: serif, kind: 'serif' },
  { value: 'gilda', label: 'Gilda Display', family: 'Gilda Display', fallback: serif, kind: 'serif' },
  { value: 'prata', label: 'Prata', family: 'Prata', fallback: serif, kind: 'serif' },
  { value: 'dm-serif', label: 'DM Serif Display', family: 'DM Serif Display', axis: 'ital@0;1', fallback: serif, kind: 'serif' },
  { value: 'fraunces', label: 'Fraunces', family: 'Fraunces', axis: 'ital,wght@0,100..900;1,100..900', fallback: serif, kind: 'serif' },
  { value: 'bellefair', label: 'Bellefair', family: 'Bellefair', fallback: serif, kind: 'serif' },
  { value: 'forum', label: 'Forum', family: 'Forum', fallback: serif, kind: 'serif' },
  /* Text serifs */
  { value: 'lora', label: 'Lora', family: 'Lora', axis: 'ital,wght@0,400..700;1,400..700', fallback: serif, kind: 'serif' },
  { value: 'eb-garamond', label: 'EB Garamond', family: 'EB Garamond', axis: 'ital,wght@0,400..800;1,400..800', fallback: `Garamond, ${serif}`, kind: 'serif' },
  { value: 'libre-baskerville', label: 'Libre Baskerville', family: 'Libre Baskerville', axis: 'ital,wght@0,400;0,700;1,400', fallback: serif, kind: 'serif' },
  { value: 'crimson', label: 'Crimson Pro', family: 'Crimson Pro', axis: 'ital,wght@0,200..900;1,200..900', fallback: serif, kind: 'serif' },
  { value: 'newsreader', label: 'Newsreader', family: 'Newsreader', axis: 'ital,wght@0,200..800;1,200..800', fallback: serif, kind: 'serif' },
  { value: 'spectral', label: 'Spectral', family: 'Spectral', axis: 'ital,wght@0,300;0,400;0,500;0,600;1,300;1,400', fallback: serif, kind: 'serif' },
  { value: 'source-serif', label: 'Source Serif 4', family: 'Source Serif 4', axis: 'ital,wght@0,200..900;1,200..900', fallback: serif, kind: 'serif' },
  /* Sans */
  { value: 'oswald', label: 'Oswald', family: 'Oswald', axis: 'wght@200..700', fallback: sans, kind: 'sans' },
  { value: 'bebas', label: 'Bebas Neue', family: 'Bebas Neue', fallback: sans, kind: 'sans' },
  { value: 'tenor', label: 'Tenor Sans', family: 'Tenor Sans', fallback: sans, kind: 'sans' },
  { value: 'josefin', label: 'Josefin Sans', family: 'Josefin Sans', axis: 'ital,wght@0,100..700;1,100..700', fallback: sans, kind: 'sans' },
  { value: 'montserrat', label: 'Montserrat', family: 'Montserrat', axis: 'ital,wght@0,100..900;1,100..900', fallback: sans, kind: 'sans' },
  { value: 'raleway', label: 'Raleway', family: 'Raleway', axis: 'ital,wght@0,100..900;1,100..900', fallback: sans, kind: 'sans' },
  { value: 'jost', label: 'Jost', family: 'Jost', axis: 'ital,wght@0,100..900;1,100..900', fallback: sans, kind: 'sans' },
  { value: 'inter', label: 'Inter', family: 'Inter', axis: 'wght@100..900', fallback: sans, kind: 'sans' },
  { value: 'work-sans', label: 'Work Sans', family: 'Work Sans', axis: 'ital,wght@0,100..900;1,100..900', fallback: sans, kind: 'sans' },
  { value: 'karla', label: 'Karla', family: 'Karla', axis: 'ital,wght@0,200..800;1,200..800', fallback: sans, kind: 'sans' },
  { value: 'manrope', label: 'Manrope', family: 'Manrope', axis: 'wght@200..800', fallback: sans, kind: 'sans' },
  { value: 'poppins', label: 'Poppins', family: 'Poppins', axis: 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400', fallback: sans, kind: 'sans' },
  { value: 'mulish', label: 'Mulish', family: 'Mulish', axis: 'ital,wght@0,200..1000;1,200..1000', fallback: sans, kind: 'sans' },
  /* Script */
  { value: 'pinyon', label: 'Pinyon Script', family: 'Pinyon Script', fallback: script, kind: 'script' },
  { value: 'great-vibes', label: 'Great Vibes', family: 'Great Vibes', fallback: script, kind: 'script' },
  { value: 'parisienne', label: 'Parisienne', family: 'Parisienne', fallback: script, kind: 'script' },
  { value: 'allura', label: 'Allura', family: 'Allura', fallback: script, kind: 'script' },
  { value: 'italianno', label: 'Italianno', family: 'Italianno', fallback: script, kind: 'script' },
  { value: 'mrs-saint-delafield', label: 'Mrs Saint Delafield', family: 'Mrs Saint Delafield', fallback: script, kind: 'script' },
  { value: 'la-belle-aurore', label: 'La Belle Aurore', family: 'La Belle Aurore', fallback: script, kind: 'script' },
  { value: 'caveat', label: 'Caveat', family: 'Caveat', axis: 'wght@400..700', fallback: script, kind: 'script' },
]

export const FONT_OPTIONS = FONTS.map((f) => ({ value: f.value, label: f.label }))

export function fontStack(value: string): string {
  const f = FONTS.find((x) => x.value === value)
  return f ? `'${f.family}', ${f.fallback}` : ''
}

/** The faces the shipped stylesheet already loads (see index.html). */
const PRELOADED = new Set(['italiana', 'lora', 'oswald'])

/** A Google Fonts stylesheet for the chosen families the page does not already load, or ''. */
export function themeFontsHref(theme: Record<string, unknown>, all = false): string {
  const type = g(theme.type)
  const fam = g(type.families)
  // The script face is only fetched when something is actually set in it.
  const faces = [
    ...[1, 2, 3, 4, 5, 6].map((l) => g(type[`h${l}`]).face),
    g(type.label).face,
    g(type.quote).face,
    g(g(theme.buttons).shape).face,
    g(g(theme.header).nav).face,
  ]
  const usesScript = faces.includes('script')
  const chosen = new Set([str(fam.display, 'italiana'), str(fam.body, 'lora'), str(fam.label, 'oswald'), ...(usesScript ? [str(fam.script, 'pinyon')] : [])])
  const wanted = FONTS.filter((f) => chosen.has(f.value) && (all || !PRELOADED.has(f.value)))
  if (wanted.length === 0) return ''
  const q = wanted.map((f) => `family=${encodeURIComponent(f.family).replace(/%20/g, '+')}${f.axis ? `:${f.axis}` : ''}`).join('&')
  return `https://fonts.googleapis.com/css2?${q}&display=swap`
}

/* ------------------------------------------------------------------ *
 * The schema
 * ------------------------------------------------------------------ */

const colour = (name: string, label: string, help?: string): FieldDef => ({ name, label, type: 'color', default: '', help })

const TRANSFORM = [
  { value: 'none', label: 'As typed' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalised' },
]

const WEIGHTS = [
  { value: '200', label: 'Extra light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
]

const FACE = [
  { value: 'display', label: 'Display face' },
  { value: 'body', label: 'Body face' },
  { value: 'label', label: 'Label face' },
  { value: 'script', label: 'Script face' },
]

const SCHEME = (mode: 'light' | 'dark'): FieldDef[] => [
  colour('canvas', 'Page background', `As designed: ${mode === 'light' ? '#f0e8e1' : '#16180f'}`),
  colour('surface', 'Raised band and cards', `As designed: ${mode === 'light' ? '#f7f1ea' : '#202318'}`),
  colour('heading', 'Headings', 'As designed: the body text colour.'),
  colour('ink', 'Body text', `As designed: ${mode === 'light' ? '#222222' : '#ece3da'}`),
  colour('muted', 'Secondary text', `As designed: ${mode === 'light' ? '#5f584f' : '#a9a196'}`),
  colour('faint', 'Faint text and labels', `As designed: ${mode === 'light' ? '#a2988c' : '#6f6a60'}`),
  colour('accent', 'Accent', `Rules, eyebrows, active links. As designed: ${mode === 'light' ? '#9a562a' : '#c5804f'}`),
  colour('link', 'Links in text', 'As designed: the accent.'),
  colour('link_hover', 'Links in text — hover', 'As designed: the body text colour.'),
  colour('line', 'Hairlines and borders', 'Any CSS colour, including rgb(… / 0.15) for a translucent line.'),
  colour('scrim', 'Shade over photographs', 'The colour laid over a photograph behind text. As designed: near black.'),
  { name: 'grain', label: 'Film grain over the page', type: 'number', default: mode === 'light' ? 3.5 : 5, min: 0, max: 20, step: 0.5, suffix: '%' },
]

const HEADING_LEVEL = (level: number): FieldDef => ({
  name: `h${level}`,
  label: `Heading ${level} (H${level})`,
  type: 'group',
  children: [
    { name: 'face', label: 'Typeface', type: 'choice', default: 'display', options: FACE },
    { name: 'weight', label: 'Weight', type: 'choice', default: '400', options: WEIGHTS },
    { name: 'scale', label: 'Size', type: 'number', default: 100, min: 50, max: 160, step: 5, suffix: '% of designed' },
    { name: 'leading', label: 'Line height', type: 'number', default: 0.92, min: 0.8, max: 1.6, step: 0.02, suffix: '' },
    { name: 'tracking', label: 'Letter spacing', type: 'number', default: 0.5, min: -5, max: 30, step: 0.5, suffix: '/100 em' },
    { name: 'transform', label: 'Capitalisation', type: 'choice', default: 'none', options: TRANSFORM },
    { name: 'italic', label: 'Italic', type: 'boolean', default: false },
  ],
})

const BUTTON_COLOURS = (which: 'primary' | 'secondary'): FieldDef[] => [
  {
    name: 'fill',
    label: 'Style',
    type: 'choice',
    default: 'outline',
    options: [
      { value: 'outline', label: 'Outline' },
      { value: 'solid', label: 'Solid' },
    ],
  },
  colour('bg', 'Background', 'For a solid button. As designed: the text colour.'),
  colour('text', 'Text', which === 'primary' ? 'As designed: the body text colour.' : 'As designed: the secondary text colour.'),
  colour('border', 'Border', which === 'primary' ? 'As designed: the body text colour.' : 'As designed: the hairline colour.'),
  colour('hover_bg', 'Hover — background', which === 'primary' ? 'As designed: the accent.' : 'As designed: none.'),
  colour('hover_text', 'Hover — text', which === 'primary' ? 'As designed: the page background.' : 'As designed: the accent.'),
  colour('hover_border', 'Hover — border', 'As designed: the accent.'),
  {
    name: 'hover_effect',
    label: 'Hover animation',
    type: 'choice',
    default: 'fill',
    options: [
      { value: 'fill', label: 'Colour change' },
      { value: 'sweep', label: 'Fill sweeps in from the left' },
      { value: 'lift', label: 'Lift with a shadow' },
      { value: 'none', label: 'None' },
    ],
  },
]

export const THEME_FIELDS: readonly FieldDef[] = [
  /* ============================================================ Colours */
  {
    name: 'colors',
    label: 'Colours',
    type: 'group',
    help: 'The palette for the light and dark versions of the site. Leave a colour empty to keep the one it was designed with.',
    children: [
      {
        name: 'mode',
        label: 'Light and dark',
        type: 'group',
        children: [
          {
            name: 'default',
            label: 'A first-time visitor sees',
            type: 'choice',
            default: 'device',
            options: [
              { value: 'device', label: 'Whatever their device is set to' },
              { value: 'light', label: 'The light version' },
              { value: 'dark', label: 'The dark version' },
            ],
          },
          { name: 'toggle', label: 'Show the light/dark switch in the header', type: 'boolean', default: true },
        ],
      },
      { name: 'light', label: 'Light scheme', type: 'group', children: SCHEME('light') },
      { name: 'dark', label: 'Dark scheme', type: 'group', children: SCHEME('dark') },
      {
        name: 'palette',
        label: 'Brand palette',
        type: 'group',
        help: 'The fixed colours behind the coloured bands a section can sit on (Style tab → Background) and the text over photographs.',
        children: [
          colour('charcoal', 'Charcoal', 'As designed: #222222'),
          colour('beige', 'Beige', 'As designed: #f0e8e1'),
          colour('copper', 'Copper', 'As designed: #9a562a'),
          colour('forest', 'Forest green', 'As designed: #2c401e'),
          colour('champagne', 'Champagne', 'As designed: #edd5cb'),
          colour('sage', 'Sage', 'As designed: #5b7343'),
        ],
      },
      {
        name: 'selection',
        label: 'Selected text',
        type: 'group',
        children: [colour('bg', 'Highlight', 'As designed: the accent.'), colour('text', 'Text', 'As designed: the page background.')],
      },
    ],
  },

  /* ========================================================= Typography */
  {
    name: 'type',
    label: 'Typography',
    type: 'group',
    children: [
      {
        name: 'families',
        label: 'Typefaces',
        type: 'group',
        help: 'All from Google Fonts. The display face sets the headings, the body face the paragraphs, the label face the small spaced capitals.',
        children: [
          { name: 'display', label: 'Display face', type: 'font', default: 'italiana' },
          { name: 'body', label: 'Body face', type: 'font', default: 'lora' },
          { name: 'label', label: 'Label face', type: 'font', default: 'oswald' },
          { name: 'script', label: 'Script face', type: 'font', default: 'pinyon', help: 'For a heading set to the script face.' },
        ],
      },
      {
        name: 'base',
        label: 'Body text',
        type: 'group',
        children: [
          { name: 'size', label: 'Overall text size', type: 'number', default: 100, min: 85, max: 120, step: 1, suffix: '%', help: 'Scales every size on the site together.' },
          { name: 'leading', label: 'Line height', type: 'number', default: 1.7, min: 1.3, max: 2.2, step: 0.05, suffix: '' },
          { name: 'weight', label: 'Weight', type: 'choice', default: '400', options: WEIGHTS },
          { name: 'smoothing', label: 'Font smoothing', type: 'boolean', default: true },
        ],
      },
      {
        name: 'headings',
        label: 'All headings',
        type: 'group',
        help: 'Applies on top of each level below.',
        children: [
          { name: 'scale', label: 'Size', type: 'number', default: 100, min: 60, max: 150, step: 5, suffix: '% of designed' },
          { name: 'balance', label: 'Balance the lines of a long heading', type: 'boolean', default: true },
        ],
      },
      HEADING_LEVEL(1),
      HEADING_LEVEL(2),
      HEADING_LEVEL(3),
      HEADING_LEVEL(4),
      HEADING_LEVEL(5),
      HEADING_LEVEL(6),
      {
        name: 'paragraph',
        label: 'Paragraph sizes',
        type: 'group',
        help: 'The three sizes a Rich text widget offers.',
        children: [
          { name: 'small', label: 'Small', type: 'number', default: 0.95, min: 0.75, max: 1.3, step: 0.01, suffix: 'rem' },
          { name: 'medium', label: 'Normal', type: 'number', default: 1.04, min: 0.85, max: 1.4, step: 0.01, suffix: 'rem' },
          { name: 'large', label: 'Large', type: 'number', default: 1.2, min: 1, max: 1.8, step: 0.01, suffix: 'rem' },
        ],
      },
      {
        name: 'label',
        label: 'Labels and eyebrows',
        type: 'group',
        children: [
          { name: 'face', label: 'Typeface', type: 'choice', default: 'label', options: FACE },
          { name: 'size', label: 'Size', type: 'number', default: 0.6875, min: 0.5, max: 1.2, step: 0.0125, suffix: 'rem' },
          { name: 'tracking', label: 'Letter spacing', type: 'number', default: 28, min: 0, max: 60, step: 1, suffix: '/100 em' },
          { name: 'transform', label: 'Capitalisation', type: 'choice', default: 'uppercase', options: TRANSFORM },
          { name: 'weight', label: 'Weight', type: 'choice', default: '400', options: WEIGHTS },
        ],
      },
      {
        name: 'quote',
        label: 'Quotes',
        type: 'group',
        children: [
          { name: 'face', label: 'Typeface for blockquotes in text', type: 'choice', default: 'display', options: FACE },
          { name: 'italic', label: 'Italic', type: 'boolean', default: false },
          { name: 'size', label: 'Size', type: 'number', default: 1.5, min: 1, max: 3, step: 0.05, suffix: 'rem' },
        ],
      },
      {
        name: 'links',
        label: 'Links in text',
        type: 'group',
        children: [
          {
            name: 'underline',
            label: 'Underline',
            type: 'choice',
            default: 'always',
            options: [
              { value: 'always', label: 'Always' },
              { value: 'hover', label: 'On hover' },
              { value: 'none', label: 'Never' },
            ],
          },
          { name: 'thickness', label: 'Underline thickness', type: 'number', default: 1, min: 1, max: 4, step: 1, suffix: 'px' },
          { name: 'offset', label: 'Underline offset', type: 'number', default: 3, min: 0, max: 10, step: 1, suffix: 'px' },
          { name: 'weight', label: 'Weight', type: 'choice', default: 'inherit', options: [{ value: 'inherit', label: 'Same as the text' }, ...WEIGHTS] },
        ],
      },
    ],
  },

  /* ============================================================ Buttons */
  {
    name: 'buttons',
    label: 'Buttons',
    type: 'group',
    children: [
      {
        name: 'shape',
        label: 'Shape and type',
        type: 'group',
        children: [
          { name: 'face', label: 'Typeface', type: 'choice', default: 'label', options: FACE },
          { name: 'size', label: 'Text size', type: 'number', default: 0.6875, min: 0.55, max: 1.2, step: 0.0125, suffix: 'rem' },
          { name: 'weight', label: 'Weight', type: 'choice', default: '400', options: WEIGHTS },
          { name: 'transform', label: 'Capitalisation', type: 'choice', default: 'uppercase', options: TRANSFORM },
          { name: 'tracking', label: 'Letter spacing', type: 'number', default: 28, min: 0, max: 60, step: 1, suffix: '/100 em' },
          { name: 'radius', label: 'Corner radius', type: 'number', default: 999, min: 0, max: 999, step: 1, suffix: 'px', help: '999 is a fully rounded pill; 0 is square.' },
          { name: 'padding_x', label: 'Padding — left and right', type: 'number', default: 2.25, min: 0.75, max: 4, step: 0.125, suffix: 'rem' },
          { name: 'padding_y', label: 'Padding — top and bottom', type: 'number', default: 1, min: 0.4, max: 2, step: 0.0625, suffix: 'rem' },
          { name: 'border', label: 'Border width', type: 'number', default: 1, min: 0, max: 4, step: 1, suffix: 'px' },
          { name: 'speed', label: 'Transition speed', type: 'number', default: 400, min: 0, max: 1200, step: 50, suffix: 'ms' },
        ],
      },
      { name: 'primary', label: 'Primary button', type: 'group', children: BUTTON_COLOURS('primary') },
      { name: 'secondary', label: 'Secondary button', type: 'group', children: BUTTON_COLOURS('secondary') },
      {
        name: 'link',
        label: 'Text link button',
        type: 'group',
        help: 'The “underlined link with an arrow” button style.',
        children: [
          colour('text', 'Text', 'As designed: the body text colour.'),
          colour('hover_text', 'Hover — text', 'As designed: the accent.'),
          colour('line', 'Underline', 'As designed: the hairline colour.'),
          { name: 'arrow', label: 'Show the arrow', type: 'boolean', default: true },
        ],
      },
    ],
  },

  /* ========================================================== Elements */
  {
    name: 'elements',
    label: 'Elements',
    type: 'group',
    children: [
      {
        name: 'photos',
        label: 'Photographs',
        type: 'group',
        children: [
          { name: 'radius', label: 'Corner radius', type: 'number', default: 0, min: 0, max: 40, step: 1, suffix: 'px', help: 'Arched photographs keep their arch.' },
          { name: 'arch', label: 'Arch roundness', type: 'number', default: 999, min: 40, max: 999, step: 10, suffix: 'px', help: 'How round the top of an arched photograph is. 999 is a full semicircle.' },
          { name: 'hover_zoom', label: 'Zoom slowly on hover', type: 'boolean', default: true },
        ],
      },
      {
        name: 'cards',
        label: 'Cards and panels',
        type: 'group',
        children: [
          { name: 'radius', label: 'Corner radius', type: 'number', default: 0, min: 0, max: 32, step: 1, suffix: 'px' },
          { name: 'shadow', label: 'Soft shadow under raised panels', type: 'boolean', default: false },
        ],
      },
      {
        name: 'forms',
        label: 'Forms',
        type: 'group',
        children: [
          {
            name: 'style',
            label: 'Fields',
            type: 'choice',
            default: 'underline',
            options: [
              { value: 'underline', label: 'A line underneath' },
              { value: 'boxed', label: 'Boxed' },
              { value: 'filled', label: 'Filled' },
            ],
          },
          { name: 'radius', label: 'Corner radius', type: 'number', default: 0, min: 0, max: 24, step: 1, suffix: 'px' },
          colour('focus', 'Focus colour', 'As designed: the accent.'),
        ],
      },
      {
        name: 'lists',
        label: 'Lists in text',
        type: 'group',
        children: [
          {
            name: 'marker',
            label: 'Bullet',
            type: 'choice',
            default: 'disc',
            options: [
              { value: 'disc', label: 'Dot' },
              { value: 'dash', label: 'Dash' },
              { value: 'tick', label: 'Tick' },
              { value: 'arch', label: 'Small arch' },
            ],
          },
          colour('colour', 'Bullet colour', 'As designed: the accent.'),
        ],
      },
      {
        name: 'focus',
        label: 'Keyboard focus outline',
        type: 'group',
        children: [
          { name: 'width', label: 'Width', type: 'number', default: 2, min: 1, max: 5, step: 1, suffix: 'px' },
          colour('colour', 'Colour', 'As designed: the accent.'),
        ],
      },
      {
        name: 'back_to_top',
        label: 'Back to top button',
        type: 'group',
        children: [
          { name: 'enable', label: 'Show a back to top button', type: 'boolean', default: false },
          { name: 'after', label: 'Appear after scrolling', type: 'number', default: 800, min: 200, max: 3000, step: 100, suffix: 'px' },
          {
            name: 'position',
            label: 'Position',
            type: 'choice',
            default: 'right',
            options: [
              { value: 'right', label: 'Bottom right' },
              { value: 'left', label: 'Bottom left' },
            ],
          },
          {
            name: 'shape',
            label: 'Shape',
            type: 'choice',
            default: 'circle',
            options: [
              { value: 'circle', label: 'Circle' },
              { value: 'arch', label: 'Arch' },
              { value: 'square', label: 'Square' },
            ],
          },
        ],
      },
    ],
  },

  /* ============================================================= Layout */
  {
    name: 'layout',
    label: 'Layout',
    type: 'group',
    children: [
      {
        name: 'container',
        label: 'Container',
        type: 'group',
        children: [
          { name: 'width', label: 'Maximum content width', type: 'number', default: 96, min: 60, max: 120, step: 1, suffix: 'rem' },
          { name: 'pad_mobile', label: 'Side padding — phone', type: 'number', default: 1.5, min: 0.75, max: 3, step: 0.125, suffix: 'rem' },
          { name: 'pad_tablet', label: 'Side padding — tablet and up', type: 'number', default: 2.5, min: 1, max: 5, step: 0.125, suffix: 'rem' },
        ],
      },
      {
        name: 'spacing',
        label: 'Spacing',
        type: 'group',
        children: [
          { name: 'scale', label: 'Overall spacing', type: 'number', default: 100, min: 70, max: 140, step: 5, suffix: '%', help: 'Every margin, gap and section padding together — tighter or airier.' },
          { name: 'section', label: 'Section spacing set in the Style tab', type: 'number', default: 100, min: 50, max: 160, step: 5, suffix: '%' },
        ],
      },
    ],
  },

  /* ============================================================= Header */
  {
    name: 'header',
    label: 'Header',
    type: 'group',
    children: [
      {
        name: 'behaviour',
        label: 'Behaviour',
        type: 'group',
        children: [
          {
            name: 'sticky',
            label: 'On scroll',
            type: 'choice',
            default: 'always',
            options: [
              { value: 'always', label: 'Stays at the top' },
              { value: 'hide', label: 'Hides scrolling down, returns scrolling up' },
              { value: 'none', label: 'Scrolls away with the page' },
            ],
          },
          { name: 'over_photo', label: 'Transparent over a photograph at the top of a page', type: 'boolean', default: true },
          {
            name: 'scrolled_bg',
            label: 'Background once scrolled',
            type: 'choice',
            default: 'canvas',
            options: [
              { value: 'canvas', label: 'Page colour' },
              { value: 'surface', label: 'Raised colour' },
              { value: 'glass', label: 'Frosted glass' },
            ],
          },
          { name: 'scrolled_border', label: 'Hairline under it once scrolled', type: 'boolean', default: true },
          { name: 'shadow', label: 'Shadow once scrolled', type: 'boolean', default: false },
          { name: 'padding', label: 'Height', type: 'number', default: 100, min: 60, max: 160, step: 5, suffix: '%' },
        ],
      },
      {
        name: 'logo',
        label: 'Logo',
        type: 'group',
        children: [
          {
            name: 'kind',
            label: 'Show',
            type: 'choice',
            default: 'wordmark',
            options: [
              { value: 'wordmark', label: 'The drawn wordmark' },
              { value: 'image', label: 'A logo image' },
              { value: 'text', label: 'The business name in the display face' },
            ],
          },
          { name: 'image', label: 'Logo image', type: 'image', default: '', visibleWhen: { field: 'kind', equals: ['image'] } },
          { name: 'image_dark', label: 'Logo for the dark version and over photographs', type: 'image', default: '', visibleWhen: { field: 'kind', equals: ['image'] } },
          { name: 'height', label: 'Height', type: 'number', default: 40, min: 20, max: 100, step: 2, suffix: 'px', visibleWhen: { field: 'kind', equals: ['image', 'text'] } },
        ],
      },
      {
        name: 'nav',
        label: 'Navigation links',
        type: 'group',
        children: [
          { name: 'face', label: 'Typeface', type: 'choice', default: 'label', options: FACE },
          { name: 'size', label: 'Size', type: 'number', default: 0.6875, min: 0.55, max: 1.3, step: 0.0125, suffix: 'rem' },
          { name: 'tracking', label: 'Letter spacing', type: 'number', default: 28, min: 0, max: 60, step: 1, suffix: '/100 em' },
          { name: 'transform', label: 'Capitalisation', type: 'choice', default: 'uppercase', options: TRANSFORM },
          { name: 'gap', label: 'Space between links', type: 'number', default: 2.25, min: 0.75, max: 5, step: 0.125, suffix: 'rem' },
          {
            name: 'indicator',
            label: 'Hover and current-page marker',
            type: 'choice',
            default: 'underline',
            options: [
              { value: 'underline', label: 'A line drawn underneath' },
              { value: 'dot', label: 'A dot underneath' },
              { value: 'none', label: 'Colour only' },
            ],
          },
        ],
      },
      {
        name: 'cta',
        label: 'Header button',
        type: 'group',
        children: [
          { name: 'show', label: 'Show the button', type: 'boolean', default: true },
          {
            name: 'style',
            label: 'Style',
            type: 'choice',
            default: 'primary',
            options: [
              { value: 'primary', label: 'Primary' },
              { value: 'secondary', label: 'Secondary' },
              { value: 'link', label: 'Text link' },
            ],
          },
        ],
      },
      {
        name: 'mobile',
        label: 'Mobile menu',
        type: 'group',
        children: [
          {
            name: 'breakpoint',
            label: 'Switch to the menu button below',
            type: 'choice',
            default: 'lg',
            options: [
              { value: 'md', label: 'Tablet width (768px)' },
              { value: 'lg', label: 'Laptop width (1024px)' },
              { value: 'xl', label: 'Wide screen (1280px)' },
            ],
          },
          {
            name: 'animation',
            label: 'Opening',
            type: 'choice',
            default: 'wipe',
            options: [
              { value: 'wipe', label: 'Wipes down from the top' },
              { value: 'fade', label: 'Fades in' },
              { value: 'slide', label: 'Slides in from the right' },
            ],
          },
          { name: 'numbers', label: 'Number the links', type: 'boolean', default: true },
          { name: 'size', label: 'Link size', type: 'number', default: 100, min: 60, max: 130, step: 5, suffix: '%' },
        ],
      },
    ],
  },

  /* ============================================================= Footer */
  {
    name: 'footer',
    label: 'Footer',
    type: 'group',
    children: [
      {
        name: 'style',
        label: 'Look',
        type: 'group',
        children: [
          {
            name: 'scheme',
            label: 'Background',
            type: 'choice',
            default: 'canvas',
            options: [
              { value: 'canvas', label: 'Page colour' },
              { value: 'surface', label: 'Raised colour' },
              { value: 'charcoal', label: 'Charcoal' },
              { value: 'forest', label: 'Forest green' },
              { value: 'sage', label: 'Sage' },
              { value: 'beige', label: 'Beige' },
              { value: 'champagne', label: 'Champagne' },
            ],
          },
          { name: 'border', label: 'Hairline across the top', type: 'boolean', default: true },
          { name: 'padding', label: 'Spacing', type: 'number', default: 100, min: 50, max: 160, step: 5, suffix: '%' },
        ],
      },
      {
        name: 'show',
        label: 'What it shows',
        type: 'group',
        children: [
          { name: 'monogram', label: 'Monogram', type: 'boolean', default: true },
          { name: 'explore', label: 'The Explore links', type: 'boolean', default: true },
          { name: 'contact', label: 'Get in touch', type: 'boolean', default: true },
          { name: 'cta', label: 'The button', type: 'boolean', default: true },
        ],
      },
    ],
  },

  /* ========================================================== Animation */
  {
    name: 'animation',
    label: 'Animation',
    type: 'group',
    children: [
      {
        name: 'global',
        label: 'Site-wide',
        type: 'group',
        help: 'Visitors who ask their device for reduced motion always get a still site, whatever is set here.',
        children: [
          { name: 'reveals', label: 'Reveal sections as they scroll into view', type: 'boolean', default: true },
          { name: 'speed', label: 'Reveal speed', type: 'number', default: 100, min: 50, max: 200, step: 10, suffix: '%', help: 'Above 100% is slower.' },
          { name: 'distance', label: 'How far things rise as they appear', type: 'number', default: 28, min: 0, max: 80, step: 4, suffix: 'px' },
          { name: 'parallax', label: 'Parallax — photographs drift as you scroll', type: 'boolean', default: true },
          { name: 'smooth_scroll', label: 'Smooth, weighted scrolling', type: 'boolean', default: true },
          { name: 'page_transition', label: 'Curtain between pages', type: 'boolean', default: true },
          { name: 'preloader', label: 'Opening animation on the first visit', type: 'boolean', default: true },
        ],
      },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * CSS
 * ------------------------------------------------------------------ */

const g = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const str = (v: unknown, fallback = '') => (typeof v === 'string' && v ? v : fallback)
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

/** Strips anything that could close a declaration or a rule. */
function safe(value: string) {
  return value.replace(/[;{}<>]/g, '').trim()
}

/** '#9a562a' → '154 86 42', for the `rgb(var(--scrim))` the photographs use. */
function triple(value: string): string | null {
  const hex = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ')
  }
  const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i)
  return rgb ? `${rgb[1]} ${rgb[2]} ${rgb[3]}` : null
}

const faceVar = (face: unknown) => {
  const f = str(face, 'display')
  return f === 'body' ? 'var(--font-body-face)' : f === 'label' ? 'var(--font-label-face)' : f === 'script' ? 'var(--font-script-face)' : 'var(--font-display-face)'
}

/** The dark scheme as designed, for resetting a light-only override. */
const DARK = {
  canvas: '#16180f',
  surface: '#202318',
  ink: '#ece3da',
  muted: '#a9a196',
  faint: '#6f6a60',
  accent: '#c5804f',
  line: 'rgb(236 227 218 / 0.15)',
}

const DESIGNED_LEVEL = { face: 'display', weight: '400', scale: 100, leading: 0.92, tracking: 0.5, transform: 'none', italic: false }

/**
 * The theme as a stylesheet: custom properties on `:root`, `.light` and
 * `.dark`, plus the handful of rules that cannot be a variable. Only settings
 * that differ from the design are written, so an untouched theme is an empty
 * stylesheet and the site renders exactly as built.
 */
export function themeCss(theme: Record<string, unknown>): string {
  const colors = g(theme.colors)
  const type = g(theme.type)
  const buttons = g(theme.buttons)
  const elements = g(theme.elements)
  const layout = g(theme.layout)
  const header = g(theme.header)
  const footer = g(theme.footer)
  const animation = g(g(theme.animation).global)

  const root: string[] = []
  const rules: string[] = []
  const decl = (name: string, value: string) => root.push(`${name}:${safe(value)}`)

  /* ---- Colours */
  for (const mode of ['light', 'dark'] as const) {
    const c = g(colors[mode])
    const out: string[] = []
    for (const key of ['canvas', 'surface', 'ink', 'muted', 'faint', 'accent', 'line'] as const) {
      const v = str(c[key])
      if (v) out.push(`--${key}:${safe(v)}`)
    }
    // The dark scheme resets anything the light one set and it did not, so a
    // light-only choice never leaks into the dark version.
    const light = g(colors.light)
    const pick = (key: string, fallback: string) => str(c[key]) || (mode === 'dark' && str(light[key]) ? fallback : '')
    if (pick('heading', 'var(--ink)')) out.push(`--heading-color:${safe(pick('heading', 'var(--ink)'))}`)
    if (pick('link', 'var(--accent)')) out.push(`--link:${safe(pick('link', 'var(--accent)'))}`)
    if (pick('link_hover', 'var(--ink)')) out.push(`--link-hover:${safe(pick('link_hover', 'var(--ink)'))}`)
    if (mode === 'dark') {
      for (const key of ['canvas', 'surface', 'ink', 'muted', 'faint', 'accent', 'line'] as const) {
        if (str(light[key]) && !str(c[key])) out.push(`--${key}:${DARK[key]}`)
      }
      if (str(light.scrim) && !str(c.scrim)) out.push('--scrim:10 12 8')
    }
    const scrim = triple(str(c.scrim))
    if (scrim) out.push(`--scrim:${scrim}`)
    const grain = num(c.grain, mode === 'light' ? 3.5 : 5)
    if (grain !== (mode === 'light' ? 3.5 : 5)) out.push(`--grain:${grain / 100}`)
    if (out.length) {
      // Not `:root` for the light scheme: it would outrank the stylesheet's own
      // `.dark` rule and paint the dark version light.
      const sel = mode === 'light' ? 'html:not(.dark),.light,.light .site-preview' : 'html.dark,.dark .site-preview'
      rules.push(`${sel}{${out.join(';')}}`)
    }
  }
  const palette = g(colors.palette)
  for (const key of ['charcoal', 'beige', 'copper', 'forest', 'champagne', 'sage']) {
    if (str(palette[key])) decl(`--color-${key}`, str(palette[key]))
  }
  const sel = g(colors.selection)
  if (str(sel.bg) || str(sel.text)) {
    rules.push(`::selection{${str(sel.bg) ? `background:${safe(str(sel.bg))};` : ''}${str(sel.text) ? `color:${safe(str(sel.text))}` : ''}}`)
  }
  // A heading colour belongs to the page, not to a coloured band or a
  // photograph — bands reset it, and photo-backed headings are left alone.
  if (str(g(colors.light).heading) || str(g(colors.dark).heading)) {
    rules.push(
      `[class*="scheme-"]{--heading-color:var(--ink)}`,
      `main :is(h1,h2,h3,h4,h5,h6).display:not([class*="text-beige"]):not([class*="text-champagne"]){color:var(--heading-color,var(--ink))}`,
    )
  }

  /* ---- Typefaces */
  const fam = g(type.families)
  if (str(fam.display, 'italiana') !== 'italiana') decl('--font-display-face', fontStack(str(fam.display)))
  if (str(fam.body, 'lora') !== 'lora') decl('--font-body-face', fontStack(str(fam.body)))
  if (str(fam.label, 'oswald') !== 'oswald') decl('--font-label-face', fontStack(str(fam.label)))
  decl('--font-script-face', fontStack(str(fam.script, 'pinyon')))

  const base = g(type.base)
  if (num(base.size, 100) !== 100) rules.push(`html{font-size:${num(base.size, 100)}%}`)
  if (num(base.leading, 1.7) !== 1.7 || str(base.weight, '400') !== '400') {
    rules.push(`body{line-height:${num(base.leading, 1.7)};font-weight:${safe(str(base.weight, '400'))}}`)
  }
  if (base.smoothing === false) rules.push(`html{-webkit-font-smoothing:auto;-moz-osx-font-smoothing:auto}`)

  const headings = g(type.headings)
  const allScale = num(headings.scale, 100) / 100
  if (headings.balance === false) rules.push(`h1,h2,h3,h4,h5,h6{text-wrap:wrap}`)
  for (let level = 1; level <= 6; level++) {
    const h = g(type[`h${level}`])
    const out: string[] = []
    const scale = (num(h.scale, 100) / 100) * allScale
    if (scale !== 1) out.push(`--hs:${scale}`)
    if (str(h.face, 'display') !== DESIGNED_LEVEL.face) out.push(`--d-family:${faceVar(h.face)}`)
    if (str(h.weight, '400') !== DESIGNED_LEVEL.weight) out.push(`--d-weight:${safe(str(h.weight))}`)
    if (num(h.leading, 0.92) !== DESIGNED_LEVEL.leading) out.push(`--d-leading:${num(h.leading, 0.92)}`)
    if (num(h.tracking, 0.5) !== DESIGNED_LEVEL.tracking) out.push(`--d-tracking:${num(h.tracking, 0.5) / 100}em`)
    if (str(h.transform, 'none') !== DESIGNED_LEVEL.transform) out.push(`--d-transform:${safe(str(h.transform))}`)
    if (h.italic === true) out.push(`--d-style:italic`)
    if (out.length) rules.push(`h${level}{${out.join(';')}}`)
  }

  const para = g(type.paragraph)
  if (num(para.small, 0.95) !== 0.95) decl('--p-small', `${num(para.small, 0.95)}rem`)
  if (num(para.medium, 1.04) !== 1.04) decl('--p-medium', `${num(para.medium, 1.04)}rem`)
  if (num(para.large, 1.2) !== 1.2) decl('--p-large', `${num(para.large, 1.2)}rem`)

  const label = g(type.label)
  if (str(label.face, 'label') !== 'label') decl('--l-family', faceVar(label.face))
  if (num(label.size, 0.6875) !== 0.6875) decl('--l-size', `${num(label.size, 0.6875)}rem`)
  if (num(label.tracking, 28) !== 28) decl('--l-tracking', `${num(label.tracking, 28) / 100}em`)
  if (str(label.transform, 'uppercase') !== 'uppercase') decl('--l-transform', str(label.transform))
  if (str(label.weight, '400') !== '400') decl('--l-weight', str(label.weight))

  const quote = g(type.quote)
  rules.push(
    `.rich blockquote,blockquote.rich{font-family:${faceVar(quote.face)};font-size:${num(quote.size, 1.5)}rem;line-height:1.35;font-style:${quote.italic === true ? 'italic' : 'normal'};color:var(--ink);border-left:1px solid var(--accent);padding-left:1.5rem;margin:2rem 0}`,
  )

  const links = g(type.links)
  const underline = str(links.underline, 'always')
  rules.push(
    `.rich a{color:var(--link,var(--accent));text-decoration-line:${underline === 'always' ? 'underline' : 'none'};text-decoration-thickness:${num(links.thickness, 1)}px;text-underline-offset:${num(links.offset, 3)}px;${str(links.weight, 'inherit') !== 'inherit' ? `font-weight:${safe(str(links.weight))};` : ''}transition:color .3s}`,
    `.rich a:hover{color:var(--link-hover,var(--ink));${underline === 'hover' ? 'text-decoration-line:underline' : ''}}`,
  )

  /* ---- Buttons */
  const shape = g(buttons.shape)
  const bdecl = (name: string, value: unknown, fallback: unknown, fmt: (v: never) => string) => {
    if (value !== undefined && value !== fallback) decl(name, fmt(value as never))
  }
  bdecl('--btn-family', shape.face, 'label', (v) => faceVar(v))
  bdecl('--btn-size', shape.size, 0.6875, (v: number) => `${v}rem`)
  bdecl('--btn-weight', shape.weight, '400', (v: string) => v)
  bdecl('--btn-transform', shape.transform, 'uppercase', (v: string) => v)
  bdecl('--btn-tracking', shape.tracking, 28, (v: number) => `${v / 100}em`)
  bdecl('--btn-radius', shape.radius, 999, (v: number) => `${v}px`)
  bdecl('--btn-px', shape.padding_x, 2.25, (v: number) => `${v}rem`)
  bdecl('--btn-py', shape.padding_y, 1, (v: number) => `${v}rem`)
  bdecl('--btn-border', shape.border, 1, (v: number) => `${v}px`)
  bdecl('--btn-speed', shape.speed, 400, (v: number) => `${v}ms`)

  for (const which of ['primary', 'secondary'] as const) {
    const b = g(buttons[which])
    const p = which === 'primary' ? '--btn1' : '--btn2'
    const solid = str(b.fill, 'outline') === 'solid'
    if (solid) decl(`${p}-bg`, str(b.bg) || 'var(--ink)')
    else if (str(b.bg)) decl(`${p}-bg`, str(b.bg))
    if (str(b.text) || solid) decl(`${p}-text`, str(b.text) || 'var(--canvas)')
    if (str(b.border)) decl(`${p}-border`, str(b.border))
    if (str(b.hover_bg)) decl(`${p}-hover-bg`, str(b.hover_bg))
    if (str(b.hover_text)) decl(`${p}-hover-text`, str(b.hover_text))
    if (str(b.hover_border)) decl(`${p}-hover-border`, str(b.hover_border))
    const effect = str(b.hover_effect, 'fill')
    if (effect !== 'fill') rules.push(`.cta-${which}{--fx:${effect}}`)
    if (effect === 'lift') rules.push(`.cta-${which}:hover{transform:translateY(-2px);box-shadow:0 14px 30px -14px rgb(0 0 0/.45)}`)
    if (effect === 'none') rules.push(`.cta-${which}:hover{background-color:var(${p}-bg,transparent);color:var(${p}-text);border-color:var(${p}-border)}`)
    if (effect === 'sweep')
      rules.push(
        `.cta-${which}{background-image:linear-gradient(var(${p}-hover-bg,var(--accent)),var(${p}-hover-bg,var(--accent)));background-size:0% 100%;background-repeat:no-repeat;transition-property:background-size,color,border-color}`,
        `.cta-${which}:hover{background-size:100% 100%;background-color:var(${p}-bg,transparent)}`,
      )
  }
  const blink = g(buttons.link)
  if (str(blink.text)) decl('--btn3-text', str(blink.text))
  if (str(blink.hover_text)) decl('--btn3-hover-text', str(blink.hover_text))
  if (str(blink.line)) decl('--btn3-line', str(blink.line))
  if (blink.arrow === false) rules.push(`.cta-link-arrow{display:none}`)

  /* ---- Elements */
  const photos = g(elements.photos)
  if (num(photos.radius, 0) !== 0) decl('--photo-radius', `${num(photos.radius, 0)}px`)
  if (num(photos.arch, 999) !== 999) decl('--arch-radius', `${num(photos.arch, 999)}px`)
  if (photos.hover_zoom === false) rules.push(`[class*="group-hover:scale-"]{transform:none!important}`)

  const cards = g(elements.cards)
  if (num(cards.radius, 0) !== 0) decl('--card-r', `${num(cards.radius, 0)}px`)
  if (cards.shadow === true) decl('--card-shadow', '0 24px 60px -36px rgb(0 0 0 / 0.35)')

  const forms = g(elements.forms)
  if (str(forms.style, 'underline') !== 'underline' || num(forms.radius, 0) !== 0 || str(forms.focus)) {
    const style = str(forms.style, 'underline')
    rules.push(
      `.site-field{${style === 'boxed' ? 'border:1px solid var(--line);padding:.75rem 1rem;' : style === 'filled' ? 'border:1px solid transparent;background:var(--surface);padding:.75rem 1rem;' : ''}border-radius:${num(forms.radius, 0)}px}`,
      `.site-field:focus{border-color:${safe(str(forms.focus) || 'var(--accent)')}}`,
    )
  }

  const lists = g(elements.lists)
  const marker = str(lists.marker, 'disc')
  const markerColour = safe(str(lists.colour) || 'var(--accent)')
  if (marker === 'disc') rules.push(`.rich ul{list-style:disc;padding-left:1.25rem}.rich ul li::marker{color:${markerColour}}`)
  else {
    const content = marker === 'dash' ? '"—"' : marker === 'tick' ? '"✓"' : '"∩"'
    rules.push(`.rich ul{list-style:none;padding-left:1.5rem}.rich ul li{position:relative}.rich ul li::before{content:${content};position:absolute;left:-1.5rem;color:${markerColour}}`)
  }
  rules.push(`.rich ol{list-style:decimal;padding-left:1.4rem}.rich ol li::marker{color:${markerColour}}`)

  const focus = g(elements.focus)
  if (num(focus.width, 2) !== 2 || str(focus.colour)) {
    rules.push(`:focus-visible{outline:${num(focus.width, 2)}px solid ${safe(str(focus.colour) || 'var(--accent)')}!important}`)
  }

  /* ---- Layout */
  const container = g(layout.container)
  if (num(container.width, 96) !== 96) decl('--container', `${num(container.width, 96)}rem`)
  if (num(container.pad_mobile, 1.5) !== 1.5) decl('--gutter-sm', `${num(container.pad_mobile, 1.5)}rem`)
  if (num(container.pad_tablet, 2.5) !== 2.5) decl('--gutter-md', `${num(container.pad_tablet, 2.5)}rem`)
  const spacing = g(layout.spacing)
  if (num(spacing.scale, 100) !== 100) decl('--spacing', `${0.25 * (num(spacing.scale, 100) / 100)}rem`)
  if (num(spacing.section, 100) !== 100) decl('--space-scale', String(num(spacing.section, 100) / 100))

  /* ---- Header */
  const nav = g(header.nav)
  if (str(nav.face, 'label') !== 'label') decl('--nav-family', faceVar(nav.face))
  if (num(nav.size, 0.6875) !== 0.6875) decl('--nav-size', `${num(nav.size, 0.6875)}rem`)
  if (num(nav.tracking, 28) !== 28) decl('--nav-tracking', `${num(nav.tracking, 28) / 100}em`)
  if (str(nav.transform, 'uppercase') !== 'uppercase') decl('--nav-transform', str(nav.transform))
  if (num(nav.gap, 2.25) !== 2.25) decl('--nav-gap', `${num(nav.gap, 2.25)}rem`)
  const hb = g(header.behaviour)
  if (num(hb.padding, 100) !== 100) decl('--header-pad', String(num(hb.padding, 100) / 100))
  const mobile = g(header.mobile)
  if (num(mobile.size, 100) !== 100) decl('--mnav-scale', String(num(mobile.size, 100) / 100))

  /* ---- Footer */
  const fstyle = g(g(footer).style)
  if (num(fstyle.padding, 100) !== 100) decl('--footer-pad', String(num(fstyle.padding, 100) / 100))

  /* ---- Animation */
  if (num(animation.speed, 100) !== 100) decl('--reveal-speed', String(num(animation.speed, 100) / 100))

  return [root.length ? `:root{${root.join(';')}}` : '', ...rules].filter(Boolean).join('\n')
}

/** The theme group a component reads, loosely typed — callers know their keys. */
export function themeGroup(theme: unknown, group: string, sub: string): Record<string, unknown> {
  return g(g(g(theme)[group])[sub])
}
