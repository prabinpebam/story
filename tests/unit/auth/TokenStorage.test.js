/**
 * TokenStorage Unit Tests
 * 
 * Tests token storage, retrieval, expiration, and multi-tab sync.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TokenStorage } from '../../../src/core/auth/storage/TokenStorage.js';

describe('TokenStorage', () => {
    let storage;
    
    beforeEach(() => {
        localStorage.clear();
        storage = new TokenStorage();
    });
    
    afterEach(() => {
        storage.destroy();
        localStorage.clear();
    });
    
    describe('setTokens', () => {
        it('should store tokens correctly', () => {
            storage.setTokens({
                accessToken: 'test_access_token',
                refreshToken: 'test_refresh_token',
                expiresIn: 3600,
                provider: 'microsoft'
            });
            
            expect(storage.getAccessToken()).toBe('test_access_token');
            expect(storage.getRefreshToken()).toBe('test_refresh_token');
            expect(storage.getProvider()).toBe('microsoft');
        });
        
        it('should calculate correct expiration time', () => {
            const now = Date.now();
            storage.setTokens({
                accessToken: 'test_token',
                refreshToken: 'test_refresh',
                expiresIn: 3600,
                provider: 'google'
            });
            
            const expiresAt = storage.getExpiresAt();
            expect(expiresAt).toBeGreaterThan(now);
            expect(expiresAt).toBeLessThan(now + 3700 * 1000);
        });
    });
    
    describe('getAccessToken', () => {
        it('should return token if not expired', () => {
            storage.setTokens({
                accessToken: 'valid_token',
                refreshToken: 'refresh',
                expiresIn: 3600,
                provider: 'microsoft'
            });
            
            expect(storage.getAccessToken()).toBe('valid_token');
        });
        
        it('should return null if token expired', () => {
            storage.setTokens({
                accessToken: 'expired_token',
                refreshToken: 'refresh',
                expiresIn: -100, // Already expired
                provider: 'microsoft'
            });
            
            expect(storage.getAccessToken()).toBeNull();
        });
        
        it('should return null if no token stored', () => {
            expect(storage.getAccessToken()).toBeNull();
        });
    });
    
    describe('isAuthenticated', () => {
        it('should return true when valid token exists', () => {
            storage.setTokens({
                accessToken: 'valid_token',
                refreshToken: 'refresh',
                expiresIn: 3600,
                provider: 'microsoft'
            });
            
            expect(storage.isAuthenticated()).toBe(true);
        });
        
        it('should return false when token expired', () => {
            storage.setTokens({
                accessToken: 'expired_token',
                refreshToken: 'refresh',
                expiresIn: -100,
                provider: 'microsoft'
            });
            
            expect(storage.isAuthenticated()).toBe(false);
        });
        
        it('should return false when no token', () => {
            expect(storage.isAuthenticated()).toBe(false);
        });
    });
    
    describe('needsRefresh', () => {
        it('should return true when token expires soon', () => {
            storage.setTokens({
                accessToken: 'token',
                refreshToken: 'refresh',
                expiresIn: 300, // 5 minutes
                provider: 'microsoft'
            });
            
            expect(storage.needsRefresh()).toBe(true);
        });
        
        it('should return false when token has time left', () => {
            storage.setTokens({
                accessToken: 'token',
                refreshToken: 'refresh',
                expiresIn: 3600, // 1 hour
                provider: 'microsoft'
            });
            
            expect(storage.needsRefresh()).toBe(false);
        });
    });
    
    describe('user profile', () => {
        it('should store and retrieve user profile', () => {
            const profile = {
                id: 'user123',
                name: 'Test User',
                email: 'test@example.com'
            };
            
            storage.setUserProfile(profile);
            const retrieved = storage.getUserProfile();
            
            expect(retrieved).toEqual(profile);
        });
        
        it('should return null if no profile stored', () => {
            expect(storage.getUserProfile()).toBeNull();
        });
    });
    
    describe('clear', () => {
        it('should clear all stored data', () => {
            storage.setTokens({
                accessToken: 'token',
                refreshToken: 'refresh',
                expiresIn: 3600,
                provider: 'microsoft'
            });
            storage.setUserProfile({ id: '123', name: 'Test' });
            
            storage.clear();
            
            expect(storage.getAccessToken()).toBeNull();
            expect(storage.getRefreshToken()).toBeNull();
            expect(storage.getProvider()).toBeNull();
            expect(storage.getUserProfile()).toBeNull();
            expect(storage.isAuthenticated()).toBe(false);
        });
    });
    
    describe('multi-tab sync', () => {
        it('should notify listeners on token change', (done) => {
            storage.onChange((type, data) => {
                expect(type).toBe('TOKEN_UPDATED');
                expect(data.provider).toBe('microsoft');
                done();
            });
            
            storage.setTokens({
                accessToken: 'token',
                refreshToken: 'refresh',
                expiresIn: 3600,
                provider: 'microsoft'
            });
        });
        
        it('should notify listeners on clear', (done) => {
            storage.onChange((type) => {
                expect(type).toBe('TOKEN_CLEARED');
                done();
            });
            
            storage.clear();
        });
        
        it('should allow unsubscribing from changes', () => {
            const callback = vi.fn();
            const unsubscribe = storage.onChange(callback);
            
            unsubscribe();
            storage.setTokens({
                accessToken: 'token',
                refreshToken: 'refresh',
                expiresIn: 3600,
                provider: 'microsoft'
            });
            
            expect(callback).not.toHaveBeenCalled();
        });
    });
});
