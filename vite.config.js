import { defineConfig } from 'vite';

export default defineConfig({
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
    
    // Ensure documentation files are accessible
    publicDir: 'public',
});
