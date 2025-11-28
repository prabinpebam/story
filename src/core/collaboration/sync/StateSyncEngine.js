/**
 * StateSyncEngine - Manages document state synchronization
 * 
 * Implements a simplified Operational Transform (OT) system for
 * real-time collaborative editing with conflict resolution.
 * 
 * @module StateSyncEngine
 */

import { MESSAGE_TYPES, SYNC_CONFIG, COLLABORATION_ERRORS } from '../constants/index.js';

/**
 * Vector clock for causality tracking
 */
class VectorClock {
    constructor(initialState = {}) {
        this.clock = new Map(Object.entries(initialState));
    }

    /**
     * Increment clock for a user
     * @param {string} userId - User ID to increment
     * @returns {number} New clock value
     */
    increment(userId) {
        const current = this.clock.get(userId) || 0;
        this.clock.set(userId, current + 1);
        return current + 1;
    }

    /**
     * Get clock value for a user
     * @param {string} userId - User ID
     * @returns {number} Clock value
     */
    get(userId) {
        return this.clock.get(userId) || 0;
    }

    /**
     * Merge with another vector clock (take max of each)
     * @param {VectorClock} other - Other vector clock
     */
    merge(other) {
        for (const [userId, value] of other.clock) {
            const current = this.clock.get(userId) || 0;
            this.clock.set(userId, Math.max(current, value));
        }
    }

    /**
     * Check if this clock happened before another
     * @param {VectorClock} other - Other vector clock
     * @returns {boolean} True if this happened before other
     */
    happenedBefore(other) {
        let atLeastOneLess = false;
        
        for (const [userId, value] of this.clock) {
            const otherValue = other.get(userId);
            if (value > otherValue) return false;
            if (value < otherValue) atLeastOneLess = true;
        }
        
        // Check for keys in other that aren't in this
        for (const [userId] of other.clock) {
            if (!this.clock.has(userId) && other.get(userId) > 0) {
                atLeastOneLess = true;
            }
        }
        
        return atLeastOneLess;
    }

    /**
     * Check if clocks are concurrent (neither happened before the other)
     * @param {VectorClock} other - Other vector clock
     * @returns {boolean} True if concurrent
     */
    isConcurrent(other) {
        return !this.happenedBefore(other) && !other.happenedBefore(this);
    }

    /**
     * Create a copy of this clock
     * @returns {VectorClock} Cloned vector clock
     */
    clone() {
        const cloned = new VectorClock();
        for (const [userId, value] of this.clock) {
            cloned.clock.set(userId, value);
        }
        return cloned;
    }

    /**
     * Convert to plain object for serialization
     * @returns {Object} Plain object representation
     */
    toJSON() {
        return Object.fromEntries(this.clock);
    }

    /**
     * Create from plain object
     * @param {Object} obj - Plain object
     * @returns {VectorClock} Vector clock instance
     */
    static fromJSON(obj) {
        return new VectorClock(obj);
    }
}

/**
 * Operation types for state changes
 */
const OperationType = {
    INSERT: 'insert',
    DELETE: 'delete',
    UPDATE: 'update',
    MOVE: 'move',
    STYLE: 'style',
    ADD_SLIDE: 'add_slide',
    DELETE_SLIDE: 'delete_slide',
    REORDER_SLIDES: 'reorder_slides',
    ADD_ELEMENT: 'add_element',
    DELETE_ELEMENT: 'delete_element',
    BATCH: 'batch'
};

/**
 * Represents a single operation on the document
 */
class Operation {
    /**
     * Create an operation
     * @param {Object} params - Operation parameters
     */
    constructor({
        type,
        targetId,
        targetType,
        path,
        value,
        previousValue,
        userId,
        timestamp,
        vectorClock,
        operationId
    }) {
        this.type = type;
        this.targetId = targetId;
        this.targetType = targetType; // 'slide', 'element', 'presentation'
        this.path = path; // Property path for updates
        this.value = value;
        this.previousValue = previousValue;
        this.userId = userId;
        this.timestamp = timestamp || Date.now();
        this.vectorClock = vectorClock;
        this.operationId = operationId || crypto.randomUUID();
        this.acknowledged = false;
    }

