import { resolveCollection } from './collections.js'
import type { Section } from '../../shared/types.js'

/**
 * Fills in the posts every blog widget on a page resolves to, so a page is one
 * request whatever it contains. Everything else a widget needs — sessions,
 * albums, guides, pricing — travels in the site payload instead.
 */
export async function attachCollectionData(
  sections: Section[],
  opts: { published: boolean; excludeId?: string },
): Promise<Section[]> {
  await Promise.all(
    sections.map(async (section) => {
      if (section.type !== 'blog_grid') return
      section.data = await resolveCollection(section.content.source, opts)
    }),
  )
  return sections
}
