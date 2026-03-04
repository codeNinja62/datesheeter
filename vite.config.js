import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Raise the warning threshold — xlsx alone is ~400 kB minified and has no
    // smaller alternative. The chunks below are still split for parallel loading.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // xlsx is the biggest dep (~400 kB) — isolated so main bundle stays lean
          xlsx: ['xlsx'],
          // image export lib — only needed when user clicks Save
          'html-to-image': ['html-to-image'],
          // React runtime
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
