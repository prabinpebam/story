/**
 * File UI Module
 * 
 * Components for file storage UI including cloud integration,
 * file indicator pill, and related modals.
 */

// Core components
export { ProviderIcon } from './ProviderIcon.js';
export { FileIndicatorPill } from './FileIndicatorPill.js';
export { FileIndicatorMenu } from './FileIndicatorMenu.js';

// Modals
export { SignInPrompt } from './SignInPrompt.js';
export { CloudFilePicker } from './CloudFilePicker.js';
export { SaveToCloudModal } from './SaveToCloudModal.js';
export { AccessSettingsModal } from './AccessSettingsModal.js';

// Re-export defaults for convenience
import { ProviderIcon } from './ProviderIcon.js';
import { FileIndicatorPill } from './FileIndicatorPill.js';
import { FileIndicatorMenu } from './FileIndicatorMenu.js';
import { SignInPrompt } from './SignInPrompt.js';
import { CloudFilePicker } from './CloudFilePicker.js';
import { SaveToCloudModal } from './SaveToCloudModal.js';
import { AccessSettingsModal } from './AccessSettingsModal.js';

export default {
    ProviderIcon,
    FileIndicatorPill,
    FileIndicatorMenu,
    SignInPrompt,
    CloudFilePicker,
    SaveToCloudModal,
    AccessSettingsModal
};
