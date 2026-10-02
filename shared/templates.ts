/**
 * Starting points for a new journal post.
 *
 * A template is nothing more than a list of widgets with some of their fields
 * pre-filled — applying one creates exactly the sections it names and then gets
 * out of the way. There is no ongoing link between a post and the template it
 * started from, so Ashley can rearrange or delete anything afterwards without a
 * template "reasserting" itself.
 *
 * `outline` is what the chooser shows as a preview, so it describes the real
 * structure rather than selling it.
 */

export interface TemplateSection {
  type: string
  /** Merged over the widget's own defaults. */
  content?: Record<string, unknown>
  styles?: Record<string, unknown>
}

export interface PostTemplate {
  id: string
  name: string
  tagline: string
  /** Plain-language description of each section, in order, for the preview. */
  outline: string[]
  sections: TemplateSection[]
}

const INTRO =
  '<p>Start with what made this one worth writing about — who it was, where, and the moment you knew the light was going to cooperate.</p>'

const BODY =
  '<p>Then the detail: the plan, what changed on the day, and the frames you would have missed if you had stuck to the shot list. Write it the way you would tell it to the next client who asks.</p>'

export const POST_TEMPLATES: readonly PostTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    tagline: 'Just the masthead. Build it up section by section.',
    outline: ['Masthead with the title, date and featured photograph'],
    sections: [],
  },

  {
    id: 'essay',
    name: 'Session story',
    tagline: 'The story of one shoot, told in a few paragraphs, with the gallery underneath.',
    outline: [
      'Heading and text — the story',
      'Pull quote — one line from the day',
      'Photo gallery — the frames, opening full screen',
      'Closing call to action',
    ],
    sections: [
      { type: 'text_block', content: { body: INTRO + BODY } },
      { type: 'quote', content: { quote: 'The best one was the frame between the poses.', attribution: '' } },
      { type: 'photo_gallery', content: { heading: 'From the session' } },
      {
        type: 'cta_close',
        content: {
          eyebrow: 'Bookings open',
          heading: 'Want photographs like these?',
          body: 'Tell me who is in them, roughly when, and where you picture it.',
          buttons: [
            { label: 'Start an inquiry', href: '/contact', style: 'primary' },
            { label: 'See the sessions', href: '/sessions', style: 'secondary' },
          ],
        },
      },
    ],
  },

  {
    id: 'location',
    name: 'Location guide',
    tagline: 'A place worth shooting at — what it looks like, when to go, and what to know before you do.',
    outline: [
      'Photograph and text — the place, beside its best frame',
      'Heading and text — when to go and what to know',
      'Photo gallery — what it looks like in photographs',
    ],
    sections: [
      {
        type: 'image_text',
        content: {
          eyebrow: 'Location',
          heading: 'Why this spot works',
          body: '<p>What it looks like, what it suits, and the time of day it is at its best.</p>',
        },
      },
      {
        type: 'text_block',
        content: {
          heading: 'Before you go',
          layout: 'split',
          body: '<p>Parking, permits, the walk in, and anything that catches people out.</p>',
        },
      },
      { type: 'photo_gallery', content: { heading: 'In photographs' } },
    ],
  },

  {
    id: 'favourites',
    name: 'Favourites',
    tagline: 'A handful of frames from the season, each with a line about why it made the cut.',
    outline: ['Heading and text — an introduction', 'Photograph — repeated for each favourite, with a caption'],
    sections: [
      { type: 'text_block', content: { body: '<p>A few of the frames from this season that I keep coming back to, and why.</p>' } },
      { type: 'image_block', content: { caption: 'Why this one.' } },
      { type: 'image_block', content: { caption: 'And this one.' } },
      { type: 'image_block', content: { caption: 'And the one I nearly cut.' } },
    ],
  },
]

export function getTemplate(id: string): PostTemplate | undefined {
  return POST_TEMPLATES.find((t) => t.id === id)
}
