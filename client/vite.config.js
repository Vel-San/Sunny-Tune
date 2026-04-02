var _a;
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
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
