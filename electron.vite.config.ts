import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ command }) => ({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve("src/main/index.ts"),
          worker: resolve("src/data/worker.ts"),
          database: resolve("src/data/database.ts"),
          credentials: resolve("src/main/credentials.ts"),
        },
      },
    },
  },
  preload: {},
  renderer: {
    plugins: [
      react(),
      {
        name: "development-csp",
        transformIndexHtml(html) {
          return command === "serve"
            ? html.replace(
                "script-src 'self'",
                "script-src 'self' 'unsafe-inline'",
              )
            : html;
        },
      },
    ],
  },
}));
