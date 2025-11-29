/**
 * Preferences Module
 * 
 * User preferences with identity-locked encryption.
 * 
 * @module core/auth/preferences
 */

// Schema and validation
export { 
    DEFAULT_PREFERENCES,
    PREFERENCES_SCHEMA_VERSION,
    LOCAL_ONLY_PROPERTIES,
    MERGE_PROPERTIES,
    ARRAY_LIMITS,
    validatePreferences,
    migratePreferences,
    mergePreferences
} from './PreferencesSchema.js';

// Identity-locked encryption
export { 
    IdentityEncryption,
    DecryptionError 
} from './IdentityEncryption.js';

// File format handling
export { PreferencesFile } from './PreferencesFile.js';

// High-level preferences management
export { 
    PreferencesManager,
    PreferencesEvents,
    getPreferencesManager 
} from './PreferencesManager.js';

// Cloud storage discovery
export { 
    PreferencesDiscovery,
    StorageLocations,
    PREFERENCES_FILENAME 
} from './PreferencesDiscovery.js';

// Cross-device sync
export {
    PreferencesSync,
    SyncEvents,
    SyncStatus
} from './PreferencesSync.js';

// Migration from localStorage
export {
    PreferencesMigration,
    preferencesMigration
} from './PreferencesMigration.js';
