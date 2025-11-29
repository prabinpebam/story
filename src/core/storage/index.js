/**
 * Storage Module - Main Exports
 * 
 * This module provides file format handling (.str files),
 * local caching, and cloud storage integration for Story presentations.
 */

// Constants
export * from './constants/StorageConstants.js';

// ZIP handling
export { ZipFileWriter, ZipFileReader } from './zip/index.js';

// Builders
export { ManifestBuilder, MetadataBuilder } from './builders/index.js';

// Serialization
export { PresentationSerializer, PresentationDeserializer } from './serialization/index.js';

// Caching
export { FileCache, getFileCache } from './cache/index.js';

// File System Access
export { FileSystemAccess } from './filesystem/index.js';

// Autosave
export { AutosaveManager } from './autosave/index.js';

// Cloud Storage Providers
export {
    IStorageProvider,
    GoogleDriveProvider,
    OneDriveProvider,
    CloudStorageManager,
    getCloudStorageManager
} from './providers/index.js';

// Sharing
export {
    SharingManager,
    PermissionNormalizer,
    ShareLinkGenerator,
    getSharingManager,
    resetSharingManager,
    SharingEvents,
    ShareRole,
    ShareLinkType,
    ShareLinkScope,
    SharingErrors
} from './sharing/index.js';