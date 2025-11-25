/**
 * ColorPresets.js
 * Predefined color theme presets for the Color Theme Manager.
 * Each preset provides all 12 color roles for a complete theme.
 */

/**
 * Color preset categories for filtering
 */
export const COLOR_CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'professional', name: 'Professional' },
    { id: 'creative', name: 'Creative' },
    { id: 'dark', name: 'Dark' },
    { id: 'light', name: 'Light' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'colorful', name: 'Colorful' }
];

/**
 * Color theme presets
 * Each preset contains all 12 color roles following the schema:
 * - background1, background2: Background colors
 * - text1, text2: Text colors
 * - accent1-6: Accent colors for emphasis, charts, etc.
 * - hyperlink, followedHyperlink: Link colors
 */
export const COLOR_PRESETS = [
    // ========================================
    // PROFESSIONAL
    // ========================================
    {
        id: 'corporate-blue',
        name: 'Corporate Blue',
        category: 'professional',
        colors: {
            background1: '#FFFFFF',
            background2: '#F4F7FA',
            text1: '#1A1A2E',
            text2: '#5C5C6E',
            accent1: '#0066CC',
            accent2: '#004499',
            accent3: '#00994D',
            accent4: '#CC3300',
            accent5: '#FF9900',
            accent6: '#6600CC',
            hyperlink: '#0066CC',
            followedHyperlink: '#551A8B'
        }
    },
    {
        id: 'executive',
        name: 'Executive',
        category: 'professional',
        colors: {
            background1: '#FFFFFF',
            background2: '#F5F5F5',
            text1: '#2C3E50',
            text2: '#7F8C8D',
            accent1: '#34495E',
            accent2: '#2C3E50',
            accent3: '#27AE60',
            accent4: '#E74C3C',
            accent5: '#F39C12',
            accent6: '#9B59B6',
            hyperlink: '#2980B9',
            followedHyperlink: '#8E44AD'
        }
    },
    {
        id: 'professional-gray',
        name: 'Professional Gray',
        category: 'professional',
        colors: {
            background1: '#FAFAFA',
            background2: '#EEEEEE',
            text1: '#333333',
            text2: '#666666',
            accent1: '#607D8B',
            accent2: '#455A64',
            accent3: '#4CAF50',
            accent4: '#F44336',
            accent5: '#FFC107',
            accent6: '#9C27B0',
            hyperlink: '#1976D2',
            followedHyperlink: '#7B1FA2'
        }
    },

    // ========================================
    // CREATIVE
    // ========================================
    {
        id: 'sunset-gradient',
        name: 'Sunset',
        category: 'creative',
        colors: {
            background1: '#FFF5F2',
            background2: '#FFE8E0',
            text1: '#4A2C2A',
            text2: '#7A5654',
            accent1: '#FF6B6B',
            accent2: '#FF8E72',
            accent3: '#FFB347',
            accent4: '#E74C3C',
            accent5: '#FFA07A',
            accent6: '#FF69B4',
            hyperlink: '#FF6B6B',
            followedHyperlink: '#C44569'
        }
    },
    {
        id: 'ocean-breeze',
        name: 'Ocean Breeze',
        category: 'creative',
        colors: {
            background1: '#F0F9FF',
            background2: '#E0F2FE',
            text1: '#0C4A6E',
            text2: '#0369A1',
            accent1: '#06B6D4',
            accent2: '#0891B2',
            accent3: '#14B8A6',
            accent4: '#F97316',
            accent5: '#FBBF24',
            accent6: '#A855F7',
            hyperlink: '#0284C7',
            followedHyperlink: '#7C3AED'
        }
    },
    {
        id: 'forest-green',
        name: 'Forest',
        category: 'creative',
        colors: {
            background1: '#F0FDF4',
            background2: '#DCFCE7',
            text1: '#14532D',
            text2: '#166534',
            accent1: '#22C55E',
            accent2: '#16A34A',
            accent3: '#84CC16',
            accent4: '#EF4444',
            accent5: '#EAB308',
            accent6: '#8B5CF6',
            hyperlink: '#15803D',
            followedHyperlink: '#7C3AED'
        }
    },
    {
        id: 'lavender-dream',
        name: 'Lavender Dream',
        category: 'creative',
        colors: {
            background1: '#FAF5FF',
            background2: '#F3E8FF',
            text1: '#581C87',
            text2: '#7E22CE',
            accent1: '#A855F7',
            accent2: '#9333EA',
            accent3: '#EC4899',
            accent4: '#EF4444',
            accent5: '#F59E0B',
            accent6: '#06B6D4',
            hyperlink: '#7C3AED',
            followedHyperlink: '#BE185D'
        }
    },

    // ========================================
    // DARK
    // ========================================
    {
        id: 'modern-dark',
        name: 'Modern Dark',
        category: 'dark',
        colors: {
            background1: '#1E1E1E',
            background2: '#2D2D2D',
            text1: '#FFFFFF',
            text2: '#AAAAAA',
            accent1: '#18A0FB',
            accent2: '#7B61FF',
            accent3: '#1BC47D',
            accent4: '#F24822',
            accent5: '#FFBE0B',
            accent6: '#FF006E',
            hyperlink: '#18A0FB',
            followedHyperlink: '#7B61FF'
        }
    },
    {
        id: 'midnight',
        name: 'Midnight',
        category: 'dark',
        colors: {
            background1: '#0F172A',
            background2: '#1E293B',
            text1: '#F8FAFC',
            text2: '#94A3B8',
            accent1: '#3B82F6',
            accent2: '#6366F1',
            accent3: '#10B981',
            accent4: '#EF4444',
            accent5: '#F59E0B',
            accent6: '#EC4899',
            hyperlink: '#60A5FA',
            followedHyperlink: '#A78BFA'
        }
    },
    {
        id: 'deep-purple',
        name: 'Deep Purple',
        category: 'dark',
        colors: {
            background1: '#1A1625',
            background2: '#2D2640',
            text1: '#F5F3FF',
            text2: '#C4B5FD',
            accent1: '#8B5CF6',
            accent2: '#A78BFA',
            accent3: '#34D399',
            accent4: '#FB7185',
            accent5: '#FBBF24',
            accent6: '#22D3EE',
            hyperlink: '#A78BFA',
            followedHyperlink: '#C4B5FD'
        }
    },
    {
        id: 'charcoal',
        name: 'Charcoal',
        category: 'dark',
        colors: {
            background1: '#18181B',
            background2: '#27272A',
            text1: '#FAFAFA',
            text2: '#A1A1AA',
            accent1: '#71717A',
            accent2: '#52525B',
            accent3: '#22C55E',
            accent4: '#EF4444',
            accent5: '#EAB308',
            accent6: '#A855F7',
            hyperlink: '#A1A1AA',
            followedHyperlink: '#71717A'
        }
    },

    // ========================================
    // LIGHT
    // ========================================
    {
        id: 'classic-light',
        name: 'Classic Light',
        category: 'light',
        colors: {
            background1: '#FFFFFF',
            background2: '#F5F5F5',
            text1: '#333333',
            text2: '#666666',
            accent1: '#18A0FB',
            accent2: '#7B61FF',
            accent3: '#1BC47D',
            accent4: '#F24822',
            accent5: '#FFBE0B',
            accent6: '#FF006E',
            hyperlink: '#0066CC',
            followedHyperlink: '#954F72'
        }
    },
    {
        id: 'soft-pastels',
        name: 'Soft Pastels',
        category: 'light',
        colors: {
            background1: '#FFFBF5',
            background2: '#FFF7ED',
            text1: '#44403C',
            text2: '#78716C',
            accent1: '#FDA4AF',
            accent2: '#C4B5FD',
            accent3: '#86EFAC',
            accent4: '#FCA5A5',
            accent5: '#FDE047',
            accent6: '#7DD3FC',
            hyperlink: '#F472B6',
            followedHyperlink: '#A78BFA'
        }
    },
    {
        id: 'warm-light',
        name: 'Warm Light',
        category: 'light',
        colors: {
            background1: '#FFFBEB',
            background2: '#FEF3C7',
            text1: '#78350F',
            text2: '#92400E',
            accent1: '#F59E0B',
            accent2: '#D97706',
            accent3: '#65A30D',
            accent4: '#DC2626',
            accent5: '#EA580C',
            accent6: '#7C3AED',
            hyperlink: '#B45309',
            followedHyperlink: '#9333EA'
        }
    },

    // ========================================
    // MINIMAL
    // ========================================
    {
        id: 'pure-white',
        name: 'Pure White',
        category: 'minimal',
        colors: {
            background1: '#FFFFFF',
            background2: '#FAFAFA',
            text1: '#000000',
            text2: '#525252',
            accent1: '#000000',
            accent2: '#404040',
            accent3: '#22C55E',
            accent4: '#EF4444',
            accent5: '#EAB308',
            accent6: '#3B82F6',
            hyperlink: '#000000',
            followedHyperlink: '#525252'
        }
    },
    {
        id: 'soft-gray',
        name: 'Soft Gray',
        category: 'minimal',
        colors: {
            background1: '#F9FAFB',
            background2: '#F3F4F6',
            text1: '#374151',
            text2: '#6B7280',
            accent1: '#4B5563',
            accent2: '#6B7280',
            accent3: '#10B981',
            accent4: '#EF4444',
            accent5: '#F59E0B',
            accent6: '#6366F1',
            hyperlink: '#374151',
            followedHyperlink: '#4B5563'
        }
    },
    {
        id: 'paper',
        name: 'Paper',
        category: 'minimal',
        colors: {
            background1: '#FFFEF7',
            background2: '#FDF6E3',
            text1: '#4A4A4A',
            text2: '#7A7A7A',
            accent1: '#2AA198',
            accent2: '#268BD2',
            accent3: '#859900',
            accent4: '#DC322F',
            accent5: '#B58900',
            accent6: '#D33682',
            hyperlink: '#268BD2',
            followedHyperlink: '#6C71C4'
        }
    },

    // ========================================
    // COLORFUL
    // ========================================
    {
        id: 'vibrant',
        name: 'Vibrant',
        category: 'colorful',
        colors: {
            background1: '#FFFFFF',
            background2: '#F0F0F0',
            text1: '#1A1A1A',
            text2: '#4A4A4A',
            accent1: '#FF3366',
            accent2: '#00CCFF',
            accent3: '#00FF99',
            accent4: '#FF6600',
            accent5: '#FFCC00',
            accent6: '#CC00FF',
            hyperlink: '#0099FF',
            followedHyperlink: '#9900FF'
        }
    },
    {
        id: 'rainbow',
        name: 'Rainbow',
        category: 'colorful',
        colors: {
            background1: '#FFFFFF',
            background2: '#F8F8F8',
            text1: '#2D3436',
            text2: '#636E72',
            accent1: '#E74C3C',
            accent2: '#E67E22',
            accent3: '#F1C40F',
            accent4: '#2ECC71',
            accent5: '#3498DB',
            accent6: '#9B59B6',
            hyperlink: '#3498DB',
            followedHyperlink: '#8E44AD'
        }
    },
    {
        id: 'neon',
        name: 'Neon',
        category: 'colorful',
        colors: {
            background1: '#0D0D0D',
            background2: '#1A1A1A',
            text1: '#FFFFFF',
            text2: '#CCCCCC',
            accent1: '#FF00FF',
            accent2: '#00FFFF',
            accent3: '#00FF00',
            accent4: '#FF0000',
            accent5: '#FFFF00',
            accent6: '#FF6600',
            hyperlink: '#00FFFF',
            followedHyperlink: '#FF00FF'
        }
    },
    {
        id: 'candy',
        name: 'Candy',
        category: 'colorful',
        colors: {
            background1: '#FFF0F5',
            background2: '#FFE4EC',
            text1: '#4A2040',
            text2: '#7A4070',
            accent1: '#FF69B4',
            accent2: '#FF1493',
            accent3: '#98FB98',
            accent4: '#FF6347',
            accent5: '#FFD700',
            accent6: '#BA55D3',
            hyperlink: '#FF1493',
            followedHyperlink: '#9932CC'
        }
    }
];

