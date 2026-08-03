import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PRICING_KEY } from '@/data/packages'

const STORE_KEY = 'ap-pricing'

/**
 * `true` once the reader has arrived on a link carrying `?pricing=<PRICING_KEY>`.
 *
 * Senior and engagement prices are not posted publicly (see `PRIVATE_PRICING`),
 * so Ashley sends a client a link like
 * `/sessions/seniors?pricing=iowa2026` and the figures appear. It is remembered
 * for the rest of the browser session, so the client can then click around the
 * site — to the contact page, to the other packages — without the prices
 * vanishing again on the second page.
 *
 * `sessionStorage` rather than `localStorage` on purpose: closing the tab should
 * forget it, so a shared or public machine does not keep showing the private
 * list to whoever sits down next.
 *
 * Not a security boundary — the numbers are in the JS bundle either way.
 */
export function usePricingUnlocked(): boolean {
  const { search } = useLocation()
  const [unlocked, setUnlocked] = useState(() => read())

  useEffect(() => {
    if (new URLSearchParams(search).get('pricing') !== PRICING_KEY) return
    try {
      sessionStorage.setItem(STORE_KEY, '1')
    } catch {
      /* Private browsing can refuse storage; the current page still unlocks. */
    }
    setUnlocked(true)
  }, [search])

  return unlocked
}

function read(): boolean {
  try {
    return sessionStorage.getItem(STORE_KEY) === '1'
  } catch {
    return false
  }
}
