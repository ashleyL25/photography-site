import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/**
 * Two build outputs live under dist/: the client bundle and the compiled API.
 * `dist/client` rather than the default `dist` so `tsc -p tsconfig.server.json`
 * can drop the server beside it at `dist/server` — `server/index.ts` resolves
 * the static root as `../client` relative to itself.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // A function rather than the object form: Vite 8 builds with Rolldown,
        // which accepts only the callback signature.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)/.test(id)) {
            return 'react'
          }
          if (/[\\/]node_modules[\\/](motion|framer-motion|lenis)/.test(id)) return 'motion'
          return undefined
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      // The API runs as its own process in development; in production the same
      // Express app serves both, so the client only ever talks to `/api`.
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: false },
    },
  },
})
