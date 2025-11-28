import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the default export (singleton) and the class
import fontManager from '../../../src/core/FontManager.js';

describe('FontManager', () => {
    let mockLink;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset loaded fonts
        fontManager.loadedFonts.clear();
        
        // Mock document.createElement for link elements
        mockLink = {
            href: '',
            rel: '',
            onload: null,
            onerror: null
        };
        
        vi.spyOn(document, 'createElement').mockImplementation((tag) => {
            if (tag === 'link') {
                return mockLink;
            }
            return document.createElement(tag);
        });
        
        vi.spyOn(document.head, 'appendChild').mockImplementation(() => {});
        
        // Mock document.fonts
        vi.stubGlobal('document', {
            ...document,
            fonts: {
                load: vi.fn().mockResolvedValue(undefined)
            },
            head: {
                appendChild: vi.fn()
            },
            createElement: vi.fn((tag) => {
                if (tag === 'link') {
                    return mockLink;
                }
                return document.createElement(tag);
            })
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('constructor', () => {
        it('should initialize with empty loadedFonts set', () => {
            // Note: The singleton loads 'Inter' on construction
            // For fresh instance testing would need to import the class
            expect(fontManager.loadedFonts).toBeDefined();
            expect(fontManager.loadedFonts instanceof Set).toBe(true);
        });

        it('should have availableFonts list', () => {
            expect(fontManager.availableFonts).toBeDefined();
            expect(Array.isArray(fontManager.availableFonts)).toBe(true);
            expect(fontManager.availableFonts.length).toBeGreaterThan(0);
        });
    });

    describe('getAvailableFonts()', () => {
        it('should return list of available fonts', () => {
            const fonts = fontManager.getAvailableFonts();
            expect(Array.isArray(fonts)).toBe(true);
            expect(fonts.length).toBeGreaterThan(0);
        });

        it('should include font family property', () => {
            const fonts = fontManager.getAvailableFonts();
            fonts.forEach(font => {
                expect(font).toHaveProperty('family');
                expect(typeof font.family).toBe('string');
            });
        });

        it('should include font category property', () => {
            const fonts = fontManager.getAvailableFonts();
            fonts.forEach(font => {
                expect(font).toHaveProperty('category');
                expect(['sans-serif', 'serif', 'display', 'monospace', 'system']).toContain(font.category);
            });
        });

        it('should include font type property', () => {
            const fonts = fontManager.getAvailableFonts();
            fonts.forEach(font => {
                expect(font).toHaveProperty('type');
                expect(['google', 'system']).toContain(font.type);
            });
        });

        it('should include Inter font', () => {
            const fonts = fontManager.getAvailableFonts();
            const inter = fonts.find(f => f.family === 'Inter');
            expect(inter).toBeDefined();
            expect(inter.category).toBe('sans-serif');
            expect(inter.type).toBe('google');
        });

        it('should include system fonts', () => {
            const fonts = fontManager.getAvailableFonts();
            const systemFonts = fonts.filter(f => f.type === 'system');
            expect(systemFonts.length).toBeGreaterThan(0);
            
            const arial = systemFonts.find(f => f.family === 'Arial');
            expect(arial).toBeDefined();
        });

        it('should include monospace fonts', () => {
            const fonts = fontManager.getAvailableFonts();
            const monoFonts = fonts.filter(f => f.category === 'monospace');
            expect(monoFonts.length).toBeGreaterThan(0);
        });

        it('should include display fonts', () => {
            const fonts = fontManager.getAvailableFonts();
            const displayFonts = fonts.filter(f => f.category === 'display');
            expect(displayFonts.length).toBeGreaterThan(0);
        });

        it('should include serif fonts', () => {
            const fonts = fontManager.getAvailableFonts();
            const serifFonts = fonts.filter(f => f.category === 'serif');
            expect(serifFonts.length).toBeGreaterThan(0);
        });
    });

    describe('isFontLoaded()', () => {
        it('should return false for font not loaded', () => {
            fontManager.loadedFonts.clear();
            expect(fontManager.isFontLoaded('NotLoaded')).toBe(false);
        });

        it('should return true for loaded font', () => {
            fontManager.loadedFonts.add('TestFont');
            expect(fontManager.isFontLoaded('TestFont')).toBe(true);
        });
    });

    describe('loadFont()', () => {
        it('should resolve immediately for already loaded font', async () => {
            fontManager.loadedFonts.add('AlreadyLoaded');
            
            const result = await fontManager.loadFont('AlreadyLoaded');
            
            expect(result).toBeUndefined();
            // Should not create link element
            expect(document.createElement).not.toHaveBeenCalledWith('link');
        });

        it('should mark system fonts as loaded immediately', async () => {
            fontManager.loadedFonts.clear();
            
            await fontManager.loadFont('Arial');
            
            expect(fontManager.isFontLoaded('Arial')).toBe(true);
        });

        it('should create link element for Google fonts', async () => {
            fontManager.loadedFonts.clear();
            
            const loadPromise = fontManager.loadFont('Roboto');
            
            // Simulate link load
            mockLink.onload?.();
            
            await loadPromise;
            
            expect(document.createElement).toHaveBeenCalledWith('link');
        });

        it('should set correct href for Google fonts', async () => {
            fontManager.loadedFonts.clear();
            
            const loadPromise = fontManager.loadFont('Roboto');
            
            expect(mockLink.href).toContain('fonts.googleapis.com');
            expect(mockLink.href).toContain('Roboto');
            
            // Simulate load completion
            mockLink.onload?.();
            await loadPromise;
        });

        it('should handle fonts with spaces in name', async () => {
            fontManager.loadedFonts.clear();
            
            const loadPromise = fontManager.loadFont('Open Sans');
            
            expect(mockLink.href).toContain('Open+Sans');
            
            mockLink.onload?.();
            await loadPromise;
        });

        it('should set rel to stylesheet for Google fonts', async () => {
            fontManager.loadedFonts.clear();
            
            const loadPromise = fontManager.loadFont('Lato');
            
            expect(mockLink.rel).toBe('stylesheet');
            
            mockLink.onload?.();
            await loadPromise;
        });

        it('should mark font as loaded after successful load', async () => {
            fontManager.loadedFonts.clear();
            
            const loadPromise = fontManager.loadFont('Montserrat');
            
            mockLink.onload?.();
            await loadPromise;
            
            expect(fontManager.isFontLoaded('Montserrat')).toBe(true);
        });

        it('should handle load error gracefully', async () => {
            fontManager.loadedFonts.clear();
            
            const loadPromise = fontManager.loadFont('Poppins');
            
            // Simulate error
            mockLink.onerror?.();
            
            // Should resolve (not reject) even on error
            await expect(loadPromise).resolves.toBeUndefined();
        });

        it('should attempt to load unknown fonts as Google fonts', async () => {
            fontManager.loadedFonts.clear();
            
            const loadPromise = fontManager.loadFont('UnknownFont');
            
            expect(mockLink.href).toContain('UnknownFont');
            
            mockLink.onload?.();
            await loadPromise;
        });
    });

    describe('Font categories', () => {
        it('should have sans-serif fonts', () => {
            const fonts = fontManager.getAvailableFonts();
            const sansSerif = fonts.filter(f => f.category === 'sans-serif');
            expect(sansSerif.length).toBeGreaterThan(5);
        });

        it('should have serif fonts', () => {
            const fonts = fontManager.getAvailableFonts();
            const serif = fonts.filter(f => f.category === 'serif');
            expect(serif.length).toBeGreaterThan(3);
        });

        it('should have monospace fonts', () => {
            const fonts = fontManager.getAvailableFonts();
            const mono = fonts.filter(f => f.category === 'monospace');
            expect(mono.length).toBeGreaterThan(2);
        });

        it('should have display fonts', () => {
            const fonts = fontManager.getAvailableFonts();
            const display = fonts.filter(f => f.category === 'display');
            expect(display.length).toBeGreaterThan(2);
        });
    });

    describe('Popular fonts', () => {
        const popularFonts = [
            'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
            'Playfair Display', 'Merriweather', 'JetBrains Mono'
        ];

        popularFonts.forEach(fontName => {
            it(`should include ${fontName}`, () => {
                const fonts = fontManager.getAvailableFonts();
                const found = fonts.find(f => f.family === fontName);
                expect(found).toBeDefined();
            });
        });
    });
});
