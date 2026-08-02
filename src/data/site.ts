/**
 * All homepage copy and structured content lives here so it can be edited
 * without touching component code.
 *
 * PRICES — the deliverables in `PACKAGES` are accurate; the dollar figures are
 * placeholders pitched at the central-Iowa market. Confirm all three before
 * going live. They are the only invented numbers on the page.
 */

export const SITE = {
  name: 'Ashley Photography',
  tagline: 'Portrait photography in central Iowa',
  base: 'Urbandale, Iowa',
  serves: 'Des Moines metro · Central Iowa · Travel welcome',
  email: 'hello@photosbyashley.com', // TODO: confirm the live address
  instagram: 'https://www.instagram.com/photosbyashley__/',
  instagramHandle: '@photosbyashley__',
  /** First paid sessions — engagements — were 2021. */
  since: 2021,
}

/**
 * Primary navigation. `to` values starting with `/#` land on a homepage
 * section — the router handles the route, then the hash handler scrolls.
 */
export const NAV = [
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Sessions', to: '/sessions' },
  { label: 'Investment', to: '/contact#investment' },
  { label: 'About', to: '/about' },
] as const

/** Sections tracked by the fixed left-hand index rail. */
export const SECTIONS = [
  { id: 'hero', label: 'Opening' },
  { id: 'story', label: 'The Work' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'work', label: 'Selected' },
  { id: 'process', label: 'Process' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'about', label: 'Ashley' },
  { id: 'contact', label: 'Enquire' },
] as const

export const HERO = {
  eyebrow: 'Portraits · Urbandale, Iowa',
  lead: 'Ashley',
  script: 'Photography',
  sub: 'Natural-light portraits for the people, places and small ridiculous dogs that make up a life.',
  scroll: 'Scroll',
}

export const MARQUEE = [
  'Senior Pictures',
  'Graduation',
  'Engagements',
  'Couples',
  'Families',
  'Pets',
]

export const INTRO = {
  eyebrow: 'A little context',
  heading: 'Pictures capture a moment in time — a picture keeps it.',
  body: [
    'An engagement, a homecoming, a new puppy, the last spring before everyone scatters. These are the moments worth slowing down for, and I will walk you through every step to get the shot.',
    'I picked up my parents’ old Canon back in 2015, started taking engagement sessions in 2021, added seniors the year after, and everything else the year after that. Sessions are unhurried and a little bit fun, because nobody has ever looked relaxed while being told to relax.',
  ],
  stats: [
    { value: '2021', label: 'Booking since' },
    { value: '60', label: 'Images, senior session' },
    { value: '48h', label: 'Reply time' },
  ],
}

export type Session = {
  id: string
  index: string
  title: string
  /** One-line summary, used on the homepage list. */
  blurb: string
  photoId: string
  /** Portfolio category this session links through to. */
  filter: string
  /** Long-form copy for the /sessions page. */
  detail: string[]
  /** What this particular session includes, beyond ALWAYS_INCLUDED. */
  points: string[]
  /** Package id in PACKAGES that prices this session. */
  packageId: string
  /** Two extra frames for the /sessions page spread. */
  gallery: [string, string]
}

