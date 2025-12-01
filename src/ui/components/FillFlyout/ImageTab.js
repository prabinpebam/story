import { NumberInput } from '../NumberInput.js';
import { IconButton } from '../IconButton.js';
import { Icons } from '../../Icons.js';
import { mediaAssetManager } from '../../../core/media/MediaAssetManager.js';
import { DEFAULT_IMAGE_FILL, SUPPORTED_IMAGE_FORMATS } from '../../../core/constants/MediaDefaults.js';

export class ImageTab {
    constructor(options = {}) {
        this.fill = { ...DEFAULT_IMAGE_FILL, ...options.fill };
        this.onChange = options.onChange || (() => {});
        
        this.element = document.createElement('div');
        this.element.className = 'flyout-content';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';

        // 1. Image Preview / Upload Area
        const previewArea = document.createElement('div');
        previewArea.className = 'media-preview-area';

        if (this.fill.assetId) {
            // Show image preview
            const blobUrl = mediaAssetManager.getBlobUrl(this.fill.assetId);
            if (blobUrl) {
                const img = document.createElement('img');
                img.src = blobUrl;
                previewArea.appendChild(img);
                
                // Remove button overlay
                const removeBtn = document.createElement('button');
                removeBtn.className = 'media-remove-btn';
                removeBtn.innerHTML = Icons.CLOSE;
                const svgEl = removeBtn.querySelector('svg');
                if (svgEl) {
                    svgEl.style.width = '12px';
                    svgEl.style.height = '12px';
                }
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clearImage();
                });
                previewArea.appendChild(removeBtn);
            }
        } else {
            // Empty state: image icon with upload prompt
            const emptyState = document.createElement('div');
            emptyState.className = 'media-empty-state';
            
            // Image icon (landscape with sun)
            const icon = document.createElement('div');
            icon.className = 'media-empty-icon';
            icon.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
            </svg>`;
            
            const label = document.createElement('div');
            label.className = 'media-empty-label';
            label.textContent = 'Drop image here';
            
            const hint = document.createElement('div');
            hint.className = 'media-empty-hint';
            hint.textContent = 'or click to browse';
            
            emptyState.appendChild(icon);
            emptyState.appendChild(label);
            emptyState.appendChild(hint);
            previewArea.appendChild(emptyState);
        }

        // File input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = SUPPORTED_IMAGE_FORMATS.join(',');
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageFile(e.target.files[0]);
            }
        });

        previewArea.addEventListener('click', () => fileInput.click());
        previewArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            previewArea.classList.add('drag-over');
        });
        previewArea.addEventListener('dragleave', () => {
            previewArea.classList.remove('drag-over');
        });
        previewArea.addEventListener('drop', (e) => {
            e.preventDefault();
            previewArea.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                this.handleImageFile(e.dataTransfer.files[0]);
            }
        });

        this.element.appendChild(previewArea);
        this.element.appendChild(fileInput);

        // 2. Scale Mode Selector
        const scaleModeRow = document.createElement('div');
        scaleModeRow.className = 'scale-mode-row';

        const scaleModes = [
            { value: 'fill', label: 'Fill', title: 'Fill (cover entire shape)' },
            { value: 'fit', label: 'Fit', title: 'Fit (contain within shape)' },
            { value: 'stretch', label: 'Stretch', title: 'Stretch (distort to fit)' },
            { value: 'tile', label: 'Tile', title: 'Tile (repeat pattern)' }
        ];

        scaleModes.forEach(mode => {
            const btn = document.createElement('button');
            btn.textContent = mode.label;
            btn.title = mode.title;
            btn.className = 'scale-mode-btn' + (this.fill.scaleMode === mode.value ? ' active' : '');
            btn.addEventListener('click', () => this.setScaleMode(mode.value));
            scaleModeRow.appendChild(btn);
        });

        this.element.appendChild(scaleModeRow);

        // 3. Position Controls (only for fill/fit modes)
        if (this.fill.scaleMode === 'fill' || this.fill.scaleMode === 'fit') {
            const positionSection = this.createPositionSection();
            this.element.appendChild(positionSection);
        }

        // 4. Opacity Control
        const opacityRow = document.createElement('div');
        opacityRow.className = 'flyout-row';

        const opacityLabel = document.createElement('span');
        opacityLabel.className = 'flyout-label';
        opacityLabel.textContent = 'Opacity';

        const opacityInput = new NumberInput({
            value: this.fill.opacity ?? 100,
            min: 0,
            max: 100,
            step: 1,
            suffix: '%',
            onChange: (value) => {
                this.fill.opacity = value;
                this.emitChange();
            }
        });
        opacityInput.element.style.flex = '1';

        opacityRow.appendChild(opacityLabel);
        opacityRow.appendChild(opacityInput.element);
        this.element.appendChild(opacityRow);

        // 5. Image Adjustments (collapsed by default)
        const adjustmentsSection = this.createAdjustmentsSection();
        this.element.appendChild(adjustmentsSection);
    }

    createPositionSection() {
        const section = document.createElement('div');
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.gap = '8px';

        const label = document.createElement('span');
        label.className = 'flyout-label';
        label.textContent = 'Position';

        // Position grid (3x3)
        const grid = document.createElement('div');
        grid.className = 'position-grid';

        const positions = [
            { x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 },
            { x: 0, y: 1 }, { x: 0.5, y: 1 }, { x: 1, y: 1 }
        ];

        positions.forEach(pos => {
            const isActive = this.fill.position?.x === pos.x && this.fill.position?.y === pos.y;
            const btn = document.createElement('button');
            btn.className = 'position-grid-btn' + (isActive ? ' active' : '');
            
            // Dot indicator
            const dot = document.createElement('div');
            dot.className = 'dot';
            btn.appendChild(dot);
            
            btn.addEventListener('click', () => this.setPosition(pos.x, pos.y));
            grid.appendChild(btn);
        });

        section.appendChild(label);
        section.appendChild(grid);
        return section;
    }

    createAdjustmentsSection() {
        const section = document.createElement('div');
        section.className = 'collapsible-section' + (this.adjustmentsExpanded ? ' expanded' : '');

        const header = document.createElement('div');
        header.className = 'collapsible-header';

        const title = document.createElement('span');
        title.className = 'collapsible-title';
        title.textContent = 'Adjustments';

        const arrow = document.createElement('span');
        arrow.className = 'collapsible-arrow';
        arrow.textContent = '▶';

        header.appendChild(title);
        header.appendChild(arrow);

        const content = document.createElement('div');
        content.className = 'collapsible-content';

        const adjustments = [
            { key: 'brightness', label: 'Brightness', min: -100, max: 100, default: 0 },
            { key: 'contrast', label: 'Contrast', min: -100, max: 100, default: 0 },
            { key: 'saturation', label: 'Saturation', min: -100, max: 100, default: 0 },
            { key: 'temperature', label: 'Temperature', min: -100, max: 100, default: 0 },
            { key: 'blur', label: 'Blur', min: 0, max: 100, default: 0 }
        ];

        adjustments.forEach(adj => {
            const row = document.createElement('div');
            row.className = 'flyout-row';

            const label = document.createElement('span');
            label.className = 'flyout-label flyout-label-wide';
            label.textContent = adj.label;

            const input = new NumberInput({
                value: this.fill.filters?.[adj.key] ?? adj.default,
                min: adj.min,
                max: adj.max,
                step: 1,
                onChange: (value) => {
                    if (!this.fill.filters) this.fill.filters = {};
                    this.fill.filters[adj.key] = value;
                    this.emitChange();
                }
            });
            input.element.style.flex = '1';

            row.appendChild(label);
            row.appendChild(input.element);
            content.appendChild(row);
        });

        header.addEventListener('click', () => {
            this.adjustmentsExpanded = !this.adjustmentsExpanded;
            section.classList.toggle('expanded', this.adjustmentsExpanded);
        });

        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    async handleImageFile(file) {
        try {
            const asset = await mediaAssetManager.importFile(file);
            this.fill.assetId = asset.assetId;
            this.emitChange();
            this.render();
        } catch (error) {
            console.error('Failed to import image:', error);
        }
    }

    clearImage() {
        if (this.fill.assetId) {
            mediaAssetManager.release(this.fill.assetId);
        }
        this.fill.assetId = null;
        this.emitChange();
        this.render();
    }

    setScaleMode(mode) {
        this.fill.scaleMode = mode;
        this.emitChange();
        this.render();
    }

    setPosition(x, y) {
        this.fill.position = { x, y };
        this.emitChange();
        this.render();
    }

    emitChange() {
        this.onChange({
            type: 'image',
            ...this.fill
        });
    }
}
