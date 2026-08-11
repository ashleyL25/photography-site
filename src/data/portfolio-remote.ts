import { useEffect, useMemo, useState } from 'react'
import type { Photo as PhotoData } from './photos.generated'
import { SHOOTS_BY_DATE, SHOOT_BY_SLUG, type Shoot } from './shoots'

/**
 * Sessions published from the gallery dashboard, fetched at runtime.
 *
 * The build-time manifest (photos.generated.ts) stays exactly as it is and still
 * owns everything with editorial copy behind it, plus the About and background
 * images. This is the other half: albums where a handful of frames were marked
 * "add to portfolio" in pic.ashleyphotographyia.com, which appear here without
 * this site being rebuilt or redeployed. That is the whole point — the portfolio
 * changes when the photographer says so, not when a deploy runs.
 *
 * ## Why the shapes already line up
 *
 * The dashboard emits photographs in the same shape this site generates locally
 * — a `src` prefix that takes `-<width>.webp`, the list of widths, intrinsic
 * dimensions, an average colour and an inlined blur placeholder. So `Photo` and
 * `Lightbox` render a remote photograph with no idea it came from anywhere else.
 *
 * ## Failure is silent on purpose
 *
 * If the manifest cannot be reached, the site renders exactly as it did before:
 * the locally generated shoots, and nothing missing but the remote ones. A
 * portfolio that shows nine sessions instead of ten is fine; one that shows an
 * error where the work should be is not.
 */

const MANIFEST_URL =
  import.meta.env.VITE_PORTFOLIO_MANIFEST_URL ??
  'https://pic.ashleyphotographyia.com/api/portfolio'

interface ManifestPhoto {
  id: string
  src: string
  widths: number[]
  width: number
  height: number
  aspect: number
  color: string
  lqip: string
}

interface ManifestAlbum {
  slug: string
  title: string
  category: string
  categoryLabel: string
  date: number | null
  /** Editorial copy, written per album in the gallery dashboard. Any may be null. */
  story: string | null
  location: string | null
  conditions: string | null
  requests: string | null
  photos: ManifestPhoto[]
}

interface Manifest {
  configured: boolean
  albums: ManifestAlbum[]
  categories: { value: string; label: string }[]
}

export interface RemotePortfolio {
  /** Remote sessions, shaped like a local Shoot so the pages treat them alike. */
  shoots: Shoot[]
  /** Photo lookup, merged into the local one by `Photo`. */
  byId: Record<string, PhotoData>
  /** Photographs per remote shoot slug. */
  bySlug: Record<string, PhotoData[]>
  /** Category labels for anything the local PORTFOLIO_FILTERS does not name. */
  categories: { value: string; label: string }[]
  loaded: boolean
}

const EMPTY: RemotePortfolio = {
  shoots: [],
  byId: {},
  bySlug: {},
  categories: [],
  loaded: false,
}

/** A remote photograph, in the local manifest's own shape. */
function toPhotoData(p: ManifestPhoto, album: ManifestAlbum): PhotoData {
  return {
    id: p.id,
    // Cast because PhotoCategory is a closed union generated from the local
    // folders, and a category added in the dashboard — Boudoir — is legitimately
    // not in it. Nothing reads this as an exhaustive switch; the filter list is
    // built from strings.
    category: album.category as PhotoData['category'],
    shoot: album.slug,
    src: p.src,
    widths: p.widths,
    width: p.width,
    height: p.height,
    aspect: p.aspect,
    color: p.color,
    lqip: p.lqip,
  }
}

function toShoot(album: ManifestAlbum): Shoot {
  const when = album.date ? new Date(album.date * 1000) : null
  return {
    slug: album.slug,
    source: album.slug,
    title: album.title,
    category: album.category,
    date: when
      ? when.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
      : '',
    // Sortable, and sorted against the local shoots' own `sort` keys.
    sort: when ? when.toISOString().slice(0, 10) : '0000-00-00',
    // Written per album on the dashboard's Name & Cover tab. Anything left blank
    // arrives null and ShootPage drops the row rather than printing an empty one —
    // which is what it used to do with the story heading.
    story: album.story ?? '',
    location: album.location ?? undefined,
    conditions: album.conditions ?? undefined,
    requests: album.requests ?? undefined,
    cover: album.photos[0]?.id ?? '',
  }
}

/**
 * Module-level cache and subscriber list rather than a context provider.
 *
 * Several components need this — the portfolio grid, a shoot page, and `Photo`
 * itself, which is rendered dozens of times per page. One fetch shared by all of
 * them, with no provider to thread through a tree that does not otherwise have
 * one.
 */
let cache: RemotePortfolio | null = null
let inflight: Promise<void> | null = null
const listeners = new Set<(value: RemotePortfolio) => void>()

async function load(): Promise<void> {
  try {
    const res = await fetch(MANIFEST_URL)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as Manifest

    const shoots: Shoot[] = []
    const byId: Record<string, PhotoData> = {}
    const bySlug: Record<string, PhotoData[]> = {}

    for (const album of data.albums ?? []) {
      if (album.photos.length === 0) continue
      const photos = album.photos.map((p) => toPhotoData(p, album))
      for (const photo of photos) byId[photo.id] = photo
      bySlug[album.slug] = photos
      shoots.push(toShoot(album))
    }

    cache = { shoots, byId, bySlug, categories: data.categories ?? [], loaded: true }
  } catch {
    // Reached, and empty. `loaded` distinguishes "nothing published" from "not
    // asked yet", which is what stops a retry loop.
    cache = { ...EMPTY, loaded: true }
  }
  for (const listen of listeners) listen(cache)
}

export function useRemotePortfolio(): RemotePortfolio {
  const [value, setValue] = useState<RemotePortfolio>(cache ?? EMPTY)

  useEffect(() => {
    listeners.add(setValue)
    if (cache === null) inflight ??= load().finally(() => { inflight = null })
    return () => {
      listeners.delete(setValue)
    }
  }, [])

  return value
}

/**
 * Every session the site knows about — local and published — newest first.
 *
 * This exists because getting it wrong is invisible. Three pages had assembled
 * this list by hand and a fourth and fifth read `SHOOTS_BY_DATE` directly, so a
 * published album appeared on the portfolio grid and had a working page of its own
 * while `/sessions` and `/sessions/:id` went on counting only the local ones. That
 * reads as a bug in the publishing pipeline, when it was only ever a page that had
 * not been told the list had grown. Anything counting or listing sessions should
 * call this rather than reach for the generated manifest.
 *
 * A remote album whose slug collides with a hand-curated one is dropped: the local
 * entry has editorial copy behind it and is the better page.
 */
export function useMergedShoots(): Shoot[] {
  const remote = useRemotePortfolio()
  return useMemo(
    () =>
      [...SHOOTS_BY_DATE, ...remote.shoots.filter((s) => !SHOOT_BY_SLUG[s.slug])].sort((a, b) =>
        b.sort.localeCompare(a.sort),
      ),
    [remote.shoots],
  )
}
