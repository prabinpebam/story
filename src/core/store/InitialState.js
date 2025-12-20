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
    // Intentionally empty: built-in luma-locked theme presets live in
    // src/ui/panels/color-theme/ThemePresets.js and are resolved via StyleResolver.
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
                    id: "heading2",
                    name: "Heading 2",
                    fontFamily: "var(--theme-font-heading)",
                    fontSize: 32,
                    fontWeight: "600",
                    lineHeight: 1.25,
                    letterSpacing: "0%",
                    textFill: { type: "solid", value: "var(--theme-text-primary)" }
                },
                "heading3": {
                    id: "heading3",
                    name: "Heading 3",
                    fontFamily: "var(--theme-font-heading)",
                    fontSize: 24,
                    fontWeight: "600",
                    lineHeight: 1.3,
                    letterSpacing: "0%",
                    textFill: { type: "solid", value: "var(--theme-text-primary)" }
                },
                "body": {
                    id: "body",
                    name: "Body",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 20,
                    fontWeight: "400",
                    lineHeight: 1.6,
                    letterSpacing: "0%",
                    textFill: { type: "solid", value: "var(--theme-text-primary)" }
                },
                "bodyLarge": {
                    id: "bodyLarge",
                    name: "Body Large",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 24,
                    fontWeight: "400",
                    lineHeight: 1.5,
                    letterSpacing: "0%",
                    textFill: { type: "solid", value: "var(--theme-text-primary)" }
                },
                "bodySmall": {
                    id: "bodySmall",
                    name: "Body Small",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 16,
                    fontWeight: "400",
                    lineHeight: 1.5,
                    letterSpacing: "0%",
                    textFill: { type: "solid", value: "var(--theme-text-secondary)" }
                },
                "caption": {
                    id: "caption",
                    name: "Caption",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 14,
                    fontWeight: "500",
                    lineHeight: 1.4,
                    letterSpacing: "0.5%",
                    textFill: { type: "solid", value: "var(--theme-text-secondary)" }
                },
                "label": {
                    id: "label",
                    name: "Label",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 12,
                    fontWeight: "600",
                    lineHeight: 1.3,
                    letterSpacing: "3%",
                    textTransform: "uppercase",
                    textFill: { type: "solid", value: "var(--theme-text-secondary)" }
                },
                "quote": {
                    id: "quote",
                    name: "Quote",
                    fontFamily: "var(--theme-font-heading)",
                    fontSize: 40,
                    fontWeight: "400",
                    fontStyle: "italic",
                    lineHeight: 1.4,
                    letterSpacing: "0%",
                    textFill: { type: "solid", value: "var(--theme-text-primary)" }
                },
                "stat": {
                    id: "stat",
                    name: "Stat",
                    fontFamily: "var(--theme-font-heading)",
                    fontSize: 144,
                    fontWeight: "800",
                    lineHeight: 1.0,
                    letterSpacing: "-2%",
                    textFill: { type: "solid", themeSlot: 4, value: "#3B82F6" }
                }
            }
        },
    
    "typo-style-professional": {
        id: "typo-style-professional",
        type: "typographyStylePreset",
        name: "Professional",
        description: "Traditional serif for formal business presentations",
        category: "Serif",
        fonts: {
            heading: "Playfair Display",
            body: "Source Sans Pro",
            monospace: "Fira Code"
        },
        textStyles: {
            "display": {
                id: "display",
                name: "Display",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 88,
                fontWeight: "900",
                lineHeight: 1.0,
                letterSpacing: "-2%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "title": {
                id: "title",
                name: "Title",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 64,
                fontWeight: "700",
                lineHeight: 1.1,
                letterSpacing: "-1%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "subtitle": {
                id: "subtitle",
                name: "Subtitle",
                fontFamily: "var(--theme-font-body)",
                fontSize: 32,
                fontWeight: "400",
                lineHeight: 1.4,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "heading1": {
                id: "heading1",
                name: "Heading 1",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 48,
                fontWeight: "700",
                lineHeight: 1.2,
                letterSpacing: "-0.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading2": {
                id: "heading2",
                name: "Heading 2",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 36,
                fontWeight: "600",
                lineHeight: 1.25,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading3": {
                id: "heading3",
                name: "Heading 3",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 28,
                fontWeight: "600",
                lineHeight: 1.3,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "body": {
                id: "body",
                name: "Body",
                fontFamily: "var(--theme-font-body)",
                fontSize: 20,
                fontWeight: "400",
                lineHeight: 1.7,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodyLarge": {
                id: "bodyLarge",
                name: "Body Large",
                fontFamily: "var(--theme-font-body)",
                fontSize: 24,
                fontWeight: "400",
                lineHeight: 1.6,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodySmall": {
                id: "bodySmall",
                name: "Body Small",
                fontFamily: "var(--theme-font-body)",
                fontSize: 16,
                fontWeight: "400",
                lineHeight: 1.6,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "caption": {
                id: "caption",
                name: "Caption",
                fontFamily: "var(--theme-font-body)",
                fontSize: 14,
                fontWeight: "500",
                lineHeight: 1.5,
                letterSpacing: "0.5%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "label": {
                id: "label",
                name: "Label",
                fontFamily: "var(--theme-font-body)",
                fontSize: 12,
                fontWeight: "600",
                lineHeight: 1.3,
                letterSpacing: "3%",
                textTransform: "uppercase",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "quote": {
                id: "quote",
                name: "Quote",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 40,
                fontWeight: "400",
                fontStyle: "italic",
                lineHeight: 1.4,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "stat": {
                id: "stat",
                name: "Stat",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 144,
                fontWeight: "800",
                lineHeight: 1.0,
                letterSpacing: "-2%",
                textFill: { type: "solid", themeSlot: 4, value: "#3B82F6" }
            }
        }
    },
    
    "typo-style-editorial": {
        id: "typo-style-editorial",
        type: "typographyStylePreset",
        name: "Editorial",
        description: "Magazine-style typography for content-heavy presentations",
        category: "Serif",
        fonts: {
            heading: "Merriweather",
            body: "Open Sans",
            monospace: "Fira Code"
        },
        textStyles: {
            "display": {
                id: "display",
                name: "Display",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 72,
                fontWeight: "900",
                lineHeight: 1.0,
                letterSpacing: "-1.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "title": {
                id: "title",
                name: "Title",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 52,
                fontWeight: "700",
                lineHeight: 1.15,
                letterSpacing: "-0.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "subtitle": {
                id: "subtitle",
                name: "Subtitle",
                fontFamily: "var(--theme-font-body)",
                fontSize: 26,
                fontWeight: "400",
                lineHeight: 1.5,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "heading1": {
                id: "heading1",
                name: "Heading 1",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 40,
                fontWeight: "700",
                lineHeight: 1.2,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading2": {
                id: "heading2",
                name: "Heading 2",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 30,
                fontWeight: "700",
                lineHeight: 1.3,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading3": {
                id: "heading3",
                name: "Heading 3",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 24,
                fontWeight: "700",
                lineHeight: 1.35,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "body": {
                id: "body",
                name: "Body",
                fontFamily: "var(--theme-font-body)",
                fontSize: 18,
                fontWeight: "400",
                lineHeight: 1.8,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodyLarge": {
                id: "bodyLarge",
                name: "Body Large",
                fontFamily: "var(--theme-font-body)",
                fontSize: 22,
                fontWeight: "400",
                lineHeight: 1.7,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodySmall": {
                id: "bodySmall",
                name: "Body Small",
                fontFamily: "var(--theme-font-body)",
                fontSize: 15,
                fontWeight: "400",
                lineHeight: 1.7,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "caption": {
                id: "caption",
                name: "Caption",
                fontFamily: "var(--theme-font-body)",
                fontSize: 13,
                fontWeight: "500",
                lineHeight: 1.5,
                letterSpacing: "0.5%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "label": {
                id: "label",
                name: "Label",
                fontFamily: "var(--theme-font-body)",
                fontSize: 11,
                fontWeight: "700",
                lineHeight: 1.3,
                letterSpacing: "4%",
                textTransform: "uppercase",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "quote": {
                id: "quote",
                name: "Quote",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 40,
                fontWeight: "400",
                fontStyle: "italic",
                lineHeight: 1.4,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "stat": {
                id: "stat",
                name: "Stat",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 144,
                fontWeight: "800",
                lineHeight: 1.0,
                letterSpacing: "-2%",
                textFill: { type: "solid", themeSlot: 4, value: "#3B82F6" }
            }
        }
    },
    
    "typo-style-tech": {
        id: "typo-style-tech",
        type: "typographyStylePreset",
        name: "Tech",
        description: "Futuristic monospace and geometric fonts for tech presentations",
        category: "Monospace",
        fonts: {
            heading: "Space Grotesk",
            body: "IBM Plex Sans",
            monospace: "Fira Code"
        },
        textStyles: {
            "display": {
                id: "display",
                name: "Display",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 76,
                fontWeight: "700",
                lineHeight: 0.95,
                letterSpacing: "-1%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "title": {
                id: "title",
                name: "Title",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 54,
                fontWeight: "700",
                lineHeight: 1.05,
                letterSpacing: "-0.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "subtitle": {
                id: "subtitle",
                name: "Subtitle",
                fontFamily: "var(--theme-font-body)",
                fontSize: 28,
                fontWeight: "300",
                lineHeight: 1.4,
                letterSpacing: "0.5%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "heading1": {
                id: "heading1",
                name: "Heading 1",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 42,
                fontWeight: "700",
                lineHeight: 1.15,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading2": {
                id: "heading2",
                name: "Heading 2",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 32,
                fontWeight: "600",
                lineHeight: 1.2,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading3": {
                id: "heading3",
                name: "Heading 3",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 24,
                fontWeight: "600",
                lineHeight: 1.25,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "body": {
                id: "body",
                name: "Body",
                fontFamily: "var(--theme-font-body)",
                fontSize: 19,
                fontWeight: "400",
                lineHeight: 1.65,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodyLarge": {
                id: "bodyLarge",
                name: "Body Large",
                fontFamily: "var(--theme-font-body)",
                fontSize: 23,
                fontWeight: "400",
                lineHeight: 1.6,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodySmall": {
                id: "bodySmall",
                name: "Body Small",
                fontFamily: "var(--theme-font-body)",
                fontSize: 16,
                fontWeight: "400",
                lineHeight: 1.6,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "caption": {
                id: "caption",
                name: "Caption",
                fontFamily: "var(--theme-font-monospace)",
                fontSize: 13,
                fontWeight: "500",
                lineHeight: 1.4,
                letterSpacing: "1%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "label": {
                id: "label",
                name: "Label",
                fontFamily: "var(--theme-font-monospace)",
                fontSize: 11,
                fontWeight: "600",
                lineHeight: 1.3,
                letterSpacing: "4%",
                textTransform: "uppercase",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "quote": {
                id: "quote",
                name: "Quote",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 40,
                fontWeight: "400",
                fontStyle: "italic",
                lineHeight: 1.4,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "stat": {
                id: "stat",
                name: "Stat",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 144,
                fontWeight: "800",
                lineHeight: 1.0,
                letterSpacing: "-2%",
                textFill: { type: "solid", themeSlot: 4, value: "#3B82F6" }
            }
        }
    },
    
    "typo-style-elegant": {
        id: "typo-style-elegant",
        type: "typographyStylePreset",
        name: "Elegant",
        description: "Sophisticated serif pairing for luxury and fashion",
        category: "Serif",
        fonts: {
            heading: "Cormorant Garamond",
            body: "Lato",
            monospace: "Fira Code"
        },
        textStyles: {
            "display": {
                id: "display",
                name: "Display",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 96,
                fontWeight: "300",
                lineHeight: 0.95,
                letterSpacing: "-2%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "title": {
                id: "title",
                name: "Title",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 68,
                fontWeight: "400",
                lineHeight: 1.05,
                letterSpacing: "-1%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "subtitle": {
                id: "subtitle",
                name: "Subtitle",
                fontFamily: "var(--theme-font-body)",
                fontSize: 30,
                fontWeight: "300",
                lineHeight: 1.45,
                letterSpacing: "1%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "heading1": {
                id: "heading1",
                name: "Heading 1",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 52,
                fontWeight: "500",
                lineHeight: 1.15,
                letterSpacing: "-0.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading2": {
                id: "heading2",
                name: "Heading 2",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 38,
                fontWeight: "500",
                lineHeight: 1.2,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading3": {
                id: "heading3",
                name: "Heading 3",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 28,
                fontWeight: "600",
                lineHeight: 1.25,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "body": {
                id: "body",
                name: "Body",
                fontFamily: "var(--theme-font-body)",
                fontSize: 20,
                fontWeight: "300",
                lineHeight: 1.75,
                letterSpacing: "0.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodyLarge": {
                id: "bodyLarge",
                name: "Body Large",
                fontFamily: "var(--theme-font-body)",
                fontSize: 25,
                fontWeight: "300",
                lineHeight: 1.7,
                letterSpacing: "0.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodySmall": {
                id: "bodySmall",
                name: "Body Small",
                fontFamily: "var(--theme-font-body)",
                fontSize: 17,
                fontWeight: "400",
                lineHeight: 1.7,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "caption": {
                id: "caption",
                name: "Caption",
                fontFamily: "var(--theme-font-body)",
                fontSize: 14,
                fontWeight: "400",
                lineHeight: 1.5,
                letterSpacing: "1%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "label": {
                id: "label",
                name: "Label",
                fontFamily: "var(--theme-font-body)",
                fontSize: 11,
                fontWeight: "700",
                lineHeight: 1.3,
                letterSpacing: "5%",
                textTransform: "uppercase",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "quote": {
                id: "quote",
                name: "Quote",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 40,
                fontWeight: "400",
                fontStyle: "italic",
                lineHeight: 1.4,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "stat": {
                id: "stat",
                name: "Stat",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 144,
                fontWeight: "800",
                lineHeight: 1.0,
                letterSpacing: "-2%",
                textFill: { type: "solid", themeSlot: 4, value: "#3B82F6" }
            }
        }
    },
    
    "typo-style-playful": {
        id: "typo-style-playful",
        type: "typographyStylePreset",
        name: "Playful",
        description: "Fun rounded fonts for creative and youthful presentations",
        category: "Display",
        fonts: {
            heading: "Nunito",
            body: "Quicksand",
            monospace: "Fira Code"
        },
        textStyles: {
            "display": {
                id: "display",
                name: "Display",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 84,
                fontWeight: "900",
                lineHeight: 1.0,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "title": {
                id: "title",
                name: "Title",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 60,
                fontWeight: "800",
                lineHeight: 1.1,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "subtitle": {
                id: "subtitle",
                name: "Subtitle",
                fontFamily: "var(--theme-font-body)",
                fontSize: 30,
                fontWeight: "500",
                lineHeight: 1.35,
                letterSpacing: "0.5%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "heading1": {
                id: "heading1",
                name: "Heading 1",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 46,
                fontWeight: "800",
                lineHeight: 1.2,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading2": {
                id: "heading2",
                name: "Heading 2",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 34,
                fontWeight: "700",
                lineHeight: 1.25,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading3": {
                id: "heading3",
                name: "Heading 3",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 26,
                fontWeight: "700",
                lineHeight: 1.3,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "body": {
                id: "body",
                name: "Body",
                fontFamily: "var(--theme-font-body)",
                fontSize: 20,
                fontWeight: "500",
                lineHeight: 1.55,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodyLarge": {
                id: "bodyLarge",
                name: "Body Large",
                fontFamily: "var(--theme-font-body)",
                fontSize: 25,
                fontWeight: "500",
                lineHeight: 1.5,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodySmall": {
                id: "bodySmall",
                name: "Body Small",
                fontFamily: "var(--theme-font-body)",
                fontSize: 17,
                fontWeight: "500",
                lineHeight: 1.5,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "caption": {
                id: "caption",
                name: "Caption",
                fontFamily: "var(--theme-font-body)",
                fontSize: 14,
                fontWeight: "600",
                lineHeight: 1.4,
                letterSpacing: "0.5%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "label": {
                id: "label",
                name: "Label",
                fontFamily: "var(--theme-font-body)",
                fontSize: 12,
                fontWeight: "700",
                lineHeight: 1.3,
                letterSpacing: "2%",
                textTransform: "uppercase",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "quote": {
                id: "quote",
                name: "Quote",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 40,
                fontWeight: "400",
                fontStyle: "italic",
                lineHeight: 1.4,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "stat": {
                id: "stat",
                name: "Stat",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 144,
                fontWeight: "800",
                lineHeight: 1.0,
                letterSpacing: "-2%",
                textFill: { type: "solid", themeSlot: 4, value: "#3B82F6" }
            }
        }
    },
    
    "typo-style-corporate": {
        id: "typo-style-corporate",
        type: "typographyStylePreset",
        name: "Corporate",
        description: "Professional sans-serif for business presentations",
        category: "Sans Serif",
        fonts: {
            heading: "Montserrat",
            body: "Roboto",
            monospace: "Fira Code"
        },
        textStyles: {
            "display": {
                id: "display",
                name: "Display",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 78,
                fontWeight: "800",
                lineHeight: 1.0,
                letterSpacing: "-1.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "title": {
                id: "title",
                name: "Title",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 56,
                fontWeight: "700",
                lineHeight: 1.1,
                letterSpacing: "-0.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "subtitle": {
                id: "subtitle",
                name: "Subtitle",
                fontFamily: "var(--theme-font-body)",
                fontSize: 28,
                fontWeight: "400",
                lineHeight: 1.4,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "heading1": {
                id: "heading1",
                name: "Heading 1",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 42,
                fontWeight: "700",
                lineHeight: 1.2,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading2": {
                id: "heading2",
                name: "Heading 2",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 32,
                fontWeight: "600",
                lineHeight: 1.25,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading3": {
                id: "heading3",
                name: "Heading 3",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 24,
                fontWeight: "600",
                lineHeight: 1.3,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "body": {
                id: "body",
                name: "Body",
                fontFamily: "var(--theme-font-body)",
                fontSize: 19,
                fontWeight: "400",
                lineHeight: 1.6,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodyLarge": {
                id: "bodyLarge",
                name: "Body Large",
                fontFamily: "var(--theme-font-body)",
                fontSize: 23,
                fontWeight: "400",
                lineHeight: 1.55,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodySmall": {
                id: "bodySmall",
                name: "Body Small",
                fontFamily: "var(--theme-font-body)",
                fontSize: 16,
                fontWeight: "400",
                lineHeight: 1.55,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "caption": {
                id: "caption",
                name: "Caption",
                fontFamily: "var(--theme-font-body)",
                fontSize: 13,
                fontWeight: "500",
                lineHeight: 1.4,
                letterSpacing: "0.5%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "label": {
                id: "label",
                name: "Label",
                fontFamily: "var(--theme-font-body)",
                fontSize: 11,
                fontWeight: "700",
                lineHeight: 1.3,
                letterSpacing: "4%",
                textTransform: "uppercase",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            }
        }
    },
    
    "typo-style-minimal": {
        id: "typo-style-minimal",
        type: "typographyStylePreset",
        name: "Minimal",
        description: "Clean and minimalist typography for modern presentations",
        category: "Sans Serif",
        fonts: {
            heading: "Work Sans",
            body: "Work Sans",
            monospace: "Fira Code"
        },
        textStyles: {
            "display": {
                id: "display",
                name: "Display",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 80,
                fontWeight: "300",
                lineHeight: 1.0,
                letterSpacing: "-2%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "title": {
                id: "title",
                name: "Title",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 56,
                fontWeight: "500",
                lineHeight: 1.1,
                letterSpacing: "-1%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "subtitle": {
                id: "subtitle",
                name: "Subtitle",
                fontFamily: "var(--theme-font-body)",
                fontSize: 28,
                fontWeight: "300",
                lineHeight: 1.4,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "heading1": {
                id: "heading1",
                name: "Heading 1",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 44,
                fontWeight: "600",
                lineHeight: 1.2,
                letterSpacing: "-0.5%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading2": {
                id: "heading2",
                name: "Heading 2",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 32,
                fontWeight: "500",
                lineHeight: 1.25,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "heading3": {
                id: "heading3",
                name: "Heading 3",
                fontFamily: "var(--theme-font-heading)",
                fontSize: 24,
                fontWeight: "500",
                lineHeight: 1.3,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "body": {
                id: "body",
                name: "Body",
                fontFamily: "var(--theme-font-body)",
                fontSize: 20,
                fontWeight: "300",
                lineHeight: 1.65,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodyLarge": {
                id: "bodyLarge",
                name: "Body Large",
                fontFamily: "var(--theme-font-body)",
                fontSize: 24,
                fontWeight: "300",
                lineHeight: 1.6,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-primary)" }
            },
            "bodySmall": {
                id: "bodySmall",
                name: "Body Small",
                fontFamily: "var(--theme-font-body)",
                fontSize: 16,
                fontWeight: "400",
                lineHeight: 1.6,
                letterSpacing: "0%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "caption": {
                id: "caption",
                name: "Caption",
                fontFamily: "var(--theme-font-body)",
                fontSize: 14,
                fontWeight: "400",
                lineHeight: 1.5,
                letterSpacing: "0.5%",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            },
            "label": {
                id: "label",
                name: "Label",
                fontFamily: "var(--theme-font-body)",
                fontSize: 12,
                fontWeight: "500",
                lineHeight: 1.3,
                letterSpacing: "3%",
                textTransform: "uppercase",
                textFill: { type: "solid", value: "var(--theme-text-secondary)" }
            }
        }
    }
};

// ============================================
// SLIDE MASTER PRESETS (Structure + References)
// ============================================
export const DEFAULT_MASTERS = {
    "master-default": {
        id: "master-default",
        type: "slideMasterPreset",
        name: "Default Master",
        // REFERENCES ONLY (never embed actual colors/typography)
        // Must reference an existing built-in color theme preset (no "Default" theme).
        colorThemeId: "preset_neutral",
        typographyStyleId: "typo-style-default",
        // Slide background is theme-linked (slot-based) and independent of app chrome
        // Use a highlight slot so light/dark inversion preserves contrast.
        background: { type: "solid", themeSlot: 11, value: "#FFFFFF" },
        elements: {},
        elementOrder: [],
        // Layout guide defaults for this master preset.
        // Layout masters should override ONLY the column count to match their structure.
        layoutGuide: {
            enabled: true,
            margins: { top: 40, right: 40, bottom: 40, left: 40 },
            marginsLinked: true,
            columns: { gutter: 20 },
            appearance: { color: '#FF0000', opacity: 10 }
        },
        // Layout IDs managed by this master
        layoutIds: [
            "layout-title",
            "layout-title-content",
            "layout-section-header",
            "layout-two-column",
            "layout-comparison",
            "layout-title-only",
            "layout-content-caption",
            "layout-picture-with-caption",
            "layout-quote",
            "layout-big-number",
            "layout-three-column",
            "layout-blank"
        ]
    },
    // ============================================
    // LAYOUT MASTERS
    // ============================================
    
    // Title Slide - Maximum visual impact for opening slides
    // Centered layout with large display text
    "layout-title": {
        id: "layout-title",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Title Slide",
        background: null,
        // Preset references (null = inherit from parent master)
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 1 }
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                textStyleId: "display",
                content: "<h1>Click to add title</h1>",
                x: 40, y: 320, width: 1840, height: 240,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "center", verticalAlign: "middle" }
            },
            "placeholder-subtitle": {
                id: "placeholder-subtitle",
                type: "text",
                isPlaceholder: true,
                placeholderType: "subtitle",
                textStyleId: "subtitle",
                content: "<p>Click to add subtitle</p>",
                x: 40, y: 580, width: 1840, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "center", verticalAlign: "middle" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-subtitle"]
    },
    // Title and Content - Standard content slide with title
    // Clean layout with ample breathing room
    "layout-title-content": {
        id: "layout-title-content",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Title and Content",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 1 }
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                textStyleId: "heading1",
                content: "<h1>Click to add title</h1>",
                x: 40, y: 40, width: 1840, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            },
            "placeholder-body": {
                id: "placeholder-body",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                textStyleId: "bodyLarge",
                content: "<p>Click to add text</p>",
                x: 40, y: 180, width: 1840, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-body"]
    },
    // Section Header - Bold visual break between sections
    // Large left-aligned title, vertically centered
    "layout-section-header": {
        id: "layout-section-header",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Section Header",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 1 }
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                textStyleId: "title",
                content: "<h1>Section Title</h1>",
                x: 40, y: 380, width: 1840, height: 160,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            },
            "placeholder-subtitle": {
                id: "placeholder-subtitle",
                type: "text",
                isPlaceholder: true,
                placeholderType: "subtitle",
                textStyleId: "bodyLarge",
                textFill: { type: "solid", themeSlot: 3, value: "#64748B" },
                content: "<p>Optional description for this section</p>",
                x: 40, y: 560, width: 1840, height: 100,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-subtitle"]
    },
    // Two Column - Side-by-side content layout
    // Equal columns with 60px gutter for visual separation
    "layout-two-column": {
        id: "layout-two-column",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Two Column",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 2 }
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                textStyleId: "heading1",
                content: "<h1>Click to add title</h1>",
                x: 40, y: 40, width: 1840, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            },
            "placeholder-left": {
                id: "placeholder-left",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                textStyleId: "body",
                content: "<p>Click to add text</p>",
                x: 40, y: 180, width: 910, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            },
            "placeholder-right": {
                id: "placeholder-right",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "body",
                content: "<p>Click to add text</p>",
                x: 970, y: 180, width: 910, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-left", "placeholder-right"]
    },
    // Comparison - Side-by-side with headers for comparing items
    // Each column has its own header for labeling
    "layout-comparison": {
        id: "layout-comparison",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Comparison",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 2 }
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                textStyleId: "heading1",
                content: "<h1>Click to add title</h1>",
                x: 40, y: 40, width: 1840, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            },
            "placeholder-left-header": {
                id: "placeholder-left-header",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "heading3",
                textFill: { type: "solid", themeSlot: 4, value: "#3B82F6" },
                content: "<p>Option A</p>",
                x: 40, y: 180, width: 910, height: 60,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            },
            "placeholder-left-content": {
                id: "placeholder-left-content",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "body",
                content: "<p>Click to add text</p>",
                x: 40, y: 260, width: 910, height: 780,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            },
            "placeholder-right-header": {
                id: "placeholder-right-header",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "heading3",
                textFill: { type: "solid", themeSlot: 5, value: "#8B5CF6" },
                content: "<p>Option B</p>",
                x: 970, y: 180, width: 910, height: 60,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            },
            "placeholder-right-content": {
                id: "placeholder-right-content",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "body",
                content: "<p>Click to add text</p>",
                x: 970, y: 260, width: 910, height: 780,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-left-header", "placeholder-left-content", "placeholder-right-header", "placeholder-right-content"]
    },
    // Title Only - Minimal layout for custom content
    "layout-title-only": {
        id: "layout-title-only",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Title Only",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 1 }
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                textStyleId: "heading1",
                content: "<h1>Click to add title</h1>",
                x: 40, y: 40, width: 1840, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            }
        },
        elementOrder: ["placeholder-title"]
    },
    // Blank - Empty canvas for complete freedom
    "layout-blank": {
        id: "layout-blank",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Blank",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 1 }
        },
        elements: {},
        elementOrder: []
    },
    // Content with Caption - Main content with sidebar annotation
    // 2/3 content, 1/3 caption for notes or supporting info
    "layout-content-caption": {
        id: "layout-content-caption",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Content with Caption",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 3 }
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                textStyleId: "heading1",
                content: "<h1>Click to add title</h1>",
                x: 40, y: 40, width: 1840, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            },
            "placeholder-body": {
                id: "placeholder-body",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                textStyleId: "bodyLarge",
                content: "<p>Click to add text</p>",
                x: 40, y: 180, width: 1220, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            },
            "placeholder-caption": {
                id: "placeholder-caption",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "bodySmall",
                content: "<p>Add notes or supporting information here</p>",
                x: 1280, y: 180, width: 600, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                textFill: { type: "solid", themeSlot: 3, value: "#64748B" },
                style: { textAlign: "left", verticalAlign: "top" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-body", "placeholder-caption"]
    },
    // Picture with Caption - Image-focused with descriptive text
    // Large image area with sidebar for context
    "layout-picture-with-caption": {
        id: "layout-picture-with-caption",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Picture with Caption",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 3 }
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                textStyleId: "heading1",
                content: "<h1>Click to add title</h1>",
                x: 40, y: 40, width: 1840, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            },
            "placeholder-picture": {
                id: "placeholder-picture",
                type: "text",
                isPlaceholder: true,
                placeholderType: "picture",
                textStyleId: "bodyLarge",
                textFill: { type: "solid", themeSlot: 3, value: "#64748B" },
                backgroundFill: { type: "solid", themeSlot: 1, value: "#E2E8F0" },
                borderRadius: 8,
                content: "<p>🖼️ Click to add picture</p>",
                x: 40, y: 180, width: 1220, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "center", verticalAlign: "middle" }
            },
            "placeholder-caption": {
                id: "placeholder-caption",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "bodySmall",
                textFill: { type: "solid", themeSlot: 3, value: "#64748B" },
                content: "<p>Add image caption or description here</p>",
                x: 1280, y: 180, width: 600, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-picture", "placeholder-caption"]
    },
    // Quote - Feature a memorable quote or statement
    // Centered large text with attribution
    "layout-quote": {
        id: "layout-quote",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Quote",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 1 }
        },
        elements: {
            "placeholder-quote": {
                id: "placeholder-quote",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "quote",
                content: "<p>\"Click to add your quote here\"</p>",
                x: 40, y: 300, width: 1840, height: 360,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "center", verticalAlign: "middle" }
            },
            "placeholder-attribution": {
                id: "placeholder-attribution",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "body",
                textFill: { type: "solid", themeSlot: 3, value: "#64748B" },
                content: "<p>— Attribution</p>",
                x: 40, y: 680, width: 1840, height: 80,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "center", verticalAlign: "top" }
            }
        },
        elementOrder: ["placeholder-quote", "placeholder-attribution"]
    },
    // Big Number - Highlight a statistic or key metric
    // Large centered number with label and description
    "layout-big-number": {
        id: "layout-big-number",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Big Number",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 1 }
        },
        elements: {
            "placeholder-label": {
                id: "placeholder-label",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "label",
                textFill: { type: "solid", themeSlot: 3, value: "#64748B" },
                content: "<p>METRIC</p>",
                x: 40, y: 300, width: 1840, height: 60,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "center", verticalAlign: "bottom" }
            },
            "placeholder-number": {
                id: "placeholder-number",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "stat",
                content: "<p>100%</p>",
                x: 40, y: 380, width: 1840, height: 260,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "center", verticalAlign: "middle" }
            },
            "placeholder-description": {
                id: "placeholder-description",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "bodyLarge",
                textFill: { type: "solid", themeSlot: 3, value: "#64748B" },
                content: "<p>Add context or description for this number</p>",
                x: 40, y: 660, width: 1840, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "center", verticalAlign: "top" }
            }
        },
        elementOrder: ["placeholder-label", "placeholder-number", "placeholder-description"]
    },
    // Three Column - For comparing multiple items
    // Three equal columns with optional headers
    "layout-three-column": {
        id: "layout-three-column",
        type: "layoutMaster",
        parentMasterId: "master-default",
        name: "Three Column",
        background: null,
        colorThemeId: null,
        typographyStyleId: null,
        layoutGuide: {
            columns: { count: 3 }
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                textStyleId: "heading1",
                content: "<h1>Click to add title</h1>",
                x: 40, y: 40, width: 1840, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "middle" }
            },
            "placeholder-col1": {
                id: "placeholder-col1",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                textStyleId: "body",
                content: "<p>Column 1</p>",
                x: 40, y: 180, width: 600, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            },
            "placeholder-col2": {
                id: "placeholder-col2",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "body",
                content: "<p>Column 2</p>",
                x: 660, y: 180, width: 600, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            },
            "placeholder-col3": {
                id: "placeholder-col3",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                textStyleId: "body",
                content: "<p>Column 3</p>",
                x: 1280, y: 180, width: 600, height: 860,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { textAlign: "left", verticalAlign: "top" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-col1", "placeholder-col2", "placeholder-col3"]
    }
};

export function createInitialState() {
    return {
        meta: {
            title: "Untitled Presentation",
            author: "User",
            created: Date.now(),
            modified: Date.now(),
            theme: "default-dark"
        },
        auth: {
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null
        },
        ui: {
            isInteracting: false
        },
        editor: {
            mode: "edit",
            activeSlideId: "slide-1",
            activeMasterId: "master-default",
            selectedSlideIds: [],
            selectedElementIds: [],
            editingElementId: null,
            deepEdit: null,
            deepEditStack: [],
            editModeSelectionType: null,
            textEditClickPosition: null,
            activeTool: "select",
            activeToolOptions: null,
            dragPlaceholderType: null,
            zoom: 1.0,
            pan: { x: 0, y: 0 },
            gridEnabled: true,
            snapToGrid: true,
            snapToObject: true,
            snapToSlide: true,
            snapToColumns: true,
            showLayoutGuides: false,
            constrainProportions: false,
            textEdit: {
                isEditing: false,
                elementId: null,
                isDirty: false,
                initialContent: null
            }
        },
        presentation: {
            isActive: false,
            currentSlideIndex: 0,
            buildIndex: -1,
            buildCount: 0,
            buildCountBySlideId: {},
            isPaused: false,
            requestFullscreen: true,
            blackScreen: false,
            whiteScreen: false,
            laserPointer: false,
            gridView: false,
            backStack: [],
            backStackMaxDepth: 10
        },
        ui: {
            isInteracting: false,
            interactionType: null
        },
        // Preset Libraries (Separate)
        colorThemePresets: DEFAULT_COLOR_THEME_PRESETS,
        typographyStylePresets: DEFAULT_TYPOGRAPHY_STYLE_PRESETS,
        slideMasterPresets: DEFAULT_MASTERS,
        // Note: layoutMasters are embedded in DEFAULT_MASTERS for now
        // In future, can separate into DEFAULT_LAYOUT_MASTERS if needed
        slides: {
            // Slide 1: Title Slide
            "slide-1": {
                id: "slide-1",
                layoutId: "layout-title",
                title: "Title Slide",
                width: 1920,
                height: 1080,
                background: null,
                colorThemeId: null,
                typographyStyleId: null,
                elements: {
                    "placeholder-title": { 
                        ...DEFAULT_MASTERS["layout-title"].elements["placeholder-title"],
                        content: "<h1>Click to add title</h1>"
                    },
                    "placeholder-subtitle": {
                        ...DEFAULT_MASTERS["layout-title"].elements["placeholder-subtitle"],
                        content: "<p>Click to add subtitle</p>"
                    }
                }, 
                elementOrder: ["placeholder-title", "placeholder-subtitle"],
                notes: "",
                notesDoc: { version: 1, blocks: [] },
                transition: "magic"
            },
            // Slide 2: Title and Content - all properties inherited, no overrides
            "slide-2": {
                id: "slide-2",
                layoutId: "layout-title-content",
                title: "Title and Content",
                width: 1920,
                height: 1080,
                background: null,
                colorThemeId: null,
                typographyStyleId: null,
                elements: {
                    "placeholder-title": { 
                        ...DEFAULT_MASTERS["layout-title-content"].elements["placeholder-title"],
                        content: "<h1>Click to add title</h1>"
                    },
                    "placeholder-body": {
                        ...DEFAULT_MASTERS["layout-title-content"].elements["placeholder-body"],
                        content: "<p>Click to add text</p>"
                    }
                }, 
                elementOrder: ["placeholder-title", "placeholder-body"],
                notes: "",
                notesDoc: { version: 1, blocks: [] },
                transition: "magic"
            }
        },
        slideOrder: ["slide-1", "slide-2"]
    };
}
