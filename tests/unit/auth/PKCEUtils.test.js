/**
 * PKCE Utils Unit Tests
 * 
 * Tests PKCE code verifier, challenge generation, and state management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    generateCodeVerifier,
    generateCodeChallenge,
    generateState,
    storePKCEParams,
    getPKCEParams,
    clearPKCEParams,
    validateState
} from '../../../src/core/auth/utils/PKCEUtils.js';

describe('PKCEUtils', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });
    
    afterEach(() => {
        sessionStorage.clear();
    });
    
    describe('generateCodeVerifier', () => {
        it('should generate a valid code verifier', () => {
            const verifier = generateCodeVerifier();
            
            // RFC 7636: code_verifier = 43-128 characters
            expect(verifier.length).toBeGreaterThanOrEqual(43);
            expect(verifier.length).toBeLessThanOrEqual(128);
            
            // Should be Base64URL (no +, /, or =)
            expect(verifier).not.toMatch(/[+/=]/);
        });
        
        it('should generate unique verifiers', () => {
            const verifier1 = generateCodeVerifier();
            const verifier2 = generateCodeVerifier();
            
            expect(verifier1).not.toBe(verifier2);
        });
    });
    
    describe('generateCodeChallenge', () => {
        it('should generate a valid code challenge', async () => {
            const verifier = generateCodeVerifier();
            const challenge = await generateCodeChallenge(verifier);
            
            expect(challenge).toBeTruthy();
            expect(typeof challenge).toBe('string');
            expect(challenge).not.toMatch(/[+/=]/); // Base64URL format
        });
        
        it('should generate same challenge for same verifier', async () => {
            const verifier = 'test_verifier_123456789012345678901234567890';
            const challenge1 = await generateCodeChallenge(verifier);
            const challenge2 = await generateCodeChallenge(verifier);
            
            expect(challenge1).toBe(challenge2);
        });
        
        it('should generate different challenges for different verifiers', async () => {
            const verifier1 = generateCodeVerifier();
            const verifier2 = generateCodeVerifier();
            
            const challenge1 = await generateCodeChallenge(verifier1);
            const challenge2 = await generateCodeChallenge(verifier2);
            
            expect(challenge1).not.toBe(challenge2);
        });
    });
    
    describe('generateState', () => {
        it('should generate a valid state parameter', () => {
            const state = generateState();
            
            expect(state).toBeTruthy();
            expect(typeof state).toBe('string');
            expect(state.length).toBeGreaterThan(10);
        });
        
        it('should generate unique states', () => {
            const state1 = generateState();
            const state2 = generateState();
            
            expect(state1).not.toBe(state2);
        });
    });
    
    describe('storePKCEParams', () => {
        it('should store PKCE parameters in sessionStorage', () => {
            const params = {
                codeVerifier: 'test_verifier',
                state: 'test_state',
                provider: 'microsoft'
            };
            
            storePKCEParams(params);
            
            expect(sessionStorage.getItem('pkce_code_verifier')).toBe('test_verifier');
            expect(sessionStorage.getItem('pkce_state')).toBe('test_state');
            expect(sessionStorage.getItem('pkce_provider')).toBe('microsoft');
        });
    });
    
    describe('getPKCEParams', () => {
        it('should retrieve stored PKCE parameters', () => {
            const params = {
                codeVerifier: 'test_verifier',
                state: 'test_state',
                provider: 'google'
            };
            
            storePKCEParams(params);
            const retrieved = getPKCEParams();
            
            expect(retrieved).toEqual(params);
        });
        
        it('should return null if parameters not found', () => {
            expect(getPKCEParams()).toBeNull();
        });
        
        it('should return null if any parameter is missing', () => {
            sessionStorage.setItem('pkce_code_verifier', 'test');
            sessionStorage.setItem('pkce_state', 'test');
            // Missing provider
            
            expect(getPKCEParams()).toBeNull();
        });
    });
    
    describe('clearPKCEParams', () => {
        it('should clear all PKCE parameters', () => {
            storePKCEParams({
                codeVerifier: 'test',
                state: 'test',
                provider: 'microsoft'
            });
            
            clearPKCEParams();
            
            expect(getPKCEParams()).toBeNull();
            expect(sessionStorage.getItem('pkce_code_verifier')).toBeNull();
            expect(sessionStorage.getItem('pkce_state')).toBeNull();
            expect(sessionStorage.getItem('pkce_provider')).toBeNull();
        });
    });
    
    describe('validateState', () => {
        it('should return true for matching states', () => {
            const state = 'test_state_123';
            expect(validateState(state, state)).toBe(true);
        });
        
        it('should return false for non-matching states', () => {
            expect(validateState('state1', 'state2')).toBe(false);
        });
        
        it('should be case-sensitive', () => {
            expect(validateState('State', 'state')).toBe(false);
        });
    });
});
