import { useEffect } from 'react'
import { SiteProvider } from '@/lib/site'
import AdminRoutes from './AdminRoutes'

/**
 * The dashboard's root.
 *
 * Loads Inter — the dashboard's typeface — only here, so the public site never
 * pays for a font it does not use; and provides the site payload from the
 * dashboard's own endpoint, which includes drafts and private prices so a
 * session being written previews with its figures.
 */
export default function AdminApp() {
  useEffect(() => {
    if (document.getElementById('admin-font')) return
    const link = document.createElement('link')
    link.id = 'admin-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
    document.title = 'Dashboard — Ashley Photography'
  }, [])

  // On <body> rather than a wrapper, so the dialogs — which portal to the body —
  // wear the dashboard's palette and typeface too.
  useEffect(() => {
    document.body.classList.add('admin-ui')
    return () => document.body.classList.remove('admin-ui')
  }, [])

  return (
    <SiteProvider endpoint="/admin/settings/site">
      <AdminRoutes />
    </SiteProvider>
  )
}
