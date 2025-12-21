import { store } from '../../core/Store.js';

export class SegmentedControl {
    constructor(optionsOrConfig, selectedValue, onChange) {
        if (Array.isArray(optionsOrConfig)) {
            // Legacy positional arguments
            this.options = optionsOrConfig;
            this.selectedValue = selectedValue;
            this.onChange = onChange;
            this.testId = null;
        } else {
            // Config object pattern
            const config = optionsOrConfig || {};
            this.options = config.options || [];
            this.selectedValue = config.value;
            this.onChange = config.onChange;
            this.testId = config.testId || null;
        }
        
        this.element = this.create();
    }

    create() {
        const container = document.createElement('div');
        container.classList.add('segmented-control');
        if (this.testId) {
            container.setAttribute('data-testid', this.testId);
        }

        const updateAll = () => {
            Array.from(container.children).forEach((child, i) => {
                const option = this.options[i];
                if (!option) return;
                const isSelected = this.selectedValue === option.value;
                child.classList.toggle('is-selected', isSelected);
                child.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            });
        };

        this.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.classList.add('segmented-control__item');
            if (opt.testId) {
                btn.setAttribute('data-testid', opt.testId);
            }
            if (opt.icon) {
                // Check if it's an SVG string or HTML tag
                if (opt.icon.trim().startsWith('<')) {
                    btn.innerHTML = opt.icon;
                } else {
                    // Assume FontAwesome class name
                    btn.innerHTML = `<i class="fa-solid ${opt.icon}"></i>`;
                }
                btn.title = opt.label; // Tooltip
            } else {
                btn.innerText = opt.label;
            }

            btn.setAttribute('aria-pressed', 'false');
            if (this.selectedValue === opt.value) {
                btn.classList.add('is-selected');
                btn.setAttribute('aria-pressed', 'true');
            }

            btn.addEventListener('click', () => {
                store.dispatch('UI_INTERACTION_START');
                this.selectedValue = opt.value;

                updateAll();
                
                if (this.onChange) this.onChange(this.selectedValue);
                store.dispatch('UI_INTERACTION_END');
            });

            container.appendChild(btn);
        });

        updateAll();

        return container;
    }
}
