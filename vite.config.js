import { defineConfig } from 'vite';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Copies unbundled files that the app and docs load at runtime (Vite cannot bundle classic scripts).
function copyRuntimeStatics() {
    let outDir = 'dist';
    let root = process.cwd();
    return {
        name: 'story-copy-runtime-statics',
        apply: 'build',
        configResolved(config) {
            outDir = resolve(config.root, config.build.outDir);
            root = config.root;
        },
        closeBundle() {
            for (const dir of ['assets', 'documentation']) {
                const from = resolve(root, dir);
                if (existsSync(from)) {
                    cpSync(from, resolve(outDir, dir), { recursive: true });
                }
            }
            const hydration = resolve(root, 'src/boot/theme-hydration.js');
            if (existsSync(hydration)) {
                mkdirSync(resolve(outDir, 'src/boot'), { recursive: true });
                cpSync(hydration, resolve(outDir, 'src/boot/theme-hydration.js'));
            }
        },
    };
}

// Keeps <base href> in sync with the configured deployment base.
function syncBaseHref() {
    let base = '/';
    return {
        name: 'story-sync-base-href',
        configResolved(config) {
            base = config.base;
        },
        transformIndexHtml(html) {
            return html.replace('<base href="/">', `<base href="${base}">`);
        },
    };
}

export default defineConfig({
    // GitHub Pages project sites are served from /<repo>/; set VITE_BASE in CI.
    base: process.env.VITE_BASE || '/',

    // Server configuration
    server: {
        port: 5173,
        open: false,
    },
    
    // Build configuration
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: 'index.html',
                docs: 'docs/index.html'
            }
        }
    },

    plugins: [syncBaseHref(), copyRuntimeStatics()],
    
    // Ensure documentation files are accessible
    publicDir: 'public',
});