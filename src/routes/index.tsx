import { createBrowserRouter } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import App from '@/App'

/**
 * Lazy load pages for code splitting
 */
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard }))
)

/**
 * Get basename dynamically from window location or environment
 * Supports both preview proxy and direct deployment
 */
function getBasename(): string {
  // Check if basename is set by preview proxy script
  if (typeof window !== 'undefined') {
    const previewBasename = (window as { __PREVIEW_BASENAME__?: string }).__PREVIEW_BASENAME__
    if (previewBasename) {
      console.log('[Router] Using basename from window.__PREVIEW_BASENAME__:', previewBasename)
      return previewBasename
    }

    // Fallback: detect basename from current URL pathname
    // This handles cases where the script hasn't run yet or for preview proxy URLs
    if (window.location.pathname.startsWith('/api/preview/')) {
      const pathMatch = window.location.pathname.match(/^(\/api\/preview\/[^/]+)/)
      if (pathMatch) {
        const detectedBasename = pathMatch[1]
        console.log('[Router] Detected basename from URL pathname:', detectedBasename)
        // Also set it on window for consistency
        ;(window as { __PREVIEW_BASENAME__?: string }).__PREVIEW_BASENAME__ = detectedBasename
        return detectedBasename
      }
    }
  }

  // Check environment variable (for build-time configuration)
  if (import.meta.env.VITE_BASENAME) {
    return import.meta.env.VITE_BASENAME
  }

  // Default: no basename (root deployment)
  console.log('[Router] No basename detected, using root')
  return ''
}

/**
 * Application routes
 * Add new routes here for code splitting
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        {
          index: true,
          element: (
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center">
                  <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
              }
            >
              <Dashboard />
            </Suspense>
          ),
        },
      ],
    },
  ],
  {
    basename: getBasename(),
  }
)
