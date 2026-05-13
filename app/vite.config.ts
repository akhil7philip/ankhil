import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // Absolute base so built script/CSS tags always resolve from the domain
  // root. Relative './' breaks on nested routes like /rsvp/edit/<token>:
  // the browser would try to load ./assets/... which resolves to
  // /rsvp/edit/assets/... and gets the SPA-fallback HTML in place of JS,
  // producing a blank page when the bundle fails to parse.
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
