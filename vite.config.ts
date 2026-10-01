import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmdirSync } from "node:fs";

const pages = {
  purchase: "kjop.html",
  checkout: "bestilling.html",
  signup: "registrer.html",
  login: "logginn.html",
  ticket: "fiskekort.html",
  profile: "minside.html",
  sessions: "loggfor.html",
};

export default defineConfig(({ mode }) => ({
  plugins: [react(), {
    // Keep the existing public URLs while storing HTML sources in pages/.
    name: "prototype-pages",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const [pathname, query] = (request.url || "").split("?");
        if (pathname.startsWith("/pages/") && Object.values(pages).includes(pathname.slice(7))) {
          response.writeHead(302, { Location: `${pathname.slice(6)}${query === undefined ? "" : `?${query}`}` });
          response.end();
          return;
        }
        if (Object.values(pages).includes(pathname.slice(1))) {
          request.url = `/pages${pathname}${query === undefined ? "" : `?${query}`}`;
        }
        next();
      });
    },
    writeBundle() {
      for (const file of Object.values(pages)) {
        const source = `dist/pages/${file}`;
        const target = `dist/${file}`;
        renameSync(source, target);
        const html = readFileSync(target, "utf8").replace(/src="\.\.\/scripts\//g, 'src="scripts/');
        writeFileSync(target, html);
      }
      rmdirSync("dist/pages");
    },
    closeBundle() {
      mkdirSync("dist/scripts/data", { recursive: true });
      for (const file of ["scripts/map.js", "scripts/data/inatur-offers.js", "scripts/data/fishing-places.js"]) {
        cpSync(file, `dist/${file}`);
      }
      cpSync("assets/inatur", "dist/assets/inatur", { recursive: true });
    },
  }],
  base: mode === "production" ? "/EasyFisk/" : "/",
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        ...Object.fromEntries(Object.entries(pages).map(([name, file]) => [name, `pages/${file}`])),
      },
    },
  },
}));
