import { aiService } from '../core/ai/AIService.js';
import { Dropdown } from './components/Dropdown.js';

export class SettingsModal {
    constructor() {
        this.activeTab = 'ai'; // Default tab
        this.createModal();
        this.bindEvents();
        this.loadTheme();
    }

    createModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.display = 'none';
        
        this.modal = document.createElement('div');
        this.modal.className = 'modal-content';
        
        // Sidebar
        this.sidebar = document.createElement('div');
        this.sidebar.className = 'modal-sidebar';
        
        // Main Content Area
        this.main = document.createElement('div');
        this.main.className = 'modal-main';

        // Header
        this.header = document.createElement('div');
        this.header.className = 'modal-header';
        this.header.innerHTML = `
            <h3 id="modal-title">Settings</h3>
            <button class="close-btn"><i class="fa-solid fa-xmark"></i></button>
        `;

        // Body
        this.body = document.createElement('div');
        this.body.className = 'modal-body';
        
        this.main.appendChild(this.header);
        this.main.appendChild(this.body);

        this.modal.appendChild(this.sidebar);
        this.modal.appendChild(this.main);
        this.overlay.appendChild(this.modal);
        
        document.body.appendChild(this.overlay);
    }

    renderSidebar() {
        this.sidebar.innerHTML = '';
        const tabs = [
            { id: 'ai', label: 'AI Provider', icon: 'fa-robot' },
            { id: 'appearance', label: 'Appearance', icon: 'fa-palette' }
        ];

        tabs.forEach(tab => {
            const item = document.createElement('div');
            item.className = `modal-nav-item ${this.activeTab === tab.id ? 'active' : ''}`;
            item.innerHTML = `<i class="fa-solid ${tab.icon}" style="width: 20px;"></i> ${tab.label}`;
            item.onclick = () => this.switchTab(tab.id);
            this.sidebar.appendChild(item);
        });
    }

    switchTab(tabId) {
        this.activeTab = tabId;
        this.renderSidebar();
        this.renderContent();
    }

    renderContent() {
        this.body.innerHTML = '';
        const title = this.header.querySelector('#modal-title');

        if (this.activeTab === 'ai') {
            title.innerText = 'AI Configuration';
            this.renderAIContent();
        } else if (this.activeTab === 'appearance') {
            title.innerText = 'Appearance';
            this.renderAppearanceContent();
        }
    }

    createFormGroup(label) {
        const group = document.createElement('div');
        group.className = 'form-group';
        const lbl = document.createElement('label');
        lbl.innerText = label;
        group.appendChild(lbl);
        return group;
    }

    renderAIContent() {
        // Provider
        const providerGroup = this.createFormGroup('Provider');
        this.providerDropdown = new Dropdown({
            options: [
                { label: 'OpenAI', value: 'openai' },
                { label: 'Anthropic', value: 'anthropic' },
                { label: 'Azure', value: 'azure' }
            ],
            value: aiService.config.provider || 'openai',
            size: 'fill',
            onChange: () => this.updateAIFieldsVisibility()
        });
        providerGroup.appendChild(this.providerDropdown.element);
        this.body.appendChild(providerGroup);

        // API Key
        const keyGroup = this.createFormGroup('API Key');
        this.apiKeyInput = document.createElement('input');
        this.apiKeyInput.type = 'password';
        this.apiKeyInput.className = 'form-control';
        this.apiKeyInput.placeholder = 'sk-...';
        this.apiKeyInput.value = aiService.config.apiKey || '';
        keyGroup.appendChild(this.apiKeyInput);
        this.body.appendChild(keyGroup);

        // Azure Container
        this.azureContainer = document.createElement('div');
        
        // Endpoint
        const endpointGroup = this.createFormGroup('Endpoint URL');
        this.endpointInput = document.createElement('input');
        this.endpointInput.type = 'text';
        this.endpointInput.className = 'form-control';
        this.endpointInput.placeholder = 'https://...openai.azure.com/';
        this.endpointInput.value = aiService.config.endpoint || '';
        endpointGroup.appendChild(this.endpointInput);
        this.azureContainer.appendChild(endpointGroup);

        // Deployment
        const deploymentGroup = this.createFormGroup('Deployment Name');
        this.deploymentInput = document.createElement('input');
        this.deploymentInput.type = 'text';
        this.deploymentInput.className = 'form-control';
        this.deploymentInput.placeholder = 'e.g., gpt-5-chat';
        this.deploymentInput.value = aiService.config.deployment || '';
        deploymentGroup.appendChild(this.deploymentInput);
        this.azureContainer.appendChild(deploymentGroup);

        // API Version
        const apiVersionGroup = this.createFormGroup('API Version');
        this.apiVersionInput = document.createElement('input');
        this.apiVersionInput.type = 'text';
        this.apiVersionInput.className = 'form-control';
        this.apiVersionInput.placeholder = 'e.g., 2024-04-01-preview';
        this.apiVersionInput.value = aiService.config.apiVersion || '2024-04-01-preview';
        apiVersionGroup.appendChild(this.apiVersionInput);
        this.azureContainer.appendChild(apiVersionGroup);

        this.body.appendChild(this.azureContainer);

        // Model
        const modelGroup = this.createFormGroup('Model Name (Optional for Azure)');
        this.modelInput = document.createElement('input');
        this.modelInput.type = 'text';
        this.modelInput.className = 'form-control';
        this.modelInput.placeholder = 'gpt-4o, claude-3-5-sonnet...';
        this.modelInput.value = aiService.config.model || 'gpt-4o';
        modelGroup.appendChild(this.modelInput);
        this.body.appendChild(modelGroup);

        // Save Button
        const saveBtn = document.createElement('button');
        saveBtn.innerText = 'Save AI Settings';
        saveBtn.className = 'btn-primary';
        saveBtn.style.marginTop = '16px';
        saveBtn.onclick = () => this.saveAISettings();
        this.body.appendChild(saveBtn);

        this.updateAIFieldsVisibility();
    }

    updateAIFieldsVisibility() {
        const isAzure = this.providerDropdown.value === 'azure';
        this.azureContainer.style.display = isAzure ? 'block' : 'none';
    }

    saveAISettings() {
        aiService.configure({ 
            provider: this.providerDropdown.value,
            apiKey: this.apiKeyInput.value,
            model: this.modelInput.value,
            endpoint: this.endpointInput.value,
            deployment: this.deploymentInput.value,
            apiVersion: this.apiVersionInput.value
        });
        this.close();
    }

    renderAppearanceContent() {
        // Theme Mode Toggle (Dark/Light)
        const modeGroup = this.createFormGroup('Mode');
        
        const themeDropdown = new Dropdown({
            options: [
                { label: 'Dark', value: 'dark' },
                { label: 'Light', value: 'light' }
            ],
            value: document.body.classList.contains('theme-light') ? 'light' : 'dark',
            size: 'fill',
            onChange: (value) => {
                if (value === 'light') {
                    document.body.classList.add('theme-light');
                    localStorage.setItem('themeMode', 'light');
                } else {
                    document.body.classList.remove('theme-light');
                    localStorage.setItem('themeMode', 'dark');
                }
            }
        });

        modeGroup.appendChild(themeDropdown.element);
        this.body.appendChild(modeGroup);
        
        // Accent Theme Selection
        const accentGroup = this.createFormGroup('Accent Color');
        
        const accentThemes = [
            { id: 'default', label: 'Blue', color: '#18A0FB' },
            { id: 'purple', label: 'Purple', color: '#7C3AED' },
            { id: 'teal', label: 'Teal', color: '#14B8A6' },
            { id: 'orange', label: 'Orange', color: '#F97316' },
            { id: 'pink', label: 'Pink', color: '#EC4899' }
        ];
        
        const themesGrid = document.createElement('div');
        themesGrid.className = 'theme-cards-grid';
        themesGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: var(--spacing-3);
            margin-top: var(--spacing-2);
        `;
        
        const currentAccent = this.getCurrentAccentTheme();
        
        accentThemes.forEach(theme => {
            const card = this.createThemeCard(theme, currentAccent === theme.id);
            card.onclick = () => this.setAccentTheme(theme.id, themesGrid);
            themesGrid.appendChild(card);
        });
        
        accentGroup.appendChild(themesGrid);
        this.body.appendChild(accentGroup);
        
        // Theme Preview Section
        const previewGroup = this.createFormGroup('Preview');
        const previewContainer = this.createThemePreview();
        previewGroup.appendChild(previewContainer);
        this.body.appendChild(previewGroup);
    }
    
    createThemeCard(theme, isSelected) {
        const card = document.createElement('div');
        card.className = `theme-card ${isSelected ? 'selected' : ''}`;
        card.dataset.themeId = theme.id;
        card.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: var(--spacing-3);
            border-radius: var(--radius-md);
            border: 2px solid ${isSelected ? theme.color : 'var(--color-border)'};
            background: var(--color-bg-input);
            cursor: pointer;
            transition: all 0.15s ease;
        `;
        
        // Color swatch
        const swatch = document.createElement('div');
        swatch.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: var(--radius-full);
            background: ${theme.color};
            margin-bottom: var(--spacing-2);
            box-shadow: 0 2px 8px ${theme.color}40;
        `;
        card.appendChild(swatch);
        
        // Label
        const label = document.createElement('span');
        label.textContent = theme.label;
        label.style.cssText = `
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            font-weight: ${isSelected ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)'};
        `;
        card.appendChild(label);
        
        // Checkmark for selected
        if (isSelected) {
            const check = document.createElement('i');
            check.className = 'fa-solid fa-check';
            check.style.cssText = `
                position: absolute;
                top: var(--spacing-1);
                right: var(--spacing-1);
                color: ${theme.color};
                font-size: var(--font-size-xs);
            `;
            card.style.position = 'relative';
            card.appendChild(check);
        }
        
        // Hover effect
        card.onmouseenter = () => {
            if (!card.classList.contains('selected')) {
                card.style.borderColor = theme.color + '80';
                card.style.background = 'var(--color-bg-hover)';
            }
        };
        card.onmouseleave = () => {
            if (!card.classList.contains('selected')) {
                card.style.borderColor = 'var(--color-border)';
                card.style.background = 'var(--color-bg-input)';
            }
        };
        
        return card;
    }
    
    createThemePreview() {
        const container = document.createElement('div');
        container.className = 'theme-preview';
        container.style.cssText = `
            background: var(--color-bg-panel);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: var(--spacing-3);
            margin-top: var(--spacing-2);
        `;
        
        // Preview header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            gap: var(--spacing-2);
            margin-bottom: var(--spacing-3);
        `;
        
        const title = document.createElement('span');
        title.textContent = 'Interactive Preview';
        title.style.cssText = `
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
        `;
        header.appendChild(title);
        container.appendChild(header);
        
        // Preview elements row
        const elementsRow = document.createElement('div');
        elementsRow.style.cssText = `
            display: flex;
            gap: var(--spacing-2);
            flex-wrap: wrap;
            align-items: center;
        `;
        
        // Hover preview button
        const hoverBtn = document.createElement('button');
        hoverBtn.textContent = 'Hover Me';
        hoverBtn.style.cssText = `
            padding: var(--spacing-1-5) var(--spacing-3);
            background: transparent;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: all 0.15s ease;
        `;
        hoverBtn.onmouseenter = () => {
            hoverBtn.style.background = 'var(--color-bg-hover)';
            hoverBtn.style.borderColor = 'var(--color-accent)';
        };
        hoverBtn.onmouseleave = () => {
            hoverBtn.style.background = 'transparent';
            hoverBtn.style.borderColor = 'var(--color-border)';
        };
        elementsRow.appendChild(hoverBtn);
        
        // Accent button
        const accentBtn = document.createElement('button');
        accentBtn.textContent = 'Accent Button';
        accentBtn.style.cssText = `
            padding: var(--spacing-1-5) var(--spacing-3);
            background: var(--color-accent);
            border: none;
            border-radius: var(--radius-sm);
            color: var(--color-text-on-accent);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: all 0.15s ease;
        `;
        accentBtn.onmouseenter = () => {
            accentBtn.style.background = 'var(--color-accent-hover)';
        };
        accentBtn.onmouseleave = () => {
            accentBtn.style.background = 'var(--color-accent)';
        };
        elementsRow.appendChild(accentBtn);
        
        // Selected item preview
        const selectedItem = document.createElement('div');
        selectedItem.textContent = 'Selected Item';
        selectedItem.style.cssText = `
            padding: var(--spacing-1-5) var(--spacing-3);
            background: var(--color-bg-active);
            border-radius: var(--radius-sm);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            border: 1px solid var(--color-accent);
        `;
        elementsRow.appendChild(selectedItem);
        
        // Focus ring preview
        const focusInput = document.createElement('input');
        focusInput.placeholder = 'Focus me';
        focusInput.style.cssText = `
            padding: var(--spacing-1-5) var(--spacing-2);
            background: var(--color-bg-input);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            width: 100px;
            outline: none;
            transition: all 0.15s ease;
        `;
        focusInput.onfocus = () => {
            focusInput.style.borderColor = 'var(--color-accent)';
            focusInput.style.boxShadow = '0 0 0 2px var(--color-accent-subtle)';
        };
        focusInput.onblur = () => {
            focusInput.style.borderColor = 'var(--color-border)';
            focusInput.style.boxShadow = 'none';
        };
        elementsRow.appendChild(focusInput);
        
        container.appendChild(elementsRow);
        
        return container;
    }
    
    getCurrentAccentTheme() {
        const html = document.documentElement;
        if (html.classList.contains('theme-purple')) return 'purple';
        if (html.classList.contains('theme-teal')) return 'teal';
        if (html.classList.contains('theme-orange')) return 'orange';
        if (html.classList.contains('theme-pink')) return 'pink';
        return 'default';
    }
    
    setAccentTheme(themeId, themesGrid) {
        const html = document.documentElement;
        
        // Remove all accent theme classes
        html.classList.remove('theme-purple', 'theme-teal', 'theme-orange', 'theme-pink');
        
        // Apply new theme (default has no class)
        if (themeId !== 'default') {
            html.classList.add(`theme-${themeId}`);
        }
        
        // Save to localStorage
        localStorage.setItem('accentTheme', themeId);
        
        // Update card visual states
        const accentThemes = [
            { id: 'default', color: '#18A0FB' },
            { id: 'purple', color: '#7C3AED' },
            { id: 'teal', color: '#14B8A6' },
            { id: 'orange', color: '#F97316' },
            { id: 'pink', color: '#EC4899' }
        ];
        
        themesGrid.querySelectorAll('.theme-card').forEach(card => {
            const cardThemeId = card.dataset.themeId;
            const theme = accentThemes.find(t => t.id === cardThemeId);
            const isSelected = cardThemeId === themeId;
            
            card.classList.toggle('selected', isSelected);
            card.style.borderColor = isSelected ? theme.color : 'var(--color-border)';
            card.style.background = 'var(--color-bg-input)';
            
            // Update checkmark
            const existingCheck = card.querySelector('.fa-check');
            if (existingCheck) existingCheck.remove();
            
            if (isSelected) {
                const check = document.createElement('i');
                check.className = 'fa-solid fa-check';
                check.style.cssText = `
                    position: absolute;
                    top: var(--spacing-1);
                    right: var(--spacing-1);
                    color: ${theme.color};
                    font-size: var(--font-size-xs);
                `;
                card.style.position = 'relative';
                card.appendChild(check);
            }
            
            // Update label weight
            const label = card.querySelector('span');
            if (label) {
                label.style.fontWeight = isSelected ? 'var(--font-weight-medium)' : 'var(--font-weight-normal)';
            }
        });
    }

    loadTheme() {
        // Load dark/light mode
        const themeMode = localStorage.getItem('themeMode') || localStorage.getItem('theme');
        // Dark is default (no class needed), Light applies theme-light class
        if (themeMode === 'light') {
            document.body.classList.add('theme-light');
        }
        
        // Load accent theme
        const accentTheme = localStorage.getItem('accentTheme');
        if (accentTheme && accentTheme !== 'default') {
            document.documentElement.classList.add(`theme-${accentTheme}`);
        }
    }

    bindEvents() {
        this.overlay.querySelector('.close-btn').onclick = () => this.close();
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close();
        };
    }

    open() {
        this.renderSidebar();
        this.renderContent();
        this.overlay.style.display = 'flex';
    }

    close() {
        this.overlay.style.display = 'none';
    }
}
