import { useEffect, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { SiteProvider } from '@/lib/site'
import { setOverPhoto } from '@/lib/chrome'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { PHOTO_OPENERS, renderSection } from '@/widgets'
import { GUIDE_BLOCK_TYPES, GuideChapters } from '@/widgets/guides'
import { HostContext } from '@/widgets/types'
import { usePhotoLookup } from '../photos'
import type { FromFrame, ToFrame } from './protocol'
import type { Section } from '@shared/types'

/**
 * The page builder's preview, as a page of its own.
 *
 * Loaded in an iframe so it has a real viewport: the site's breakpoints, `svh`
 * units, sticky elements and scroll-linked animations all behave exactly as
 * they do for a visitor, at whatever width the editor asks for. Drawing the
 * widgets inline in the dashboard could never do that — they would read the
 * dashboard's window, not the page's.
 *
 * Clicking anywhere selects the section underneath. Links are held so a click
 * never navigates the preview away; buttons still work, so pricing tabs and
 * questions can be tried.
 */
export default function PreviewFrame() {
  const [state, setState] = useState<ToFrame | null>(null)

  useEffect(() => {
    const post = (message: FromFrame) => window.parent.postMessage(message, window.location.origin)

    const onMessage = (event: MessageEvent<ToFrame>) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'ap-preview:update') setState(event.data)
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      if (target?.closest('a')) event.preventDefault()
      const section = target?.closest('[data-section-id]')
      if (section) post({ type: 'ap-preview:select', id: section.getAttribute('data-section-id')! })
    }

    window.addEventListener('message', onMessage)
    document.addEventListener('click', onClick, true)
    post({ type: 'ap-preview:ready' })
    return () => {
      window.removeEventListener('message', onMessage)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  return (
    <SiteProvider endpoint="/admin/settings/site">
      <MotionConfig reducedMotion="user">
        <style>{`
          [data-section-id] { cursor: pointer; }
          [data-section-id]:hover { outline: 1px solid rgb(197 128 79 / 0.55); outline-offset: -1px; }
          [data-section-id][data-selected='true'] { outline: 2px solid rgb(197 128 79); outline-offset: -2px; }
        `}</style>
        {state && <Page state={state} />}
      </MotionConfig>
    </SiteProvider>
  )
}

function Page({ state }: { state: ToFrame }) {
  const { sections, host, selectedId } = state
  usePhotoLookup(sections)
  usePhotoLookup(host)
  const scrolledTo = useRef<string | null>(null)

  const first = sections.find((s) => !s.hidden)
  const overPhoto = host.kind === 'album' || Boolean(first && PHOTO_OPENERS.has(first.type))
  useEffect(() => setOverPhoto(overPhoto), [overPhoto])

  // Bring a newly selected section into view — once per selection, so editing
  // its fields does not keep yanking the preview back to it.
  useEffect(() => {
    if (!selectedId || scrolledTo.current === selectedId) return
    scrolledTo.current = selectedId
    document.querySelector(`[data-section-id="${selectedId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedId, sections])

  // Each section wrapped so it can be clicked; a guide's chapters grouped the
  // way the live page groups them, with their own markers.
  const blocks = useMemo(() => {
    const out: { key: string; run?: Section[]; section?: Section }[] = []
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i]
      if (s.type === 'guide_chapter' || GUIDE_BLOCK_TYPES.has(s.type)) {
        const run: Section[] = []
        while (i < sections.length && (sections[i].type === 'guide_chapter' || GUIDE_BLOCK_TYPES.has(sections[i].type))) {
          run.push(sections[i])
          i++
        }
        i--
        out.push({ key: `run-${run[0].id}`, run })
      } else out.push({ key: s.id, section: s })
    }
    return out
  }, [sections])

  useEffect(() => {
    document.querySelectorAll('[data-selected]').forEach((el) => el.removeAttribute('data-selected'))
    if (selectedId) document.querySelector(`[data-section-id="${selectedId}"]`)?.setAttribute('data-selected', 'true')
  })

  return (
    <HostContext.Provider value={host}>
      <div className="grain relative flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {blocks.map((b) =>
            b.run ? (
              <GuideChapters key={b.key} sections={b.run} guideSlug={host.kind === 'guide' ? host.guide.slug : 'preview'} />
            ) : (
              <div key={b.key} data-section-id={b.section!.id} className={b.section!.hidden ? 'opacity-40' : undefined}>
                {renderSection(b.section!)}
              </div>
            ),
          )}
        </main>
        <Footer />
      </div>
    </HostContext.Provider>
  )
}
