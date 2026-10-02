import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from './api'
import { registerPhotos } from './photos'
import type { PhotoMeta } from '@shared/types'

/**
 * Page content, fetched once and kept.
 *
 * The hand-built site had every page in its bundle, so a click was instant. To
 * keep that feel, the main pages are fetched quietly in the background once the
 * site has loaded (`prefetchPages`), and anything fetched is kept for the rest
 * of the visit — so a page someone navigates to is usually already here when the
 * curtain lifts, and going back is always instant.
 */

type Payload = { photos?: Record<string, PhotoMeta> }

const cache = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

function load<T>(path: string): Promise<T> {
  if (cache.has(path)) return Promise.resolve(cache.get(path) as T)
  const pending = inflight.get(path)
  if (pending) return pending as Promise<T>
  const request = api
    .get<T & Payload>(path)
    .then((data) => {
      registerPhotos(data.photos)
      cache.set(path, data)
      return data as T
    })
    .finally(() => inflight.delete(path))
  inflight.set(path, request)
  return request
}

/** Warms the cache, silently. A failure here is simply a page fetched later. */
export function prefetch(paths: string[]) {
  for (const path of paths) void load(path).catch(() => {})
}

/**
 * Fetches one page's worth of content, registering its photographs.
 *
 * A renamed page answers with a redirect rather than a 404, so a link somebody
 * was sent last month still arrives: that turns into a client-side replace here.
 */
export function usePageData<T>(path: string | null) {
  const [state, setState] = useState<{ path: string | null; data: T | null; missing: boolean }>(() => ({
    path,
    data: path && cache.has(path) ? (cache.get(path) as T) : null,
    missing: false,
  }))
  const navigate = useNavigate()

  useEffect(() => {
    if (!path) return
    if (cache.has(path)) {
      setState({ path, data: cache.get(path) as T, missing: false })
      return
    }
    let canceled = false
    load<T>(path)
      .then((data) => {
        if (!canceled) setState({ path, data, missing: false })
      })
      .catch((err) => {
        if (canceled) return
        const redirect =
          err instanceof ApiError && err.body && typeof err.body === 'object' && 'redirect' in err.body
            ? String((err.body as { redirect: unknown }).redirect)
            : null
        if (redirect) navigate(redirect, { replace: true })
        else setState({ path, data: null, missing: true })
      })
    return () => {
      canceled = true
    }
  }, [path, navigate])

  // Stale data from the previous path is never shown under a new one.
  const current = state.path === path
  return { data: current ? state.data : null, missing: current && state.missing }
}
