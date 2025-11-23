
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
            fonts: { heading: "Inter", body: "Inter" }
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
        editor: {
            mode: "edit", // 'edit', 'presentation', 'master'
            activeSlideId: "slide-1",
            activeMasterId: "theme-default", // Default to the first theme
            selectedSlideIds: [], // IDs of selected slides (for operations)
            selectedElementIds: [],
            editingElementId: null, // ID of element currently being edited (text)
            activeTool: "select", // 'select', 'text', 'rect', 'circle', 'hand'
            zoom: 1.0,
            pan: { x: 0, y: 0 },
            gridEnabled: true,
            snapToGrid: true
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
