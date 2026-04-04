var _a;
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // bind to 0.0.0.0 — accessible on local network, not just localhost
    port: 5173,
    proxy: {
      "/api": {
        target:
          (_a = process.env.VITE_API_URL) !== null && _a !== void 0
            ? _a
            : "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
