import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.APP_BASE_PATH ?? "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@examples": fileURLToPath(new URL("../examples", import.meta.url)),
    },
  },
  server: {
    port: 5177,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:3005",
    },
  },
});
