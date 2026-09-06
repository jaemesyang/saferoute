import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['deferred-prone-segment.ngrok-free.dev', '.trycloudflare.com'],
    // The app calls /api/... on its own origin and Vite forwards to the backend
    // from the node process. Still needed on http: it is what makes the
    // phone/LAN case work, since localhost resolves on the dev machine here
    // rather than on the phone.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})