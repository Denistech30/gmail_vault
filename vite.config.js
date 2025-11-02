import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "icons/*.png"],
      manifest: {
        name: "Gmail Vault",
        short_name: "Gmail Vault",
        description: "Secure Gmail account manager with biometric recovery",
        theme_color: "#4285F4",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.jpg",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.jpg",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        shortcuts: [
          {
            name: "Add Account",
            short_name: "Add",
            description: "Add a new Gmail account",
            url: "/add",
            icons: [{ src: "/icons/icon-192x192.jpg", sizes: "192x192" }],
          },
          {
            name: "Recovery",
            short_name: "Recover",
            description: "Recover accounts with biometrics",
            url: "/recovery",
            icons: [{ src: "/icons/icon-192x192.jpg", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
})
