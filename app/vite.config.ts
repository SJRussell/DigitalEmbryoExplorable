import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/DigitalEmbryoExplorable/' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Three.js into its own chunk since it's large
          'three': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
          // Split React and core dependencies
          'vendor': ['react', 'react-dom'],
          'state': ['zustand'],
          // Split UI components
          'ui': ['@headlessui/react']
        }
      }
    },
    // Increase chunk size warning limit since we're now splitting properly
    chunkSizeWarningLimit: 800
  }
}))
