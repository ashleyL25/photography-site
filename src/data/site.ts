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
 *
 * The prep guides are deliberately NOT in here. They are per-session documents
 * that belong to people who have booked, so they are reached from a session page
 * (and by the link in the booking email). `/guides` still exists and still lists
 * all six.
 */
export const NAV = [
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Sessions', to: '/sessions' },
  { label: 'Experience', to: '/experience' },
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
  { id: 'about', label: 'Ashley' },
  { id: 'contact', label: 'Inquire' },
] as const

export const HERO = {
  eyebrow: 'Portraits · Urbandale, Iowa',
  lead: 'Ashley',
  script: 'Photography',
  sub: 'Natural-light portraits of the people and places that make up a life.',
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
    'An engagement, a homecoming, a new puppy, the last spring before everyone scatters. These are the moments worth slowing down for, and I will walk you through every step.',
    'Sessions are unhurried and genuinely fun. I guide you enough that nothing feels awkward, then leave room for the real moments — the ones you end up loving most often happen between the poses.',
  ],
  stats: [
    { value: '2021', label: 'Booking since' },
    { value: '100', label: 'Photos, senior session' },
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
      'Every photograph fully retouched, not just color-corrected',
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
      'Start times are set by the light rather than the clock, so they move through the year: 6:30 in October, 7:30 in June. The first ten minutes are always the stiffest, for everybody, and that is built into the timing. By minute fifteen you will have forgotten I am there.',
      'Expect more conversation than posing. The frames people keep are almost always the ones taken between the directions.',
    ],
    points: [
      'One or two locations, chosen together',
      'Timed to finish on the last of the light',
      'Individual portraits as well as the two of you',
      'Your dog is genuinely welcome',
      'A set of black-and-white frames alongside the color',
      'A big album — a hundred and twenty photographs or more',
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
      'A set of black-and-white frames alongside the color',
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
      'And get in the frame yourself. Everybody books this for photographs of their animal and then realizes what they wanted was photographs of the two of them together, because you are always the one holding the camera.',
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
  { photoId: 'pets-06-27-2024-puppies-128', caption: 'New puppy adventures', span: 'wide' },
  { photoId: 'couples-am-27', caption: 'Maddie & Will', span: 'tall' },
  { photoId: 'family-2024-05-18-grad-party-196', caption: 'The whole crew', span: 'wide' },
  { photoId: 'engagement-june2022-bw-84', caption: 'Engagement + Puppy', span: 'tall' },
  { photoId: 'seniors-2024-07-05-park-practice-51', caption: 'Portrait star', span: 'std' },
  { photoId: 'graduation-em-grad-253', caption: 'Cap & Gown', span: 'tall' },
]

export const PROCESS = [
  {
    index: '01',
    title: 'Pick your place',
    body: 'You already have the shoot in your head. Send me the idea and we settle on the spot together — usually one location, more for senior sessions. I come to you anywhere in the Des Moines metro, and anywhere in Iowa the photograph happens to be.',
    photoId: 'backgrounds-2024-07-05-park-practice-127',
  },
  {
    index: '02',
    title: 'Have an actual good time',
    body: 'Photoshoots do not have to be stressful. I keep it moving and light, guide you through the poses, and leave space for the real smiles to show up on their own.',
    photoId: 'engagement-june2022-176',
  },
  {
    index: '03',
    title: 'Get your album',
    body: 'A couple of weeks later the finished album arrives in your own online photo gallery — every frame edited, the ones that earn it in black and white as well as color, ready to download at full size, share with everyone, and order prints from. Then comes the best bit: sitting down and going through all of them.',
    photoId: 'graduation-em-grad-61',
  },
]

/** Lookup for the session pages and the inquiry form. */
export const SESSIONS_BY_ID = Object.fromEntries(SESSIONS.map((s) => [s.id, s])) as Record<
  string,
  Session
>

export const GALLERY = {
  eyebrow: 'Your gallery',
  heading: 'Online for a year, and you will never be caught out by the deadline.',
  body: 'Every session is delivered to a private online photo gallery you can download from, share and order prints through. It stays up for a full year — and I email you twice before it comes down, so nothing is lost to a forgotten tab.',
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
  body: 'Some frames are simply better without color. As I edit, I pick the ones that earn it and deliver those in black and white as well as color — at no extra cost, and no extra decision for you to make.',
}

/**
 * The homepage "behind the camera" block is about why I do this, not when I
 * started. The history lives on the About page — see ABOUT_PAGE.
 */
