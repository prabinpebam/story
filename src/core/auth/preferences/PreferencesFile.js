/**
 * Preferences File
 * 
 * Handles the encrypted preferences .str file format.
 * Uses ZIP archive with encrypted preferences data.
 * 
 * File Structure:
 * story-preferences.str (ZIP)
 * ├── manifest.json           # Format type, owner info
 * ├── identity.json           # Owner identity + linked accounts
 * ├── access/
 * │   └── allowed.json        # Authorized identities
 * └── preferences/
 *     └── data.json.enc       # Encrypted preferences
 * 
 * @module core/auth/preferences/PreferencesFile
 */

import JSZip from 'jszip';
import { IdentityEncryption, DecryptionError } from './IdentityEncryption.js';
import { DEFAULT_PREFERENCES, PREFERENCES_SCHEMA_VERSION, migratePreferences } from './PreferencesSchema.js';

/**
 * Format type identifier
 */
const FORMAT_TYPE = 'story-preferences';

/**
 * Format version
 */
const FORMAT_VERSION = '1.0.0';

/**
 * Generate unique file ID
 */
function generateFileId() {
    return `pref_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Preferences File Handler
 */
export class PreferencesFile {
    constructor() {
        this.manifest = null;
        this.identity = null;
        this.access = null;
        this.encryptedData = null;
        this.salt = null;
        this.encryption = new IdentityEncryption();
    }

    /**
     * Create a new preferences file
     * 
     * @param {Object} idTokenClaims - OAuth claims for the owner
     * @param {Object} [initialPreferences] - Initial preferences (defaults used if not provided)
     * @returns {Promise<PreferencesFile>} New preferences file
     */
    static async create(idTokenClaims, initialPreferences = null) {
        const file = new PreferencesFile();
        const encryption = new IdentityEncryption();
        
        // Generate salt
        file.salt = encryption.generateSalt();
        
        // Create identity ID
        const identityId = encryption.getIdentityId(idTokenClaims);
        const provider = encryption.getProviderFromIssuer(idTokenClaims.iss);
        
        // Create manifest
        file.manifest = {
            formatType: FORMAT_TYPE,
            formatVersion: FORMAT_VERSION,
            appVersion: '0.1.0', // TODO: Get from app config
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            owner: {
                id: identityId,
                email: idTokenClaims.email || null,
                provider: provider
            },
            encryption: {
                algorithm: 'AES-256-GCM',
                keyDerivation: 'HKDF-SHA256',
                version: 1
            },
            fileId: generateFileId(),
            checksum: '' // Computed on save
        };
        
        // Create identity info
        file.identity = {
            owner: {
                id: identityId,
                provider: provider,
                email: idTokenClaims.email || null,
                name: idTokenClaims.name || null,
                tokenBinding: {
                    sub: idTokenClaims.sub,
                    iss: idTokenClaims.iss,
                    createdAt: new Date().toISOString()
                }
            },
            linkedIdentities: []
        };
        
        // Create access control
        file.access = {
            allowedIdentities: [
                {
                    id: identityId,
                    type: 'owner',
                    addedAt: new Date().toISOString()
                }
            ],
            trustedDevices: []
        };
        
        // Create and encrypt preferences
        const preferences = initialPreferences 
            ? { ...DEFAULT_PREFERENCES, ...initialPreferences }
            : { ...DEFAULT_PREFERENCES };
        preferences.lastModified = new Date().toISOString();
        
        file.encryptedData = await encryption.encrypt(preferences, idTokenClaims, file.salt);
        
        return file;
    }

    /**
     * Load preferences file from bytes
     * 
     * @param {ArrayBuffer} data - ZIP file bytes
     * @returns {Promise<PreferencesFile>} Loaded preferences file
     * @throws {Error} If file is invalid or corrupted
     */
    static async fromBytes(data) {
        const file = new PreferencesFile();
        
        const zip = await JSZip.loadAsync(data);
        
        // Read manifest
        const manifestFile = zip.file('manifest.json');
        if (!manifestFile) {
            throw new Error('Invalid preferences file: missing manifest.json');
        }
        file.manifest = JSON.parse(await manifestFile.async('text'));
        
        // Validate format type
        if (file.manifest.formatType !== FORMAT_TYPE) {
            throw new Error(`Invalid file type: ${file.manifest.formatType}`);
        }
        
        // Read identity
        const identityFile = zip.file('identity.json');
        if (identityFile) {
            file.identity = JSON.parse(await identityFile.async('text'));
        }
        
        // Read access
        const accessFile = zip.file('access/allowed.json');
        if (accessFile) {
            file.access = JSON.parse(await accessFile.async('text'));
        }
        
        // Read encrypted data
        const encryptedFile = zip.file('preferences/data.json.enc');
        if (!encryptedFile) {
            throw new Error('Invalid preferences file: missing encrypted data');
        }
        const encryptedBytes = await encryptedFile.async('text');
        file.encryptedData = JSON.parse(encryptedBytes);
        file.salt = new Uint8Array(file.encryptedData.salt);
        
        return file;
    }

    /**
     * Export preferences file to bytes
     * 
     * @returns {Promise<ArrayBuffer>} ZIP file bytes
     */
    async toBytes() {
        const zip = new JSZip();
        
        // Update modified timestamp
        this.manifest.modified = new Date().toISOString();
        
        // Add files to ZIP
        zip.file('manifest.json', JSON.stringify(this.manifest, null, 2));
        zip.file('identity.json', JSON.stringify(this.identity, null, 2));
        zip.file('access/allowed.json', JSON.stringify(this.access, null, 2));
        zip.file('preferences/data.json.enc', JSON.stringify(this.encryptedData));
        
        // Generate ZIP
        return zip.generateAsync({ type: 'arraybuffer' });
    }

    /**
     * Check if identity can decrypt this file
     * 
     * @param {Object} idTokenClaims - OAuth claims
     * @returns {boolean} True if identity is authorized
     */
    canDecrypt(idTokenClaims) {
        const identityId = this.encryption.getIdentityId(idTokenClaims);
        return this.access.allowedIdentities.some(i => i.id === identityId);
    }

    /**
     * Get decrypted preferences
     * 
     * @param {Object} idTokenClaims - OAuth claims
     * @returns {Promise<Object>} Decrypted preferences
     * @throws {DecryptionError} If identity is not authorized
     */
    async getPreferences(idTokenClaims) {
        if (!this.canDecrypt(idTokenClaims)) {
            throw new DecryptionError('Identity not authorized to access this preferences file');
        }
        
        const preferences = await this.encryption.decrypt(this.encryptedData, idTokenClaims);
        
        // Migrate if needed
        return migratePreferences(preferences);
    }

    /**
     * Update preferences
     * 
     * @param {Object} preferences - New preferences
     * @param {Object} idTokenClaims - OAuth claims
     * @returns {Promise<void>}
     * @throws {DecryptionError} If identity is not authorized
     */
    async setPreferences(preferences, idTokenClaims) {
        if (!this.canDecrypt(idTokenClaims)) {
            throw new DecryptionError('Identity not authorized to modify this preferences file');
        }
        
        // Update timestamp
        preferences.lastModified = new Date().toISOString();
        
        // Re-encrypt with same salt
        this.encryptedData = await this.encryption.encrypt(preferences, idTokenClaims, this.salt);
        
        // Update manifest timestamp
        this.manifest.modified = new Date().toISOString();
    }

    /**
     * Add a linked identity
     * 
     * @param {Object} ownerClaims - Current owner's OAuth claims
     * @param {Object} newIdentityClaims - New identity's OAuth claims
     * @returns {Promise<void>}
     */
    async addLinkedIdentity(ownerClaims, newIdentityClaims) {
        // Verify current user is authorized
        const ownerId = this.encryption.getIdentityId(ownerClaims);
        const isOwner = this.access.allowedIdentities.some(
            i => i.id === ownerId && i.type === 'owner'
        );
        
        if (!isOwner) {
            throw new Error('Only the owner can add linked identities');
        }
        
        // Add new identity to access list
        const newIdentityId = this.encryption.getIdentityId(newIdentityClaims);
        const provider = this.encryption.getProviderFromIssuer(newIdentityClaims.iss);
        
        // Check if already linked
        if (this.access.allowedIdentities.some(i => i.id === newIdentityId)) {
            return; // Already linked
        }
        
        this.access.allowedIdentities.push({
            id: newIdentityId,
            type: 'linked',
            addedAt: new Date().toISOString()
        });
        
        // Add to identity.linkedIdentities
        this.identity.linkedIdentities.push({
            id: newIdentityId,
            provider: provider,
            email: newIdentityClaims.email || null,
            linkedAt: new Date().toISOString()
        });
        
        // Note: In a full implementation, we would also re-encrypt the data
        // key (DEK) using the new identity's derived key (key wrapping)
        // For now, we rely on the salt being the same and the new identity
        // being able to derive the same key
    }

    /**
     * Remove a linked identity
     * 
     * @param {Object} ownerClaims - Current owner's OAuth claims
     * @param {string} identityIdToRemove - Identity ID to remove
     */
    removeLinkedIdentity(ownerClaims, identityIdToRemove) {
        const ownerId = this.encryption.getIdentityId(ownerClaims);
        
        // Can't remove the owner
        if (identityIdToRemove === ownerId) {
            throw new Error('Cannot remove the owner identity');
        }
        
        // Verify current user is owner
        const isOwner = this.access.allowedIdentities.some(
            i => i.id === ownerId && i.type === 'owner'
        );
        
        if (!isOwner) {
            throw new Error('Only the owner can remove linked identities');
        }
        
        // Remove from access list
        this.access.allowedIdentities = this.access.allowedIdentities.filter(
            i => i.id !== identityIdToRemove
        );
        
        // Remove from linkedIdentities
        this.identity.linkedIdentities = this.identity.linkedIdentities.filter(
            i => i.id !== identityIdToRemove
        );
    }

    /**
     * Get owner info
     * 
     * @returns {Object} Owner information
     */
    getOwnerInfo() {
        return {
            id: this.manifest.owner.id,
            email: this.manifest.owner.email,
            provider: this.manifest.owner.provider
        };
    }

    /**
     * Get all authorized identities
     * 
     * @returns {Object[]} List of authorized identities
     */
    getAuthorizedIdentities() {
        return this.access.allowedIdentities.map(identity => ({
            ...identity,
            isOwner: identity.type === 'owner'
        }));
    }

    /**
     * Get file metadata
     * 
     * @returns {Object} File metadata
     */
    getMetadata() {
        return {
            fileId: this.manifest.fileId,
            created: this.manifest.created,
            modified: this.manifest.modified,
            owner: this.manifest.owner
        };
    }
}
