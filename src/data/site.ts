/**
 * Site copy and structured content. Components read from here and contain no
 * prose of their own.
 *
 * Pricing lives in `packages.ts` (a tier ladder per session type), client prep
 * guides in `guides.ts`, and vendor and location recommendations in
 * `vendors.ts`. Everything else is here.
 */

export const SITE = {
  name: 'Ashley Photography',
  tagline: 'Portrait photography in central Iowa',
  base: 'Urbandale, Iowa',
  serves: 'Des Moines metro · Central Iowa · Travel welcome',
  email: 'ashleydesignia@gmail.com',
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
  { label: 'Guides', to: '/guides' },
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
  /** URL slug: /sessions/<id>, /guides/<id>. Also keys PACKAGE_SETS and GUIDES. */
  id: string
  index: string
  title: string
  /** One-line summary, used on the homepage list. */
  blurb: string
  photoId: string
  /** Full-bleed plate behind the masthead on /sessions/<id>. */
  heroPhotoId: string
  /** Portfolio category this session links through to. */
  filter: string
  /** When it happens and how long it takes, in one line. */
  runs: string
  /** Long-form copy for the session's own page. */
  detail: string[]
  /** What this particular session includes, beyond ALWAYS_INCLUDED. */
  points: string[]
  /** Two extra frames for the session page spread. */
  gallery: [string, string]
}

