// Standalone/offline build — ONE self-contained bundle (no code-splitting),
// because the offline file must work from file:// with no network. The
// hosted build (vite.config.js) stays code-split for faster first loads.
import { defineConfig } from 'vite'
import baseConfig from './vite.config.js'

export default defineConfig({
  ...baseConfig,
  build: {
    ...baseConfig.build,
    rollupOptions: {
      output: {
        // inline everything (incl. the lazy mediapipe chunk) into one file
        inlineDynamicImports: true,
      },
    },
  },
})
