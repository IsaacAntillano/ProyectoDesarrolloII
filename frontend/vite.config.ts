import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Desarrollo local: la app se sirve desde la raiz de localhost:5173.
  // Si se vuelve a publicar en GitHub Pages, usar '/Sistema-PMS-victus-caf/'.
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
