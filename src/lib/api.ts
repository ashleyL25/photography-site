/**
 * The one way this app talks to its API.
 *
 * Thin on purpose — no client-side cache, no query library. Every screen either
 * loads once on mount or is a form that reloads what it just wrote, and a cache
 * layer over that would mostly be a source of stale dashboards after a save.
 */

export class ApiError extends Error {
  readonly status: number
  /** The parsed body, when there was one. Carries fields like `redirect`. */
  readonly body?: unknown

  // Written out longhand rather than as constructor parameter properties, which
  // `erasableSyntaxOnly` forbids: that flag keeps every TypeScript construct
  // removable by a plain transpile, which is what Vite does.
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    // Every admin route authenticates with an httpOnly cookie, so it has to
    // travel. `same-origin` rather than `include`: the API is always same-origin
    // in both development (through the Vite proxy) and production.
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  })

  // 204 and a few error paths legitimately carry no body.
  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }
  }

  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : null) ?? `Request failed (${response.status})`
    throw new ApiError(message, response.status, body)
  }

  return body as T
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  put: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
}

/**
 * Builds a query string, dropping anything empty.
 *
 * Arrays repeat the key — `?tag=craft&tag=editing` — which is what the filter
 * checkboxes produce and what `filtersFromQuery` on the server reads back.
 */
export function qs(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue
    if (Array.isArray(value)) {
      for (const item of value) if (item) search.append(key, String(item))
    } else {
      search.set(key, String(value))
    }
  }
  const out = search.toString()
  return out ? `?${out}` : ''
}

/* ------------------------------------------------------------------ *
 * Uploads
 * ------------------------------------------------------------------ */

export interface UploadProgress {
  loaded: number
  total: number
}

/**
 * Uploads one file: sign, PUT straight to R2, then commit.
 *
 * `XMLHttpRequest` rather than `fetch` for the PUT, purely because `fetch` still
 * cannot report upload progress. A 20 MB PDF on a domestic connection takes long
 * enough that a bar is the difference between waiting and reloading the page.
 *
 * Image dimensions are read in the browser before the upload so the library can
 * show a correctly shaped placeholder — the server never sees the bytes and
 * therefore cannot measure them itself.
 */
export async function uploadFile(
  file: File,
  opts: { folder?: string; alt?: string; onProgress?: (p: UploadProgress) => void } = {},
): Promise<{ id: string; url: string; filename: string; mime: string }> {
  const signed = await api.post<{ id: string; key: string; url: string; publicUrl: string }>(
    '/admin/media/sign',
    { filename: file.name, mime: file.type, bytes: file.size },
  )

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signed.url, true)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.({ loaded: e.loaded, total: e.total })
    }
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new ApiError(`Upload failed (${xhr.status})`, xhr.status))
    xhr.onerror = () => reject(new ApiError('Upload failed — check your connection', 0))
    xhr.send(file)
  })

  const dimensions = file.type.startsWith('image/') ? await readImageSize(file) : null

  const committed = await api.post<{ item: { id: string; url: string; filename: string; mime: string } }>(
    '/admin/media/commit',
    {
      id: signed.id,
      key: signed.key,
      filename: file.name,
      mime: file.type,
      bytes: file.size,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      alt: opts.alt ?? null,
      folder: opts.folder ?? null,
    },
  )

  return committed.item
}

function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    // A file the browser cannot decode is still a legitimate upload — an AVIF on
    // an old browser, say — so a failure here drops the dimensions rather than
    // failing the whole upload.
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}
