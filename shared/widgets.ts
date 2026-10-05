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
  /** The permitted values for `choice` and `multichoice`, which the server also enforces. */
  options?: readonly { readonly value: string; readonly label: string }[]
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

export const STYLE_FIELDS: readonly FieldDef[] = [
  {
    name: 'background',
    label: 'Background',
    type: 'choice',
    default: 'auto',
    options: [
      { value: 'auto', label: 'As designed' },
      { value: 'canvas', label: 'Page' },
      { value: 'surface', label: 'Raised band' },
    ],
  },
  {
    name: 'rule',
    label: 'Line above',
    type: 'choice',
    default: 'auto',
    options: [
      { value: 'auto', label: 'As designed' },
      { value: 'line', label: 'Always' },
      { value: 'none', label: 'Never' },
    ],
  },
  {
    name: 'spacing',
    label: 'Spacing',
    type: 'choice',
    default: 'auto',
    options: [
      { value: 'auto', label: 'As designed' },
      { value: 'compact', label: 'Compact' },
      { value: 'none', label: 'None' },
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

export const WIDGETS: readonly WidgetDef[] = [
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
  {
    type: 'divider',
    label: 'Rule',
    description: 'A hairline that draws itself across the page.',
    icon: 'divider',
    category: 'Structure',
    hosts: ALL,
    fields: [],
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
    ],
  },
]

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
    } else if (f.type === 'repeater' || f.type === 'images' || f.type === 'lines' || f.type === 'multichoice') {
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
