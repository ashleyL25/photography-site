import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { useThemeSettings } from '@/lib/site'
import { scrollToElement } from '@/lib/hooks'

/** The back to top button, when the Theme settings turn it on. */
export function BackToTop() {
  const t = useThemeSettings('elements', 'back_to_top')
  const enabled = t.enable === true
  const after = typeof t.after === 'number' ? t.after : 800
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const onScroll = () => setShown(scrollY > after)
    onScroll()
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [enabled, after])

  if (!enabled) return null
  const shape = t.shape === 'square' ? 'rounded-[var(--btn-radius,0)]' : t.shape === 'arch' ? 'arch' : 'rounded-full'

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => scrollToElement(document.body)}
      className={clsx(
        'fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 grid size-12 place-items-center border border-line bg-canvas/90 text-ink shadow-[0_12px_30px_-18px_rgb(0_0_0/0.5)] backdrop-blur transition-all duration-500 hover:border-accent hover:text-accent',
        t.position === 'left' ? 'left-6' : 'right-6',
        shape,
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" aria-hidden>
        <path d="M12 19V5M6 11l6-6 6 6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
