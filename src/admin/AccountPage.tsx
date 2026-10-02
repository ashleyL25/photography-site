import { useEffect, useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { AdminHeader } from './AdminLayout'
import { useAdminAuth } from './AdminAuth'
import { useToast } from './ui/Toast'
import { MediaField } from './ui/MediaPicker'
import { Label, Panel, TextArea, TextInput } from './ui/controls'
import type { UserPublic } from '@shared/types'

/**
 * Your own account.
 *
 * Three things, and only three: how your name appears on what you write, the
 * portrait that goes with it, and your password. Everything about *other*
 * people's accounts lives under People and is owner-only.
 */
export default function AccountPage() {
  const { user, refresh } = useAdminAuth()
  const notify = useToast()

  const [profile, setProfile] = useState<Partial<UserPublic>>({})
  const [savingProfile, setSavingProfile] = useState(false)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name,
        displayName: user.displayName,
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl ?? '',
      })
    }
  }, [user])

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await api.patch('/admin/auth/account', {
        name: profile.name,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      })
      await refresh()
      notify('Saved')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault()

    // Checked here as well as on the server, because catching a mistyped
    // confirmation before the round trip is the difference between a helpful
    // message and one that arrives after a two-second wait.
    if (next !== confirm) {
      notify('The two new passwords do not match', 'error')
      return
    }
    if (next.length < 12) {
      notify('Use at least 12 characters', 'error')
      return
    }

    setSavingPassword(true)
    try {
      await api.post('/admin/auth/account/password', { currentPassword: current, newPassword: next })
      setCurrent('')
      setNext('')
      setConfirm('')
      notify('Password changed — other devices have been signed out')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not change the password', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <AdminHeader title="Your account" description="How you appear on the site, and how you sign in." />

      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-2">
        <Panel title="Profile" description="Your byline and the portrait beside it on posts.">
          <form onSubmit={saveProfile} className="space-y-6">
            <div>
              <Label htmlFor="acct-name" help="Used for your account. Not shown publicly.">
                Account name
              </Label>
              <TextInput
                id="acct-name"
                value={profile.name ?? ''}
                onChange={(name) => setProfile((p) => ({ ...p, name }))}
              />
            </div>

            <div>
              <Label htmlFor="acct-display" help="What appears as the byline on everything you publish.">
                Display name
              </Label>
              <TextInput
                id="acct-display"
                value={profile.displayName ?? ''}
                onChange={(displayName) => setProfile((p) => ({ ...p, displayName }))}
                placeholder={profile.name ?? ''}
              />
            </div>

            <div>
              <Label help="Shown in the author card at the end of a post.">Profile picture</Label>
              <MediaField
                value={profile.avatarUrl ?? ''}
                onChange={(avatarUrl) => setProfile((p) => ({ ...p, avatarUrl }))}
              />
            </div>

            <div>
              <Label htmlFor="acct-bio">Short biography</Label>
              <TextArea
                id="acct-bio"
                rows={4}
                value={profile.bio ?? ''}
                onChange={(bio) => setProfile((p) => ({ ...p, bio }))}
              />
            </div>

            <button type="submit" disabled={savingProfile} className="btn btn-primary disabled:opacity-50">
              {savingProfile ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel title="Password">
            <form onSubmit={savePassword} className="space-y-6">
              <div>
                <Label htmlFor="pw-current">Current password</Label>
                <TextInput
                  id="pw-current"
                  type="password"
                  value={current}
                  onChange={setCurrent}
                  autoComplete="current-password"
                />
              </div>

              <div>
                <Label
                  htmlFor="pw-new"
                  help="At least 12 characters. Length beats symbols — a phrase you will remember is stronger than a short password with a punctuation mark in it."
                >
                  New password
                </Label>
                <TextInput
                  id="pw-new"
                  type="password"
                  value={next}
                  onChange={setNext}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <Label htmlFor="pw-confirm">New password again</Label>
                <TextInput
                  id="pw-confirm"
                  type="password"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword || !current || !next}
                className="btn btn-secondary disabled:opacity-50"
              >
                {savingPassword ? 'Changing…' : 'Change password'}
              </button>

              <p className="text-xs text-faint">
                Changing this signs out every other device and keeps you signed in here.
              </p>
            </form>
          </Panel>

          <Panel title="Sign-in">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="label text-faint">Email</dt>
                <dd className="mt-1">{user?.email}</dd>
              </div>
              <div>
                <dt className="label text-faint">Role</dt>
                <dd className="mt-1 capitalize">{user?.role}</dd>
              </div>
            </dl>
            <p className="mt-5 text-xs text-faint">
              {user?.role === 'owner'
                ? 'As the owner you can also add pages and manage accounts.'
                : 'To change your email address, ask the site owner.'}
            </p>
          </Panel>
        </div>
      </div>
    </>
  )
}
