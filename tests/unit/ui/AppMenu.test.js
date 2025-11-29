/**
 * AppMenu Component Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock DOM structure
function createMockContainer() {
    const container = document.createElement('div');
    container.id = 'app-menu-container';
    container.className = 'sidebar-header';
    document.body.appendChild(container);
    return container;
}

describe('AppMenu', () => {
    let container;

    beforeEach(() => {
        container = createMockContainer();
    });

    afterEach(() => {
        container.remove();
        // Clean up any dropdown elements
        document.querySelectorAll('.app-menu-dropdown').forEach(el => el.remove());
    });

    describe('Initialization', () => {
        it('should create menu trigger button', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            const trigger = container.querySelector('.app-menu-trigger');
            expect(trigger).toBeTruthy();
        });

        it('should display Story logo', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            const logo = container.querySelector('.app-menu-logo');
            expect(logo).toBeTruthy();
            expect(logo.src).toContain('story.png');
        });

        it('should display STORY title', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            const title = container.querySelector('.app-menu-title');
            expect(title).toBeTruthy();
            expect(title.textContent).toBe('STORY');
        });

        it('should have ARIA attributes for accessibility', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            const trigger = container.querySelector('.app-menu-trigger');
            expect(trigger.getAttribute('aria-haspopup')).toBe('true');
            expect(trigger.getAttribute('aria-expanded')).toBe('false');
            expect(trigger.getAttribute('aria-label')).toBe('Story application menu');
        });
    });

    describe('Menu Behavior', () => {
        it('should open dropdown on click', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            const trigger = container.querySelector('.app-menu-trigger');
            trigger.click();
            
            // Wait for dropdown to be added to DOM
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const dropdown = document.querySelector('.app-menu-dropdown');
            expect(dropdown).toBeTruthy();
        });

        it('should update aria-expanded when opened', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            const trigger = container.querySelector('.app-menu-trigger');
            trigger.click();
            
            expect(trigger.getAttribute('aria-expanded')).toBe('true');
        });

        it('should close dropdown when clicking outside', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            const trigger = container.querySelector('.app-menu-trigger');
            trigger.click();
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Click outside
            document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            expect(menu.isOpen).toBe(false);
        });

        it('should close dropdown on Escape key', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            const trigger = container.querySelector('.app-menu-trigger');
            trigger.click();
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            
            expect(menu.isOpen).toBe(false);
        });
    });

    describe('Menu Actions', () => {
        it('should dispatch menu action event when item clicked', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            const actionHandler = vi.fn();
            window.addEventListener('story:menu-action', actionHandler);
            
            const trigger = container.querySelector('.app-menu-trigger');
            trigger.click();
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const menuItem = document.querySelector('.app-menu-item');
            if (menuItem) {
                menuItem.click();
                expect(actionHandler).toHaveBeenCalled();
            }
            
            window.removeEventListener('story:menu-action', actionHandler);
        });
    });

    describe('Cleanup', () => {
        it('should cleanup on destroy', async () => {
            const { AppMenu } = await import('../../../src/ui/components/AppMenu/AppMenu.js');
            const menu = new AppMenu('app-menu-container');
            
            menu.destroy();
            
            const trigger = container.querySelector('.app-menu-trigger');
            expect(trigger).toBeFalsy();
        });
    });
});
