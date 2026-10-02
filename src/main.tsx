import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { SiteProvider } from '@/lib/site'

const onDashboard = window.location.pathname.startsWith('/dashboard')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* The dashboard loads the same payload with drafts included, so its
          previews show what is being edited; the dashboard mounts its own. */}
      {onDashboard ? (
        <App />
      ) : (
        <SiteProvider>
          <App />
        </SiteProvider>
      )}
    </BrowserRouter>
  </StrictMode>,
)
