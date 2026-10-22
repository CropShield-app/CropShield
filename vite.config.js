import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'CropShield',
        short_name: 'CropShield',
        start_url: './',
        display: 'standalone',
        theme_color: '#8B4720',
        background_color: '#FFF8EF',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        // Save everything, including the AI model files, so the app opens with no internet
        globPatterns: ['**/*.{js,css,html,json,bin,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        // Big voice models are saved the first time they are used (while online), then work offline
        runtimeCaching: [
          { urlPattern: /\/voice\/.*\.tar\.gz$/, handler: 'CacheFirst', options: { cacheName: 'voice-models' } }
        ]
      }
    })
  ]
});
