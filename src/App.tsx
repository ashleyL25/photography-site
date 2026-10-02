import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { PageCurtain } from '@/components/PageTransition'
import { usePageTransition } from '@/lib/hooks'
import DynamicPage, { PageFallback } from '@/pages/DynamicPage'

// Pages built in the dashboard ship in the main bundle; the rest split out so a
// first visit does not pay for the lightbox or a guide's chapter index.
const SessionPage = lazy(() => import('@/pages/SessionPage'))
const AlbumPage = lazy(() => import('@/pages/AlbumPage'))
const GuidePage = lazy(() => import('@/pages/GuidePage'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))

/** The dashboard is one lazy chunk: a visitor who only reads the site never downloads the editor. */
const Dashboard = lazy(() => import('@/admin/AdminApp'))

function lazyPage(Page: React.ComponentType) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Page />
    </Suspense>
  )
}

function Site() {
  // Routes render against the deferred location, so a page swap happens behind
  // the curtain rather than in front of the reader.
  const { rendered, phase } = usePageTransition()

  return (
    <>
      <PageCurtain phase={phase} />

      <Routes location={rendered}>
        <Route element={<Layout />}>
          {/* The fixed pages are reached by key, so renaming one in the
              dashboard never breaks the route that leads to it. */}
          <Route index element={<DynamicPage pageKey="home" />} />
          <Route path="sessions" element={<DynamicPage pageKey="sessions" />} />
          <Route path="portfolio" element={<DynamicPage pageKey="portfolio" />} />
          <Route path="guides" element={<DynamicPage pageKey="guides" />} />
          <Route path="blog" element={<DynamicPage pageKey="blog" />} />

          <Route path="sessions/:slug" element={lazyPage(SessionPage)} />
          <Route path="portfolio/:slug" element={lazyPage(AlbumPage)} />
          <Route path="guides/:slug" element={lazyPage(GuidePage)} />
          <Route path="blog/:slug" element={lazyPage(BlogPost)} />

          {/* Everything else — About, Experience, Contact, and any page added
              later — is looked up by its address. An unknown one is a 404. */}
          <Route path=":slug" element={<DynamicPage />} />
          <Route path="*" element={<DynamicPage pageKey="__missing__" />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  const { pathname } = useLocation()

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return (
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    )
  }

  return <Site />
}
