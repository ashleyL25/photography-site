/**
 * Pricing — one ladder of tiers per session type.
 *
 * Every session type gets three tiers built from the same four specs (time,
 * locations, outfits, images) so the cards line up visually and a client can
 * compare across session types without re-reading everything.
 *
 * HOW THE NUMBERS RELATE TO EACH OTHER
 *
 * Every single-session tier is priced straight off `RATE_CARD` below, so the
 * ladder cannot drift out of step with the time it sells. Before this, a
 * forty-five-minute pet session cost $325 while a sixty-minute senior session
 * cost $450 — a $130 jump for fifteen minutes — and nothing across the six
 * session types agreed on what an hour was worth. Now one table decides.
 *
 * Multi-session tiers (Two Seasons, Before The Wedding, Every Year) are the sum
 * of their parts, discounted, with a printed album folded in where one is
 * included. Those are the only hand-set figures.
 *
 * Image counts follow from the length and from EDITING_STYLE: roughly forty
 * delivered photos per hour on a fully retouched session, roughly eighty on a
 * naturally edited one. A retouched frame takes several times as long to finish,
 * which is the whole reason the counts differ.
 *
 * WHERE THE LEVEL CAME FROM
 *
 * Pitched against the central-Iowa market as it stands: budget shooters in the
 * metro run $90–$200 an hour, mid-market senior collections start around $300,
 * and the premium end of the Des Moines / Pella corridor starts at $850.
 * Ashley's flagship senior session — four hours, three locations, three outfits,
 * a lunch stop and a sit-down review — belongs at that premium end, so `four` in
 * the rate card is anchored there at $895 and everything else follows.
 *
 * To move the whole business up or down, change RATE_CARD and nothing else.
 * These are still figures somebody else chose — read them once and make them
 * yours.
 */

// `EDITING_STYLE` and `RETOUCHING` live in policy.ts — they are shared with the
// prep guides, which have no business importing a price list.
export { EDITING_STYLE, RETOUCHING } from './policy'

/**
 * Price for a given session length. The single source of truth for every
 * single-session tier; change a number here and the ladders follow.
 */
export const RATE_CARD = {
  short: 295, // forty-five minutes
  hour: 375, // one hour
  ninety: 475, // ninety minutes
  two: 575, // two hours
  half: 675, // two and a half hours
  three: 775, // three hours
  four: 895, // four hours — the senior afternoon, and the anchor for the rest
} as const

/** `1450` → `'$1,450'`. */
export const money = (n: number) => `$${n.toLocaleString('en-US')}`

/**
 * Session types whose prices are not shown to the public.
 *
 * Senior and engagement pricing is sent directly rather than posted, so those
 * two ladders render with "By request" where the figure would be. Appending
 * `?pricing=<PRICING_KEY>` to any URL reveals them for the rest of the browser
 * session — that is the link to send a client.
 *
 * This is a courtesy screen, not a lock. The figures are in the JavaScript
 * bundle and anyone determined can read them, so do not put anything in here
 * that would actually matter if it got out.
 */
export const PRIVATE_PRICING = ['seniors', 'engagements']

/** Change this and the old shared links stop working, which is the point. */
export const PRICING_KEY = 'iowa2026'

export type Tier = {
  id: string
  name: string
  price: string
  /** Sits under the price. Keep it to three or four words. */
  unit: string
  summary: string
  /** The four rows every card carries, in this order. */
  spec: {
    time: string
    locations: string
    outfits: string
    images: string
  }
  includes: string[]
  /** Exactly one per set. Renders as the highlighted card. */
  featured?: boolean
}

export type PackageSet = {
  /** Matches a Session id in site.ts. */
  id: string
  /** One sentence above the cards. */
  intro: string
  tiers: Tier[]
  /** Session-specific caveat under the cards. Optional. */
  note?: string
}

