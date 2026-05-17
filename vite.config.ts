import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // For GitHub Pages: set to "/<repo-name>/" after creating the repo
  // e.g. "/bengo/"
  // Leave as "/" for local dev or custom domain
  base: "/bengo/",
  resolve: {
    alias: { "@": "/src" },
  },
});
