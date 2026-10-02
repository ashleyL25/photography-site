/**
 * Client prep guides — one per session type.
 *
 * These are the pages Ashley sends a client the moment they book: everything
 * they need to do before the session, written in her voice rather than as a
 * checklist from a stock template. Each guide renders at /guides/<id> and is
 * built to be read on a phone, printed, or forwarded to a parent.
 *
 * The senior guide is the long one, because the senior session is the one with
 * a fixed routine (weekday, midday start, three outfits, three locations, a
 * lunch stop that is part of the shoot). The other five are shorter because
 * those sessions genuinely are simpler.
 *
 * Blocks are a small tagged union so `GuidePage` can render any chapter without
 * knowing what is in it. Add a block kind here and a case in the renderer.
 */

import { RESCHEDULE_NOTE, RETOUCHING, weatherColumns, type EditingStyle } from './policy'
import { HAIR_AND_MAKEUP, LOCATIONS, LUNCH_STOPS, type Vendor } from './vendors'

export type Block =
  /** Body copy. One string per paragraph. */
  | { kind: 'prose'; text: string[] }
  /** A run of times through the day. */
  | { kind: 'timeline'; items: { time: string; title: string; detail: string }[] }
  /** Ticks that persist in localStorage so a client can work through them. */
  | { kind: 'checklist'; items: string[] }
  /** Recommendation cards — hair and makeup, or lunch stops. */
  | { kind: 'vendors'; items: Vendor[] }
  /** Two to four short titled paragraphs, side by side. */
  | { kind: 'columns'; items: { title: string; body: string }[] }
  /** Grouped location suggestions. */
  | { kind: 'locations'; items: typeof LOCATIONS }
  /** Side-by-side yes / no lists. */
  | { kind: 'compare'; yes: { title: string; items: string[] }; no: { title: string; items: string[] } }
  /** Numbered countdown, e.g. two weeks out → the morning of. */
  | { kind: 'steps'; items: { label: string; detail: string }[] }
  /** A single pulled-out aside. */
  | { kind: 'note'; text: string }

export type Chapter = {
  id: string
  title: string
  /** Optional one-line standfirst under the chapter title. */
  lead?: string
  blocks: Block[]
}

export type Guide = {
  /** Matches a Session id in site.ts, and the URL: /guides/<id>. */
  id: string
  title: string
  /** Sits above the title. */
  eyebrow: string
  /** One sentence in the masthead. */
  subtitle: string
  photoId: string
  /** Ashley's opening note. Renders as a letter, before the chapters. */
  intro: string[]
  signOff: string
  /** At-a-glance table under the letter. */
  meta: { label: string; value: string }[]
  chapters: Chapter[]
}

/* ------------------------------------------------------------------ *
 * Shared chapters
 *
 * Several of these are near-identical across session types and were the
 * obvious place for the guides to drift apart over time, so they are built
 * once and parameterised.
 * ------------------------------------------------------------------ */

function hairAndMakeup(
  lead: string,
  timing: string[],
  opts: { vendors?: boolean } = {},
): Chapter {
  const blocks: Block[] = [
    { kind: 'prose', text: timing },
    {
      kind: 'compare',
      yes: {
        title: 'Does photograph well',
        items: [
          'Matte foundation, and a little more of it than you would wear on a normal day',
          'Eyes and brows done slightly stronger than feels natural — a camera flattens everything',
          'A hairstyle you have worn before and know how to fix',
          'Setting spray, because we will be outside for hours',
          'Lips you can reapply without a mirror',
        ],
      },
      no: {
        title: 'Does not',
        items: [
          'Shimmer or anything with glitter in it — it throws light straight back at the lens',
          'A brand-new haircut or color the week of the session',
          'Heavy contour, which reads as a stripe rather than a shadow',
          'Facials, peels and masks inside seven days',
          'A spray tan you have not had before, ever',
        ],
      },
    },
  ]

  if (opts.vendors) {
    blocks.push(
      {
        kind: 'prose',
        text: [
          'A few places in the metro that do this properly. I am not on commission from any of them and you are under no obligation to use one — plenty of people do their own and it looks great. Book directly, and tell them it is for photographs, because that changes what they do.',
        ],
      },
      { kind: 'vendors', items: HAIR_AND_MAKEUP },
      {
        kind: 'note',
        text: 'Whoever you book, get the appointment to finish at least an hour before we start. Salons run late, traffic happens, and an hour of slack costs you nothing but removes the only genuinely stressful part of the day.',
      },
    )
  }

  return {
    id: 'hair-and-makeup',
    title: 'Hair and makeup',
    lead,
    blocks,
  }
}

/**
 * `style` decides which editing explanation the chapter carries — see
 * EDITING_STYLE in policy.ts. It is spelled out in every guide because "how many
 * photographs, and how finished are they" is the single thing clients compare
 * between photographers, and getting it wrong in their heads is how a delighted
 * client turns into a disappointed one.
 */
