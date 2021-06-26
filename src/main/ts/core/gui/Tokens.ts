import * as $ from 'jquery';
import * as md5 from 'md5';
import { config } from '../Config';
import { message as msg } from '../utilities/Message';
import { guiInitMistakeDialogs } from './Dialog';
import { parseEl } from '../process/HtmlParser';
import { ParsedHtml } from '../process/ParsedHtml';

export function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function guiCreateTokens(hash: string, tokens: string[], chunk: TextChunk) {
    // Checking if paragraph with given hash was altered during tokenization.
    try {
        const content = chunk.getElement();
        let tokenizationSuccess = false;
        const newHash = md5(chunk.getText());

        // If content was changed, do not insert tokens (& remove hash attribute)
        if ($(content).attr('data-pk-hash') !== newHash) {
            msg('Paragraph was altered during correction. Tokens insertion aborted. Hash "' + $(content).attr('data-pk-hash') + '" removed');
            $(content).removeAttr('data-pk-hash');

        // If content was not changed, insert tokens (& set success variable)
        } else {
            msg('Paragraph with hash "' + $(content).attr('data-pk-hash') + '" was not altered during correction. Inserting tokens.');

            // clean old tokens
            $(content).find(".pk-token").replaceWith(function() {
                return $( this ).contents();
            });

            const bookmark = config.selection.getBookmark();
            // Building tokens
            let parsedHtml: ParsedHtml = parseEl($(content));
            let tokenPos: {from: number, to: number}[] = [];
            let charCount = 0;
            for(let token of tokens) {
                tokenPos.push({
                    from: charCount,
                    to: charCount + token.length - 1
                });
                charCount += token.length;
            }
            tokens.forEach(function (token, index) {
                parsedHtml.wrapToken(tokenPos[index].from, tokenPos[index].to, token)
            });
            $(content).html(parsedHtml.getHtml());
            config.selection.moveToBookmark(bookmark);
            tokenizationSuccess = true;
        }

        // Debug messages
        if (tokenizationSuccess) {
            msg('Token insertion successful on hash "' + hash + '".');
        } else {
            msg('Token insertion did not happen on hash "' + hash + '".');
        }

        // Return
        return tokenizationSuccess;
    } catch(err) {
        throw new Error(err);
    }
}

/**
 * Highlights tokens with suggested corrections.
 *
 * @param {string} hash MD5 hash of the paragraph
 */
export function guiHighlightTokens(hash: string, chunk: TextChunk) {
    // Clear old highlights
    removeOldHighlights(hash);
    config.mistakes.autoremove();

    // Get mistakes from the manager
    const mistakes = config.mistakes.getMistakes(hash);

    // Highlight correct tokens
    msg('Building new highlights on paragraph "' + hash + '".');
    mistakes.forEach((mistake) => {
        const highlights = mistake.getTokens();

        highlights.forEach((tokenId) => {
            const token = config.textfield.find('p[data-pk-hash="' + hash + '"] .pk-token:eq(' + tokenId + ')');
            msg('Added error class on token "' + token[0].innerText + '" of hash "' + hash + '".');
            token[0].classList.add('pk-token-correction');
        });
    });

    guiInitMistakeDialogs(hash);
}

function removeOldHighlights(hash: string) {
    msg('Clearing old highlights on paragraph "' + hash + '".');
    config.textfield.find('p[data-pk-hash="' + hash + '"] .pk-token').removeClass('pk-token-correction');
    config.textfield.find('p[data-pk-hash="' + hash + '"] .pk-token').off('click');
}