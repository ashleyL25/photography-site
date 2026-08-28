import { useState } from 'react'
import clsx from 'clsx'
import { BY_ID, type Photo as PhotoData } from '@/data/photos.generated'
import { useRemotePortfolio } from '@/data/portfolio-remote'

type Props = {
  /** Id from the generated manifest. Ignored when `data` is supplied. */
  id?: string
  /**
   * A photograph resolved somewhere other than the two portfolio manifests —
   * the location suggestions, which come from their own runtime feed. Same
   * shape, so everything below is identical either way.
   */
  data?: PhotoData
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
export function Photo({ id, data, alt, sizes, className, imgClassName, priority }: Props) {
  // The build-time manifest first, then anything published from the gallery
  // dashboard. Local wins on an id collision, which is the safe way round: a
  // photograph that ships with the site is the one that was chosen deliberately.
  const remote = useRemotePortfolio()
  const photo = data ?? (id ? (BY_ID[id] ?? remote.byId[id]) : undefined)
  const [loaded, setLoaded] = useState(false)

  if (!photo) {
    // Only worth warning once the remote manifest has actually been consulted —
    // before that, a remote id is legitimately unknown rather than missing.
    if (import.meta.env.DEV && remote.loaded && id) {
      console.warn(`Photo "${id}" is in neither manifest.`)
    }
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
