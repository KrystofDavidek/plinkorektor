// IMPORTS

import { config } from '../Config';
import { message as msg } from '../utilities/Message';

// EXPORTS

/**
 * Displays indicator for processing.
 */
export function guiShowProcessingIndicator() {
    msg('Processing indicator displayed.');
    config.textfield.attr('data-pk-processing', 'true');
}

/**
 * Hides indicator for processing.
 */
export function guiHideProcessingIndicator() {
    config.textfield.removeAttr('data-pk-processing');
    msg('Processing indicator hidden.');
}
