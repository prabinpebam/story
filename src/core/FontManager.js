
class FontManager {
    constructor() {
        this.loadedFonts = new Set();
        this.availableFonts = [
            { family: 'Inter', category: 'sans-serif', type: 'google' },
            { family: 'Roboto', category: 'sans-serif', type: 'google' },
            { family: 'Open Sans', category: 'sans-serif', type: 'google' },
            { family: 'Lato', category: 'sans-serif', type: 'google' },
            { family: 'Montserrat', category: 'sans-serif', type: 'google' },
            { family: 'Playfair Display', category: 'serif', type: 'google' },
            { family: 'Merriweather', category: 'serif', type: 'google' },
            { family: 'Arial', category: 'sans-serif', type: 'system' },
            { family: 'Helvetica', category: 'sans-serif', type: 'system' },
            { family: 'Times New Roman', category: 'serif', type: 'system' },
            { family: 'Courier New', category: 'monospace', type: 'system' },
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
        if (this.loadedFonts.has(family)) {
            return Promise.resolve();
        }

        const fontDef = this.availableFonts.find(f => f.family === family);
        if (!fontDef) {
            // If not in our list, try to load it as a Google font anyway if it's not a system font
            // or just warn. For now, we'll assume if it's not in the list, we can't load it easily.
            // But to support arbitrary Google Fonts later, we might want to relax this.
            console.warn(`Font family "${family}" not found in available fonts.`);
            return Promise.resolve(); 
        }

        if (fontDef.type === 'system') {
            this.loadedFonts.add(family);
            return Promise.resolve();
        }

        if (fontDef.type === 'google') {
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
                    reject(new Error(`Failed to load font "${family}"`));
                };

                document.head.appendChild(link);
            });
        }
    }
}

export default new FontManager();
