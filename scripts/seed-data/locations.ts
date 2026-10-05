/**
 * The locations Ashley suggests to a client, with photographs.
 *
 * The editorial half lives here and ships with the site. The photographs do
 * NOT: they are published from the gallery dashboard and fetched at runtime by
 * `locations-remote.ts`, keyed on `slug`. That is deliberate — adding photos of
 * a location should not need a commit, a build or a deploy, the same way adding
 * a portfolio session does not.
 *
 * A location with no folder published yet renders as a text card. That is a
 * supported state, not a broken one: several of these will never have a set of
 * their own, and the guide reads correctly without them.
 *
 * `slug` is the contract with the dashboard. Rename one and its photographs
 * stop appearing.
 */

export type Location = {
  /** Matches the album slug in the gallery dashboard. */
  slug: string
  name: string
  /** Town or neighborhood, as a client would think of it. */
  area: string
  address?: string
  /** One line, for the card. */
  blurb: string
  /** Why it photographs well, for the modal. */
  detail: string
  /** When it looks its best. */
  bestFor: string
  /** Fees, permits, parking — anything that would ambush somebody. */
  note?: string
}

export const LOCATION_SUGGESTIONS: Location[] = [
  {
    slug: 'grays-lake',
    name: 'Gray’s Lake',
    area: 'Des Moines',
    address: '2101 Fleur Dr, Des Moines, IA 50321',
    blurb: 'Water, the skyline, and a bridge that lights up after sunset.',
    detail:
      'The Kruidenier Trail runs right out over the water, so you get the skyline behind you and open sky above — which means soft, even light long after the tree-lined spots have gone flat. Wide open, so it is at its best when the sun is low.',
    bestFor: 'The last hour of light, and the ten minutes after it',
  },
  {
    slug: 'hotel-fort-des-moines',
    name: 'Hotel Fort Des Moines',
    area: 'Downtown Des Moines',
    address: '1000 Walnut St, Des Moines, IA 50309',
    blurb: 'Marble, brass and a staircase worth a dress.',
    detail:
      'A restored 1919 hotel, and the most formal interior on this list. Good for the dressed-up look, and genuinely useful on a day the weather turns, because none of it depends on the sky.',
    bestFor: 'Any weather, any time of day',
    note: 'A working hotel, so we keep to the public areas and stay out of the way. Worth asking ahead if we plan to be there a while.',
  },
  {
    slug: 'water-works-park',
    name: 'Water Works Park',
    area: 'Des Moines',
    address: '2201 George Flagg Pkwy, Des Moines, IA 50321',
    blurb: 'Fifteen hundred acres of it. Tall grass, big trees, long light.',
    detail:
      'The biggest green space in the metro and the one I go back to most. Prairie, woodland and river bank all within a short drive of each other, so a single stop can look like three. The wildflowers through June and July are the reason to book early summer.',
    bestFor: 'Golden hour, late spring through fall',
  },
  {
    slug: 'jester-park',
    name: 'Jester Park',
    area: 'Granger',
    address: '11407 NW Jester Park Dr, Granger, IA 50109',
    blurb: 'Oak savanna, the lake, and the bison if we get lucky.',
    detail:
      'Further out than the rest, and quieter for it — old oaks, open meadow and the Saylorville shoreline. Worth the drive when you want somewhere that looks nothing like a city.',
    bestFor: 'Late afternoon into golden hour',
  },
  {
    slug: 'deer-ridge-park',
    name: 'Deer Ridge Park',
    area: 'Urbandale',
    address: '13900 Buena Vista Dr, Urbandale, IA 50323',
    blurb: 'Old wood fences, a winding path under tall trees, and swings.',
    detail:
      'The most varied stop close to home, and everything in it is within a short walk of everything else — weathered wood fences, a long winding path with the trees leaning right over it, a pond, and old brick walls. There are swings too, which are there purely for the fun of it and reliably produce better frames than anything posed.',
    bestFor: 'Late afternoon, once the light is coming through the trees',
  },
  {
    slug: 'court-avenue',
    name: 'Court Avenue',
    area: 'Downtown Des Moines',
    address: 'Court Ave, Des Moines, IA 50309',
    blurb: 'Brick streets, iron and old storefronts.',
    detail:
      'The historic district — brick underfoot, tall windows and a lot of texture in a small area, so we can cover several completely different backdrops without moving the car. Shot in the shade between the buildings, it works in the middle of the day when open spots do not.',
    bestFor: 'Midday, in the shade. Quietest on a weekday',
  },
  {
    slug: 'des-moines-art-center',
    name: 'Des Moines Art Center',
    area: 'Greenwood, Des Moines',
    address: '4700 Grand Ave, Des Moines, IA 50312',
    blurb: 'Architecture as a backdrop — clean lines, hard shadows, reflecting pool.',
    detail:
      'Three buildings by three architects, which gives you concrete, glass and stone in one stop, plus the reflecting pool. The most graphic, least soft location here — good if you want the photographs to look designed rather than dreamy.',
    bestFor: 'Bright days, when the shadows are doing something',
    note: 'Check current photography rules before we go — grounds and interiors are treated differently, and that can change.',
  },
  {
    slug: 'easter-lake',
    name: 'Easter Lake & Owen’s Covered Bridge',
    area: 'Des Moines',
    address: '2830 Easter Lake Dr, Des Moines, IA 50320',
    blurb: 'A covered bridge, a shoreline, and far fewer people than you expect.',
    detail:
      'The bridge is the reason to come — weathered timber, a frame you can stand inside, and warm light through the gaps late in the day. The lake path adds water and open sky a minute away.',
    bestFor: 'Late afternoon, when light comes through the timbers',
  },
  {
    slug: 'high-trestle-trail',
    name: 'High Trestle Trail Bridge',
    area: 'Madrid',
    address: '2335 QF Ln, Madrid, IA 50156',
    blurb: 'Half a mile of steel frames, thirteen storeys over the river valley.',
    detail:
      'The most recognisable structure in central Iowa and unlike anything else on this list. The steel frames make a tunnel that funnels the light, and after dusk the blue lighting comes on and the whole thing becomes a different session entirely.',
    bestFor: 'Sunset, then stay for the blue lights',
    note: 'A half-mile walk from the trailhead to the bridge itself, so shoes matter here more than anywhere else. Add a travel quote — it is outside the metro.',
  },
  {
    slug: 'valley-junction',
    name: 'Valley Junction',
    area: 'West Des Moines',
    address: 'Historic Valley Junction, 5th St, West Des Moines, IA 50265',
    blurb: 'Fifth Street — murals, painted brick and shopfronts.',
    detail:
      'Five blocks of color: murals, awnings, painted brick and a string of doorways that each read as a different backdrop. The most varied city stop per minute of walking, and there is somewhere to sit down every thirty feet.',
    bestFor: 'Midday shade, or the hour before sunset',
  },
]

export const LOCATIONS_BY_SLUG = Object.fromEntries(
  LOCATION_SUGGESTIONS.map((l) => [l.slug, l]),
) as Record<string, Location>
