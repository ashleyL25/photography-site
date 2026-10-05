/**
 * The widget library.
 *
 * A page — or a session, a guide, an album, a blog post — is an ordered list of
 * widget instances, each one a `{ type, content, styles }` record. This file is
 * the single description of what a widget *is*: the dashboard builds its form
 * from these field definitions, the server cleans submitted content against
 * them, and the renderers in src/widgets read the same names back out.
 *
 * Every section the site had before the dashboard is one of these, and each
 * renderer is that section's original component reading from `content` instead
 * of from src/data — which is what keeps the site looking exactly as it did.
 * Defaults here are deliberately the site's own copy, so adding a widget to a
 * page starts from something that already reads right.
 */

/* ------------------------------------------------------------------ *
 * Field definitions
 * ------------------------------------------------------------------ */

import { DECOR_PRESETS, ELEMENT_OPTIONS, MOTIF_OPTIONS, MOTIF_POSITIONS, PRESET_VALUES, TEXTURES } from './artwork.js'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'choice'
  | 'multichoice'
  | 'image'
  /** Several photographs, in order. Stored as an array of URLs. */
  | 'images'
  /** One item per line. Stored as an array of strings. */
  | 'lines'
  | 'link'
  | 'group'
  | 'repeater'
  /** Blog posts to show — see `CollectionSource`. */
  | 'collection'
  /** Session types to show, by id, in order. Empty means all of them. */
  | 'sessions'
  /** Albums to show, by id, in order. */
  | 'albums'
  /** One portfolio category, by slug. */
  | 'category'
  /** One of the brand palette names — see shared/palette.ts. */
  | 'swatch'

export interface VisibleWhen {
  field: string
  equals: readonly unknown[]
}

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  default?: unknown
  help?: string
  placeholder?: string
  /**
   * The permitted values for `choice` and `multichoice`, which the server also
   * enforces. On an `image` field they are built-in artwork offered beside the
   * media library instead — a suggestion, not a constraint.
   */
  options?: readonly { readonly value: string; readonly label: string }[]
  /** On a `choice` field, show the options as the drawings they name. */
  artwork?: 'motifs'
  min?: number
  max?: number
  step?: number
  suffix?: string
  /** `group` and `repeater` only. */
  children?: readonly FieldDef[]
  /** `repeater` only — the singular noun used on its Add button and row headers. */
  itemLabel?: string
  maxItems?: number
  /** Shown only when the named sibling holds one of these values. A list means all must hold. */
  visibleWhen?: VisibleWhen | readonly VisibleWhen[]
  /** Renders across the full width of the editor column. */
  wide?: boolean
}

export type WidgetHost = 'page' | 'post' | 'session' | 'album' | 'guide'

export type WidgetCategory =
  | 'Opening'
  | 'Text'
  | 'Photos'
  | 'Sessions'
  | 'Pricing'
  | 'Portfolio'
  | 'Guide'
  | 'Blog'
  | 'Contact'
  | 'Structure'

export interface WidgetDef {
  type: string
  label: string
  description: string
  /** Key into the editor's icon set — see src/admin/ui/WidgetIcon.tsx. */
  icon: string
  category: WidgetCategory
  hosts: readonly WidgetHost[]
  fields: readonly FieldDef[]
}

/* ------------------------------------------------------------------ *
 * Reusable fragments
 * ------------------------------------------------------------------ */

const ALL: readonly WidgetHost[] = ['page', 'post', 'session', 'album', 'guide']
const PAGES: readonly WidgetHost[] = ['page']

const eyebrow = (value = ''): FieldDef => ({
  name: 'eyebrow',
  label: 'Eyebrow',
  type: 'text',
  default: value,
  help: 'The small spaced-out label above the heading.',
})

const heading = (value = ''): FieldDef => ({ name: 'heading', label: 'Heading', type: 'text', default: value })

const image = (name: string, label: string, value = ''): FieldDef => ({
  name,
  label,
  type: 'image',
  default: value,
})

const alt = (name: string, value = ''): FieldDef => ({
  name,
  label: 'Alt text',
  type: 'text',
  default: value,
  help: 'What the photograph shows, for anyone who cannot see it. Leave empty for a purely decorative one.',
})

const COLUMNS = (value: string): FieldDef => ({
  name: 'columns',
  label: 'Columns on a wide screen',
  type: 'choice',
  default: value,
  options: [
    { value: '2', label: 'Two' },
    { value: '3', label: 'Three' },
    { value: '4', label: 'Four' },
  ],
})

const BUTTONS = (value: unknown[] = []): FieldDef => ({
  name: 'buttons',
  label: 'Buttons',
  type: 'repeater',
  itemLabel: 'Button',
  maxItems: 3,
  default: value,
  children: [
    { name: 'label', label: 'Label', type: 'text', default: 'Start an inquiry' },
    { name: 'href', label: 'Link', type: 'link', default: '/contact' },
    {
      name: 'style',
      label: 'Style',
      type: 'choice',
      default: 'primary',
      options: [
        { value: 'primary', label: 'Outlined pill' },
        { value: 'secondary', label: 'Quiet pill' },
        { value: 'link', label: 'Underlined link with an arrow' },
      ],
    },
  ],
})

/* ------------------------------------------------------------------ *
 * The Style tab — identical on every widget
 *
 * Each widget already carries the spacing, background and rules it had on the
 * hand-built site, so every option here defaults to "as designed". They exist
 * for the times a section is reused somewhere new and wants to sit differently.
 * ------------------------------------------------------------------ */

