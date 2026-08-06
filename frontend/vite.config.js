import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt', bukan 'autoUpdate': dengan autoUpdate halaman bisa dimuat
      // ulang sendiri saat ada versi baru — kalau itu terjadi di tengah
      // pengisian form kunjungan, isinya hilang tanpa peringatan.
      registerType: 'prompt',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'UKS Digital — SDN 05 Parambahan',
        short_name: 'UKS Digital',
        description: 'Sistem Manajemen Buku Kunjungan UKS Sekolah Dasar',
        start_url: '/',
        display: 'standalone',
        theme_color: '#0B1426',
        background_color: '#F8FAFC',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // Sengaja TANPA runtimeCaching untuk /api.
        // Dua alasan: (1) pola lama `http://localhost:3000/api/*` tidak pernah
        // cocok karena utils/api.js memakai path relatif '/api'; (2) menyimpan
        // rekam kesehatan di cache berisiko menampilkan data usang seolah
        // terbaru — untuk data medis itu lebih berbahaya daripada lambat.
        navigateFallbackDenylist: [/^\/api/]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})