import * as $ from 'jquery';
import { config } from '../Config';

import { cssMistakeBadValue, cssMistakeDescription, cssMistakeNoCorrection } from '../../assets/style.css';
import { Mistake } from '../correction/Mistake';
import { process } from '../process/Process';

/**
 * Creates correction dialogs for highlighted tokens.
 *
 * @param {string} hash MD5 hash of the paragraph
 */
export function guiInitMistakeDialogs(hash) {
    // Removes original left-click triggers on tokens
    $(config.editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token')).off('click');

    // Binds tokens to corresponding correction dialogs
    config.editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token').forEach(function (token, i) {
        // Skip tokens with no correction bound
        if (!token.classList.contains('pk-token-correction')) { return; }  // <-- continue;

        // Create dialog itself
        const currentMistakes = [];
        let suggestionRulebook = {};

        config.mistakes.getMistakes(hash).forEach((mistake) => {
            if (!mistake.getTokens().includes(i)) { return; } // <-- continue;

            const helperText = defineHelperText(hash, mistake);
            const dialogOutput = buildSuggestionDialog(helperText, mistake);

            suggestionRulebook = {...suggestionRulebook, ...dialogOutput.partialRulebook};
            currentMistakes.push({
                type: 'panel',
                direction: 'column',
                align: 'stretch',
                items: dialogOutput.suggestions,
            });
        });

        $(token).click(function (e) {
            e.preventDefault();
            config.editor.windowManager.open({
                title: 'Návrh na opravu',
                body: {
                  type: 'panel',
                  items: currentMistakes
                },
                buttons: [],
                onAction(instance, trigger) {
                  if (trigger.name.startsWith('correction')) {
                    // Get mistake and correction information from the triger name.
                    const parts = trigger.name.split('-');

                    // Apply correction.
                    Object.entries(suggestionRulebook[parts[2]]).forEach(function ([target, correctValue]) {
                        config.editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token:eq(' + target + ')')[0].textContent = correctValue;
                    });

                    // Remove mistake record to hide it afterwards.
                    config.mistakes.removeMistake(hash, parts[1]);
                    process();

                    config.editor.windowManager.close();
                  }
                }
            });

        });

    });
}

function defineHelperText(hash: string, mistake: Mistake) {
    // Get minimal and maximal highlighted token
    const minimalToken = Math.min.apply(null, mistake.getTokens());
    const maximalToken = Math.max.apply(null, mistake.getTokens());

    // Define boundaries
    const minimalBoundary = Math.max(minimalToken - 20, 0);
    const maximalBoundary = Math.min(maximalToken + 21, config.editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token').length);

    // Display highlighted tokens and suitable context
    let helperText = '';
    for (let j = minimalBoundary; j < maximalBoundary; j++) {
        if (mistake.getTokens().includes(j)) {
            helperText += '<span style="' + cssMistakeBadValue + '">';
        }
        helperText += config.editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token:eq(' + j + ')')[0].textContent;
        if (mistake.getTokens().includes(j)) { helperText += '</span>'; }
    }

    // Add ellipsis (…) if context is not matching start or end of the paragraph
    if (minimalBoundary > 0) {
        helperText = '…' + helperText.trim();
    }
    if (maximalBoundary < config.editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token').length) {
        helperText = helperText.trim() + '…';
    }

    return helperText;
}

function buildSuggestionDialog(helperText: string, mistake: Mistake) {
    const partialRulebook = {};

    // Display mistake context
    const suggestions: any[] = [{
        type: 'htmlpanel',
        html: '<p style="text-align: center">' + helperText + '</p><p style="' + cssMistakeDescription + '">' + mistake.getDescription() + '</p>'
    }];

    // Display suggested corrections
    const mistakes = mistake.getCorrections();
    if (!mistakes.length) {
        suggestions.push(
            {
                type: 'htmlpanel',
                html: '<p style="' + cssMistakeNoCorrection + '">Žádné návrhy</p>'
            }
        );
    }
    mistakes.forEach((correction) => {
        partialRulebook[correction.getId()] = correction.getRules();
        suggestions.push(
            {
                type: 'button',
                name: 'correction-' + mistake.getId() + '-' + correction.getId(),
                text: correction.getDescription(),
                borderless: true,
            }
        );
    });
    if (mistake.getAbout().length) {
        suggestions.push(
            {
                type: 'htmlpanel',
                html: '<h4">Další informace</h4>'
            }
        );
        mistake.getAbout().forEach((item) => {
            suggestions.push(
                {
                    type: 'htmlpanel',
                    html: '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer">' + item.label + '</h4>'
                }
            );
        });
    }
    return {suggestions, partialRulebook};
}