import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'

/**
 * Brief notices — saved, copied, could not delete.
 *
 * Anything that needs a decision gets a dialog or a hold-to-confirm button, so
 * a toast here is only ever telling, never asking. That is why they dismiss
 * themselves and why nothing important is ever said only in one.
 */

interface Toast {
  id: number
  message: string
  tone: 'ok' | 'error'
}

const ToastContext = createContext<{
  notify: (message: string, tone?: Toast['tone']) => void
}>({ notify: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    // Errors linger: they are usually a sentence worth reading, and they are
    // usually read a moment after whatever went wrong took the eye elsewhere.
    setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), tone === 'error' ? 6000 : 3200)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed bottom-6 left-1/2 z-[10090] flex -translate-x-1/2 flex-col items-center gap-3"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={clsx(
                'pointer-events-auto rounded-full border px-6 py-3 text-sm shadow-[0_18px_40px_-16px_rgb(0_0_0/0.7)] backdrop-blur-md',
                toast.tone === 'error'
                  ? 'border-accent/60 bg-surface text-accent'
                  : 'border-gilt/45 bg-surface text-gilt',
              )}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext).notify
}
