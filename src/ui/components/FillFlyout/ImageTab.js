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
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.gap = '12px';
        
        this.render();
    }

    render() {
        this.element.innerHTML = '';

        // 1. Image Preview / Upload Area
        const previewArea = document.createElement('div');
        previewArea.style.width = '100%';
        previewArea.style.height = '120px';
        previewArea.style.borderRadius = '4px';
        previewArea.style.backgroundColor = '#1a1a1a';
        previewArea.style.border = '1px dashed #555';
        previewArea.style.display = 'flex';
        previewArea.style.alignItems = 'center';
        previewArea.style.justifyContent = 'center';
        previewArea.style.cursor = 'pointer';
        previewArea.style.overflow = 'hidden';
        previewArea.style.position = 'relative';

        if (this.fill.assetId) {
            // Show image preview
            const blobUrl = mediaAssetManager.getBlobUrl(this.fill.assetId);
            if (blobUrl) {
                const img = document.createElement('img');
                img.src = blobUrl;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '100%';
                img.style.objectFit = 'contain';
                previewArea.appendChild(img);
                
                // Remove button overlay
                const removeBtn = document.createElement('div');
                removeBtn.style.position = 'absolute';
                removeBtn.style.top = '4px';
                removeBtn.style.right = '4px';
                removeBtn.style.width = '20px';
                removeBtn.style.height = '20px';
                removeBtn.style.borderRadius = '50%';
                removeBtn.style.backgroundColor = 'rgba(0,0,0,0.7)';
                removeBtn.style.display = 'flex';
                removeBtn.style.alignItems = 'center';
                removeBtn.style.justifyContent = 'center';
                removeBtn.style.cursor = 'pointer';
                removeBtn.innerHTML = Icons.CLOSE;
                removeBtn.querySelector('svg').style.width = '12px';
                removeBtn.querySelector('svg').style.height = '12px';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clearImage();
                });
                previewArea.appendChild(removeBtn);
            }
        } else {
            // Show upload prompt
            const uploadPrompt = document.createElement('div');
            uploadPrompt.style.textAlign = 'center';
            uploadPrompt.style.color = '#888';
            
            const icon = document.createElement('div');
            icon.innerHTML = Icons.IMAGE || `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
            icon.style.marginBottom = '8px';
            
            const text = document.createElement('div');
            text.textContent = 'Click or drop image';
            text.style.fontSize = '11px';
            
            uploadPrompt.appendChild(icon);
            uploadPrompt.appendChild(text);
            previewArea.appendChild(uploadPrompt);
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
            previewArea.style.borderColor = '#007AFF';
        });
        previewArea.addEventListener('dragleave', () => {
            previewArea.style.borderColor = '#555';
        });
        previewArea.addEventListener('drop', (e) => {
            e.preventDefault();
            previewArea.style.borderColor = '#555';
            if (e.dataTransfer.files.length > 0) {
                this.handleImageFile(e.dataTransfer.files[0]);
            }
        });

        this.element.appendChild(previewArea);
        this.element.appendChild(fileInput);

        // 2. Scale Mode Selector
        const scaleModeRow = document.createElement('div');
        scaleModeRow.style.display = 'flex';
        scaleModeRow.style.gap = '4px';

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
            btn.style.flex = '1';
            btn.style.padding = '6px 8px';
            btn.style.fontSize = '10px';
            btn.style.border = 'none';
            btn.style.borderRadius = '4px';
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = this.fill.scaleMode === mode.value ? '#007AFF' : '#3a3a3a';
            btn.style.color = '#fff';
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
        opacityRow.style.display = 'flex';
        opacityRow.style.alignItems = 'center';
        opacityRow.style.gap = '8px';

        const opacityLabel = document.createElement('span');
        opacityLabel.textContent = 'Opacity';
        opacityLabel.style.fontSize = '11px';
        opacityLabel.style.color = '#aaa';
        opacityLabel.style.width = '60px';

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
        label.textContent = 'Position';
        label.style.fontSize = '11px';
        label.style.color = '#aaa';

        // Position grid (3x3)
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '2px';
        grid.style.width = '80px';

        const positions = [
            { x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 },
            { x: 0, y: 1 }, { x: 0.5, y: 1 }, { x: 1, y: 1 }
        ];

        positions.forEach(pos => {
            const btn = document.createElement('div');
            btn.style.width = '24px';
            btn.style.height = '24px';
            btn.style.borderRadius = '2px';
            btn.style.backgroundColor = '#3a3a3a';
            btn.style.cursor = 'pointer';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            
            const isActive = this.fill.position?.x === pos.x && this.fill.position?.y === pos.y;
            if (isActive) {
                btn.style.backgroundColor = '#007AFF';
            }
            
            // Dot indicator
            const dot = document.createElement('div');
            dot.style.width = '4px';
            dot.style.height = '4px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = isActive ? '#fff' : '#666';
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
        section.style.borderTop = '1px solid #444';
        section.style.paddingTop = '12px';
        section.style.marginTop = '4px';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.cursor = 'pointer';
        header.style.marginBottom = '8px';

        const title = document.createElement('span');
        title.textContent = 'Adjustments';
        title.style.fontSize = '11px';
        title.style.color = '#aaa';

        const arrow = document.createElement('span');
        arrow.textContent = this.adjustmentsExpanded ? '▼' : '▶';
        arrow.style.fontSize = '8px';
        arrow.style.color = '#666';

        header.appendChild(title);
        header.appendChild(arrow);

        const content = document.createElement('div');
        content.style.display = this.adjustmentsExpanded ? 'flex' : 'none';
        content.style.flexDirection = 'column';
        content.style.gap = '8px';

        const adjustments = [
            { key: 'brightness', label: 'Brightness', min: -100, max: 100, default: 0 },
            { key: 'contrast', label: 'Contrast', min: -100, max: 100, default: 0 },
            { key: 'saturation', label: 'Saturation', min: -100, max: 100, default: 0 },
            { key: 'temperature', label: 'Temperature', min: -100, max: 100, default: 0 },
            { key: 'blur', label: 'Blur', min: 0, max: 100, default: 0 }
        ];

        adjustments.forEach(adj => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.gap = '8px';

            const label = document.createElement('span');
            label.textContent = adj.label;
            label.style.fontSize = '10px';
            label.style.color = '#888';
            label.style.width = '70px';

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
            arrow.textContent = this.adjustmentsExpanded ? '▼' : '▶';
            content.style.display = this.adjustmentsExpanded ? 'flex' : 'none';
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
