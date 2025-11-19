import { store } from './Store.js';

export class SlideManager {
    constructor() {
        this.init();
    }

    init() {
        // Listen for UI events if needed, or just expose methods
        // For now, we'll rely on store actions
    }

    addSlide() {
        store.dispatch('ADD_SLIDE');
    }

    deleteSlide(index) {
        // TODO: Implement delete action in store
    }

    duplicateSlide(index) {
        // TODO: Implement duplicate
    }
}
