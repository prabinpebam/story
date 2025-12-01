/**
 * Text Editing Constants
 * 
 * Centralized configuration values for the text editing system.
 * All values reference design tokens where applicable.
 */

// =============================================================================
// TIMING CONSTANTS
// =============================================================================

export const TIMING = {
    /** Debounce interval for content saves (ms) */
    DEBOUNCE_SAVE_MS: 500,
    
    /** Draft auto-save interval (ms) */
    AUTO_SAVE_INTERVAL_MS: 5000,
    
    /** Draft expiration time (7 days in ms) */
    DRAFT_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
    
    /** History entry coalescing window (ms) */
    COALESCE_WINDOW_MS: 1000
};

// =============================================================================
// PLACEHOLDER PROMPTS
// =============================================================================

export const PLACEHOLDER_PROMPTS = {
    title: 'Click to add title',
    subtitle: 'Click to add subtitle',
    body: 'Click to add text',
    text: 'Click to add text',
    date: 'Date',
    slideNumber: '#',
    footer: 'Footer text'
};

// =============================================================================
// ALLOWED HTML ELEMENTS (for ContentSanitizer)
// =============================================================================

export const ALLOWED_ELEMENTS = {
    // Structure
    structure: ['p', 'div', 'br'],
    
    // Formatting
    formatting: ['b', 'strong', 'i', 'em', 'u', 's', 'del', 'sub', 'sup'],
    
    // Inline
    inline: ['span'],
    
    // Lists (future)
    lists: ['ul', 'ol', 'li'],
    
    // Links (future)
    links: ['a']
};

// Flat list of all allowed elements
export const ALLOWED_ELEMENTS_LIST = [
    ...ALLOWED_ELEMENTS.structure,
    ...ALLOWED_ELEMENTS.formatting,
    ...ALLOWED_ELEMENTS.inline,
    ...ALLOWED_ELEMENTS.lists
];

// =============================================================================
// ALLOWED CSS PROPERTIES (for ContentSanitizer)
// =============================================================================

export const ALLOWED_CSS_PROPERTIES = [
    // Typography
    'font-size',
    'font-family', 
    'font-weight',
    'font-style',
    'text-decoration',
    'text-align',
    
    // Color
    'color',
    'background-color',
    
    // Spacing
    'line-height',
    'letter-spacing'
];

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

export const SHORTCUTS = {
    BOLD: { key: 'b', meta: true },
    ITALIC: { key: 'i', meta: true },
    UNDERLINE: { key: 'u', meta: true },
    STRIKETHROUGH: { key: 'x', meta: true, shift: true },
    EXIT_EDIT: { key: 'Escape' },
    EXIT_EDIT_ALT: { key: 'Enter', meta: true },
    SELECT_ALL: { key: 'a', meta: true }
};

// =============================================================================
// CSS CLASS NAMES
// =============================================================================

export const CSS_CLASSES = {
    // Base element class
    TEXT_ELEMENT: 'text-element',
    
    // State modifiers
    EDITING: 'text-element--editing',
    PLACEHOLDER_EMPTY: 'text-element--placeholder-empty',
    SELECTED: 'text-element--selected',
    
    // Content container
    CONTENT: 'text-content',
    CONTENT_PROMPT: 'text-content--prompt',
    
    // Edit mode
    FOCUS_RING: 'text-element--focus-ring'
};

// =============================================================================
// DATA ATTRIBUTES
// =============================================================================

export const DATA_ATTRIBUTES = {
    ELEMENT_ID: 'data-element-id',
    PLACEHOLDER_TYPE: 'data-placeholder-type',
    EDITING: 'data-editing',
    HAS_USER_CONTENT: 'data-has-user-content'
};

// =============================================================================
// STORE ACTION TYPES
// =============================================================================

export const ACTION_TYPES = {
    ENTER_TEXT_EDIT: 'ENTER_TEXT_EDIT',
    EXIT_TEXT_EDIT: 'EXIT_TEXT_EDIT',
    SAVE_TEXT_CONTENT: 'SAVE_TEXT_CONTENT',
    MARK_TEXT_DIRTY: 'MARK_TEXT_DIRTY'
};

// =============================================================================
// EVENT NAMES
// =============================================================================

export const EVENTS = {
    TEXT_EDIT_START: 'text-edit-start',
    TEXT_EDIT_END: 'text-edit-end',
    TEXT_SELECTION_CHANGE: 'text-selection-change',
    TEXT_CONTENT_SAVE: 'text-content-save',
    RECOVERABLE_CONTENT: 'recoverable-content'
};

// =============================================================================
// DEFAULT STYLE VALUES (Design Token References)
// =============================================================================

export const DEFAULT_STYLES = {
    // These reference CSS variables - never hardcode values
    fontFamily: 'var(--font-family-sans)',
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--font-weight-regular)',
    lineHeight: 'var(--line-height-body)',
    letterSpacing: 'var(--letter-spacing-body)',
    color: 'var(--color-text-primary)'
};

// =============================================================================
// LIMITS
// =============================================================================

export const LIMITS = {
    /** Maximum content length in characters */
    MAX_CONTENT_LENGTH: 100000,
    
    /** Maximum undo entries for text edits */
    MAX_UNDO_ENTRIES: 50,
    
    /** Maximum number of drafts to store */
    MAX_DRAFT_COUNT: 100,
    
    /** Maximum nesting depth for sanitizer */
    MAX_NESTED_TAGS: 10
};

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURE_FLAGS = {
    /** Enable IME composition handling */
    ENABLE_IME_SUPPORT: true,
    
    /** Enable draft recovery */
    ENABLE_DRAFT_RECOVERY: true,
    
    /** Enable history entry coalescing */
    ENABLE_COALESCING: false,
    
    /** Enable formatted paste support */
    ENABLE_RICH_PASTE: true
};

// =============================================================================
// STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
    /** localStorage key pattern for drafts */
    DRAFT_PREFIX: 'story-draft:',
    
    /** IndexedDB database name */
    INDEXEDDB_NAME: 'story-drafts',
    
    /** IndexedDB object store name */
    INDEXEDDB_STORE: 'drafts'
};

// =============================================================================
// ERROR CODES
// =============================================================================

export const ERROR_CODES = {
    ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
    ALREADY_EDITING: 'ALREADY_EDITING',
    INVALID_CONTENT: 'INVALID_CONTENT',
    SAVE_FAILED: 'SAVE_FAILED',
    RECOVERY_FAILED: 'RECOVERY_FAILED'
};

export const ERROR_MESSAGES = {
    [ERROR_CODES.ELEMENT_NOT_FOUND]: 'Element not found',
    [ERROR_CODES.ALREADY_EDITING]: 'Already editing another element',
    [ERROR_CODES.INVALID_CONTENT]: 'Content validation failed',
    [ERROR_CODES.SAVE_FAILED]: 'Failed to save content',
    [ERROR_CODES.RECOVERY_FAILED]: 'Failed to recover drafts'
};
