import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base relative : l'app fonctionne aussi bien sur GitHub Pages (/buddy-design/) qu'à la racine d'un domaine.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Buddy — Sors plus.',
        short_name: 'Buddy',
        description: "Trouve l'event. Trouve les gens.",
        lang: 'fr',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F7F4F0',
        theme_color: '#1A1A2E',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            // vrais événements : réseau d'abord, dernière version connue hors ligne
            urlPattern: ({ url }) => url.pathname.endsWith('/data/events.json'),
            handler: 'NetworkFirst',
            options: { cacheName: 'events', networkTimeoutSeconds: 6, expiration: { maxEntries: 2 } },
          },
          {
            urlPattern: /^https:\/\/img\.openagenda\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'event-images', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 } },
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'images', expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^https:\/\/[a-d]\.basemaps\.cartocdn\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'map-tiles', expiration: { maxEntries: 400 } },
          },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
});