export const SESSIONS: Session[] = [
  {
    id: 'seniors',
    index: '01',
    filter: 'seniors',
    title: 'Senior Pictures',
    blurb: 'Your last year of high school, shot the way you actually are. Sixty edited images, multiple locations, pets welcome.',
    photoId: 'seniors-elise-portrait-121',
    detail: [
      'This is the one session where everything is decided in advance, because seniors all want the same things: enough frames to actually choose from, more than one backdrop, and room to change outfits halfway through.',
      'Sixty edited photographs, more than one location, and as many outfit changes as you want to carry. Bring the letter jacket, the instrument, the truck, the dog — anything that will look like you in ten years.',
    ],
    points: [
      'Sixty edited photographs',
      'More than one location in the one session',
      'Outfit changes, as many as you like',
      'Props, jerseys, instruments and pets all welcome',
    ],
    packageId: 'seniors',
    gallery: ['seniors-elise-portrait-102', 'seniors-2024-07-05-park-practice-51'],
  },
  {
    id: 'graduation',
    index: '02',
    filter: 'graduation',
    title: 'Graduation',
    blurb: 'Cap, gown and the campus landmarks that mean something to you. Built around your ceremony weekend.',
    photoId: 'graduation-em-grad-278',
    detail: [
      'Cap, gown, and the parts of campus that actually meant something to you — the entrance sign, the building you all but lived in, the walk you have done a thousand times.',
      'These are planned around your ceremony weekend, which is usually a busy one, so we keep it to a single location and shoot it properly. We agree the number of images when we plan the session.',
    ],
    points: [
      'Built around your ceremony weekend',
      'Usually one location, chosen together',
      'Gown on and gown off, in the same session',
      'Image count agreed when we plan it',
    ],
    packageId: 'graduation',
    gallery: ['graduation-em-grad-278', 'graduation-em-grad-61'],
  },
  {
    id: 'engagements',
    index: '03',
    filter: 'engagement',
    title: 'Engagements',
    blurb: 'Golden hour at the one spot that suits you, and the version of you two that only shows up when nobody is watching.',
    photoId: 'engagement-mallorie-connor-31',
    detail: [
      'The point of an engagement session is not the ring — it is having photographs of the two of you from before all the planning took over. We pick one spot that suits you and use the last good hour of light on it.',
      'Expect more conversation than posing. The frames people keep are almost always the ones taken between the directions.',
    ],
    points: [
      'Usually one location, chosen together',
      'Timed for the last hour of good light',
      'Your dog is genuinely welcome',
      'A set of black-and-white frames alongside the colour',
    ],
    packageId: 'couples-family',
    gallery: ['engagement-june2022-176', 'engagement-june2022-bw-84'],
  },
  {
    id: 'couples',
    index: '04',
    filter: 'couples',
    title: 'Couples',
    blurb: 'Anniversaries, just-because sessions, or the first proper photos since the wedding day.',
    photoId: 'couples-am-27',
    detail: [
      'Anniversaries, just-because sessions, or the first proper photographs since the wedding day — the ones where nobody is in a wedding dress and nothing has to be announced.',
      'Same approach as an engagement session: one location, unhurried, and shaped around what the two of you are actually like together.',
    ],
    points: [
      'Usually one location, chosen together',
      'Anniversary, milestone, or no reason at all',
      'Individual portraits as well as the two of you',
      'A set of black-and-white frames alongside the colour',
    ],
    packageId: 'couples-family',
    gallery: ['couples-am-43', 'couples-am-30'],
  },
  {
    id: 'families',
    index: '05',
    filter: 'family',
    title: 'Families',
    blurb: 'One location, group and individual frames, and enough patience for every last one of them.',
    photoId: 'family-2024-05-18-grad-party-238',
    detail: [
      'Getting everyone in one place is the hard part; the photographs are the easy bit. One location, the whole group together, and then each person on their own while the others recover.',
      'The image count scales with the size of the group, and everyone who needs their own gallery gets one.',
    ],
    points: [
      'Usually one location, chosen together',
      'Group frames plus individual portraits of everyone',
      'Image count scales with the size of the group',
      'A private gallery for everyone who needs one',
    ],
    packageId: 'couples-family',
    gallery: ['family-2024-05-18-grad-party-223', 'family-2024-05-18-grad-party-133'],
  },
  {
    id: 'pets',
    index: '06',
    filter: 'pets',
    title: 'Pets',
    blurb: 'New puppy, old friend. They come along at no extra cost, or take the spotlight on their own.',
    photoId: 'pets-06-27-2024-puppies-110',
    detail: [
      'Dogs come along to any session at no extra cost, and they are usually the reason the humans finally relax. Nobody has ever been stiff in front of a camera while holding a lead.',
      'They can also have the session entirely to themselves — a new puppy, or an old friend you want photographed properly while you still can.',
    ],
    points: [
      'Included in any other session at no extra cost',
      'Or a session entirely of their own',
      'Shot outdoors, at their pace',
      'No expectation whatsoever that they sit still',
    ],
    packageId: 'couples-family',
    gallery: ['pets-06-27-2024-puppies-110', 'pets-06-27-2024-puppies-134'],
  },
]

