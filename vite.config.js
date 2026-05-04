import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";

/** Same anti-clickjacking baseline as Zoom app (HTTP headers; dev/preview parity with prod Nginx). */
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteCompression({ algorithm: "gzip", ext: ".gz" })],
  server: {
    host: "0.0.0.0",
    port: 5174,
    headers: securityHeaders,
    hmr: {
      host: "domain2.local",
      protocol: "ws",
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
    include: ['@pdf-lib/fontkit']
  },
  define: {
    global: 'globalThis',
  },
});
