/**
 * CloudFilePicker - Legacy alias for CloudFileBrowser
 * 
 * This module re-exports CloudFileBrowser as CloudFilePicker for backward compatibility.
 * New code should import CloudFileBrowser directly.
 * 
 * @deprecated Use CloudFileBrowser instead
 */

import { CloudFileBrowser } from './CloudFileBrowser.js';

// Re-export CloudFileBrowser as CloudFilePicker for backward compatibility
export { CloudFileBrowser as CloudFilePicker };

export default CloudFileBrowser;
