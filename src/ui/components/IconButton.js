export class IconButton {
    constructor(options = {}) {
        this.options = {
            icon: '', // SVG string or class name
            title: '', // Tooltip
            onClick: () => {},
            isActive: false,
            ...options
        };

        this.element = this.create();
    }

    create() {
        const btn = document.createElement('button');
        btn.className = 'pi-icon-btn';
        if (this.options.isActive) btn.classList.add('active');
        if (this.options.title) btn.title = this.options.title;
        
        btn.innerHTML = this.options.icon;
        
        btn.addEventListener('click', (e) => {
            this.options.onClick(e);
        });

        return btn;
    }

    setActive(isActive) {
        if (isActive) {
            this.element.classList.add('active');
        } else {
            this.element.classList.remove('active');
        }
    }
}