export const PACKAGE_SETS: PackageSet[] = [
  {
    id: 'seniors',
    intro:
      'Senior sessions are the one thing I run to a routine, because seniors all want the same things: enough frames to actually choose from, more than one backdrop, and room to change halfway through. Pick the size of the day.',
    note: 'Sessions run on a weekday and start around midday, which is what makes three locations and a lunch stop fit inside one afternoon. Weekends are possible when they have to be — ask. Every photograph in a senior album is fully retouched, which is why the counts are lower here than on an engagement session.',
    tiers: [
      {
        id: 'seniors-hour',
        name: 'The Hour',
        price: money(RATE_CARD.hour),
        unit: 'one hour',
        summary: 'The yearbook photo, and a set you actually like.',
        spec: {
          time: 'One hour',
          locations: 'One',
          outfits: 'One or two',
          images: '40+ retouched photos',
        },
        includes: [
          'One location, picked together beforehand',
          'A change of clothes if you want one',
          'The letter jacket, the instrument, the dog — bring them',
          'Every photograph fully retouched',
          'Gallery in about two weeks',
        ],
      },
      {
        id: 'seniors-afternoon',
        name: 'The Afternoon',
        price: money(RATE_CARD.four),
        unit: 'the full routine',
        summary: 'Three looks, three places, and lunch in the middle of it.',
        spec: {
          time: 'Four hours',
          locations: 'Up to three',
          outfits: 'Up to three',
          images: '150+ retouched photos',
        },
        includes: [
          'Three locations across the metro, planned with you',
          'A lunch stop that doubles as a location and a changing room',
          'A sit-down review where you choose every photograph that makes the album',
          'Props, jerseys, instruments, trucks and dogs all welcome',
          'Every photograph fully retouched',
        ],
        featured: true,
      },
      {
        id: 'seniors-two-seasons',
        name: 'Two Seasons',
        // Two full afternoons ($1,790 of time) discounted, with the printed
        // album included rather than charged for.
        price: money(1595),
        unit: 'two afternoons',
        summary: 'Once in the spring green, once in the fall color.',
        spec: {
          time: 'Two four-hour afternoons',
          locations: 'Up to six across both',
          outfits: 'Up to six across both',
          images: '300+ retouched photos',
        },
        includes: [
          'Two full afternoons, months apart',
          'A printed album, included — the only tier that comes with one',
          'The spring session doubles as the plan for the fall one',
          'A review appointment after each',
          'Two completely different sets of weather, light and color',
          'One combined gallery at the end',
        ],
      },
    ],
  },

  {
    id: 'graduation',
    intro:
      'Ceremony weekends are busy and everybody wants a piece of you, so these are built to be efficient. Tell me the weekend and I will work around it.',
    note: 'Graduation photographs are fully retouched, the same as senior pictures.',
    tiers: [
      {
        id: 'graduation-hour',
        name: 'The Ceremony Hour',
        price: money(RATE_CARD.hour),
        unit: 'one hour',
        summary: 'One landmark, gown on and gown off.',
        spec: {
          time: 'One hour',
          locations: 'One',
          outfits: 'Gown on, gown off',
          images: '40+ retouched photos',
        },
        includes: [
          'The one campus spot that means something to you',
          'Gown frames and normal-clothes frames in the same hour',
          'Scheduled around the ceremony, not against it',
          'Every photograph fully retouched',
        ],
      },
      {
        id: 'graduation-campus',
        name: 'Campus',
        price: money(RATE_CARD.two),
        unit: 'two hours',
        summary: 'The entrance sign, your building, and the walk you have done a thousand times.',
        spec: {
          time: 'Two hours',
          locations: 'Two',
          outfits: 'Two, gown included',
          images: '80+ retouched photos',
        },
        includes: [
          'Two places on or around campus, chosen together',
          'Gown, department regalia, cords and stoles',
          'Time for the frames that are not about the gown at all',
          'Every photograph fully retouched',
        ],
        featured: true,
      },
      {
        id: 'graduation-everyone',
        name: 'Campus & Everyone',
        price: money(RATE_CARD.three),
        unit: 'three hours',
        summary: 'You, then the people who got you there.',
        spec: {
          time: 'Three hours',
          locations: 'Two or three',
          outfits: 'Two or three',
          images: '120+ retouched photos',
        },
        includes: [
          'Everything in Campus, plus family and housemates',
          'Group frames and a portrait of each person in them',
          'A private gallery for every household that wants one',
          'Every photograph fully retouched',
        ],
      },
    ],
  },

  {
    id: 'engagements',
    intro:
      'The point of an engagement session is having photographs of the two of you from before the planning took over. Pick how much of the evening you want.',
    note: 'Engagement sessions are timed to the light rather than the clock, so the start time moves through the year — usually two hours before sunset. These albums are large because they are naturally edited rather than retouched frame by frame; if you want a particular photograph properly retouched, just say which one.',
    tiers: [
      {
        id: 'engagements-golden',
        name: 'Golden Hour',
        price: money(RATE_CARD.ninety),
        unit: 'ninety minutes',
        summary: 'One place, the last good light, and no rush about it.',
        spec: {
          time: 'Ninety minutes',
          locations: 'One',
          outfits: 'One or two each',
          images: '120+ edited photos',
        },
        includes: [
          'One location, chosen together',
          'Timed for the last hour of usable light',
          'Ring detail frames without making the whole thing about the ring',
          'A set of black-and-white frames alongside the color',
        ],
        featured: true,
      },
      {
        id: 'engagements-two-places',
        name: 'Two Places',
        price: money(RATE_CARD.half),
        unit: 'two and a half hours',
        summary: 'Somewhere in town, somewhere in the green, one evening.',
        spec: {
          time: 'Two and a half hours',
          locations: 'Two',
          outfits: 'Two each',
          images: '200+ edited photos',
        },
        includes: [
          'Two locations with a change of clothes between them',
          'Started early enough to still finish on golden hour',
          'Individual portraits as well as the two of you',
          'Your dog is genuinely welcome',
        ],
      },
      {
        id: 'engagements-before',
        name: 'Before The Wedding',
        // Golden Hour plus Two Places at full value, with the printed album
        // standing in for the bundle discount.
        price: money(RATE_CARD.ninety + RATE_CARD.half),
        unit: 'two evenings',
        summary: 'The engagement session, and a second one closer to the day.',
        spec: {
          time: 'Two evenings',
          locations: 'Up to four across both',
          outfits: 'Up to four across both',
          images: '350+ edited photos',
        },
        includes: [
          'Two sessions in two different seasons',
          'A printed album, included — the only tier that comes with one',
          'Save-the-date frames from the first, everything else from the second',
          'Somewhere that matters to you both for one of them',
          'One combined gallery at the end',
        ],
      },
    ],
  },

  {
    id: 'couples',
    intro:
      'Anniversaries, just-because sessions, or the first proper photographs since the wedding day. Same approach as an engagement session, with less to announce.',
    tiers: [
      {
        id: 'couples-hour',
        name: 'The Hour',
        price: money(RATE_CARD.hour),
        unit: 'one hour',
        summary: 'One place, unhurried, no reason required.',
        spec: {
          time: 'One hour',
          locations: 'One',
          outfits: 'One or two each',
          images: '80+ edited photos',
        },
        includes: [
          'One location, chosen together',
          'Individual portraits as well as the two of you',
          'Your dog at no extra cost',
          'A set of black-and-white frames alongside the color',
        ],
        featured: true,
      },
      {
        id: 'couples-two-places',
        name: 'Two Places',
        price: money(RATE_CARD.two),
        unit: 'two hours',
        summary: 'A change of scene and a change of clothes.',
        spec: {
          time: 'Two hours',
          locations: 'Two',
          outfits: 'Two each',
          images: '160+ edited photos',
        },
        includes: [
          'Two locations with a change between them',
          'Dressed-up frames and the ones in your own sweaters',
          'Timed to end on the good light',
          'A set of black-and-white frames alongside the color',
        ],
      },
      {
        id: 'couples-every-year',
        name: 'Every Year',
        // Two ninety-minute sessions ($950 of time), discounted for booking both.
        price: money(895),
        unit: 'two sessions',
        summary: 'The same two people, twelve months apart.',
        spec: {
          time: 'Two ninety-minute evenings, a year apart',
          locations: 'Up to four across both',
          outfits: 'Up to four across both',
          images: '240+ edited photos',
        },
        includes: [
          'This year and next year, booked in one go',
          'Same spot both times if you want the comparison',
          'Whatever has changed in between is rather the point',
          'A gallery for each, and one combined set',
        ],
      },
    ],
  },

  {
    id: 'families',
    intro:
      'Getting everyone in one place is the hard part. The photographs are the easy bit. Price scales with how long we need to get everybody in front of the camera.',
    note: 'Everybody who needs their own gallery gets one — parents, grandparents, the sibling who lives out of state. That is included, not an extra. Family photographs are fully retouched, the same as senior pictures.',
    tiers: [
      {
        id: 'families-hour',
        name: 'The Hour',
        price: money(RATE_CARD.hour),
        unit: 'one hour',
        summary: 'One household, one location, everybody in the frame.',
        spec: {
          time: 'One hour',
          locations: 'One',
          outfits: 'One',
          images: '40+ retouched photos',
        },
        includes: [
          'The whole group together, then each person on their own',
          'One location, chosen together',
          'Dogs are family and come at no extra cost',
          'Every photograph fully retouched',
        ],
        featured: true,
      },
      {
        id: 'families-extended',
        name: 'Extended',
        price: money(RATE_CARD.two),
        unit: 'two hours',
        summary: 'More people, more combinations, more patience.',
        spec: {
          time: 'Two hours',
          locations: 'One or two',
          outfits: 'One or two',
          images: '80+ retouched photos',
        },
        includes: [
          'Every grouping worth having — couples, siblings, cousins, all of them',
          'A second location if the group can stand moving',
          'A private gallery for each household',
          'Every photograph fully retouched',
        ],
      },
      {
        id: 'families-generations',
        name: 'Generations',
        price: money(RATE_CARD.three),
        unit: 'three hours',
        summary: 'The whole family, in one place, for once.',
        spec: {
          time: 'Three hours',
          locations: 'Two',
          outfits: 'Up to two',
          images: '120+ retouched photos',
        },
        includes: [
          'Multiple households in one session, planned in advance',
          'A printed album, included — the only tier that comes with one',
          'Every combination, plus a portrait of each person',
          'Enough time built in for the toddlers and the grandparents',
          'A private gallery for every household',
        ],
      },
    ],
  },

  {
    id: 'pets',
    intro:
      'Dogs come along to any other session at no extra cost. These are for when they are the reason for the session.',
    tiers: [
      {
        id: 'pets-short-walk',
        name: 'The Short Walk',
        price: money(RATE_CARD.short),
        unit: 'forty-five minutes',
        summary: 'A new puppy, or an old friend, photographed properly.',
        spec: {
          time: 'Forty-five minutes',
          locations: 'One',
          outfits: 'Bandanas encouraged',
          images: '60+ edited photos',
        },
        includes: [
          'One location, outdoors, at their pace',
          'No expectation whatsoever that they sit still',
          'Treats are your department and they help enormously',
          'Gallery in about two weeks',
        ],
        featured: true,
      },
      {
        id: 'pets-long-walk',
        name: 'The Long Walk',
        price: money(RATE_CARD.ninety),
        unit: 'ninety minutes',
        summary: 'Two places, and time for them to get bored of me.',
        spec: {
          time: 'Ninety minutes',
          locations: 'Two',
          outfits: 'Bandanas encouraged',
          images: '120+ edited photos',
        },
        includes: [
          'Two locations, usually one green and one built',
          'Room for a proper break in the middle',
          'Frames of them running, which take time and are worth it',
          'Gallery in about two weeks',
        ],
      },
      {
        id: 'pets-and-you',
        name: 'Them And You',
        price: money(RATE_CARD.two),
        unit: 'two hours',
        summary: 'Because there are no good photographs of you together.',
        spec: {
          time: 'Two hours',
          locations: 'Two',
          outfits: 'One or two, yours',
          images: '160+ edited photos',
        },
        includes: [
          'Portraits of them, of you, and of the two of you',
          'Two locations with a change of clothes between',
          'More than one animal is fine — tell me how many',
          'A set of black-and-white frames alongside the color',
        ],
      },
    ],
  },
]

