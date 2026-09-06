import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // basicSsl serves the dev server over https with a self-signed cert.
  // getUserMedia — the camera feed the pickup scanner needs — only works in a
  // secure context. localhost is exempt from that rule, so desktop testing
  // never surfaces the problem; a phone hitting the LAN URL over plain http
  // gets its camera request rejected. Phones will warn about the self-signed
  // cert once and need "proceed anyway" before the camera comes up.
  plugins: [basicSsl(), react()],
  server: {
    host: true,
    allowedHosts: ['deferred-prone-segment.ngrok-free.dev', '.trycloudflare.com'],
  },
})