import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
<<<<<<< HEAD
  // basicSsl serves the dev server over https with a self-signed cert.
  // getUserMedia — the camera feed the pickup scanner needs — only works in a
  // secure context. localhost is exempt from that rule, so desktop testing
  // never surfaces the problem; a phone hitting the LAN URL over plain http
  // gets its camera request rejected. Phones will warn about the self-signed
  // cert once and need "proceed anyway" before the camera comes up.
=======
  // Plain http. Note this costs the pickup scanner on a phone: getUserMedia
  // only runs in a secure context, and while localhost is exempt from that
  // rule — which is why the camera still works in desktop dev — a phone on
  // the http:// LAN URL is not, and its camera request gets rejected. Add
  // @vitejs/plugin-basic-ssl back to `plugins` to serve https again; it is
  // still in devDependencies.
>>>>>>> 657662e (centralizing http address)
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