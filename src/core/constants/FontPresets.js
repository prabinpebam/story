/**
 * FontPresets.js
 * Predefined font pairing presets for the Typography Style Manager.
 * Each preset provides heading/body font pairings and text style definitions.
 */

/**
 * Font preset categories for filtering
 */
export const FONT_CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'sans-serif', name: 'Sans Serif' },
    { id: 'serif', name: 'Serif' },
    { id: 'mixed', name: 'Mixed' },
    { id: 'display', name: 'Display' },
    { id: 'monospace', name: 'Monospace' }
];

/**
 * Available fonts for dropdowns (Google Fonts + System)
 */
export const AVAILABLE_FONTS = [
    // Sans Serif
    { family: 'Inter', category: 'sans-serif', weights: ['400', '500', '600', '700'] },
    { family: 'Open Sans', category: 'sans-serif', weights: ['400', '600', '700'] },
    { family: 'Roboto', category: 'sans-serif', weights: ['400', '500', '700'] },
    { family: 'Poppins', category: 'sans-serif', weights: ['400', '500', '600', '700'] },
    { family: 'DM Sans', category: 'sans-serif', weights: ['400', '500', '700'] },
    { family: 'Space Grotesk', category: 'sans-serif', weights: ['400', '500', '700'] },
    { family: 'Montserrat', category: 'sans-serif', weights: ['400', '500', '600', '700'] },
    { family: 'Lato', category: 'sans-serif', weights: ['400', '700'] },
    { family: 'Nunito', category: 'sans-serif', weights: ['400', '600', '700'] },
    { family: 'Work Sans', category: 'sans-serif', weights: ['400', '500', '600', '700'] },
    
    // Serif
    { family: 'Playfair Display', category: 'serif', weights: ['400', '700'] },
    { family: 'Source Serif Pro', category: 'serif', weights: ['400', '600', '700'] },
    { family: 'Merriweather', category: 'serif', weights: ['400', '700'] },
    { family: 'Lora', category: 'serif', weights: ['400', '600', '700'] },
    { family: 'Crimson Pro', category: 'serif', weights: ['400', '600', '700'] },
    { family: 'EB Garamond', category: 'serif', weights: ['400', '500', '600', '700'] },
    { family: 'Libre Baskerville', category: 'serif', weights: ['400', '700'] },
    { family: 'Cormorant', category: 'serif', weights: ['400', '500', '600', '700'] },
    
    // Display
    { family: 'Oswald', category: 'display', weights: ['400', '500', '700'] },
    { family: 'Bebas Neue', category: 'display', weights: ['400'] },
    { family: 'Anton', category: 'display', weights: ['400'] },
    { family: 'Abril Fatface', category: 'display', weights: ['400'] },
    { family: 'Righteous', category: 'display', weights: ['400'] },
    
    // Monospace
    { family: 'JetBrains Mono', category: 'monospace', weights: ['400', '700'] },
    { family: 'Fira Code', category: 'monospace', weights: ['400', '500', '700'] },
    { family: 'Source Code Pro', category: 'monospace', weights: ['400', '500', '700'] },
    { family: 'IBM Plex Mono', category: 'monospace', weights: ['400', '500', '700'] },
    
    // System Fonts
    { family: 'system-ui', category: 'system', weights: ['400', '500', '600', '700'] },
    { family: 'Georgia', category: 'system', weights: ['400', '700'] },
    { family: 'Arial', category: 'system', weights: ['400', '700'] }
];

/**
 * Font pairing presets with text style definitions
 */