export const PACKAGES_BY_SESSION = Object.fromEntries(
  PACKAGE_SETS.map((set) => [set.id, set]),
) as Record<string, PackageSet>

/** `true` when this session's prices are only shown on an unlocked link. */
export const isPrivatePricing = (sessionId: string, unlocked = false) =>
  !unlocked && PRIVATE_PRICING.includes(sessionId)

/**
 * Lowest price in a set, for the "from" figure on index pages. Sessions with
 * private pricing say so instead, unless the reader arrived on an unlocked link.
 */
export function fromPrice(sessionId: string, unlocked = false): string {
  const set = PACKAGES_BY_SESSION[sessionId]
  if (!set) return 'By quote'
  if (isPrivatePricing(sessionId, unlocked)) return 'Pricing by request'
  const lowest = set.tiers.reduce((min, tier) => {
    const value = Number(tier.price.replace(/[^0-9]/g, ''))
    return value < min.value ? { value, price: tier.price } : min
  }, { value: Infinity, price: 'By quote' })
  return `From ${lowest.price}`
}

/** Shown in place of the ladder's prices when a session's pricing is private. */
export const PRICING_BY_REQUEST = {
  price: 'By request',
  note: 'Senior and engagement pricing is sent directly rather than posted. Everything each package includes is above — tell me roughly when and where you are thinking, and the full price list comes back with the first reply.',
}

