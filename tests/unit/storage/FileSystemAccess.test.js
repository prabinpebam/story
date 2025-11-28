/**
 * FileSystemAccess Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileSystemAccess } from '../../../src/core/storage/filesystem/FileSystemAccess.js';

// Mock URL.createObjectURL and revokeObjectURL
vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:test-url'),
    revokeObjectURL: vi.fn()
});

describe('FileSystemAccess', () => {
    let fs;

    beforeEach(() => {
        fs = new FileSystemAccess();
        vi.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create instance', () => {
            expect(fs).toBeInstanceOf(FileSystemAccess);
        });

        it('should start with no current handle', () => {
            expect(fs.currentHandle).toBeNull();
        });

        it('should detect support status', () => {
            expect(typeof fs.isSupported).toBe('boolean');
        });
    });

    describe('hasCurrentFile', () => {
        it('should return false when no file is open', () => {
            expect(fs.hasCurrentFile).toBe(false);
        });
    });

    describe('clearCurrentFile', () => {
        it('should clear the current handle', () => {
            fs._currentHandle = { name: 'test.str' };
            fs.clearCurrentFile();
            expect(fs.currentHandle).toBeNull();
        });
    });

    describe('getCurrentFileName', () => {
        it('should return null when no file is open', () => {
            expect(fs.getCurrentFileName()).toBeNull();
        });

        it('should return file name when file is open', () => {
            fs._currentHandle = { name: 'presentation.str' };
            expect(fs.getCurrentFileName()).toBe('presentation.str');
        });
    });

    describe('_getFileTypeFilter', () => {
        it('should return correct file type filter', () => {
            const filter = fs._getFileTypeFilter();
            
            expect(filter.description).toBe('Story Presentation');
            expect(filter.accept).toBeDefined();
        });
    });

    describe('downloadFile', () => {
        it('should create download link with correct attributes', () => {
            const mockBlob = new Blob(['test'], { type: 'application/zip' });
            
            // Mock DOM methods
            const mockLink = {
                href: '',
                download: '',
                click: vi.fn()
            };
            const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
            const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
            const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

            fs.downloadFile(mockBlob, 'test');

            expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
            expect(mockLink.href).toBe('blob:test-url');
            expect(mockLink.download).toBe('test.str');
            expect(mockLink.click).toHaveBeenCalled();

            // Cleanup
            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
            removeChildSpy.mockRestore();
        });

        it('should not add extension if already present', () => {
            const mockBlob = new Blob(['test']);
            const mockLink = {
                href: '',
                download: '',
                click: vi.fn()
            };
            vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
            vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
            vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

            fs.downloadFile(mockBlob, 'existing.str');

            expect(mockLink.download).toBe('existing.str');
        });
    });

    describe('showOpenPicker (fallback mode)', () => {
        beforeEach(() => {
            // Simulate no File System Access API support
            fs._supportsFileSystemAccess = false;
        });

        it('should use file input fallback', async () => {
            const mockFile = new File(['test'], 'test.str');
            const mockInput = {
                type: '',
                accept: '',
                onchange: null,
                click: vi.fn()
            };

            vi.spyOn(document, 'createElement').mockReturnValue(mockInput);

            const promise = fs.showOpenPicker();
            
            // Simulate file selection
            mockInput.onchange({ target: { files: [mockFile] } });

            const result = await promise;
            expect(result.file).toBe(mockFile);
            expect(result.handle).toBeNull();
        });
    });

    describe('showSavePicker (fallback mode)', () => {
        beforeEach(() => {
            fs._supportsFileSystemAccess = false;
        });

        it('should return null in fallback mode', async () => {
            const result = await fs.showSavePicker('test');
            expect(result).toBeNull();
        });
    });

    describe('writeFile', () => {
        it('should throw error without handle', async () => {
            await expect(fs.writeFile(null, new Blob(['test']))).rejects.toThrow('No file handle');
        });
    });

    describe('readFile', () => {
        it('should throw error without handle', async () => {
            await expect(fs.readFile(null)).rejects.toThrow('No file handle');
        });
    });

    describe('saveToCurrentFile', () => {
        it('should return false when no current file', async () => {
            const result = await fs.saveToCurrentFile(new Blob(['test']));
            expect(result).toBe(false);
        });
    });

    describe('getFileInfo', () => {
        it('should return file metadata', async () => {
            const mockFile = new File(['content'], 'test.str', { type: 'application/zip' });
            const mockHandle = {
                getFile: vi.fn().mockResolvedValue(mockFile)
            };

            const info = await fs.getFileInfo(mockHandle);

            expect(info.name).toBe('test.str');
            expect(info.size).toBe(7);
            expect(info.type).toBe('application/zip');
            expect(info.lastModified).toBeInstanceOf(Date);
        });
    });
});
