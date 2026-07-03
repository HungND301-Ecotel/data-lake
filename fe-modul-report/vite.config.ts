import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    // ── Dev-only proxy ────────────────────────────────────────────
    // Khi chạy `npm run dev`, Vite sẽ forward request thay cho Nginx.
    // Production/Staging: Nginx Reverse Proxy đảm nhận việc này.
    proxy: {
      // /api/** → BE (Spring Boot)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // /datalake-api/** → DataLake service
      // Strip prefix /datalake-api trước khi forward (giống nginx rewrite)
      '/datalake-api': {
        target: 'http://localhost:1313',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/datalake-api/, ''),
      },
    },
  },
})
