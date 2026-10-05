import type { HostValue } from '@/widgets/types'
import type { Section } from '@shared/types'

/**
 * Messages between the page builder and its preview frame.
 *
 * The preview is a real page in an iframe — the site's own header, widgets and
 * footer at a true width — so the editor tells it what to show and it tells the
 * editor what was clicked. Same origin both ways, checked on receipt.
 */

export const PREVIEW_PATH = '/dashboard/preview-frame'

export type ToFrame = {
  type: 'ap-preview:update'
  sections: Section[]
  host: HostValue
  selectedId: string | null
}

export type FromFrame = { type: 'ap-preview:ready' } | { type: 'ap-preview:select'; id: string }