    /**
     * Create inverse operation for undo
     * @returns {Operation} Inverse operation
     */
    createInverse() {
        const inverseType = {
            [OperationType.INSERT]: OperationType.DELETE,
            [OperationType.DELETE]: OperationType.INSERT,
            [OperationType.ADD_SLIDE]: OperationType.DELETE_SLIDE,
            [OperationType.DELETE_SLIDE]: OperationType.ADD_SLIDE,
            [OperationType.ADD_ELEMENT]: OperationType.DELETE_ELEMENT,
            [OperationType.DELETE_ELEMENT]: OperationType.ADD_ELEMENT
        };

        return new Operation({
            type: inverseType[this.type] || this.type,
            targetId: this.targetId,
            targetType: this.targetType,
            path: this.path,
            value: this.previousValue,
            previousValue: this.value,
            userId: this.userId,
            timestamp: Date.now()
        });
    }

    /**
     * Convert to JSON for transmission
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            type: this.type,
            targetId: this.targetId,
            targetType: this.targetType,
            path: this.path,
            value: this.value,
            previousValue: this.previousValue,
            userId: this.userId,
            timestamp: this.timestamp,
            vectorClock: this.vectorClock?.toJSON(),
            operationId: this.operationId
        };
    }

    /**
     * Create from JSON
     * @param {Object} json - JSON data
     * @returns {Operation} Operation instance
     */
    static fromJSON(json) {
        return new Operation({
            ...json,
            vectorClock: json.vectorClock ? VectorClock.fromJSON(json.vectorClock) : null
        });
    }
}

/**
 * Manages document state synchronization with OT
 */
export class StateSyncEngine {
    /**
     * Create a StateSyncEngine instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.connection = options.connection;
        this.userId = options.userId;
        this.documentId = null;
        this.state = null;
        this.stateVersion = 0;
        
        // Vector clock for this client
        this.vectorClock = new VectorClock();
        
        // Operation buffers
        this.pendingOperations = []; // Sent but not acknowledged
        this.inflightOperation = null;
        this.operationQueue = []; // Waiting to be sent
        
        // Operation history for conflict resolution
        this.operationHistory = [];
        this.maxHistorySize = options.maxHistorySize || SYNC_CONFIG?.MAX_HISTORY_SIZE || 1000;
        
        // Acknowledgment tracking
        this.acknowledgmentCallbacks = new Map();
        this.operationTimeout = options.operationTimeout || 30000;
        
        // Batching for performance
        this.batchQueue = [];
        this.batchTimeout = null;
        this.batchDelay = options.batchDelay || 50;
        this.maxBatchSize = options.maxBatchSize || 10;
        
        // Event callbacks
        this.listeners = new Map();
        
        // State snapshot for conflict resolution
        this.lastConfirmedState = null;
        this.lastConfirmedVersion = 0;
        
        // Bind methods
        this.handleRemoteOperation = this.handleRemoteOperation.bind(this);
        this.handleAcknowledgment = this.handleAcknowledgment.bind(this);
        this.handleStateSync = this.handleStateSync.bind(this);
    }

    /**
     * Initialize sync engine for a document
     * @param {string} documentId - Document ID
     * @param {Object} initialState - Initial document state
     */
    async initialize(documentId, initialState) {
        this.documentId = documentId;
        this.state = this.deepClone(initialState);
        this.lastConfirmedState = this.deepClone(initialState);
        this.stateVersion = 0;
        this.lastConfirmedVersion = 0;
        
        // Reset operation buffers
        this.pendingOperations = [];
        this.inflightOperation = null;
        this.operationQueue = [];
        this.operationHistory = [];
        
        // Setup connection handlers
        if (this.connection) {
            this.connection.on(MESSAGE_TYPES.OPERATION, this.handleRemoteOperation);
            this.connection.on(MESSAGE_TYPES.OPERATION_ACK, this.handleAcknowledgment);
            this.connection.on(MESSAGE_TYPES.STATE_SYNC, this.handleStateSync);
        }
        
        this.emit('initialized', { documentId, state: this.state });
    }

