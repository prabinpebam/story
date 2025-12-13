import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the main Story editor
 * 
 * This class provides high-level methods for interacting with the editor,
 * abstracting away implementation details and providing a stable test API.
 */
export class EditorPage {
    readonly page: Page;
    
    // Main UI components
    readonly toolbar: Locator;
    readonly sidebar: Locator;
    readonly canvas: Locator;
    readonly propertyInspector: Locator;
    readonly slideList: Locator;
    
    // Toolbar buttons
    readonly selectTool: Locator;
    readonly handTool: Locator;
    readonly shapeTool: Locator;
    readonly textTool: Locator;
    readonly imageTool: Locator;
    readonly resourcesTool: Locator;
    
    // Top controls
    readonly editMasterBtn: Locator;
    readonly closeMasterBtn: Locator;
    readonly playBtn: Locator;
    
    // Slide list
    readonly addSlideBtn: Locator;

    // Text Properties
    readonly fontFamilySelect: Locator;
    readonly fontWeightSelect: Locator;
    readonly fontSizeInput: Locator;
    readonly lineHeightInput: Locator;
    readonly letterSpacingInput: Locator;
    readonly textColorHex: Locator;
    readonly textColorOpacity: Locator;
    readonly alignLeftBtn: Locator;
    readonly alignCenterBtn: Locator;
    readonly alignRightBtn: Locator;
    readonly alignTopBtn: Locator;
    readonly alignMiddleBtn: Locator;
    readonly alignBottomBtn: Locator;
    
    constructor(page: Page) {
        this.page = page;
        
        // Main UI components
        this.toolbar = page.locator('#floating-toolbar');
        this.sidebar = page.locator('#sidebar-left');
        this.canvas = page.locator('#canvas-container');
        this.propertyInspector = page.locator('[data-testid="property-inspector"]');
        this.slideList = page.locator('[data-testid="slide-list"]');
        
        // Toolbar buttons
        this.selectTool = page.locator('[data-testid="tool-select"]');
        this.handTool = page.locator('[data-testid="tool-hand"]');
        this.shapeTool = page.locator('[data-testid="tool-shape"]');
        this.textTool = page.locator('[data-testid="tool-text"]');
        this.imageTool = page.locator('[data-testid="tool-image"]');
        this.resourcesTool = page.locator('[data-testid="tool-resources"]');
        
        // Top controls
        this.editMasterBtn = page.locator('[data-testid="edit-master-btn"]');
        this.closeMasterBtn = page.locator('[data-testid="close-master-btn"]');
        this.playBtn = page.locator('[data-testid="play-btn"]');
        
        // Slide list
        this.addSlideBtn = page.locator('[data-testid="add-slide-btn"]');

        // Text Properties
        this.fontFamilySelect = this.propertyInspector.locator('[data-testid="font-family-select"]');
        this.fontWeightSelect = this.propertyInspector.locator('[data-testid="font-weight-select"]');
        this.fontSizeInput = this.propertyInspector.locator('[data-testid="font-size-input"] input');
        this.lineHeightInput = this.propertyInspector.locator('[data-testid="line-height-input"] input');
        this.letterSpacingInput = this.propertyInspector.locator('[data-testid="letter-spacing-input"] input');
        this.textColorHex = this.propertyInspector.locator('[data-testid="text-color-hex"]');
        this.textColorOpacity = this.propertyInspector.locator('[data-testid="text-color-opacity"] input');
        this.alignLeftBtn = this.propertyInspector.locator('[data-testid="align-left"]');
        this.alignCenterBtn = this.propertyInspector.locator('[data-testid="align-center"]');
        this.alignRightBtn = this.propertyInspector.locator('[data-testid="align-right"]');
        this.alignTopBtn = this.propertyInspector.locator('[data-testid="align-top"]');
        this.alignMiddleBtn = this.propertyInspector.locator('[data-testid="align-middle"]');
        this.alignBottomBtn = this.propertyInspector.locator('[data-testid="align-bottom"]');
    }
    
    /**
     * Navigate to the editor
     */
    async goto() {
        // Avoid `networkidle` (the app can keep long-lived connections open).
        await this.page.goto('/', { waitUntil: 'domcontentloaded' });

        // Ensure the app bootstrapped and exposed a store for tests.
        await this.page.waitForFunction(() => {
            const win = window as any;
            return !!win.__TEST_STORE__ || !!win._storyAppStore;
        }, null, { timeout: 15000 });
    }
    