function gallery(style: EditingStyle, extra?: string): Chapter {
  return {
    id: 'your-gallery',
    title: 'Your gallery',
    lead: 'Where the photographs live, how they are finished, and for how long.',
    blocks: [
      {
        kind: 'prose',
        text: [
          'Your finished album arrives in a private online photo gallery, usually about two weeks after we shoot. You can download the whole thing at full resolution, share the link with anyone you like, and order prints straight through it if that is easier than finding your own printer.',
          'You have full download and print rights to every image — no watermarks, no license to read, no asking me first. Some frames come in black and white as well as color, because as I edit I pick the ones that are better without it. That is not an extra and it is not a decision you have to make.',
          'The gallery stays up for a full year. I email you twice before it closes — ninety days out and again at thirty — so it never vanishes on you unannounced. Download everything once and it is yours regardless.',
          ...(extra ? [extra] : []),
        ],
      },
      {
        kind: 'columns',
        items: [
          { title: RETOUCHING[style].label, body: RETOUCHING[style].body },
          {
            title: 'Why the number of photographs varies',
            body:
              style === 'retouched'
                ? 'A fully retouched frame takes several times as long to finish as a naturally edited one, so a session like yours delivers fewer photographs than an engagement session of the same length — and every single one of them has had far more work done to it. Your package states exactly how many you get, and that is the number I work to.'
                : 'Because nothing here is being retouched frame by frame, a session like yours delivers considerably more photographs than a senior or family session of the same length — your package states the floor, and I usually go over it. Different job, not a lesser one.',
          },
        ],
      },
      {
        kind: 'note',
        text: 'Download the full-resolution files, not the ones you saved off Instagram. You will want them at a decent size in ten years and the compressed version will not hold up.',
      },
    ],
  }
}

function weather(session: string): Chapter {
  return {
    id: 'weather',
    title: 'Weather, and the rest of the small print',
    blocks: [
      { kind: 'columns', items: weatherColumns(session) },
      { kind: 'prose', text: [RESCHEDULE_NOTE] },
    ],
  }
}

const OUTFIT_RULES: Block = {
  kind: 'compare',
  yes: {
    title: 'What works',
    items: [
      'Solid colors, and deeper ones — emerald, rust, navy, cream, oxblood, black',
      'Texture instead of pattern: knit, linen, denim, corduroy, leather',
      'Things that move. A skirt, a long coat or wide sleeves give me something to work with',
      'Clothes that fit properly now, not the size you were last year',
      'Shoes you can walk a quarter of a mile in, because you will',
    ],
  },
  no: {
    title: 'What fights the camera',
    items: [
      'Small busy patterns — thin stripes and tight checks buzz and go strange',
      'Large logos and slogans, which date the photograph instantly',
      'Neon and highlighter shades, which throw color up onto your face',
      'Anything you are still tugging at after two minutes',
      'Brand-new shoes. Please break them in first',
    ],
  },
}

/* ------------------------------------------------------------------ *
 * The guides
 * ------------------------------------------------------------------ */

