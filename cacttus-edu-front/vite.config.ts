import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * The marketing site owns 5174, NOT 5173.
 *
 * 5173 is the admin dashboard's port and is the only origin the API answers with
 * `Access-Control-Allow-Credentials` (see backend/src/config/cors.ts). If this dev
 * server silently fell back to 5174+1 — or worse, started on 5173 while the dashboard
 * was down — the marketing site would either lose CORS access or inherit the
 * dashboard's credentialed treatment. `strictPort` turns that into a loud startup
 * failure instead of a subtle one.
 */
const DEV_PORT = 5174

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Bind to all interfaces so other devices on the LAN/Wi-Fi can reach the dev
    // server at http://<this-machine-lan-ip>:5174, not just localhost.
    host: true,
    port: DEV_PORT,
    strictPort: true,
  },
  preview: {
    port: DEV_PORT,
    strictPort: true,
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
