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
                accent: "#18A0FB",
                textPrimary: "#333333",
                textSecondary: "#888888"
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
                x: 192, y: 300, width: 1536, height: 200, // Centered with margins
                rotation: 0, opacity: 1,
                style: { fontSize: 72, textAlign: "center", color: "var(--theme-text-primary, #333333)", fontFamily: "var(--theme-font-heading, Inter)", fontWeight: "700" }
            },
            "placeholder-subtitle": {
                id: "placeholder-subtitle",
                type: "text",
                isPlaceholder: true,
                placeholderType: "subtitle",
                content: "<h2>Click to add subtitle</h2>",
                x: 192, y: 550, width: 1536, height: 100,
                rotation: 0, opacity: 1,
                style: { fontSize: 32, textAlign: "center", color: "var(--theme-text-secondary, #888888)", fontFamily: "var(--theme-font-body, Inter)", fontWeight: "400" }
            }
        },
        elementOrder: ["placeholder-title", "placeholder-subtitle"]
    },
    "layout-blank": {
        id: "layout-blank",
        type: "layout",
        parentId: "theme-default",
        name: "Blank",
        background: null,
        elements: {},
        elementOrder: []
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
            activeTool: "select", // 'select', 'text', 'rect', 'circle', 'hand'
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
