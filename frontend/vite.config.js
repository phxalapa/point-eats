import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, /api va al backend local (uvicorn en el puerto 8000).
    // En Vercel, vercel.json enruta /api al servicio "backend".
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
