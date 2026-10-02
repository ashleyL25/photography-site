import { useCallback, useEffect, useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { api } from '@/lib/api'
import { formatRelative } from '@/lib/format'
import { AdminHeader } from './AdminLayout'
import { useAdminAuth } from './AdminAuth'
import { useToast } from './ui/Toast'
import { HoldIconButton } from './ui/HoldConfirm'
import { EmptyState, Label, Panel, Select, TextInput } from './ui/controls'
import { Overlay } from './ui/Overlay'
import type { UserPublic } from '@shared/types'

/**
 * Accounts. Owner only, and the reason is stated on the screen rather than
 * hidden in a permissions table — somebody who cannot do something is owed an
 * explanation of why.
 */
export default function UsersPage() {
  const { user: me } = useAdminAuth()
  const notify = useToast()

  const [users, setUsers] = useState<UserPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState<UserPublic | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ users: UserPublic[] }>('/admin/users')
      setUsers(data.users)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not load accounts', 'error')
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    void load()
  }, [load])

  async function create(fields: { email: string; name: string; password: string; role: string }) {
    setCreating(true)
    try {
      await api.post('/admin/users', fields)
      await load()
      notify(`${fields.name} can now sign in`)
      return true
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not create the account', 'error')
      return false
    } finally {
      setCreating(false)
    }
  }

  async function setRole(user: UserPublic, role: string) {
    try {
      await api.patch(`/admin/users/${user.id}`, { role })
      await load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not change the role', 'error')
    }
  }

  async function remove(user: UserPublic) {
    try {
      await api.del(`/admin/users/${user.id}`)
      setUsers((current) => current.filter((u) => u.id !== user.id))
      notify(`${user.name} removed. Everything they wrote is still here.`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not remove the account', 'error')
    }
  }

  return (
    <>
      <AdminHeader
        title="People"
        description="Who can sign in, and what each of them can do."
      />

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel title="Accounts">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-[3px] bg-ink/[0.04]" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState title="No accounts" />
          ) : (
            <ul className="divide-y divide-line">
              {users.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center gap-4 py-4">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt=""
                      className="size-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line">
                      <span className="script text-lg text-gilt">{user.name.slice(0, 1)}</span>
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {user.displayName || user.name}
                      {user.id === me?.id && <span className="ml-2 text-xs text-faint">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-faint">
                      {user.email}
                      <span className="mx-2 opacity-50">·</span>
                      {user.lastLoginAt
                        ? `last signed in ${formatRelative(user.lastLoginAt)}`
                        : 'never signed in'}
                    </p>
                  </div>

                  <div className="w-36 shrink-0">
                    <Select
                      value={user.role}
                      onChange={(role) => void setRole(user, role)}
                      options={[
                        { value: 'owner', label: 'Owner' },
                        { value: 'editor', label: 'Editor' },
                      ]}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setResetting(user)}
                    className="label shrink-0 px-2 text-faint transition-colors hover:text-gilt"
                  >
                    Reset password
                  </button>

                  {user.id !== me?.id && (
                    <HoldIconButton label={`Remove ${user.name}`} onConfirm={() => void remove(user)}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </HoldIconButton>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <NewUserForm onCreate={create} busy={creating} />

          <Panel title="What the roles mean">
            <dl className="space-y-5 text-sm">
              <div>
                <dt className="label text-gilt">Owner</dt>
                <dd className="mt-2 text-muted">
                  Everything an editor can do, plus adding and removing accounts and creating or
                  deleting pages. Kept separate because those are the actions that cannot be undone
                  from inside the dashboard.
                </dd>
              </div>
              <div>
                <dt className="label text-gilt">Editor</dt>
                <dd className="mt-2 text-muted">
                  All of the content: every page, session, album, guide and post, the categories,
                  the media library and the settings. What they cannot do
                  is delete a page the site routes to, or lock anybody out.
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>

      {resetting && (
        <ResetDialog
          user={resetting}
          onClose={() => setResetting(null)}
          onDone={() => {
            setResetting(null)
            notify('Password set — that account has been signed out everywhere')
          }}
        />
      )}
    </>
  )
}

function NewUserForm({
  onCreate,
  busy,
}: {
  onCreate: (fields: { email: string; name: string; password: string; role: string }) => Promise<boolean>
  busy: boolean
}) {
  const [fields, setFields] = useState({ email: '', name: '', password: '', role: 'editor' })

  async function submit(e: FormEvent) {
    e.preventDefault()
    const ok = await onCreate(fields)
    if (ok) setFields({ email: '', name: '', password: '', role: 'editor' })
  }

  return (
    <Panel title="Add someone">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="new-name">Name</Label>
          <TextInput
            id="new-name"
            value={fields.name}
            onChange={(name) => setFields((f) => ({ ...f, name }))}
          />
        </div>

        <div>
          <Label htmlFor="new-email">Email</Label>
          <TextInput
            id="new-email"
            type="email"
            value={fields.email}
            onChange={(email) => setFields((f) => ({ ...f, email }))}
          />
        </div>

        <div>
          <Label
            htmlFor="new-password"
            help="At least 12 characters. Send it to them by a different channel than the email address itself."
          >
            First password
          </Label>
          <TextInput
            id="new-password"
            type="text"
            value={fields.password}
            onChange={(password) => setFields((f) => ({ ...f, password }))}
          />
        </div>

        <div>
          <Label>Role</Label>
          <Select
            value={fields.role}
            onChange={(role) => setFields((f) => ({ ...f, role }))}
            options={[
              { value: 'editor', label: 'Editor' },
              { value: 'owner', label: 'Owner' },
            ]}
          />
        </div>

        <button
          type="submit"
          disabled={busy || !fields.email || !fields.name || fields.password.length < 12}
          className="btn btn-primary w-full disabled:opacity-40"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </Panel>
  )
}

function ResetDialog({
  user,
  onClose,
  onDone,
}: {
  user: UserPublic
  onClose: () => void
  onDone: () => void
}) {
  const notify = useToast()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post(`/admin/users/${user.id}/password`, { password })
      onDone()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not set the password', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Overlay className="z-[10070] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-canvas/88 backdrop-blur-md"
      />
      <form
        onSubmit={submit}
        className={clsx('relative w-full max-w-md rounded-[var(--card-radius)] border border-line bg-surface p-7')}
      >
        <h2 className="display text-xl">Set a password for {user.name}</h2>
        <p className="mt-2 text-sm text-muted">
          They will be signed out everywhere and will need this to get back in.
        </p>

        <div className="mt-6">
          <Label htmlFor="reset-password">New password</Label>
          <TextInput id="reset-password" type="text" value={password} onChange={setPassword} />
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="label px-3 py-2 text-faint hover:text-ink">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || password.length < 12}
            className="btn btn-primary py-3 text-[0.62rem] disabled:opacity-40"
          >
            {busy ? 'Setting…' : 'Set password'}
          </button>
        </div>
      </form>
    </Overlay>
  )
}
