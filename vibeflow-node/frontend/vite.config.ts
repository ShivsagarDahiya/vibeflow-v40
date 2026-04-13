import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Vite config for VibeFlow Node frontend
// Proxies /api calls to the local DFX replica during development
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  define: {
    // Required by @dfinity/agent in browser environments
    global: "globalThis",
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          motion: ["framer-motion"],
          dfinity: [
            "@dfinity/agent",
            "@dfinity/auth-client",
            "@dfinity/candid",
            "@dfinity/principal",
          ],
        },
      },
    },
  },
});
