export const DEFAULT_MASTERS = {
    "theme-default": {
        id: "theme-default",
        type: "theme",
        name: "Default Theme",
        background: { type: "solid", value: "#ffffff" },
        elements: {},
        elementOrder: [],
        themeSettings: {
            colors: {
                // Background Colors
                background1: "#FFFFFF",
                background2: "#F5F5F5",
                // Text Colors
                text1: "#333333",
                text2: "#666666",
                // Accent Colors
                accent1: "#18A0FB",
                accent2: "#7B61FF",
                accent3: "#1BC47D",
                accent4: "#F24822",
                accent5: "#FFBE0B",
                accent6: "#FF006E",
                // Link Colors
                hyperlink: "#0066CC",
                followedHyperlink: "#954F72",
                // Legacy aliases (for backwards compatibility)
                accent: "#18A0FB",
                textPrimary: "#333333",
                textSecondary: "#666666"
            },
            fonts: { heading: "Inter", body: "Inter" },
            // Text Styles for consistent typography across the presentation
            textStyles: {
                "title": {
                    id: "title",
                    name: "Title",
                    fontFamily: "var(--theme-font-heading)",
                    fontSize: 72,
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
                    lineHeight: 1.3,
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
                "body": {
                    id: "body",
                    name: "Body",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 18,
                    fontWeight: "400",
                    lineHeight: 1.5,
                    letterSpacing: "0%",
                    textFill: { type: "solid", value: "var(--theme-text-primary)" }
                },
                "bodySmall": {
                    id: "bodySmall",
                    name: "Body Small",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 14,
                    fontWeight: "400",
                    lineHeight: 1.5,
                    letterSpacing: "0%",
                    textFill: { type: "solid", value: "var(--theme-text-secondary)" }
                },
                "caption": {
                    id: "caption",
                    name: "Caption",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 12,
                    fontWeight: "400",
                    lineHeight: 1.4,
                    letterSpacing: "0.5%",
                    textFill: { type: "solid", value: "var(--theme-text-secondary)" }
                },
                "label": {
                    id: "label",
                    name: "Label",
                    fontFamily: "var(--theme-font-body)",
                    fontSize: 11,
                    fontWeight: "500",
                    lineHeight: 1.3,
                    letterSpacing: "2%",
                    textTransform: "uppercase",
                    textFill: { type: "solid", value: "var(--theme-text-secondary)" }
                }
            }
        }
    },
    "layout-title": {
        id: "layout-title",
        type: "layout",
        parentId: "theme-default",
        name: "Title Slide",
        background: null,
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 192, y: 340, width: 1536, height: 200,
                rotation: 0, opacity: 1,
                style: { fontSize: 72, textAlign: "center", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700" }
            },
            "placeholder-subtitle": {
                id: "placeholder-subtitle",
                type: "text",
                isPlaceholder: true,
                placeholderType: "subtitle",
                content: "<p>Click to add subtitle</p>",
                x: 192, y: 560, width: 1536, height: 80,
                rotation: 0, opacity: 1,
                style: { fontSize: 32, textAlign: "center", verticalAlign: "middle", color: "var(--theme-text-secondary, #666666)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-subtitle"]
    },
    "layout-title-content": {
        id: "layout-title-content",
        type: "layout",
        parentId: "theme-default",
        name: "Title and Content",
        background: null,
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700" }
            },
            "placeholder-body": {
                id: "placeholder-body",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                content: "<p>Click to add text</p>",
                x: 100, y: 200, width: 1720, height: 780,
                rotation: 0, opacity: 1,
                style: { fontSize: 24, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-body"]
    },
    "layout-section-header": {
        id: "layout-section-header",
        type: "layout",
        parentId: "theme-default",
        name: "Section Header",
        background: null,
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 380, width: 1720, height: 150,
                rotation: 0, opacity: 1,
                style: { fontSize: 60, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700" }
            },
            "placeholder-subtitle": {
                id: "placeholder-subtitle",
                type: "text",
                isPlaceholder: true,
                placeholderType: "subtitle",
                content: "<p>Click to add subtitle</p>",
                x: 100, y: 550, width: 1720, height: 80,
                rotation: 0, opacity: 1,
                style: { fontSize: 28, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-secondary, #666666)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-subtitle"]
    },
    "layout-two-content": {
        id: "layout-two-content",
        type: "layout",
        parentId: "theme-default",
        name: "Two Content",
        background: null,
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700" }
            },
            "placeholder-left": {
                id: "placeholder-left",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                content: "<p>Click to add text</p>",
                x: 100, y: 200, width: 830, height: 780,
                rotation: 0, opacity: 1,
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            },
            "placeholder-right": {
                id: "placeholder-right",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add text</p>",
                x: 990, y: 200, width: 830, height: 780,
                rotation: 0, opacity: 1,
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-left", "placeholder-right"]
    },
    "layout-comparison": {
        id: "layout-comparison",
        type: "layout",
        parentId: "theme-default",
        name: "Comparison",
        background: null,
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700" }
            },
            "placeholder-left-header": {
                id: "placeholder-left-header",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add heading</p>",
                x: 100, y: 200, width: 830, height: 60,
                rotation: 0, opacity: 1,
                style: { fontSize: 28, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "600" }
            },
            "placeholder-left-content": {
                id: "placeholder-left-content",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add text</p>",
                x: 100, y: 280, width: 830, height: 700,
                rotation: 0, opacity: 1,
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            },
            "placeholder-right-header": {
                id: "placeholder-right-header",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add heading</p>",
                x: 990, y: 200, width: 830, height: 60,
                rotation: 0, opacity: 1,
                style: { fontSize: 28, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "600" }
            },
            "placeholder-right-content": {
                id: "placeholder-right-content",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add text</p>",
                x: 990, y: 280, width: 830, height: 700,
                rotation: 0, opacity: 1,
                style: { fontSize: 20, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-left-header", "placeholder-left-content", "placeholder-right-header", "placeholder-right-content"]
    },
    "layout-title-only": {
        id: "layout-title-only",
        type: "layout",
        parentId: "theme-default",
        name: "Title Only",
        background: null,
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700" }
            }
        },
        elementOrder: ["placeholder-title"]
    },
    "layout-blank": {
        id: "layout-blank",
        type: "layout",
        parentId: "theme-default",
        name: "Blank",
        background: null,
        elements: {},
        elementOrder: []
    },
    "layout-content-caption": {
        id: "layout-content-caption",
        type: "layout",
        parentId: "theme-default",
        name: "Content with Caption",
        background: null,
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700" }
            },
            "placeholder-body": {
                id: "placeholder-body",
                type: "text",
                isPlaceholder: true,
                placeholderType: "body",
                content: "<p>Click to add text</p>",
                x: 100, y: 200, width: 1300, height: 780,
                rotation: 0, opacity: 1,
                style: { fontSize: 24, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            },
            "placeholder-caption": {
                id: "placeholder-caption",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add caption</p>",
                x: 1440, y: 200, width: 380, height: 780,
                rotation: 0, opacity: 1,
                style: { fontSize: 14, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-secondary, #666666)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-body", "placeholder-caption"]
    },
    "layout-picture-caption": {
        id: "layout-picture-caption",
        type: "layout",
        parentId: "theme-default",
        name: "Picture with Caption",
        background: null,
        elements: {
            "placeholder-title": {
                id: "placeholder-title",
                type: "text",
                isPlaceholder: true,
                placeholderType: "title",
                content: "<h1>Click to add title</h1>",
                x: 100, y: 60, width: 1720, height: 100,
                rotation: 0, opacity: 1,
                style: { fontSize: 44, textAlign: "left", verticalAlign: "middle", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700" }
            },
            "placeholder-picture": {
                id: "placeholder-picture",
                type: "text",
                isPlaceholder: true,
                placeholderType: "picture",
                content: "<p style='opacity:0.5;text-align:center;'>🖼️ Click to add picture</p>",
                x: 100, y: 200, width: 1300, height: 780,
                rotation: 0, opacity: 1,
                style: { fontSize: 24, textAlign: "center", verticalAlign: "middle", color: "var(--theme-text-secondary, #666666)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400", backgroundColor: "rgba(0,0,0,0.03)" }
            },
            "placeholder-caption": {
                id: "placeholder-caption",
                type: "text",
                isPlaceholder: true,
                placeholderType: "text",
                content: "<p>Click to add caption</p>",
                x: 1440, y: 200, width: 380, height: 780,
                rotation: 0, opacity: 1,
                style: { fontSize: 14, textAlign: "left", verticalAlign: "top", color: "var(--theme-text-secondary, #666666)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-picture", "placeholder-caption"]
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
        ui: {
            isInteracting: false
        },
        editor: {
            mode: "edit", // 'edit', 'presentation', 'master'
            activeSlideId: "slide-1",
            activeMasterId: "theme-default", // Default to the first theme
            selectedSlideIds: [], // IDs of selected slides (for operations)
            selectedElementIds: [],
            editingElementId: null, // ID of element currently being edited (text)
            editModeSelectionType: null, // 'all' | 'caret' | null - how text should be selected on edit mode entry
            textEditClickPosition: null, // { clientX, clientY } - click position for caret placement
            activeTool: "select", // 'select', 'text', 'rect', 'circle', 'hand', 'placeholder'
            activeToolOptions: null, // Additional options for tools, e.g., { tool: 'placeholder', placeholderType: 'title' }
            dragPlaceholderType: null, // Type of placeholder being dragged from palette
            zoom: 1.0,
            pan: { x: 0, y: 0 },
            gridEnabled: true,
            snapToGrid: true,
            constrainProportions: false
        },
        presentation: {
            isActive: false,
            currentSlideIndex: 0,
            buildIndex: -1, // -1 means "base slide", 0+ are build steps
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
            "slide-1": {
                id: "slide-1",
                layoutId: "layout-title", // Default to Title Layout
                title: "Introduction",
                width: 1920,
                height: 1080,
                background: null, // Inherit from layout/theme
                elements: {
                    // Instantiate placeholders so they are editable
                    "placeholder-title": { 
                        ...DEFAULT_MASTERS["layout-title"].elements["placeholder-title"],
                        content: "<h1>Introduction</h1>"
                    },
                    "placeholder-subtitle": {
                        ...DEFAULT_MASTERS["layout-title"].elements["placeholder-subtitle"],
                        content: "<h2>Subtitle</h2>"
                    }
                }, 
                elementOrder: ["placeholder-title", "placeholder-subtitle"], // Array of IDs (z-index)
                notes: "",
                transition: "magic" // Default transition
            }
        },
        slideOrder: ["slide-1"]
    };
}
