import { describe, it, expect } from 'vitest';
import {
    getMasterPresetDefinitionById,
    getMasterPresetDefinitionList,
    materializeMasterPresetDefinition
} from '../../../../src/core/masterPresets/MasterPresetLibrary.js';

describe('MasterPresetLibrary', () => {
    it('exposes a list of preset definitions', () => {
        const list = getMasterPresetDefinitionList();
        expect(Array.isArray(list)).toBe(true);
        expect(list.length).toBe(6);
        expect(list[0]).toHaveProperty('id');
        expect(list[0]).toHaveProperty('name');
    });

    it('can look up a preset definition by id', () => {
        const def = getMasterPresetDefinitionById('master-preset-minimal');
        expect(def).not.toBeNull();
        expect(def.name).toBe('Minimal');
        expect(def.colorThemeId).toBeTruthy();
        expect(def.typographyStyleId).toBeTruthy();
    });

    it('materializes canonical master + layouts with references only', () => {
        const { master, layouts } = materializeMasterPresetDefinition('master-preset-minimal', {
            masterId: 'master-test',
            masterName: 'Test Master'
        });

        expect(master).toMatchObject({
            id: 'master-test',
            type: 'slideMasterPreset',
            name: 'Test Master',
            colorThemeId: 'preset_neutral',
            typographyStyleId: 'typo-style-minimal'
        });

        // Must not embed legacy themeSettings
        expect(master.themeSettings).toBeUndefined();

        // Master background must be theme-slot linked
        expect(master.background).toBeTruthy();
        expect(master.background.type).toBe('solid');
        expect(master.background.themeSlot).toBe(11);

        expect(Array.isArray(master.layoutIds)).toBe(true);
        expect(master.layoutIds.length).toBeGreaterThan(0);

        expect(layouts).toBeTruthy();
        expect(Object.keys(layouts).length).toBe(master.layoutIds.length);

        for (const layoutId of master.layoutIds) {
            const layout = layouts[layoutId];
            expect(layout).toBeTruthy();
            expect(layout.type).toBe('layoutMaster');
            expect(layout.parentMasterId).toBe('master-test');
            expect(layout.layoutKey).toBeTruthy();
            expect(layout.themeSettings).toBeUndefined();

            // Placeholders should carry a stable placeholderKey for future reconciliation
            for (const element of Object.values(layout.elements || {})) {
                if (element?.isPlaceholder) {
                    expect(element.placeholderKey).toBeTruthy();

                    // Typography must be linked via shared textStyleId
                    expect(element.textStyleId).toBeTruthy();

                    // Must not hardcode typography in element.style
                    const style = element.style || {};
                    expect(style.fontFamily).toBeUndefined();
                    expect(style.fontSize).toBeUndefined();
                    expect(style.fontWeight).toBeUndefined();
                    expect(style.lineHeight).toBeUndefined();
                    expect(style.letterSpacing).toBeUndefined();

                    // If element has an explicit textFill, it must be theme-linked
                    if (element.textFill) {
                        expect(element.textFill.themeSlot).not.toBeUndefined();
                    }
                }
            }
        }
    });

    it('throws on unknown presetId', () => {
        expect(() => materializeMasterPresetDefinition('nope', { masterId: 'm1' })).toThrow();
    });

    it('throws when masterId is missing', () => {
        expect(() => materializeMasterPresetDefinition('master-preset-minimal')).toThrow();
    });
});
