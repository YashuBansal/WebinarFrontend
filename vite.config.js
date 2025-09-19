import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteCompression({ algorithm: "gzip", ext: ".gz" })],
  server: {
    host: "0.0.0.0",
    port: 5174,
    hmr: {
      host: "domain2.local",
      protocol: "ws",
    },
  },
  build: {
    minify: true,
  },
});
