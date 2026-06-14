import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/trackbook/',
  plugins: [react()],
  build: {
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react'
            }
            if (id.includes('react-router')) {
              return 'vendor-router'
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            if (id.includes('lucide-react') || id.includes('react-hot-toast') || id.includes('react-hook-form')) {
              return 'vendor-ui'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
