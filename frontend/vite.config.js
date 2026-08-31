import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Allow the dev server to be reached through a tunnel / forwarded port
    // (VS Code dev tunnels, cloudflared, ngrok, ...) instead of only localhost.
    allowedHosts: true,
  },
  preview: {
    port: 5173,
    allowedHosts: true,
  },
})
