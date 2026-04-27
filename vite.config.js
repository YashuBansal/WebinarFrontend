import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig({
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
