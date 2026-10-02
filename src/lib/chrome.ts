import { useSyncExternalStore } from 'react'

/**
 * Whether the page on screen opens on a photograph.
 *
 * The header is light-on-photo only where it actually sits on one — a hero or a
 * masthead. With pages built in the dashboard that is a property of the page's
 * first section rather than of its URL, so the page reports it once its
 * sections have arrived and the header reads it here.
 */
let overPhoto = true
const listeners = new Set<() => void>()

export function setOverPhoto(value: boolean) {
  if (value === overPhoto) return
  overPhoto = value
  for (const listen of listeners) listen()
}

export function useOverPhoto(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    () => overPhoto,
    () => overPhoto,
  )
}
