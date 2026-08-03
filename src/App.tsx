import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import Home from '@/pages/Home'

// The homepage ships in the main bundle; the rest split out so a first visit
// does not pay for the portfolio grid or the lightbox.
const Portfolio = lazy(() => import('@/pages/Portfolio'))
const ShootPage = lazy(() => import('@/pages/ShootPage'))
const SessionsPage = lazy(() => import('@/pages/SessionsPage'))
const SessionPage = lazy(() => import('@/pages/SessionPage'))
const GuidesPage = lazy(() => import('@/pages/GuidesPage'))
const GuidePage = lazy(() => import('@/pages/GuidePage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const NotFound = lazy(() => import('@/pages/NotFound'))

/** Holds the viewport height while a lazy page resolves, so nothing jumps. */
function PageFallback() {
  return <div className="min-h-[80svh]" />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route
          path="portfolio"
          element={
            <Suspense fallback={<PageFallback />}>
              <Portfolio />
            </Suspense>
          }
        />
        <Route
          path="portfolio/:slug"
          element={
            <Suspense fallback={<PageFallback />}>
              <ShootPage />
            </Suspense>
          }
        />
        <Route
          path="sessions"
          element={
            <Suspense fallback={<PageFallback />}>
              <SessionsPage />
            </Suspense>
          }
        />
        <Route
          path="sessions/:id"
          element={
            <Suspense fallback={<PageFallback />}>
              <SessionPage />
            </Suspense>
          }
        />
        <Route
          path="guides"
          element={
            <Suspense fallback={<PageFallback />}>
              <GuidesPage />
            </Suspense>
          }
        />
        <Route
          path="guides/:id"
          element={
            <Suspense fallback={<PageFallback />}>
              <GuidePage />
            </Suspense>
          }
        />
        <Route
          path="about"
          element={
            <Suspense fallback={<PageFallback />}>
              <AboutPage />
            </Suspense>
          }
        />
        <Route
          path="contact"
          element={
            <Suspense fallback={<PageFallback />}>
              <ContactPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
