import * as md5 from 'md5';

import { message as msg } from '../Message';

import { config } from '../Config';
import { processApiCall } from './ApiCall';
import { guiHighlightTokens } from '../gui/Tokens';

/**
 * Goes through every paragraph and if it changed it sends it to the corrector API and call addCorrections with API output
 */
export function process() {
  const content = config.editor.dom.select('p');
  // Looping through paragraphs
  content.forEach(function (p) {
      // Skipping empty paragraphs
      if (p.textContent.length === 0) {
          msg('Empty paragraph. Processing skipped.');
          p.removeAttribute('data-pk-hash');
          return;
      }

      // Hashing for easier detection of changes and pointing in subsequent processes
      const hash = md5(p.textContent);
      // Skipping unchanged paragraphs
      if (p.getAttribute('data-pk-hash') === hash) {
          msg('Paragraph with unchanged hash "' + hash + '". Processing skipped.');
          return;
      }

      // Copying current highlights before paragraph hash is altered.
      config.mistakes.copyMistakes(p.getAttribute('data-pk-hash'), hash);

      // Updating hash.
      p.setAttribute('data-pk-hash', hash);

      // Applying original highlights until the new api-call resolves itself.
      guiHighlightTokens(hash);

      // Caling processing
      processApiCall(hash, p.textContent);
  });
}