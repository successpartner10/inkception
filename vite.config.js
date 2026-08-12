import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cache-proof version tag (spec §16): unique per build, injected into HTML
// meta + available as a compile-time constant. Guarantees no stale HTML.
const APP_VERSION = `v0.17.24-${Date.now().toString(36)}`

const versionPlugin = {
  name: 'inkception-version',
  transformIndexHtml(html) {
    return {
      html,
      tags: [
        {
          tag: 'meta',
          attrs: { name: 'inkception-version', content: APP_VERSION },
          injectTo: 'head-prepend',
        },
      ],
    }
  },
}

// Inkception — Vite config.
// host:true + allowedHosts:true so the app can be served behind the
// sandbox's live-preview proxy host.
// base:'./' keeps every asset URL relative so the built site works on
// GitHub Pages (https://<user>.github.io/<repo>/), a root domain, or file://.
export default defineConfig({
  plugins: [react(), tailwindcss(), versionPlugin],
  define: {
    __INKCEPTION_VERSION__: JSON.stringify(APP_VERSION),
  },
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
    rollupOptions: {
      output: {
        // split the heavy vendor libs so the initial payload is smaller and
        // each library caches independently across deploys
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-fabric': ['fabric'],
          'vendor-psd': ['ag-psd'],
        },
      },
    },
  },
})
