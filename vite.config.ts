import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    // Allow all hosts for sandbox deployment (safe in controlled sandbox environment)
    // This is required for Vercel Sandbox which uses dynamic subdomains
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    },
    headers: {
      'Cross-Origin-Resource-Policy': 'cross-origin',
      // Note: COEP is intentionally not set here to avoid Firefox security errors
      // when the preview is embedded in iframes or navigated to from pages without COEP.
      // The platform middleware handles COEP policy for preview routes.
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
    },
  },
})
