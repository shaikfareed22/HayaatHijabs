import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// One codebase, two separate sites:
//   store:  `npm run dev` / `npm run build`              -> dist/
//   admin:  `npm run dev:admin` / `npm run build:admin`  -> dist-admin/
// The admin build swaps the entry point in index.html, so no admin code ships in the store bundle.
const adminEntry = (): Plugin => ({
  name: "hayaat-admin-entry",
  transformIndexHtml: {
    order: "pre",
    handler: (html) =>
      html
        .replace("/src/main.tsx", "/src/admin/main.tsx")
        .replace(/<title>[\s\S]*?<\/title>/, "<title>Hayaat Hijabs Admin</title>")
        .replace("</head>", '  <meta name="robots" content="noindex, nofollow" />\n  </head>'),
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAdmin = mode === "admin";
  return {
    server: {
      host: "::",
      port: isAdmin ? 8081 : 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), isAdmin && adminEntry(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: isAdmin ? "dist-admin" : "dist",
    },
  };
});
