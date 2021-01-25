import { RegexRule } from '../../types/RegexRule';

export const cislice: string = '[0123456789]';
export const mezery: string = '[\u{0020}\u{00A0}\u{1680}\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}\u{202F}\u{205F}\u{3000}]';
export const pismena: string = '[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]';
export const alnum: string = '[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9]';
export const malapismena: string = '[a-záčďéěíňóřšťúůýž]';
export const interpunkce: string = '[\\.,;:!\\?\u{2013}\u{2014}\u{2026}\u{0028}\u{0029}\u{005B}\u{005D}\u{007B}\u{007D}\00AB\u{00BB}\u{201E}\u{201C}\u{201A}\u{2018}]';
export const interpunkcezaviraci: string = '[\u{0029}\u{005D}\u{007D}\u{00BB}\u{2018}\u{201C}]';
export const interpunkceotviraci: string = '[\u{0028}\u{005B}\u{007B}\u{00AB}\u{201A}\u{201E}]';
export const apostrof: string = '[\u{02BC}\u{0027}\u{0060}\u{2018}\u{2019}\u{00B4}]';
export const uvozovky: string = '[\u{0022}\u{0027}\u{0060}\u{2018}\u{2019}\u{201C}\u{201D}\u{00AB}\u{00B4}\u{2039}]';


