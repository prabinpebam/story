import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted() for mock functions
const { mockConfigure, mockGetConfig, MockDropdown } = vi.hoisted(() => ({
    mockConfigure: vi.fn(),
    mockGetConfig: vi.fn(() => ({
        provider: 'openai',
        apiKey: '',
        model: 'gpt-4o',
        endpoint: '',
        deployment: '',
        apiVersion: '2024-04-01-preview'
    })),
    MockDropdown: vi.fn()
}));

// Mock aiService
vi.mock('../../../src/core/ai/AIService.js', () => ({
    aiService: {
        configure: mockConfigure,
        get config() {
            return mockGetConfig();
        }
    }
}));

// Mock Dropdown component
vi.mock('../../../src/ui/components/Dropdown.js', () => ({
    Dropdown: MockDropdown
}));

import { SettingsModal } from '../../../src/ui/SettingsModal.js';

describe('SettingsModal', () => {
    let modal;
    let mockLocalStorage;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset mock implementations
        mockConfigure.mockClear();
        mockGetConfig.mockReturnValue({
            provider: 'openai',
            apiKey: '',
            model: 'gpt-4o',
            endpoint: '',
            deployment: '',
            apiVersion: '2024-04-01-preview'
        });
        
        // Set up Dropdown mock to return proper element
        MockDropdown.mockImplementation(({ options, value, onChange }) => {
            const element = document.createElement('div');
            element.className = 'mock-dropdown';
            return {
                element,
                value,
                options
            };
        });
        
        // Mock localStorage
        mockLocalStorage = {
            getItem: vi.fn().mockReturnValue(null),
            setItem: vi.fn()
        };
        vi.stubGlobal('localStorage', mockLocalStorage);
        
        modal = new SettingsModal();
    });

    afterEach(() => {
        // Cleanup modal from DOM
        if (modal.overlay && modal.overlay.parentNode) {
            modal.overlay.parentNode.removeChild(modal.overlay);
        }
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(modal).toBeDefined();
            expect(modal instanceof SettingsModal).toBe(true);
        });

        it('should set default active tab to ai', () => {
            expect(modal.activeTab).toBe('ai');
        });

        it('should create overlay element', () => {
            expect(modal.overlay).toBeDefined();
            expect(modal.overlay.className).toBe('modal-overlay');
        });

        it('should create modal content element', () => {
            expect(modal.modal).toBeDefined();
            expect(modal.modal.className).toBe('modal-content');
        });

        it('should create sidebar element', () => {
            expect(modal.sidebar).toBeDefined();
            expect(modal.sidebar.className).toBe('modal-sidebar');
        });

        it('should append overlay to document body', () => {
            expect(document.body.contains(modal.overlay)).toBe(true);
        });

        it('should initially hide overlay', () => {
            expect(modal.overlay.style.display).toBe('none');
        });
    });

    describe('open()', () => {
        it('should display overlay', () => {
            modal.open();
            
            expect(modal.overlay.style.display).toBe('flex');
        });

        it('should render sidebar', () => {
            modal.open();
            
            const navItems = modal.sidebar.querySelectorAll('.modal-nav-item');
            expect(navItems.length).toBeGreaterThan(0);
        });

        it('should render content', () => {
            modal.open();
            
            expect(modal.body.innerHTML).not.toBe('');
        });
    });

    describe('close()', () => {
        it('should hide overlay', () => {
            modal.open();
            modal.close();
            
            expect(modal.overlay.style.display).toBe('none');
        });
    });

    describe('switchTab()', () => {
        beforeEach(() => {
            modal.open();
        });

        it('should update activeTab property', () => {
            modal.switchTab('appearance');
            
            expect(modal.activeTab).toBe('appearance');
        });

        it('should re-render sidebar with new active state', () => {
            modal.switchTab('appearance');
            
            const activeItem = modal.sidebar.querySelector('.modal-nav-item.active');
            expect(activeItem.textContent).toContain('Appearance');
        });

        it('should render new tab content', () => {
            modal.switchTab('appearance');
            
            const title = modal.header.querySelector('#modal-title');
            expect(title.innerText).toBe('Appearance');
        });
    });

    describe('renderSidebar()', () => {
        beforeEach(() => {
            modal.open();
        });

        it('should render AI Provider tab', () => {
            const aiTab = modal.sidebar.querySelector('.modal-nav-item');
            expect(aiTab.textContent).toContain('AI Provider');
        });

        it('should render Appearance tab', () => {
            const tabs = modal.sidebar.querySelectorAll('.modal-nav-item');
            const appearanceTab = Array.from(tabs).find(t => t.textContent.includes('Appearance'));
            expect(appearanceTab).toBeDefined();
        });

        it('should mark active tab', () => {
            const activeTab = modal.sidebar.querySelector('.modal-nav-item.active');
            expect(activeTab).toBeDefined();
        });
    });

    describe('renderAIContent()', () => {
        beforeEach(() => {
            modal.open();
            modal.switchTab('ai');
        });

        it('should render provider dropdown', () => {
            expect(modal.providerDropdown).toBeDefined();
        });

        it('should render API key input', () => {
            expect(modal.apiKeyInput).toBeDefined();
            expect(modal.apiKeyInput.type).toBe('password');
        });

        it('should render model input', () => {
            expect(modal.modelInput).toBeDefined();
        });

        it('should render save button', () => {
            const saveBtn = modal.body.querySelector('.btn-primary');
            expect(saveBtn).toBeDefined();
            expect(saveBtn.innerText).toBe('Save AI Settings');
        });
    });

    describe('renderAppearanceContent()', () => {
        beforeEach(() => {
            modal.open();
            modal.switchTab('appearance');
        });

        it('should render theme form group', () => {
            const groups = modal.body.querySelectorAll('.form-group');
            expect(groups.length).toBeGreaterThan(0);
        });

        it('should have Mode label for dark/light toggle', () => {
            const label = modal.body.querySelector('label');
            expect(label.innerText).toBe('Mode');
        });
        
        it('should have Accent Color section', () => {
            const labels = modal.body.querySelectorAll('label');
            const accentLabel = Array.from(labels).find(l => l.innerText === 'Accent Color');
            expect(accentLabel).toBeTruthy();
        });
        
        it('should render theme cards grid', () => {
            const grid = modal.body.querySelector('.theme-cards-grid');
            expect(grid).toBeTruthy();
        });
        
        it('should have 5 accent theme options', () => {
            const cards = modal.body.querySelectorAll('.theme-card');
            expect(cards.length).toBe(5);
        });
        
        it('should have Preview section', () => {
            const labels = modal.body.querySelectorAll('label');
            const previewLabel = Array.from(labels).find(l => l.innerText === 'Preview');
            expect(previewLabel).toBeTruthy();
        });
        
        it('should render interactive preview elements', () => {
            const preview = modal.body.querySelector('.theme-preview');
            expect(preview).toBeTruthy();
            
            const buttons = preview.querySelectorAll('button');
            expect(buttons.length).toBe(2);
            
            const input = preview.querySelector('input');
            expect(input).toBeTruthy();
        });
    });

    describe('saveAISettings()', () => {
        beforeEach(() => {
            modal.open();
            modal.switchTab('ai');
        });

        it('should call aiService.configure', () => {
            modal.apiKeyInput.value = 'sk-test123';
            modal.modelInput.value = 'gpt-4';
            
            modal.saveAISettings();
            
            expect(mockConfigure).toHaveBeenCalled();
        });

        it('should pass correct settings', () => {
            modal.apiKeyInput.value = 'sk-test123';
            modal.modelInput.value = 'gpt-4';
            
            modal.saveAISettings();
            
            expect(mockConfigure).toHaveBeenCalledWith(expect.objectContaining({
                apiKey: 'sk-test123',
                model: 'gpt-4'
            }));
        });

        it('should close modal after saving', () => {
            modal.saveAISettings();
            
            expect(modal.overlay.style.display).toBe('none');
        });
    });

    describe('loadTheme()', () => {
        it('should apply light theme if stored', () => {
            mockLocalStorage.getItem.mockReturnValue('light');
            
            modal.loadTheme();
            
            expect(document.body.classList.contains('theme-light')).toBe(true);
        });

        it('should not apply light class if dark theme stored', () => {
            mockLocalStorage.getItem.mockReturnValue('dark');
            document.body.classList.remove('theme-light');
            
            modal.loadTheme();
            
            expect(document.body.classList.contains('theme-light')).toBe(false);
        });
    });

    describe('event binding', () => {
        it('should close on close button click', () => {
            modal.open();
            
            const closeBtn = modal.overlay.querySelector('.close-btn');
            closeBtn.click();
            
            expect(modal.overlay.style.display).toBe('none');
        });

        it('should close on overlay click', () => {
            modal.open();
            
            // Simulate click on overlay (not modal content)
            const event = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(event, 'target', { value: modal.overlay });
            modal.overlay.dispatchEvent(event);
            
            expect(modal.overlay.style.display).toBe('none');
        });

        it('should not close when clicking modal content', () => {
            modal.open();
            
            const event = new MouseEvent('click', { bubbles: true });
            Object.defineProperty(event, 'target', { value: modal.modal });
            modal.overlay.dispatchEvent(event);
            
            expect(modal.overlay.style.display).toBe('flex');
        });
    });

    describe('updateAIFieldsVisibility()', () => {
        beforeEach(() => {
            modal.open();
            modal.switchTab('ai');
        });

        it('should hide azure fields for openai provider', () => {
            modal.providerDropdown.value = 'openai';
            modal.updateAIFieldsVisibility();
            
            expect(modal.azureContainer.style.display).toBe('none');
        });

        it('should show azure fields for azure provider', () => {
            modal.providerDropdown.value = 'azure';
            modal.updateAIFieldsVisibility();
            
            expect(modal.azureContainer.style.display).toBe('block');
        });
    });

    describe('createFormGroup()', () => {
        it('should create form group element', () => {
            const group = modal.createFormGroup('Test Label');
            
            expect(group.className).toBe('form-group');
        });

        it('should include label with text', () => {
            const group = modal.createFormGroup('Test Label');
            const label = group.querySelector('label');
            
            expect(label.innerText).toBe('Test Label');
        });
    });
});
