import * as $ from 'jquery';
import { config } from '../Config';
import { message as msg } from '../Message';
import { MessageImportance as MI } from '../../types/MessageImportance';
import { guiHideProcessingIndicator } from '../gui/ProcessingIndicator';

import { guiCreateTokens, guiHighlightTokens } from '../gui/Tokens';
import { Mistake } from '../correction/Mistake';
import { Correction } from '../correction/Correction';
import { processRegexHighlight } from './RegexProcess';

const API_PATH = 'https://nlp.fi.muni.cz/projekty/corrector/api/api.cgi';

const ajaxCalls = [];

export function processApiCall(hash: string, p) {
    // Calling the corrector API
    const call = $.ajax({
        type: 'POST',
        dataType: 'json',
        url: API_PATH,
        data: {
            text: p.textContent
        },
    });

    // Archive call (for processing status indication) and show the processing indicator.
    ajaxCalls.push(call);

    call.done((data) => {
        // Report invalid AJAX input status.
        if (!data.ok) {
            msg('Something went wrong on the API server.', MI.DANGER);
            return;
        }
        // Create tokens and add mistakes if tokenization was successful.
        if (guiCreateTokens(hash, data.tokens)) {
            config.mistakes.removeMistakes(hash);
            processRegexHighlight(hash, p, data.tokens);
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

            guiHighlightTokens(hash);
        }
        p.removeAttribute('data-pk-processing');
    }).fail(() => {
        msg('AJAX request failed.', MI.DANGER);
    }).always(() => {
        // Hide processing indicator if there is no other AJAX call present.
        const index = ajaxCalls.indexOf(call);
        if (index > -1) {
            ajaxCalls.splice(index, 1);
        }

        if (ajaxCalls.length === 0) {
            guiHideProcessingIndicator();
        }
    });
}