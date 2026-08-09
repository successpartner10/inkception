import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Inkception — Vite config.
// host:true + allowedHosts:true so the app can be served behind the
// sandbox's live-preview proxy host.
// base:'./' keeps every asset URL relative so the built site works on
// GitHub Pages (https://<user>.github.io/<repo>/), a root domain, or file://.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
