// DEFAULT_MASTERS - Professional presentation templates
// Design principles: 8px grid, harmonious type scale (1.25 ratio), modern color palette
// Canvas: 1920×1080 (16:9), Standard margins: 100px
// All colors use theme variables for consistency and easy theme switching
export const DEFAULT_MASTERS = {
    "theme-default": {
        id: "theme-default",
        type: "theme",
        name: "Default Theme",
        // Use theme color variable for background - resolved at render time
        background: { type: "solid", value: "var(--theme-background1, #FFFFFF)" },
        elements: {},
        elementOrder: [],
        // Style Assignments - Cascading Style System
        // null = use defaults, non-null = explicit override
        // colorTheme: references lumaTheme in themeSettings
        // colorMode: 'light' or 'dark'
        // typographyStyle: references typographyStyles (future)
        styleAssignments: {
            colorTheme: null,      // null means use lumaTheme from themeSettings
            colorMode: 'dark',     // Default to dark mode
            typographyStyle: null  // Future: typography style system
        },
        themeSettings: {
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
                followedHyperlink: "#7C3AED",   // Violet 600
                // Legacy aliases (for backwards compatibility)
                accent: "#3B82F6",
                textPrimary: "#0F172A",
                textSecondary: "#64748B"
            },
            fonts: { heading: "Inter", body: "Inter" },
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
                }
            },
            // ============================================
            // DEFAULT LUMA THEME: Tropical Paradise
            // ============================================
            // This is the default color theme for new presentations.
            // 12 luma-locked slots with pre-computed colors.
            // Teal, coral, and golden yellow - vibrant and joyful
            lumaTheme: {
                id: "preset_tropical_paradise",
                name: "Tropical Paradise",
                slots: [
                    { h: 175, s: 50 },  // Slot 1 - deep teal shadow
                    { h: 5, s: 65 },    // Slot 2 - coral
                    { h: 45, s: 70 },   // Slot 3 - golden yellow
                    { h: 180, s: 80 },  // Slot 4 - vivid teal accent
                    { h: 10, s: 85 },   // Slot 5 - bright coral
                    { h: 50, s: 90 },   // Slot 6 - sunny yellow
                    { h: 175, s: 70 },  // Slot 7 - teal
                    { h: 0, s: 60 },    // Slot 8 - soft coral
                    { h: 55, s: 65 },   // Slot 9 - light gold
                    { h: 180, s: 45 },  // Slot 10 - soft teal
                    { h: 45, s: 40 },   // Slot 11 - pale yellow
                    { h: 5, s: 25 }     // Slot 12 - blush
                ],
                adjustments: {
                    brightness: 0,
                    contrast: 0,
                    saturation: 0,
                    highlights: 0,
                    shadows: 0,
                    whites: 0,
                    blacks: 0
                },
                // Pre-computed resolved colors for the 12 slots
                // These match the luma values: 5, 10, 18, 25, 35, 45, 55, 65, 70, 80, 90, 97
                resolvedColors: [
                    "#061312",  // Slot 1 - L:5
                    "#291110",  // Slot 2 - L:10
                    "#4d3d13",  // Slot 3 - L:18
                    "#126664",  // Slot 4 - L:25
                    "#91291c",  // Slot 5 - L:35
                    "#dab80b",  // Slot 6 - L:45
                    "#35a39f",  // Slot 7 - L:55
                    "#d98c85",  // Slot 8 - L:65
                    "#d4c361",  // Slot 9 - L:70
                    "#9fd4d2",  // Slot 10 - L:80
                    "#f0e6c4",  // Slot 11 - L:90
                    "#f9f6f5"   // Slot 12 - L:97
                ],
                isInverted: false
            }
        }
    },
    // ============================================
    // LAYOUT MASTERS
    // ============================================
    
    // Title Slide - Maximum visual impact for opening slides
    // Centered layout with large display text
    "layout-title": {
        id: "layout-title",
        type: "layout",
        parentId: "theme-default",
        name: "Title Slide",
        background: null,
        // Style Assignments - null = inherit from parent theme master
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 160, y: 320, width: 1600, height: 240,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 80, textAlign: "center", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "800", letterSpacing: "-0.02em" }
            },
            "placeholder-subtitle": {
                id: "placeholder-subtitle",
                type: "text",
                isPlaceholder: true,
                placeholderType: "subtitle",
                content: "<p>Click to add subtitle</p>",
                x: 320, y: 580, width: 1280, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 28, textAlign: "center", verticalAlign: "middle", color: "var(--theme-text-secondary, #64748B)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.4 }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-subtitle"]
    },
    // Title and Content - Standard content slide with title
    // Clean layout with ample breathing room
    "layout-title-content": {
        id: "layout-title-content",
        type: "layout",
        parentId: "theme-default",
        name: "Title and Content",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700", letterSpacing: "-0.01em" }
            },
            "placeholder-body": {
                id: "placeholder-body",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                content: "<p>Click to add text</p>",
                x: 100, y: 180, width: 1720, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 24, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.5 }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-body"]
    },
    // Section Header - Bold visual break between sections
    // Large left-aligned title, vertically centered
    "layout-section-header": {
        id: "layout-section-header",
        type: "layout",
        parentId: "theme-default",
        name: "Section Header",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Section Title</h1>",
                x: 100, y: 380, width: 1720, height: 160,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 64, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700", letterSpacing: "-0.02em" }
            },
            "placeholder-subtitle": {
                id: "placeholder-subtitle",
                type: "text",
                isPlaceholder: true,
                placeholderType: "subtitle",
                content: "<p>Optional description for this section</p>",
                x: 100, y: 560, width: 1400, height: 100,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 24, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-secondary, #64748B)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.4 }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-subtitle"]
    },
    // Two Column - Side-by-side content layout
    // Equal columns with 60px gutter for visual separation
    "layout-two-content": {
        id: "layout-two-content",
        type: "layout",
        parentId: "theme-default",
        name: "Two Column",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700", letterSpacing: "-0.01em" }
            },
            "placeholder-left": {
                id: "placeholder-left",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                content: "<p>Click to add text</p>",
                x: 100, y: 180, width: 830, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.6 }
            },
            "placeholder-right": {
                id: "placeholder-right",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add text</p>",
                x: 990, y: 180, width: 830, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.6 }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-left", "placeholder-right"]
    },
    // Comparison - Side-by-side with headers for comparing items
    // Each column has its own header for labeling
    "layout-comparison": {
        id: "layout-comparison",
        type: "layout",
        parentId: "theme-default",
        name: "Comparison",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700", letterSpacing: "-0.01em" }
            },
            "placeholder-left-header": {
                id: "placeholder-left-header",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Option A</p>",
                x: 100, y: 180, width: 830, height: 60,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 28, textAlign: "left", verticalAlign: "middle", color: "var(--theme-accent-1, #3B82F6)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "600" }
            },
            "placeholder-left-content": {
                id: "placeholder-left-content",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add text</p>",
                x: 100, y: 260, width: 830, height: 760,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.6 }
            },
            "placeholder-right-header": {
                id: "placeholder-right-header",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Option B</p>",
                x: 990, y: 180, width: 830, height: 60,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 28, textAlign: "left", verticalAlign: "middle", color: "var(--theme-accent-2, #8B5CF6)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "600" }
            },
            "placeholder-right-content": {
                id: "placeholder-right-content",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add text</p>",
                x: 990, y: 260, width: 830, height: 760,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.6 }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-left-header", "placeholder-left-content", "placeholder-right-header", "placeholder-right-content"]
    },
    // Title Only - Minimal layout for custom content
    "layout-title-only": {
        id: "layout-title-only",
        type: "layout",
        parentId: "theme-default",
        name: "Title Only",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700", letterSpacing: "-0.01em" }
            }
        },
        elementOrder: ["placeholder-title"]
    },
    // Blank - Empty canvas for complete freedom
    "layout-blank": {
        id: "layout-blank",
        type: "layout",
        parentId: "theme-default",
        name: "Blank",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {},
        elementOrder: []
    },
    // Content with Caption - Main content with sidebar annotation
    // 2/3 content, 1/3 caption for notes or supporting info
    "layout-content-caption": {
        id: "layout-content-caption",
        type: "layout",
        parentId: "theme-default",
        name: "Content with Caption",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700", letterSpacing: "-0.01em" }
            },
            "placeholder-body": {
                id: "placeholder-body",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                content: "<p>Click to add text</p>",
                x: 100, y: 180, width: 1200, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 24, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.5 }
            },
            "placeholder-caption": {
                id: "placeholder-caption",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Add notes or supporting information here</p>",
                x: 1360, y: 180, width: 460, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 16, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-secondary, #64748B)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.6 }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-body", "placeholder-caption"]
    },
    // Picture with Caption - Image-focused with descriptive text
    // Large image area with sidebar for context
    "layout-picture-caption": {
        id: "layout-picture-caption",
        type: "layout",
        parentId: "theme-default",
        name: "Picture with Caption",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700", letterSpacing: "-0.01em" }
            },
            "placeholder-picture": {
                id: "placeholder-picture",
                type: "text",
                isPlaceholder: true,
                placeholderType: "picture",
                content: "<p style='opacity:0.6;text-align:center;'>🖼️ Click to add picture</p>",
                x: 100, y: 180, width: 1200, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 24, textAlign: "center", verticalAlign: "middle", color: "var(--theme-text-secondary, #64748B)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", backgroundColor: "var(--theme-background2, #F8FAFC)", borderRadius: "8px" }
            },
            "placeholder-caption": {
                id: "placeholder-caption",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Add image caption or description here</p>",
                x: 1360, y: 180, width: 460, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 16, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-secondary, #64748B)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.6 }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-picture", "placeholder-caption"]
    },
    // Quote - Feature a memorable quote or statement
    // Centered large text with attribution
    "layout-quote": {
        id: "layout-quote",
        type: "layout",
        parentId: "theme-default",
        name: "Quote",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-quote": {
                id: "placeholder-quote",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>\"Click to add your quote here\"</p>",
                x: 160, y: 300, width: 1600, height: 360,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 40, textAlign: "center", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "400", fontStyle: "italic", lineHeight: 1.4 }
            },
            "placeholder-attribution": {
                id: "placeholder-attribution",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>— Attribution</p>",
                x: 160, y: 680, width: 1600, height: 80,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 20, textAlign: "center", verticalAlign: "top", color: "var(--theme-text-secondary, #64748B)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "500" }
            }
        },
        elementOrder: ["placeholder-quote", "placeholder-attribution"]
    },
    // Big Number - Highlight a statistic or key metric
    // Large centered number with label and description
    "layout-big-number": {
        id: "layout-big-number",
        type: "layout",
        parentId: "theme-default",
        name: "Big Number",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-label": {
                id: "placeholder-label",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>METRIC</p>",
                x: 160, y: 300, width: 1600, height: 60,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 16, textAlign: "center", verticalAlign: "bottom", color: "var(--theme-text-secondary, #64748B)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }
            },
            "placeholder-number": {
                id: "placeholder-number",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>100%</p>",
                x: 160, y: 380, width: 1600, height: 260,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 144, textAlign: "center", verticalAlign: "middle", color: "var(--theme-accent-1, #3B82F6)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "800", letterSpacing: "-0.02em" }
            },
            "placeholder-description": {
                id: "placeholder-description",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Add context or description for this number</p>",
                x: 320, y: 660, width: 1280, height: 120,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 24, textAlign: "center", verticalAlign: "top", color: "var(--theme-text-secondary, #64748B)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.4 }
            }
        },
        elementOrder: ["placeholder-label", "placeholder-number", "placeholder-description"]
    },
    // Three Column - For comparing multiple items
    // Three equal columns with optional headers
    "layout-three-column": {
        id: "layout-three-column",
        type: "layout",
        parentId: "theme-default",
        name: "Three Column",
        background: null,
        styleAssignments: {
            colorTheme: null,
            typographyStyle: null
        },
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700", letterSpacing: "-0.01em" }
            },
            "placeholder-col1": {
                id: "placeholder-col1",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                content: "<p>Column 1</p>",
                x: 100, y: 180, width: 540, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.6 }
            },
            "placeholder-col2": {
                id: "placeholder-col2",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Column 2</p>",
                x: 690, y: 180, width: 540, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.6 }
            },
            "placeholder-col3": {
                id: "placeholder-col3",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Column 3</p>",
                x: 1280, y: 180, width: 540, height: 840,
                rotation: 0, opacity: 1,
                resizing: "fixed",
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #0F172A)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", lineHeight: 1.6 }
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
            activeMasterId: "theme-default",
            selectedSlideIds: [],
            selectedElementIds: [],
            editingElementId: null,
            editModeSelectionType: null,
            textEditClickPosition: null,
            activeTool: "select",
            activeToolOptions: null,
            dragPlaceholderType: null,
            zoom: 1.0,
            pan: { x: 0, y: 0 },
            gridEnabled: true,
            snapToGrid: true,
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
            isPaused: false,
            blackScreen: false,
            whiteScreen: false,
            laserPointer: false,
            gridView: false
        },
        ui: {
            isInteracting: false,
            interactionType: null
        },
        masters: DEFAULT_MASTERS,
        slides: {
            // Slide 1: Title Slide - all properties inherited, no overrides
            "slide-1": {
                id: "slide-1",
                layoutId: "layout-title",
                title: "Title Slide",
                width: 1920,
                height: 1080,
                background: null,
                styleAssignments: {
                    colorTheme: null,
                    typographyStyle: null
                },
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
                styleAssignments: {
                    colorTheme: null,
                    typographyStyle: null
                },
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
                transition: "magic"
            }
        },
        slideOrder: ["slide-1", "slide-2"]
    };
}
