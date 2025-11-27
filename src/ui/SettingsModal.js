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
        // Theme Toggle (Dark is default)
        const group = this.createFormGroup('Theme');
        
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
                    localStorage.setItem('theme', 'light');
                } else {
                    document.body.classList.remove('theme-light');
                    localStorage.setItem('theme', 'dark');
                }
            }
        });

        group.appendChild(themeDropdown.element);
        this.body.appendChild(group);
    }

    loadTheme() {
        const theme = localStorage.getItem('theme');
        // Dark is default (no class needed), Light applies theme-light class
        if (theme === 'light') {
            document.body.classList.add('theme-light');
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
