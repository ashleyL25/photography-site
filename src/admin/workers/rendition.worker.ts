/// <reference lib="webworker" />

/**
 * Generates the portfolio renditions of one photograph, off the main thread.
 *
 * Separate from resize.worker.ts rather than a second mode of it. That worker is
 * on the critical path for a 600-photo upload and produces exactly two
 * derivatives per file; this one produces up to five plus two derived values, and
 * runs once per photograph a human has deliberately chosen. Overloading one
 * worker with both jobs would put the rarely-used path's allocations inside the
 * hot one.
 *
 * ## Why these outputs
 *
 * They match what ashleyphotographyia.com's own build pipeline produces, because
 * its components already consume that shape: a `srcset` across five widths, an
 * average colour painted behind the image, and a ~20px WebP inlined as a data URI
 * for the blur-up. Reusing the gallery's stored 2048px JPEG instead would have
 * meant no srcset, no placeholder, and JPEG where the site uses WebP.
 *
 * ## Why from the original
 *
 * The portfolio goes to 2600px and the gallery's web variant stops at 2048.
 * Generating from the untouched original is the difference between a real 2600px
 * rendition and an upscale of a re-compressed file.
 */

export interface PortfolioRequest {
  id: string
  /** The stored original, fetched back down as a Blob. */
  file: Blob
  widths: number[]
  quality: number
}

export interface PortfolioRendition {
  /**
   * The width that was *asked for*, which is the one the object key uses.
   *
   * Reported separately from the actual pixel width because the two differ for a
   * source smaller than the target — and the caller has to name the key it was
   * given a signed URL for, not the size it happened to produce.
   */
  target: number
  width: number
  height: number
  blob: Blob
}

export interface PortfolioResult {
  id: string
  ok: true
  /** The original's own dimensions, which is what aspect is computed from. */
  width: number
  height: number
  renditions: PortfolioRendition[]
  /** `#rrggbb`, the average of the whole frame. */
  color: string
  /** `data:image/webp;base64,…` at ~20px wide. */
  lqip: string
}

export interface PortfolioError {
  id: string
  ok: false
  error: string
}

/** Scaled to a target *width*, never upscaling. Height follows the aspect. */
function scaleTo(width: number, height: number, targetWidth: number) {
  const scale = Math.min(1, targetWidth / width)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function encodeWebp(
  source: ImageBitmap,
  target: { width: number; height: number },
  quality: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(target.width, target.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable')
  ctx.drawImage(source, 0, 0, target.width, target.height)
  return canvas.convertToBlob({ type: 'image/webp', quality })
}

/**
 * The frame's average colour.
 *
 * Drawn to a single pixel and read back, which makes the browser's own
 * downsampler do the averaging — faster and better weighted than walking the
 * pixels of a full-size bitmap in JS.
 */
function averageColour(source: ImageBitmap): string {
  const canvas = new OffscreenCanvas(1, 1)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return '#888888'
  ctx.drawImage(source, 0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/** Blob → base64, in chunks so a large buffer cannot blow the argument limit. */
async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

self.onmessage = async (event: MessageEvent<PortfolioRequest>) => {
  const { id, file, widths, quality } = event.data

  try {
    const full = await createImageBitmap(file)
    const width = full.width
    const height = full.height

    // Only widths the original can actually supply. A 1600px source has no
    // 2600px rendition, and claiming one in a srcset makes the browser request a
    // file that was never written.
    const usable = widths.filter((w) => w <= width)
    // A source smaller than every target still gets one rendition — the smallest
    // requested width — rather than silently producing nothing. It is written
    // under that width's key even though the pixels are smaller, because that is
    // the key a URL was signed for; `width` below reports the truth.
    const targets = usable.length > 0 ? usable : [Math.min(...widths)]

    // Sequential: each encode allocates a full canvas, and running five at once
    // on a 40-megapixel source is how a Worker gets OOM-killed.
    const renditions: PortfolioRendition[] = []
    for (const target of targets) {
      const size = scaleTo(width, height, target)
      renditions.push({
        target,
        width: size.width,
        height: size.height,
        blob: await encodeWebp(full, size, quality),
      })
    }

    const colour = averageColour(full)
    const placeholder = await encodeWebp(full, scaleTo(width, height, 20), 0.4)
    const lqip = `data:image/webp;base64,${await toBase64(placeholder)}`

    full.close()

    const result: PortfolioResult = {
      id,
      ok: true,
      width,
      height,
      renditions,
      color: colour,
      lqip,
    }
    self.postMessage(result)
  } catch (err) {
    const failure: PortfolioError = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : 'Could not process that photograph',
    }
    self.postMessage(failure)
  }
}
