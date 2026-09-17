import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig({
    root: 'src',

    plugins: [
        createHtmlPlugin({
            minify: true,
        }),
    ],

    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
})