/**
 * Get a preset by ID
 * @param {string} id - Preset identifier
 * @returns {Object|undefined} The preset object or undefined if not found
 */
export function getPresetById(id) {
    return COLOR_PRESETS.find(preset => preset.id === id);
}

/**
 * Get presets filtered by category
 * @param {string} categoryId - Category identifier ('all' returns all)
 * @returns {Array} Filtered presets
 */
export function getPresetsByCategory(categoryId) {
    if (categoryId === 'all') {
        return COLOR_PRESETS;
    }
    return COLOR_PRESETS.filter(preset => preset.category === categoryId);
}

/**
 * Search presets by name
 * @param {string} query - Search query
 * @returns {Array} Matching presets
 */
export function searchPresets(query) {
    const lowerQuery = query.toLowerCase();
    return COLOR_PRESETS.filter(preset => 
        preset.name.toLowerCase().includes(lowerQuery) ||
        preset.category.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get the default preset (used for new presentations)
 * @returns {Object} The default preset
 */
export function getDefaultPreset() {
    return getPresetById('classic-light') || COLOR_PRESETS[0];
}

export default {
    COLOR_PRESETS,
    COLOR_CATEGORIES,
    getPresetById,
    getPresetsByCategory,
    searchPresets,
    getDefaultPreset
};
