import { motion } from 'motion/react'
import { Monogram } from './Brand'
import { CURTAIN_FALL, CURTAIN_LIFT, type CurtainPhase } from '@/lib/hooks'

/** Collapsed to a hairline along the top edge — off screen. */
const HIDDEN = 'inset(0% 0% 100% 0%)'
/** Full cover. */
const COVERING = 'inset(0% 0% 0% 0%)'

/**
 * The between-pages curtain: the same plate as the opening preloader, dropped
 * from the top edge and lifted back out through the top once the new page is
 * ready behind it. `usePageTransition` in lib/hooks owns the phase and the
 * location swap; this only draws it.
 *
 * Sits above the header and the film grain, below the preloader.
 */
export function PageCurtain({ phase }: { phase: CurtainPhase }) {
  if (phase === 'idle') return null

  const down = phase === 'falling' || phase === 'covered'

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-95 flex items-center justify-center bg-canvas print:hidden"
      initial={{ clipPath: HIDDEN }}
      animate={{ clipPath: down ? COVERING : HIDDEN }}
      transition={{ duration: down ? CURTAIN_FALL : CURTAIN_LIFT, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="flex flex-col items-center gap-5"
        animate={{ opacity: down ? 1 : 0 }}
        transition={{ duration: down ? 0.35 : 0.2 }}
      >
        <Monogram className="h-12 text-accent" />
        <motion.span
          className="block h-px bg-accent"
          initial={{ width: 0 }}
          animate={{ width: down ? 72 : 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>
    </motion.div>
  )
}
