import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/datalake-api": {
        target: "http://localhost:1313",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/datalake-api/, ""),
      },
    },
  },
})
