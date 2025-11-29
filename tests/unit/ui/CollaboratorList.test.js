/**
 * CollaboratorList Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollaboratorList } from '../../../src/ui/sharing/CollaboratorList.js';
import { SharingRoles } from '../../../src/core/storage/sharing/SharingConstants.js';

describe('CollaboratorList', () => {
    let list;
    const mockCollaborators = [
        {
            id: 'user-1',
            email: 'owner@example.com',
            displayName: 'Owner User',
            role: SharingRoles.OWNER,
            avatar: null
        },
        {
            id: 'user-2',
            email: 'editor@example.com',
            displayName: 'Editor User',
            role: SharingRoles.EDITOR,
            avatar: 'https://example.com/avatar.jpg'
        },
        {
            id: 'user-3',
            email: 'viewer@example.com',
            displayName: null,
            role: SharingRoles.VIEWER,
            avatar: null
        }
    ];
    
    beforeEach(() => {
        document.body.innerHTML = '';
        list = new CollaboratorList({
            collaborators: mockCollaborators,
            currentUserId: 'user-1'
        });
        document.body.appendChild(list.element);
    });
    
    afterEach(() => {
        list?.destroy();
    });
    
    describe('Initialization', () => {
        it('should create list element', () => {
            expect(list.element).toBeDefined();
            expect(list.element.classList.contains('collaborator-list')).toBe(true);
        });
        
        it('should render all collaborators', () => {
            const items = list.element.querySelectorAll('.collaborator-item');
            expect(items.length).toBe(3);
        });
    });
    
    describe('Empty State', () => {
        it('should show empty message when no collaborators', () => {
            list.destroy();
            list = new CollaboratorList({
                collaborators: []
            });
            document.body.appendChild(list.element);
            
            const empty = list.element.querySelector('.collaborator-list-empty');
            expect(empty).toBeDefined();
        });
    });
    
    describe('Collaborator Display', () => {
        it('should show collaborator name', () => {
            const items = list.element.querySelectorAll('.collaborator-name');
            expect(items[0].textContent).toBe('Owner User');
        });
        
        it('should show email when no name', () => {
            const items = list.element.querySelectorAll('.collaborator-name');
            expect(items[2].textContent).toBe('viewer@example.com');
        });
        
        it('should show collaborator email', () => {
            const emails = list.element.querySelectorAll('.collaborator-email');
            expect(emails[0].textContent).toBe('owner@example.com');
        });
        
        it('should display avatar image when available', () => {
            const avatars = list.element.querySelectorAll('.collaborator-avatar');
            const img = avatars[1].querySelector('img');
            expect(img).toBeDefined();
            expect(img?.src).toContain('example.com/avatar.jpg');
        });
        
        it('should display initials when no avatar', () => {
            const avatars = list.element.querySelectorAll('.collaborator-avatar');
            // Owner User -> OU
            expect(avatars[0].textContent).toBe('OU');
        });
    });
    
    describe('Owner Badge', () => {
        it('should show owner badge for owner', () => {
            const items = list.element.querySelectorAll('.collaborator-item');
            const ownerBadge = items[0].querySelector('.collaborator-owner-badge');
            expect(ownerBadge).toBeDefined();
        });
        
        it('should not show role dropdown for owner', () => {
            const items = list.element.querySelectorAll('.collaborator-item');
            const dropdown = items[0].querySelector('.permission-dropdown');
            expect(dropdown).toBeNull();
        });
    });
    
    describe('Role Dropdown', () => {
        it('should show role dropdown for non-owners', () => {
            const items = list.element.querySelectorAll('.collaborator-item');
            const dropdown = items[1].querySelector('.permission-dropdown');
            expect(dropdown).toBeDefined();
        });
        
        it('should display current role', () => {
            const items = list.element.querySelectorAll('.collaborator-item');
            const trigger = items[1].querySelector('.permission-dropdown-trigger');
            expect(trigger?.textContent).toContain('Editor');
        });
    });
    
    describe('Role Change', () => {
        it('should call onRoleChange when role updated', () => {
            const onRoleChange = vi.fn();
            list.destroy();
            list = new CollaboratorList({
                collaborators: mockCollaborators,
                onRoleChange
            });
            document.body.appendChild(list.element);
            
            const items = list.element.querySelectorAll('.collaborator-item');
            const trigger = items[1].querySelector('.permission-dropdown-trigger');
            trigger?.click();
            
            const viewerOption = items[1].querySelector('[data-role="viewer"]');
            viewerOption?.click();
            
            expect(onRoleChange).toHaveBeenCalledWith('user-2', SharingRoles.VIEWER);
        });
    });
    
    describe('Remove Button', () => {
        it('should show remove button for non-owners', () => {
            const items = list.element.querySelectorAll('.collaborator-item');
            const removeBtn = items[1].querySelector('.collaborator-remove');
            expect(removeBtn).toBeDefined();
        });
        
        it('should not show remove button for owner', () => {
            const items = list.element.querySelectorAll('.collaborator-item');
            const removeBtn = items[0].querySelector('.collaborator-remove');
            expect(removeBtn).toBeNull();
        });
        
        it('should call onRemove when remove clicked', () => {
            const onRemove = vi.fn();
            list.destroy();
            list = new CollaboratorList({
                collaborators: mockCollaborators,
                onRemove
            });
            document.body.appendChild(list.element);
            
            const items = list.element.querySelectorAll('.collaborator-item');
            const removeBtn = items[1].querySelector('.collaborator-remove');
            removeBtn?.click();
            
            expect(onRemove).toHaveBeenCalledWith('user-2');
        });
    });
    
    describe('Current User', () => {
        it('should mark current user item', () => {
            const items = list.element.querySelectorAll('.collaborator-item');
            // First item is current user (owner)
            expect(items[0].classList.contains('is-owner')).toBe(true);
        });
        
        it('should not allow removing self', () => {
            list.destroy();
            list = new CollaboratorList({
                collaborators: mockCollaborators,
                currentUserId: 'user-2' // Not owner, but current user
            });
            document.body.appendChild(list.element);
            
            const items = list.element.querySelectorAll('.collaborator-item');
            // Editor item (index 1) is current user, should not have remove
            const removeBtn = items[1].querySelector('.collaborator-remove');
            expect(removeBtn).toBeNull();
        });
    });
    
    describe('setCollaborators()', () => {
        it('should update list with new collaborators', () => {
            list.setCollaborators([mockCollaborators[0]]);
            const items = list.element.querySelectorAll('.collaborator-item');
            expect(items.length).toBe(1);
        });
        
        it('should re-render the list', () => {
            const newCollabs = [{
                id: 'new-user',
                email: 'new@example.com',
                displayName: 'New User',
                role: SharingRoles.VIEWER
            }];
            
            list.setCollaborators(newCollabs);
            const names = list.element.querySelectorAll('.collaborator-name');
            expect(names[0].textContent).toBe('New User');
        });
    });
    
    describe('Disabled State', () => {
        it('should disable role dropdowns when readonly', () => {
            list.destroy();
            list = new CollaboratorList({
                collaborators: mockCollaborators,
                readonly: true
            });
            document.body.appendChild(list.element);
            
            const dropdowns = list.element.querySelectorAll('.permission-dropdown');
            dropdowns.forEach(d => {
                expect(d.classList.contains('disabled')).toBe(true);
            });
        });
        
        it('should hide remove buttons when readonly', () => {
            list.destroy();
            list = new CollaboratorList({
                collaborators: mockCollaborators,
                readonly: true
            });
            document.body.appendChild(list.element);
            
            const removeBtn = list.element.querySelector('.collaborator-remove');
            expect(removeBtn).toBeNull();
        });
    });
    
    describe('destroy()', () => {
        it('should remove element from DOM', () => {
            list.destroy();
            expect(document.body.contains(list.element)).toBe(false);
        });
    });
});