export const FONT_PRESETS = [
    // ========================================
    // SANS SERIF
    // ========================================
    {
        id: 'modern-clean',
        name: 'Modern Clean',
        category: 'sans-serif',
        fonts: {
            heading: { family: 'Inter', weight: '700', fallback: 'system-ui, sans-serif' },
            body: { family: 'Inter', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 72, fontWeight: '700', lineHeight: 1.1, letterSpacing: '-1%' },
            subtitle: { fontSize: 32, fontWeight: '400', lineHeight: 1.3, letterSpacing: '0%' },
            heading1: { fontSize: 48, fontWeight: '700', lineHeight: 1.2, letterSpacing: '-0.5%' },
            heading2: { fontSize: 36, fontWeight: '600', lineHeight: 1.25, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0.5%' },
            label: { fontSize: 11, fontWeight: '500', lineHeight: 1.3, letterSpacing: '2%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'geometric',
        name: 'Geometric',
        category: 'sans-serif',
        fonts: {
            heading: { family: 'Poppins', weight: '600', fallback: 'system-ui, sans-serif' },
            body: { family: 'Poppins', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 72, fontWeight: '600', lineHeight: 1.1, letterSpacing: '-0.5%' },
            subtitle: { fontSize: 32, fontWeight: '400', lineHeight: 1.3, letterSpacing: '0%' },
            heading1: { fontSize: 48, fontWeight: '600', lineHeight: 1.2, letterSpacing: '0%' },
            heading2: { fontSize: 36, fontWeight: '500', lineHeight: 1.25, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '500', lineHeight: 1.3, letterSpacing: '1%' }
        }
    },
    {
        id: 'swiss',
        name: 'Swiss',
        category: 'sans-serif',
        fonts: {
            heading: { family: 'Work Sans', weight: '600', fallback: 'system-ui, sans-serif' },
            body: { family: 'Work Sans', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 64, fontWeight: '600', lineHeight: 1.1, letterSpacing: '-1%' },
            subtitle: { fontSize: 28, fontWeight: '400', lineHeight: 1.35, letterSpacing: '0%' },
            heading1: { fontSize: 44, fontWeight: '600', lineHeight: 1.2, letterSpacing: '-0.5%' },
            heading2: { fontSize: 32, fontWeight: '500', lineHeight: 1.25, letterSpacing: '0%' },
            body: { fontSize: 16, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0.5%' },
            label: { fontSize: 10, fontWeight: '500', lineHeight: 1.3, letterSpacing: '3%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'tech-forward',
        name: 'Tech Forward',
        category: 'sans-serif',
        fonts: {
            heading: { family: 'Space Grotesk', weight: '700', fallback: 'system-ui, sans-serif' },
            body: { family: 'DM Sans', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 72, fontWeight: '700', lineHeight: 1.05, letterSpacing: '-2%' },
            subtitle: { fontSize: 28, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 48, fontWeight: '700', lineHeight: 1.15, letterSpacing: '-1%' },
            heading2: { fontSize: 32, fontWeight: '500', lineHeight: 1.2, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '500', lineHeight: 1.4, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '500', lineHeight: 1.3, letterSpacing: '2%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'humanist',
        name: 'Humanist',
        category: 'sans-serif',
        fonts: {
            heading: { family: 'Nunito', weight: '700', fallback: 'system-ui, sans-serif' },
            body: { family: 'Nunito', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 68, fontWeight: '700', lineHeight: 1.1, letterSpacing: '0%' },
            subtitle: { fontSize: 30, fontWeight: '400', lineHeight: 1.35, letterSpacing: '0%' },
            heading1: { fontSize: 44, fontWeight: '700', lineHeight: 1.2, letterSpacing: '0%' },
            heading2: { fontSize: 32, fontWeight: '600', lineHeight: 1.25, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '600', lineHeight: 1.3, letterSpacing: '1%' }
        }
    },

    // ========================================
    // SERIF
    // ========================================
    {
        id: 'editorial',
        name: 'Editorial',
        category: 'serif',
        fonts: {
            heading: { family: 'Playfair Display', weight: '700', fallback: 'Georgia, serif' },
            body: { family: 'Source Serif Pro', weight: '400', fallback: 'Georgia, serif' }
        },
        styles: {
            title: { fontSize: 80, fontWeight: '700', lineHeight: 1.0, letterSpacing: '-1%' },
            subtitle: { fontSize: 28, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 52, fontWeight: '700', lineHeight: 1.15, letterSpacing: '0%' },
            heading2: { fontSize: 36, fontWeight: '600', lineHeight: 1.2, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.7, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '600', lineHeight: 1.3, letterSpacing: '3%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'traditional',
        name: 'Traditional',
        category: 'serif',
        fonts: {
            heading: { family: 'EB Garamond', weight: '600', fallback: 'Georgia, serif' },
            body: { family: 'EB Garamond', weight: '400', fallback: 'Georgia, serif' }
        },
        styles: {
            title: { fontSize: 72, fontWeight: '600', lineHeight: 1.1, letterSpacing: '0%' },
            subtitle: { fontSize: 28, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 48, fontWeight: '600', lineHeight: 1.2, letterSpacing: '0%' },
            heading2: { fontSize: 32, fontWeight: '500', lineHeight: 1.25, letterSpacing: '0%' },
            body: { fontSize: 20, fontWeight: '400', lineHeight: 1.7, letterSpacing: '0%' },
            bodySmall: { fontSize: 16, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            caption: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            label: { fontSize: 12, fontWeight: '500', lineHeight: 1.3, letterSpacing: '2%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'literary',
        name: 'Literary',
        category: 'serif',
        fonts: {
            heading: { family: 'Libre Baskerville', weight: '700', fallback: 'Georgia, serif' },
            body: { family: 'Libre Baskerville', weight: '400', fallback: 'Georgia, serif' }
        },
        styles: {
            title: { fontSize: 64, fontWeight: '700', lineHeight: 1.15, letterSpacing: '0%' },
            subtitle: { fontSize: 26, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 44, fontWeight: '700', lineHeight: 1.2, letterSpacing: '0%' },
            heading2: { fontSize: 30, fontWeight: '400', lineHeight: 1.3, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.8, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.7, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0.5%' },
            label: { fontSize: 11, fontWeight: '400', lineHeight: 1.3, letterSpacing: '3%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'elegant',
        name: 'Elegant',
        category: 'serif',
        fonts: {
            heading: { family: 'Cormorant', weight: '600', fallback: 'Georgia, serif' },
            body: { family: 'Crimson Pro', weight: '400', fallback: 'Georgia, serif' }
        },
        styles: {
            title: { fontSize: 84, fontWeight: '600', lineHeight: 1.0, letterSpacing: '0%' },
            subtitle: { fontSize: 28, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 56, fontWeight: '600', lineHeight: 1.1, letterSpacing: '0%' },
            heading2: { fontSize: 36, fontWeight: '500', lineHeight: 1.2, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.7, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '500', lineHeight: 1.3, letterSpacing: '4%', textTransform: 'uppercase' }
        }
    },

    // ========================================
    // MIXED (Heading Serif + Body Sans or vice versa)
    // ========================================
    {
        id: 'professional-mix',
        name: 'Professional Mix',
        category: 'mixed',
        fonts: {
            heading: { family: 'Playfair Display', weight: '700', fallback: 'Georgia, serif' },
            body: { family: 'Open Sans', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 76, fontWeight: '700', lineHeight: 1.05, letterSpacing: '-0.5%' },
            subtitle: { fontSize: 28, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 48, fontWeight: '700', lineHeight: 1.15, letterSpacing: '0%' },
            heading2: { fontSize: 32, fontWeight: '600', lineHeight: 1.2, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '600', lineHeight: 1.3, letterSpacing: '2%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'creative-mix',
        name: 'Creative Mix',
        category: 'mixed',
        fonts: {
            heading: { family: 'Lora', weight: '600', fallback: 'Georgia, serif' },
            body: { family: 'Roboto', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 72, fontWeight: '600', lineHeight: 1.1, letterSpacing: '0%' },
            subtitle: { fontSize: 28, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 48, fontWeight: '600', lineHeight: 1.2, letterSpacing: '0%' },
            heading2: { fontSize: 32, fontWeight: '500', lineHeight: 1.25, letterSpacing: '0%' },
            body: { fontSize: 16, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '500', lineHeight: 1.3, letterSpacing: '1%' }
        }
    },
    {
        id: 'contrast',
        name: 'High Contrast',
        category: 'mixed',
        fonts: {
            heading: { family: 'Montserrat', weight: '800', fallback: 'system-ui, sans-serif' },
            body: { family: 'Merriweather', weight: '400', fallback: 'Georgia, serif' }
        },
        styles: {
            title: { fontSize: 80, fontWeight: '800', lineHeight: 1.0, letterSpacing: '-2%' },
            subtitle: { fontSize: 24, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            heading1: { fontSize: 52, fontWeight: '800', lineHeight: 1.1, letterSpacing: '-1%' },
            heading2: { fontSize: 36, fontWeight: '700', lineHeight: 1.15, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.8, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.7, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '700', lineHeight: 1.3, letterSpacing: '3%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'editorial-modern',
        name: 'Editorial Modern',
        category: 'mixed',
        fonts: {
            heading: { family: 'Abril Fatface', weight: '400', fallback: 'Georgia, serif' },
            body: { family: 'Lato', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 88, fontWeight: '400', lineHeight: 0.95, letterSpacing: '0%' },
            subtitle: { fontSize: 24, fontWeight: '300', lineHeight: 1.5, letterSpacing: '0%' },
            heading1: { fontSize: 56, fontWeight: '400', lineHeight: 1.05, letterSpacing: '0%' },
            heading2: { fontSize: 32, fontWeight: '400', lineHeight: 1.15, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0.5%' },
            label: { fontSize: 11, fontWeight: '700', lineHeight: 1.3, letterSpacing: '3%', textTransform: 'uppercase' }
        }
    },

    // ========================================
    // DISPLAY
    // ========================================
    {
        id: 'bold-statement',
        name: 'Bold Statement',
        category: 'display',
        fonts: {
            heading: { family: 'Bebas Neue', weight: '400', fallback: 'Impact, sans-serif' },
            body: { family: 'Open Sans', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 96, fontWeight: '400', lineHeight: 0.9, letterSpacing: '2%' },
            subtitle: { fontSize: 28, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 64, fontWeight: '400', lineHeight: 0.95, letterSpacing: '1%' },
            heading2: { fontSize: 44, fontWeight: '400', lineHeight: 1.0, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '600', lineHeight: 1.3, letterSpacing: '2%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'startup',
        name: 'Startup',
        category: 'display',
        fonts: {
            heading: { family: 'Oswald', weight: '700', fallback: 'Impact, sans-serif' },
            body: { family: 'DM Sans', weight: '400', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 84, fontWeight: '700', lineHeight: 0.95, letterSpacing: '0%' },
            subtitle: { fontSize: 28, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 56, fontWeight: '700', lineHeight: 1.0, letterSpacing: '0%' },
            heading2: { fontSize: 36, fontWeight: '500', lineHeight: 1.1, letterSpacing: '0%' },
            body: { fontSize: 18, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '500', lineHeight: 1.4, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '700', lineHeight: 1.3, letterSpacing: '3%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'fashion',
        name: 'Fashion',
        category: 'display',
        fonts: {
            heading: { family: 'Anton', weight: '400', fallback: 'Impact, sans-serif' },
            body: { family: 'Lato', weight: '300', fallback: 'system-ui, sans-serif' }
        },
        styles: {
            title: { fontSize: 100, fontWeight: '400', lineHeight: 0.85, letterSpacing: '0%' },
            subtitle: { fontSize: 24, fontWeight: '300', lineHeight: 1.5, letterSpacing: '3%' },
            heading1: { fontSize: 68, fontWeight: '400', lineHeight: 0.9, letterSpacing: '0%' },
            heading2: { fontSize: 44, fontWeight: '400', lineHeight: 0.95, letterSpacing: '0%' },
            body: { fontSize: 16, fontWeight: '300', lineHeight: 1.7, letterSpacing: '0.5%' },
            bodySmall: { fontSize: 14, fontWeight: '300', lineHeight: 1.6, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.5, letterSpacing: '1%' },
            label: { fontSize: 10, fontWeight: '400', lineHeight: 1.3, letterSpacing: '5%', textTransform: 'uppercase' }
        }
    },

    // ========================================
    // MONOSPACE
    // ========================================
    {
        id: 'developer',
        name: 'Developer',
        category: 'monospace',
        fonts: {
            heading: { family: 'JetBrains Mono', weight: '700', fallback: 'monospace' },
            body: { family: 'JetBrains Mono', weight: '400', fallback: 'monospace' }
        },
        styles: {
            title: { fontSize: 64, fontWeight: '700', lineHeight: 1.1, letterSpacing: '-1%' },
            subtitle: { fontSize: 24, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 44, fontWeight: '700', lineHeight: 1.15, letterSpacing: '0%' },
            heading2: { fontSize: 28, fontWeight: '500', lineHeight: 1.2, letterSpacing: '0%' },
            body: { fontSize: 16, fontWeight: '400', lineHeight: 1.7, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '500', lineHeight: 1.3, letterSpacing: '1%' }
        }
    },
    {
        id: 'retro-tech',
        name: 'Retro Tech',
        category: 'monospace',
        fonts: {
            heading: { family: 'IBM Plex Mono', weight: '600', fallback: 'monospace' },
            body: { family: 'IBM Plex Mono', weight: '400', fallback: 'monospace' }
        },
        styles: {
            title: { fontSize: 56, fontWeight: '600', lineHeight: 1.15, letterSpacing: '0%' },
            subtitle: { fontSize: 22, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 40, fontWeight: '600', lineHeight: 1.2, letterSpacing: '0%' },
            heading2: { fontSize: 28, fontWeight: '500', lineHeight: 1.25, letterSpacing: '0%' },
            body: { fontSize: 16, fontWeight: '400', lineHeight: 1.7, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '500', lineHeight: 1.3, letterSpacing: '2%', textTransform: 'uppercase' }
        }
    },
    {
        id: 'code',
        name: 'Code',
        category: 'monospace',
        fonts: {
            heading: { family: 'Fira Code', weight: '700', fallback: 'monospace' },
            body: { family: 'Fira Code', weight: '400', fallback: 'monospace' }
        },
        styles: {
            title: { fontSize: 60, fontWeight: '700', lineHeight: 1.1, letterSpacing: '0%' },
            subtitle: { fontSize: 24, fontWeight: '400', lineHeight: 1.4, letterSpacing: '0%' },
            heading1: { fontSize: 42, fontWeight: '700', lineHeight: 1.15, letterSpacing: '0%' },
            heading2: { fontSize: 28, fontWeight: '500', lineHeight: 1.2, letterSpacing: '0%' },
            body: { fontSize: 16, fontWeight: '400', lineHeight: 1.7, letterSpacing: '0%' },
            bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 1.6, letterSpacing: '0%' },
            caption: { fontSize: 12, fontWeight: '400', lineHeight: 1.5, letterSpacing: '0%' },
            label: { fontSize: 11, fontWeight: '500', lineHeight: 1.3, letterSpacing: '1%' }
        }
    }
];

/**
 * Get a preset by ID
 * @param {string} id - Preset identifier
 * @returns {Object|undefined} The preset object or undefined if not found
 */
export function getPresetById(id) {
    return FONT_PRESETS.find(preset => preset.id === id);
}

/**
 * Get presets filtered by category
 * @param {string} categoryId - Category identifier ('all' returns all)
 * @returns {Array} Filtered presets
 */
export function getPresetsByCategory(categoryId) {
    if (categoryId === 'all') {
        return FONT_PRESETS;
    }
    return FONT_PRESETS.filter(preset => preset.category === categoryId);
}

/**
 * Search presets by name
 * @param {string} query - Search query
 * @returns {Array} Matching presets
 */
export function searchPresets(query) {
    const lowerQuery = query.toLowerCase();
    return FONT_PRESETS.filter(preset => 
        preset.name.toLowerCase().includes(lowerQuery) ||
        preset.category.toLowerCase().includes(lowerQuery) ||
        preset.fonts.heading.family.toLowerCase().includes(lowerQuery) ||
        preset.fonts.body.family.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get the default font preset (used for new presentations)
 * @returns {Object} The default preset
 */
export function getDefaultFontPreset() {
    return getPresetById('modern-clean') || FONT_PRESETS[0];
}

/**
 * Get fonts by category for dropdowns
 * @param {string} categoryId - Category identifier ('all' returns all)
 * @returns {Array} Filtered fonts
 */
export function getFontsByCategory(categoryId) {
    if (categoryId === 'all') {
        return AVAILABLE_FONTS;
    }
    return AVAILABLE_FONTS.filter(font => font.category === categoryId);
}

export default {
    FONT_PRESETS,
    FONT_CATEGORIES,
    AVAILABLE_FONTS,
    getPresetById,
    getPresetsByCategory,
    searchPresets,
    getDefaultFontPreset,
    getFontsByCategory
};
