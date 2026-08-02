/**
 * Editorial metadata for each real shoot. One entry per source folder in
 * images/; `source` must match the `shoot` slug in photos.generated.ts.
 *
 * WHAT IS FILLED IN, AND WHAT IS NOT
 *
 * `title`, `date`, `type` and `cover` are derived from the folder names and
 * the photographs themselves. `story` describes what is visibly in the frames.
 *
 * `location`, `conditions` and `requests` are left blank wherever I could not
 * establish them — I am not going to invent a client's brief or the weather on
 * the day. Blank fields simply do not render, so the pages read fine as they
 * are; fill them in and they appear.
 *
 * Client names come from the folder names. Swap them for initials if any of
 * these people would rather not be named.
 */

import { BY_SHOOT } from './photos.generated'

export type Shoot = {
  /** URL slug — /portfolio/<slug>. */
  slug: string
  /** Must match `shoot` in the generated manifest. */
  source: string
  title: string
  /** Portfolio filter id this belongs to. */
  category: string
  /** Human-readable, e.g. "June 2022". */
  date: string
  /** Sortable key, newest first. */
  sort: string
  location?: string
  conditions?: string
  requests?: string
  /** A short description of the photographs. */
  story: string
  /** Photo id used as the card and masthead image. */
  cover: string
}

export const SHOOTS: Shoot[] = [
  {
    slug: 'elise-graduation',
    source: '2026-05-09-elise-grad-pictures',
    title: 'Elise · Graduation',
    category: 'graduation',
    date: 'May 2026',
    sort: '2026-05-09',
    location: 'University of Northern Iowa, Cedar Falls',
    story:
      'Cap and gown across campus — the entrance sign, the campanile, the steps of Lang Hall and a garden trellis for the frames without the gown. Shot the weekend of the ceremony, and finished in black and white as well as colour.',
    cover: 'graduation-em-grad-233',
  },
  {
    slug: 'europe',
    source: '2025-06-10-europe',
    title: 'Italy & Austria',
    category: 'travel',
    date: 'June 2025',
    sort: '2025-06-10',
    location: 'Lake Como, Italy · Salzburg, Austria',
    story:
      'A fortnight of travel photographed the same way I photograph a session: lake light, narrow streets, a mountain ridge and the people who happened to be standing in front of them.',
    cover: 'travel-italy-2025-339',
  },
  {
    slug: 'maddie-and-will',
    source: '2024-09-28-maddie-will',
    title: 'Maddie & Will',
    category: 'couples',
    date: 'September 2024',
    sort: '2024-09-28',
    story:
      'Couple portraits taken beside the water in the last of the evening light, in colour and in black and white.',
    cover: 'couples-am-27',
  },
  {
    slug: 'the-grad-party',
    source: '2024-05-03-graduation-family-portraits',
    title: 'The Grad Party',
    category: 'family',
    date: 'May 2024',
    sort: '2024-05-18',
    story:
      'A family of five in the back garden on graduation day: the whole group together, each of the siblings on their own, and a good deal of not standing still.',
    cover: 'family-2024-05-18-grad-party-196',
  },
  {
    slug: 'the-trail',
    source: '2024-05-03-forest-portrait',
    title: 'An Afternoon on the Trail',
    category: 'seniors',
    date: 'July 2024',
    sort: '2024-07-05',
    story:
      'Portraits along a shaded park path — dappled light through the canopy, and a stretch of trail long enough to walk down.',
    cover: 'seniors-2024-07-05-park-practice-51',
  },
  {
    slug: 'two-very-good-dogs',
    source: '06-27-2024-puppies',
    title: 'Two Very Good Dogs',
    category: 'pets',
    date: 'June 2024',
    sort: '2024-06-27',
    story:
      'A golden retriever and a bernese mountain dog, photographed in a field of coreopsis in full yellow bloom. Very little direction was taken.',
    cover: 'pets-06-27-2024-puppies-128',
  },
  {
    slug: 'elise-senior-portraits',
    source: '2023-09-17-elise-portraits',
    title: 'Elise · Senior Portraits',
    category: 'seniors',
    date: 'September 2023',
    sort: '2023-09-17',
    story:
      'Early autumn, a blue floral dress, and three settings in one afternoon: the water’s edge, a willow, and a tree-lined path running into the light.',
    cover: 'seniors-elise-portrait-121',
  },
  {
    slug: 'mallorie-and-connor',
    source: '2023-08-04-mc-engagement',
    title: 'Mallorie & Connor',
    category: 'engagement',
    date: 'August 2023',
    sort: '2023-08-04',
    story:
      'An engagement session at a farmstead — the barn, the gravel road and the open field behind it, shot into low evening sun.',
    cover: 'engagement-mallorie-connor-31',
  },
  {
    slug: 'sara-and-grant',
    source: '2022-06-22-sg-engagement',
    title: 'Sara & Grant',
    category: 'engagement',
    date: 'June 2022',
    sort: '2022-06-22',
    story:
      'A summer engagement session with their golden retriever along for all of it: a blossoming tree, a pond bank, tall grass, and a set of black-and-white frames at the end.',
    cover: 'engagement-june2022-54',
  },
  {
    slug: 'grant-and-sara-rehearsal',
    source: '2022-06-10-grant-sara-wedding-rehearsal',
    title: 'Grant & Sara · Rehearsal',
    category: 'wedding',
    date: 'June 2022',
    sort: '2022-06-10',
    story:
      'The rehearsal dinner the night before — the toasts, the bridal party, and the room slowly filling up.',
    cover: 'wedding-img-5947-5',
  },
]

/** Newest first. */
export const SHOOTS_BY_DATE = [...SHOOTS].sort((a, b) => b.sort.localeCompare(a.sort))

export const SHOOT_BY_SLUG = Object.fromEntries(SHOOTS.map((s) => [s.slug, s]))

/** Photographs belonging to a shoot, in manifest order. */
export function photosFor(shoot: Shoot) {
  return BY_SHOOT[shoot.source] ?? []
}
