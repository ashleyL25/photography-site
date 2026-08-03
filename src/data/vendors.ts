/**
 * Recommendations that go out to clients — hair and makeup, lunch stops, and
 * locations.
 *
 * IMPORTANT, READ BEFORE LAUNCH
 *
 * These are real, well-regarded businesses in the Des Moines metro, gathered
 * from public listings and other photographers' vendor pages. They are NOT
 * people Ashley has worked with, because I have no way of knowing who those
 * are. The copy is therefore written as "places in the metro that do this
 * well", never as "my people" — which is true as written, but is not as useful
 * to a client as a real endorsement.
 *
 * So: cross off anyone you would not send a seventeen-year-old to, add the
 * stylists and MUAs you actually trust, and put a `note` on the ones you have
 * a relationship with. Phone numbers and links are deliberately absent rather
 * than guessed — add them as you confirm each one.
 */

export type Vendor = {
  name: string
  /** Neighbourhood or town, as a client would think of it. */
  area: string
  address?: string
  /** What they are good for, in one line. */
  does: string
  /** Anything Ashley wants to add personally. Renders in italics. */
  note?: string
  url?: string
}

export const HAIR_AND_MAKEUP: Vendor[] = [
  {
    name: 'Salon Spa W',
    area: 'East Village, Des Moines',
    address: '400 E Locust St, Suite 2',
    does: 'Hair, makeup and nails in one building, which saves you a morning of driving.',
  },
  {
    name: 'Powder Studio',
    area: 'Des Moines',
    does: 'Styling and makeup application aimed specifically at photoshoots and events rather than everyday wear.',
    url: 'https://www.powderstudioia.com/makeup',
  },
  {
    name: 'S & K Glam',
    area: 'Travels to you, metro-wide',
    does: 'Airbrush makeup and hair on location — the easy option if you would rather not drive anywhere before we start.',
  },
  {
    name: 'J Michaels Salon',
    area: 'Ingersoll, Des Moines',
    address: '2801 Ingersoll Avenue',
    does: 'Starts with a consultation, which is the right way round if you are not certain what you want yet.',
  },
  {
    name: 'Trixie’s Salon',
    area: 'Beaverdale, Des Moines',
    address: '4118 University Avenue',
    does: 'Strong with colour and with textured or curly hair. Good if your look is less classic and more specific.',
  },
  {
    name: 'Allegory Salon',
    area: 'East Village, Des Moines',
    address: '521 E Locust St, #101',
    does: 'Cuts, colour and treatments. Book the treatment a fortnight out, not the morning of.',
  },
  {
    name: 'Oliver + James',
    area: 'Downtown Des Moines',
    address: '1417 Walnut St, Suite C',
    does: 'Blow-outs and styling that hold up to four hours outdoors in an Iowa summer.',
  },
]

/**
 * Lunch stops for senior sessions. The stop is a location, not a break — we
 * shoot in and around it, and it doubles as somewhere to change.
 *
 * Criteria, for when you want to add your own: an exterior worth standing in
 * front of, light indoors that is not fluorescent, somewhere to change, and
 * food a seventeen-year-old will actually eat on camera.
 */
export const LUNCH_STOPS: Vendor[] = [
  {
    name: 'Snookies Malt Shop',
    area: 'Beaverdale, Des Moines',
    does: 'A walk-up window, a paper cup and a picnic table. Unbeatable for the frames people put on their wall, and there is no such thing as a bad photograph of somebody holding a milkshake.',
    note: 'Seasonal — open spring through autumn, which is most of senior season anyway.',
  },
  {
    name: 'Bauder’s Pharmacy',
    area: 'Ingersoll, Des Moines',
    does: 'An actual old soda fountain in an actual old pharmacy. Counter stools, tile, and about ninety years of patina behind you.',
  },
  {
    name: 'St. Kilda',
    area: 'Downtown & Valley Junction',
    does: 'Bright, plant-filled and full of window light. The most flattering interior on this list, and the food photographs as well as you do.',
  },
  {
    name: 'Early Bird',
    area: 'East Village, Des Moines',
    does: 'A modern take on a diner — booths, colour, and a doorway that works as a frame. Good for the louder, more graphic look.',
  },
  {
    name: 'Fong’s Pizza',
    area: 'East Village, Des Moines',
    does: 'Red neon and tiki, which is a completely different set of photographs to anything green we shoot that day.',
  },
  {
    name: 'Gong Fu Tea',
    area: 'Valley Junction, West Des Moines',
    does: 'Small, warm and wood-lined, and thirty seconds from the brick and the murals of Fifth Street.',
  },
  {
    name: 'Chuck’s Restaurant',
    area: 'Highland Park, Des Moines',
    does: 'Old neon, vinyl booths, red sauce. If the rest of your session is soft and green, this is the frame that breaks it up.',
  },
]

/**
 * Locations, grouped the way a client actually chooses: by what it looks like.
 * Fees and permits noted where I know of them — confirm current rules before
 * you send anyone to the Botanical Garden or Salisbury House.
 */
export const LOCATIONS: { group: string; blurb: string; places: string[] }[] = [
  {
    group: 'Green and open',
    blurb: 'Long light, tall grass, and room to walk while we talk. Best late in the day.',
    places: [
      'Water Works Park',
      'Gray’s Lake',
      'Raccoon River Park, West Des Moines',
      'Walnut Woods State Park',
      'Jester Park',
      'Ewing Park — the lilac arboretum, if we are shooting in May',
      'Neal Smith prairie, Prairie City',
      'Ledges State Park, Boone — worth the drive, and a travel quote',
    ],
  },
  {
    group: 'Brick and city',
    blurb: 'Texture, colour, murals and doorways. Best in the middle of the day, in shade.',
    places: [
      'East Village — brick, alleys and the Capitol at the end of the street',
      'Valley Junction, Fifth Street',
      'Downtown skywalk district on a quiet weekday',
      'Beaverdale’s brick shopfronts',
      'Simon Estes Riverfront and the Women of Achievement Bridge',
      'Historic Court Avenue',
    ],
  },
  {
    group: 'Campus',
    blurb: 'For graduation, and for seniors whose next stop is already decided.',
    places: [
      'Iowa State University, Ames — the Campanile and Central Campus',
      'Drake University',
      'University of Northern Iowa, Cedar Falls',
      'Grand View University',
      'Simpson College, Indianola',
    ],
  },
  {
    group: 'Yours',
    blurb:
      'Almost always the best of the three. A back garden, a grandparents’ farm, the pitch you played on, the shop you worked at, the truck.',
    places: [
      'Your own house or garden',
      'A family farm or acreage',
      'Your field, court, pool or track',
      'Wherever you have worked for two years',
      'The car, genuinely',
    ],
  },
]
