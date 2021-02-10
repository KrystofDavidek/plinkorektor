import { Correction } from '../correction/Correction';
import { Mistake } from '../correction/Mistake';
import { autocorrectRegexRules, highlightRegexRules } from '../correction/RegexRules';
import { config } from '../Config';
import { message as msg } from '../Message';
import * as _ from 'lodash';

export function processRegexAutocorrect(p) {
    autocorrectRegexRules.forEach((rule) => {
        if(rule.search.test(p.textContent)) {
            msg('APPLYING RULE ' + rule.name + ' ON ' + p.textContent);
        }
        p.textContent = p.textContent.replace(rule.search, rule.replace);
    });
}

export function processRegexHighlight(hash, p, tokens ) {
    let start = 0;
    let pos = 0;
    let tokenPositions = [];
    for (const token of tokens) {
        tokenPositions.push({token, pos, start, end: start + token.length - 1});
        start = start + token.length;
        pos++;
    }
    let match;
    highlightRegexRules.forEach((rule) => {
        const regex = _.cloneDeep(rule.search);
        while ((match = rule.search.exec(p.textContent)) !== null) {
            const highlights = getTokensToHighlight(match.index, match.index + match[0].length, tokenPositions);
            const mistake = new Mistake();
            mistake.setTokens(highlights.map((val) => val.pos));
            mistake.setDescription(rule.description);
            if (rule.about) {
                mistake.setAbout(rule.about);
            }
            let rules = {};
            highlights.forEach((token) => {
                rules[token.pos] = '';
            });
            rules[highlights[0].pos] = highlights.map((val) => val.token).join('').replace(regex, rule.replace);
            const correction = new Correction();
            correction.setDescription(rule.correctionLabel ? rule.correctionLabel : 'OPRAVIT');
            correction.setRules(rules);
            mistake.addCorrection(correction);

            config.mistakes.addMistake(hash, mistake);
        }
    });
}

export function getTokensToHighlight(from: number, to: number, tokenPositions: {start: number, end: number, pos: number, token: string}[]) {
    return tokenPositions.filter((value) => from <= value.end && to > value.start);
}