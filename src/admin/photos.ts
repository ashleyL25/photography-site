import { useEffect } from 'react'
import { api } from '@/lib/api'
import { getPhoto, registerPhotos } from '@/lib/photos'
import type { MediaItem, PhotoMeta } from '@shared/types'

/**
 * Keeps the photo registry stocked with whatever an editor is showing.
 *
 * The public API sends each page's photographs with the page; the dashboard
 * edits things that change under it, so instead it watches the value being
 * edited and asks for any image URL the registry has not seen — once, batched.
 * That is what lets the live preview draw every photograph with its blur-up
 * and srcset rather than as a bare image.
 */

const requested = new Set<string>()

function collect(value: unknown, into: Set<string>) {
  if (typeof value === 'string') {
    if (/^(\/photos\/|https?:\/\/).+\.(webp|jpe?g|png|avif|gif)$/i.test(value)) into.add(value)
  } else if (Array.isArray(value)) value.forEach((v) => collect(v, into))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collect(v, into))
}

export function usePhotoLookup(value: unknown) {
  useEffect(() => {
    const urls = new Set<string>()
    collect(value, urls)
    const missing = [...urls].filter((u) => !getPhoto(u) && !requested.has(u))
    if (missing.length === 0) return
    missing.forEach((u) => requested.add(u))
    const timer = setTimeout(() => {
      void api
        .post<{ photos: Record<string, PhotoMeta> }>('/admin/media/registry', { urls: missing })
        .then((data) => registerPhotos(data.photos))
        .catch(() => missing.forEach((u) => requested.delete(u)))
    }, 120)
    return () => clearTimeout(timer)
  }, [value])
}

/** Registers a library item the moment it is picked, so the preview can draw it at once. */
export function registerItem(item: MediaItem) {
  if (!item.prefix) return
  registerPhotos({
    [item.url]: {
      prefix: item.prefix,
      widths: item.widths,
      width: item.width ?? 0,
      height: item.height ?? 0,
      color: item.color ?? 'transparent',
      lqip: item.lqip ?? '',
      alt: item.alt,
    },
  })
}

/** A small rendition for a thumbnail, when the photograph has one. */
export function thumbOf(url: string, item?: Pick<MediaItem, 'prefix' | 'widths'>): string {
  const meta = item?.prefix ? { prefix: item.prefix, widths: item.widths } : getPhoto(url)
  if (meta && meta.widths.length > 0) return `${meta.prefix}-${meta.widths[0]}.webp`
  return url
}