export const GUIDES: Guide[] = [
  /* -------------------------------- Seniors ------------------------------- */
  {
    id: 'seniors',
    eyebrow: 'Your prep guide',
    title: 'Senior Pictures',
    subtitle:
      'Everything to expect, in the order it happens. It is my routine rather than a rule book, so we adjust wherever you want to.',
    photoId: 'seniors-elise-portrait-121',
    intro: [
      'Right — here is the whole thing written down so you are not holding it in your head. This is my routine for senior pictures, and we can move any part of it around.',
      'On poses: we will try plenty of them, and some of them will feel deeply strange while you are doing them. Ignore that completely. Afterwards we sit down and go through every single photograph together, and you will be surprised which ones you end up liking the most — it is almost never the ones people expect.',
      'Do not worry about taking up my time. I have blocked out the afternoon and I am genuinely excited about this. I will guide you through every pose, so the only job you have is turning up with your outfits and your gear.',
    ],
    signOff: 'Ashley',
    meta: [
      { label: 'When', value: 'A weekday, starting around midday' },
      { label: 'How long', value: 'Around four hours' },
      { label: 'Outfits', value: 'Up to three' },
      { label: 'Locations', value: 'Up to three, plus the lunch stop' },
      { label: 'You get', value: '100 professionally edited photos' },
      { label: 'Afterwards', value: 'A review appointment, then your gallery' },
    ],
    chapters: [
      {
        id: 'the-day',
        title: 'How the day runs',
        lead: 'A weekday, starting around midday. Times shift with the season and with where we end up going.',
        blocks: [
          {
            kind: 'prose',
            text: [
              'We shoot on a weekday on purpose. Parks, downtown and every good doorway in the East Village are all but empty on a Tuesday and packed on a Saturday, and nobody wants strangers in the background of their senior pictures. A weekday also means we can take four hours without anybody feeling rushed.',
              'Starting around midday sounds wrong for photographs and it is not. It lets us shoot the built, shaded locations while the sun is high — brick, alleys, awnings, interiors — then work outward into open green as the light drops, and finish on the last golden hour. The day gets progressively prettier, which is also a nice way to end.',
            ],
          },
          {
            kind: 'timeline',
            items: [
              {
                time: 'Morning',
                title: 'Hair and makeup',
                detail:
                  'Booked to finish at least an hour before we meet. If you are doing it yourself, aim to be done and changed with time to spare rather than exactly on the hour.',
              },
              {
                time: 'Around noon',
                title: 'We meet — outfit one',
                detail:
                  'Usually the built location: brick, doorways, shade. I will have sent you the exact spot and where to park a few days before. The first fifteen minutes are always the stiffest and that is completely normal.',
              },
              {
                time: 'Early afternoon',
                title: 'Lunch — and outfit two',
                detail:
                  'The lunch stop is part of the shoot, not a break from it. We eat, we shoot in and around it, and you change there. See the chapter on picking it.',
              },
              {
                time: 'Mid afternoon',
                title: 'Location two',
                detail:
                  'Somewhere with a different character to the first — green, water, prairie, a field. This is usually where the walking-and-talking frames come from, which tend to be the ones people keep.',
              },
              {
                time: 'Late afternoon',
                title: 'Outfit three, location three',
                detail:
                  'The last change. Save your favorite outfit for this, because this is the best light of the day and you want it on the thing you like most.',
              },
              {
                time: 'Golden hour',
                title: 'The last twenty minutes',
                detail:
                  'The sun goes low and everything turns warm. We slow down, shoot far fewer frames, and get several of the best ones. Then we are done.',
              },
              {
                time: 'That evening',
                title: 'I book your review',
                detail:
                  'Usually a Sunday, a week or two out. That is when you choose which photographs make the album.',
              },
            ],
          },
          {
            kind: 'note',
            text: 'If any of that does not suit — an early start, a single location, no lunch stop, a Saturday because of work — say so. The routine exists because it works for most people, not because it is fixed.',
          },
        ],
      },

      hairAndMakeup(
        'Book it for the morning of, and give yourself an hour of slack.',
        [
          'Have it done the morning of the session if you are having it done professionally. It is one less thing to think about, it lasts far better than something you did the night before, and someone else being in charge of your hair for an hour is a good way to start the day.',
          'Book the appointment to end at least an hour before we meet. Salons run late, and an hour of buffer turns the only stressful part of the day into a non-event.',
          'Two weeks before is the window for anything structural — a cut, color, or a treatment. Not the week of. A haircut you have not lived with yet is the single most common regret in senior pictures, and there is no fixing it in editing.',
          'Nails: get them done one or two days before, not the morning of. Hands end up in more frames than you would guess — in your hair, on a railing, holding a milkshake — and chipped polish is the thing you will notice first.',
        ],
        { vendors: true },
      ),

      {
        id: 'outfits',
        title: 'The three outfits',
        lead: 'Three looks, three different sides of you. Bring a fourth if you cannot decide — we will pick together.',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Three outfits is the number because it is what fits comfortably into the afternoon, and because three is enough for the set to feel varied without turning the day into a changing-room. You do not have to use all three. Plenty of people bring two and are happier for it.',
              'The useful way to choose is not "which of my clothes is nicest" but "which three of these look like different parts of my life". Aim for one dressed-up, one that is entirely and recognizably you, and one that comes with a story attached.',
            ],
          },
          {
            kind: 'columns',
            items: [
              {
                title: 'One — dressed up',
                body: 'The one your grandparents will want framed. A dress, or a proper shirt. This is the frame that ends up in the graduation announcement, so make it the one you would be happy handing to five hundred people.',
              },
              {
                title: 'Two — actually you',
                body: 'Jeans and the sweater you wear constantly. This sounds like the boring one and it is nearly always where the best photographs come from, because it is the only outfit you are not thinking about while wearing.',
              },
              {
                title: 'Three — the story one',
                body: 'The letter jacket, the uniform, the band shirt, the coveralls, the apron from work. Something that will make you say "oh, that year" in a decade. Bring the object that goes with it too.',
              },
            ],
          },
          OUTFIT_RULES,
          {
            kind: 'prose',
            text: [
              'A practical note on layers: a jacket, a cardigan or a flannel over the top of a look effectively gives you a fourth outfit for free, because on and off read as two different photographs. Same with letting your hair down halfway through.',
              'Bring everything on hangers if you can, in the order you plan to wear it. Changing happens at the lunch stop and in the car, so folded piles in a backpack become an ironing problem at exactly the wrong moment.',
            ],
          },
          {
            kind: 'note',
            text: 'Send me photos of the options a week before and I will tell you honestly which will photograph best at the locations we have picked. This is the single most useful thing you can do in advance, and almost nobody does it.',
          },
        ],
      },

      {
        id: 'locations',
        title: 'Where we go',
        lead: 'Up to three, chosen together. One should be somewhere that means something to you.',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Three locations across one afternoon works because the metro is small and I plan them as a loop rather than three separate trips — usually a built one first, the lunch stop second, and something green and open for the golden hour at the end.',
              'The best sessions have at least one location that is nobody else\'s. A grandparents\' farm, your own backyard, the pitch you played on for four years, the car you fixed yourself, the shop where you have worked since you were fifteen. Those are the frames that stop being "nice photographs" and start being about you specifically. If you have one, we build the day around it.',
              'If you cannot picture how a spot will look in photographs, tell me — I can send example frames from that place so you can see what it actually offers.',
            ],
          },
          {
            kind: 'note',
            text: 'A few places charge admission or need a permit — the Botanical Garden and Salisbury House among them. Tell me if one of those is on your list and I will check the current rules and cost before we commit to it. Anywhere in the Des Moines metro is included; a campus or other spot outside that drive has a travel fee, and I will quote it before you decide.',
          },
        ],
      },

      {
        id: 'lunch',
        title: 'Lunch, which is part of the shoot',
        lead: 'Pick somewhere you actually like. We eat there and we shoot there.',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Halfway through the afternoon we stop and eat, and that stop is a location rather than a break. We shoot outside it, we shoot inside it, and you change there — so it is doing three jobs at once and it is often the most fun twenty minutes of the day.',
              'It also solves the problem of everyone looking slightly stiff. It is very hard to be self-conscious while eating a milkshake, and the frames from lunch are almost always the ones people are still using as profile pictures two years later.',
              'So choose somewhere you genuinely like rather than somewhere that looks impressive. What I am looking for is an exterior worth standing in front of, window light indoors, somewhere to change, and food you will actually eat while being photographed. Here are places that tick all four — but your own suggestion beats every one of them.',
            ],
          },
          { kind: 'vendors', items: LUNCH_STOPS },
          {
            kind: 'note',
            text: 'Tell me your pick a week out so I can build the driving loop around it. And bring a friend or a parent along for this part if you like — they are useful for holding things, and they will tell you when your collar is wrong.',
          },
        ],
      },

      {
        id: 'what-to-bring',
        title: 'What to bring',
        lead: 'Tick these off the night before. It takes ten minutes and saves the one thing you would otherwise forget.',
        blocks: [
          {
            kind: 'checklist',
            items: [
              'All three outfits, on hangers, in the order you plan to wear them',
              'Shoes for each — including the pair you can actually walk in',
              'Every prop: letter jacket, instrument, ball, helmet, trophy, book, keys to the truck',
              'The dog, if the dog is coming, plus lead, treats and water',
              'A friend or a parent, if you want one there',
              'Water. More than you think — we are out for four hours',
              'Lip balm, powder or blotting papers, and whatever you use to fix your hair',
              'Hair ties on your wrist, not in the frame',
              'A jacket or cardigan to layer over an outfit',
              'A brush and a small mirror',
              'Bug spray between June and September if we are going anywhere green',
              'A phone charger, or you will run flat before golden hour',
              'The balance, if you have not already sorted it',
            ],
          },
          {
            kind: 'prose',
            text: [
              'Leave at home: anything you are unsure about, and anything requiring an iron. If you are torn on an outfit, bring it — deciding on the spot is easy. Deciding you needed it while standing in a field is not.',
            ],
          },
        ],
      },

      {
        id: 'countdown',
        title: 'The two weeks before',
        lead: 'In order, so nothing lands on the wrong day.',
        blocks: [
          {
            kind: 'steps',
            items: [
              {
                label: 'Two weeks out',
                detail:
                  'Haircut, color, or any facial or treatment. This is the last safe window for all of them. Book hair and makeup for the morning of, if you are having it done.',
              },
              {
                label: 'One week out',
                detail:
                  'Send me photos of your outfit options and tell me your lunch pick. I confirm the three locations, the meeting point and where to park. Try each outfit on properly — with the shoes — and walk around in it.',
              },
              {
                label: 'Three days out',
                detail:
                  'Nothing new on your skin. No new products, no experiments, no first-time spray tan. Drink more water than usual, starting now rather than on the morning.',
              },
              {
                label: 'Two days out',
                detail:
                  'Nails, if you are having them done. Steam or press everything and hang it up. Charge your phone and put the props by the door.',
              },
              {
                label: 'The night before',
                detail:
                  'Work through the bring list above. I message you with the forecast and a straight answer about whether we are on. Then go to bed at a reasonable hour, because it shows in your eyes and there is a limit to what I can do about that.',
              },
              {
                label: 'The morning of',
                detail:
                  'Eat something. Hair and makeup, finishing an hour early. Load the car. Arrive five minutes late rather than flustered — I promise it does not matter.',
              },
            ],
          },
        ],
      },

      {
        id: 'the-review',
        title: 'The review appointment',
        lead: 'A week or two later, usually a Sunday. This is where you choose your album.',
        blocks: [
          {
            kind: 'prose',
            text: [
              'We sit down together and go through every photograph from the session — properly, all of them, not a shortlist I have made for you. You pick your favorites, and those are the ones that go forward into the final edited album.',
              'What you are looking at during the review is the unedited raw files. They are flat, the color is not there yet, and they look nothing like the finished article — that is normal and it is the point. You are choosing the moment and the expression; the rest is my job afterwards.',
              'Anything you do not like does not make it. It comes out of the album entirely and never appears anywhere. You do not have to justify it and I will not be offended — I have my own opinions about which frames are the good ones and I am wrong about it constantly.',
              'If we are doing a second session in the fall, this is also where we plan it: what worked, what we want to do differently, and the outfits and locations for next time.',
            ],
          },
          {
            kind: 'note',
            text: 'Mom gets veto rights on a couple of photographs you disliked. This is a real policy and it has been used. Consider yourself warned.',
          },
        ],
      },

      gallery(
        'retouched',
        'Any photograph that did not make the album is still on the raw set, so if you change your mind in a month you can add it — thirty a piece, or twenty for four hundred and fifty.',
      ),

      weather('session'),
    ],
  },

  /* ------------------------------ Graduation ------------------------------ */
  {
    id: 'graduation',
    eyebrow: 'Your prep guide',
    title: 'Graduation',
    subtitle:
      'Built around a weekend when everybody wants a piece of you. Short, efficient, and planned in advance so it stays that way.',
    photoId: 'graduation-em-grad-278',
    intro: [
      'Ceremony weekends are chaos, so this session is designed to take up as little of yours as possible. An hour or two, one or two spots, and I will have every detail sorted before you arrive.',
      'The whole thing hinges on one decision: which parts of campus actually meant something to you. Not the ones on the prospectus — the entrance sign you drove past every day, the building you all but lived in, the walk you have done a thousand times.',
      'I will guide every pose. Turn up in the gown with something good on underneath and we are set.',
    ],
    signOff: 'Ashley',
    meta: [
      { label: 'When', value: 'Ceremony weekend, or the days around it' },
      { label: 'How long', value: 'One to three hours' },
      { label: 'Outfits', value: 'Gown on, gown off' },
      { label: 'Locations', value: 'One to three on campus' },
      { label: 'You get', value: '40 to 120 fully retouched photos' },
      { label: 'Book by', value: 'Six weeks out — these weekends fill first' },
    ],
    chapters: [
      {
        id: 'the-plan',
        title: 'Planning around the ceremony',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Tell me the ceremony time and I will work backwards. The morning before is usually best — campus is quiet, the light is good, and you are not yet three events deep into the day with a family lunch to get to.',
              'The day of works too, and often has to. If we shoot before the ceremony you are fresh and the gown is uncreased; if we shoot after, you have the whole thing behind you and it shows in your face. Both are fine. Just tell me which and I will build around it.',
            ],
          },
          {
            kind: 'timeline',
            items: [
              {
                time: 'Six weeks out',
                title: 'Lock the date',
                detail:
                  'Ceremony weekends are the busiest of the year and they go first. As soon as you know the date, tell me.',
              },
              {
                time: 'Two weeks out',
                title: 'Haircut, and pick the spots',
                detail:
                  'Last safe window for a cut or color. Send me the two or three places on campus that matter and I will plan the walking order.',
              },
              {
                time: 'A week out',
                title: 'Regalia check',
                detail:
                  'Get the gown out of the bag and hang it up. Cords, stoles and honors sashes — find them now, not on the morning.',
              },
              {
                time: 'The day',
                title: 'Meet, shoot, done',
                detail:
                  'One to three hours depending on your package. Gown frames first while it is crisp, then everything without it.',
              },
            ],
          },
        ],
      },

      {
        id: 'the-gown',
        title: 'The gown, and what goes under it',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Take the gown out of its bag as soon as you get it and hang it somewhere it can drop. They arrive folded into a square and the creases photograph like creases. A steamer for ten minutes, or a hot shower with it hanging in the bathroom, takes care of it completely. Do not iron it directly — the fabric will not survive it.',
              'We shoot the gown frames first, while it still looks pressed, then take it off and shoot everything else. That second half matters more than people expect: in five years the gown photographs are the formal record, and the ones without it are the ones you actually look at.',
            ],
          },
          {
            kind: 'checklist',
            items: [
              'Gown, hung and steamed at least a day before',
              'Cap, and the tassel on the correct side for your school',
              'Every cord, stole, sash and honors pin you have earned',
              'Bobby pins for the cap — it will not stay on by itself in any wind',
              'A proper outfit under the gown, not something you would not be seen in',
              'A second outfit for the frames without the gown',
              'Your diploma cover, if the school hands them out beforehand',
              'Shoes you can cross a campus in',
              'Anything from your department: lab coat, instrument, kit, hard hat, the ridiculous hat',
            ],
          },
          {
            kind: 'note',
            text: 'Wear something under the gown that works on its own. Half these photographs will have the gown open, and a plain tee under an open gown is the one thing people regret.',
          },
        ],
      },

      {
        id: 'outfits',
        title: 'Underneath, and afterwards',
        blocks: [
          {
            kind: 'prose',
            text: [
              'You need two looks: something that reads well under and behind an open gown, and something entirely your own for the second half. Solid colors both times — the gown is already a large flat block of one color and a pattern underneath fights it.',
              'Check what color your gown actually is before you choose. Deep green regalia and a red dress is a decision, not an accident, and you should at least make it on purpose.',
            ],
          },
          OUTFIT_RULES,
        ],
      },

      hairAndMakeup(
        'You do not need it done professionally — most people do not.',
        [
          'Most graduates do their own hair and makeup, and that looks completely fine. The only real complication is the cap: it flattens whatever is on top of your head and leaves a line, so plan a style that still looks deliberate once it comes off, and bring bobby pins — we will be taking it on and off a lot.',
          'If you are getting a cut or color, two weeks out. Not the week of.',
        ],
      ),

      gallery('retouched'),
      weather('session'),
    ],
  },

  /* ----------------------------- Engagements ----------------------------- */
  {
    id: 'engagements',
    eyebrow: 'Your prep guide',
    title: 'Engagements',
    subtitle:
      'One evening, the last good light, and photographs of the two of you from before the planning took over.',
    photoId: 'engagement-mallorie-connor-31',
    intro: [
      'Congratulations, genuinely. Here is everything for the session so it is not one more thing on the list you are already carrying.',
      'The point of this is not the ring. It is having proper photographs of the two of you from this specific stretch of time — before the venue, the seating chart and everyone\'s opinions took over. So the plan is deliberately simple: one good place, the last hour of light, and far more conversation than posing.',
      'You will not have to wonder what to do with your hands. I direct enough that nothing is awkward and then get out of the way, because the frames people keep are almost always the ones taken between the directions.',
    ],
    signOff: 'Ashley',
    meta: [
      { label: 'When', value: 'Timed to sunset — usually two hours before' },
      { label: 'How long', value: 'Ninety minutes to two and a half hours' },
      { label: 'Outfits', value: 'One or two each' },
      { label: 'Locations', value: 'One or two' },
      // Engagement albums are large because they are naturally edited rather
      // than retouched frame by frame. "120+" is a floor, not a promise of a
      // number — how many earn a place is my call once I have seen the set.
      { label: 'You get', value: '120+ naturally edited photos' },
      { label: 'Best months', value: 'May, June, late September, October' },
    ],
    chapters: [
      {
        id: 'the-evening',
        title: 'How the evening runs',
        lead: 'We start when the light starts being worth using, not at a round number on the clock.',
        blocks: [
          {
            kind: 'prose',
            text: [
              'I will give you a start time roughly two hours before sunset, which means it moves through the year — 6:30 in October, 7:30 in June. Set an alarm for it, because the whole plan is built on finishing exactly as the sun goes.',
              'The first ten minutes are always the stiffest, for everybody, including couples who have been together a decade. That is expected and built into the timing. By minute fifteen you will have forgotten I am there, and that is when the session actually starts.',
            ],
          },
          {
            kind: 'timeline',
            items: [
              {
                time: 'Two hours before sunset',
                title: 'We meet',
                detail:
                  'Warm-up frames while the light is still bright. Walking, talking, and very little instruction.',
              },
              {
                time: 'The middle hour',
                title: 'The real work',
                detail:
                  'Both of you, each of you alone, the ring without making it about the ring, and whatever you two do that nobody else does.',
              },
              {
                time: 'Last thirty minutes',
                title: 'Golden hour',
                detail:
                  'Everything turns warm and low. We slow right down, shoot far less, and get most of the ones you will print.',
              },
              {
                time: 'The last five minutes',
                title: 'After the sun goes',
                detail:
                  'Do not pack up yet. The ten minutes after sunset are quietly the best light of the day and almost nobody stays for it.',
              },
            ],
          },
        ],
      },

      {
        id: 'outfits',
        title: 'What the two of you wear',
        lead: 'Coordinate. Do not match.',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Pick a palette together and then dress differently within it — two or three colors that sit near each other, in different weights. Identical white shirts and jeans is the classic error; you end up looking like a stock photograph of a couple rather than like yourselves.',
              'One of you should be the plainer one. If you are both in something with a lot going on, the eye has nowhere to rest and the photograph is busy. Usually one in a solid, one with texture or a subtle pattern works best.',
              'A note on height and hemlines, because it comes up: if one of you is in something long and flowing and the other is in shorts, the photographs will look like the two of you turned up to different events. Match the formality, not the garment.',
            ],
          },
          OUTFIT_RULES,
          {
            kind: 'checklist',
            items: [
              'Both outfits agreed between you, out loud, more than a day in advance',
              'The ring cleaned — it photographs the difference, every time',
              'Shoes you can both walk on grass in',
              'A jacket or layer each, which doubles the number of looks for free',
              'Water, and something to eat beforehand',
              'Lip balm and whatever you use to fix your hair in wind',
              'The dog, if the dog is coming',
              'Something that is yours: a blanket, a bottle of something, the guitar, the truck',
            ],
          },
          {
            kind: 'note',
            text: 'Send me photos of both outfits a week out. I will tell you honestly if they clash with each other or with the location, and it is a five-minute fix in advance rather than a permanent one in the pictures.',
          },
        ],
      },

      hairAndMakeup(
        'Optional — and a useful dress rehearsal if you want one.',
        [
          'You do not need professional hair and makeup for this. Plenty of people do their own and look wonderful. If you are having a wedding makeup trial anyway, book it for this session — you get to see how it photographs once before the day, which is genuinely useful.',
          'Keep the hair more casual: curls, or whatever you do for a good date night. These pictures are meant to feel like the two of you at ease — fun, relaxed, yourselves. They will show up on your save-the-dates and RSVP website, and for some of your extended family this may be the first proper look at you as a couple.',
        ],
      ),

      {
        id: 'locations',
        title: 'Where we go',
        blocks: [
          {
            kind: 'prose',
            text: [
              'One location is typically what we stick to. The exception is if you have two places with genuinely different characters and the time to do both — then we start in town and finish somewhere open, so the golden hour lands on the second one.',
              'The best answer is somewhere with a reason. Where you met, the bar you go to every Friday, the trail you walk, the lake you grew up on, your own kitchen. A pretty park is a pretty park; your park is a photograph about you.',
              'If you met in college, a campus session is a great choice — you get the photographs and a walk down memory lane in the same hour.',
              'If you cannot picture how a spot will look in photographs, tell me — I can send example frames from that place so you can see what it actually offers.',
            ],
          },
          {
            kind: 'note',
            text: 'Anywhere in the Des Moines metro is included. A campus or other spot outside that drive has a travel fee, and I will quote it before you decide.',
          },
        ],
      },

      gallery(
        'natural',
        'If you want a set for save-the-dates, tell me at the review stage and I will make sure there are frames with room for text in them — horizontal, with space to one side.',
      ),
      weather('session'),
    ],
  },

  /* -------------------------------- Couples ------------------------------- */
  {
    id: 'couples',
    eyebrow: 'Your prep guide',
    title: 'Couples',
    subtitle:
      'An anniversary, a milestone, or no reason at all. One place, the good light, and nothing to announce.',
    photoId: 'couples-am-27',
    intro: [
      'You do not need an occasion for this and most people who book it do not have one. The most common reason is simply that the last decent photograph of the two of you is from somebody else\'s wedding four years ago.',
      'It runs the same way as an engagement session: one good location, timed for the last hour of light, and considerably more conversation than posing. No announcement, no ring, nobody watching.',
      'I direct enough that neither of you has to wonder what to do, and then I leave you to it. That gap is where the good ones come from.',
    ],
    signOff: 'Ashley',
    meta: [
      { label: 'When', value: 'Timed to sunset' },
      { label: 'How long', value: 'One to two hours' },
      { label: 'Outfits', value: 'One or two each' },
      { label: 'Locations', value: 'One or two' },
      { label: 'You get', value: '80 to 240 naturally edited photos' },
      { label: 'Dogs', value: 'Included, always' },
    ],
    chapters: [
      {
        id: 'the-evening',
        title: 'How it runs',
        blocks: [
          {
            kind: 'prose',
            text: [
              'I will give you a start time about ninety minutes before sunset. We spend the first stretch walking and talking while I shoot loosely, and the last half hour barely moving because the light is doing all the work by then.',
              'You will get individual portraits as well as the two of you. People forget to ask for these and then find they are the ones they use for everything — work profiles, family galleries, all of it.',
              'If you have been together a while and feel self-conscious about it, that is the norm rather than the exception, and it wears off inside fifteen minutes. Nobody is being asked to gaze into anything.',
            ],
          },
        ],
      },

      {
        id: 'outfits',
        title: 'What to wear',
        lead: 'Coordinate, do not match, and match the formality to each other.',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Agree a palette — two or three colors that sit near each other — and then dress differently inside it. One of you plainer, one with texture. Two identical outfits reads as a costume; two unrelated ones reads as an accident.',
              'If you are doing two looks, make the second one properly casual: your own sweaters, at home or somewhere you actually go. Those frames age far better than the dressed-up ones and they are the reason to bother with a second outfit at all.',
            ],
          },
          OUTFIT_RULES,
          {
            kind: 'checklist',
            items: [
              'Both outfits agreed in advance, out loud',
              'A layer each — on and off is two looks for free',
              'Shoes for grass',
              'The dog, plus lead, treats and water',
              'Something that is yours: a blanket, the record, the bottle, the bike',
              'Lip balm, hair ties, and something to fix wind damage',
            ],
          },
        ],
      },

      hairAndMakeup(
        'Optional. Most couples do their own.',
        [
          'Keep it close to what you normally look like, only slightly stronger — a photograph of you on a good day, not somebody else\'s wedding day.',
          'Both of you, not just one of you. A tidy-up on a neckline or a fresh shave shows up in every close frame.',
        ],
      ),

      { id: 'locations', title: 'Where we go', blocks: [{ kind: 'locations', items: LOCATIONS }] },

      gallery('natural'),
      weather('session'),
    ],
  },

  /* -------------------------------- Families ------------------------------ */
  {
    id: 'families',
    eyebrow: 'Your prep guide',
    title: 'Families',
    subtitle:
      'Getting everyone in one place is the hard part. Here is how to make the photographs the easy bit.',
    photoId: 'family-2024-05-18-grad-party-238',
    intro: [
      'You have already done the difficult thing by getting a date everyone agreed to. What follows is the short version of how to make the hour itself painless.',
      'The order is always the same: the whole group first, while everybody is still fresh and cooperative, then the smaller combinations, then each person on their own while the others recover. Nobody has to stand still for an hour.',
      'One thing worth saying to whoever is organizing this: your job on the day is not to manage anybody. Mine is. You are in the photographs too, and it shows when you are also trying to run the session.',
    ],
    signOff: 'Ashley',
    meta: [
      { label: 'When', value: 'Late afternoon, or an hour before sunset' },
      { label: 'How long', value: 'One to three hours' },
      { label: 'Outfits', value: 'One, or two for longer sessions' },
      { label: 'Locations', value: 'One or two' },
      { label: 'You get', value: '40 to 120 fully retouched photos' },
      { label: 'Galleries', value: 'One per household, included' },
    ],
    chapters: [
      {
        id: 'the-hour',
        title: 'How the hour runs',
        blocks: [
          {
            kind: 'timeline',
            items: [
              {
                time: 'First ten minutes',
                title: 'Everyone, together',
                detail:
                  'Straight in, while the youngest are still on side. This is the frame that goes on the wall, so we get it while it is gettable.',
              },
              {
                time: 'Next twenty',
                title: 'Every combination worth having',
                detail:
                  'Couples, siblings, parents with each child, the grandparents with the grandchildren, all the cousins at once.',
              },
              {
                time: 'Then',
                title: 'Individuals',
                detail:
                  'Each person on their own while everybody else sits down. This is also the natural break, and where the toddlers get to run.',
              },
              {
                time: 'Last stretch',
                title: 'The loose ones',
                detail:
                  'Walking, talking, nobody arranged. Somewhere in here is the photograph you will actually like most, and it will not be the arranged one.',
              },
            ],
          },
          {
            kind: 'prose',
            text: [
              'For anyone bringing small children: feed them beforehand, bring a snack that is not going to end up on a white shirt, and let them be four. I have never needed a child to sit still and I am not going to start. The photographs where they are laughing at something off to the side are better than the ones where they are looking at me.',
              'For anyone bringing someone elderly: tell me in advance and I will pick somewhere with parking close by and a bench, and we will do their frames first.',
            ],
          },
        ],
      },

      {
        id: 'what-everyone-wears',
        title: 'Dressing a group',
        lead: 'The single biggest thing you can get right in advance.',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Pick three colors and let everybody choose their own clothes inside them. That is the whole method and it works every time. What you are avoiding is both extremes: everybody in identical white shirts and jeans, which looks like a uniform, and everybody in whatever they grabbed, which looks like nobody discussed it.',
              'Deeper and softer colors beat bright ones for a group — cream, oatmeal, rust, olive, navy, denim, dusty pink, charcoal. Layer in texture rather than pattern: knits, linen, corduroy. If one person is in a pattern, let it be one person.',
              'Lay it all out on a bed the day before and photograph it with your phone. If it looks like a set in that photo, it will look like a set in mine. Send it to me and I will tell you what to swap.',
            ],
          },
          {
            kind: 'compare',
            yes: {
              title: 'Works for a group',
              items: [
                'Three agreed colors, everybody dressing differently within them',
                'One person in the pattern, everybody else in solids',
                'Layers — cardigans, jackets, flannels — for depth between people',
                'The same level of formality across everybody',
                'Shoes that can survive grass, on every single person',
              ],
            },
            no: {
              title: 'Does not',
              items: [
                'Matching white shirts and blue jeans',
                'Neon on anybody — it reflects onto whoever is standing next to them',
                'Large logos, cartoon characters and slogans',
                'One person dressed up and one in a hoodie',
                'Anything nobody has tried on since last summer',
              ],
            },
          },
        ],
      },

      {
        id: 'what-to-bring',
        title: 'What to bring',
        blocks: [
          {
            kind: 'checklist',
            items: [
              'Everybody\'s outfit confirmed and tried on, not assumed',
              'A snack that does not stain, and water for everyone',
              'Wipes, and a spare top for anyone under five',
              'Hair brush and ties',
              'A blanket to sit on, and one for the frames',
              'The dog, plus lead, treats and someone to hold them',
              'Anything that belongs to your family: the quilt, the tractor, the boat, the instruments',
              'A list of the specific groupings you want, so nothing is forgotten in the moment',
            ],
          },
          {
            kind: 'note',
            text: 'That last one matters more than any of the others. Write down the combinations you want — "Mom with each of us", "all the grandchildren", "the four cousins" — and hand it to me at the start. It is the difference between remembering on the day and remembering when the gallery arrives.',
          },
        ],
      },

      hairAndMakeup(
        'Optional for most families.',
        [
          'Most families do their own and it looks completely fine. Keep it recognizable — these photographs are going on a wall for a decade and you want to look like yourselves.',
          'If one person is dreading this, a blow-out can take the edge off. That is about as far as it needs to go.',
        ],
      ),

      gallery(
        'retouched',
        'Every household gets its own gallery link at no extra cost — tell me at the review who needs one.',
      ),
      weather('session'),
    ],
  },

  /* --------------------------------- Pets -------------------------------- */
  {
    id: 'pets',
    eyebrow: 'Your prep guide',
    title: 'Pets',
    subtitle:
      'No expectation whatsoever that they sit still. Here is the short list of things that genuinely help.',
    photoId: 'pets-06-27-2024-puppies-110',
    intro: [
      'This is the shortest guide of the six, because the entire job is bringing your animal somewhere outside and letting them be themselves for an hour.',
      'I am not going to ask them to sit still and hold a look. The photographs worth having are of them doing what they actually do — running at nothing, ignoring you completely, and that one expression only they make.',
      'A tired dog photographs better than a fresh one, and a hungry one photographs better than a fed one. Both of those are the whole trick.',
    ],
    signOff: 'Ashley',
    meta: [
      { label: 'When', value: 'Early morning or the last hour of light' },
      { label: 'How long', value: 'Forty-five minutes to two hours' },
      { label: 'Locations', value: 'One or two' },
      { label: 'You get', value: '60 to 160 naturally edited photos' },
      { label: 'With another session', value: 'They come free, always' },
    ],
    chapters: [
      {
        id: 'the-tricks',
        title: 'The things that actually help',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Walk them first, but not to exhaustion — twenty minutes takes the edge off and leaves them with enough interest to look at things. A dog that has been in the house all morning will spend our first fifteen minutes smelling the ground.',
              'Come slightly hungry. Not cruel, just skip the meal before. High-value treats they do not normally get are the single most effective piece of equipment either of us will bring, and they are how we get an ear up and a head turn on command.',
              'Bring the noise. The squeaky toy, the specific whistle, the word that makes them tilt their head. Whatever it is that gets a reaction in your kitchen will get one in a field, and I cannot make that noise myself.',
            ],
          },
          {
            kind: 'checklist',
            items: [
              'A short walk beforehand — enough to settle, not enough to flatten',
              'Treats they do not normally get, and plenty of them',
              'The squeaky toy, or whatever makes them tilt their head',
              'Water and a bowl',
              'Lead and collar — a plain one, not the neon retractable',
              'A slip lead if they will not stay put, so it is easy to edit out',
              'A brush, and something for muddy paws',
              'Bags. Obviously',
              'A second person, if they are a lot of dog',
              'Their bed, blanket or the destroyed toy, if you want it in frame',
            ],
          },
          {
            kind: 'note',
            text: 'Tell me in advance if they are nervous of strangers, reactive to other dogs, or deaf. It changes where we go and how I approach them, and it is the difference between a good hour and a difficult one.',
          },
        ],
      },

      {
        id: 'timing',
        title: 'When we go',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Early morning or the last hour before sunset, and not because of the light — because of the temperature and the number of other dogs about. Midday in July is unworkable for a dog with a dark coat, and a busy park is unworkable for a dog with opinions.',
              'For dark-coated animals the last hour of light is genuinely important. Low, warm sun is what puts detail into black fur; overhead midday sun turns it into a silhouette.',
              'For puppies, book the earliest slot of the day. Their attention is a finite resource and it is entirely spent by the afternoon.',
            ],
          },
        ],
      },

      {
        id: 'you-in-them',
        title: 'You, in the photographs',
        blocks: [
          {
            kind: 'prose',
            text: [
              'Get in the frame. Everybody books this for photographs of their animal and then realizes afterwards that what they wanted was photographs of the two of them together — there are almost never any, because you are always the one holding the camera.',
              'Wear something plain and something you do not mind getting paw prints on. Mid-tones work better than black or white against most coats. Avoid anything that will pick up hair like a magnet, and by all means bring a change of clothes.',
            ],
          },
        ],
      },

      gallery('natural'),
      weather('walk'),
    ],
  },
]

export const GUIDES_BY_ID = Object.fromEntries(GUIDES.map((g) => [g.id, g])) as Record<string, Guide>

export const GUIDES_INDEX = {
  eyebrow: 'Client guides',
  heading: 'Everything you need before your session.',
  body: 'One guide per session type — what to wear, what photographs well, where we are going, what to bring, and how the day actually runs. Yours arrives by email when you book; they live here too so you can find one at eleven o\'clock the night before.',
  photoId: 'backgrounds-italy-2025-196',
}