    /**
     * Create and queue a local operation
     * @param {Object} operationData - Operation parameters
     * @returns {Operation} Created operation
     */
    createOperation(operationData) {
        // Increment vector clock
        this.vectorClock.increment(this.userId);
        
        const operation = new Operation({
            ...operationData,
            userId: this.userId,
            vectorClock: this.vectorClock.clone()
        });
        
        // Apply locally immediately
        this.applyOperation(operation, true);
        
        // Queue for sending
        this.queueOperation(operation);
        
        return operation;
    }

    /**
     * Queue an operation for batched sending
     * @param {Operation} operation - Operation to queue
     */
    queueOperation(operation) {
        this.batchQueue.push(operation);
        
        // Clear existing timeout
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        // Send immediately if batch is full
        if (this.batchQueue.length >= this.maxBatchSize) {
            this.flushBatch();
            return;
        }
        
        // Otherwise, wait for batch delay
        this.batchTimeout = setTimeout(() => {
            this.flushBatch();
        }, this.batchDelay);
    }

    /**
     * Flush queued operations as a batch
     */
    async flushBatch() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }
        
        if (this.batchQueue.length === 0) return;
        
        const operations = this.batchQueue.splice(0);
        
        // If we have an inflight operation, queue these
        if (this.inflightOperation) {
            this.operationQueue.push(...operations);
            return;
        }
        
        // Send as single operation or batch
        if (operations.length === 1) {
            await this.sendOperation(operations[0]);
        } else {
            await this.sendBatch(operations);
        }
    }

    /**
     * Send a single operation
     * @param {Operation} operation - Operation to send
     */
    async sendOperation(operation) {
        if (!this.connection || !this.connection.isConnected) {
            this.pendingOperations.push(operation);
            return;
        }
        
        this.inflightOperation = operation;
        
        try {
            await this.connection.send(MESSAGE_TYPES.OPERATION, {
                documentId: this.documentId,
                operation: operation.toJSON()
            });
            
            // Set timeout for acknowledgment
            this.setAcknowledgmentTimeout(operation);
            
        } catch (error) {
            console.error('[StateSyncEngine] Failed to send operation:', error);
            this.inflightOperation = null;
            this.pendingOperations.push(operation);
            this.emit('operationFailed', { operation, error });
        }
    }

    /**
     * Send a batch of operations
     * @param {Array<Operation>} operations - Operations to send
     */
    async sendBatch(operations) {
        if (!this.connection || !this.connection.isConnected) {
            this.pendingOperations.push(...operations);
            return;
        }
        
        // Create batch operation
        const batchOp = new Operation({
            type: OperationType.BATCH,
            value: operations.map(op => op.toJSON()),
            userId: this.userId,
            vectorClock: this.vectorClock.clone()
        });
        
        this.inflightOperation = batchOp;
        
        try {
            await this.connection.send(MESSAGE_TYPES.OPERATION, {
                documentId: this.documentId,
                operation: batchOp.toJSON()
            });
            
            this.setAcknowledgmentTimeout(batchOp);
            
        } catch (error) {
            console.error('[StateSyncEngine] Failed to send batch:', error);
            this.inflightOperation = null;
            this.pendingOperations.push(...operations);
            this.emit('operationFailed', { operations, error });
        }
    }

    /**
     * Set timeout for operation acknowledgment
     * @param {Operation} operation - Operation awaiting acknowledgment
     */
    setAcknowledgmentTimeout(operation) {
        const timeoutId = setTimeout(() => {
            if (this.inflightOperation?.operationId === operation.operationId) {
                console.warn('[StateSyncEngine] Operation timed out:', operation.operationId);
                this.handleOperationTimeout(operation);
            }
        }, this.operationTimeout);
        
        this.acknowledgmentCallbacks.set(operation.operationId, {
            timeoutId,
            operation
        });
    }

    /**
     * Handle operation timeout
     * @param {Operation} operation - Timed out operation
     */
    handleOperationTimeout(operation) {
        this.acknowledgmentCallbacks.delete(operation.operationId);
        this.inflightOperation = null;
        
        // Could retry or request state sync
        this.emit('operationTimeout', { operation });
        
        // Request full state sync to recover
        this.requestStateSync();
    }

    /**
     * Handle acknowledgment from server
     * @param {Object} data - Acknowledgment data
     */
    handleAcknowledgment(data) {
        const { operationId, serverVersion, accepted, transformedOp } = data;
        
        const ackData = this.acknowledgmentCallbacks.get(operationId);
        if (ackData) {
            clearTimeout(ackData.timeoutId);
            this.acknowledgmentCallbacks.delete(operationId);
        }
        
        if (this.inflightOperation?.operationId === operationId) {
            if (accepted) {
                // Operation accepted - update confirmed state
                this.inflightOperation.acknowledged = true;
                this.addToHistory(this.inflightOperation);
                this.lastConfirmedVersion = serverVersion;
                this.updateConfirmedState();
            } else if (transformedOp) {
                // Operation was transformed - apply the transformed version
                this.handleTransformedOperation(transformedOp);
            }
            
            this.inflightOperation = null;
            
            // Process queued operations
            this.processQueue();
        }
        
        this.emit('acknowledgment', { operationId, accepted, serverVersion });
    }

    /**
     * Process queued operations
     */
    async processQueue() {
        if (this.operationQueue.length === 0) return;
        if (this.inflightOperation) return;
        
        const operations = this.operationQueue.splice(0, this.maxBatchSize);
        
        if (operations.length === 1) {
            await this.sendOperation(operations[0]);
        } else {
            await this.sendBatch(operations);
        }
    }

    /**
     * Handle remote operation from another client
     * @param {Object} data - Operation data
     */
    handleRemoteOperation(data) {
        const { operation: opJson, serverVersion } = data;
        const operation = Operation.fromJSON(opJson);
        
        // Skip our own operations (already applied locally)
        if (operation.userId === this.userId) return;
        
        // Transform against pending local operations
        let transformedOp = operation;
        
        for (const pending of [this.inflightOperation, ...this.pendingOperations, ...this.operationQueue].filter(Boolean)) {
            transformedOp = this.transform(transformedOp, pending);
            if (!transformedOp) return; // Operation nullified
        }
        
        // Apply the transformed operation
        this.applyOperation(transformedOp, false);
        this.addToHistory(operation);
        
        // Update version
        this.stateVersion = Math.max(this.stateVersion, serverVersion);
        
        // Merge vector clocks
        if (operation.vectorClock) {
            this.vectorClock.merge(VectorClock.fromJSON(operation.vectorClock));
        }
        
        this.emit('remoteOperation', { operation: transformedOp, serverVersion });
    }

    /**
     * Handle transformed operation from server
     * @param {Object} transformedOp - Transformed operation JSON
     */
    handleTransformedOperation(transformedOp) {
        const operation = Operation.fromJSON(transformedOp);
        
        // Rollback to confirmed state
        this.state = this.deepClone(this.lastConfirmedState);
        
        // Apply transformed operation
        this.applyOperation(operation, false);
        
        // Reapply pending operations transformed against this
        for (const pending of [...this.pendingOperations, ...this.operationQueue]) {
            const transformed = this.transform(pending, operation);
            if (transformed) {
                this.applyOperation(transformed, false);
            }
        }
        
        this.emit('stateRebased', { operation });
    }

    /**
     * Handle full state sync from server
     * @param {Object} data - State sync data
     */
    handleStateSync(data) {
        const { state, version, vectorClock } = data;
        
        this.state = this.deepClone(state);
        this.lastConfirmedState = this.deepClone(state);
        this.stateVersion = version;
        this.lastConfirmedVersion = version;
        
        if (vectorClock) {
            this.vectorClock = VectorClock.fromJSON(vectorClock);
        }
        
        // Clear pending operations (they're now invalid)
        this.pendingOperations = [];
        this.operationQueue = [];
        this.inflightOperation = null;
        
        this.emit('stateSync', { state, version });
    }

    /**
     * Request full state sync from server
     */
    async requestStateSync() {
        if (!this.connection || !this.connection.isConnected) return;
        
        try {
            const response = await this.connection.invoke('getDocumentState', {
                documentId: this.documentId,
                currentVersion: this.lastConfirmedVersion
            });
            
            if (response.state) {
                this.handleStateSync(response);
            }
        } catch (error) {
            console.error('[StateSyncEngine] Failed to request state sync:', error);
            this.emit('error', { type: 'stateSyncFailed', error });
        }
    }

    /**
     * Apply an operation to the local state
     * @param {Operation} operation - Operation to apply
     * @param {boolean} isLocal - Whether this is a local operation
     */
    applyOperation(operation, isLocal) {
        const previousState = isLocal ? this.deepClone(this.state) : null;
        
        try {
            switch (operation.type) {
                case OperationType.UPDATE:
                    this.applyUpdate(operation);
                    break;
                    
                case OperationType.ADD_ELEMENT:
                    this.applyAddElement(operation);
                    break;
                    
                case OperationType.DELETE_ELEMENT:
                    this.applyDeleteElement(operation);
                    break;
                    
                case OperationType.MOVE:
                    this.applyMove(operation);
                    break;
                    
                case OperationType.STYLE:
                    this.applyStyle(operation);
                    break;
                    
                case OperationType.ADD_SLIDE:
                    this.applyAddSlide(operation);
                    break;
                    
                case OperationType.DELETE_SLIDE:
                    this.applyDeleteSlide(operation);
                    break;
                    
                case OperationType.REORDER_SLIDES:
                    this.applyReorderSlides(operation);
                    break;
                    
                case OperationType.BATCH:
                    this.applyBatch(operation);
                    break;
                    
                default:
                    console.warn('[StateSyncEngine] Unknown operation type:', operation.type);
            }
            
            this.stateVersion++;
            
            if (isLocal) {
                this.emit('localChange', { operation, state: this.state });
            } else {
                this.emit('remoteChange', { operation, state: this.state });
            }
            
        } catch (error) {
            console.error('[StateSyncEngine] Failed to apply operation:', error, operation);
            
            if (isLocal && previousState) {
                // Rollback on error
                this.state = previousState;
            }
            
            this.emit('operationError', { operation, error });
        }
    }

    /**
     * Apply an update operation
     * @param {Operation} operation - Update operation
     */
    applyUpdate(operation) {
        const target = this.findTarget(operation.targetType, operation.targetId);
        if (!target) return;
        
        if (operation.path) {
            this.setNestedValue(target, operation.path, operation.value);
        } else {
            Object.assign(target, operation.value);
        }
    }

    /**
     * Apply an add element operation
     * @param {Operation} operation - Add element operation
     */
    applyAddElement(operation) {
        const slide = this.findSlide(operation.targetId);
        if (!slide) return;
        
        if (!slide.elements) {
            slide.elements = [];
        }
        
        slide.elements.push(operation.value);
    }

    /**
     * Apply a delete element operation
     * @param {Operation} operation - Delete element operation
     */
    applyDeleteElement(operation) {
        const slide = this.findSlide(operation.targetId);
        if (!slide || !slide.elements) return;
        
        const index = slide.elements.findIndex(el => el.id === operation.value.id);
        if (index !== -1) {
            slide.elements.splice(index, 1);
        }
    }

    /**
     * Apply a move operation
     * @param {Operation} operation - Move operation
     */
    applyMove(operation) {
        const element = this.findElement(operation.targetId);
        if (!element) return;
        
        if (operation.value.x !== undefined) element.x = operation.value.x;
        if (operation.value.y !== undefined) element.y = operation.value.y;
        if (operation.value.width !== undefined) element.width = operation.value.width;
        if (operation.value.height !== undefined) element.height = operation.value.height;
        if (operation.value.rotation !== undefined) element.rotation = operation.value.rotation;
    }

    /**
     * Apply a style operation
     * @param {Operation} operation - Style operation
     */
    applyStyle(operation) {
        const target = this.findTarget(operation.targetType, operation.targetId);
        if (!target) return;
        
        if (!target.style) {
            target.style = {};
        }
        
        Object.assign(target.style, operation.value);
    }

    /**
     * Apply an add slide operation
     * @param {Operation} operation - Add slide operation
     */
    applyAddSlide(operation) {
        if (!this.state.slides) {
            this.state.slides = [];
        }
        
        const index = operation.value.index ?? this.state.slides.length;
        this.state.slides.splice(index, 0, operation.value.slide);
    }

    /**
     * Apply a delete slide operation
     * @param {Operation} operation - Delete slide operation
     */
    applyDeleteSlide(operation) {
        if (!this.state.slides) return;
        
        const index = this.state.slides.findIndex(s => s.id === operation.targetId);
        if (index !== -1) {
            this.state.slides.splice(index, 1);
        }
    }

    /**
     * Apply a reorder slides operation
     * @param {Operation} operation - Reorder operation
     */
    applyReorderSlides(operation) {
        if (!this.state.slides) return;
        
        const { fromIndex, toIndex } = operation.value;
        const [slide] = this.state.slides.splice(fromIndex, 1);
        this.state.slides.splice(toIndex, 0, slide);
    }

    /**
     * Apply a batch of operations
     * @param {Operation} operation - Batch operation
     */
    applyBatch(operation) {
        for (const opJson of operation.value) {
            const op = Operation.fromJSON(opJson);
            this.applyOperation(op, false);
        }
    }

    /**
     * Transform operation1 against operation2
     * @param {Operation} op1 - Operation to transform
     * @param {Operation} op2 - Operation to transform against
     * @returns {Operation|null} Transformed operation or null if nullified
     */
    transform(op1, op2) {
        // Same target - potential conflict
        if (op1.targetId === op2.targetId && op1.targetType === op2.targetType) {
            return this.transformSameTarget(op1, op2);
        }
        
        // Different targets - no transformation needed
        return op1;
    }

    /**
     * Transform operations on the same target
     * @param {Operation} op1 - Operation to transform
     * @param {Operation} op2 - Operation to transform against
     * @returns {Operation|null} Transformed operation
     */
    transformSameTarget(op1, op2) {
        // Delete vs any - if target was deleted, nullify the other operation
        if (op2.type === OperationType.DELETE_ELEMENT || op2.type === OperationType.DELETE_SLIDE) {
            if (op1.type !== OperationType.DELETE_ELEMENT && op1.type !== OperationType.DELETE_SLIDE) {
                return null;
            }
        }
        
        // Move operations - use last-writer-wins or merge
        if (op1.type === OperationType.MOVE && op2.type === OperationType.MOVE) {
            // Merge non-conflicting properties
            const mergedValue = { ...op1.value };
            
            // For conflicting properties, use timestamp (last-writer-wins)
            for (const key of Object.keys(op2.value)) {
                if (key in op1.value && op2.timestamp > op1.timestamp) {
                    mergedValue[key] = op2.value[key];
                }
            }
            
            return new Operation({
                ...op1,
                value: mergedValue
            });
        }
        
        // Style operations - merge styles
        if (op1.type === OperationType.STYLE && op2.type === OperationType.STYLE) {
            // Keep op1's styles that don't conflict with op2's newer changes
            const mergedValue = { ...op1.value };
            
            for (const key of Object.keys(op2.value)) {
                if (key in op1.value && op2.timestamp > op1.timestamp) {
                    delete mergedValue[key];
                }
            }
            
            if (Object.keys(mergedValue).length === 0) {
                return null;
            }
            
            return new Operation({
                ...op1,
                value: mergedValue
            });
        }
        
        // Update operations on same path - last-writer-wins
        if (op1.type === OperationType.UPDATE && op2.type === OperationType.UPDATE) {
            if (op1.path === op2.path && op2.timestamp > op1.timestamp) {
                return null;
            }
        }
        
        return op1;
    }

    /**
     * Find a target by type and ID
     * @param {string} targetType - Target type
     * @param {string} targetId - Target ID
     * @returns {Object|null} Target object
     */
    findTarget(targetType, targetId) {
        switch (targetType) {
            case 'presentation':
                return this.state;
            case 'slide':
                return this.findSlide(targetId);
            case 'element':
                return this.findElement(targetId);
            default:
                return null;
        }
    }

    /**
     * Find a slide by ID
     * @param {string} slideId - Slide ID
     * @returns {Object|null} Slide object
     */
    findSlide(slideId) {
        return this.state?.slides?.find(s => s.id === slideId) || null;
    }

    /**
     * Find an element by ID (searches all slides)
     * @param {string} elementId - Element ID
     * @returns {Object|null} Element object
     */
    findElement(elementId) {
        if (!this.state?.slides) return null;
        
        for (const slide of this.state.slides) {
            const element = slide.elements?.find(el => el.id === elementId);
            if (element) return element;
        }
        
        return null;
    }

    /**
     * Set a nested value using a path string
     * @param {Object} obj - Object to modify
     * @param {string} path - Dot-separated path
     * @param {*} value - Value to set
     */
    setNestedValue(obj, path, value) {
        const parts = path.split('.');
        let current = obj;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!(parts[i] in current)) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
    }

    /**
     * Add operation to history
     * @param {Operation} operation - Operation to add
     */
    addToHistory(operation) {
        this.operationHistory.push(operation);
        
        // Trim history if too large
        if (this.operationHistory.length > this.maxHistorySize) {
            this.operationHistory.splice(0, this.operationHistory.length - this.maxHistorySize);
        }
    }

    /**
     * Update confirmed state after acknowledgment
     */
    updateConfirmedState() {
        // Apply all acknowledged operations to confirmed state
        this.lastConfirmedState = this.deepClone(this.state);
    }

    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Get current document state
     * @returns {Object} Current state
     */
    getState() {
        return this.state;
    }

    /**
     * Get pending operations count
     * @returns {number} Number of pending operations
     */
    getPendingCount() {
        return this.pendingOperations.length + 
               this.operationQueue.length + 
               (this.inflightOperation ? 1 : 0);
    }

    /**
     * Check if there are unsynced changes
     * @returns {boolean} True if there are unsynced changes
     */
    hasUnsyncedChanges() {
        return this.getPendingCount() > 0;
    }

    /**
     * Register an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * Remove an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Event callback
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[StateSyncEngine] Event handler error for ${event}:`, error);
                }
            }
        }
    }

    /**
     * Cleanup resources
     */
    dispose() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        for (const { timeoutId } of this.acknowledgmentCallbacks.values()) {
            clearTimeout(timeoutId);
        }
        this.acknowledgmentCallbacks.clear();
        
        if (this.connection) {
            this.connection.off(MESSAGE_TYPES.OPERATION, this.handleRemoteOperation);
            this.connection.off(MESSAGE_TYPES.OPERATION_ACK, this.handleAcknowledgment);
            this.connection.off(MESSAGE_TYPES.STATE_SYNC, this.handleStateSync);
        }
        
        this.listeners.clear();
        this.pendingOperations = [];
        this.operationQueue = [];
        this.inflightOperation = null;
        this.state = null;
        this.lastConfirmedState = null;
    }
}

// Export operation types and classes for external use
export { OperationType, Operation, VectorClock };
