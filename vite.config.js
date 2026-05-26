import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the repo at /life-dashboard/ when published from
// the gh-pages branch on a `username.github.io/repo` URL. Override with
// VITE_BASE=/ for custom-domain or root-served deployments.
const BASE = process.env.VITE_BASE || '/life-dashboard/'

export default defineConfig({
  plugins: [react()],
  base: BASE,
  server: {
    port: 5180,
    strictPort: true,
  },
})