/** The tier marked `featured`, falling back to the middle of the ladder. */
export function headlineTier(sessionId: string): Tier | undefined {
  const set = PACKAGES_BY_SESSION[sessionId]
  if (!set) return undefined
  return set.tiers.find((t) => t.featured) ?? set.tiers[Math.floor(set.tiers.length / 2)]
}

/** Applies to every session, whatever the tier. */
export const ALWAYS_INCLUDED = [
  'Travel included across the Des Moines metro',
  'A private online photo gallery, live for a full year',
  'Full download and print rights to your images',
  'Selected frames also delivered in black and white',
  'A prep guide sent the moment you book',
  'Additional edited images available any time',
]

export const ADD_ONS: { label: string; price: string; detail?: string }[] = [
  {
    label: 'An additional edited image',
    price: '$30',
    detail: 'Pulled from the raw set after you have seen the gallery.',
  },
  {
    label: 'Twenty additional images',
    price: '$450',
    detail: 'The sensible way to do it if you want more than a handful.',
  },
  {
    label: 'Major retouching, per photograph',
    price: '$35',
    detail:
      'For a breakout, a sweat mark or anything else that needs Photoshop rather than Lightroom. Only applies to naturally edited sessions — engagements, couples and pets. The small things are always included at no cost, and senior, graduation and family photographs are fully retouched already.',
  },
  {
    label: 'A printed album',
    price: 'Quoted',
    detail:
      'Priced by size and page count. Already included on the top tier of senior, engagement and family sessions.',
  },
  {
    label: 'An extra location',
    price: '$150',
    detail: 'Driving time included. Adds roughly forty minutes to the day.',
  },
  {
    label: 'An extra half hour',
    price: '$175',
    detail: 'Decided on the day is fine, as long as nothing is booked after you.',
  },
  {
    label: 'Rush delivery, inside seven days',
    price: '$150',
    detail: 'Subject to what else is on the edit desk that week.',
  },
  {
    label: 'Travel beyond the Des Moines metro',
    price: 'Quoted',
    detail: 'Always quoted before you commit to anything. Often it is nothing.',
  },
  {
    label: 'A gallery for another household',
    price: 'Included',
    detail: 'Grandparents, the sibling out of state, whoever needs one.',
  },
  {
    label: 'Your dog',
    price: 'Free',
    detail: 'Always has been. Please bring the dog.',
  },
]

