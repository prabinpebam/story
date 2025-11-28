import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PanelManager, panelManager } from '../../../src/ui/PanelManager.js';

describe('PanelManager', () => {
    let manager;
    let mockPanel;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new PanelManager();
        
        // Create mock panel
        mockPanel = {
            isOpen: false,
            element: { style: { zIndex: '1000' } },
            open: vi.fn(() => { mockPanel.isOpen = true; }),
            close: vi.fn(() => { mockPanel.isOpen = false; }),
            toggle: vi.fn(() => { mockPanel.isOpen = !mockPanel.isOpen; }),
            destroy: vi.fn(),
            position: { x: 0, y: 0 },
            size: { width: 300, height: 400 },
            updatePosition: vi.fn(),
            updateSize: vi.fn()
        };
    });

    afterEach(() => {
        // Cleanup
    });

    describe('initialization', () => {
        it('creates empty panels map', () => {
            expect(manager.panels.size).toBe(0);
        });

        it('initializes top z-index', () => {
            expect(manager.topZIndex).toBe(1000);
        });

        it('creates empty shortcuts map', () => {
            expect(manager.shortcuts.size).toBe(0);
        });
    });

    describe('register', () => {
        it('adds panel to map', () => {
            manager.register('test', mockPanel);
            expect(manager.panels.has('test')).toBe(true);
            expect(manager.panels.get('test')).toBe(mockPanel);
        });

        it('warns on duplicate registration', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            manager.register('test', mockPanel);
            manager.register('test', mockPanel);
            
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('already registered'));
            warnSpy.mockRestore();
        });

        it('registers keyboard shortcut if provided', () => {
            manager.register('test', mockPanel, { shortcut: 'ctrl+shift+t' });
            expect(manager.shortcuts.has('ctrl+shift+t')).toBe(true);
        });

        it('logs registration', () => {
            const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            manager.register('test', mockPanel);
            
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('registered'));
            logSpy.mockRestore();
        });
    });

    describe('unregister', () => {
        beforeEach(() => {
            manager.register('test', mockPanel, { shortcut: 'ctrl+t' });
        });

        it('removes panel from map', () => {
            manager.unregister('test');
            expect(manager.panels.has('test')).toBe(false);
        });

        it('calls destroy on panel', () => {
            manager.unregister('test');
            expect(mockPanel.destroy).toHaveBeenCalled();
        });

        it('removes associated shortcuts', () => {
            manager.unregister('test');
            expect(manager.shortcuts.has('ctrl+t')).toBe(false);
        });

        it('does nothing for non-existent panel', () => {
            expect(() => manager.unregister('nonexistent')).not.toThrow();
        });
    });

    describe('open', () => {
        beforeEach(() => {
            manager.register('test', mockPanel);
        });

        it('opens the panel', () => {
            manager.open('test');
            expect(mockPanel.open).toHaveBeenCalled();
        });

        it('brings panel to front', () => {
            mockPanel.open.mockImplementation(() => { mockPanel.isOpen = true; });
            manager.open('test');
            expect(parseInt(mockPanel.element.style.zIndex)).toBeGreaterThan(1000);
        });

        it('warns for non-existent panel', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            
            manager.open('nonexistent');
            
            expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
            warnSpy.mockRestore();
        });
    });

    describe('close', () => {
        beforeEach(() => {
            manager.register('test', mockPanel);
        });

        it('closes the panel', () => {
            manager.close('test');
            expect(mockPanel.close).toHaveBeenCalled();
        });

        it('does nothing for non-existent panel', () => {
            expect(() => manager.close('nonexistent')).not.toThrow();
        });
    });

    describe('toggle', () => {
        beforeEach(() => {
            manager.register('test', mockPanel);
        });

        it('toggles the panel', () => {
            manager.toggle('test');
            expect(mockPanel.toggle).toHaveBeenCalled();
        });

        it('brings panel to front if opened', () => {
            mockPanel.toggle.mockImplementation(() => { mockPanel.isOpen = true; });
            manager.toggle('test');
            expect(parseInt(mockPanel.element.style.zIndex)).toBeGreaterThan(1000);
        });
    });

    describe('bringToFront', () => {
        it('increments topZIndex', () => {
            manager.register('test', mockPanel);
            mockPanel.isOpen = true;
            
            const initialZ = manager.topZIndex;
            manager.bringToFront('test');
            
            expect(manager.topZIndex).toBe(initialZ + 1);
        });

        it('sets panel z-index to new top value', () => {
            manager.register('test', mockPanel);
            mockPanel.isOpen = true;
            
            manager.bringToFront('test');
            
            expect(parseInt(mockPanel.element.style.zIndex)).toBe(manager.topZIndex);
        });

        it('does nothing for closed panel', () => {
            manager.register('test', mockPanel);
            mockPanel.isOpen = false;
            
            const initialZ = manager.topZIndex;
            manager.bringToFront('test');
            
            expect(manager.topZIndex).toBe(initialZ);
        });
    });

    describe('closeAll', () => {
        it('closes all panels', () => {
            const panel1 = { ...mockPanel, close: vi.fn() };
            const panel2 = { ...mockPanel, close: vi.fn() };
            
            manager.register('panel1', panel1);
            manager.register('panel2', panel2);
            
            manager.closeAll();
            
            expect(panel1.close).toHaveBeenCalled();
            expect(panel2.close).toHaveBeenCalled();
        });
    });

    describe('get', () => {
        it('returns registered panel', () => {
            manager.register('test', mockPanel);
            expect(manager.get('test')).toBe(mockPanel);
        });

        it('returns undefined for non-existent panel', () => {
            expect(manager.get('nonexistent')).toBeUndefined();
        });
    });

    describe('isOpen', () => {
        beforeEach(() => {
            manager.register('test', mockPanel);
        });

        it('returns true when panel is open', () => {
            mockPanel.isOpen = true;
            expect(manager.isOpen('test')).toBe(true);
        });

        it('returns false when panel is closed', () => {
            mockPanel.isOpen = false;
            expect(manager.isOpen('test')).toBe(false);
        });

        it('returns false for non-existent panel', () => {
            expect(manager.isOpen('nonexistent')).toBe(false);
        });
    });

    describe('getRegisteredIds', () => {
        it('returns all registered panel IDs', () => {
            manager.register('panel1', mockPanel);
            manager.register('panel2', { ...mockPanel });
            
            const ids = manager.getRegisteredIds();
            
            expect(ids).toContain('panel1');
            expect(ids).toContain('panel2');
            expect(ids.length).toBe(2);
        });

        it('returns empty array when no panels registered', () => {
            expect(manager.getRegisteredIds()).toEqual([]);
        });
    });

    describe('getOpenIds', () => {
        it('returns only open panel IDs', () => {
            const panel1 = { ...mockPanel, isOpen: true };
            const panel2 = { ...mockPanel, isOpen: false };
            const panel3 = { ...mockPanel, isOpen: true };
            
            manager.register('panel1', panel1);
            manager.register('panel2', panel2);
            manager.register('panel3', panel3);
            
            const openIds = manager.getOpenIds();
            
            expect(openIds).toContain('panel1');
            expect(openIds).not.toContain('panel2');
            expect(openIds).toContain('panel3');
        });
    });

    describe('registerShortcut', () => {
        it('registers shortcut', () => {
            manager.registerShortcut('ctrl+shift+p', 'test');
            expect(manager.shortcuts.get('ctrl+shift+p')).toBe('test');
        });

        it('lowercases shortcut', () => {
            manager.registerShortcut('CTRL+SHIFT+P', 'test');
            expect(manager.shortcuts.has('ctrl+shift+p')).toBe(true);
        });
    });

    describe('unregisterShortcut', () => {
        it('removes shortcut', () => {
            manager.registerShortcut('ctrl+p', 'test');
            manager.unregisterShortcut('ctrl+p');
            expect(manager.shortcuts.has('ctrl+p')).toBe(false);
        });
    });

    describe('keyboard shortcuts', () => {
        it('toggles panel on shortcut key', () => {
            manager.register('test', mockPanel, { shortcut: 'ctrl+shift+t' });
            
            const event = new KeyboardEvent('keydown', {
                key: 't',
                ctrlKey: true,
                shiftKey: true,
                bubbles: true
            });
            
            const toggleSpy = vi.spyOn(manager, 'toggle');
            document.dispatchEvent(event);
            
            expect(toggleSpy).toHaveBeenCalledWith('test');
        });

        it('closes topmost panel on Escape', () => {
            const panel1 = { ...mockPanel, isOpen: true, element: { style: { zIndex: '1001' } } };
            const panel2 = { ...mockPanel, isOpen: true, element: { style: { zIndex: '1002' } }, close: vi.fn() };
            
            manager.register('panel1', panel1);
            manager.register('panel2', panel2);
            
            const event = new KeyboardEvent('keydown', {
                key: 'Escape',
                bubbles: true
            });
            document.dispatchEvent(event);
            
            expect(panel2.close).toHaveBeenCalled();
        });
    });

    describe('tileHorizontal', () => {
        it('tiles open panels horizontally', () => {
            const panel1 = { ...mockPanel, isOpen: true, position: { x: 0, y: 0 }, size: { width: 300, height: 400 } };
            const panel2 = { ...mockPanel, isOpen: true, position: { x: 0, y: 0 }, size: { width: 300, height: 400 } };
            
            manager.register('panel1', panel1);
            manager.register('panel2', panel2);
            
            manager.tileHorizontal();
            
            expect(panel1.updatePosition).toHaveBeenCalled();
            expect(panel2.updatePosition).toHaveBeenCalled();
        });

        it('does nothing when no panels open', () => {
            expect(() => manager.tileHorizontal()).not.toThrow();
        });
    });

    describe('cascade', () => {
        it('cascades open panels', () => {
            const panel1 = { ...mockPanel, isOpen: true, position: { x: 0, y: 0 } };
            const panel2 = { ...mockPanel, isOpen: true, position: { x: 0, y: 0 } };
            
            manager.register('panel1', panel1);
            manager.register('panel2', panel2);
            
            manager.cascade();
            
            expect(panel1.updatePosition).toHaveBeenCalled();
            expect(panel2.updatePosition).toHaveBeenCalled();
            expect(panel2.position.x).toBeGreaterThan(panel1.position.x);
            expect(panel2.position.y).toBeGreaterThan(panel1.position.y);
        });
    });

    describe('singleton export', () => {
        it('exports singleton instance', () => {
            expect(panelManager).toBeDefined();
            expect(panelManager).toBeInstanceOf(PanelManager);
        });
    });
});