export let autocorrectRegexRules: RegexRule[] = [
    {
        name: 'násobné mezery',
        search: new RegExp(mezery+'+' , 'g'),
        replace: '\u{0020}'
    },
    {
        name: 'nezlomitelné mezery po jednopísmenných předložkách',
        search: new RegExp('^('+pismena+')\u{0020}' , 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nezlomitelné mezery po iniciálách a jednopísmenných zkratkách s tečkou',
        search: new RegExp('^('+pismena+'\\.)\u{0020}?='+alnum , 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nezlomitelné mezery po řadových číslovkých vyjádřených číslicí',
        search: new RegExp('('+cislice+'{1,2}\\.)\u{0020}?='+malapismena , 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nadbytečná mezera před tečkou',
        search: new RegExp('\u{0020}\\.' , 'g'),
        replace: '.'
    },
    {
        name: 'chybějící mezera po tečce',
        search: new RegExp('(['+interpunkcezaviraci+alnum+']\\.)?='+alnum , 'g'),
        replace: '$1\u{0020}'
    },
    {
        name: 'nadbytečná tečka',
        search: new RegExp('('+alnum+')\\.\\.\u{0020}' , 'g'),
        replace: '$1.\u{0020}'
    },
    {
        name: 'chybějící úzká mezera mezi řády čísel (a oprava chybné tečky)',
        search: new RegExp('('+cislice+'{1,3})\u{0020}|\\.?='+cislice+'{3}[^'+cislice+']' , 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nadbytečná mezera před čárkou',
        search: new RegExp('\u{0020},' , 'g'),
        replace: ','
    },
    {
        name: 'chybějící mezera po čárce',
        search: new RegExp('('+pismena+'),?='+pismena , 'g'),
        replace: '$1,\u{2020}'
    },
    {
        name: 'chybějící mezera po středníku a/nebo nadbytečná před ním',
        search: new RegExp('('+alnum+')\u{0020}?;\u{0020}?('+alnum+')' , 'g'),
        replace: '$1; $2'
    },
    {
        name: 'nadbytečná mezera před otazníkem',
        search: new RegExp('\u{0020}\\?(\u{0020}|('+interpunkcezaviraci+'))' , 'g'),
        replace: '?$1'
    },
    {
        name: 'dva a více otazníků',
        search: new RegExp('\\?\\?+' , 'g'),
        replace: '???'
    },
    {
        name: 'nadbytečná mezera před vykřičníkem',
        search: new RegExp('\u{0020}!(\u{0020}|('+interpunkcezaviraci+'))' , 'g'),
        replace: '!$1'
    },
    {
        name: 'dva a více vykřičníků',
        search: new RegExp(/!!+/ , 'g'),
        replace: '!!!'
    },
    {
        name: 'nadbytečná mezera před dvojtečkou nebo chybějící po ní',
        search: new RegExp('('+pismena+')\u{0020}?:\u{0020}?('+pismena+')' , 'g'),
        replace: '$1:\u{0020}$2'
    },
    {
        name: 'tři a více teček jako ligatura',
        search: new RegExp('\\.{3,}' , 'g'),
        replace: '\u{2026}'
    },
    {
        name: 'nadbytečná mezera před třemi tečkami',
        search: new RegExp('('+alnum+')\u{0020}(\u{2026}|(\\.{3}))', 'g'),
        replace: '$1\u{2026}'
    },
    {
        name: 'nadbytečné koncovky u číslic',
        search: new RegExp('('+cislice+'+)-?=((ti)|(mi))', 'g'),
        replace: '$1'
    },
    {
        name: 'nesprávný a/nebo nesprávně umístěný apostrof u letopočtu',
        search: new RegExp(apostrof+'\u{0020}?('+cislice+'{2})?=[^'+cislice+']', 'g'),
        replace: '\u{02BC}$1'
    },
    {
        name: 'nesprávná varianta apostrofu',
        search: new RegExp('('+pismena+')\u{0020}?'+apostrof+'\u{0020}??='+pismena, 'g'),
        replace: '$1\u{02BC}'
    },
    {
        name: 'nadbytečné mezery před lomítkem a po něm v číselných zápisech',
        search: new RegExp('('+cislice+'){1,4}\u{0020}?/\u{0020}?(?='+cislice+'{1,4})' , 'g'),
        replace: '$1/'
    },
    {
        name: 'nadbytečné koncovky u procentních zápisů',
        search: new RegExp('('+cislice+'%)-?ní'+pismena+'{0,2}', 'g'),
        replace: '$1'
    },
    {
        name: 'chybějící nezlomitelná mezera po znaku § a odstranění dvojitého §',
        search: new RegExp('§{1,2}\u{0020}?(?='+cislice+')', 'g'),
        replace: '§\u{00A0}'
    },
    {
        name: 'chybějící nezlomitelné mezery před znakem & a po něm u spojení slov',
        search: new RegExp('('+pismena+'{2,})\u{0020}?&\u{0020}?('+pismena+'{2,})', 'g'),
        replace: '$1\u{0020}&\u{0020}$2'
    },
    {
        name: 'nadbytečné mezery před znakem & a po něm u spojení písmen',
        search: new RegExp('(^'+pismena+')\u{0020}?&\u{0020}?('+pismena+'$)', 'g'),
        replace: '$1&$2'
    },
    {
        name: 'chybějící nezlomitelné mezery po znaménkách narození a úmrtí',
        search: new RegExp('(\\*|†)\u{0020}?(?='+cislice+')' , 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nadbytečná tečka u otazníku nebo vykřičníku',
        search: new RegExp('([\\?!])\\.', 'g'),
        replace: '$1'
    },
    {
        name: 'nezlomitelná mezera po znaku ⌀',
        search: new RegExp('⌀\u{0020}?('+cislice+')', 'g'),
        replace: '⌀\u{00A0}$1'
    },
    {
        name: 'mezera u hashtagů',
        search: new RegExp('#\u{0020}?('+pismena+')', 'g'),
        replace: '#$1'
    },
    {
        name: 'nadbytečné mezery uvnitř uvozovek zleva',
        search: new RegExp('('+interpunkceotviraci+')\u{0020}?=('+alnum+')', 'g'),
        replace: '$1'
    },
    {
        name: 'nadbytečné mezery uvnitř uvozovek zprava',
        search: new RegExp('('+alnum+interpunkce+'?)\u{0020}('+interpunkcezaviraci+')', 'g'),
        replace: '$1$2'
    },
    {
        name: 'chybějící mezery vně závorek zleva',
        search: new RegExp('('+alnum+')('+interpunkceotviraci+')('+alnum+')', 'g'),
        replace: '$1\u{0020}$2$3'
    },
    {
        name: 'chybějící mezery vně závorek zprava',
        search: new RegExp('('+alnum+interpunkce+'?)('+interpunkcezaviraci+')('+alnum+')', 'g'),
        replace: '$1$2\u{0020}$3'
    },
    /*{ //TODO
        name: 'nadbytečné mezery uvnitř závorek zleva',
        search: new RegExp('' , 'g'),
        replace: ''
    },
    { //TODO
        name: 'nadbytečné mezery uvnitř závorek zprava',
        search: new RegExp('' , 'g'),
        replace: ''
    },*/
    {
        name: 'nesprávný spojovník nebo dlouhá pomlčka v rozsahu čtyřmístných letopočtů 1',
        search: new RegExp('([^'+cislice+'][12]'+cislice+'{3})[-—]([12]'+cislice+'{3}[^'+cislice+'])', 'g'),
        replace: '$1–$2'
    },
    {
        name: 'nesprávný spojovník nebo dlouhá pomlčka v rozsahu čtyřmístných letopočtů 2',
        search: new RegExp('([^'+cislice+'][12]'+cislice+'{3})\u0020–\u{0020}([12]'+cislice+'{3}[^'+cislice+'])', 'g'),
        replace: '$1–$2'
    },
    {
        name: 'nesprávný spojovník nebo dlouhá pomlčka v rozsahu trojmístných letopočtů',
        search: new RegExp('(?=[^'+cislice+']'+cislice+'{3})[-—](?='+cislice+'{3}[^'+cislice+'])', 'g'),
        replace: '$1–$2'
    },
    {
        name: 'nesprávný spojovník nebo dlouhá pomlčka v rozsahu desetiletí a století',
        search: new RegExp('('+cislice+'+\\.)\u{0020}?[-—]\u{0020}?('+cislice+'+\\.)', 'g'),
        replace: '$1–$2'
    }

];
export let highlightRegexRules: RegexRule[] = [{
    name: 'oprava čárek místo uvozovek',
    search: new RegExp(',,([a-zA-Z0-9])', 'g'),
    replace: '\u{201E}$1'
},
{
    name: 'nadbytečná mezera u desetinných čísel',
    search: new RegExp('('+cislice+')\u{0020}?,\u{0020}?('+cislice+')', 'g'),
    replace: '$1,$2'
},
{
    name: 'tři tečky v závorkách do správné podoby',
    search: new RegExp('[/\\(\\<\\[](\u{2026}|(\\.{3}))[/\\)\\>\\]]', 'g'),
    replace: '[\u{2026}]'
},
{
    name: 'chybějící nezlomitelná mezera před znakem %, ‰',
    search: new RegExp('('+cislice+')\u{0020}(%|‰)', 'g'),
    replace: '$1\u{00A0}$2'
},
{
    name: 'chybějící nezlomitelné mezery před znakem ° s udanou teplotní stupnicí',
    search: new RegExp('('+cislice+')\u{0020}?°\u{0020}?([CFRDN])', 'g'),
    replace: '$1\u00A0°$2'
},
{
    name: 'nezlomitelná mezera a odstranění znaku stupně u Kelvinovy teplotní stupnice',
    search: new RegExp('('+cislice+')\u{0020}?°?\u{0020}?K$', 'g'),
    replace: '$1\u00A0K'
},
{
    name: 'mezery u znaku × při uvádění rozměrů',
    search: new RegExp('('+alnum+')\u{0020}?[x×]\u{0020}?('+cislice+')', 'g'),
    replace: '$1\u00A0×\u{00A0}$2'
},
{
    name: 'mezery u znaku × při zápisu adverbií',
    search: new RegExp('('+cislice+')\u{0020}?[x×]\u{0020}?('+pismena+')', 'g'),
    replace: '$1×\u{0020}$2'
},
{
    name: 'nezlomitelná mezera po znaku #',
    search: new RegExp('#\u{0020}?('+cislice+')', 'g'),
    replace: '#\u{00A0}$1'
},
/*{ //TODO
    name: 'mezera u hashtagů s rokem',
    search: new RegExp('' , 'g'),
    replace: ''
},*/
{
    name: 'nezlomitelné mezery před znaménky = a + a po nich v obecných, nematematických zápisech',
    search: new RegExp('('+alnum+')\u{0020}?([=|\\+])\u{0020}?('+pismena+')', 'g'),
    replace: '$1\u{00A0}$2\u{00A0}$3'
},
{
    name: 'pomlčka po peněžních částkách, následuje-li Kč nebo korun + nezlomitelná mezera',
    search: new RegExp('('+cislice+'),[-–—]+\u{0020}?(?=(Kč)|(korun))', 'g'),
    replace: '$1\u{00A0}'
},
{
    name: 'pomlčka po peněžních částkách, nenásleduje-li Kč a zároveň předchází + nezlomitelná mezera',
    search: new RegExp('(Kč)\u{0020}?('+cislice+'+),[-–—]+', 'g'),
    replace: '$1\u{00A0}$3'
},
{
    name: 'nesprávná druhá část u rozsahu letopočtů',
    search: new RegExp('([^-])(1|2)('+cislice+')('+cislice+'{2})(-|–)('+cislice+'{2})([^0-9-])', 'g'),
    replace: '$1$2$3$4–$2$3$6$7'
},
{
    name: 'nesprávné tvary otvíracích uvozovek',
    search: new RegExp('(^|\u{0020}|'+interpunkceotviraci+')'+uvozovky+'('+alnum+')', 'g'),
    replace: '$1„$2'
},
{
    name: 'nesprávné tvary zavíracích uvozovek',
    search: new RegExp('('+alnum+interpunkce+'?)'+uvozovky+'(\u{0020}|'+interpunkcezaviraci+')', 'g'),
    replace: '$1“$2'
},
{
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku',
    search: new RegExp('('+pismena+interpunkcezaviraci+'?)\u{0020}[-–—]('+alnum+')', 'g'),
    replace: '$1\u00A0–\u{0020}$2'
},
{
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku 2',
    search: new RegExp('('+pismena+interpunkcezaviraci+'?)[-–—]\u{0020}('+alnum+')', 'g'),
    replace: '$1\u00A0–\u{0020}$2'
},
/*{//TODO
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku 3',
    search: new RegExp('' , 'g'),
    replace: ''
},*/
{
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku 4',
    search: new RegExp('('+pismena+')\u{0020}[-–—]\u{0020}('+alnum+')', 'g'),
    replace: '$1\u00A0–\u{0020}$2'
}];
