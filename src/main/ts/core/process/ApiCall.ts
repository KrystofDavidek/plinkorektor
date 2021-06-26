import * as $ from 'jquery';
import { config } from '../Config';
import { message as msg } from '../utilities/Message';
import { MessageImportance as MI } from '../../types/MessageImportance';

import { guiCreateTokens, guiHighlightTokens } from '../gui/Tokens';
import { Mistake } from '../correction/Mistake';
import { Correction } from '../correction/Correction';
import { processRegexHighlight } from './RegexProcess';

const API_PATH = 'https://nlp.fi.muni.cz/projekty/corrector/api/api.cgi';

const ajaxCalls = [];

export function processApiCall(hash: string, chunk: TextChunk, retry = 0) {
    // Calling the corrector API
    const call = $.ajax({
        type: 'POST',
        dataType: 'json',
        url: API_PATH,
        data: {
            text: chunk.getText(),//
        },
    });

    // Archive call (for processing status indication) and show the processing indicator.
    ajaxCalls.push(call);

    return call.done((data) => {
        try {
            // Report invalid AJAX input status.
            if (!data.ok) {
                msg('Something went wrong on the API server.', MI.DANGER);
                return;
            }
            // Create tokens and add mistakes if tokenization was successful.
            if (guiCreateTokens(hash, data.tokens, chunk)) {
                config.mistakes.removeMistakes(hash);
                processRegexHighlight(hash, chunk, data.tokens);
                data.mistakes.forEach((m) => {
                    const mistake = new Mistake();
                    mistake.setTokens(m.highlights);
                    mistake.setDescription(m.description);
                    if (m.about) {
                        mistake.setAbout(m.about);
                    }
                    m.corrections.forEach((c) => {
                        const correction = new Correction();
                        correction.setDescription(c.description);
                        correction.setRules(c.rules);
                        mistake.addCorrection(correction);
                    });

                    config.mistakes.addMistake(hash, mistake);
                });

                guiHighlightTokens(hash, chunk);
            }
            chunk.setProcessing(false);
            
        } catch(e) {
            chunk.setFailed(true);
        }
    }).fail((err) => {
        console.log(err);
        if(retry < 3) {
            msg('AJAX request failed' + (retry > 0 ? ' again' : '') + '. Trying again.', MI.DANGER);
            processApiCall(hash, chunk, retry + 1);
        }   else {
            msg('AJAX request failed three times. Paragraph skipped.', MI.DANGER);
            chunk.setFailed(true);
        }

    }).always(() => {
        // Hide processing indicator if there is no other AJAX call present.
        const index = ajaxCalls.indexOf(call);
        if (index > -1) {
            ajaxCalls.splice(index, 1);
        }
        return ajaxCalls.length;
    });
}