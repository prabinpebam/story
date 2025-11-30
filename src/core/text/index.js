/**
 * Text Editing Module
 * 
 * Central text editing system for Story application.
 * 
 * @module core/text
 */

// Main orchestrator
export { TextEditManager, textEditManager } from './TextEditManager.js';

// Specialized managers
export { PlaceholderManager } from './PlaceholderManager.js';
export { SelectionManager, selectionManager } from './SelectionManager.js';
export { ContentSanitizer, contentSanitizer } from './ContentSanitizer.js';
export { IMEHandler, imeHandler } from './IMEHandler.js';
export { HistoryBridge, historyBridge } from './HistoryBridge.js';

// Constants and configuration
export * from './constants.js';
