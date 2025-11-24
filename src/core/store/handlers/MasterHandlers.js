

export function handleUpdateMaster(draft, payload) {
    const masters = draft.masters;
    const masterToUpdate = masters[payload.id];

    if (masterToUpdate) {
        Object.assign(masterToUpdate, payload);
    }
}

export function handleUpdateThemeSettings(draft, payload) {
    const { id, settings } = payload;
    const themeMaster = draft.masters[id];
    
    if (themeMaster && themeMaster.type === 'theme') {
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {} };
        }

        if (settings.colors) {
            Object.assign(themeMaster.themeSettings.colors, settings.colors);
        }
        
        if (settings.fonts) {
            Object.assign(themeMaster.themeSettings.fonts, settings.fonts);
        }
    }
}

