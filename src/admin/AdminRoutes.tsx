import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import { AdminAuthProvider, useAdminAuth } from './AdminAuth'
import { ToastProvider } from './ui/Toast'
import AdminLayout from './AdminLayout'
import LoginPage from './LoginPage'
import OverviewPage from './OverviewPage'
import PagesListPage from './pages/PagesListPage'
import PageEditorPage from './pages/PageEditorPage'
import PostsListPage from './blog/PostsListPage'
import PostEditorPage from './blog/PostEditorPage'
import SessionsListPage from './sessions/SessionsListPage'
import SessionEditorPage from './sessions/SessionEditorPage'
import AlbumsListPage from './albums/AlbumsListPage'
import AlbumEditorPage from './albums/AlbumEditorPage'
import GuidesListPage from './guides/GuidesListPage'
import GuideEditorPage from './guides/GuideEditorPage'
import TaxonomyPage from './TaxonomyPage'
import MediaPage from './media/MediaPage'
import SettingsPage from './settings/SettingsPage'
import ThemePage from './theme/ThemePage'
import InquiriesPage from './InquiriesPage'
import AccountPage from './AccountPage'
import UsersPage from './UsersPage'
import { AppearanceProvider } from './ui/appearance'

/**
 * The dashboard's own router.
 *
 * Mounted under `/dashboard` as one lazy chunk, so a visitor who only ever reads
 * the site never downloads the editor. Everything inside it is eager — once
 * somebody has signed in, a spinner between two admin screens is friction with
 * nothing to show for it.
 */
export default function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <AppearanceProvider>
        <ToastProvider>
        {/* No page-transition curtain in here, and reduced motion still honoured.
            A curtain between two panels of an editor is an animation getting in
            the way of work. */}
        <MotionConfig reducedMotion="user">
          <Routes>
            <Route path="/dashboard/login" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<OverviewPage />} />

              <Route path="pages" element={<PagesListPage />} />
              <Route path="pages/:id" element={<PageEditorPage />} />

              {/* `taxonomy` is declared before `:id`, or it would be read as a
                  post id and fetch a row that does not exist. */}
              <Route path="blog" element={<PostsListPage />} />
              <Route path="blog/taxonomy" element={<TaxonomyPage scope="post" />} />
              <Route path="blog/:id" element={<PostEditorPage />} />

              <Route path="sessions" element={<SessionsListPage />} />
              <Route path="sessions/:id" element={<SessionEditorPage />} />

              <Route path="albums" element={<AlbumsListPage />} />
              <Route path="albums/categories" element={<TaxonomyPage scope="portfolio" />} />
              <Route path="albums/:id" element={<AlbumEditorPage />} />

              <Route path="guides" element={<GuidesListPage />} />
              <Route path="guides/:id" element={<GuideEditorPage />} />

              <Route path="media" element={<MediaPage />} />
              <Route path="inquiries" element={<InquiriesPage />} />
              <Route path="settings" element={<Navigate to="/dashboard/settings/site" replace />} />
              <Route path="settings/:group" element={<SettingsPage />} />
              <Route path="theme" element={<Navigate to="/dashboard/theme/colors" replace />} />
              <Route path="theme/:group" element={<ThemePage />} />
              <Route path="account" element={<AccountPage />} />

              <Route
                path="users"
                element={
                  <RequireOwner>
                    <UsersPage />
                  </RequireOwner>
                }
              />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </MotionConfig>
        </ToastProvider>
      </AppearanceProvider>
    </AdminAuthProvider>
  )
}

/**
 * The client-side guard.
 *
 * Cosmetic: it avoids rendering a screen that would immediately 401, and it
 * remembers where somebody was headed so signing in lands them there rather
 * than on the overview. The real authorization is `requireAuth` on the server.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth()
  const location = useLocation()

  // Nothing rather than a spinner: the session probe is one request against the
  // same origin, and a flash of "Loading…" on every dashboard load is worse
  // than a beat of blank.
  if (loading) return null

  if (!user) {
    return <Navigate to="/dashboard/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

function RequireOwner({ children }: { children: React.ReactNode }) {
  const { isOwner, loading } = useAdminAuth()
  if (loading) return null
  if (!isOwner) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
