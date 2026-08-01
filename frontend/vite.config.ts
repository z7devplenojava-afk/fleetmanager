import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import basicSsl from '@vitejs/plugin-basic-ssl';

/** HTTPS no dev só se VITE_DEV_HTTPS=true — evita ERR_CERT_AUTHORITY_INVALID ao acessar por IP ou cert não confiável */
const useDevHttps = process.env.VITE_DEV_HTTPS === 'true';
// import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    react(),
    ...(useDevHttps ? [basicSsl()] : []),
    // ...(mode === 'development' ? [componentTagger()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      // Service Worker em dev intercepta fetch/HMR e causa ERR_CERT / ERR_SSL_PROTOCOL_ERROR misturados com proxy /api
      devOptions: {
        enabled: false,
        type: 'module',
      },
      manifest: {
        name: 'Fleet Manager',
        short_name: 'Fleet Manager',
        description: 'Sistema completo de gestão de frotas',
        theme_color: '#dc2626',
        background_color: '#1f2937',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        skipWaiting: true,
        clientsClaim: true,
        // Limpar caches antigos automaticamente
        cleanupOutdatedCaches: true,
        // Ignorar erros de precache (arquivos 404 não quebram o service worker)
        // O Workbox irá apenas logar o erro mas continuar funcionando
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.js$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'js-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        // Não cachear arquivos JS dinamicamente importados
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/api/, /^\/ws/]
      },
      // Tratar erros de precache graciosamente
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      }
    }),
  ];

  return {
    server: {
      host: "0.0.0.0", // Permite acesso de qualquer IP na rede
      port: 3000,
      strictPort: false, // Permite usar outra porta se 3000 estiver ocupada
      // HMR: host explícito evita falha de WebSocket quando o servidor escuta em 0.0.0.0
      hmr: {
        overlay: false,
        host: "localhost",
        port: 3000,
        protocol: useDevHttps ? "wss" : "ws",
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8083',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: 'http://localhost:8083',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    plugins,
    build: {
      // Melhorar geração de chunks para evitar problemas de carregamento
      sourcemap: false, // Desabilitar sourcemaps em produção para reduzir tamanho
      minify: 'terser', // Usar terser para melhor minificação
      terserOptions: {
        compress: {
          drop_console: false, // Manter console.logs para debug
        },
      },
      rollupOptions: {
        output: {
          // Garantir nomes de arquivos consistentes
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          // Melhorar code splitting
          manualChunks: {
            // Core React
            'react-vendor': ['react', 'react-dom'],

            // UI Libraries
            'radix-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group'
            ],

            // Icons
            'lucide': ['lucide-react'],

            // Charts
            'charts': ['chart.js', 'react-chartjs-2', 'recharts'],

            // Forms
            'forms': ['react-hook-form', '@hookform/resolvers', 'yup', 'zod'],

            // Data fetching
            'query': ['@tanstack/react-query', '@tanstack/react-table'],

            // Utils
            'utils': ['axios', 'date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],

            // Animations
            'animations': ['framer-motion', 'gsap'],

            // PDF
            'pdf': ['html2pdf.js', 'pdf-lib'],

            // WebSocket
            'websocket': ['@stomp/stompjs', 'sockjs-client'],

            // Other UI
            'ui-other': [
              'sonner',
              'vaul',
              'cmdk',
              'input-otp',
              'react-currency-input-field',
              'react-datepicker',
              'react-day-picker',
              'react-resizable-panels',
              'embla-carousel-react'
            ]
          },
          // Melhorar tratamento de chunks dinâmicos
          experimentalMinChunkSize: 20000, // 20KB mínimo por chunk
        },
      },
      // Aumentar timeout para builds grandes
      chunkSizeWarningLimit: 2000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    define: {
      global: 'window',
    },
    optimizeDeps: {
      include: ['react-map-gl/mapbox', 'mapbox-gl'],
    },
  };
});
