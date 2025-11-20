import { aiService } from '../core/ai/AIService.js';

export class SettingsModal {
    constructor() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.style.display = 'none';
        
        this.modal = document.createElement('div');
        this.modal.className = 'modal-content';
        
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = '<h3>Settings</h3><button class="close-btn"><i class="fa-solid fa-xmark"></i></button>';
        
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        // Provider Section
        const providerSection = this.createSection('AI Provider');
        this.providerSelect = document.createElement('select');
        this.providerSelect.className = 'input-select';
        this.styleInput(this.providerSelect);

        ['openai', 'anthropic', 'azure'].forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.text = p.charAt(0).toUpperCase() + p.slice(1);
            if (aiService.config.provider === p) opt.selected = true;
            this.providerSelect.appendChild(opt);
        });

        providerSection.appendChild(this.providerSelect);
        body.appendChild(providerSection);

        // API Key Section
        const keySection = this.createSection('API Key');
        this.input = document.createElement('input');
        this.input.type = 'password';
        this.input.placeholder = 'sk-...';
        this.styleInput(this.input);
        keySection.appendChild(this.input);
        body.appendChild(keySection);

        // Azure Specific Sections
        this.azureContainer = document.createElement('div');
        this.azureContainer.style.display = 'none';

        // Endpoint
        const endpointSection = this.createSection('Endpoint URL');
        this.endpointInput = document.createElement('input');
        this.endpointInput.type = 'text';
        this.endpointInput.placeholder = 'https://...openai.azure.com/';
        this.styleInput(this.endpointInput);
        endpointSection.appendChild(this.endpointInput);
        this.azureContainer.appendChild(endpointSection);

        // Deployment
        const deploymentSection = this.createSection('Deployment Name');
        this.deploymentInput = document.createElement('input');
        this.deploymentInput.type = 'text';
        this.deploymentInput.placeholder = 'e.g., gpt-5-chat';
        this.styleInput(this.deploymentInput);
        deploymentSection.appendChild(this.deploymentInput);
        this.azureContainer.appendChild(deploymentSection);

        // API Version
        const apiVersionSection = this.createSection('API Version');
        this.apiVersionInput = document.createElement('input');
        this.apiVersionInput.type = 'text';
        this.apiVersionInput.placeholder = 'e.g., 2024-04-01-preview';
        this.styleInput(this.apiVersionInput);
        apiVersionSection.appendChild(this.apiVersionInput);
        this.azureContainer.appendChild(apiVersionSection);

        body.appendChild(this.azureContainer);

        // Model Section (Common)
        const modelSection = this.createSection('Model Name (Optional for Azure)');
        this.modelInput = document.createElement('input');
        this.modelInput.type = 'text';
        this.modelInput.placeholder = 'gpt-4o, claude-3-5-sonnet...';
        this.styleInput(this.modelInput);
        modelSection.appendChild(this.modelInput);
        body.appendChild(modelSection);

        // Save Button
        const saveBtn = document.createElement('button');
        saveBtn.innerText = 'Save Settings';
        saveBtn.className = 'btn-primary';
        saveBtn.style.width = '100%';
        
        saveBtn.onclick = () => {
            aiService.configure({ 
                provider: this.providerSelect.value,
                apiKey: this.input.value,
                model: this.modelInput.value,
                endpoint: this.endpointInput.value,
                deployment: this.deploymentInput.value,
                apiVersion: this.apiVersionInput.value
            });
            this.close();
        };
        
        body.appendChild(saveBtn);
        
        this.modal.appendChild(header);
        this.modal.appendChild(body);
        this.overlay.appendChild(this.modal);
        
        document.body.appendChild(this.overlay);

        // Handle provider change
        this.providerSelect.addEventListener('change', () => this.updateVisibility());
    }

    createSection(labelText) {
        const section = document.createElement('div');
        section.className = 'settings-section';
        section.style.marginBottom = '16px';
        
        const label = document.createElement('label');
        label.innerText = labelText;
        label.style.display = 'block';
        label.style.marginBottom = '8px';
        label.style.fontSize = '12px';
        label.style.color = 'var(--text-secondary)';
        
        section.appendChild(label);
        return section;
    }

    styleInput(element) {
        element.style.width = '100%';
        element.style.padding = '8px';
        element.style.background = 'var(--bg-well)';
        element.style.border = '1px solid var(--border-color)';
        element.style.color = 'var(--text-primary)';
        element.style.borderRadius = '4px';
    }

    updateVisibility() {
        const isAzure = this.providerSelect.value === 'azure';
        this.azureContainer.style.display = isAzure ? 'block' : 'none';
    }

    bindEvents() {
        this.overlay.querySelector('.close-btn').onclick = () => this.close();
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) this.close();
        };
    }

    open() {
        this.input.value = aiService.config.apiKey || '';
        this.providerSelect.value = aiService.config.provider || 'openai';
        this.modelInput.value = aiService.config.model || 'gpt-4o';
        this.endpointInput.value = aiService.config.endpoint || '';
        this.deploymentInput.value = aiService.config.deployment || '';
        this.apiVersionInput.value = aiService.config.apiVersion || '2024-04-01-preview';
        
        this.updateVisibility();
        this.overlay.style.display = 'flex';
    }

    close() {
        this.overlay.style.display = 'none';
    }
}