/** Curated homepage gallery — `span` drives the asymmetric masonry rhythm. */
export const FEATURED: { photoId: string; caption: string; span: 'tall' | 'wide' | 'std' }[] = [
  { photoId: 'seniors-elise-portrait-102', caption: 'Elise · Senior', span: 'tall' },
  { photoId: 'engagement-july2022-109', caption: 'The barn road', span: 'wide' },
  { photoId: 'graduation-em-grad-233', caption: 'Campanile · UNI', span: 'tall' },
  { photoId: 'pets-06-27-2024-puppies-128', caption: 'Copper', span: 'wide' },
  { photoId: 'couples-am-27', caption: 'Maddie & Will', span: 'tall' },
  { photoId: 'family-2024-05-18-grad-party-196', caption: 'All five of them', span: 'wide' },
  { photoId: 'engagement-june2022-bw-84', caption: 'Sara, Grant & Copper', span: 'tall' },
  { photoId: 'seniors-2024-07-05-park-practice-51', caption: 'Park practice', span: 'std' },
  { photoId: 'graduation-em-grad-253', caption: 'The trellis', span: 'tall' },
]

export const PROCESS = [
  {
    index: '01',
    title: 'Pick your place',
    body: 'You already have the shoot in your head. Send me the idea and we settle on the spot together — usually one location, more for senior sessions. I travel to you anywhere in the Des Moines metro, and further afield for a travel fee.',
    photoId: 'backgrounds-2024-07-05-park-practice-127',
  },
  {
    index: '02',
    title: 'Have an actual good time',
    body: 'Photoshoots do not have to be stressful. I keep it moving, keep it light, and direct just enough that you never have to wonder what to do with your hands.',
    photoId: 'engagement-june2022-176',
  },
  {
    index: '03',
    title: 'Get your gallery',
    body: 'I edit the set, add black-and-white versions of the frames that suit it, and deliver everything to a private Pic-Time gallery. Download it, share it, order prints — it is yours for a year, and you will get two reminders before it closes.',
    photoId: 'graduation-em-grad-61',
  },
]

export type Package = {
  id: string
  name: string
  /** Placeholder figure — confirm before launch. */
  price: string
  unit: string
  summary: string
  includes: string[]
  featured: boolean
}

export const PACKAGES: Package[] = [
  {
    id: 'seniors',
    name: 'Senior Pictures',
    price: '$475',
    unit: 'per session',
    summary: 'The one package with everything already decided.',
    includes: [
      'Sixty edited photographs',
      'More than one location, and outfit changes',
      'Your pet along at no extra cost',
      'Add more images any time after delivery',
    ],
    featured: true,
  },
  {
    id: 'graduation',
    name: 'Graduation & Portraits',
    price: 'From $325',
    unit: 'tailored to you',
    summary: 'Cap and gown, milestones, solo portraits.',
    includes: [
      'Usually one location, chosen together',
      'Built around your ceremony weekend',
      'Image count set when we plan the session',
      'Campus landmarks and the walk you have earned',
    ],
    featured: false,
  },
  {
    id: 'couples-family',
    name: 'Couples & Family',
    price: 'From $400',
    unit: 'tailored to you',
    summary: 'Engagements, anniversaries, families, friend groups.',
    includes: [
      'Usually one location, chosen together',
      'Group frames plus individual portraits',
      'Image count scales with the size of your group',
      'A gallery for everyone who needs one',
    ],
    featured: false,
  },
]

/** Applies to every session, whatever the package. */
export const ALWAYS_INCLUDED = [
  'Travel included across the Des Moines metro',
  'A private Pic-Time gallery, online for a full year',
  'Full download and print rights to your images',
  'Selected frames also delivered in black and white',
  'Additional edited images available any time',
]

export const GALLERY = {
  eyebrow: 'Your gallery',
  heading: 'Online for a year, and you will never be caught out by the deadline.',
  body: 'Every session is delivered to a private Pic-Time gallery you can download from, share and order prints through. It stays up for a full year — and I email you twice before it comes down, so nothing is lost to a forgotten tab.',
  // Percentages position each marker along the one-year timeline.
  timeline: [
    { at: 0, label: 'Delivered', detail: 'Gallery goes live' },
    { at: 75, label: '90 days left', detail: 'First reminder emailed' },
    { at: 91.5, label: '30 days left', detail: 'Final reminder emailed' },
    { at: 100, label: 'One year', detail: 'Gallery comes down' },
  ],
}

