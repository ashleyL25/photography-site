import { useEffect, useState } from 'react'
import type { Photo as PhotoData } from './photos.generated'

/**
 * Photographs of the location suggestions, fetched at runtime.
 *
 * Same arrangement as `portfolio-remote.ts`, and for the same reason: these
 * photographs live in the Cloudflare bucket behind the gallery dashboard, not
 * in this repository. Publish a folder for a location and it appears on the
 * guide without a commit or a deploy. The albums are matched to
 * `LOCATION_SUGGESTIONS` by slug.
 *
 * ## Absence is the normal case
 *
 * Most locations will have no folder for a while, and several never will. A
 * location without photographs renders as a text card, which is a supported
 * state — so this failing, being empty, or not existing yet are all the same
 * thing as far as the guide is concerned, and none of them show an error.
 */

/**
 * The R2 bucket's public development URL. Rate-limited and, in Cloudflare's own
 * words, not for production — bind a custom domain to `img-ashleyphotography`
 * and change this one line when there is time. `scripts/build-locations.mjs`
 * has to be run with the same `--base` so the manifest's `src` values match.
 */
const BUCKET = 'https://pub-31f3e07e7a4c4a348198cf29a3f07859.r2.dev'

const MANIFEST_URL =
  import.meta.env.VITE_LOCATIONS_MANIFEST_URL ?? `${BUCKET}/locations.json`

/** Who took it, when it was not Ashley. Absent means it is hers. */
export interface Credit {
  name: string
  url?: string
  /** e.g. "These are pictures of me" — why somebody else was holding the camera. */
  subject?: string
}

interface ManifestPhoto {
  id: string
  src: string
  widths: number[]
  width: number
  height: number
  aspect: number
  color: string
  lqip: string
  credit?: Credit
}

/** A location photograph: the shape `Photo` renders, plus who took it. */
export type LocationPhoto = PhotoData & { credit?: Credit }

interface ManifestAlbum {
  slug: string
  photos: ManifestPhoto[]
}

interface Manifest {
  albums: ManifestAlbum[]
}

export interface RemoteLocations {
  /** Photographs per location slug. Absent slug = no folder published. */
  bySlug: Record<string, LocationPhoto[]>
  loaded: boolean
}

const EMPTY: RemoteLocations = { bySlug: {}, loaded: false }

let cache: RemoteLocations | null = null
let inflight: Promise<void> | null = null
const listeners = new Set<(value: RemoteLocations) => void>()

async function load(): Promise<void> {
  try {
    // Cross-origin, so the bucket needs a CORS policy allowing this site.
    // Without one this throws and every location quietly falls back to a text
    // card — which is why absence has to stay a supported state.
    const res = await fetch(MANIFEST_URL)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as Manifest

    const bySlug: Record<string, LocationPhoto[]> = {}
    for (const album of data.albums ?? []) {
      if (!album.slug || !album.photos?.length) continue
      bySlug[album.slug] = album.photos.map((p) => ({
        ...p,
        // Neither field means anything here — nothing filters or groups these —
        // but PhotoData requires them, and `Photo` renders from the rest.
        category: 'backgrounds' as PhotoData['category'],
        shoot: album.slug,
      }))
    }
    cache = { bySlug, loaded: true }
  } catch {
    // Silent, and empty. `loaded` is what stops this retrying forever.
    cache = { ...EMPTY, loaded: true }
  }
  for (const listen of listeners) listen(cache)
}

export function useRemoteLocations(): RemoteLocations {
  const [value, setValue] = useState<RemoteLocations>(cache ?? EMPTY)

  useEffect(() => {
    listeners.add(setValue)
    if (cache === null)
      inflight ??= load().finally(() => {
        inflight = null
      })
    return () => {
      listeners.delete(setValue)
    }
  }, [])

  return value
}
