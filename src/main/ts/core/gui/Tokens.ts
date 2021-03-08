import * as $ from 'jquery';
import * as md5 from 'md5';
import { config } from '../Config';
import { message as msg } from '../Message';
import { guiInitMistakeDialogs } from './Dialog';

export function guiCreateTokens(hash: string, tokens: string[]) {
    // Checking if paragraph with given hash was altered during tokenization.
    const paragraph = config.editor.dom.select('p[data-pk-hash="' + hash + '"]');
    let tokenizationSuccess = false;
    paragraph.forEach(function (p) {
        const newHash = md5($(p).text());

        // If content was changed, do not insert tokens (& remove hash attribute)
        if ($(p).attr('data-pk-hash') !== newHash) {
            msg('Paragraph was altered during correction. Tokens insertion aborted. Hash "' + $(p).attr('data-pk-hash') + '" removed');
            $(p).removeAttr('data-pk-hash');

        // If content was not changed, insert tokens (& set success variable)
        } else {
            msg('Paragraph with hash "' + $(p).attr('data-pk-hash') + '" was not altered during correction. Inserting tokens.');
            const bookmark = config.editor.selection.getBookmark(2, true);
                // Building tokens

            let originalHtml = $(p).html();
            console.log(originalHtml)
            let tokensHtml = '';
            tokens.forEach(function (token) {
                let pos = originalHtml.indexOf(token);
                let end = pos + token.length;
                let subHtml = originalHtml.substring(0, end);
                originalHtml = originalHtml.replace(subHtml, "");
                subHtml = subHtml.replace(token, '<span class="pk-token">' + token + '</span>')
                tokensHtml += subHtml;
            });
            $(p).html(tokensHtml);
            config.editor.selection.moveToBookmark(bookmark);
            tokenizationSuccess = true;
        }
    });

    // Debug messages
    if (tokenizationSuccess) {
        msg('Token insertion successful on hash "' + hash + '".');
    } else {
        msg('Token insertion did not happen on hash "' + hash + '".');
    }

    // Return
    return tokenizationSuccess;
}

/**
 * Highlights tokens with suggested corrections.
 *
 * @param {string} hash MD5 hash of the paragraph
 */
export function guiHighlightTokens(hash: string) {
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
            const token = config.editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token:eq(' + tokenId + ')');
            msg('Added error class on token "' + token[0].innerText + '" of hash "' + hash + '".');
            token[0].classList.add('pk-token-correction');
        });
    });

    guiInitMistakeDialogs(hash);
}

function removeOldHighlights(hash: string) {
    msg('Clearing old highlights on paragraph "' + hash + '".');
    $(config.editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token')).removeClass('pk-token-correction');
    $(config.editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token')).off('click');
}