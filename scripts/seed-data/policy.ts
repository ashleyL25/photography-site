/**
 * Policy copy that appears in more than one place, kept here so the copies can
 * never drift apart.
 *
 * It lives in its own file rather than in `guides.ts` because the experience
 * page needs it and the six full prep guides are 45 kB of data it has no use
 * for — importing them for two paragraphs would put all of it in that route's
 * chunk.
 */

/**
 * How much finishing work each kind of session gets.
 *
 * `retouched` goes through Photoshop frame by frame — breakouts, sweat marks,
 * creases. `natural` is finished in Lightroom, with the small things fixed but
 * no per-frame retouching; major work on one of those is an add-on. This is the
 * whole reason an engagement session delivers roughly twice as many photographs
 * as a senior session of the same length.
 *
 * TO CONFIRM: `seniors`, `graduation` and `families` are retouched because
 * Ashley said so. `couples` and `pets` are marked `natural` by inference —
 * couples sessions are described throughout the site as running exactly like an
 * engagement session, and retouching a dog's skin means nothing. Flip either one
 * if that is wrong; the tier image counts in `packages.ts` assume this map.
 */
export const EDITING_STYLE: Record<string, 'retouched' | 'natural'> = {
  seniors: 'retouched',
  graduation: 'retouched',
  families: 'retouched',
  engagements: 'natural',
  couples: 'natural',
  pets: 'natural',
}

export const RETOUCHING = {
  retouched: {
    label: 'Fully retouched',
    body: 'Every photograph in your album is finished twice: color, light and contrast in Lightroom, and then Photoshop frame by frame. Breakouts and blemishes come out properly, sweat marks and creases go, and skin gets evened without anybody ending up looking like plastic. It is slow work, which is why these sessions deliver fewer photographs than an engagement session — each one has had a great deal more done to it.',
  },
  natural: {
    label: 'Naturally edited',
    body: 'Color, light and contrast worked frame by frame in Lightroom, plus the small things I would fix without being asked — a stray hair, a distraction at the edge of the frame, a bit of shine. Everything is full resolution and prints beautifully. What it is not is per-frame Photoshop work, so if you want a breakout or a sweat mark taken out of one particular photograph, tell me which and I will retouch that one properly as an add-on.',
  },
} as const

export type EditingStyle = keyof typeof RETOUCHING

/** The weather policy: identical in every guide, and on /experience. */
export function weatherColumns(session: string) {
  return [
    {
      title: 'Overcast is not bad weather',
      body: 'A flat gray sky is the best light there is — soft, even, and forgiving. If you wake up to cloud, that is good news.',
    },
    {
      title: 'Rain and wind are',
      body: `Steady rain, high wind or genuinely unusable light and we move the ${session}, free, to the next date that works for both of us. I would much rather reschedule than shoot in the wrong conditions.`,
    },
    {
      title: 'Heat is a real factor',
      body: 'In July and August we will find shade, take breaks and go through more water than you expect. Bring some. It matters more than you think for how you look in the last hour.',
    },
    {
      title: 'Decisions happen the day before',
      body: 'I watch the forecast and message you the evening before with a straight answer. You will never be left guessing on the morning.',
    },
  ]
}

/**
 * How moving a date works. Also the answer to "What if I need to change the
 * date?" in `BOOKING.terms` — keep the two saying the same thing.
 */
export const RESCHEDULE_NOTE =
  'If you need to move the date for any other reason, tell me as soon as you know. The first change is free — even if it is the day before, because life happens and I would much rather move it than have you push through a day you are dreading. A second change carries a small fee, and I will tell you what it is before anything is decided.'
