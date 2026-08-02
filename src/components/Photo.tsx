import { useState } from 'react'
import clsx from 'clsx'
import { BY_ID, type Photo as PhotoData } from '@/data/photos.generated'

type Props = {
  /** Id from the generated manifest. */
  id: string
  alt: string
  /** Responsive `sizes` hint — get this right or the browser over-downloads. */
  sizes: string
  className?: string
  /** Skips lazy-loading and raises fetch priority. Use for above-the-fold art only. */
  priority?: boolean
  /** Applied to the <img> itself, e.g. for parallax or Ken Burns transforms. */
  imgClassName?: string
}

function srcSet(photo: PhotoData) {
  return photo.widths.map((w) => `${photo.src}-${w}.webp ${w}w`).join(', ')
}

/**
 * Responsive image backed by the build-time manifest. Reserves exact layout
 * space from the intrinsic ratio, paints the 20px blur placeholder immediately,
 * and cross-fades to the real file once decoded.
 */
export function Photo({ id, alt, sizes, className, imgClassName, priority }: Props) {
  const photo = BY_ID[id]
  const [loaded, setLoaded] = useState(false)

  if (!photo) {
    if (import.meta.env.DEV) console.warn(`Photo "${id}" is not in the manifest.`)
    return null
  }

  const fallback = photo.widths[Math.min(2, photo.widths.length - 1)]

  return (
    <div
      className={clsx('relative overflow-hidden', className)}
      style={{ backgroundColor: photo.color }}
    >
      <img
        aria-hidden
        src={photo.lqip}
        alt=""
        className={clsx(
          'absolute inset-0 h-full w-full scale-110 object-cover blur-xl transition-opacity duration-700',
          loaded ? 'opacity-0' : 'opacity-100',
        )}
      />
      <img
        src={`${photo.src}-${fallback}.webp`}
        srcSet={srcSet(photo)}
        sizes={sizes}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        className={clsx(
          'relative h-full w-full object-cover transition-opacity duration-700 ease-[var(--ease-out-expo)]',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        )}
      />
    </div>
  )
}
