import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import path from "path";

/** Same anti-clickjacking baseline as Zoom app (HTTP headers; dev/preview parity with prod Nginx). */
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/pages/WhatsApp"),
    },
  },
  plugins: [react(), viteCompression({ algorithm: "gzip", ext: ".gz" })],
  server: {
    host: "localhost",
    port: 5174,
    headers: securityHeaders,
    hmr: {
      host: "localhost",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 5174,
    headers: securityHeaders,
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