export const BLACK_AND_WHITE = {
  eyebrow: 'A small thing I do',
  body: 'Some frames are simply better without colour. As I edit, I pick the ones that earn it and deliver those in black and white as well as colour — at no extra cost, and no extra decision for you to make.',
}

export const ABOUT = {
  eyebrow: 'Behind the camera',
  heading: 'Photography stopped being a hobby a long time ago.',
  body: [
    'It started in 2015 with my parents’ 2008 Canon and a friend who needed senior pictures — no Photoshop, just the adjustment panel on a desktop, and results as bad as you are imagining.',
    'Two years later I bought my own camera and taught myself Lightroom and Photoshop off YouTube, pausing every three seconds so I would not miss a step. That turned into design work, an Advertising degree from Iowa State, and — from 2021 — sessions for the people of central Iowa.',
    'If you want to learn the editing side yourself, ask me — I will happily hand over the tips and resources I wish I had had.',
  ],
  photoId: 'about-ashley',
  signature: 'Ashley',
}

export const ENQUIRY_SUBJECTS = [
  'Senior pictures',
  'Graduation or portraits',
  'Engagement or couples',
  'Family or group',
  'Pets',
  'A question',
  'Just saying hi',
]

export const CTA = {
  eyebrow: 'Bookings open',
  heading: 'Creating memories that last a lifetime.',
  body: 'Take a look through the work. If the style feels like yours, send me a note — tell me who is in the photos, roughly when, and where you picture it.',
  action: 'Start an enquiry',
  photoId: 'backgrounds-2024-07-05-park-practice-122',
}

/* ------------------------------------------------------------------ *
 * Portfolio
 * ------------------------------------------------------------------ */

/**
 * Filter order and display names for the portfolio grid. Only categories
 * listed here are shown — `backgrounds` (texture plates) and `about` are
 * deliberately excluded.
 *
 * NOTE: `wedding` is labelled "Celebrations" because those frames are
 * rehearsal-dinner and party coverage, and weddings are not an advertised
 * service. Rename it if that changes.
 */
export const PORTFOLIO_FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'seniors', label: 'Seniors' },
  { id: 'graduation', label: 'Graduation' },
  { id: 'engagement', label: 'Engagements' },
  { id: 'couples', label: 'Couples' },
  { id: 'family', label: 'Families' },
  { id: 'pets', label: 'Pets' },
  { id: 'wedding', label: 'Celebrations' },
  { id: 'travel', label: 'Travel' },
] as const

export const PORTFOLIO = {
  eyebrow: 'Selected work',
  heading: 'The portfolio',
  body: 'Every session, start to finish — seniors, graduations, engagements, families and a great many dogs. Pick a category, or scroll the lot.',
  photoId: 'backgrounds-2024-07-05-park-practice-188',
}

/* ------------------------------------------------------------------ *
 * About page
 * ------------------------------------------------------------------ */

