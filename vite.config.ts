import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        electron([
            {
                // Main-Process entry file of the Electron App.
                entry: 'electron/main.ts',
            },
            {
                entry: 'electron/preload.ts',
                onstart(options) {
                    // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
                    // instead of restarting the entire Electron App.
                    options.reload();
                },
            },
        ]),
        renderer(),
    ],
    resolve: {
        alias: [
            {
                /* enketo-transformer has 'libxslt' as an optional peer dependency.
        We don't need it since we are only doing client-side transformations via
          enketo-transformer/web (https://github.com/enketo/enketo-transformer#web).
        So, we can tell webpack it's ok to ignore libxslt by aliasing it to false. */
                find: 'libxslt',
                replacement: '',
            },
        ],
    },
});
