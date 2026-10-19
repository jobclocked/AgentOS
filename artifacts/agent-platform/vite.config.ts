import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react(), tailwindcss()],
  root: import.meta.dirname,
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    dedupe: ["react", "react-dom"],
  },
  build: { outDir: path.resolve(import.meta.dirname, "dist/public"), emptyOutDir: true },
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT || 5173),
    allowedHosts: true,
    proxy: { "/api": { target: process.env.API_PROXY_TARGET || "http://127.0.0.1:8080", changeOrigin: true } },
  },
});
