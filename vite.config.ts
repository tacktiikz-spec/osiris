import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Configuration Vite pour l'application Tauri.
// Le port est fixe (Tauri s'y connecte) et HMR fonctionne dans la webview.
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Empêche Vite d'effacer la sortie des erreurs Rust dans le terminal.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // On ignore le dossier Rust pour éviter les rebuilds intempestifs.
      ignored: ["**/src-tauri/**"],
    },
  },
  // Build optimisé pour la webview embarquée.
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
  },
});
