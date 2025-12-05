/**
 * State Builders - Helper functions to create test state objects
 * 
 * These functions generate valid state objects for seeding the Redux store
 * during E2E tests, allowing tests to start with specific application states.
 */

/**
 * Generate a unique ID for test objects
 */
export function generateId(prefix = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a minimal slide object
 */
export function createSlide(options: {
    id?: string;
    title?: string;
    background?: any;
    elements?: Record<string, any>;
    masterId?: string;
} = {}) {
    const id = options.id || generateId('slide');
    
    return {
        id,
        title: options.title || `Test Slide`,
        background: options.background || {
            type: 'solid',
            color: '#FFFFFF',
        },
        elements: options.elements || {},
        masterId: options.masterId || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

/**
 * Create a text element
 */
export function createTextElement(options: {
    id?: string;
    content?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
} = {}) {
    const id = options.id || generateId('text');
    
    return {
        id,
        type: 'text',
        x: options.x ?? 100,
        y: options.y ?? 100,
        width: options.width ?? 400,
        height: options.height ?? 100,
        rotation: 0,
        content: options.content || 'Test Text',
        fontSize: options.fontSize ?? 24,
        fontFamily: options.fontFamily || 'Inter',
        fontWeight: 400,
        fontStyle: 'normal',
        textAlign: 'left',
        verticalAlign: 'top',
        color: options.color || '#000000',
        lineHeight: 1.2,
        letterSpacing: 0,
        opacity: 1,
    };
}

/**
 * Create a shape element (rectangle)
 */
export function createShapeElement(options: {
    id?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fill?: any;
    stroke?: any;
    cornerRadius?: number;
} = {}) {
    const id = options.id || generateId('shape');
    
    return {
        id,
        type: 'shape',
        x: options.x ?? 200,
        y: options.y ?? 200,
        width: options.width ?? 200,
        height: options.height ?? 150,
        rotation: 0,
        fill: options.fill || {
            type: 'solid',
            color: '#3B82F6',
        },
        stroke: options.stroke || null,
        cornerRadius: options.cornerRadius ?? 0,
        opacity: 1,
    };
}

/**
 * Create an image element
 */
export function createImageElement(options: {
    id?: string;
    src?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
} = {}) {
    const id = options.id || generateId('image');
    
    return {
        id,
        type: 'image',
        x: options.x ?? 150,
        y: options.y ?? 150,
        width: options.width ?? 300,
        height: options.height ?? 300,
        rotation: 0,
        src: options.src || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==',
        opacity: 1,
    };
}

/**
 * Create a complete presentation state
 */
export function createPresentation(options: {
    slides?: any[];
    slideCount?: number;
    title?: string;
} = {}) {
    const slideCount = options.slideCount ?? 3;
    const slides = options.slides || Array.from({ length: slideCount }, (_, i) => 
        createSlide({ title: `Slide ${i + 1}` })
    );
    
    const slidesMap: Record<string, any> = {};
    const slideOrder: string[] = [];
    
    slides.forEach((slide) => {
        slidesMap[slide.id] = slide;
        slideOrder.push(slide.id);
    });
    
    return {
        slides: slidesMap,
        slideOrder,
        activeSlideId: slideOrder[0],
        selectedSlideIds: [],
    };
}

/**
 * Create a slide with multiple elements
 */
export function createSlideWithElements(options: {
    title?: string;
    elementCount?: number;
} = {}) {
    const elements: Record<string, any> = {};
    const elementCount = options.elementCount ?? 3;
    
    // Add a text element
    const textEl = createTextElement({ content: 'Title Text', y: 50 });
    elements[textEl.id] = textEl;
    
    // Add shapes
    for (let i = 1; i < elementCount; i++) {
        const shapeEl = createShapeElement({
            x: 100 + i * 150,
            y: 200,
            width: 120,
            height: 120,
        });
        elements[shapeEl.id] = shapeEl;
    }
    
    return createSlide({
        title: options.title || 'Slide with Elements',
        elements,
    });
}

/**
 * Create a master slide/theme
 */
export function createMaster(options: {
    id?: string;
    name?: string;
    type?: 'theme' | 'layout';
    parentId?: string | null;
    background?: any;
    elements?: Record<string, any>;
} = {}) {
    const id = options.id || generateId('master');
    
    return {
        id,
        name: options.name || 'Test Master',
        type: options.type || 'theme',
        parentId: options.parentId ?? null,
        background: options.background || {
            type: 'solid',
            color: '#F8F9FA',
        },
        elements: options.elements || {},
        themeSettings: {
            primaryColor: '#3B82F6',
            secondaryColor: '#8B5CF6',
            accentColor: '#F59E0B',
            fontFamily: 'Inter',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}

/**
 * Create editor state
 */
export function createEditorState(options: {
    mode?: 'edit' | 'presentation' | 'master';
    activeTool?: string;
    activeSlideId?: string;
    selectedElementIds?: string[];
    zoom?: number;
    panX?: number;
    panY?: number;
} = {}) {
    return {
        mode: options.mode || 'edit',
        activeTool: options.activeTool || 'select',
        activeSlideId: options.activeSlideId || null,
        selectedElementIds: options.selectedElementIds || [],
        selectedSlideIds: [],
        activeMasterId: null,
        zoom: options.zoom ?? 1,
        panX: options.panX ?? 0,
        panY: options.panY ?? 0,
    };
}

/**
 * Create complete test state
 */
export function createTestState(options: {
    slides?: any[];
    slideCount?: number;
    editor?: any;
    masters?: Record<string, any>;
} = {}) {
    const presentation = createPresentation(options);
    const editor = options.editor || createEditorState({
        activeSlideId: presentation.slideOrder[0],
    });
    
    return {
        slides: presentation.slides,
        slideOrder: presentation.slideOrder,
        editor,
        masters: options.masters || {},
        presentation: {
            isPlaying: false,
            currentSlideIndex: 0,
            buildIndex: -1,
            buildCount: 0,
            laserEnabled: false,
            gridViewOpen: false,
            blackScreenActive: false,
        },
        ui: {
            isInteracting: false,
            settingsOpen: false,
        },
    };
}
