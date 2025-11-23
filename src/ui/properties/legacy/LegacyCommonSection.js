import { store } from '../../../core/Store.js';

export class LegacyCommonSection {
    constructor(container) {
        this.container = container;
    }

    render(props, selection) {
        // Distribution Row (Only if > 2 elements)
        if (selection.length > 2) {
            const distRow = document.createElement('div');
            distRow.style.display = 'flex';
            distRow.style.justifyContent = 'center';
            distRow.style.gap = '8px';
            distRow.style.marginBottom = '16px';
            
            const dists = [
                { icon: 'fa-grip-lines-vertical', action: 'horizontal', title: 'Distribute Horizontal Spacing' },
                { icon: 'fa-grip-lines', action: 'vertical', title: 'Distribute Vertical Spacing' }
            ];

            dists.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'icon-btn';
                btn.style.width = '24px';
                btn.style.height = '24px';
                btn.title = item.title;
                btn.innerHTML = `<i class="fa-solid ${item.icon}"></i>`;
                btn.onclick = () => store.dispatch('DISTRIBUTE_ELEMENTS', item.action);
                distRow.appendChild(btn);
            });
            
            this.container.appendChild(distRow);
        }
    }
}
