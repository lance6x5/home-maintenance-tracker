import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site from /<repo-name>/, so every asset must be
// resolved relative to that base path.
const BASE = '/home-maintenance-tracker/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg', 'reminder-sw.js'],
      manifest: {
        name: 'Home Maintenance Tracker',
        short_name: 'HomeCare',
        description: 'Track recurring home maintenance tasks and get reminded when they are due.',
        theme_color: '#2f6f4f',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Cache the app shell for offline use.
        globPatterns: ['**/*.{js,css,html,svg}'],
        navigateFallback: `${BASE}index.html`,
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
