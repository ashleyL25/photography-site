import { useSyncExternalStore } from 'react'
import type { PhotoMeta } from '@shared/types'

/**
 * Everything the Photo component knows about a photograph beyond its URL.
 *
 * Every API response carries a `photos` map for the images it mentions — the
 * srcset prefix, the widths, the average colour and the blur placeholder — and
 * each one is merged in here. Module-level rather than a context because
 * `Photo` renders dozens of times per page and every one of them reads it; a
 * provider would mean threading it through trees that otherwise have none.
 */

const registry = new Map<string, PhotoMeta>()
let version = 0
const listeners = new Set<() => void>()

export function registerPhotos(photos: Record<string, PhotoMeta> | undefined) {
  if (!photos) return
  let changed = false
  for (const [url, meta] of Object.entries(photos)) {
    if (!registry.has(url)) changed = true
    registry.set(url, meta)
  }
  if (changed) {
    version++
    for (const listen of listeners) listen()
  }
}

export function getPhoto(url: string | null | undefined): PhotoMeta | undefined {
  return url ? registry.get(url) : undefined
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Re-renders the caller whenever new photographs are registered. */
export function usePhotoRegistry(): number {
  return useSyncExternalStore(subscribe, () => version, () => version)
}
