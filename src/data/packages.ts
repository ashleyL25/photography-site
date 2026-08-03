/**
 * Pricing — one ladder of tiers per session type.
 *
 * Every session type gets three tiers built from the same four specs (time,
 * locations, outfits, images) so the cards line up visually and a client can
 * compare across session types without re-reading everything.
 *
 * WHERE THE NUMBERS CAME FROM
 *
 * These are pitched against the central-Iowa market as it stands: budget
 * shooters in the metro run $90–$200 an hour, mid-market senior collections
 * start around $300, and the premium end of the Des Moines / Pella corridor
 * starts at $850. Ashley's flagship senior session — four hours, three
 * locations, three outfits, a lunch stop and a sit-down review — belongs at
 * that premium end, so it is priced there and the rest of the ladder is built
 * around it.
 *
 * They are still figures somebody else chose. Read them once, change what
 * feels wrong, and they are yours.
 */

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
    note: 'Sessions run on a weekday and start around midday, which is what makes three locations and a lunch stop fit inside one afternoon. Weekends are possible when they have to be — ask.',
    tiers: [
      {
        id: 'seniors-hour',
        name: 'The Hour',
        price: '$450',
        unit: 'one hour',
        summary: 'The yearbook photo, and a set you actually like.',
        spec: {
          time: 'About an hour',
          locations: 'One',
          outfits: 'One or two',
          images: '25 edited photographs',
        },
        includes: [
          'One location, picked together beforehand',
          'A change of clothes if you want one',
          'The letter jacket, the instrument, the dog — bring them',
          'Gallery in about two weeks',
        ],
      },
      {
        id: 'seniors-afternoon',
        name: 'The Afternoon',
        price: '$895',
        unit: 'the full routine',
        summary: 'Three looks, three places, and lunch in the middle of it.',
        spec: {
          time: 'Around four hours',
          locations: 'Up to three',
          outfits: 'Up to three',
          images: '60 edited photographs',
        },
        includes: [
          'Three locations across the metro, planned with you',
          'A lunch stop that doubles as a location and a changing room',
          'A sit-down review where you choose every photograph that makes the album',
          'Props, jerseys, instruments, trucks and dogs all welcome',
          'Gallery in about two weeks',
        ],
        featured: true,
      },
      {
        id: 'seniors-two-seasons',
        name: 'Two Seasons',
        price: '$1,450',
        unit: 'two sessions',
        summary: 'Once in the spring green, once in the autumn colour.',
        spec: {
          time: 'Two afternoons',
          locations: 'Up to six across both',
          outfits: 'Up to six across both',
          images: '100 edited photographs',
        },
        includes: [
          'Two full afternoons, months apart',
          'The spring session doubles as the plan for the autumn one',
          'A review appointment after each',
          'Two completely different sets of weather, light and colour',
          'One combined gallery at the end',
        ],
      },
    ],
  },

  {
    id: 'graduation',
    intro:
      'Ceremony weekends are busy and everybody wants a piece of you, so these are built to be efficient. Tell me the weekend and I will work around it.',
    tiers: [
      {
        id: 'graduation-hour',
        name: 'The Ceremony Hour',
        price: '$425',
        unit: 'one hour',
        summary: 'One landmark, gown on and gown off.',
        spec: {
          time: 'About an hour',
          locations: 'One',
          outfits: 'Gown on, gown off',
          images: '30 edited photographs',
        },
        includes: [
          'The one campus spot that means something to you',
          'Gown frames and normal-clothes frames in the same hour',
          'Scheduled around the ceremony, not against it',
          'Gallery in about two weeks',
        ],
      },
      {
        id: 'graduation-campus',
        name: 'Campus',
        price: '$675',
        unit: 'two hours',
        summary: 'The entrance sign, your building, and the walk you have done a thousand times.',
        spec: {
          time: 'About two hours',
          locations: 'Two',
          outfits: 'Two, gown included',
          images: '50 edited photographs',
        },
        includes: [
          'Two places on or around campus, chosen together',
          'Gown, department regalia, cords and stoles',
          'Time for the frames that are not about the gown at all',
          'Gallery in about two weeks',
        ],
        featured: true,
      },
      {
        id: 'graduation-everyone',
        name: 'Campus & Everyone',
        price: '$895',
        unit: 'three hours',
        summary: 'You, then the people who got you there.',
        spec: {
          time: 'About three hours',
          locations: 'Two or three',
          outfits: 'Two or three',
          images: '70 edited photographs',
        },
        includes: [
          'Everything in Campus, plus family and housemates',
          'Group frames and a portrait of each person in them',
          'A private gallery for every household that wants one',
          'Gallery in about two weeks',
        ],
      },
    ],
  },

  {
    id: 'engagements',
    intro:
      'The point of an engagement session is having photographs of the two of you from before the planning took over. Pick how much of the evening you want.',
    note: 'Engagement sessions are timed to the light rather than the clock, so the start time moves through the year — usually two hours before sunset.',
    tiers: [
      {
        id: 'engagements-golden',
        name: 'Golden Hour',
        price: '$525',
        unit: 'ninety minutes',
        summary: 'One place, the last good light, and no rush about it.',
        spec: {
          time: 'Ninety minutes',
          locations: 'One',
          outfits: 'One or two',
          images: '40 edited photographs',
        },
        includes: [
          'One location, chosen together',
          'Timed for the last hour of usable light',
          'Ring detail frames without making the whole thing about the ring',
          'A set of black-and-white frames alongside the colour',
        ],
        featured: true,
      },
      {
        id: 'engagements-two-places',
        name: 'Two Places',
        price: '$795',
        unit: 'two and a half hours',
        summary: 'Somewhere in town, somewhere in the green, one evening.',
        spec: {
          time: 'Two and a half hours',
          locations: 'Two',
          outfits: 'Two',
          images: '65 edited photographs',
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
        price: '$1,250',
        unit: 'two sessions',
        summary: 'The engagement session, and a second one closer to the day.',
        spec: {
          time: 'Two evenings',
          locations: 'Up to four across both',
          outfits: 'Up to four across both',
          images: '110 edited photographs',
        },
        includes: [
          'Two sessions in two different seasons',
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
        price: '$475',
        unit: 'one hour',
        summary: 'One place, unhurried, no reason required.',
        spec: {
          time: 'About an hour',
          locations: 'One',
          outfits: 'One or two',
          images: '35 edited photographs',
        },
        includes: [
          'One location, chosen together',
          'Individual portraits as well as the two of you',
          'Your dog at no extra cost',
          'A set of black-and-white frames alongside the colour',
        ],
        featured: true,
      },
      {
        id: 'couples-two-places',
        name: 'Two Places',
        price: '$725',
        unit: 'two hours',
        summary: 'A change of scene and a change of clothes.',
        spec: {
          time: 'About two hours',
          locations: 'Two',
          outfits: 'Two',
          images: '60 edited photographs',
        },
        includes: [
          'Two locations with a change between them',
          'Dressed-up frames and the ones in your own jumpers',
          'Timed to end on the good light',
          'A set of black-and-white frames alongside the colour',
        ],
      },
      {
        id: 'couples-every-year',
        name: 'Every Year',
        price: '$1,100',
        unit: 'two sessions',
        summary: 'The same two people, twelve months apart.',
        spec: {
          time: 'Two sessions, a year apart',
          locations: 'Up to four across both',
          outfits: 'Up to four across both',
          images: '100 edited photographs',
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
      'Getting everyone in one place is the hard part. The photographs are the easy bit. Price scales with how many people we are getting in one place.',
    note: 'Everybody who needs their own gallery gets one — parents, grandparents, the sibling who lives out of state. That is included, not an extra.',
    tiers: [
      {
        id: 'families-hour',
        name: 'The Hour',
        price: '$525',
        unit: 'one hour',
        summary: 'One household, one location, everybody in the frame.',
        spec: {
          time: 'About an hour',
          locations: 'One',
          outfits: 'One',
          images: '40 edited photographs',
        },
        includes: [
          'The whole group together, then each person on their own',
          'One location, chosen together',
          'Dogs are family and come at no extra cost',
          'Gallery in about two weeks',
        ],
        featured: true,
      },
      {
        id: 'families-extended',
        name: 'Extended',
        price: '$795',
        unit: 'two hours',
        summary: 'More people, more combinations, more patience.',
        spec: {
          time: 'About two hours',
          locations: 'One or two',
          outfits: 'One or two',
          images: '65 edited photographs',
        },
        includes: [
          'Every grouping worth having — couples, siblings, cousins, the lot',
          'A second location if the group can stand moving',
          'A private gallery for each household',
          'Gallery in about two weeks',
        ],
      },
      {
        id: 'families-generations',
        name: 'Generations',
        price: '$1,050',
        unit: 'three hours',
        summary: 'The whole family, in one place, for once.',
        spec: {
          time: 'About three hours',
          locations: 'Two',
          outfits: 'Up to two',
          images: '90 edited photographs',
        },
        includes: [
          'Multiple households in one session, planned in advance',
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
        price: '$325',
        unit: 'forty-five minutes',
        summary: 'A new puppy, or an old friend, photographed properly.',
        spec: {
          time: 'Forty-five minutes',
          locations: 'One',
          outfits: 'Bandanas encouraged',
          images: '25 edited photographs',
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
        price: '$495',
        unit: 'ninety minutes',
        summary: 'Two places, and time for them to get bored of me.',
        spec: {
          time: 'Ninety minutes',
          locations: 'Two',
          outfits: 'Bandanas encouraged',
          images: '45 edited photographs',
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
        price: '$650',
        unit: 'two hours',
        summary: 'Because there are no good photographs of you together.',
        spec: {
          time: 'About two hours',
          locations: 'Two',
          outfits: 'One or two, yours',
          images: '60 edited photographs',
        },
        includes: [
          'Portraits of them, of you, and of the two of you',
          'Two locations with a change of clothes between',
          'More than one animal is fine — tell me how many',
          'A set of black-and-white frames alongside the colour',
        ],
      },
    ],
  },
]

export const PACKAGES_BY_SESSION = Object.fromEntries(
  PACKAGE_SETS.map((set) => [set.id, set]),
) as Record<string, PackageSet>

/** Lowest price in a set, for the "from" figure on index pages. */
export function fromPrice(sessionId: string): string {
  const set = PACKAGES_BY_SESSION[sessionId]
  if (!set) return 'By quote'
  const lowest = set.tiers.reduce((min, tier) => {
    const value = Number(tier.price.replace(/[^0-9]/g, ''))
    return value < min.value ? { value, price: tier.price } : min
  }, { value: Infinity, price: 'By quote' })
  return `From ${lowest.price}`
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
  'A private Pic-Time gallery, online for a full year',
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
      title: 'Send the enquiry',
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
      a: 'Six to eight weeks is comfortable. Senior sessions fill up from May onward and autumn weekends go first — if a date is tight I will tell you straight away rather than let you find out later.',
    },
    {
      q: 'What holds my date?',
      a: 'A $150 retainer. It comes off the total rather than sitting on top of it, and the balance is due on the day. If you need to split the balance, ask — that is usually fine.',
    },
    {
      q: 'What happens if the weather is bad?',
      a: 'We move it, at no charge. Rain, high wind and genuinely unusable light are all free reschedules, and I would far rather move a session than shoot it in the wrong conditions. Overcast is not bad weather — it is the best light there is.',
    },
    {
      q: 'What if I need to change the date?',
      a: 'Move it once at no charge as long as I know a week out. Inside a week I will still try, but the retainer holds the original date rather than following you to a new one.',
    },
  ],
}
