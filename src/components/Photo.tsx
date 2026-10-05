import { useState } from 'react'
import clsx from 'clsx'
import { getPhoto, usePhotoRegistry } from '@/lib/photos'
import type { PhotoMeta } from '@shared/types'

type Props = {
  /** The photograph's URL, as stored in an image field. */
  src: string | null | undefined
  alt: string
  /** Responsive `sizes` hint — get this right or the browser over-downloads. */
  sizes: string
  className?: string
  /** Skips lazy-loading and raises fetch priority. Use for above-the-fold art only. */
  priority?: boolean
  /** Applied to the <img> itself, e.g. for parallax or Ken Burns transforms. */
  imgClassName?: string
  /** Inline styles for the frame — an aspect ratio picked in the dashboard, say. */
  style?: React.CSSProperties
  /** Where the crop keeps its focus, as CSS object-position. */
  focus?: string
}

function srcSet(photo: PhotoMeta) {
  return photo.widths.map((w) => `${photo.prefix}-${w}.webp ${w}w`).join(', ')
}

/**
 * Responsive image. Reserves exact layout space from the intrinsic ratio,
 * paints the 20px blur placeholder immediately, and cross-fades to the real
 * file once decoded.
 *
 * What makes that possible is the photo registry: every response that mentions
 * a photograph also carries its renditions, colour and placeholder, so the
 * URL an image field stores is enough to draw it properly. A URL the registry
 * does not know — pasted from somewhere else — still renders, just without the
 * srcset and the blur-up.
 */
export function Photo({ src, alt, sizes, className, imgClassName, priority, style, focus }: Props) {
  usePhotoRegistry()
  const photo = getPhoto(src)
  const [loaded, setLoaded] = useState(false)

  if (!src) return null

  if (!photo) {
    return (
      <div className={clsx('relative overflow-hidden bg-surface', className)} style={style}>
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={focus ? { objectPosition: focus } : undefined}
          className={clsx(
            'relative h-full w-full object-cover transition-opacity duration-700 ease-[var(--ease-out-expo)]',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      </div>
    )
  }

  const fallback = photo.widths[Math.min(2, photo.widths.length - 1)]

  return (
    <div className={clsx('relative overflow-hidden', className)} style={{ backgroundColor: photo.color, ...style }}>
      {photo.lqip && (
        <img
          aria-hidden
          src={photo.lqip}
          alt=""
          className={clsx(
            'absolute inset-0 h-full w-full scale-110 object-cover blur-xl transition-opacity duration-700',
            loaded ? 'opacity-0' : 'opacity-100',
          )}
        />
      )}
      <img
        src={`${photo.prefix}-${fallback}.webp`}
        srcSet={srcSet(photo)}
        sizes={sizes}
        alt={alt}
        width={photo.width || undefined}
        height={photo.height || undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        style={focus ? { objectPosition: focus } : undefined}
        className={clsx(
          'relative h-full w-full object-cover transition-opacity duration-700 ease-[var(--ease-out-expo)]',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        )}
      />
    </div>
  )
}

/** Width over height, for layouts that need it before the image loads. */
export function aspectOf(src: string | null | undefined): number {
  const photo = getPhoto(src)
  return photo && photo.width && photo.height ? photo.width / photo.height : 1.5
}