export const ABOUT = {
  eyebrow: 'Behind the camera',
  heading: 'The frame I am waiting for is the one nobody planned.',
  body: [
    'My favorite frames are almost never the ones we lined up. They are the goofy ones — the unexpected ones — the second after a joke lands and a real smile breaks through before anyone has time to pose for it.',
    'I love watching that happen. The laugh you cannot fake. The look someone gives when they forget the camera is there. The little sideways glance that was never on the shot list.',
    'That is what I am always after: the versions of you that feel like you. Not stiff, not arranged — just alive in the frame. Those are the photographs that still make you smile years later.',
  ],
  photoId: 'about-ashley',
  signature: 'Ashley',
}

/**
 * Inquiry form options.
 *
 * `sessions` is derived from SESSIONS so the form can never drift from what is
 * actually offered; the two extras at the end are for people who are not
 * booking. When a session is picked the form narrows the package select to that
 * session's tiers (see PACKAGE_SETS in packages.ts).
 */
export const INQUIRY = {
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
  action: 'Start an inquiry',
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
 * The experience
 *
 * Everything that is true of every session, whichever kind you book. The prep
 * guides are per-session and go out on booking; this is the version anybody can
 * read before they have decided anything.
 * ------------------------------------------------------------------ */

export const EXPERIENCE_PAGE = {
  eyebrow: 'The experience',
  heading: 'What it is actually like.',
  intro:
    'Every session is different, and yet most of it is the same every time — how we plan it, how the hour itself feels, and what turns up in your inbox afterwards. All of that is on this page, so nothing about booking me is a surprise.',
  photoId: 'backgrounds-italy-2025-319',

  /** The arc every session follows, whatever kind it is. */
  arc: {
    eyebrow: 'Start to finish',
    heading: 'How it goes, every time',
    lead: 'From the first message to the album landing. Senior sessions add a review appointment in the middle; everything else runs exactly like this.',
    items: [
      {
        time: 'You send a note',
        title: 'Tell me what you have in mind',
        detail:
          'Who is in the photographs, roughly when, and where you picture it. I reply within forty-eight hours with dates that work — and if you ask which package fits, I will tell you honestly, including when the cheaper one is the right answer.',
      },
      {
        time: 'Then',
        title: 'We hold the date',
        detail:
          'A $150 retainer holds it, and it comes off your total rather than sitting on top of it. The balance is due the day we shoot.',
      },
      {
        time: 'The same day',
        title: 'Your prep guide arrives',
        detail:
          'A guide written for your session type: what to wear, when to book hair and makeup, where we are going, what to bring, and how the day runs hour by hour. From here until the album lands, ask me anything as often as you like.',
      },
      {
        time: 'A week or so out',
        title: 'We settle the details',
        detail:
          'Locations, the meeting point, where to park. Send me photographs of your outfit options and I will tell you honestly which will work best where we are going — almost nobody does this, and it is the single most useful thing you can do in advance.',
      },
      {
        time: 'The evening before',
        title: 'I message you about the forecast',
        detail:
          'A straight answer about whether we are on, sent the night before rather than the morning of. You will never be left guessing.',
      },
      {
        time: 'The session',
        title: 'You turn up and I do the rest',
        detail:
          'I guide every pose, so nobody has to wonder what to do with their hands. The first fifteen minutes are the stiffest — for everybody, always — and then you forget I am there. That is when the good ones happen.',
      },
      {
        time: 'About two weeks later',
        title: 'Your album arrives',
        detail:
          'The finished set, edited, in your own private online photo gallery. Senior sessions sit down with me first and choose every photograph that makes the album.',
      },
    ],
  },

  /** What is true of every session, regardless of type or tier. */
  principles: {
    eyebrow: 'However you book it',
    heading: 'Four things that are always true',
    items: [
      {
        title: 'You will never wonder what to do',
        body: 'I direct every pose. If you are worried about being awkward on camera — and nearly everybody is — that worry is mine to handle, not yours. Turn up with your outfits and let me do the thinking.',
      },
      {
        title: 'Your dog is genuinely invited',
        body: 'Pets come along to any session at no extra cost, and they are usually the reason the humans finally relax. Nobody has ever been stiff in front of a camera while holding a lead.',
      },
      {
        title: 'Nothing is quoted after the fact',
        body: 'The time, the locations, the outfits and what you receive are stated on every package before you book. If you want more afterwards, the add-ons are priced on the page too.',
      },
      {
        title: 'Ask as many questions as you like',
        body: 'Whether a color works, what to do about a haircut, whether the forecast means it is off. All of it is answerable in advance, so ask — that is what the weeks before the session are for.',
      },
    ],
  },

  /**
   * The editing question, answered before anybody has to ask it. The two
   * descriptions themselves come from RETOUCHING in policy.ts, so this page and
   * the prep guides cannot end up saying different things.
   */
  finishing: {
    eyebrow: 'How the photographs are finished',
    heading: 'Two levels, and you should know which you are getting',
    body: 'Every session is edited by hand, frame by frame, and everything arrives at full resolution — both of these print beautifully. What differs is how much work goes into each individual photograph, and that is what decides how many of them there are.',
    applies: {
      retouched: 'Senior pictures · Graduation · Families',
      natural: 'Engagements · Couples · Pets',
    },
  },

  /** Itemized, so a client can see the whole of what they are buying. */
  receive: {
    eyebrow: 'What you receive',
    heading: 'Everything that comes with a session',
    body: 'Whichever session and whichever tier, this is what is included. What changes between tiers is how much of a day you get — and the larger senior packages, plus the top engagement and family tiers, add a printed album.',
    items: [
      'Your full edited album, in a private online photo gallery',
      'Full-resolution downloads of every image, and the right to print any of them',
      'Selected frames delivered in black and white as well as color',
      'A print store built into the gallery, if that is easier than finding your own',
      'The gallery live for a full year, with two reminders before it closes',
      'A prep guide for your session type, sent the day you book',
      'Locations planned together, and honest feedback on your outfits beforehand',
      'Travel anywhere in the Des Moines metro, included',
      'Your dog, at no extra cost, always',
      'Additional edited images from the raw set whenever you want them',
      'A printed album on the larger senior packages and the top engagement and family tiers',
    ],
  },

  /** Weather policy — the columns come from guides.ts so the two cannot drift. */
  weather: {
    eyebrow: 'Weather, and moving a date',
    heading: 'Gray skies are good news',
  },

  close: {
    heading: 'Still got a question?',
    body: 'Then ask it. No question about a session is too small, and I would much rather answer it now than have you wondering about it the night before.',
  },
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
  body: 'Every session, start to finish — seniors, graduations, engagements, families and a whole lot of dogs. Pick a category, or scroll all of it.',
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
      title: 'Family, friends and trips',
      body: 'Started photographing family, friends and everywhere I traveled — hundreds of frames, no clients, and the best possible practice.',
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
      body: 'Shooting across the Des Moines metro, and happy to travel anywhere in Iowa the session takes me.',
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
    a: 'Every tier states its number before you book, and nothing is decided after the fact. A senior session is sixty, a hundred, or a hundred and fifty photographs depending on which of the three you pick. Everywhere else the count sits on the card too — and it is higher on an engagement, couples or pet session than on a senior or family one of the same length, for the reason in the next answer.',
  },
  {
    q: 'Why does an engagement session come with more photographs than a senior session?',
    a: 'Because of how much is done to each one. Senior, graduation and family photographs are fully retouched — every frame goes through Photoshop as well as Lightroom, so breakouts, sweat marks and creases come out properly. Engagement, couples and pet sessions are edited naturally: color, light and the small things I would fix without being asked, finished in Lightroom. Both are full resolution and both print beautifully. One simply takes several times as long per photograph, so there are fewer of them. If you want a particular engagement frame properly retouched, say which and I will do that one as an add-on.',
  },
  {
    q: 'Do I get a printed album?',
    a: 'Included on the two larger senior packages, and on the top tier of engagement and family sessions. Anywhere else it is an add-on from $200, depending on the page count. Every session comes with the full digital album in your online gallery regardless.',
  },
  {
    q: 'How do I know which tier to pick?',
    a: 'Say what you want in the inquiry and I will tell you which one fits, including when the cheaper one is the right answer. The middle option is the most popular in every session type for a reason, but a one-hour session genuinely is enough for plenty of people.',
  },
  {
    q: 'How do I prepare?',
    a: 'You get a guide for your session type the day you book — what to wear, when to book hair and makeup, where we are going, what to bring, and how the day runs hour by hour. They are all readable here on the site too, so you can find yours at eleven o’clock the night before.',
  },
  {
    q: 'How long do I have the gallery?',
    a: 'A full year in a private online photo gallery. I email you twice before it closes — ninety days out and again at thirty — so it never disappears on you unannounced. Download everything before then and it is yours forever.',
  },
  {
    q: 'Do I get black-and-white versions?',
    a: 'Some of them, yes. As I edit I pick the frames that work better without color and deliver those in both. It costs nothing extra and it is not a decision you have to make.',
  },
  {
    q: 'How many locations and outfits do we get?',
    a: 'Up to three of each on a full senior afternoon, including the lunch stop, which we shoot rather than sit out. Everything else runs one or two, depending on the tier. An extra location can be added to any session for $150.',
  },
  {
    q: 'Why are senior sessions on a weekday?',
    a: 'Because parks, downtown and every good doorway in the metro are empty on a Tuesday and packed on a Saturday, and nobody wants strangers in the background of their senior pictures. A weekday also means four hours without anybody feeling rushed. Weekends are possible when they have to be — ask.',
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
    a: 'Yes. You get full download and print rights to every image in your gallery, and you can order prints directly through the gallery itself if that is easier.',
  },
]
