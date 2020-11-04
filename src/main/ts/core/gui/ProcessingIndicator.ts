// IMPORTS

import { config } from '../Config';
import { message as msg } from '../Message';

// EXPORTS

/**
 * Displays indicator for processing.
 */
export function guiShowProcessingIndicator() {
    msg('Processing indicator displayed.');
    config.editor.dom.select('html')[0].setAttribute('data-pk-processing', 'true');
}

/**
 * Hides indicator for processing.
 */
export function guiHideProcessingIndicator() {
    config.editor.dom.select('html')[0].removeAttribute('data-pk-processing');
    msg('Processing indicator hidden.');
}
