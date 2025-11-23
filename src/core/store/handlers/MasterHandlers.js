
import { historyManager } from '../../HistoryManager.js';

export function handleUpdateMaster(store, payload) {
    const masters = store.state.masters;
    const masterToUpdate = masters[payload.id];

    if (masterToUpdate) {
        Object.assign(masterToUpdate, payload);
        store.emit('state-changed', store.state);
    }
}

export function handleUpdateThemeSettings(store, payload, options = {}) {
    const { fromHistory } = options;
    const { id, settings } = payload;
    const themeMaster = store.state.masters[id];
    
    if (themeMaster && themeMaster.type === 'theme') {
        if (!themeMaster.themeSettings) {
            themeMaster.themeSettings = { colors: {}, fonts: {} };
        }

        if (!fromHistory) {
            const undoSettings = { colors: {}, fonts: {} };
            
            if (settings.colors) {
                Object.keys(settings.colors).forEach(k => {
                    undoSettings.colors[k] = themeMaster.themeSettings.colors[k];
                });
            }
            if (settings.fonts) {
                Object.keys(settings.fonts).forEach(k => {
                    undoSettings.fonts[k] = themeMaster.themeSettings.fonts[k];
                });
            }

            historyManager.push({
                undo: { type: 'UPDATE_THEME_SETTINGS', payload: { id, settings: undoSettings } },
                redo: { type: 'UPDATE_THEME_SETTINGS', payload: payload }
            });
        }

        if (settings.colors) {
            themeMaster.themeSettings.colors = {
                ...themeMaster.themeSettings.colors,
                ...settings.colors
            };
        }
        
        if (settings.fonts) {
            themeMaster.themeSettings.fonts = {
                ...themeMaster.themeSettings.fonts,
                ...settings.fonts
            };
        }
        
        store.emit('state-changed', store.state);
    }
}
