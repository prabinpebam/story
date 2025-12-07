// ============================================
// PRESET SEPARATION ARCHITECTURE
// ============================================
// Design principles: 8px grid, harmonious type scale (1.25 ratio), modern color palette
// Canvas: 1920×1080 (16:9), Standard margins: 100px
// 
// CRITICAL: Slide Master Presets NEVER embed colors or typography.
// They only REFERENCE separate ColorThemePresets and TypographyStylePresets.
// This enables independent manipulation without conflicts.

// ============================================
// COLOR THEME PRESETS (Separate Library)
// ============================================
export const DEFAULT_COLOR_THEME_PRESETS = {
    "color-theme-default": {
        id: "color-theme-default",
        type: "colorThemePreset",
        name: "Default Colors",
        description: "Clean and professional",
        category: "Professional",
        isDark: false,
        colors: {
            // Background Colors - Clean and professional
            background1: "#FFFFFF",         // Pure white
            background2: "#F8FAFC",         // Slate 50 - subtle gray-blue
            // Text Colors - High contrast, easy to read
            text1: "#0F172A",               // Slate 900 - near black, softer than pure black
            text2: "#64748B",               // Slate 500 - medium gray for secondary text
            // Accent Colors - Vibrant, modern palette
            accent1: "#3B82F6",             // Blue 500 - Primary brand color
            accent2: "#8B5CF6",             // Violet 500 - Creative/highlight
            accent3: "#10B981",             // Emerald 500 - Success/positive
            accent4: "#F59E0B",             // Amber 500 - Warning/attention
            accent5: "#EF4444",             // Red 500 - Alert/important
            accent6: "#06B6D4",             // Cyan 500 - Info/cool accent
            // Link Colors
            hyperlink: "#2563EB",           // Blue 600
            followedHyperlink: "#7C3AED"    // Violet 600
        }
    }
};

// ============================================
// TYPOGRAPHY STYLE PRESETS (Separate Library)
// ============================================
export const DEFAULT_TYPOGRAPHY_STYLE_PRESETS = {
    "typo-style-default": {
        id: "typo-style-default",
        type: "typographyStylePreset",
        name: "Modern Sans",
        description: "Clean geometric sans-serif for contemporary presentations",
        category: "Sans Serif",
        fonts: {
            heading: "Inter",
            body: "Inter",
            monospace: "Fira Code"
        },
        // Text Styles - Harmonious type scale using 1.25 ratio
        textStyles: {
                "display": {
                    id: "display",
                    name: "Display",
                    fontFamily: "var(--theme-font-heading)",
                    fontSize: 80,
                    fontWeight: "800",
                    lineHeight: 1.0,
                    letterSpacing: "-2%",
                    textFill: { type: "solid", value: "var(--theme-text-primary)" }
                },
                "title": {
                    id: "title",
                    name: "Title",
                    fontFamily: "var(--theme-font-heading)",
                    fontSize: 56,
                    fontWeight: "700",
                    lineHeight: 1.1,
                    letterSpacing: "-1%",
                    textFill: { type: "solid", value: "var(--theme-text-primary)" }
                },
                "subtitle": {
                    id: "subtitle",
                    name: "Subtitle",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 28,
                    fontWeight: "400",
                    lineHeight: 1.35,
                    letterSpacing: "0%",
                    textFill: { type: "solid", value: "var(--theme-text-secondary)" }
                },
                "heading1": {
                    id: "heading1",
                    name: "Heading 1",
                    fontFamily: "var(--theme-font-heading)",
                    fontSize: 44,
                    fontWeight: "700",
                    lineHeight: 1.2,
                    letterSpacing: "-0.5%",
                    textFill: { type: "solid", value: "var(--theme-text-primary)" }
                },
                "heading2": {
