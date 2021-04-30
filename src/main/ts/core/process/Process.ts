import * as md5 from 'md5';

import { message as msg } from '../Message';

import { config } from '../Config';
import { processApiCall } from './ApiCall';
import { guiHighlightTokens } from '../gui/Tokens';
import { processRegexAutocorrect } from './RegexProcess';
import { guiShowProcessingIndicator } from '../gui/ProcessingIndicator';

/**
 * Goes through every paragraph and if it changed it sends it to the corrector API and call addCorrections with API output
 */
export function process() {
  const content = config.editor.dom.select('p');
  // Looping through paragraphs
  content.forEach(function (p) {
    if(p.getAttribute('data-pk-init')) {
      p.removeAttribute('data-pk-hash');
      p.removeAttribute('data-pk-changed');
      p.removeAttribute('data-pk-processing');
      p.removeAttribute('data-pk-init');
    }
    if (p.getAttribute('data-pk-processing')) {
        msg('Already processing. Processing skipped.');
        return;
    }
    // Skipping empty paragraphs
    if (p.textContent.trim().length === 0) {
        msg('Empty paragraph. Processing skipped.');
        p.removeAttribute('data-pk-hash');
        p.removeAttribute('data-pk-changed');
        p.removeAttribute('data-pk-processing');
        return;
    }
    // Hashing for easier detection of changes and pointing in subsequent processes
    const hash = md5(p.textContent);

    // Changes are not over, skipping paragraph
    if (p.getAttribute('data-pk-hash') !== hash) {
        // Copying current highlights before paragraph hash is altered.
        config.mistakes.copyMistakes(p.getAttribute('data-pk-hash'), hash);
        // Updating hash.
        p.setAttribute('data-pk-hash', hash);
        p.setAttribute('data-pk-changed', true);
        msg('Paragraph with changed hash "' + hash + '" si still changing. Processing skipped.');
        return;
    }

    // Skipping unchanged paragraph
    if (p.getAttribute('data-pk-hash') === hash && !p.getAttribute('data-pk-changed')) {
        p.removeAttribute('data-pk-changed');
        msg('Paragraph with unchanged hash "' + hash + ' wasn\'t changed last time". Processing skipped.');
        return;
    }
    p.removeAttribute('data-pk-changed');
    guiShowProcessingIndicator();
    p.setAttribute('data-pk-processing', true);

    // Applying original highlights until the new api-call resolves itself.
    guiHighlightTokens(hash);
    // Call local regex corrections
    //processRegexAutocorrect(p);
    // Caling processing
    processApiCall(hash, p);
  });
}