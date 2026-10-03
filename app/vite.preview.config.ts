import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Builds a static gallery of every Koe screen with fake data, for visual checks. */
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist-preview",
    rollupOptions: { input: "preview.html" },
  },
});
