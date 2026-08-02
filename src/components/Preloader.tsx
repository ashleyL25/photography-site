import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Monogram } from './Brand'
import { useReducedMotion } from '@/lib/hooks'

/**
 * A short opening curtain. It covers the moment the hero photograph and the
 * webfonts are still resolving, then splits away — which is also why the hero's
 * own entrance animation is delayed by roughly this long.
 */
export function Preloader() {
  const reduced = useReducedMotion()
  const [done, setDone] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const timer = setTimeout(() => setDone(true), 1050)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [reduced])

  useEffect(() => {
    if (done) document.body.style.overflow = ''
  }, [done])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-100 flex items-center justify-center bg-canvas"
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Monogram className="h-14 text-accent" />
            <motion.span
              className="block h-px bg-accent"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
