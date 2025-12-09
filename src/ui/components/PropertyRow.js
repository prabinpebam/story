/**
 * PropertyRow.js
 * 
 * Shared row component for Fill, Stroke, and Effect sections in the Property Inspector.
 * Provides consistent drag-and-drop, visibility toggle, and delete functionality.
 * 
 * @spec documentation/01-specs/ui-system/property-inspector-v2/05-fill-section.md
 * @spec documentation/01-specs/ui-system/property-inspector-v2/06-stroke-section.md
 * @spec documentation/01-specs/ui-system/property-inspector-v2/07-effects-section.md
 * 
 * CSS Classes: pi-property-row, pi-property-row__handle, pi-property-row__content,
 *              pi-property-row__actions, pi-property-row__visibility, pi-property-row__delete
 * 
 * Usage:
 *   const row = new PropertyRow({
 *       index: 0,                   // Row index in list
 *       draggable: true,            // Enable drag-and-drop (default: true)
 *       showVisibility: true,       // Show visibility toggle (default: true)
 *       showDelete: true,           // Show delete button (default: true)
 *       onVisibilityToggle: () => {},
 *       onDelete: () => {},
 *       onDrop: ({ position }) => {},
 *       onClick: () => {},
 *   });
 *   row.appendChild(customContentElement);
 *   container.appendChild(row.element);
 */

export class PropertyRow {
    /**
     * @param {Object} options
     * @param {number} [options.index] - Index in the list (for data-index attribute)
     * @param {boolean} [options.draggable=true] - Enable drag-and-drop reordering
     * @param {boolean} [options.showVisibility=true] - Show visibility toggle button
     * @param {boolean} [options.showDelete=true] - Show delete button
     * @param {Function} [options.onVisibilityToggle] - Called when visibility is toggled
     * @param {Function} [options.onDelete] - Called when delete is clicked
     * @param {Function} [options.onDrop] - Called with { position: 'before'|'after' } on drop
     * @param {Function} [options.onClick] - Called when row is clicked
     */
    constructor(options = {}) {
        this.options = {
            draggable: true,
            showVisibility: true,
            showDelete: true,
            onVisibilityToggle: null,
            onDelete: null,
            onDrop: null,
            onClick: null,
            ...options
        };

        this._isVisible = true;
        this._isActive = false;
        
        this._createRow();
        this._setupEventListeners();
    }

    /**
     * Whether the row is currently visible (not hidden)
     * @type {boolean}
     */
    get isVisible() {
        return this._isVisible;
    }

    /**
     * Whether the row is currently active/selected
     * @type {boolean}
     */
    get isActive() {
        return this._isActive;
    }

    _createRow() {
        // Main row container
        this.element = document.createElement('div');
        this.element.className = 'pi-property-row';
        
        if (this.options.index !== undefined) {
            this.element.dataset.index = String(this.options.index);
        }

        // Make draggable at element level for consistent behavior
        if (this.options.draggable) {
            this.element.setAttribute('draggable', 'true');
        }

        // 1. Drag Handle (optional)
        if (this.options.draggable) {
            this._handle = document.createElement('div');
            this._handle.className = 'pi-property-row__handle';
            this._handle.setAttribute('draggable', 'true');
            this._handle.textContent = '⋮⋮'; // Drag grip icon
            this.element.appendChild(this._handle);
        }

        // 2. Content slot
        this._contentSlot = document.createElement('div');
        this._contentSlot.className = 'pi-property-row__content';
        this.element.appendChild(this._contentSlot);

        // 3. Actions container (only if we have actions)
        if (this.options.showVisibility || this.options.showDelete) {
            this._actionsContainer = document.createElement('div');
            this._actionsContainer.className = 'pi-property-row__actions';
            this.element.appendChild(this._actionsContainer);

            // 4. Visibility toggle (optional)
            if (this.options.showVisibility) {
                this._visibilityBtn = document.createElement('button');
                this._visibilityBtn.className = 'pi-property-row__visibility';
                this._visibilityBtn.setAttribute('type', 'button');
                this._visibilityBtn.setAttribute('aria-label', 'Toggle visibility');
                this._visibilityBtn.textContent = 'visibility';
                this._actionsContainer.appendChild(this._visibilityBtn);
            }

            // 5. Delete button (optional)
            if (this.options.showDelete) {
                this._deleteBtn = document.createElement('button');
                this._deleteBtn.className = 'pi-property-row__delete';
                this._deleteBtn.setAttribute('type', 'button');
                this._deleteBtn.setAttribute('aria-label', 'Delete');
                this._deleteBtn.textContent = '−';
                this._actionsContainer.appendChild(this._deleteBtn);
            }
        }
    }

    _setupEventListeners() {
        // Click handler
        if (this.options.onClick) {
            this.element.addEventListener('click', (e) => {
                // Don't fire onClick when clicking action buttons
                if (!e.target.closest('.pi-property-row__actions')) {
                    this.options.onClick(e);
                }
            });
        }

        // Visibility toggle
        if (this._visibilityBtn && this.options.onVisibilityToggle) {
            this._visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.options.onVisibilityToggle();
            });
        }

        // Delete button
        if (this._deleteBtn && this.options.onDelete) {
            this._deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.options.onDelete();
            });
        }

        // Drag and drop handlers
        if (this.options.draggable) {
            this._setupDragAndDrop();
        }
    }

    _setupDragAndDrop() {
        // Drag start
        this.element.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.element.dataset.index || '0');
            this.element.classList.add('dragging');
        });

        // Drag end
        this.element.addEventListener('dragend', () => {
            this.element.classList.remove('dragging');
            this._clearDragOverState();
        });

        // Drag over (for drop target indication)
        this.element.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const rect = this.element.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            if (e.clientY < midY) {
                this.element.classList.add('drag-over-top');
                this.element.classList.remove('drag-over-bottom');
            } else {
                this.element.classList.remove('drag-over-top');
                this.element.classList.add('drag-over-bottom');
            }
        });

        // Drag leave
        this.element.addEventListener('dragleave', () => {
            this._clearDragOverState();
        });

        // Drop
        this.element.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const position = this.element.classList.contains('drag-over-top') ? 'before' : 'after';
            this._clearDragOverState();
            
            if (this.options.onDrop) {
                this.options.onDrop({ position, event: e });
            }
        });
    }

    _clearDragOverState() {
        this.element.classList.remove('drag-over-top', 'drag-over-bottom');
    }

    /**
     * Add a child element to the content slot
     * @param {HTMLElement} child - Element to append
     */
    appendChild(child) {
        this._contentSlot.appendChild(child);
    }

    /**
     * Set visibility state
     * @param {boolean} isVisible - Whether row should appear visible
     */
    setVisible(isVisible) {
        this._isVisible = isVisible;
        this.element.classList.toggle('invisible', !isVisible);
        
        if (this._visibilityBtn) {
            this._visibilityBtn.textContent = isVisible ? 'visibility' : 'visibility_off';
            this._visibilityBtn.setAttribute('aria-label', isVisible ? 'Hide' : 'Show');
        }
    }

    /**
     * Set active/selected state
     * @param {boolean} isActive - Whether row should appear active
     */
    setActive(isActive) {
        this._isActive = isActive;
        this.element.classList.toggle('active', isActive);
    }

    /**
     * Get the row DOM element
     * @returns {HTMLElement}
     */
    getElement() {
        return this.element;
    }

    /**
     * Remove the row from the DOM and clean up
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