const SPACE_OPTIONS = [
  { value: 'auto', label: 'As designed' },
  { value: 'none', label: 'None' },
  { value: 'xs', label: 'Extra small' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra large' },
] as const

const RULE_OPTIONS = [
  { value: 'auto', label: 'As designed' },
  { value: 'none', label: 'None' },
  { value: 'line', label: 'Hairline' },
  { value: 'arch', label: 'Arch ornament' },
] as const

export const STYLE_FIELDS: readonly FieldDef[] = [
  {
    name: 'background',
    label: 'Background',
    type: 'group',
    help: 'A colour band or a photograph behind the section. Dark choices switch the text to light automatically.',
    children: [
      {
        name: 'scheme',
        label: 'Colour',
        type: 'choice',
        default: 'auto',
        options: [
          { value: 'auto', label: 'As designed' },
          { value: 'canvas', label: 'Page' },
          { value: 'surface', label: 'Raised band' },
          { value: 'beige', label: 'Beige' },
          { value: 'champagne', label: 'Champagne' },
          { value: 'charcoal', label: 'Charcoal' },
          { value: 'forest', label: 'Forest green' },
          { value: 'sage', label: 'Sage' },
          { value: 'copper', label: 'Copper' },
        ],
      },
      { name: 'image', label: 'Background photograph', type: 'image', default: '' },
      {
        name: 'overlay',
        label: 'Darken the photograph',
        type: 'number',
        default: 55,
        min: 0,
        max: 95,
        step: 5,
        suffix: '%',
        visibleWhen: { field: 'image', equals: ['__truthy__'] },
      },
      {
        name: 'parallax',
        label: 'Photograph drifts as the page scrolls',
        type: 'boolean',
        default: true,
        visibleWhen: { field: 'image', equals: ['__truthy__'] },
      },
      {
        name: 'focal',
        label: 'Keep in frame',
        type: 'choice',
        default: 'center',
        options: [
          { value: 'center', label: 'Centre' },
          { value: 'top', label: 'Top' },
          { value: 'bottom', label: 'Bottom' },
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
        ],
        visibleWhen: { field: 'image', equals: ['__truthy__'] },
      },
      {
        name: 'texture',
        label: 'Texture',
        type: 'choice',
        default: '',
        help: 'A fine surface laid over the colour — film grain, paper, linen — so a flat band reads as a material.',
        options: TEXTURES,
      },
      {
        name: 'texture_opacity',
        label: 'Texture strength',
        type: 'number',
        default: 30,
        min: 5,
        max: 100,
        step: 5,
        suffix: '%',
        visibleWhen: { field: 'texture', equals: ['__truthy__'] },
      },
    ],
  },
  {
    name: 'spacing',
    label: 'Spacing',
    type: 'group',
    children: [
      { name: 'top', label: 'Space above', type: 'choice', default: 'auto', options: SPACE_OPTIONS },
      { name: 'bottom', label: 'Space below', type: 'choice', default: 'auto', options: SPACE_OPTIONS },
    ],
  },
  {
    name: 'layout',
    label: 'Width and alignment',
    type: 'group',
    help: 'For the text and photo widgets. Sections with a fixed design keep theirs.',
    children: [
      {
        name: 'width',
        label: 'Width',
        type: 'choice',
        default: 'auto',
        options: [
          { value: 'auto', label: 'As designed' },
          { value: 'narrow', label: 'Narrow — reading width' },
          { value: 'medium', label: 'Medium' },
          { value: 'wide', label: 'Page width' },
          { value: 'full', label: 'Edge to edge' },
        ],
      },
      {
        name: 'align',
        label: 'Text alignment',
        type: 'choice',
        default: 'auto',
        options: [
          { value: 'auto', label: 'As designed' },
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Centred' },
        ],
      },
    ],
  },
  {
    name: 'rules',
    label: 'Lines',
    type: 'group',
    children: [
      { name: 'top', label: 'Above', type: 'choice', default: 'auto', options: RULE_OPTIONS },
      { name: 'bottom', label: 'Below', type: 'choice', default: 'none', options: RULE_OPTIONS.slice(1) },
    ],
  },
  {
    name: 'decor',
    label: 'Floating elements',
    type: 'group',
    help: 'Drawings or prints scattered into the margins, drifting at different speeds as the page scrolls. They keep clear of the text and are hidden on phones.',
    children: [
      {
        name: 'preset',
        label: 'Arrangement',
        type: 'choice',
        default: 'none',
        options: DECOR_PRESETS.map((p) => ({ value: p.value, label: p.label })),
      },
      {
        name: 'density',
        label: 'How many',
        type: 'choice',
        default: 'balanced',
        options: [
          { value: 'sparse', label: 'Two' },
          { value: 'balanced', label: 'Four' },
          { value: 'generous', label: 'All' },
        ],
        visibleWhen: { field: 'preset', equals: PRESET_VALUES },
      },
      {
        name: 'swatch',
        label: 'Colour of the drawings',
        type: 'swatch',
        default: 'accent',
        visibleWhen: { field: 'preset', equals: [...PRESET_VALUES, 'custom'] },
      },
      {
        name: 'opacity',
        label: 'Strength',
        type: 'number',
        default: 70,
        min: 10,
        max: 100,
        step: 5,
        suffix: '%',
        visibleWhen: { field: 'preset', equals: [...PRESET_VALUES, 'custom'] },
      },
      {
        name: 'layer',
        label: 'Depth',
        type: 'choice',
        default: 'behind',
        options: [
          { value: 'behind', label: 'Behind the content' },
          { value: 'front', label: 'In front' },
        ],
        visibleWhen: { field: 'preset', equals: [...PRESET_VALUES, 'custom'] },
      },
      {
        name: 'items',
        label: 'Choose the elements yourself',
        type: 'repeater',
        itemLabel: 'Element',
        wide: true,
        default: [],
        maxItems: 10,
        visibleWhen: { field: 'preset', equals: [...PRESET_VALUES, 'custom'] },
        help: 'Add one and it replaces the arrangement above. Across and Down are measured from the top left of the section, so 50 / 50 is dead centre.',
        children: [
          {
            name: 'src',
            label: 'Element',
            type: 'image',
            default: '',
            options: ELEMENT_OPTIONS,
            help: 'One of the drawings, a print of a session photograph, or any photograph from your library.',
          },
          { name: 'print', label: 'Show a photograph as a print, with a white border', type: 'boolean', default: true },
          { name: 'x', label: 'Across', type: 'number', default: 50, min: -10, max: 110, step: 1, suffix: '%' },
          { name: 'y', label: 'Down', type: 'number', default: 50, min: -10, max: 110, step: 1, suffix: '%' },
          { name: 'size', label: 'Size', type: 'number', default: 180, min: 60, max: 420, step: 10, suffix: 'px' },
          { name: 'speed', label: 'Drift speed', type: 'number', default: 1, min: 0, max: 2, step: 0.05, suffix: '×' },
          { name: 'rotate', label: 'Rotation', type: 'number', default: 0, min: -45, max: 45, step: 1, suffix: '°' },
          { name: 'opacity', label: 'Strength', type: 'number', default: 100, min: 10, max: 100, step: 5, suffix: '%' },
          { name: 'flip', label: 'Face the other way', type: 'boolean', default: false },
          { name: 'desktopOnly', label: 'Only on wide screens', type: 'boolean', default: false },
        ],
      },
    ],
  },
  {
    name: 'particles',
    label: 'Light in the air',
    type: 'group',
    children: [
      {
        name: 'style',
        label: 'Effect',
        type: 'choice',
        default: 'none',
        options: [
          { value: 'none', label: 'None' },
          { value: 'dust', label: 'Dust motes rising through the light' },
          { value: 'bokeh', label: 'Bokeh — soft out-of-focus circles' },
          { value: 'sparkle', label: 'Sparkle — tiny points that twinkle' },
        ],
      },
      {
        name: 'count',
        label: 'How many',
        type: 'number',
        default: 30,
        min: 5,
        max: 80,
        step: 5,
        visibleWhen: { field: 'style', equals: ['dust', 'bokeh', 'sparkle'] },
      },
      {
        name: 'from',
        label: 'Starting from',
        type: 'number',
        default: 40,
        min: 0,
        max: 90,
        step: 5,
        suffix: '% down',
        visibleWhen: { field: 'style', equals: ['dust', 'bokeh', 'sparkle'] },
      },
      {
        name: 'speed',
        label: 'Speed',
        type: 'number',
        default: 100,
        min: 25,
        max: 250,
        step: 25,
        suffix: '%',
        visibleWhen: { field: 'style', equals: ['dust', 'bokeh', 'sparkle'] },
      },
      {
        name: 'swatch',
        label: 'Colour',
        type: 'swatch',
        default: 'champagne',
        visibleWhen: { field: 'style', equals: ['dust', 'bokeh', 'sparkle'] },
      },
    ],
  },
  {
    name: 'watermark',
    label: 'Background motif',
    type: 'group',
    children: [
      {
        name: 'motif',
        label: 'Motif',
        type: 'choice',
        default: '',
        artwork: 'motifs',
        help: 'A large line drawing set faintly behind the section, painted in a palette colour.',
        options: MOTIF_OPTIONS,
      },
      {
        name: 'position',
        label: 'Position',
        type: 'choice',
        default: 'right',
        options: MOTIF_POSITIONS,
        visibleWhen: { field: 'motif', equals: ['__truthy__'] },
      },
      {
        name: 'size',
        label: 'Size',
        type: 'number',
        default: 460,
        min: 160,
        max: 900,
        step: 20,
        suffix: 'px',
        visibleWhen: { field: 'motif', equals: ['__truthy__'] },
      },
      {
        name: 'opacity',
        label: 'Strength',
        type: 'number',
        default: 10,
        min: 2,
        max: 40,
        step: 1,
        suffix: '%',
        visibleWhen: { field: 'motif', equals: ['__truthy__'] },
      },
      {
        name: 'weight',
        label: 'Line weight',
        type: 'number',
        default: 1.2,
        min: 0.5,
        max: 3,
        step: 0.1,
        suffix: 'px',
        visibleWhen: { field: 'motif', equals: ['__truthy__'] },
      },
      {
        name: 'swatch',
        label: 'Colour',
        type: 'swatch',
        default: 'accent',
        visibleWhen: { field: 'motif', equals: ['__truthy__'] },
      },
      { name: 'drift', label: 'Drifts as the page scrolls', type: 'boolean', default: true, visibleWhen: { field: 'motif', equals: ['__truthy__'] } },
    ],
  },
  {
    name: 'animation',
    label: 'Entrance',
    type: 'group',
    help: 'How the whole section arrives as it scrolls into view, on top of its own built-in reveals.',
    children: [
      {
        name: 'type',
        label: 'Animation',
        type: 'choice',
        default: 'none',
        options: [
          { value: 'none', label: 'Only the built-in reveals' },
          { value: 'fade', label: 'Fade in' },
          { value: 'rise', label: 'Rise up' },
          { value: 'scale', label: 'Settle in from slightly larger' },
          { value: 'curtain', label: 'Unveil from the bottom' },
          { value: 'slide-left', label: 'Slide in from the left' },
          { value: 'slide-right', label: 'Slide in from the right' },
          { value: 'blur', label: 'Come into focus' },
        ],
      },
      {
        name: 'delay',
        label: 'Delay',
        type: 'number',
        default: 0,
        min: 0,
        max: 1,
        step: 0.1,
        suffix: 's',
        visibleWhen: { field: 'type', equals: ['fade', 'rise', 'scale', 'curtain', 'slide-left', 'slide-right', 'blur'] },
      },
      {
        name: 'duration',
        label: 'Duration',
        type: 'choice',
        default: 'normal',
        options: [
          { value: 'quick', label: 'Quick' },
          { value: 'normal', label: 'Normal' },
          { value: 'slow', label: 'Slow' },
        ],
        visibleWhen: { field: 'type', equals: ['fade', 'rise', 'scale', 'curtain', 'slide-left', 'slide-right', 'blur'] },
      },
    ],
  },
  {
    name: 'anchor',
    label: 'Anchor',
    type: 'text',
    default: '',
    help: 'Lets a link jump to this section — "investment" makes /contact#investment land here.',
  },
  {
    name: 'rail_label',
    label: 'Name in the homepage index',
    type: 'text',
    default: '',
    help: 'On the home page, a section with an anchor and a name here gets a tick in the index down the left edge.',
  },
  { name: 'hide_desktop', label: 'Hide on desktop', type: 'boolean', default: false },
  { name: 'hide_mobile', label: 'Hide on phones', type: 'boolean', default: false },
]

/* ------------------------------------------------------------------ *
 * The widgets
 * ------------------------------------------------------------------ */

const BASE_WIDGETS: readonly WidgetDef[] = [
  /* =========================================================== Opening */
  {
    type: 'home_hero',
    label: 'Homepage opening',
    description: 'The full-screen photograph with the wordmark rising out of it, which draws in to a hung print as the page scrolls.',
    icon: 'hero',
    category: 'Opening',
    hosts: PAGES,
    fields: [
      eyebrow('Portraits · Urbandale, Iowa'),
      { name: 'lead', label: 'Wordmark', type: 'text', default: 'Ashley' },
      { name: 'script', label: 'Line under the wordmark', type: 'text', default: 'Photography' },
      {
        name: 'sub',
        label: 'Sentence at the bottom',
        type: 'textarea',
        default: 'Natural-light portraits of the people and places that make up a life.',
      },
      { name: 'scroll_label', label: 'Scroll cue', type: 'text', default: 'Scroll' },
      { name: 'scroll_target', label: 'Scroll cue jumps to', type: 'text', default: '#about' },
      image('image', 'Photograph'),
      alt('alt', 'A couple standing close together in a summer field, framed by a tree in full white blossom'),
    ],
  },
  {
    type: 'page_hero',
    label: 'Page masthead',
    description: 'A heading over a darkened photograph — the top of every interior page.',
    icon: 'header',
    category: 'Opening',
    hosts: ALL,
    fields: [
      eyebrow('Selected work'),
      { ...heading('The portfolio'), help: 'This is the page’s main heading, so there should be one per page.' },
      { name: 'body', label: 'Intro', type: 'textarea', default: '' },
      image('image', 'Photograph'),
      BUTTONS([]),
      { name: 'height', label: 'Height', type: 'choice', default: 'auto', options: [{ value: 'auto', label: 'As designed' }, { value: 'medium', label: 'Half the screen' }, { value: 'tall', label: 'Three quarters' }, { value: 'full', label: 'Full screen' }] },
      { name: 'align', label: 'Text alignment', type: 'choice', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centred' }] },
      { name: 'vertical', label: 'Text sits', type: 'choice', default: 'bottom', options: [{ value: 'bottom', label: 'Low' }, { value: 'center', label: 'In the middle' }], visibleWhen: { field: 'height', equals: ['medium', 'tall', 'full'] } },
      { name: 'overlay', label: 'Darken the photograph', type: 'number', default: 68, min: 0, max: 95, step: 5, suffix: '%' },
      { name: 'focal', label: 'Keep in frame', type: 'choice', default: 'center', options: [{ value: 'center', label: 'Centre' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
      { name: 'slow_zoom', label: 'Photograph zooms in slowly', type: 'boolean', default: false },
      { name: 'scroll_cue', label: 'Show a scroll cue', type: 'boolean', default: false },
    ],
  },
  {
    type: 'session_hero',
    label: 'Session masthead',
    description: 'The session’s title, summary, starting price and timing over its masthead photograph. Filled in from the session itself.',
    icon: 'header',
    category: 'Opening',
    hosts: ['session'],
    fields: [
      {
        name: 'eyebrow',
        label: 'Eyebrow',
        type: 'text',
        default: 'Session {index}',
        help: '{index} becomes the session’s number.',
      },
    ],
  },
  {
    type: 'guide_hero',
    label: 'Guide masthead',
    description: 'The guide’s title and subtitle over its photograph, with Copy link and Print buttons. Filled in from the guide itself.',
    icon: 'header',
    category: 'Opening',
    hosts: ['guide'],
    fields: [
      { name: 'copy_label', label: 'Copy button', type: 'text', default: 'Copy link' },
      { name: 'print_label', label: 'Print button', type: 'text', default: 'Print {title}', help: '{title} becomes the guide’s title.' },
    ],
  },

  /* ============================================================== Text */
  {
    type: 'marquee',
    label: 'Moving band',
    description: 'Large words crawling across the page, speeding up and reversing with the scroll.',
    icon: 'marquee',
    category: 'Text',
    hosts: ALL,
    fields: [
      {
        name: 'items',
        label: 'Words',
        type: 'lines',
        default: ['Senior Pictures', 'Graduation', 'Engagements', 'Couples', 'Families', 'Pets'],
        help: 'One per line.',
      },
      { name: 'speed', label: 'Speed', type: 'choice', default: 'normal', options: [{ value: 'slow', label: 'Slow' }, { value: 'normal', label: 'Normal' }, { value: 'fast', label: 'Fast' }] },
      { name: 'size', label: 'Size', type: 'choice', default: 'lg', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }] },
      { name: 'separator', label: 'Between the words', type: 'choice', default: 'arch', options: [{ value: 'arch', label: 'Arch' }, { value: 'dot', label: 'Dot' }, { value: 'star', label: 'Star' }, { value: 'none', label: 'Nothing' }] },
      { name: 'react_to_scroll', label: 'Speed up and reverse with the scroll', type: 'boolean', default: true },
      { name: 'direction', label: 'Direction', type: 'choice', default: 'left', options: [{ value: 'left', label: 'Right to left' }, { value: 'right', label: 'Left to right' }] },
      { name: 'face', label: 'Typeface', type: 'choice', default: 'display', options: [{ value: 'display', label: 'Display' }, { value: 'italic', label: 'Italic' }, { value: 'label', label: 'Small capitals' }] },
      { name: 'outline', label: 'Outlined letters', type: 'boolean', default: false },
    ],
  },
  {
    type: 'story',
    label: 'Introduction with two photographs',
    description: 'A heading and a few paragraphs beside a tall arched photograph and a smaller one overlapping it, with three figures underneath.',
    icon: 'mediaText',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow('A little context'),
      heading('Pictures capture a moment in time — a picture keeps it.'),
      { name: 'body', label: 'Body', type: 'richtext', default: '', wide: true },
      {
        name: 'stats',
        label: 'Figures',
        type: 'repeater',
        itemLabel: 'Figure',
        maxItems: 4,
        default: [],
        children: [
          { name: 'value', label: 'Figure', type: 'text', default: '' },
          { name: 'label', label: 'Label', type: 'text', default: '' },
        ],
      },
      image('image', 'Tall photograph'),
      alt('alt'),
      image('image_offset', 'Smaller overlapping photograph'),
      alt('alt_offset'),
      { name: 'caption', label: 'Caption under the small photograph', type: 'text', default: 'Central Iowa · 2024' },
      { name: 'image_side', label: 'Photograph on the', type: 'choice', default: 'right', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
    ],
  },
  {
    type: 'text_block',
    label: 'Heading and text',
    description: 'A heading with paragraphs and buttons — stacked, or with the heading beside the text.',
    icon: 'text',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow(),
      heading(),
      { name: 'body', label: 'Body', type: 'richtext', default: '', wide: true },
      BUTTONS(),
      {
        name: 'layout',
        label: 'Layout',
        type: 'choice',
        default: 'stacked',
        options: [
          { value: 'stacked', label: 'Stacked' },
          { value: 'split', label: 'Heading beside the text' },
          { value: 'close', label: 'Closing — a large heading, then the buttons' },
        ],
      },
      { name: 'drop_cap', label: 'Drop cap on the first paragraph', type: 'boolean', default: false },
      { name: 'text_columns', label: 'Text columns', type: 'choice', default: '1', options: [{ value: '1', label: 'One' }, { value: '2', label: 'Two' }] },
    ],
  },
  {
    type: 'about_intro',
    label: 'Behind the camera',
    description: 'An arched portrait with a framing rule, a heading and paragraphs, and a signature.',
    icon: 'mediaText',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow('Behind the camera'),
      heading('The frame I am waiting for is the one nobody planned.'),
      { name: 'body', label: 'Body', type: 'richtext', default: '', wide: true },
      image('image', 'Portrait'),
      alt('alt', 'Ashley, sitting at an outdoor table on a summer afternoon'),
      { name: 'signature', label: 'Signature', type: 'text', default: 'Ashley' },
      { name: 'show_instagram', label: 'Show the Instagram link', type: 'boolean', default: true },
      { name: 'image_side', label: 'Photograph on the', type: 'choice', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
      { name: 'shape', label: 'Photograph shape', type: 'choice', default: 'arch', options: [{ value: 'arch', label: 'Arched top' }, { value: 'portrait', label: 'Portrait' }, { value: 'square', label: 'Square' }] },
      { name: 'frame_rule', label: 'Show the framing line', type: 'boolean', default: true },
    ],
  },
  {
    type: 'numbered_cards',
    label: 'Numbered points',
    description: 'Short titled paragraphs in a grid, each with its number above.',
    icon: 'services',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow('However you book it'),
      heading('Four things that are always true'),
      {
        name: 'items',
        label: 'Points',
        type: 'repeater',
        itemLabel: 'Point',
        default: [],
        children: [
          { name: 'title', label: 'Title', type: 'text', default: '' },
          { name: 'body', label: 'Body', type: 'textarea', default: '' },
        ],
      },
      { name: 'columns', label: 'Columns on a wide screen', type: 'choice', default: '2', options: [{ value: '2', label: 'Two' }, { value: '3', label: 'Three' }, { value: '4', label: 'Four' }] },
      { name: 'show_numbers', label: 'Show the numbers', type: 'boolean', default: true },
    ],
  },
  {
    type: 'checklist_split',
    label: 'Itemized list',
    description: 'A heading and intro on one side, a ruled list with plus marks on the other.',
    icon: 'list',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow('What you receive'),
      heading('Everything that comes with a session'),
      { name: 'body', label: 'Intro', type: 'textarea', default: '' },
      { name: 'link_label', label: 'Link label', type: 'text', default: 'Packages and add-ons' },
      { name: 'link_href', label: 'Link', type: 'link', default: '/contact#investment' },
      { name: 'items', label: 'Items', type: 'lines', default: [], help: 'One per line.' },
      { name: 'list_columns', label: 'List columns', type: 'choice', default: '1', options: [{ value: '1', label: 'One' }, { value: '2', label: 'Two' }] },
    ],
  },
  {
    type: 'timeline_arc',
    label: 'Start-to-finish timeline',
    description: 'A vertical run of dated steps beside a photograph that stays in view as the list scrolls.',
    icon: 'timeline',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow('Start to finish'),
      heading('How it goes, every time'),
      { name: 'lead', label: 'Intro', type: 'textarea', default: '' },
      {
        name: 'items',
        label: 'Steps',
        type: 'repeater',
        itemLabel: 'Step',
        default: [],
        children: [
          { name: 'time', label: 'When', type: 'text', default: '' },
          { name: 'title', label: 'Title', type: 'text', default: '' },
          { name: 'detail', label: 'Detail', type: 'textarea', default: '' },
        ],
      },
      image('image', 'Photograph'),
      alt('alt'),
      { name: 'caption', label: 'Caption', type: 'text', default: 'Central Iowa · golden hour' },
    ],
  },
  {
    type: 'about_essays',
    label: 'Portrait and short essays',
    description: 'One or two portraits held in view beside numbered short essays.',
    icon: 'mediaText',
    category: 'Text',
    hosts: ALL,
    fields: [
      image('portrait', 'Portrait'),
      alt('portrait_alt', 'Ashley'),
      { name: 'caption', label: 'Caption', type: 'text', default: 'Urbandale, Iowa' },
      image('secondary', 'Second portrait'),
      alt('secondary_alt', 'Ashley'),
      {
        name: 'columns',
        label: 'Essays',
        type: 'repeater',
        itemLabel: 'Essay',
        default: [],
        children: [
          { name: 'title', label: 'Title', type: 'text', default: '' },
          { name: 'body', label: 'Body', type: 'textarea', default: '' },
        ],
      },
    ],
  },
  {
    type: 'milestones',
    label: 'Milestones',
    description: 'Years in large type, each with a title and a line, in a grid.',
    icon: 'timeline',
    category: 'Text',
    hosts: ALL,
    fields: [
      heading('How it went'),
      {
        name: 'entries',
        label: 'Milestones',
        type: 'repeater',
        itemLabel: 'Milestone',
        default: [],
        children: [
          { name: 'year', label: 'Year', type: 'text', default: '' },
          { name: 'title', label: 'Title', type: 'text', default: '' },
          { name: 'body', label: 'Body', type: 'textarea', default: '' },
        ],
      },
      { name: 'columns', label: 'Columns on a wide screen', type: 'choice', default: '3', options: [{ value: '2', label: 'Two' }, { value: '3', label: 'Three' }, { value: '4', label: 'Four' }] },
    ],
  },
  {
    type: 'aside_cta',
    label: 'Aside and call to action',
    description: 'An italic aside on one side; a heading and buttons on the other.',
    icon: 'cta',
    category: 'Text',
    hosts: ALL,
    fields: [
      { name: 'aside_title', label: 'Aside label', type: 'text', default: 'Design, too' },
      { name: 'aside_body', label: 'Aside', type: 'textarea', default: '' },
      heading('Want to make some?'),
      BUTTONS([
        { label: 'Start an inquiry', href: '/contact', style: 'primary' },
        { label: 'See the portfolio', href: '/portfolio', style: 'secondary' },
      ]),
    ],
  },
  {
    type: 'cta_close',
    label: 'Closing call to action',
    description: 'A label, a large heading, a paragraph and buttons — the end of a page. On a session page, {session} becomes the session’s name.',
    icon: 'cta',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow('Bookings open'),
      heading('Let’s plan your {session}.'),
      { name: 'body', label: 'Body', type: 'textarea', default: '' },
      BUTTONS([
        { label: 'Inquire about this', href: '/contact?session={slug}', style: 'primary' },
        { label: 'All six sessions', href: '/sessions', style: 'secondary' },
      ]),
      { name: 'rule', label: 'Draw a rule above it', type: 'boolean', default: false },
      { name: 'layout', label: 'Layout', type: 'choice', default: 'stacked', options: [{ value: 'stacked', label: 'Stacked' }, { value: 'split', label: 'Heading left, buttons right' }] },
    ],
  },

  {
    type: 'quote',
    label: 'Pull quote',
    description: 'A single line, set large, with an attribution.',
    icon: 'quote',
    category: 'Text',
    hosts: ALL,
    fields: [
      { name: 'quote', label: 'Quote', type: 'textarea', default: '' },
      { name: 'attribution', label: 'Attribution', type: 'text', default: '' },
      { name: 'style', label: 'Style', type: 'choice', default: 'display', options: [{ value: 'display', label: 'Large, set in the display face' }, { value: 'aside', label: 'Italic, with a rule beside it' }] },
      { name: 'image', label: 'Portrait beside it', type: 'image', default: '' },
      { name: 'source', label: 'Source', type: 'text', default: '', help: 'Where it came from — a review, a card, a session.' },
      { name: 'marks', label: 'Show quotation marks', type: 'boolean', default: false },
      { name: 'swatch', label: 'Accent colour', type: 'swatch', default: 'accent' },
    ],
  },
  {
    type: 'faq',
    label: 'Questions',
    description: 'Questions that open to their answers one at a time, beside a heading.',
    icon: 'accordion',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow('Questions'),
      heading('The things people ask first'),
      { name: 'intro', label: 'Intro', type: 'textarea', default: '' },
      { name: 'link_label', label: 'Link label', type: 'text', default: '' },
      { name: 'link_href', label: 'Link', type: 'link', default: '' },
      { name: 'open_first', label: 'Open the first question', type: 'boolean', default: true },
      {
        name: 'items',
        label: 'Questions',
        type: 'repeater',
        itemLabel: 'Question',
        default: [],
        children: [
          { name: 'q', label: 'Question', type: 'text', default: '' },
          { name: 'a', label: 'Answer', type: 'textarea', default: '' },
        ],
      },
      { name: 'layout', label: 'Layout', type: 'choice', default: 'split', options: [{ value: 'split', label: 'Heading beside the questions' }, { value: 'stacked', label: 'Heading above the questions' }] },
      { name: 'one_at_a_time', label: 'Only one open at a time', type: 'boolean', default: true },
    ],
  },

  /* ============================================================ Photos */
  {
    type: 'selected_work',
    label: 'Selected work',
    description: 'A hand-placed, asymmetric gallery of up to nine photographs with captions, each drifting at its own pace.',
    icon: 'gallery',
    category: 'Photos',
    hosts: ALL,
    fields: [
      eyebrow('Selected work'),
      heading('Afternoons around Des Moines'),
      { name: 'link_label', label: 'Link label', type: 'text', default: 'Full portfolio' },
      { name: 'link_href', label: 'Link', type: 'link', default: '/portfolio' },
      {
        name: 'items',
        label: 'Photographs',
        type: 'repeater',
        itemLabel: 'Photograph',
        maxItems: 9,
        default: [],
        children: [
          { name: 'image', label: 'Photograph', type: 'image', default: '' },
          { name: 'caption', label: 'Caption', type: 'text', default: '' },
          {
            name: 'span',
            label: 'Shape',
            type: 'choice',
            default: 'tall',
            options: [
              { value: 'tall', label: 'Tall' },
              { value: 'wide', label: 'Wide' },
              { value: 'std', label: 'Portrait' },
            ],
          },
        ],
      },
      { name: 'show_captions', label: 'Show captions', type: 'boolean', default: true },
      { name: 'show_counter', label: 'Show the 01 / 09 counter', type: 'boolean', default: true },
    ],
  },
  {
    type: 'process',
    label: 'Stacked steps',
    description: 'Steps on cards that pin as you scroll, each sliding over the last, with a photograph on every card.',
    icon: 'services',
    category: 'Photos',
    hosts: ALL,
    fields: [
      eyebrow('Start to finish'),
      heading('Three steps, and none of them are stressful.'),
      {
        name: 'steps',
        label: 'Steps',
        type: 'repeater',
        itemLabel: 'Step',
        maxItems: 6,
        default: [],
        children: [
          { name: 'title', label: 'Title', type: 'text', default: '' },
          { name: 'body', label: 'Body', type: 'textarea', default: '' },
          { name: 'image', label: 'Photograph', type: 'image', default: '' },
        ],
      },
      { name: 'show_step_count', label: 'Show “Step 1 of 3”', type: 'boolean', default: true },
    ],
  },
  {
    type: 'photo_gallery',
    label: 'Photo gallery',
    description: 'Photographs in balanced columns that open full screen when clicked.',
    icon: 'gallery',
    category: 'Photos',
    hosts: ALL,
    fields: [
      eyebrow(),
      heading(),
      { name: 'images', label: 'Photographs', type: 'images', default: [], wide: true },
      {
        name: 'columns',
        label: 'Columns on a wide screen',
        type: 'choice',
        default: '3',
        options: [
          { value: '2', label: 'Two' },
          { value: '3', label: 'Three' },
          { value: '4', label: 'Four' },
        ],
      },
      { name: 'caption', label: 'Caption in the full-screen view', type: 'text', default: '' },
      {
        name: 'layout',
        label: 'Layout',
        type: 'choice',
        default: 'masonry',
        options: [
          { value: 'masonry', label: 'Balanced columns — every photo uncropped' },
          { value: 'grid', label: 'Even grid — every photo the same shape' },
          { value: 'carousel', label: 'Carousel — a row you swipe through' },
          { value: 'drift', label: 'Drift — columns move at different speeds' },
        ],
      },
      {
        name: 'ratio',
        label: 'Shape in the grid and carousel',
        type: 'choice',
        default: '4/5',
        options: [
          { value: '4/5', label: 'Portrait — 4:5' },
          { value: '3/4', label: 'Tall — 3:4' },
          { value: '1/1', label: 'Square' },
          { value: '3/2', label: 'Landscape — 3:2' },
        ],
        visibleWhen: { field: 'layout', equals: ['grid', 'carousel'] },
      },
      { name: 'gap', label: 'Space between', type: 'choice', default: 'normal', options: [{ value: 'tight', label: 'Tight' }, { value: 'normal', label: 'Normal' }, { value: 'loose', label: 'Loose' }] },
      { name: 'lightbox', label: 'Open full size on click', type: 'boolean', default: true },
      { name: 'hover', label: 'Hover effect', type: 'choice', default: 'zoom', options: [{ value: 'zoom', label: 'Slow zoom' }, { value: 'lift', label: 'Lift' }, { value: 'none', label: 'None' }] },
    ],
  },
  {
    type: 'image_block',
    label: 'Photograph',
    description: 'One photograph, with an optional caption.',
    icon: 'image',
    category: 'Photos',
    hosts: ALL,
    fields: [
      image('image', 'Photograph'),
      alt('alt'),
      { name: 'caption', label: 'Caption', type: 'text', default: '' },
      {
        name: 'shape',
        label: 'Shape',
        type: 'choice',
        default: 'auto',
        options: [
          { value: 'square', label: 'Square' },
          { value: 'tall', label: 'Tall — 2:3' },
          { value: 'cinema', label: 'Cinematic — 21:9' },
          { value: 'auto', label: 'As the photograph is' },
          { value: 'arch', label: 'Arched top' },
          { value: 'wide', label: 'Wide — 3:2' },
          { value: 'portrait', label: 'Portrait — 4:5' },
        ],
      },
      {
        name: 'width',
        label: 'Width',
        type: 'choice',
        default: 'wide',
        options: [
          { value: 'narrow', label: 'Narrow' },
          { value: 'wide', label: 'Page width' },
          { value: 'full', label: 'Edge to edge' },
        ],
      },
      { name: 'focal', label: 'Keep in frame', type: 'choice', default: 'center', options: [{ value: 'center', label: 'Centre' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }] },
      { name: 'frame', label: 'Frame', type: 'choice', default: 'none', options: [{ value: 'none', label: 'None' }, { value: 'hairline', label: 'Hairline' }, { value: 'plate', label: 'Plate — an inset border, like a mounted print' }, { value: 'print', label: 'Print — a white border and a shadow' }] },
      { name: 'parallax', label: 'Photograph drifts as you scroll', type: 'boolean', default: false },
      { name: 'lightbox', label: 'Open full size on click', type: 'boolean', default: false },
    ],
  },
  {
    type: 'image_text',
    label: 'Photograph and text',
    description: 'A photograph beside a heading, paragraphs and buttons.',
    icon: 'mediaText',
    category: 'Photos',
    hosts: ALL,
    fields: [
      eyebrow(),
      heading(),
      { name: 'body', label: 'Body', type: 'richtext', default: '', wide: true },
      BUTTONS(),
      image('image', 'Photograph'),
      alt('alt'),
      {
        name: 'side',
        label: 'Photograph on the',
        type: 'choice',
        default: 'right',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
        ],
      },
      { name: 'arch', label: 'Arched top', type: 'boolean', default: true },
      { name: 'ratio', label: 'Shape', type: 'choice', default: '3/4', options: [{ value: '3/4', label: 'Tall — 3:4' }, { value: '4/5', label: 'Portrait — 4:5' }, { value: '1/1', label: 'Square' }, { value: '3/2', label: 'Landscape — 3:2' }] },
      { name: 'split', label: 'Column split', type: 'choice', default: 'even', options: [{ value: 'small', label: 'Photograph smaller' }, { value: 'even', label: 'Even' }, { value: 'large', label: 'Photograph larger' }] },
      { name: 'parallax', label: 'Photograph drifts as you scroll', type: 'boolean', default: true },
      { name: 'overlap', label: 'Overlap the columns slightly', type: 'boolean', default: false },
    ],
  },

  /* ========================================================== Sessions */
  {
    type: 'sessions_index',
    label: 'Session list',
    description: 'Every published session as a large typographic list; hovering a row brings its photograph in under the pointer. Cards on a phone.',
    icon: 'list',
    category: 'Sessions',
    hosts: ALL,
    fields: [
      eyebrow('What I photograph'),
      heading('Sessions'),
      {
        name: 'blurb',
        label: 'Note beside the heading',
        type: 'textarea',
        default:
          'Six ways in. Senior sessions are a set package; everything else is planned around you — usually one location, chosen together, anywhere in the Des Moines metro.',
      },
      { name: 'sessions', label: 'Which sessions', type: 'sessions', default: [], wide: true, help: 'Leave empty for all of them, in the order set under Sessions.' },
    ],
  },
  {
    type: 'session_cards',
    label: 'Session cards',
    description: 'Every published session as a large card with its starting price, timing and links to its page, guide and albums.',
    icon: 'grid',
    category: 'Sessions',
    hosts: ALL,
    fields: [
      { name: 'cta_label', label: 'Main link', type: 'text', default: 'The full session' },
      { name: 'guide_label', label: 'Guide link', type: 'text', default: 'Prep guide' },
      { name: 'featured_prefix', label: 'Before the most-booked tier', type: 'text', default: 'Most booked:' },
      { name: 'sessions', label: 'Which sessions', type: 'sessions', default: [], wide: true, help: 'Leave empty for all of them, in the order set under Sessions.' },
    ],
  },
  {
    type: 'always_included',
    label: 'In every session',
    description: 'The list of what comes with every session, from the pricing settings, beside a heading and links.',
    icon: 'list',
    category: 'Sessions',
    hosts: ALL,
    fields: [
      eyebrow('Whichever you pick'),
      heading('These come with all of them'),
      {
        name: 'links',
        label: 'Links',
        type: 'repeater',
        itemLabel: 'Link',
        maxItems: 3,
        default: [
          { label: 'Every tier, every price', href: '/contact#investment' },
          { label: 'The client guides', href: '/guides' },
        ],
        children: [
          { name: 'label', label: 'Label', type: 'text', default: '' },
          { name: 'href', label: 'Link', type: 'link', default: '' },
        ],
      },
    ],
  },
  {
    type: 'session_links',
    label: 'Pick your session',
    description: 'The published sessions as a row of large links, with a link to them all.',
    icon: 'list',
    category: 'Sessions',
    hosts: ALL,
    fields: [
      heading('Now pick your session'),
      { name: 'link_label', label: 'Link label', type: 'text', default: 'All six, in detail' },
      { name: 'link_href', label: 'Link', type: 'link', default: '/sessions' },
      { name: 'close_heading', label: 'Closing heading', type: 'text', default: '', help: 'Optional — a closing heading under the list, after a rule.' },
      { name: 'close_body', label: 'Closing paragraph', type: 'textarea', default: '' },
      { name: 'close_label', label: 'Closing button', type: 'text', default: '' },
      { name: 'close_href', label: 'Closing button link', type: 'link', default: '/contact' },
      { name: 'sessions', label: 'Which sessions', type: 'sessions', default: [], wide: true, help: 'Leave empty for all of them, in the order set under Sessions.' },
    ],
  },
  {
    type: 'session_overview',
    label: 'What it actually is',
    description: 'The session’s long copy and the list of what it includes, beside its arched photograph and two smaller ones.',
    icon: 'mediaText',
    category: 'Sessions',
    hosts: ['session'],
    fields: [eyebrow('What it actually is')],
  },
  {
    type: 'session_pricing',
    label: 'Session pricing',
    description: 'This session’s tiers, its editing note and everything included in every tier.',
    icon: 'pricing',
    category: 'Sessions',
    hosts: ['session'],
    fields: [
      eyebrow('Investment'),
      heading('Three ways to do it'),
      { name: 'cta_label', label: 'Button on each tier', type: 'text', default: 'Inquire' },
      { name: 'included_label', label: 'Label over the inclusions', type: 'text', default: 'In every tier' },
      { name: 'link_label', label: 'Link label', type: 'text', default: 'Add-ons and booking terms' },
      { name: 'link_href', label: 'Link', type: 'link', default: '/contact#investment' },
    ],
  },
  {
    type: 'session_guide',
    label: 'Session prep guide',
    description: 'The guide connected to this session, with its at-a-glance table.',
    icon: 'guide',
    category: 'Sessions',
    hosts: ['session'],
    fields: [
      eyebrow('Before the session'),
      heading('Your prep guide'),
      { name: 'button_label', label: 'Button', type: 'text', default: 'Read the guide' },
    ],
  },
  {
    type: 'session_albums',
    label: 'Sessions like yours',
    description: 'Albums from this session’s portfolio category.',
    icon: 'grid',
    category: 'Sessions',
    hosts: ['session'],
    fields: [
      heading('Sessions like yours'),
      { name: 'link_label', label: 'Link label', type: 'text', default: 'See them all' },
      { name: 'limit', label: 'How many', type: 'number', default: 3, min: 1, max: 12 },
    ],
  },
  {
    type: 'session_nav',
    label: 'Previous and next session',
    description: 'Links through to the sessions either side of this one.',
    icon: 'divider',
    category: 'Sessions',
    hosts: ['session'],
    fields: [
      { name: 'previous_label', label: 'Previous', type: 'text', default: 'Previous' },
      { name: 'next_label', label: 'Next', type: 'text', default: 'Next' },
    ],
  },

  /* =========================================================== Pricing */
  {
    type: 'investment',
    label: 'Pricing, every session',
    description: 'Every session’s tiers on tabs, then what is always included, the add-ons and how booking works — all from the pricing settings.',
    icon: 'pricing',
    category: 'Pricing',
    hosts: ALL,
    fields: [
      eyebrow('Investment'),
      heading('Three tiers for every kind of session'),
      {
        name: 'blurb',
        label: 'Note beside the heading',
        type: 'textarea',
        default:
          'Nothing is quoted after the fact. Pick the session, then pick how much of a day you want — the time, the locations, the outfits and the number of photographs are stated on every tier. Senior and engagement prices are sent on request rather than posted.',
      },
      { name: 'cta_label', label: 'Button on each tier', type: 'text', default: 'Inquire' },
      { name: 'cta_href', label: 'Button link', type: 'link', default: '#inquire' },
      { name: 'included_label', label: 'Label over the inclusions', type: 'text', default: 'In every session' },
      { name: 'addons_heading', label: 'Add-ons heading', type: 'text', default: 'If you want more' },
      {
        name: 'addons_blurb',
        label: 'Add-ons note',
        type: 'textarea',
        default:
          'Added before the session or after it — including after you have seen the gallery and changed your mind, which is the most common one.',
      },
      { name: 'show_booking', label: 'Show how booking works', type: 'boolean', default: true },
      {
        name: 'footnote',
        label: 'Footnote',
        type: 'textarea',
        default:
          'Travel anywhere in the Des Moines metro is included; further afield is welcome for a travel fee, quoted before you commit to anything.',
      },
    ],
  },
  {
    type: 'finishing_levels',
    label: 'How photographs are finished',
    description: 'The two editing levels side by side, from the policy settings.',
    icon: 'columns',
    category: 'Pricing',
    hosts: ALL,
    fields: [
      eyebrow('How the photographs are finished'),
      heading('Two levels, and you should know which you are getting'),
      { name: 'body', label: 'Intro', type: 'textarea', default: '' },
      { name: 'applies_retouched', label: 'Who gets fully retouched', type: 'text', default: 'Senior pictures · Graduation · Families' },
      { name: 'applies_natural', label: 'Who gets naturally edited', type: 'text', default: 'Engagements · Couples · Pets' },
    ],
  },
  {
    type: 'weather_policy',
    label: 'Weather and moving a date',
    description: 'The weather policy in four columns and the reschedule rule, from the policy settings.',
    icon: 'columns',
    category: 'Pricing',
    hosts: ALL,
    fields: [
      eyebrow('Weather, and moving a date'),
      heading('Gray skies are good news'),
      { name: 'word', label: 'Call it a', type: 'text', default: 'session', help: '"…we move the session, free…"' },
    ],
  },
  {
    type: 'gallery_timeline',
    label: 'Gallery timeline',
    description: 'The online gallery’s year drawn as a line, with markers for the reminders.',
    icon: 'timeline',
    category: 'Pricing',
    hosts: ALL,
    fields: [
      eyebrow('Your gallery'),
      heading('Online for a year, and you will never be caught out by the deadline.'),
      { name: 'body', label: 'Body', type: 'textarea', default: '' },
      {
        name: 'points',
        label: 'Markers',
        type: 'repeater',
        itemLabel: 'Marker',
        maxItems: 6,
        default: [],
        children: [
          { name: 'at', label: 'Position along the year', type: 'number', default: 0, min: 0, max: 100, step: 0.5, suffix: '%' },
          { name: 'label', label: 'Label', type: 'text', default: '' },
          { name: 'detail', label: 'Detail', type: 'text', default: '' },
        ],
      },
    ],
  },

  /* ========================================================= Portfolio */
  {
    type: 'portfolio_listing',
    label: 'Portfolio grid',
    description: 'Every published album, newest first, with a filter bar for the portfolio categories. `?c=seniors` in the address arrives filtered.',
    icon: 'grid',
    category: 'Portfolio',
    hosts: PAGES,
    fields: [
      { name: 'all_label', label: 'Everything filter', type: 'text', default: 'Everything' },
      { name: 'frames_label', label: 'After the photo count', type: 'text', default: 'frames' },
      { name: 'empty', label: 'When a category is empty', type: 'text', default: 'Nothing in this category yet.' },
      { name: 'columns', label: 'Columns on a wide screen', type: 'choice', default: '3', options: [{ value: '2', label: 'Two' }, { value: '3', label: 'Three' }, { value: '4', label: 'Four' }] },
      { name: 'ratio', label: 'Card shape', type: 'choice', default: '3/4', options: [{ value: '3/4', label: 'Tall — 3:4' }, { value: '4/5', label: 'Portrait — 4:5' }, { value: '1/1', label: 'Square' }, { value: '3/2', label: 'Landscape — 3:2' }] },
      { name: 'show_filters', label: 'Show the category filters', type: 'boolean', default: true },
      { name: 'show_count', label: 'Show how many photographs', type: 'boolean', default: true },
      { name: 'category', label: 'Only this category', type: 'category', default: '', help: 'Leave empty for everything.' },
      { name: 'style', label: 'Listing style', type: 'choice', default: 'grid', options: [{ value: 'grid', label: 'Even grid' }, { value: 'masonry', label: 'Masonry — every cover uncropped' }, { value: 'index', label: 'Index — a typographic list' }] },
      { name: 'hover', label: 'Hover effect', type: 'choice', default: 'zoom', options: [{ value: 'zoom', label: 'Slow zoom' }, { value: 'lift', label: 'Lift' }, { value: 'none', label: 'None' }] },
      { name: 'per_page', label: 'Albums before “Load more”', type: 'number', default: 48, min: 3, max: 96, step: 3, suffix: '' },
      { name: 'show_category', label: 'Show the category on each card', type: 'boolean', default: true },
      { name: 'show_details', label: 'Show the date and place', type: 'boolean', default: true },
      { name: 'show_search', label: 'Search field', type: 'boolean', default: false },
      { name: 'default_sort', label: 'Order', type: 'choice', default: 'newest', options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'title', label: 'Title A–Z' }, { value: 'featured', label: 'Featured first' }] },
      { name: 'filter_style', label: 'Filter style', type: 'choice', default: 'pills', options: [{ value: 'pills', label: 'Pills' }, { value: 'rail', label: 'A line of links' }, { value: 'dropdown', label: 'A dropdown' }] },
      { name: 'more_label', label: 'Load more label', type: 'text', default: 'Load more' },
    ],
  },

  /* ============================================================= Guide */
  {
    type: 'guides_listing',
    label: 'Guide list',
    description: 'Every published guide as a ruled row with its photograph and chapter count.',
    icon: 'list',
    category: 'Guide',
    hosts: PAGES,
    fields: [{ name: 'link_label', label: 'Link on each row', type: 'text', default: 'Read it' }],
  },
  {
    type: 'guide_letter',
    label: 'Guide letter',
    description: 'The opening letter and the at-a-glance table, from the guide’s details.',
    icon: 'text',
    category: 'Guide',
    hosts: ['guide'],
    fields: [
      eyebrow('First, the short version'),
      { name: 'glance_label', label: 'Table label', type: 'text', default: 'At a glance' },
      { name: 'link_label', label: 'Link to the session', type: 'text', default: 'Pricing for this session' },
    ],
  },
  {
    type: 'guide_chapter',
    label: 'Chapter',
    description: 'Starts a new chapter. Every block after it, up to the next chapter, belongs to it — and the chapter index is built from these.',
    icon: 'header',
    category: 'Guide',
    hosts: ['guide'],
    fields: [
      { name: 'title', label: 'Chapter title', type: 'text', default: 'New chapter' },
      { name: 'lead', label: 'One line under it', type: 'textarea', default: '' },
      { name: 'anchor', label: 'Anchor', type: 'text', default: '', help: 'Lets a link jump straight to this chapter. Made from the title when empty.' },
    ],
  },
  {
    type: 'guide_prose',
    label: 'Paragraphs',
    description: 'Body copy inside a chapter.',
    icon: 'text',
    category: 'Guide',
    hosts: ['guide'],
    fields: [{ name: 'body', label: 'Body', type: 'richtext', default: '', wide: true }],
  },
  {
    type: 'guide_timeline',
    label: 'Times through the day',
    description: 'A run of times, each with a title and a line.',
    icon: 'timeline',
    category: 'Guide',
    hosts: ['guide'],
    fields: [
      {
        name: 'items',
        label: 'Times',
        type: 'repeater',
        itemLabel: 'Time',
        default: [],
        children: [
          { name: 'time', label: 'When', type: 'text', default: '' },
          { name: 'title', label: 'Title', type: 'text', default: '' },
          { name: 'detail', label: 'Detail', type: 'textarea', default: '' },
        ],
      },
    ],
  },
  {
    type: 'guide_steps',
    label: 'Countdown',
    description: 'Numbered steps — two weeks out, the night before, the morning of.',
    icon: 'list',
    category: 'Guide',
    hosts: ['guide'],
    fields: [
      {
        name: 'items',
        label: 'Steps',
        type: 'repeater',
        itemLabel: 'Step',
        default: [],
        children: [
          { name: 'label', label: 'When', type: 'text', default: '' },
          { name: 'detail', label: 'What to do', type: 'textarea', default: '' },
        ],
      },
    ],
  },
  {
    type: 'guide_checklist',
    label: 'Checklist',
    description: 'Ticks that stay ticked on the reader’s own device, so a client can pack over two evenings.',
    icon: 'list',
    category: 'Guide',
    hosts: ['guide'],
    fields: [{ name: 'items', label: 'Items', type: 'lines', default: [], help: 'One per line.' }],
  },
  {
    type: 'guide_columns',
    label: 'Side-by-side notes',
    description: 'Two to four short titled paragraphs, side by side.',
    icon: 'columns',
    category: 'Guide',
    hosts: ['guide'],
    fields: [
      {
        name: 'items',
        label: 'Notes',
        type: 'repeater',
        itemLabel: 'Note',
        maxItems: 4,
        default: [],
        children: [
          { name: 'title', label: 'Title', type: 'text', default: '' },
          { name: 'body', label: 'Body', type: 'textarea', default: '' },
        ],
      },
    ],
  },
  {
    type: 'guide_compare',
    label: 'Does and does not',
    description: 'Two lists side by side — what works, and what fights the camera.',
    icon: 'columns',
    category: 'Guide',
    hosts: ['guide'],
    fields: [
      { name: 'yes_title', label: 'Left heading', type: 'text', default: 'What works' },
      { name: 'yes_items', label: 'Left list', type: 'lines', default: [], help: 'One per line.' },
      { name: 'no_title', label: 'Right heading', type: 'text', default: 'What fights the camera' },
      { name: 'no_items', label: 'Right list', type: 'lines', default: [], help: 'One per line.' },
    ],
  },
  {
    type: 'guide_note',
    label: 'Pulled-out note',
    description: 'A single aside, set apart from the copy around it.',
    icon: 'quote',
    category: 'Guide',
    hosts: ['guide'],
    fields: [{ name: 'text', label: 'Note', type: 'textarea', default: '' }],
  },
  {
    type: 'guide_vendors',
    label: 'Recommendations',
    description: 'Hair and makeup, or lunch stops, as cards — from the vendor lists in Settings, so a change there reaches every guide.',
    icon: 'grid',
    category: 'Guide',
    hosts: ['guide'],
    fields: [
      {
        name: 'list',
        label: 'Which list',
        type: 'choice',
        default: 'hair_and_makeup',
        options: [
          { value: 'hair_and_makeup', label: 'Hair and makeup' },
          { value: 'lunch_stops', label: 'Lunch stops' },
        ],
      },
    ],
  },
  {
    type: 'guide_location_cards',
    label: 'Location cards',
    description: 'The suggested locations as cards, each opening a slider of its photographs — from Settings → Recommendations.',
    icon: 'grid',
    category: 'Guide',
    hosts: ['guide'],
    fields: [],
  },
  {
    type: 'guide_locations',
    label: 'Locations',
    description: 'The location suggestions, grouped by what they look like — from Settings.',
    icon: 'grid',
    category: 'Guide',
    hosts: ['guide'],
    fields: [],
  },
  {
    type: 'guide_editing',
    label: 'How it is edited',
    description: 'The editing level this guide’s session gets, and why it sets the number of photographs — from the policy settings.',
    icon: 'columns',
    category: 'Guide',
    hosts: ['guide'],
    fields: [{ name: 'why_title', label: 'Second note’s title', type: 'text', default: 'Why the number of photographs varies' }],
  },
  {
    type: 'guide_weather',
    label: 'Weather columns',
    description: 'The weather policy in columns, from the policy settings.',
    icon: 'columns',
    category: 'Guide',
    hosts: ['guide'],
    fields: [
      { name: 'word', label: 'Call it a', type: 'text', default: 'session', help: '"…we move the session, free…"' },
      { name: 'show_reschedule', label: 'Add the reschedule rule after it', type: 'boolean', default: true },
    ],
  },
  {
    type: 'guide_close',
    label: 'Guide ending',
    description: 'The sign-off, with links to the session and to the other guides.',
    icon: 'cta',
    category: 'Guide',
    hosts: ['guide'],
    fields: [
      eyebrow('That is everything'),
      heading('Anything else, just ask.'),
      { name: 'body', label: 'Body', type: 'textarea', default: '' },
      { name: 'button_label', label: 'Button', type: 'text', default: 'Ask me something' },
      { name: 'others_label', label: 'Label over the other guides', type: 'text', default: 'The other guides' },
    ],
  },

  /* ============================================================== Blog */
  {
    type: 'blog_listing',
    label: 'Blog index',
    description: 'Every published post, newest first, with category filters.',
    icon: 'grid',
    category: 'Blog',
    hosts: PAGES,
    fields: [
      { name: 'all_label', label: 'Everything filter', type: 'text', default: 'Everything' },
      { name: 'empty', label: 'When there is nothing', type: 'text', default: 'Nothing here yet — check back soon.' },
      { name: 'style', label: 'Listing style', type: 'choice', default: 'grid', options: [{ value: 'grid', label: 'Even grid' }, { value: 'editorial', label: 'Editorial — a large lead post, then a grid' }, { value: 'list', label: 'List — stacked rows' }, { value: 'index', label: 'Index — a typographic list' }] },
      { name: 'columns', label: 'Columns on a wide screen', type: 'choice', default: '3', options: [{ value: '2', label: 'Two' }, { value: '3', label: 'Three' }] },
      { name: 'ratio', label: 'Image shape', type: 'choice', default: '4/5', options: [{ value: '4/5', label: 'Portrait — 4:5' }, { value: '3/4', label: 'Tall — 3:4' }, { value: '2/3', label: 'Taller — 2:3' }, { value: '1/1', label: 'Square' }, { value: '3/2', label: 'Landscape — 3:2' }, { value: '16/9', label: 'Wide — 16:9' }] },
      { name: 'per_page', label: 'Posts before “Load more”', type: 'number', default: 24, min: 3, max: 48, step: 3, suffix: '' },
      { name: 'show_date', label: 'Date', type: 'boolean', default: true },
      { name: 'show_category', label: 'Category', type: 'boolean', default: true },
      { name: 'show_excerpt', label: 'Excerpt', type: 'boolean', default: true },
      { name: 'show_reading_time', label: 'Reading time', type: 'boolean', default: true },
      { name: 'show_search', label: 'Search field', type: 'boolean', default: false },
      { name: 'show_categories', label: 'Category filter', type: 'boolean', default: true },
      { name: 'default_sort', label: 'Order', type: 'choice', default: 'newest', options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'title', label: 'Title A–Z' }] },
      { name: 'filter_style', label: 'Filter style', type: 'choice', default: 'pills', options: [{ value: 'pills', label: 'Pills' }, { value: 'rail', label: 'A line of links' }, { value: 'dropdown', label: 'A dropdown' }] },
      { name: 'more_label', label: 'Load more label', type: 'text', default: 'More stories' },
    ],
  },
  {
    type: 'blog_grid',
    label: 'Recent posts',
    description: 'A few posts as cards — the newest, a category, or hand-picked.',
    icon: 'grid',
    category: 'Blog',
    hosts: ALL,
    fields: [
      eyebrow('From the journal'),
      heading('Recent posts'),
      { name: 'link_label', label: 'Link label', type: 'text', default: 'All posts' },
      { name: 'link_href', label: 'Link', type: 'link', default: '/blog' },
      {
        name: 'source',
        label: 'Which posts',
        type: 'collection',
        wide: true,
        default: {
          mode: 'dynamic',
          categories: [],
          tags: [],
          order: 'newest',
          limit: 3,
          featuredOnly: false,
          dateFrom: '',
          dateTo: '',
          items: [],
        },
      },
      { name: 'columns', label: 'Columns on a wide screen', type: 'choice', default: '3', options: [{ value: '2', label: 'Two' }, { value: '3', label: 'Three' }] },
      { name: 'layout', label: 'Layout', type: 'choice', default: 'grid', options: [{ value: 'grid', label: 'Even grid' }, { value: 'editorial', label: 'Editorial — a large lead post, then a grid' }, { value: 'list', label: 'List — stacked rows' }, { value: 'index', label: 'Index — a typographic list' }] },
      { name: 'ratio', label: 'Image shape', type: 'choice', default: '4/5', options: [{ value: '4/5', label: 'Portrait — 4:5' }, { value: '3/4', label: 'Tall — 3:4' }, { value: '2/3', label: 'Taller — 2:3' }, { value: '1/1', label: 'Square' }, { value: '3/2', label: 'Landscape — 3:2' }, { value: '16/9', label: 'Wide — 16:9' }] },
      { name: 'show_date', label: 'Show the date', type: 'boolean', default: true },
      { name: 'show_category', label: 'Show the category', type: 'boolean', default: true },
      { name: 'show_excerpt', label: 'Show the excerpt', type: 'boolean', default: true },
      { name: 'show_reading_time', label: 'Show the reading time', type: 'boolean', default: true },
    ],
  },

  /* =========================================================== Contact */
  {
    type: 'inquiry_cta',
    label: 'Inquiry over a photograph',
    description: 'The inquiry form on a darkened photograph, with where you are based and how to reach you beside it.',
    icon: 'contact',
    category: 'Contact',
    hosts: ALL,
    fields: [
      eyebrow('Bookings open'),
      heading('Creating memories that last a lifetime.'),
      { name: 'body', label: 'Body', type: 'textarea', default: '' },
      { name: 'action', label: 'Send button', type: 'text', default: 'Start an inquiry' },
      image('image', 'Background photograph'),
      { name: 'show_facts', label: 'Show based in, traveling to and reply time', type: 'boolean', default: true },
    ],
  },
  {
    type: 'inquiry_form',
    label: 'Inquiry form',
    description: 'The full inquiry form, with email, Instagram and the rest of the direct route beside it.',
    icon: 'contact',
    category: 'Contact',
    hosts: ALL,
    fields: [
      { name: 'form_label', label: 'Label over the form', type: 'text', default: 'The form' },
      { name: 'direct_label', label: 'Label over the direct route', type: 'text', default: 'Or the direct route' },
      { name: 'action', label: 'Send button', type: 'text', default: 'Send it' },
    ],
  },

  /* ========================================================= Structure */
  /* ======================================================= Added later */
  {
    type: 'testimonials',
    label: 'Kind words',
    description: 'What clients said — one at a time on a slider, in a grid, or one large quote.',
    icon: 'quote',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow('Kind words'),
      heading('From the people in the photographs'),
      {
        name: 'items',
        label: 'Testimonials',
        type: 'repeater',
        itemLabel: 'Testimonial',
        default: [],
        children: [
          { name: 'quote', label: 'What they said', type: 'textarea', default: '' },
          { name: 'name', label: 'Name', type: 'text', default: '' },
          { name: 'detail', label: 'Session', type: 'text', default: '', placeholder: 'Senior pictures, 2025' },
          { name: 'image', label: 'Photograph', type: 'image', default: '' },
        ],
      },
      {
        name: 'layout',
        label: 'Layout',
        type: 'choice',
        default: 'slider',
        options: [
          { value: 'slider', label: 'Slider — one at a time' },
          { value: 'grid', label: 'Grid' },
          { value: 'single', label: 'One large quote' },
        ],
      },
      { name: 'autoplay', label: 'Move on by itself', type: 'boolean', default: true, visibleWhen: { field: 'layout', equals: ['slider'] } },
      { name: 'show_photos', label: 'Show the photographs', type: 'boolean', default: true },
      { name: 'swatch', label: 'Accent colour', type: 'swatch', default: 'accent' },
    ],
  },
  {
    type: 'stats',
    label: 'Figures',
    description: 'A few numbers stated plainly — sessions shot, years booking, photographs delivered — counting up as they appear.',
    icon: 'stats',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow(),
      heading(),
      {
        name: 'items',
        label: 'Figures',
        type: 'repeater',
        itemLabel: 'Figure',
        maxItems: 6,
        default: [],
        children: [
          { name: 'value', label: 'Figure', type: 'text', default: '', placeholder: '4.9' },
          { name: 'suffix', label: 'After it', type: 'text', default: '', placeholder: '+' },
          { name: 'label', label: 'Label', type: 'text', default: '' },
        ],
      },
      COLUMNS('3'),
      { name: 'count_up', label: 'Count up as they appear', type: 'boolean', default: true },
      { name: 'swatch', label: 'Colour of the figures', type: 'swatch', default: 'ink' },
    ],
  },
  {
    type: 'cards',
    label: 'Cards',
    description: 'Photographs with a title, a line and a link each — services, mini-sessions, anything that wants a grid.',
    icon: 'cards',
    category: 'Photos',
    hosts: ALL,
    fields: [
      eyebrow(),
      heading(),
      { name: 'intro', label: 'Intro', type: 'textarea', default: '' },
      {
        name: 'items',
        label: 'Cards',
        type: 'repeater',
        itemLabel: 'Card',
        default: [],
        children: [
          { name: 'image', label: 'Photograph', type: 'image', default: '' },
          { name: 'title', label: 'Title', type: 'text', default: '' },
          { name: 'body', label: 'Body', type: 'textarea', default: '' },
          { name: 'href', label: 'Link', type: 'link', default: '' },
          { name: 'link_label', label: 'Link label', type: 'text', default: '' },
          { name: 'swatch', label: 'Card colour', type: 'swatch', default: 'beige' },
        ],
      },
      COLUMNS('3'),
      {
        name: 'style',
        label: 'Photograph shape',
        type: 'choice',
        default: 'arch',
        options: [
          { value: 'arch', label: 'Arched top' },
          { value: 'portrait', label: 'Portrait — 4:5' },
          { value: 'square', label: 'Square' },
          { value: 'landscape', label: 'Landscape — 3:2' },
          { value: 'none', label: 'No photographs — numbered text' },
        ],
      },
      { name: 'card_style', label: 'Card style', type: 'choice', default: 'plain', options: [{ value: 'plain', label: 'Plain — a photograph and text' }, { value: 'bordered', label: 'Bordered' }, { value: 'filled', label: 'Filled with the card colour' }] },
    ],
  },
  {
    type: 'before_after',
    label: 'Before and after',
    description: 'Two photographs with a handle to drag between them — for showing what the edit does.',
    icon: 'columns',
    category: 'Photos',
    hosts: ALL,
    fields: [
      eyebrow(),
      heading(),
      { name: 'body', label: 'Intro', type: 'textarea', default: '' },
      image('before', 'Before'),
      image('after', 'After'),
      { name: 'before_label', label: 'Before label', type: 'text', default: 'Straight out of camera' },
      { name: 'after_label', label: 'After label', type: 'text', default: 'Finished' },
      { name: 'start', label: 'Handle starts at', type: 'number', default: 50, min: 10, max: 90, step: 5, suffix: '%' },
      {
        name: 'ratio',
        label: 'Shape',
        type: 'choice',
        default: '3/2',
        options: [
          { value: '3/2', label: 'Landscape — 3:2' },
          { value: '4/5', label: 'Portrait — 4:5' },
          { value: '1/1', label: 'Square' },
        ],
      },
    ],
  },
  {
    type: 'album_grid',
    label: 'Albums',
    description: 'A few albums as cards — the latest, one category, or picked by hand.',
    icon: 'portfolio',
    category: 'Portfolio',
    hosts: ALL,
    fields: [
      eyebrow('Recent sessions'),
      heading('From the portfolio'),
      { name: 'link_label', label: 'Link label', type: 'text', default: 'Full portfolio' },
      { name: 'link_href', label: 'Link', type: 'link', default: '/portfolio' },
      {
        name: 'mode',
        label: 'Which albums',
        type: 'choice',
        default: 'latest',
        options: [
          { value: 'latest', label: 'The latest' },
          { value: 'category', label: 'The latest in one category' },
          { value: 'featured', label: 'Featured albums' },
          { value: 'pick', label: 'Picked by hand' },
        ],
      },
      { name: 'category', label: 'Category', type: 'category', default: '', visibleWhen: { field: 'mode', equals: ['category'] } },
      { name: 'albums', label: 'Albums', type: 'albums', default: [], wide: true, visibleWhen: { field: 'mode', equals: ['pick'] } },
      { name: 'limit', label: 'How many', type: 'number', default: 3, min: 1, max: 12 },
      COLUMNS('3'),
      {
        name: 'ratio',
        label: 'Card shape',
        type: 'choice',
        default: '4/5',
        options: [
          { value: '4/5', label: 'Portrait — 4:5' },
          { value: '3/4', label: 'Tall — 3:4' },
          { value: '1/1', label: 'Square' },
          { value: '3/2', label: 'Landscape — 3:2' },
        ],
      },
      { name: 'layout', label: 'Layout', type: 'choice', default: 'grid', options: [{ value: 'grid', label: 'Even grid' }, { value: 'masonry', label: 'Masonry — every cover uncropped' }, { value: 'carousel', label: 'Carousel' }, { value: 'index', label: 'Index — a typographic list' }] },
      { name: 'show_category', label: 'Show the category', type: 'boolean', default: true },
      { name: 'show_details', label: 'Show the date and place', type: 'boolean', default: true },
      { name: 'show_count', label: 'Show how many photographs', type: 'boolean', default: false },
      { name: 'hover', label: 'Hover effect', type: 'choice', default: 'zoom', options: [{ value: 'zoom', label: 'Slow zoom' }, { value: 'lift', label: 'Lift' }, { value: 'none', label: 'None' }] },
    ],
  },
  {
    type: 'video',
    label: 'Video',
    description: 'A YouTube or Vimeo link, or a video file — a highlight reel, a behind-the-scenes clip.',
    icon: 'embed',
    category: 'Photos',
    hosts: ALL,
    fields: [
      eyebrow(),
      heading(),
      { name: 'url', label: 'Video link', type: 'link', default: '', help: 'A YouTube or Vimeo address, or a direct link to an .mp4 file.' },
      { name: 'html', label: 'Or paste embed code', type: 'textarea', default: '', wide: true, help: 'From somewhere you trust — Instagram, TikTok, a booking widget. It runs in a sealed frame.' },
      image('poster', 'Still shown before it plays'),
      {
        name: 'ratio',
        label: 'Shape',
        type: 'choice',
        default: '16/9',
        options: [
          { value: '16/9', label: 'Wide — 16:9' },
          { value: '4/3', label: 'Classic — 4:3' },
          { value: '1/1', label: 'Square' },
          { value: '9/16', label: 'Vertical — 9:16' },
        ],
      },
      { name: 'ambient', label: 'Play silently on a loop, like a moving photograph', type: 'boolean', default: false, help: 'For video files only.' },
      { name: 'caption', label: 'Caption', type: 'text', default: '' },
    ],
  },
  {
    type: 'logos',
    label: 'Featured in',
    description: 'A row of logos or names — publications, vendors, venues.',
    icon: 'logos',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow('As seen in'),
      {
        name: 'items',
        label: 'Logos',
        type: 'repeater',
        itemLabel: 'Logo',
        default: [],
        children: [
          { name: 'name', label: 'Name', type: 'text', default: '' },
          { name: 'image', label: 'Logo', type: 'image', default: '', help: 'Leave empty to show the name in type instead.' },
          { name: 'href', label: 'Link', type: 'link', default: '' },
        ],
      },
      { name: 'muted', label: 'Soften them into the page', type: 'boolean', default: true },
      { name: 'scroll', label: 'Scroll continuously', type: 'boolean', default: false },
    ],
  },
  {
    type: 'cta_band',
    label: 'Banner',
    description: 'A heading and buttons over a full-width photograph — an invitation between two sections.',
    icon: 'cta',
    category: 'Contact',
    hosts: ALL,
    fields: [
      eyebrow('Bookings open'),
      heading('Let’s make something worth keeping.'),
      { name: 'body', label: 'Body', type: 'textarea', default: '' },
      BUTTONS([{ label: 'Start an inquiry', href: '/contact', style: 'primary' }]),
      image('image', 'Photograph'),
      { name: 'overlay', label: 'Darken the photograph', type: 'number', default: 55, min: 0, max: 95, step: 5, suffix: '%' },
      {
        name: 'align',
        label: 'Alignment',
        type: 'choice',
        default: 'center',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Centred' },
        ],
      },
      {
        name: 'height',
        label: 'Height',
        type: 'choice',
        default: 'medium',
        options: [
          { value: 'compact', label: 'Compact' },
          { value: 'medium', label: 'Medium' },
          { value: 'tall', label: 'Tall' },
        ],
      },
    ],
  },
  {
    type: 'two_column',
    label: 'Two columns of text',
    description: 'A heading over two columns of copy, side by side.',
    icon: 'columns',
    category: 'Text',
    hosts: ALL,
    fields: [
      eyebrow(),
      heading(),
      { name: 'left', label: 'Left column', type: 'richtext', default: '', wide: true },
      { name: 'right', label: 'Right column', type: 'richtext', default: '', wide: true },
      { name: 'layout', label: 'Layout', type: 'choice', default: 'columns', options: [{ value: 'columns', label: 'Heading above two columns' }, { value: 'side', label: 'Heading held beside the text' }] },
      { name: 'sticky', label: 'Heading stays put while the text scrolls', type: 'boolean', default: true, visibleWhen: { field: 'layout', equals: ['side'] } },
      { name: 'split', label: 'Column split', type: 'choice', default: '40', options: [{ value: '33', label: 'A third / two thirds' }, { value: '40', label: 'Two fifths / three fifths' }, { value: '50', label: 'Even' }], visibleWhen: { field: 'layout', equals: ['side'] } },
      BUTTONS([]),
    ],
  },
  {
    type: 'map',
    label: 'Map',
    description: 'A map of a place — a studio, a meeting point, a favourite location.',
    icon: 'embed',
    category: 'Contact',
    hosts: ALL,
    fields: [
      eyebrow(),
      heading(),
      { name: 'body', label: 'Beside the map', type: 'textarea', default: '' },
      { name: 'query', label: 'Place or address', type: 'text', default: 'Urbandale, Iowa' },
      { name: 'zoom', label: 'Zoom', type: 'number', default: 12, min: 4, max: 18 },
      { name: 'height', label: 'Height', type: 'choice', default: 'md', options: [{ value: 'sm', label: 'Short' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Tall' }] },
    ],
  },
  {
    type: 'instagram',
    label: 'Instagram',
    description: 'A grid of photographs that links through to Instagram.',
    icon: 'gallery',
    category: 'Photos',
    hosts: ALL,
    fields: [
      eyebrow('On Instagram'),
      heading(),
      { name: 'images', label: 'Photographs', type: 'images', default: [], wide: true },
      { name: 'columns', label: 'Across', type: 'choice', default: '6', options: [{ value: '3', label: 'Three' }, { value: '4', label: 'Four' }, { value: '6', label: 'Six' }] },
      { name: 'link_label', label: 'Link label', type: 'text', default: 'Follow along' },
    ],
  },

  {
    type: 'author_card',
    label: 'About me card',
    description: 'A portrait, a few lines about you, and where to find you — for the end of a post or the side of a page.',
    icon: 'author',
    category: 'Contact',
    hosts: ALL,
    fields: [
      image('portrait', 'Portrait'),
      { name: 'name', label: 'Name', type: 'text', default: 'Ashley' },
      { name: 'role', label: 'Role', type: 'text', default: 'Photographer · Des Moines, Iowa' },
      { name: 'bio', label: 'A few lines', type: 'richtext', default: '', wide: true },
      BUTTONS([{ label: 'Start an inquiry', href: '/contact', style: 'primary' }]),
      { name: 'show_links', label: 'Show Instagram and email from Settings', type: 'boolean', default: true },
      {
        name: 'layout',
        label: 'Layout',
        type: 'choice',
        default: 'side',
        options: [
          { value: 'side', label: 'Portrait beside the words' },
          { value: 'stacked', label: 'Portrait above, centred' },
        ],
      },
      {
        name: 'shape',
        label: 'Portrait shape',
        type: 'choice',
        default: 'circle',
        options: [
          { value: 'circle', label: 'Circle' },
          { value: 'arch', label: 'Arched top' },
          { value: 'portrait', label: 'Portrait' },
        ],
      },
      { name: 'boxed', label: 'Set it in a bordered card', type: 'boolean', default: true },
    ],
  },
  {
    type: 'divider',
    label: 'Rule',
    description: 'A hairline that draws itself across the page.',
    icon: 'divider',
    category: 'Structure',
    hosts: ALL,
    fields: [
      { name: 'style', label: 'Style', type: 'choice', default: 'line', options: [{ value: 'line', label: 'Hairline' }, { value: 'arch', label: 'Arch ornament' }, { value: 'dots', label: 'Three dots' }, { value: 'asterism', label: 'Asterism — three stars' }, { value: 'motif', label: 'One of the drawings' }] },
      { name: 'motif', label: 'Drawing', type: 'choice', default: 'sprig', artwork: 'motifs', options: MOTIF_OPTIONS.slice(1), visibleWhen: { field: 'style', equals: ['motif'] } },
      { name: 'width', label: 'Width', type: 'choice', default: 'full', options: [{ value: 'short', label: 'Short' }, { value: 'wide', label: 'Wide' }, { value: 'full', label: 'Full' }] },
      { name: 'swatch', label: 'Colour', type: 'swatch', default: 'accent' },
    ],
  },
  {
    type: 'spacer',
    label: 'Space',
    description: 'Empty space between two sections.',
    icon: 'spacer',
    category: 'Structure',
    hosts: ALL,
    fields: [
      {
        name: 'size',
        label: 'Size',
        type: 'choice',
        default: 'md',
        options: [
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' },
        ],
      },
      { name: 'height', label: 'Exact height (overrides the size)', type: 'number', default: 0, min: 0, max: 400, step: 8, suffix: 'px' },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * Heading options, everywhere there is a heading
 *
 * Added here rather than written into each widget, so a widget that gains a
 * heading gains its level and size controls with it.
 * ------------------------------------------------------------------ */

const HEADING_TAG: FieldDef = {
  name: 'heading_tag',
  label: 'Heading level',
  type: 'choice',
  default: 'h2',
  help: 'For search engines and screen readers, not the size. One H1 per page — the masthead is usually it.',
  options: [
    { value: 'h1', label: 'H1' },
    { value: 'h2', label: 'H2' },
    { value: 'h3', label: 'H3' },
    { value: 'p', label: 'Not a heading' },
  ],
}

const HEADING_SIZE: FieldDef = {
  name: 'heading_size',
  label: 'Heading size',
  type: 'choice',
  default: 'auto',
  options: [
    { value: 'auto', label: 'As designed' },
    { value: 'display', label: 'Display — the biggest' },
    { value: 'xl', label: 'Extra large' },
    { value: 'lg', label: 'Large' },
    { value: 'md', label: 'Medium' },
    { value: 'sm', label: 'Small' },
  ],
}

/** Widgets whose heading is a masthead drawn by its own component, not a section heading. */
const OWN_HEADING = new Set(['page_hero'])

function withHeadingOptions(widget: WidgetDef): WidgetDef {
  const at = widget.fields.findIndex((f) => f.name === 'heading')
  if (at < 0 || OWN_HEADING.has(widget.type) || widget.fields.some((f) => f.name === 'heading_size')) return widget
  const fields = [...widget.fields]
  fields.splice(at + 1, 0, HEADING_SIZE, HEADING_TAG)
  return { ...widget, fields }
}

export const WIDGETS: readonly WidgetDef[] = BASE_WIDGETS.map(withHeadingOptions)

/* ------------------------------------------------------------------ *
 * Lookups and defaults
 * ------------------------------------------------------------------ */

const BY_TYPE = new Map(WIDGETS.map((w) => [w.type, w]))

export function getWidget(type: string): WidgetDef | undefined {
  return BY_TYPE.get(type)
}

export function widgetsFor(host: WidgetHost): WidgetDef[] {
  return WIDGETS.filter((w) => w.hosts.includes(host))
}

const CATEGORY_ORDER: WidgetCategory[] = [
  'Opening',
  'Sessions',
  'Guide',
  'Text',
  'Photos',
  'Pricing',
  'Portfolio',
  'Blog',
  'Contact',
  'Structure',
]

/** Every widget category that has at least one widget for this host, in order. */
export function widgetCategories(host: WidgetHost): { name: string; widgets: WidgetDef[] }[] {
  return CATEGORY_ORDER.map((name) => ({
    name,
    widgets: widgetsFor(host).filter((w) => w.category === name),
  })).filter((group) => group.widgets.length > 0)
}

export function fieldDefaults(fields: readonly FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    if (f.type === 'group') {
      out[f.name] = fieldDefaults(f.children ?? [])
    } else if (f.type === 'repeater' || f.type === 'images' || f.type === 'lines' || f.type === 'multichoice' || f.type === 'sessions' || f.type === 'albums') {
      out[f.name] = Array.isArray(f.default) ? structuredClone(f.default) : []
    } else if (f.default !== undefined) {
      out[f.name] = structuredClone(f.default)
    } else {
      out[f.name] = f.type === 'boolean' ? false : f.type === 'number' ? 0 : ''
    }
  }
  return out
}

/** A fresh instance of a widget, with every field at its default. */
export function widgetDefaults(type: string): {
  content: Record<string, unknown>
  styles: Record<string, unknown>
} {
  const def = getWidget(type)
  return {
    content: def ? fieldDefaults(def.fields) : {},
    styles: fieldDefaults(STYLE_FIELDS),
  }
}

/** One empty row for a repeater, built from the repeater's own child fields. */
export function repeaterRow(field: FieldDef): Record<string, unknown> {
  return fieldDefaults(field.children ?? [])
}

/**
 * A stored instance filled out against the current schema.
 *
 * A section saved before a field existed renders with that field's default
 * rather than `undefined`, so adding a field never requires touching the rows
 * already in the database.
 */
export function hydrateWidget(
  type: string,
  content: unknown,
  styles: unknown,
): { content: Record<string, unknown>; styles: Record<string, unknown> } {
  const base = widgetDefaults(type)
  return {
    content: mergeInto(base.content, content, getWidget(type)?.fields ?? []),
    styles: mergeInto(base.styles, styles, STYLE_FIELDS),
  }
}

/** Saved values over the defaults of a field list. Used for settings and details too. */
export function hydrateFields(fields: readonly FieldDef[], saved: unknown): Record<string, unknown> {
  return mergeInto(fieldDefaults(fields), saved, fields)
}

function mergeInto(
  base: Record<string, unknown>,
  saved: unknown,
  fields: readonly FieldDef[],
): Record<string, unknown> {
  if (!saved || typeof saved !== 'object') return base
  const s = saved as Record<string, unknown>

  for (const f of fields) {
    const value = s[f.name]
    if (value === undefined) continue

    if (f.type === 'group') {
      base[f.name] = mergeInto((base[f.name] ?? {}) as Record<string, unknown>, value, f.children ?? [])
    } else if (f.type === 'repeater') {
      // Rows are merged individually so a new child field appears on existing
      // rows rather than leaving a hole in the middle of a repeater.
      base[f.name] = Array.isArray(value)
        ? value.map((row) => mergeInto(fieldDefaults(f.children ?? []), row, f.children ?? []))
        : []
    } else {
      base[f.name] = value
    }
  }
  return base
}

/* ------------------------------------------------------------------ *
 * Blog collections
 * ------------------------------------------------------------------ */

export interface CollectionSource {
  mode: 'dynamic' | 'manual'
  categories: string[]
  tags: string[]
  order: 'newest' | 'oldest' | 'title' | 'random'
  limit: number
  featuredOnly: boolean
  dateFrom: string
  dateTo: string
  items: string[]
}

export function normalizeSource(value: unknown): CollectionSource {
  const v = (value ?? {}) as Partial<CollectionSource>
  const list = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string') : [])
  return {
    mode: v.mode === 'manual' ? 'manual' : 'dynamic',
    categories: list(v.categories),
    tags: list(v.tags),
    order: (['newest', 'oldest', 'title', 'random'] as const).includes(v.order as never)
      ? (v.order as CollectionSource['order'])
      : 'newest',
    limit: typeof v.limit === 'number' && v.limit > 0 ? Math.min(v.limit, 48) : 3,
    featuredOnly: v.featuredOnly === true,
    dateFrom: typeof v.dateFrom === 'string' ? v.dateFrom : '',
    dateTo: typeof v.dateTo === 'string' ? v.dateTo : '',
    items: list(v.items),
  }
}
