import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Monogram } from './ui/Brand'
import { useAdminAuth } from './AdminAuth'

/**
 * The way in.
 *
 * Email and password against the Hostinger database — no emailed code, which the
 * gallery used and which costs a round trip through a mail provider every single
 * time somebody wants to fix a typo. A password manager handles this one; it
 * cannot handle a code.
 *
 * The rate limiting, the constant-time comparison and the generic error message
 * all live on the server. This screen's only job is to be unremarkable.
 */
export default function LoginPage() {
  const { user, loading, signIn } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  if (loading) return null
  // Honours `from` rather than always landing on the overview: arriving here from
  // a deep link while already signed in should open what was asked for.
  if (user) return <Navigate to={from} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const field =
    'w-full border-b border-line bg-transparent py-2.5 text-ink outline-none transition-colors focus:border-gilt'

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-canvas px-6 py-16">
      {/* A soft copper glow behind the form — the one flourish on a working screen. */}
      <div
        className="pointer-events-none absolute h-[52vmin] w-[52vmin] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgb(var(--gilt-rgb) / 0.12) 0%, rgb(var(--gilt-rgb) / 0.05) 40%, transparent 70%)',
        }}
      />

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col items-center text-center">
          <Monogram className="h-14 w-auto text-gilt" />
          <motion.span
            className="rule-gilt mt-7 block"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          />
          <h1 className="display mt-8 text-3xl">Dashboard</h1>
          <p className="mt-2 text-sm text-faint">Ashley Photography</p>
        </div>

        <form onSubmit={onSubmit} className="mt-12 space-y-7">
          <div>
            <label htmlFor="email" className="label mb-2 block text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="password" className="label mb-2 block text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
            />
          </div>

          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-accent"
            >
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={submitting} className="btn btn-primary w-full disabled:opacity-50">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-10 text-center text-xs text-faint">
          <a href="/" className="transition-colors hover:text-gilt">
            Back to the site
          </a>
        </p>
      </motion.div>
    </div>
  )
}
