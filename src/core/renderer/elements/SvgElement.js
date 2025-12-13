import { VisualElement } from './VisualElement.js';

export class SvgElement extends VisualElement {
    mount(container) {
        const div = super.mount(container);

        div.classList.add('svg-element');
        div.style.overflow = 'hidden';

        const svgHost = document.createElement('div');
        svgHost.className = 'svg-host';
        svgHost.style.width = '100%';
        svgHost.style.height = '100%';
        svgHost.style.pointerEvents = 'none';

        div.appendChild(svgHost);

        this.update(this.data, this.slideData);

        return div;
    }

    update(newData, slideData) {
        super.update(newData, slideData);

        const div = this.domElement;
        if (!div) return;

        const svgHost = div.querySelector('.svg-host');
        if (!svgHost) return;

        const svgMarkup = this.data?.svg;
        if (typeof svgMarkup !== 'string' || svgMarkup.trim().length === 0) {
            svgHost.innerHTML = '';
            return;
        }

        // Avoid re-parsing if unchanged
        if (svgHost.dataset.svgHash !== String(this.data.svgHash || '')) {
            svgHost.innerHTML = svgMarkup;
            svgHost.dataset.svgHash = String(this.data.svgHash || '');
        }

        const svgEl = svgHost.querySelector('svg');
        if (svgEl) {
            svgEl.setAttribute('width', '100%');
            svgEl.setAttribute('height', '100%');

            const fitMode = this.data.fitMode || 'fit';
            if (fitMode === 'stretch') {
                svgEl.setAttribute('preserveAspectRatio', 'none');
            } else if (fitMode === 'fill') {
                svgEl.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            } else {
                svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            }
        }
    }
}
