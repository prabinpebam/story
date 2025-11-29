/**
 * MenuConfig Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { menuConfig, getAllMenuActions, getMenuConfig } from '../../../src/ui/components/AppMenu/menuConfig.js';
import { tokenStorage } from '../../../src/core/auth/storage/TokenStorage.js';

describe('menuConfig', () => {
    describe('Structure', () => {
        it('should be an array', () => {
            expect(Array.isArray(menuConfig)).toBe(true);
        });

        it('should have items with required properties', () => {
            const itemsWithIds = menuConfig.filter(item => !item.divider);
            
            itemsWithIds.forEach(item => {
                expect(item.id).toBeDefined();
                expect(item.label).toBeDefined();
            });
        });

        it('should have divider items', () => {
            const dividers = menuConfig.filter(item => item.divider);
            expect(dividers.length).toBeGreaterThan(0);
        });
    });

    describe('File Menu Items', () => {
        it('should have New Presentation item', () => {
            const newItem = menuConfig.find(item => item.id === 'file-new');
            expect(newItem).toBeTruthy();
            expect(newItem.label).toBe('New Presentation');
            expect(newItem.shortcut).toBe('Ctrl+N');
        });

        it('should have Open item', () => {
            const openItem = menuConfig.find(item => item.id === 'file-open');
            expect(openItem).toBeTruthy();
            expect(openItem.shortcut).toBe('Ctrl+O');
        });

        it('should have Save item', () => {
            const saveItem = menuConfig.find(item => item.id === 'file-save');
            expect(saveItem).toBeTruthy();
            expect(saveItem.shortcut).toBe('Ctrl+S');
        });

        it('should have Save As item', () => {
            const saveAsItem = menuConfig.find(item => item.id === 'file-save-as');
            expect(saveAsItem).toBeTruthy();
            expect(saveAsItem.shortcut).toBe('Ctrl+Shift+S');
        });

        it('should have Recent submenu', () => {
            const recentItem = menuConfig.find(item => item.id === 'file-recent');
            expect(recentItem).toBeTruthy();
            expect(recentItem.submenu).toBeDefined();
            expect(Array.isArray(recentItem.submenu)).toBe(true);
        });

        it('should have Export submenu', () => {
            const exportItem = menuConfig.find(item => item.id === 'file-export');
            expect(exportItem).toBeTruthy();
            expect(exportItem.submenu).toBeDefined();
        });
    });

    describe('Edit Menu', () => {
        it('should have Edit submenu', () => {
            const editItem = menuConfig.find(item => item.id === 'edit');
            expect(editItem).toBeTruthy();
            expect(editItem.submenu).toBeDefined();
        });

        it('should have Undo in Edit submenu', () => {
            const editItem = menuConfig.find(item => item.id === 'edit');
            const undo = editItem.submenu.find(item => item.id === 'edit-undo');
            expect(undo).toBeTruthy();
            expect(undo.shortcut).toBe('Ctrl+Z');
        });

        it('should have Redo in Edit submenu', () => {
            const editItem = menuConfig.find(item => item.id === 'edit');
            const redo = editItem.submenu.find(item => item.id === 'edit-redo');
            expect(redo).toBeTruthy();
            expect(redo.shortcut).toBe('Ctrl+Shift+Z');
        });
    });

    describe('View Menu', () => {
        it('should have View submenu', () => {
            const viewItem = menuConfig.find(item => item.id === 'view');
            expect(viewItem).toBeTruthy();
            expect(viewItem.submenu).toBeDefined();
        });

        it('should have Theme submenu', () => {
            const viewItem = menuConfig.find(item => item.id === 'view');
            const themeItem = viewItem.submenu.find(item => item.id === 'view-theme');
            expect(themeItem).toBeTruthy();
            expect(themeItem.submenu).toBeDefined();
        });
    });

    describe('Slide Menu', () => {
        it('should have Slide submenu', () => {
            const slideItem = menuConfig.find(item => item.id === 'slide');
            expect(slideItem).toBeTruthy();
            expect(slideItem.submenu).toBeDefined();
        });
    });

    describe('Arrange Menu', () => {
        it('should have Arrange submenu', () => {
            const arrangeItem = menuConfig.find(item => item.id === 'arrange');
            expect(arrangeItem).toBeTruthy();
            expect(arrangeItem.submenu).toBeDefined();
        });

        it('should have Align submenu', () => {
            const arrangeItem = menuConfig.find(item => item.id === 'arrange');
            const alignItem = arrangeItem.submenu.find(item => item.id === 'arrange-align');
            expect(alignItem).toBeTruthy();
            expect(alignItem.submenu).toBeDefined();
        });
    });

    describe('Insert Menu', () => {
        it('should have Insert submenu', () => {
            const insertItem = menuConfig.find(item => item.id === 'insert');
            expect(insertItem).toBeTruthy();
            expect(insertItem.submenu).toBeDefined();
        });
    });

    describe('Present Menu', () => {
        it('should have Present submenu', () => {
            const presentItem = menuConfig.find(item => item.id === 'present');
            expect(presentItem).toBeTruthy();
            expect(presentItem.submenu).toBeDefined();
        });
    });

    describe('Settings', () => {
        it('should have Settings item', () => {
            const settingsItem = menuConfig.find(item => item.id === 'settings');
            expect(settingsItem).toBeTruthy();
            expect(settingsItem.shortcut).toBe('Ctrl+,');
        });
    });

    describe('Help Menu', () => {
        it('should have Help submenu', () => {
            const helpItem = menuConfig.find(item => item.id === 'help');
            expect(helpItem).toBeTruthy();
            expect(helpItem.submenu).toBeDefined();
        });
    });
});

describe('getAllMenuActions', () => {
    it('should return array of action IDs', () => {
        const actions = getAllMenuActions();
        
        expect(Array.isArray(actions)).toBe(true);
        expect(actions.length).toBeGreaterThan(0);
    });

    it('should include file actions', () => {
        const actions = getAllMenuActions();
        
        expect(actions).toContain('file-new');
        expect(actions).toContain('file-open');
        expect(actions).toContain('file-save');
        expect(actions).toContain('file-save-as');
    });

    it('should include nested submenu actions', () => {
        const actions = getAllMenuActions();
        
        expect(actions).toContain('edit-undo');
        expect(actions).toContain('edit-redo');
        expect(actions).toContain('align-left');
        expect(actions).toContain('export-pdf');
    });

    it('should not include dividers', () => {
        const actions = getAllMenuActions();
        
        actions.forEach(action => {
            expect(action).not.toBe('divider');
            expect(typeof action).toBe('string');
        });
    });
});

describe('getMenuConfig - Dynamic Cloud Items', () => {
    let getProviderSpy;
    let isAuthenticatedSpy;

    beforeEach(() => {
        getProviderSpy = vi.spyOn(tokenStorage, 'getProvider');
        isAuthenticatedSpy = vi.spyOn(tokenStorage, 'isAuthenticated');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return function that generates config', () => {
        expect(typeof getMenuConfig).toBe('function');
        const config = getMenuConfig();
        expect(Array.isArray(config)).toBe(true);
    });

    describe('when not authenticated', () => {
        beforeEach(() => {
            getProviderSpy.mockReturnValue(null);
            isAuthenticatedSpy.mockReturnValue(false);
        });

        it('should show both cloud providers in Open submenu', () => {
            const config = getMenuConfig();
            const openCloud = config.find(item => item.id === 'file-open-cloud');
            
            expect(openCloud).toBeTruthy();
            expect(openCloud.submenu).toHaveLength(2);
            
            const oneDrive = openCloud.submenu.find(item => item.id === 'open-onedrive');
            const googleDrive = openCloud.submenu.find(item => item.id === 'open-google-drive');
            
            expect(oneDrive).toBeTruthy();
            expect(googleDrive).toBeTruthy();
        });

        it('should show both cloud providers in Save submenu', () => {
            const config = getMenuConfig();
            const saveCloud = config.find(item => item.id === 'file-save-cloud');
            
            expect(saveCloud).toBeTruthy();
            expect(saveCloud.submenu).toHaveLength(2);
            
            const oneDrive = saveCloud.submenu.find(item => item.id === 'save-onedrive');
            const googleDrive = saveCloud.submenu.find(item => item.id === 'save-google-drive');
            
            expect(oneDrive).toBeTruthy();
            expect(googleDrive).toBeTruthy();
        });
    });

    describe('when authenticated with Microsoft', () => {
        beforeEach(() => {
            getProviderSpy.mockReturnValue('microsoft');
            isAuthenticatedSpy.mockReturnValue(true);
        });

        it('should only show OneDrive in Open submenu', () => {
            const config = getMenuConfig();
            const openCloud = config.find(item => item.id === 'file-open-cloud');
            
            expect(openCloud.submenu).toHaveLength(1);
            expect(openCloud.submenu[0].id).toBe('open-onedrive');
            expect(openCloud.submenu[0].label).toBe('OneDrive...');
        });

        it('should only show OneDrive in Save submenu', () => {
            const config = getMenuConfig();
            const saveCloud = config.find(item => item.id === 'file-save-cloud');
            
            expect(saveCloud.submenu).toHaveLength(1);
            expect(saveCloud.submenu[0].id).toBe('save-onedrive');
            expect(saveCloud.submenu[0].label).toBe('OneDrive...');
        });
    });

    describe('when authenticated with Google', () => {
        beforeEach(() => {
            getProviderSpy.mockReturnValue('google');
            isAuthenticatedSpy.mockReturnValue(true);
        });

        it('should only show Google Drive in Open submenu', () => {
            const config = getMenuConfig();
            const openCloud = config.find(item => item.id === 'file-open-cloud');
            
            expect(openCloud.submenu).toHaveLength(1);
            expect(openCloud.submenu[0].id).toBe('open-google-drive');
            expect(openCloud.submenu[0].label).toBe('Google Drive...');
        });

        it('should only show Google Drive in Save submenu', () => {
            const config = getMenuConfig();
            const saveCloud = config.find(item => item.id === 'file-save-cloud');
            
            expect(saveCloud.submenu).toHaveLength(1);
            expect(saveCloud.submenu[0].id).toBe('save-google-drive');
            expect(saveCloud.submenu[0].label).toBe('Google Drive...');
        });
    });
});
