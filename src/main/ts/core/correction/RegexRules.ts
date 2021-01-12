import { RegexRule } from '../../types/RegexRule';

export const testClass: string = '[]';

export let autocorrectRegexRules: RegexRule[] = [];
export let highlightRegexRules: RegexRule[] = [{
    name: 'oprava čárek místo uvozovek',
    search: new RegExp(',,([a-zA-Z0-9])', 'g'),
    replace: '\u201E$1'
},
{
    name: 'násobné mezery',
    search: new RegExp('[ |\u00A0]{2,}', 'g'),
    replace: ' '
}];
