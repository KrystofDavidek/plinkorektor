import { Correction } from '../correction/Correction';
import { Mistake } from '../correction/Mistake';
import { autocorrectRegexRules, highlightRegexRules } from '../correction/RegexRules';
import { config } from '../Config';

export function processRegexAutocorrect(p) {
    autocorrectRegexRules.forEach(rule => {
        console.log('RUNNING RULE ' + rule.name, p.textContent )
        p.textContent = p.textContent.replace(rule.search, rule.replace);
        console.log(p.textContent)
    });
}

export function processRegexHighlight(hash, p, tokens ) {
    let start = 0;
    let pos = 0;
    let tokenPositions = [];
    for(const token of tokens) {
        tokenPositions.push({token, pos, start, end: start + token.length - 1});
        start = start + token.length;
        pos++;
    };
    let match;
    highlightRegexRules.forEach(rule => {
        while ((match = rule.search.exec(p.textContent)) !== null) {
            const highlights = getTokensToHighlight(match.index, match.index + match[0].length, tokenPositions);
            const mistake = new Mistake();
            mistake.setTokens(highlights);
            mistake.setDescription(rule.name);
            if (rule.about) {
                mistake.setAbout(rule.about);
            }
            
            const correction = new Correction();
            correction.setDescription(rule.correctionLabel ? rule.correctionLabel : "OPRAVIT");
            correction.setRules({});
            mistake.addCorrection(correction);

            config.mistakes.addMistake(hash, mistake);
        }
    })
}

export function getTokensToHighlight(from: number, to: number, tokenPositions: {start:number,end:number,pos:number, token:string}[]) {
    return tokenPositions.filter((value) => from <= value.end && to > value.start).map((value) => value.pos);
}