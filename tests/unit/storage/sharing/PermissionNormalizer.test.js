/**
 * PermissionNormalizer Tests
 * 
 * Tests for permission role normalization across cloud storage providers.
 */

import { describe, it, expect } from 'vitest';
import { PermissionNormalizer } from '../../../../src/core/storage/sharing/PermissionNormalizer.js';
import { ShareRole } from '../../../../src/core/storage/sharing/SharingConstants.js';

describe('PermissionNormalizer', () => {
    let normalizer;
    
    beforeEach(() => {
        normalizer = new PermissionNormalizer();
    });
    
    describe('normalizeRole', () => {
        it('should return standard roles unchanged', () => {
            expect(normalizer.normalizeRole('viewer')).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole('commenter')).toBe(ShareRole.COMMENTER);
            expect(normalizer.normalizeRole('editor')).toBe(ShareRole.EDITOR);
            expect(normalizer.normalizeRole('owner')).toBe(ShareRole.OWNER);
        });
        
        it('should normalize case', () => {
            expect(normalizer.normalizeRole('VIEWER')).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole('Editor')).toBe(ShareRole.EDITOR);
        });
        
        it('should normalize OneDrive roles', () => {
            expect(normalizer.normalizeRole('read')).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole('write')).toBe(ShareRole.EDITOR);
            expect(normalizer.normalizeRole('owner')).toBe(ShareRole.OWNER);
            expect(normalizer.normalizeRole('sp_editor')).toBe(ShareRole.EDITOR);
            expect(normalizer.normalizeRole('sp_viewer')).toBe(ShareRole.VIEWER);
        });
        
        it('should normalize Google Drive roles', () => {
            expect(normalizer.normalizeRole('reader')).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole('commenter')).toBe(ShareRole.COMMENTER);
            expect(normalizer.normalizeRole('writer')).toBe(ShareRole.EDITOR);
            expect(normalizer.normalizeRole('fileOrganizer')).toBe(ShareRole.EDITOR);
            expect(normalizer.normalizeRole('organizer')).toBe(ShareRole.EDITOR);
        });
        
        it('should normalize common aliases', () => {
            expect(normalizer.normalizeRole('view')).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole('readonly')).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole('read-only')).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole('comment')).toBe(ShareRole.COMMENTER);
            expect(normalizer.normalizeRole('edit')).toBe(ShareRole.EDITOR);
            expect(normalizer.normalizeRole('contributor')).toBe(ShareRole.EDITOR);
            expect(normalizer.normalizeRole('admin')).toBe(ShareRole.OWNER);
            expect(normalizer.normalizeRole('full')).toBe(ShareRole.OWNER);
        });
        
        it('should default to viewer for unknown roles', () => {
            expect(normalizer.normalizeRole('unknown')).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole('')).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole(null)).toBe(ShareRole.VIEWER);
            expect(normalizer.normalizeRole(undefined)).toBe(ShareRole.VIEWER);
        });
    });
    
    describe('toOneDriveRole', () => {
        it('should convert standard roles to OneDrive roles', () => {
            expect(normalizer.toOneDriveRole('viewer')).toBe('read');
            expect(normalizer.toOneDriveRole('editor')).toBe('write');
            expect(normalizer.toOneDriveRole('owner')).toBe('owner');
        });
        
        it('should map commenter to read (OneDrive limitation)', () => {
            expect(normalizer.toOneDriveRole('commenter')).toBe('read');
        });
        
        it('should normalize input before converting', () => {
            expect(normalizer.toOneDriveRole('EDITOR')).toBe('write');
            expect(normalizer.toOneDriveRole('writer')).toBe('write');
        });
    });
    
    describe('fromOneDriveRole', () => {
        it('should convert OneDrive roles to standard roles', () => {
            expect(normalizer.fromOneDriveRole('read')).toBe(ShareRole.VIEWER);
            expect(normalizer.fromOneDriveRole('write')).toBe(ShareRole.EDITOR);
            expect(normalizer.fromOneDriveRole('owner')).toBe(ShareRole.OWNER);
        });
        
        it('should handle case insensitivity', () => {
            expect(normalizer.fromOneDriveRole('READ')).toBe(ShareRole.VIEWER);
            expect(normalizer.fromOneDriveRole('Write')).toBe(ShareRole.EDITOR);
        });
        
        it('should default to viewer for unknown roles', () => {
            expect(normalizer.fromOneDriveRole('unknown')).toBe(ShareRole.VIEWER);
        });
    });
    
    describe('toGoogleDriveRole', () => {
        it('should convert standard roles to Google Drive roles', () => {
            expect(normalizer.toGoogleDriveRole('viewer')).toBe('reader');
            expect(normalizer.toGoogleDriveRole('commenter')).toBe('commenter');
            expect(normalizer.toGoogleDriveRole('editor')).toBe('writer');
            expect(normalizer.toGoogleDriveRole('owner')).toBe('owner');
        });
        
        it('should normalize input before converting', () => {
            expect(normalizer.toGoogleDriveRole('EDITOR')).toBe('writer');
        });
    });
    
    describe('fromGoogleDriveRole', () => {
        it('should convert Google Drive roles to standard roles', () => {
            expect(normalizer.fromGoogleDriveRole('reader')).toBe(ShareRole.VIEWER);
            expect(normalizer.fromGoogleDriveRole('commenter')).toBe(ShareRole.COMMENTER);
            expect(normalizer.fromGoogleDriveRole('writer')).toBe(ShareRole.EDITOR);
            expect(normalizer.fromGoogleDriveRole('owner')).toBe(ShareRole.OWNER);
        });
        
        it('should handle case insensitivity', () => {
            expect(normalizer.fromGoogleDriveRole('READER')).toBe(ShareRole.VIEWER);
        });
    });
    
    describe('getRoleHierarchy', () => {
        it('should return roles in order of permissions', () => {
            const hierarchy = normalizer.getRoleHierarchy();
            
            expect(hierarchy).toEqual([
                ShareRole.VIEWER,
                ShareRole.COMMENTER,
                ShareRole.EDITOR,
                ShareRole.OWNER
            ]);
        });
    });
    
    describe('compareRoles', () => {
        it('should return -1 when first role has fewer permissions', () => {
            expect(normalizer.compareRoles('viewer', 'editor')).toBe(-1);
            expect(normalizer.compareRoles('commenter', 'owner')).toBe(-1);
        });
        
        it('should return 1 when first role has more permissions', () => {
            expect(normalizer.compareRoles('editor', 'viewer')).toBe(1);
            expect(normalizer.compareRoles('owner', 'commenter')).toBe(1);
        });
        
        it('should return 0 when roles are equal', () => {
            expect(normalizer.compareRoles('editor', 'editor')).toBe(0);
            expect(normalizer.compareRoles('viewer', 'viewer')).toBe(0);
        });
        
        it('should normalize before comparing', () => {
            expect(normalizer.compareRoles('read', 'write')).toBe(-1);
            expect(normalizer.compareRoles('writer', 'reader')).toBe(1);
        });
    });
    
    describe('hasAtLeast', () => {
        it('should return true when role meets or exceeds requirement', () => {
            expect(normalizer.hasAtLeast('editor', 'viewer')).toBe(true);
            expect(normalizer.hasAtLeast('editor', 'editor')).toBe(true);
            expect(normalizer.hasAtLeast('owner', 'viewer')).toBe(true);
        });
        
        it('should return false when role is below requirement', () => {
            expect(normalizer.hasAtLeast('viewer', 'editor')).toBe(false);
            expect(normalizer.hasAtLeast('commenter', 'owner')).toBe(false);
        });
    });
    
    describe('getRoleDescription', () => {
        it('should return viewer description', () => {
            const desc = normalizer.getRoleDescription('viewer');
            
            expect(desc.name).toBe('Viewer');
            expect(desc.description).toContain('view');
            expect(desc.capabilities).toContain('view');
        });
        
        it('should return commenter description', () => {
            const desc = normalizer.getRoleDescription('commenter');
            
            expect(desc.name).toBe('Commenter');
            expect(desc.capabilities).toContain('comment');
        });
        
        it('should return editor description', () => {
            const desc = normalizer.getRoleDescription('editor');
            
            expect(desc.name).toBe('Editor');
            expect(desc.capabilities).toContain('edit');
        });
        
        it('should return owner description', () => {
            const desc = normalizer.getRoleDescription('owner');
            
            expect(desc.name).toBe('Owner');
            expect(desc.capabilities).toContain('share');
            expect(desc.capabilities).toContain('delete');
        });
        
        it('should handle unknown roles (defaults to viewer)', () => {
            // Note: getRoleDescription normalizes the role first,
            // so unknown roles become 'viewer' and return viewer description
            const desc = normalizer.getRoleDescription('unknown');
            
            expect(desc.name).toBe('Viewer');
            expect(desc.capabilities).toContain('view');
        });
    });
    
    describe('getShareableRoles', () => {
        it('should return roles available for sharing', () => {
            const roles = normalizer.getShareableRoles();
            
            expect(roles).toHaveLength(3);
            expect(roles.map(r => r.value)).toEqual([
                ShareRole.VIEWER,
                ShareRole.COMMENTER,
                ShareRole.EDITOR
            ]);
        });
        
        it('should include labels', () => {
            const roles = normalizer.getShareableRoles();
            
            expect(roles[0].label).toBe('Viewer');
            expect(roles[1].label).toBe('Commenter');
            expect(roles[2].label).toBe('Editor');
        });
        
        it('should not include owner', () => {
            const roles = normalizer.getShareableRoles();
            
            expect(roles.map(r => r.value)).not.toContain(ShareRole.OWNER);
        });
    });
    
    describe('isRoleSupported', () => {
        it('should return true for OneDrive supported roles', () => {
            expect(normalizer.isRoleSupported('onedrive', 'viewer')).toBe(true);
            expect(normalizer.isRoleSupported('onedrive', 'editor')).toBe(true);
            expect(normalizer.isRoleSupported('onedrive', 'owner')).toBe(true);
        });
        
        it('should return false for OneDrive commenter (not supported)', () => {
            expect(normalizer.isRoleSupported('onedrive', 'commenter')).toBe(false);
        });
        
        it('should return true for all Google Drive roles', () => {
            expect(normalizer.isRoleSupported('google-drive', 'viewer')).toBe(true);
            expect(normalizer.isRoleSupported('google-drive', 'commenter')).toBe(true);
            expect(normalizer.isRoleSupported('google-drive', 'editor')).toBe(true);
            expect(normalizer.isRoleSupported('google-drive', 'owner')).toBe(true);
        });
        
        it('should return false for unknown providers', () => {
            expect(normalizer.isRoleSupported('dropbox', 'viewer')).toBe(false);
        });
    });
    
    describe('getClosestSupportedRole', () => {
        it('should return same role if supported', () => {
            expect(normalizer.getClosestSupportedRole('google-drive', 'commenter')).toBe('commenter');
            expect(normalizer.getClosestSupportedRole('onedrive', 'editor')).toBe('editor');
        });
        
        it('should return viewer for OneDrive commenter', () => {
            expect(normalizer.getClosestSupportedRole('onedrive', 'commenter')).toBe('viewer');
        });
    });
});