export const SESSIONS: Session[] = [
  {
    id: 'seniors',
    index: '01',
    filter: 'seniors',
    title: 'Senior Pictures',
    blurb: 'Your last year of high school, shot the way you actually are. Three outfits, three locations, and lunch in the middle of it.',
    photoId: 'seniors-elise-portrait-121',
    heroPhotoId: 'seniors-2024-07-05-park-practice-51',
    runs: 'A weekday, from around midday · up to four hours',
    detail: [
      'This is the one session I run to a routine, because seniors all want the same things: enough frames to actually choose from, more than one backdrop, and room to change halfway through. So it is built as an afternoon rather than an hour.',
      'We shoot on a weekday and start around midday — parks and downtown are empty on a Tuesday, and starting high means we can work the built, shaded locations first and finish on golden hour in something green. Up to three outfits, up to three locations, and a lunch stop that is part of the shoot rather than a break from it: we eat there, we photograph there, and you change there.',
      'Afterwards we sit down together and go through every frame from the day. You choose what makes the album; anything you dislike never appears anywhere. Bring the letter jacket, the instrument, the truck, the dog — anything that will look like you in ten years.',
    ],
    points: [
      'Up to three outfits and three locations in one afternoon',
      'A lunch stop you choose, shot as part of the session',
      'A sit-down review where you pick every photograph in the album',
      'Weekday, midday start, planned around the light',
      'Props, jerseys, instruments and pets all welcome',
    ],
    gallery: ['seniors-elise-portrait-102', 'seniors-2024-07-05-park-practice-51'],
  },
  {
    id: 'graduation',
    index: '02',
    filter: 'graduation',
    title: 'Graduation',
    blurb: 'Cap, gown and the campus landmarks that mean something to you. Built around your ceremony weekend.',
    photoId: 'graduation-em-grad-278',
    heroPhotoId: 'graduation-em-grad-233',
    runs: 'Ceremony weekend · one to three hours',
    detail: [
      'Cap, gown, and the parts of campus that actually meant something to you — the entrance sign, the building you all but lived in, the walk you have done a thousand times.',
      'Ceremony weekends are busy and everybody wants a piece of you, so these are built to be efficient. One or two spots, planned in advance, with the gown frames shot first while it is still crisp and everything without it afterwards. That second half matters more than people expect: the gown photographs are the formal record, and the ones without it are the ones you actually look at.',
      'Tell me the ceremony time and I will work around it. The morning before is usually best — quiet campus, good light, and you are not yet three events deep into the day.',
    ],
    points: [
      'Planned around your ceremony, not against it',
      'One to three campus locations, chosen together',
      'Gown on and gown off in the same session',
      'Cords, stoles, regalia and department kit all welcome',
      'Family and housemates can join on the longer session',
    ],
    gallery: ['graduation-em-grad-278', 'graduation-em-grad-61'],
  },
  {
    id: 'engagements',
    index: '03',
    filter: 'engagement',
    title: 'Engagements',
    blurb: 'Golden hour at the one spot that suits you, and the version of you two that only shows up when nobody is watching.',
    photoId: 'engagement-mallorie-connor-31',
    heroPhotoId: 'engagement-july2022-109',
    runs: 'Evening, timed to sunset · ninety minutes to two and a half hours',
    detail: [
      'The point of an engagement session is not the ring — it is having photographs of the two of you from before all the planning took over. We pick a spot that suits you and use the last good hour of light on it.',
      'Start times are set by the light rather than the clock, so they move through the year: half six in October, half seven in June. The first ten minutes are always the stiffest, for everybody, and that is built into the timing. By minute fifteen you will have forgotten I am there.',
      'Expect more conversation than posing. The frames people keep are almost always the ones taken between the directions.',
    ],
    points: [
      'One or two locations, chosen together',
      'Timed to finish on the last of the light',
      'Individual portraits as well as the two of you',
      'Your dog is genuinely welcome',
      'A set of black-and-white frames alongside the colour',
    ],
    gallery: ['engagement-june2022-176', 'engagement-june2022-bw-84'],
  },
  {
    id: 'couples',
    index: '04',
    filter: 'couples',
    title: 'Couples',
    blurb: 'Anniversaries, just-because sessions, or the first proper photos since the wedding day.',
    photoId: 'couples-am-27',
    heroPhotoId: 'couples-am-43',
    runs: 'Evening, timed to sunset · one to two hours',
    detail: [
      'Anniversaries, just-because sessions, or the first proper photographs since the wedding day — the ones where nobody is in a wedding dress and nothing has to be announced.',
      'You do not need an occasion and most people who book this do not have one. The most common reason is simply that the last decent photograph of the two of you is from somebody else’s wedding four years ago.',
      'Same approach as an engagement session: one or two locations, unhurried, timed to the light, and shaped around what the two of you are actually like together.',
    ],
    points: [
      'One or two locations, chosen together',
      'Anniversary, milestone, or no reason at all',
      'Individual portraits as well as the two of you',
      'A set of black-and-white frames alongside the colour',
      'Bookable two years at a time if you want the comparison',
    ],
    gallery: ['couples-am-43', 'couples-am-30'],
  },
  {
    id: 'families',
    index: '05',
    filter: 'family',
    title: 'Families',
    blurb: 'One location, group and individual frames, and enough patience for every last one of them.',
    photoId: 'family-2024-05-18-grad-party-238',
    heroPhotoId: 'family-2024-05-18-grad-party-196',
    runs: 'Late afternoon · one to three hours',
    detail: [
      'Getting everyone in one place is the hard part; the photographs are the easy bit. The whole group first while everybody is still cooperative, then the smaller combinations, then each person on their own while the others recover.',
      'The session scales with how many people we are getting into one place, and I plan the order in advance so nobody stands about for an hour. Small children get to be small children — I have never needed one to sit still and I am not going to start. Anyone elderly gets somewhere with close parking, a bench, and their frames taken first.',
      'Write down the groupings you want before the day and hand me the list. It is the difference between remembering on the day and remembering when the gallery arrives.',
    ],
    points: [
      'One or two locations, chosen together',
      'Group frames plus individual portraits of everyone',
      'Planned in advance so nobody waits about',
      'A private gallery for every household, included',
      'Multiple households in one session on the longer option',
    ],
    gallery: ['family-2024-05-18-grad-party-223', 'family-2024-05-18-grad-party-133'],
  },
  {
    id: 'pets',
    index: '06',
    filter: 'pets',
    title: 'Pets',
    blurb: 'New puppy, old friend. They come along at no extra cost, or take the spotlight on their own.',
    photoId: 'pets-06-27-2024-puppies-110',
    heroPhotoId: 'pets-06-27-2024-puppies-128',
    runs: 'Early morning or last light · forty-five minutes to two hours',
    detail: [
      'Dogs come along to any session at no extra cost, and they are usually the reason the humans finally relax. Nobody has ever been stiff in front of a camera while holding a lead.',
      'They can also have the session entirely to themselves — a new puppy, or an old friend you want photographed properly while you still can. No expectation whatsoever that they sit still; the photographs worth having are of them doing what they actually do.',
      'And get in the frame yourself. Everybody books this for photographs of their animal and then realises what they wanted was photographs of the two of them together, because you are always the one holding the camera.',
    ],
    points: [
      'Included in any other session at no extra cost',
      'Or a session entirely of their own',
      'Early morning or last light, for the temperature as much as the sun',
      'Shot outdoors, at their pace',
      'Portraits of you together, which is what people actually want',
    ],
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

/** Lookup for the session pages and the enquiry form. */
export const SESSIONS_BY_ID = Object.fromEntries(SESSIONS.map((s) => [s.id, s])) as Record<
  string,
  Session
>

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

/**
 * Enquiry form options.
 *
 * `sessions` is derived from SESSIONS so the form can never drift from what is
 * actually offered; the two extras at the end are for people who are not
 * booking. When a session is picked the form narrows the package select to that
 * session's tiers (see PACKAGE_SETS in packages.ts).
 */
export const ENQUIRY = {
  sessions: [...SESSIONS.map((s) => s.title), 'Something else', 'Just a question'],
  /** Maps a `sessions` label back to a session id, for the package select. */
  sessionIdFor: (label: string) => SESSIONS.find((s) => s.title === label)?.id,
  undecided: 'Not sure yet — help me choose',
  timeframes: [
    'As soon as you have space',
    'Within the next month',
    'One to three months out',
    'Three to six months out',
    'Later this year',
    'Next year',
    'Only gathering information for now',
  ],
  heardFrom: [
    'Instagram',
    'A friend or family member',
    'Google',
    'We have worked together before',
    'Somewhere else',
  ],
}

export const CTA = {
  eyebrow: 'Bookings open',
  heading: 'Creating memories that last a lifetime.',
  body: 'Take a look through the work. If the style feels like yours, send me a note — tell me who is in the photos, roughly when, and where you picture it.',
  action: 'Start an enquiry',
  photoId: 'backgrounds-2024-07-05-park-practice-122',
}

/* ------------------------------------------------------------------ *
 * Sessions index
 * ------------------------------------------------------------------ */

export const SESSIONS_PAGE = {
  eyebrow: 'What I photograph',
  heading: 'Six kinds of session.',
  body: 'Each one has its own page, its own three tiers, and its own prep guide. Senior sessions run to a routine — a weekday afternoon, three outfits, three locations and lunch. The rest are shaped around what you actually want.',
  photoId: 'backgrounds-italy-2025-318',
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
 * General questions. Booking terms — retainer, lead time, reschedules — are in
 * `BOOKING.terms` (packages.ts) and render as a second group on the contact
 * page, because those three figures are the ones still awaiting confirmation.
 */
export const FAQ = [
  {
    q: 'How many photographs do I get?',
    a: 'It is set by the tier you pick, and every tier states it plainly — from twenty-five on a short session to a hundred across the two-season senior package. Nothing is vague about it and nothing is decided after the fact. You can always add more from the raw set afterwards.',
  },
  {
    q: 'How do I know which tier to pick?',
    a: 'Say what you want in the enquiry and I will tell you which one fits, including when the cheaper one is the right answer. The middle option is the most popular in every session type for a reason, but a one-hour session genuinely is enough for plenty of people.',
  },
  {
    q: 'How do I prepare?',
    a: 'You get a guide for your session type the day you book — what to wear, when to book hair and makeup, where we are going, what to bring, and how the day runs hour by hour. They are all readable here on the site too, so you can find yours at eleven o’clock the night before.',
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
    q: 'How many locations and outfits do we get?',
    a: 'Up to three of each on a full senior afternoon, including the lunch stop, which we shoot rather than sit out. Everything else runs one or two, depending on the tier. An extra location can be added to any session for $150.',
  },
  {
    q: 'Why are senior sessions on a weekday?',
    a: 'Because parks, downtown and every good doorway in the metro are empty on a Tuesday and heaving on a Saturday, and nobody wants strangers in the background of their senior pictures. A weekday also means four hours without anybody feeling rushed. Weekends are possible when they have to be — ask.',
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
