import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PREVIEW_PATH, type FromFrame, type ToFrame } from './protocol'
import type { HostValue } from '@/widgets/types'
import type { Section } from '@shared/types'

/** The widths the preview renders at: a laptop, and a phone. */
const WIDTHS = { desktop: 1280, mobile: 390 } as const

/**
 * The preview frame, sized and scaled to fit its column.
 *
 * The page inside renders at a true width — 1280px for desktop, 390px for a
 * phone — and is scaled down to the space available, so what is shown is the
 * real layout at that width rather than the desktop layout squeezed. The frame
 * is made taller by the same factor, so it still fills the column.
 */
export function PreviewPane({
  sections,
  host,
  selectedId,
  viewport,
  onSelect,
}: {
  sections: Section[]
  host: HostValue
  selectedId: string | null
  viewport: 'desktop' | 'mobile'
  onSelect: (id: string) => void
}) {
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [ready, setReady] = useState(false)
  const select = useRef(onSelect)
  select.current = onSelect

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onMessage = (event: MessageEvent<FromFrame>) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      if (event.data?.type === 'ap-preview:ready') setReady(true)
      if (event.data?.type === 'ap-preview:select') select.current(event.data.id)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (!ready) return
    const message: ToFrame = { type: 'ap-preview:update', sections, host, selectedId }
    frame.current?.contentWindow?.postMessage(message, window.location.origin)
  }, [ready, sections, host, selectedId])

  const logical = viewport === 'mobile' ? WIDTHS.mobile : Math.max(WIDTHS.desktop, size.width)
  const scale = size.width > 0 ? Math.min(1, size.width / logical) : 1
  const height = size.height / scale

  return (
    <div ref={box} className="relative h-full w-full overflow-hidden">
      <div
        className="mx-auto h-full overflow-hidden"
        style={{ width: logical * scale }}
      >
        <iframe
          ref={frame}
          src={PREVIEW_PATH}
          title="Preview"
          className={viewport === 'mobile' ? 'border-x border-line bg-canvas' : 'bg-canvas'}
          style={{
            width: logical,
            height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            border: 0,
          }}
        />
      </div>
    </div>
  )
}
