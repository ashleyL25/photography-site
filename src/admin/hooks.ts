import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

/* Small hooks the dashboard leans on, carried over from the sister sites. */

export function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [locked])
}

export function useEscape(onClose: () => void, active = true) {
  const handler = useRef(onClose)
  handler.current = onClose

  useEffect(() => {
    if (!active) return
    // The DOM event, not React's synthetic one — this is a window listener.
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') handler.current()
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [active])
}

export function useHoldToConfirm(onConfirm: () => void, holdMs = 1100) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const frame = useRef(0)
  const startedAt = useRef(0)
  const confirmRef = useRef(onConfirm)
  confirmRef.current = onConfirm

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    setHolding(false)
    setProgress(0)
  }, [])

  const start = useCallback(() => {
    // A held button that is already running must not stack two animation loops.
    cancelAnimationFrame(frame.current)
    startedAt.current = performance.now()
    setHolding(true)

    const tick = (now: number) => {
      const ratio = Math.min(1, (now - startedAt.current) / holdMs)
      setProgress(ratio)
      if (ratio >= 1) {
        setHolding(false)
        setProgress(0)
        confirmRef.current()
        return
      }
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }, [holdMs])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return {
    progress,
    holding,
    /**
     * Spread onto the button. Pointer events cover mouse, touch and pen in one
     * set; `onPointerLeave` matters because dragging off a held button and
     * releasing elsewhere would otherwise leave it stuck at 90%.
     */
    handlers: {
      onPointerDown: start,
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      // Keyboard parity: Space or Enter held down repeats keydown, so the timer
      // simply runs from the first one and keyup cancels it.
      onKeyDown: (e: KeyboardEvent) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault()
          start()
        }
      },
      onKeyUp: (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') stop()
      },
      onBlur: stop,
    },
  }
}

