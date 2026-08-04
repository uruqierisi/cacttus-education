import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEV_PORT = 5173;

/**
 * Vendor chunks are split by concern so a dashboard code change does not invalidate
 * the (much larger, much more stable) React/Radix bundles in the user's cache.
 *
 * THE CHARTS AND EDITOR SPLITS ARE LOAD-BEARING, not tidiness. Recharts (with its d3
 * dependencies) and Tiptap (with ProseMirror) are ~1 MB combined and are each needed by
 * exactly ONE lazy route — the overview and the post editor. Left in the catch-all
 * `vendor` chunk they get pulled in by the app shell, which imports Radix and lucide
 * from that same chunk, so every user would download a megabyte of charting and editing
 * code just to open the inbox and the route-level `lazy()` would buy nothing.
 *
 * `scheduler` belongs with react-dom for a different reason: react-dom imports it, and
 * leaving it in `vendor` made `vendor` and `vendor-react` import each other, which
 * Rollup reports as a circular chunk.
 */
const MANUAL_CHUNKS: Record<string, readonly string[]> = {
  // `@remix-run/router` is react-router-dom's own runtime and `scheduler` is
  // react-dom's; both must sit in THIS chunk. Left in the catch-all they made
  // `vendor` and `vendor-react` import each other — Rollup's "circular chunk"
  // warning — which costs a round-trip on first paint because neither chunk can
  // finish evaluating until the other has loaded.
  'vendor-react': [
    'react/',
    'react-dom',
    'react-is',
    'react-router-dom',
    'react-router',
    '@remix-run',
    'scheduler',
    'use-sync-external-store',
  ],
  'vendor-data': ['@tanstack/react-query', 'axios'],
  'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
  'vendor-charts': [
    'recharts',
    'recharts-scale',
    'react-smooth',
    'react-transition-group',
    'victory-vendor',
    'd3-array',
    'd3-color',
    'd3-ease',
    'd3-format',
    'd3-interpolate',
    'd3-path',
    'd3-scale',
    'd3-shape',
    'd3-time',
    'd3-time-format',
    'd3-timer',
    'decimal.js-light',
  ],
  'vendor-editor': [
    '@tiptap',
    'prosemirror-',
    'orderedmap',
    'rope-sequence',
    'w3c-keyname',
    'linkifyjs',
  ],
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: DEV_PORT,
    strictPort: true,
  },
  preview: {
    port: DEV_PORT,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Warn earlier than Vite's 500 kB default so bundle growth is noticed.
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks: (id: string): string | undefined => {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          // Normalise Windows separators — `id` arrives with backslashes here, so a
          // naive `node_modules/${name}` test silently matches nothing on Win32 and
          // every package quietly lands in the catch-all chunk.
          const normalized = id.replace(/\\/g, '/');

          for (const [chunk, packages] of Object.entries(MANUAL_CHUNKS)) {
            if (packages.some((name) => normalized.includes(`node_modules/${name}`))) {
              return chunk;
            }
          }

          return 'vendor';
        },
      },
    },
  },
});
