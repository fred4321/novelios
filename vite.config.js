import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
    root: 'src',

    plugins: [
        // Minification du HTML
        createHtmlPlugin({
            minify: true,
        }),
        // Compression des images (PNG, JPEG, WebP, SVG)
        ViteImageOptimizer({
            png: { quality: 80 },
            jpeg: { quality: 80 },
            webp: { quality: 80 },
            avif: { quality: 70 },
        })
    ],

    build: {
        outDir: '../docs',
        emptyOutDir: true,
        // Génère du JS moderne plus léger pour les navigateurs récents
        target: 'esnext',
        // Minification poussée avec Terser
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Supprime tous les console.log en production
                drop_debugger: true, // Supprime les instructions debugger
            },
        },
        // Séparation du code (code splitting) pour un meilleur cache navigateur
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return 'vendor'
                    }
                },
            },
        },
    },
})
