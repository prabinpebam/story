export class MasonryGrid {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            itemSelector: options.itemSelector || ':scope > *',
        };

        this._resizeObserver = null;
        this._raf = 0;

        this._bind();
    }

    _bind() {
        if (typeof ResizeObserver === 'undefined') return;

        this._resizeObserver = new ResizeObserver(() => {
            this.scheduleLayout();
        });

        this._resizeObserver.observe(this.container);

        for (const item of this._getItems()) {
            this._resizeObserver.observe(item);
        }
    }

    _getItems() {
        return Array.from(this.container.querySelectorAll(this.options.itemSelector));
    }

    scheduleLayout() {
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = requestAnimationFrame(() => {
            this._raf = 0;
            this.layout();
        });
    }

    layout() {
        // If the container is hidden, measurements will be zero.
        if (!this.container || !this.container.isConnected) return;
        const containerRect = this.container.getBoundingClientRect();
        if (!containerRect.width || !containerRect.height) return;

        const styles = getComputedStyle(this.container);
        const rowGap = parseFloat(styles.rowGap || '0') || 0;
        const autoRows = parseFloat(styles.gridAutoRows || '0') || 0;

        if (!autoRows) return;

        const items = this._getItems();
        for (const item of items) {
            // Clear first so the browser calculates natural height.
            item.style.gridRowEnd = '';
        }

        for (const item of items) {
            const rect = item.getBoundingClientRect();
            if (!rect.height) continue;

            const rowSpan = Math.ceil((rect.height + rowGap) / (autoRows + rowGap));
            item.style.gridRowEnd = `span ${Math.max(1, rowSpan)}`;
        }

        // Ensure newly added items get observed.
        if (this._resizeObserver) {
            for (const item of items) {
                this._resizeObserver.observe(item);
            }
        }
    }

    destroy() {
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = 0;

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
    }
}