    /**
     * Wait for editor to be fully loaded
     */
    async waitForLoad() {
        // Ensure the boot overlay is gone before interacting with the canvas.
        // (Hidden also covers the detached case.)
        await this.page.locator('#boot-screen').waitFor({ state: 'hidden', timeout: 15000 });
        await this.toolbar.waitFor({ state: 'visible' });
        await this.canvas.waitFor({ state: 'visible' });
        await this.sidebar.waitFor({ state: 'visible' });
    }

    /**
     * Wait for all fonts to be loaded
     */
    async waitForFonts() {
        await this.page.evaluate(async () => {
            await document.fonts.ready;
        });
    }
    
    /**
     * Select a tool from the toolbar
     */
    async setActiveTool(tool: 'select' | 'hand' | 'shape' | 'text' | 'image' | 'resources') {
        const toolMap = {
            select: this.selectTool,
            hand: this.handTool,
            shape: this.shapeTool,
            text: this.textTool,
            image: this.imageTool,
            resources: this.resourcesTool,
        };
        
        await toolMap[tool].click();
    }
    
    /**
     * Add a new slide
     */
    async addSlide() {
        await this.addSlideBtn.click();
        await this.page.waitForTimeout(300); // Wait for animation
    }
    
    /**
     * Get a slide thumbnail by index (0-based)
     */
    getSlideThumbnail(index: number): Locator {
        return this.page.locator(`[data-testid="slide-thumbnail-${index}"]`);
    }
    
    /**
     * Select a slide by index (0-based)
     */
    async selectSlide(index: number) {
        const thumbnail = this.getSlideThumbnail(index);
        await thumbnail.click();
        await this.page.waitForTimeout(200); // Wait for state update
    }
    
    /**
     * Get the number of slides
     */
    async getSlideCount(): Promise<number> {
        const thumbnails = this.page.locator('[data-testid^="slide-thumbnail-"]');
        return await thumbnails.count();
    }
    
    /**
     * Enter presentation mode
     */
    async startPresentation() {
        await this.playBtn.click();
        await this.page.waitForTimeout(500); // Wait for mode transition
    }
    
    /**
     * Enter master edit mode
     */
    async editMaster() {
        await this.editMasterBtn.click();
        await this.page.waitForTimeout(300);
    }
    
    /**
     * Exit master edit mode
     */
    async closeMaster() {
        await this.closeMasterBtn.click();
        await this.page.waitForTimeout(300);
    }
    
    /**
     * Get the Redux store state via window.__TEST_STORE__
     */
    async getState(): Promise<any> {
        return await this.page.evaluate(() => {
            const win = window as any;
            if (!win.__TEST_STORE__) {
                throw new Error('Test store not exposed');
            }
            return win.__TEST_STORE__.getState();
        });
    }
    
    /**
     * Dispatch an action to the Redux store
     */
    async dispatchAction(actionType: string, payload?: any): Promise<void> {
        await this.page.evaluate(({ type, data }) => {
            const win = window as any;
            if (!win.__TEST_STORE__) {
                throw new Error('Test store not exposed');
            }
            win.__TEST_STORE__.dispatch(type, data);
        }, { type: actionType, data: payload });
    }
    
    /**
     * Get active tool from state
     */
    async getActiveTool(): Promise<string> {
        const state = await this.getState();
        return state.editor.activeTool;
    }
    
    /**
     * Get active slide ID from state
     */
    async getActiveSlideId(): Promise<string> {
        const state = await this.getState();
        return state.editor.activeSlideId;
    }
    
    /**
     * Get current editor mode from state
     */
    async getEditorMode(): Promise<'edit' | 'presentation' | 'master'> {
        const state = await this.getState();
        return state.editor.mode;
    }
    
    /**
     * Check if a tool is active
     */
    async isToolActive(tool: 'select' | 'hand' | 'shape' | 'text' | 'image' | 'resources'): Promise<boolean> {
        const toolMap = {
            select: this.selectTool,
            hand: this.handTool,
            shape: this.shapeTool,
            text: this.textTool,
            image: this.imageTool,
            resources: this.resourcesTool,
        };
        
        return await toolMap[tool].evaluate((el) => el.classList.contains('active'));
    }
}
