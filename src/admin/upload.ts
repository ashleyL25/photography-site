import { api, ApiError } from '@/lib/api'
import type { MediaItem } from '@shared/types'
import type { PortfolioRequest, PortfolioResult, PortfolioError } from './workers/rendition.worker'

/**
 * Uploading a photograph.
 *
 * The original never leaves the browser. A worker draws it down to the five
 * WebP widths the site's srcsets use, works out its average colour and a 20px
 * blur placeholder, and those renditions go straight to R2 on presigned URLs —
 * the same shape the site's own build pipeline produced, so an uploaded
 * photograph and one that shipped with the site render identically.
 */

const QUALITY = 0.82

function render(file: File, widths: number[]): Promise<PortfolioResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./workers/rendition.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<PortfolioResult | PortfolioError>) => {
      worker.terminate()
      if (event.data.ok) resolve(event.data)
      else reject(new Error(event.data.error))
    }
    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message || 'Could not read that photograph'))
    }
    const request: PortfolioRequest = { id: file.name, file, widths, quality: QUALITY }
    worker.postMessage(request)
  })
}

function put(url: string, blob: Blob, onProgress?: (loaded: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    xhr.setRequestHeader('Content-Type', 'image/webp')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded)
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiError(`Upload failed (${xhr.status})`, xhr.status))
    xhr.onerror = () => reject(new ApiError('Upload failed — check your connection', 0))
    xhr.send(blob)
  })
}

export async function uploadPhoto(
  file: File,
  opts: { folder?: string; onProgress?: (fraction: number, stage: 'preparing' | 'uploading') => void } = {},
): Promise<MediaItem> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not a photograph`)

  const signed = await api.post<{ id: string; prefix: string; widths: number[]; urls: Record<number, string> }>(
    '/admin/media/sign-photo',
    { filename: file.name },
  )

  opts.onProgress?.(0, 'preparing')
  const result = await render(file, signed.widths)

  const total = result.renditions.reduce((sum, r) => sum + r.blob.size, 0)
  let done = 0
  // One at a time: five parallel PUTs of a few hundred KB each gain nothing on
  // a home connection and make the progress bar lie.
  for (const rendition of result.renditions) {
    const before = done
    await put(signed.urls[rendition.target], rendition.blob, (loaded) =>
      opts.onProgress?.((before + loaded) / total, 'uploading'),
    )
    done += rendition.blob.size
  }

  const committed = await api.post<{ item: MediaItem }>('/admin/media/commit-photo', {
    id: signed.id,
    prefix: signed.prefix,
    filename: file.name,
    widths: result.renditions.map((r) => r.target),
    width: result.width,
    height: result.height,
    color: result.color,
    lqip: result.lqip,
    bytes: total,
    folder: opts.folder || null,
  })
  return committed.item
}
