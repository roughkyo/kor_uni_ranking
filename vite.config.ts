import fs from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

function localDisclosureApi(): Plugin {
  const serveLocalJson = (middlewares: { use: Function }) => {
    const dataPath = path.resolve(__dirname, "data/2026-11-19-data.json")
    const statusPath = path.resolve(__dirname, "data/2026-11-19-status.json")
    middlewares.use((req: { url?: string }, res: { setHeader: Function; end: Function; statusCode: number }, next: Function) => {
      const cleanUrl = (req.url || "").split("?")[0]
      if (cleanUrl === "/api/data" && fs.existsSync(dataPath)) {
        res.statusCode = 200
        res.setHeader("Content-Type", "application/json; charset=utf-8")
        res.setHeader("Cache-Control", "no-store")
        res.end(fs.readFileSync(dataPath, "utf-8"))
        return
      }
      if (cleanUrl === "/api/status" && fs.existsSync(statusPath)) {
        res.statusCode = 200
        res.setHeader("Content-Type", "application/json; charset=utf-8")
        res.setHeader("Cache-Control", "no-store")
        res.end(fs.readFileSync(statusPath, "utf-8"))
        return
      }
      next()
    })
  }

  return {
    name: "local-disclosure-api",
    configureServer(server) {
      serveLocalJson(server.middlewares)
    },
    configurePreviewServer(server) {
      serveLocalJson(server.middlewares)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localDisclosureApi()],
  publicDir: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          motion: ["framer-motion"],
        },
      },
    },
  },
})
