
class FontManager {
    constructor() {
        this.loadedFonts = new Set();
        this.availableFonts = [
            // Sans Serif
            { family: 'Inter', category: 'sans-serif', type: 'google' },
            { family: 'Roboto', category: 'sans-serif', type: 'google' },
            { family: 'Open Sans', category: 'sans-serif', type: 'google' },
            { family: 'Lato', category: 'sans-serif', type: 'google' },
            { family: 'Montserrat', category: 'sans-serif', type: 'google' },
            { family: 'Poppins', category: 'sans-serif', type: 'google' },
            { family: 'DM Sans', category: 'sans-serif', type: 'google' },
            { family: 'Space Grotesk', category: 'sans-serif', type: 'google' },
            { family: 'Nunito', category: 'sans-serif', type: 'google' },
            { family: 'Work Sans', category: 'sans-serif', type: 'google' },
            
            // Serif
            { family: 'Playfair Display', category: 'serif', type: 'google' },
            { family: 'Merriweather', category: 'serif', type: 'google' },
            { family: 'Source Serif Pro', category: 'serif', type: 'google' },
            { family: 'Lora', category: 'serif', type: 'google' },
            { family: 'Crimson Pro', category: 'serif', type: 'google' },
            { family: 'EB Garamond', category: 'serif', type: 'google' },
            { family: 'Libre Baskerville', category: 'serif', type: 'google' },
            { family: 'Cormorant', category: 'serif', type: 'google' },
            
            // Display
            { family: 'Oswald', category: 'display', type: 'google' },
            { family: 'Bebas Neue', category: 'display', type: 'google' },
            { family: 'Anton', category: 'display', type: 'google' },
            { family: 'Abril Fatface', category: 'display', type: 'google' },
            { family: 'Righteous', category: 'display', type: 'google' },
            
            // Monospace
            { family: 'JetBrains Mono', category: 'monospace', type: 'google' },
            { family: 'Fira Code', category: 'monospace', type: 'google' },
            { family: 'Source Code Pro', category: 'monospace', type: 'google' },
            { family: 'IBM Plex Mono', category: 'monospace', type: 'google' },
            
            // System Fonts
            { family: 'Arial', category: 'sans-serif', type: 'system' },
            { family: 'Helvetica', category: 'sans-serif', type: 'system' },
            { family: 'Times New Roman', category: 'serif', type: 'system' },
            { family: 'Georgia', category: 'serif', type: 'system' },
            { family: 'Courier New', category: 'monospace', type: 'system' },
            { family: 'system-ui', category: 'system', type: 'system' },
        ];
        
        // Load default font
        this.loadFont('Inter');
    }

    getAvailableFonts() {
        return this.availableFonts;
    }

    isFontLoaded(family) {
        return this.loadedFonts.has(family);
    }

    async loadFont(family) {
        // CSS variables like var(--theme-font-heading) are not real font families.
        // They resolve at render time via CSS; attempting to load them produces invalid requests.
        if (!family || typeof family !== 'string' || family.includes('var(')) {
            return Promise.resolve();
        }

        if (this.loadedFonts.has(family)) {
            return Promise.resolve();
        }

        const fontDef = this.availableFonts.find(f => f.family === family);
        
        // If not in our list, try to load as Google Font anyway
        if (!fontDef) {
            console.log(`Font family "${family}" not in preset list, attempting to load as Google Font...`);
            return this._loadGoogleFont(family);
        }

        if (fontDef.type === 'system') {
            this.loadedFonts.add(family);
            return Promise.resolve();
        }

        if (fontDef.type === 'google') {
            return this._loadGoogleFont(family);
        }
    }
    
    async _loadGoogleFont(family) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            // Load multiple weights to support the style dropdown
            link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`;
            link.rel = 'stylesheet';
            
            link.onload = () => {
                this.loadedFonts.add(family);
                // Attempt to verify loading
                document.fonts.load(`1em "${family}"`).then(() => {
                     resolve();
                }).catch(() => {
                    // Even if check fails, we resolve because the link loaded
                    resolve();
                });
            };
            
            link.onerror = () => {
                console.error(`Failed to load font "${family}"`);
                // Don't reject, just resolve - font will fall back
                resolve();
            };

            document.head.appendChild(link);
        });
    }
}

export default new FontManager();
