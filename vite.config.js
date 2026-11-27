import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// GitHub Pages serves the site from /<repo-name>/, so every asset must be
// resolved relative to that base path.
const BASE = '/home-maintenance-tracker/';

export default defineConfig({
  base: BASE,
  // Expose the package version to the UI (footer).
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg', 'logo.svg', 'apple-touch-icon.png', 'reminder-sw.js'],
      manifest: {
        name: 'Hearthkeep — Home Maintenance Tracker',
        short_name: 'Hearthkeep',
        description: 'Hearthkeep: home care, season by season. Track recurring home maintenance tasks and get reminded when they are due.',
        theme_color: '#23395b',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        // Cache the app shell for offline use.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: `${BASE}index.html`,
        // Never cache the anonymous visit counter (cross-origin, always live).
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://abacus.jasoncameron.dev',
            handler: 'NetworkOnly'
          }
        ],
        // Extra handlers (periodic due-date check, notification clicks).
        importScripts: ['reminder-sw.js']
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js']
  }
});
