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

            let originalHtml: string = $(p).html();
            let tokensHtml = '';
            tokens.forEach(function (token) {
                let regex: RegExp = new RegExp("(<[^(><.)]+>)*"+token.split("").join("(<[^(><.)]+>)*")+"(<[^(><.)]+>)*");
                let tokenReg = originalHtml.match(regex);
                let end = tokenReg.index + tokenReg[0].length;
                let subHtml = originalHtml.substring(0, end);
                let tokenWithHtml = tokenReg[0];
                let unclosed = [];
                let unopened = [];
                let tags = tokenWithHtml.match(/(<[^(><.)]+>)/g);
                if(tags) {
                    for(let tag of tags) {
                        if(tag[1] == "/") {
                            let lastOpen: string = unclosed.pop();
                            let start = tag.replace("/", "").replace(">", "");
                            if(!lastOpen || !lastOpen.startsWith(start)) {
                                unopened.push(tag);
                            }
                        }   else {
                            unclosed.push(tag);
                        }
                    }
                }
                let closeTags = unclosed.map((tag: string) => {
                    let tagType = tag.match(/<([^(</>)]+)>/);
                    return "</"+tagType[1]+">";
                })
                let openTags = [];
                if(unopened.length) {
                    let previousTags = (tokensHtml + originalHtml.substring(0, tokenReg.index)).match(/(<[^(><.)]+>)/g);
                    let index = 0;
                    let skip = 0;
                    for(let prevTag of previousTags.reverse()) {
                        console.log(prevTag, index, unopened, skip)
                        if(index >= unopened.length) {
                            break;
                        }
                        if(prevTag[1] == "/") {
                            skip++;
                        }   else {
                            if(skip > 0) {
                                skip--;
                            }   else {
                                let start = unopened[index].replace("/", "").replace(">", "");
                                if(prevTag.startsWith(start)) {
                                    openTags.push(prevTag);
                                }
                            }
                        }
                    }
                }
                originalHtml = originalHtml.replace(subHtml, "");
                subHtml = subHtml.replace(tokenWithHtml, unopened.join("")+'<span class="pk-token">' + openTags.reverse().join("") + tokenWithHtml + closeTags.reverse().join("") + '</span>' + unclosed.join(""));
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