import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/pages/WhatsApp"),
      "@zoom": path.resolve(__dirname, "./src/pages/ZoomLive"),
    },
  },
  plugins: [react(), viteCompression({ algorithm: "gzip", ext: ".gz" })],
  server: {
    host: "localhost",
    port: 5174,
    hmr: {
      host: "localhost",
    },
  },
  build: {
    minify: true,
  },
  optimizeDeps: {
    include: ["@pdf-lib/fontkit"],
  },
  define: {
    global: "globalThis",
  },
});
