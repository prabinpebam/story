import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Icons
vi.mock('../../../../src/ui/Icons.js', () => ({
    Icons: {
        MINUS: '−',
        CLOSE: '×'
    }
}));

import { DraggablePanel } from '../../../../src/ui/components/DraggablePanel.js';

describe('DraggablePanel', () => {
    let panel;
    let mockLocalStorage;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Mock localStorage
        mockLocalStorage = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key) => mockLocalStorage[key] || null),
            setItem: vi.fn((key, value) => { mockLocalStorage[key] = value; }),
            removeItem: vi.fn((key) => { delete mockLocalStorage[key]; }),
            clear: vi.fn(() => { mockLocalStorage = {}; })
        });
        
        // Mock window dimensions
        Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
        Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
    });

    afterEach(() => {
        if (panel) {
            panel.destroy();
            panel = null;
        }
        vi.unstubAllGlobals();
    });

    describe('constructor', () => {
        it('should create panel with default options', () => {
            panel = new DraggablePanel();
            
            expect(panel.options.id).toBe('panel');
            expect(panel.options.title).toBe('Panel');
            expect(panel.options.defaultWidth).toBe(320);
            expect(panel.options.defaultHeight).toBe(480);
        });

        it('should accept custom options', () => {
            panel = new DraggablePanel({
                id: 'custom',
                title: 'Custom Panel',
                defaultWidth: 400,
                defaultHeight: 600
            });
            
            expect(panel.options.id).toBe('custom');
            expect(panel.options.title).toBe('Custom Panel');
            expect(panel.options.defaultWidth).toBe(400);
            expect(panel.options.defaultHeight).toBe(600);
        });

        it('should initialize with isOpen false', () => {
            panel = new DraggablePanel();
            expect(panel.isOpen).toBe(false);
        });

        it('should initialize with isMinimized false', () => {
            panel = new DraggablePanel();
            expect(panel.isMinimized).toBe(false);
        });

        it('should set size from default options', () => {
            panel = new DraggablePanel({ defaultWidth: 400, defaultHeight: 500 });
            
            expect(panel.size.width).toBe(400);
            expect(panel.size.height).toBe(500);
        });
    });

    describe('createElement', () => {
        it('should create panel element with correct class', () => {
            panel = new DraggablePanel({ id: 'test' });
            
            expect(panel.element).toBeDefined();
            expect(panel.element.classList.contains('draggable-panel')).toBe(true);
            expect(panel.element.id).toBe('panel-test');
        });

        it('should append element to document body', () => {
            panel = new DraggablePanel();
            
            expect(document.body.contains(panel.element)).toBe(true);
        });

        it('should create header element', () => {
            panel = new DraggablePanel({ title: 'Test Title' });
            
            expect(panel.headerElement).toBeDefined();
            const title = panel.headerElement.querySelector('.draggable-panel-title');
            expect(title.textContent).toBe('Test Title');
        });

        it('should create content element', () => {
            panel = new DraggablePanel();
            
            expect(panel.contentElement).toBeDefined();
            expect(panel.contentElement.className).toBe('draggable-panel-content');
        });

        it('should create resize handles when resizable', () => {
            panel = new DraggablePanel({ resizable: true });
            
            expect(Object.keys(panel.resizeHandles).length).toBe(8);
            expect(panel.resizeHandles['n']).toBeDefined();
            expect(panel.resizeHandles['se']).toBeDefined();
        });

        it('should not create resize handles when not resizable', () => {
            panel = new DraggablePanel({ resizable: false });
            
            expect(Object.keys(panel.resizeHandles).length).toBe(0);
        });

        it('should set min/max size styles', () => {
            panel = new DraggablePanel({
                minWidth: 200,
                minHeight: 150,
                maxWidth: 500,
                maxHeight: 700
            });
            
            expect(panel.element.style.minWidth).toBe('200px');
            expect(panel.element.style.minHeight).toBe('150px');
            expect(panel.element.style.maxWidth).toBe('500px');
            expect(panel.element.style.maxHeight).toBe('700px');
        });
    });

    describe('createHeader', () => {
        it('should create minimize button when minimizable', () => {
            panel = new DraggablePanel({ minimizable: true });
            
            const buttons = panel.headerElement.querySelectorAll('.draggable-panel-btn');
            expect(buttons.length).toBeGreaterThanOrEqual(1);
        });

        it('should create close button when closable', () => {
            panel = new DraggablePanel({ closable: true });
            
            const buttons = panel.headerElement.querySelectorAll('.draggable-panel-btn');
            expect(buttons.length).toBeGreaterThanOrEqual(1);
        });

        it('should not create buttons when disabled', () => {
            panel = new DraggablePanel({ minimizable: false, closable: false });
            
            const buttons = panel.headerElement.querySelectorAll('.draggable-panel-btn');
            expect(buttons.length).toBe(0);
        });
    });

    describe('open', () => {
        beforeEach(() => {
            panel = new DraggablePanel();
            // Mock element.animate
            panel.element.animate = vi.fn(() => ({ onfinish: null }));
        });

        it('should set isOpen to true', () => {
            panel.open();
            expect(panel.isOpen).toBe(true);
        });

        it('should remove hidden class when opened', () => {
            panel.element.classList.add('hidden');
            panel.open();
            expect(panel.element.classList.contains('hidden')).toBe(false);
        });

        it('should call animate for open animation', () => {
            panel.open();
            expect(panel.element.animate).toHaveBeenCalled();
        });

        it('should call onOpen hook', () => {
            const onOpenSpy = vi.spyOn(panel, 'onOpen');
            panel.open();
            expect(onOpenSpy).toHaveBeenCalled();
        });

        it('should bring panel to front when already open', () => {
            panel.isOpen = true;
            const bringToFrontSpy = vi.spyOn(panel, 'bringToFront');
            
            panel.open();
            
            expect(bringToFrontSpy).toHaveBeenCalled();
        });
    });

    describe('close', () => {
        beforeEach(() => {
            panel = new DraggablePanel();
            panel.isOpen = true;
            panel.element.animate = vi.fn(() => ({ onfinish: null }));
        });

        it('should set isOpen to false', () => {
            panel.close();
            expect(panel.isOpen).toBe(false);
        });

        it('should save position', () => {
            panel.close();
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        it('should call onClose hook', () => {
            const onCloseSpy = vi.spyOn(panel, 'onClose');
            panel.close();
            expect(onCloseSpy).toHaveBeenCalled();
        });

        it('should not close if already closed', () => {
            panel.isOpen = false;
            const saveSpy = vi.spyOn(panel, 'savePosition');
            
            panel.close();
            
            expect(saveSpy).not.toHaveBeenCalled();
        });
    });

    describe('toggle', () => {
        beforeEach(() => {
            panel = new DraggablePanel();
            panel.element.animate = vi.fn(() => ({ onfinish: null }));
        });

        it('should open when closed', () => {
            panel.isOpen = false;
            panel.toggle();
            expect(panel.isOpen).toBe(true);
        });

        it('should close when open', () => {
            panel.isOpen = true;
            panel.toggle();
            expect(panel.isOpen).toBe(false);
        });
    });

    describe('toggleMinimize', () => {
        beforeEach(() => {
            panel = new DraggablePanel({ resizable: true });
        });

        it('should toggle isMinimized state', () => {
            expect(panel.isMinimized).toBe(false);
            
            panel.toggleMinimize();
            expect(panel.isMinimized).toBe(true);
            
            panel.toggleMinimize();
            expect(panel.isMinimized).toBe(false);
        });

        it('should hide content when minimized using hidden class', () => {
            panel.toggleMinimize();
            expect(panel.contentElement.classList.contains('hidden')).toBe(true);
        });

        it('should show content when restored by removing hidden class', () => {
            panel.toggleMinimize(); // minimize
            panel.toggleMinimize(); // restore
            expect(panel.contentElement.classList.contains('hidden')).toBe(false);
        });

        it('should hide resize handles when minimized using hidden class', () => {
            panel.toggleMinimize();
            
            Object.values(panel.resizeHandles).forEach(handle => {
                expect(handle.classList.contains('hidden')).toBe(true);
            });
        });

        it('should save position after minimize', () => {
            panel.toggleMinimize();
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('drag handling', () => {
        beforeEach(() => {
            panel = new DraggablePanel();
            panel.element.animate = vi.fn(() => ({ onfinish: null }));
        });

        it('should start drag on header mousedown', () => {
            const event = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            
            panel.headerElement.dispatchEvent(event);
            
            expect(panel.isDragging).toBe(true);
        });

        it('should not start drag on button click', () => {
            const btn = document.createElement('button');
            btn.className = 'draggable-panel-btn';
            panel.headerElement.appendChild(btn);
            
            const event = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            
            btn.dispatchEvent(event);
            
            expect(panel.isDragging).toBe(false);
        });

        it('should update position during drag', () => {
            panel.isDragging = true;
            panel.dragStartX = 50;
            panel.dragStartY = 50;
            
            panel.handleDragMove({ clientX: 150, clientY: 200 });
            
            expect(panel.position.x).toBe(100);
            expect(panel.position.y).toBe(150);
        });

        it('should constrain drag to viewport', () => {
            panel.isDragging = true;
            panel.dragStartX = 0;
            panel.dragStartY = 0;
            
            panel.handleDragMove({ clientX: 5000, clientY: 5000 });
            
            const maxX = window.innerWidth - panel.size.width;
            const maxY = window.innerHeight - panel.size.height;
            
            expect(panel.position.x).toBeLessThanOrEqual(maxX);
            expect(panel.position.y).toBeLessThanOrEqual(maxY);
        });

        it('should end drag and save position', () => {
            panel.isDragging = true;
            
            panel.handleDragEnd();
            
            expect(panel.isDragging).toBe(false);
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('resize handling', () => {
        beforeEach(() => {
            panel = new DraggablePanel({ resizable: true });
        });

        it('should start resize on handle mousedown', () => {
            const event = new MouseEvent('mousedown', {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            
            panel.resizeHandles['se'].dispatchEvent(event);
            
            expect(panel.isResizing).toBe(true);
            expect(panel.resizeDirection).toBe('se');
        });

        it('should resize east direction', () => {
            panel.isResizing = true;
            panel.resizeDirection = 'e';
            panel.resizeStartX = 100;
            panel.resizeStartWidth = 320;
            
            panel.handleResizeMove({ clientX: 150, clientY: 100 });
            
            expect(panel.size.width).toBe(370);
        });

        it('should resize south direction', () => {
            panel.isResizing = true;
            panel.resizeDirection = 's';
            panel.resizeStartY = 100;
            panel.resizeStartHeight = 480;
            
            panel.handleResizeMove({ clientX: 100, clientY: 150 });
            
            expect(panel.size.height).toBe(530);
        });

        it('should enforce min size constraints', () => {
            panel.isResizing = true;
            panel.resizeDirection = 'se';
            panel.resizeStartX = 500;
            panel.resizeStartY = 500;
            panel.resizeStartWidth = 320;
            panel.resizeStartHeight = 480;
            
            // Try to resize smaller than min
            panel.handleResizeMove({ clientX: 100, clientY: 100 });
            
            expect(panel.size.width).toBeGreaterThanOrEqual(panel.options.minWidth);
            expect(panel.size.height).toBeGreaterThanOrEqual(panel.options.minHeight);
        });

        it('should enforce max size constraints', () => {
            panel.isResizing = true;
            panel.resizeDirection = 'se';
            panel.resizeStartX = 100;
            panel.resizeStartY = 100;
            panel.resizeStartWidth = 320;
            panel.resizeStartHeight = 480;
            
            // Try to resize larger than max
            panel.handleResizeMove({ clientX: 2000, clientY: 2000 });
            
            expect(panel.size.width).toBeLessThanOrEqual(panel.options.maxWidth);
            expect(panel.size.height).toBeLessThanOrEqual(panel.options.maxHeight);
        });

        it('should end resize and save position', () => {
            panel.isResizing = true;
            panel.resizeDirection = 'se';
            
            panel.handleResizeEnd();
            
            expect(panel.isResizing).toBe(false);
            expect(panel.resizeDirection).toBeNull();
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('position persistence', () => {
        it('should save position to localStorage', () => {
            panel = new DraggablePanel({ id: 'persist-test' });
            panel.position = { x: 100, y: 200 };
            panel.size = { width: 400, height: 500 };
            
            panel.savePosition();
            
            expect(localStorage.setItem).toHaveBeenCalledWith(
                'draggablePanel_persist-test',
                expect.any(String)
            );
            
            const savedData = JSON.parse(mockLocalStorage['draggablePanel_persist-test']);
            expect(savedData.x).toBe(100);
            expect(savedData.y).toBe(200);
            expect(savedData.width).toBe(400);
            expect(savedData.height).toBe(500);
        });

        it('should load position from localStorage', () => {
            mockLocalStorage['draggablePanel_load-test'] = JSON.stringify({
                x: 150,
                y: 250,
                width: 350,
                height: 450
            });
            
            panel = new DraggablePanel({ id: 'load-test' });
            
            expect(panel.position.x).toBe(150);
            expect(panel.position.y).toBe(250);
            expect(panel.size.width).toBe(350);
            expect(panel.size.height).toBe(450);
        });

        it('should use default position if no saved position', () => {
            panel = new DraggablePanel({
                id: 'new-panel',
                defaultPosition: { x: 50, y: 75 }
            });
            
            expect(panel.position.x).toBe(50);
            expect(panel.position.y).toBe(75);
        });

        it('should center if no saved or default position', () => {
            panel = new DraggablePanel({ id: 'center-panel' });
            
            const expectedX = (window.innerWidth - panel.size.width) / 2;
            const expectedY = (window.innerHeight - panel.size.height) / 2;
            
            expect(panel.position.x).toBe(expectedX);
            expect(panel.position.y).toBe(expectedY);
        });

        it('should constrain loaded position to viewport', () => {
            mockLocalStorage['draggablePanel_offscreen'] = JSON.stringify({
                x: 5000,
                y: 5000,
                width: 320,
                height: 480
            });
            
            panel = new DraggablePanel({ id: 'offscreen' });
            
            expect(panel.position.x).toBeLessThanOrEqual(window.innerWidth - panel.size.width);
            expect(panel.position.y).toBeLessThanOrEqual(window.innerHeight - panel.size.height);
        });
    });

    describe('content management', () => {
        beforeEach(() => {
            panel = new DraggablePanel();
        });

        it('should set string content', () => {
            panel.setContent('<p>Test content</p>');
            expect(panel.contentElement.innerHTML).toBe('<p>Test content</p>');
        });

        it('should set HTMLElement content', () => {
            const div = document.createElement('div');
            div.textContent = 'Element content';
            
            panel.setContent(div);
            
            expect(panel.contentElement.contains(div)).toBe(true);
        });

        it('should clear previous content when setting', () => {
            panel.setContent('First');
            panel.setContent('Second');
            
            expect(panel.contentElement.innerHTML).toBe('Second');
        });

        it('should append string content', () => {
            panel.setContent('<p>First</p>');
            panel.appendContent('<p>Second</p>');
            
            expect(panel.contentElement.innerHTML).toBe('<p>First</p><p>Second</p>');
        });

        it('should append HTMLElement content', () => {
            const div = document.createElement('div');
            div.id = 'appended';
            
            panel.appendContent(div);
            
            expect(panel.contentElement.querySelector('#appended')).toBe(div);
        });

        it('should set title', () => {
            panel.setTitle('New Title');
            
            const titleEl = panel.headerElement.querySelector('.draggable-panel-title');
            expect(titleEl.textContent).toBe('New Title');
        });
    });

    describe('bringToFront', () => {
        it('should set z-index higher than other panels', () => {
            panel = new DraggablePanel({ id: 'panel1' });
            const panel2 = new DraggablePanel({ id: 'panel2' });
            
            panel.element.style.zIndex = '1000';
            panel2.element.style.zIndex = '1001';
            
            panel.bringToFront();
            
            expect(parseInt(panel.element.style.zIndex)).toBeGreaterThan(1001);
            
            panel2.destroy();
        });
    });

    describe('centerInViewport', () => {
        it('should center panel in viewport', () => {
            panel = new DraggablePanel({ defaultWidth: 400, defaultHeight: 300 });
            
            panel.centerInViewport();
            
            expect(panel.position.x).toBe((1920 - 400) / 2);
            expect(panel.position.y).toBe((1080 - 300) / 2);
        });
    });

    describe('destroy', () => {
        it('should remove element from DOM', () => {
            panel = new DraggablePanel();
            expect(document.body.contains(panel.element)).toBe(true);
            
            panel.destroy();
            
            expect(document.body.contains(panel.element)).toBe(false);
        });

        it('should remove event listeners', () => {
            panel = new DraggablePanel();
            const removeListenerSpy = vi.spyOn(document, 'removeEventListener');
            
            panel.destroy();
            
            expect(removeListenerSpy).toHaveBeenCalled();
        });
    });
});