export const ABOUT_PAGE = {
  eyebrow: 'Behind the camera',
  heading: 'Hello — I am Ashley.',
  intro:
    'I photograph the people of central Iowa: the last spring of high school, the ring that just went on, the whole family in one place for once, and the dog who thinks all of this is about them.',
  /**
   * Tried in order; the first id present in the manifest wins. Drop the new
   * photographs into images/Ashley as porch.jpg and bridal.jpg, run
   * `npm run images`, and these swap themselves in.
   */
  portraits: ['about-porch', 'about-ashley'],
  secondary: ['about-bridal', 'about-ashley-2'],
  columns: [
    {
      title: 'How it started',
      body: 'In 2015 a friend needed senior pictures and I had access to my parents’ 2008 Canon. No Photoshop, no idea what I was doing — just the adjustment panel on a desktop and results as bad as you are imagining. I was completely hooked anyway.',
    },
    {
      title: 'How it got good',
      body: 'Two years later I bought my own camera and taught myself Lightroom and Photoshop off YouTube, pausing every three seconds so I would not miss a step. I took my first paid session in 2021 and have not stopped since — the self-taught habit has not really gone away either.',
    },
    {
      title: 'How I shoot',
      body: 'Natural light, unhurried, and a lot more conversation than direction. Nobody has ever looked relaxed while being told to relax, so I keep it moving and direct just enough that you never have to wonder what to do with your hands.',
    },
  ],
  /** Dated milestones. Keep newest last. */
  timeline: [
    {
      year: '2015',
      title: 'First photo shoot',
      body: 'A friend’s senior pictures, shot on a borrowed 2008 Canon.',
    },
    {
      year: '2017',
      title: 'First real camera',
      body: 'Bought my own body and taught myself Lightroom and Photoshop from scratch.',
    },
    {
      year: '2018',
      title: 'Into design',
      body: 'Added Illustrator, InDesign and front-end code to the toolkit.',
    },
    {
      year: '2019',
      title: 'Merrill Manufacturing',
      body: 'Built their e-commerce site from scratch and shot every product and staff photograph on it.',
    },
    {
      year: '2020',
      title: 'Iowa State',
      body: 'Graduated with a degree in Advertising, minors in German and business.',
    },
    {
      year: '2021',
      title: 'First engagement sessions',
      body: 'The first bookings that were not favours for friends.',
    },
    {
      year: '2022',
      title: 'Senior pictures',
      body: 'Added senior sessions, which have since become the busiest part of the year.',
    },
    {
      year: '2023',
      title: 'Everything else',
      body: 'Graduation, couples, families and pets all joined the list.',
    },
    {
      year: 'Now',
      title: 'Full swing',
      body: 'Shooting across the Des Moines metro, and travelling for the sessions worth travelling for.',
    },
  ],
  aside: {
    title: 'Design, too',
    body: 'Photography came first, but the design and front-end work never went away — this site is my own. If you want the editing tips and resources I wish I had had when I started, just ask.',
  },
}

/* ------------------------------------------------------------------ *
 * Contact page
 * ------------------------------------------------------------------ */

export const CONTACT_PAGE = {
  eyebrow: 'Say hello',
  heading: 'Tell me what you have in mind.',
  body: 'The more you can tell me, the better the first reply will be — who is in the photos, roughly when, and where you picture it. If you are not sure yet, that is completely fine too.',
  photoId: 'backgrounds-2024-07-05-park-practice-122',
}

/**
 * Only questions I can answer from how the business actually runs.
 *
 * TODO: add booking lead time, deposit terms and the weather / reschedule
 * policy — I do not have those and did not want to invent them.
 */
export const FAQ = [
  {
    q: 'How many photographs do I get?',
    a: 'Senior sessions come with sixty edited images. Every other session is planned individually, so we agree the count when we plan the shoot. You can always add more to your gallery afterwards.',
  },
  {
    q: 'How long do I have the gallery?',
    a: 'A full year in a private Pic-Time gallery. I email you twice before it closes — ninety days out and again at thirty — so it never disappears on you unannounced. Download everything before then and it is yours forever.',
  },
  {
    q: 'Do I get black-and-white versions?',
    a: 'Some of them, yes. As I edit I pick the frames that work better without colour and deliver those in both. It costs nothing extra and it is not a decision you have to make.',
  },
  {
    q: 'How many locations do we get?',
    a: 'Senior sessions use more than one, plus outfit changes. For graduation, engagement, couples and family sessions we usually settle on a single spot that suits you and shoot it properly.',
  },
  {
    q: 'Can my dog come?',
    a: 'Please bring the dog. Pets are included in any session at no extra cost, and they are welcome to have a session entirely of their own.',
  },
  {
    q: 'Where do you travel?',
    a: 'Anywhere in the Des Moines metro is included — I am based in Urbandale. Further afield is genuinely welcome; there is a travel fee, and I will quote it before you commit to anything.'
  },
  {
    q: 'Can I print the photographs?',
    a: 'Yes. You get full download and print rights to every image in your gallery, and you can order prints directly through Pic-Time if that is easier.',
  },
]
