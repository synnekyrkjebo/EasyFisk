import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync } from "node:fs";

export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    name: "copy-static-map-assets",
    closeBundle() {
      mkdirSync("dist/assets", { recursive: true });
      for (const file of ["script.js", "inatur-data.js", "fishing-places.js"]) {
        cpSync(file, `dist/${file}`);
      }
      cpSync("assets/inatur", "dist/assets/inatur", { recursive: true });
    },
  }],
  base: mode === "production" ? "/EasyFisk/" : "/",
  build: {
    rollupOptions: {
      input: { main: "index.html", purchase: "kjop.html", checkout: "bestilling.html", signup: "registrer.html", login: "logginn.html", ticket: "fiskekort.html", profile: "minside.html", sessions: "loggfor.html" },
    },
  },
}));
