// vite.config.ts
import { defineConfig } from "file:///D:/KhodulieuMD/data-lake/fe-modul-report/node_modules/vite/dist/node/index.js";
import react from "file:///D:/KhodulieuMD/data-lake/fe-modul-report/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///D:/KhodulieuMD/data-lake/fe-modul-report/node_modules/@tailwindcss/vite/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/datalake-api": {
        target: "http://118.71.208.17:1313",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/datalake-api/, "")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxLaG9kdWxpZXVNRFxcXFxkYXRhLWxha2VcXFxcZmUtbW9kdWwtcmVwb3J0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxLaG9kdWxpZXVNRFxcXFxkYXRhLWxha2VcXFxcZmUtbW9kdWwtcmVwb3J0XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9LaG9kdWxpZXVNRC9kYXRhLWxha2UvZmUtbW9kdWwtcmVwb3J0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXHJcblxyXG5cclxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcHJveHk6IHtcclxuICAgICAgXCIvZGF0YWxha2UtYXBpXCI6IHtcclxuICAgICAgICB0YXJnZXQ6IFwiaHR0cDovLzExOC43MS4yMDguMTc6MTMxM1wiLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvZGF0YWxha2UtYXBpLywgXCJcIiksXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1QsU0FBUyxvQkFBb0I7QUFDL1UsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBSXhCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsaUJBQWlCO0FBQUEsUUFDZixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsbUJBQW1CLEVBQUU7QUFBQSxNQUN2RDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