/**
 * Booking terms.
 *
 * TO CONFIRM — retainer amount, lead time and the reschedule rule are the
 * three things on this page I could not derive from how the business already
 * runs. They are written the way most portrait photographers in this market
 * write them. Change them to match what you actually do before launch.
 */
export const BOOKING = {
  eyebrow: 'How booking works',
  heading: 'Four steps, and none of them are complicated.',
  steps: [
    {
      index: '01',
      title: 'Send the inquiry',
      body: 'Tell me the session type, roughly when, and who is in it. I reply within forty-eight hours, usually sooner, with dates that work.',
    },
    {
      index: '02',
      title: 'Hold the date',
      body: 'A $150 retainer holds it and comes off your total. The balance is due the day we shoot.',
    },
    {
      index: '03',
      title: 'Get your guide',
      body: 'A prep guide for your session type lands in your inbox the same day — what to wear, when to book hair and makeup, where we are going, what to bring.',
    },
    {
      index: '04',
      title: 'Shoot it',
      body: 'I guide every pose. You show up with your outfits and your gear, and that is genuinely the whole job.',
    },
  ],
  terms: [
    {
      q: 'How far ahead should I book?',
      a: 'Six to eight weeks is comfortable. Senior sessions fill up from May onward and fall weekends go first — if a date is tight I will tell you right away rather than let you find out later.',
    },
    {
      q: 'What holds my date?',
      a: 'A $150 retainer. It comes off the total rather than sitting on top of it, and the balance is due on the day. If you need to split the balance, ask — that is usually fine.',
    },
    {
      q: 'What happens if the weather is bad?',
      a: 'We move it, at no charge. Rain, high wind and genuinely unusable light are all free reschedules, and I would much rather move a session than shoot it in the wrong conditions. Overcast is not bad weather — it is the best light there is.',
    },
    {
      q: 'What if I need to change the date?',
      a: 'The first change is free, even if it is the day before — life happens, and I would rather move it than shoot a day you are dreading. A second change carries a small fee, which I will tell you before anything is decided. Either way, tell me as soon as you know and I will find you another date.',
    },
  ],
}
