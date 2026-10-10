import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(root, "static");

function copyStaticOnBuild() {
  return {
    name: "copy-frontend-static",
    closeBundle() {
      if (!fs.existsSync(staticDir)) return;
      fs.cpSync(staticDir, path.resolve(root, "dist", "static"), { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), copyStaticOnBuild()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8000", changeOrigin: true },
      "/static": { target: "http://localhost:8000", changeOrigin: true },
      "/auth": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
