import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/lib/api'
import type { UserPublic } from '@shared/types'

interface AuthValue {
  user: UserPublic | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Re-reads the session. Called after an account change so the sidebar updates. */
  refresh: () => Promise<void>
  /** True for the owner account. Gates the handful of destructive screens. */
  isOwner: boolean
}

const AuthContext = createContext<AuthValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refresh: async () => {},
  isOwner: false,
})

/**
 * Who is signed in.
 *
 * The session is an httpOnly cookie, so the client cannot read it and instead
 * asks `/me` on boot. A 401 there is the expected answer for a signed-out
 * visitor and is not an error — treating it as one is how a login screen ends up
 * flashing a red banner at somebody who has simply not logged in yet.
 *
 * Everything this gates is cosmetic. The real authorization is `requireAuth` and
 * `requireOwner` on the server; hiding a menu item protects nothing.
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: UserPublic }>('/admin/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ user: UserPublic }>('/admin/auth/login', { email, password })
    setUser(data.user)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.post('/admin/auth/logout')
    } finally {
      // Cleared whatever the server said. A failed logout that leaves somebody
      // apparently signed in is worse than one that signs them out locally.
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ user, loading, signIn, signOut, refresh, isOwner: user?.role === 'owner' }),
    [user, loading, signIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAdminAuth() {
  return useContext(AuthContext)
}
