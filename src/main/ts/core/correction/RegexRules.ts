import { RegexRule } from '../../types/RegexRule';

export const cislice: string = '[0123456789]';
export const mezery: string = '[\u0020\u00A0\u1680\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000]';
export const pismena: string = '[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]';
export const alnum: string = '[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9]';
export const malapismena: string = '[a-záčďéěíňóřšťúůýž]';
export const interpunkce: string = '[.,;:!?\u2013\u2014\u2026\u0028\u0029\u005B\u005D\u007B\u007D\00AB\u00BB\u201E\u201C\u201A\u2018]';
export const interpunkcezaviraci: string = '[\u0029\u005D\u007D\u00BB\u2018\u201C]';
export const interpunkceotviraci: string = '[\u0028\u005B\u007B\u00AB\u201A\u201E]';
export const apostrof: string = '[\u02BC\u0027\u0060\u2018\u2019\u00B4]';
export const uvozovky: string = '[\u0022\u0027\u0060\u2018\u2019\u201C\u201D\u00AB\u00B4\u2039]';


export let autocorrectRegexRules: RegexRule[] = [
    {
        name: 'násobné mezery',
        search: new RegExp(mezery+'+' , 'g'),
        replace: '\u0020'
    },
    {
        name: 'nezlomitelné mezery po jednopísmenných předložkách',
        search: new RegExp('^('+pismena+')\u0020' , 'g'),
        replace: '$1\u00A0'
    },
    {
        name: 'nezlomitelné mezery po iniciálách a jednopísmenných zkratkách s tečkou',
        search: new RegExp('^('+pismena+'\.)\u0020?='+alnum , 'g'),
        replace: '$1\u00A0'
    },
    {
        name: 'nezlomitelné mezery po řadových číslovkých vyjádřených číslicí',
        search: new RegExp('('+cislice+'{1,2}\.)\u0020?='+malapismena , 'g'),
        replace: '$1\00A0'
    },
    {
        name: 'nadbytečná mezera před tečkou',
        search: new RegExp('\u0020\.' , 'g'),
        replace: '.'
    },
    {
        name: 'chybějící mezera po tečce',
        search: new RegExp('(['+interpunkcezaviraci+alnum+']\.)?='+alnum , 'g'),
        replace: '$1\u0020'
    },
    {
        name: 'nadbytečná tečka',
        search: new RegExp('('+alnum+')\.\.\u0020' , 'g'),
        replace: '$1.\u0020'
    },
    {
        name: 'chybějící úzká mezera mezi řády čísel (a oprava chybné tečky)',
        search: new RegExp('('+cislice+'{1,3})\u0020|\.?='+cislice+'{3}[^'+cislice+']' , 'g'),
        replace: '$1\u00A0'
    },
    {
        name: 'nadbytečná mezera před čárkou',
        search: new RegExp('\u0020,' , 'g'),
        replace: ','
    },
    {
        name: 'chybějící mezera po čárce',
        search: new RegExp('('+pismena+'),?='+pismena , 'g'),
        replace: '$1,\u2020'
    },
    {
        name: 'chybějící mezera po středníku a/nebo nadbytečná před ním',
        search: new RegExp('('+alnum+')\u0020?;\u0020?('+alnum+')' , 'g'),
        replace: '$1; $2'
    },
    {
        name: 'nadbytečná mezera před otazníkem',
        search: new RegExp('\u0020\?(\u0020|('+interpunkcezaviraci+'))' , 'g'),
        replace: '?$1'
    },
    {
        name: 'dva a více otazníků',
        search: new RegExp('\?\?+' , 'g'),
        replace: '???'
    },
    {
        name: 'nadbytečná mezera před vykřičníkem',
        search: new RegExp('\u0020!(\u0020|('+interpunkcezaviraci+'))' , 'g'),
        replace: '!$1'
    },
    {
        name: 'dva a více vykřičníků',
        search: new RegExp('!!+' , 'g'),
        replace: '!!!'
    },
    {
        name: 'nadbytečná mezera před dvojtečkou nebo chybějící po ní',
        search: new RegExp('('+pismena+')\u0020?:\u0020?('+pismena+')' , 'g'),
        replace: '$1:\u0020$2'
    },
    {
        name: 'tři a více teček jako ligatura',
        search: new RegExp('\.{3,}' , 'g'),
        replace: '\u2026'
    },
    {
        name: 'nadbytečná mezera před třemi tečkami',
        search: new RegExp('('+alnum+')\u0020(\u2026|(\.{3}))', 'g'),
        replace: '$1\u2026'
    },
    {
        name: 'nadbytečné koncovky u číslic',
        search: new RegExp('('+cislice+'+)-?=((ti)|(mi))', 'g'),
        replace: '$1'
    },
    {
        name: 'nesprávný a/nebo nesprávně umístěný apostrof u letopočtu',
        search: new RegExp(apostrof+'\u0020?('+cislice+'{2})?=[^'+cislice+']', 'g'),
        replace: '\u02BC$1'
    },
    {
        name: 'nesprávná varianta apostrofu',
        search: new RegExp('('+pismena+')\u0020?'+apostrof+'\u0020??='+pismena, 'g'),
        replace: '$1\u02BC'
    },
    {
        name: 'nadbytečné mezery před lomítkem a po něm v číselných zápisech',
        search: new RegExp('('+cislice+'){1,4}\u0020?/\u0020?(?='+cislice+'{1,4})' , 'g'),
        replace: '$1/'
    },
    {
        name: 'nadbytečné koncovky u procentních zápisů',
        search: new RegExp('('+cislice+'%)-?ní'+pismena+'{0,2}', 'g'),
        replace: '$1'
    },
    {
        name: 'chybějící nezlomitelná mezera po znaku § a odstranění dvojitého §',
        search: new RegExp('§{1,2}\u0020?(?='+cislice+')', 'g'),
        replace: '§\u00A0'
    },
    {
        name: 'chybějící nezlomitelné mezery před znakem & a po něm u spojení slov',
        search: new RegExp('('+pismena+'{2,})\u0020?&\u0020?('+pismena+'{2,})', 'g'),
        replace: '$1\u0020&\u0020$2'
    },
    {
        name: 'nadbytečné mezery před znakem & a po něm u spojení písmen',
        search: new RegExp('(^'+pismena+')\u0020?&\u0020?('+pismena+'$)', 'g'),
        replace: '$1&$2'
    },
    {
        name: 'chybějící nezlomitelné mezery po znaménkách narození a úmrtí',
        search: new RegExp('(\*|†)\u0020?(?='+cislice+')' , 'g'),
        replace: '$1\u00A0'
    },
    {
        name: 'nadbytečná tečka u otazníku nebo vykřičníku',
        search: new RegExp('([\?!)\.', 'g'),
        replace: '$1'
    },
    {
        name: 'nezlomitelná mezera po znaku ⌀',
        search: new RegExp('⌀\u0020?('+cislice+')', 'g'),
        replace: '⌀\u00A0$1'
    },
    {
        name: 'mezera u hashtagů',
        search: new RegExp('#\u0020?('+pismena+')', 'g'),
        replace: '#$1'
    },
    {
        name: 'nadbytečné mezery uvnitř uvozovek zleva',
        search: new RegExp('('+interpunkceotviraci+')\u0020?=('+alnum+')', 'g'),
        replace: '$1'
    },
    {
        name: 'nadbytečné mezery uvnitř uvozovek zprava',
        search: new RegExp('('+alnum+interpunkce+'?)\u0020('+interpunkcezaviraci+')', 'g'),
        replace: '$1$2'
    },
    {
        name: 'chybějící mezery vně závorek zleva',
        search: new RegExp('('+alnum+')('+interpunkceotviraci+')('+alnum+')', 'g'),
        replace: '$1\u0020$2$3'
    },
    {
        name: 'chybějící mezery vně závorek zprava',
        search: new RegExp('('+alnum+interpunkce+'?)('+interpunkcezaviraci+')('+alnum+')', 'g'),
        replace: '$1$2\u0020$3'
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
        search: new RegExp('([^'+cislice+'][12]'+cislice+'{3})\u0020–\u0020([12]'+cislice+'{3}[^'+cislice+'])', 'g'),
        replace: '$1–$2'
    },
    {
        name: 'nesprávný spojovník nebo dlouhá pomlčka v rozsahu trojmístných letopočtů',
        search: new RegExp('(?=[^'+cislice+']'+cislice+'{3})[-—](?='+cislice+'{3}[^'+cislice+'])', 'g'),
        replace: '$1–$2'
    },
    {
        name: 'nesprávný spojovník nebo dlouhá pomlčka v rozsahu desetiletí a století',
        search: new RegExp('('+cislice+'+\.)\u0020?[-—]\u0020?('+cislice+'+\.)', 'g'),
        replace: '$1–$2'
    }

];
export let highlightRegexRules: RegexRule[] = [{
    name: 'oprava čárek místo uvozovek',
    search: new RegExp(',,([a-zA-Z0-9])', 'g'),
    replace: '\u201E$1'
},
{
    name: 'nadbytečná mezera u desetinných čísel',
    search: new RegExp('('+cislice+')\u0020?,\u0020?('+cislice+')', 'g'),
    replace: '$1,$2'
},
{
    name: 'tři tečky v závorkách do správné podoby',
    search: new RegExp('[/\(\<\[](\u2026|(\.{3}))[/\)\>\]]', 'g'),
    replace: '[\u2026]'
},
{
    name: 'chybějící nezlomitelná mezera před znakem %, ‰',
    search: new RegExp('('+cislice+')\u0020(%|‰)', 'g'),
    replace: '$1\u00A0$2'
},
{
    name: 'chybějící nezlomitelné mezery před znakem ° s udanou teplotní stupnicí',
    search: new RegExp('('+cislice+')\u0020?°\u0020?([CFRDN])', 'g'),
    replace: '$1\u00A0°$2'
},
{
    name: 'nezlomitelná mezera a odstranění znaku stupně u Kelvinovy teplotní stupnice',
    search: new RegExp('('+cislice+')\u0020?°?\u0020?K$', 'g'),
    replace: '$1\u00A0K'
},
{
    name: 'mezery u znaku × při uvádění rozměrů',
    search: new RegExp('('+alnum+')\u0020?[x×]\u0020?('+cislice+')', 'g'),
    replace: '$1\u00A0×\u00A0$2'
},
{
    name: 'mezery u znaku × při zápisu adverbií',
    search: new RegExp('('+cislice+')\u0020?[x×]\u0020?('+pismena+')', 'g'),
    replace: '$1×\u0020$2'
},
{
    name: 'nezlomitelná mezera po znaku #',
    search: new RegExp('#\u0020?('+cislice+')', 'g'),
    replace: '#\u00A0$1'
},
/*{ //TODO
    name: 'mezera u hashtagů s rokem',
    search: new RegExp('' , 'g'),
    replace: ''
},*/
{
    name: 'nezlomitelné mezery před znaménky = a + a po nich v obecných, nematematických zápisech',
    search: new RegExp('('+alnum+')\u0020?([=|\+])\u0020?('+pismena+')', 'g'),
    replace: '$1\u00A0$2\u00A0$3'
},
{
    name: 'pomlčka po peněžních částkách, následuje-li Kč nebo korun + nezlomitelná mezera',
    search: new RegExp('('+cislice+'),[-–—]+\u0020?(?=(Kč)|(korun))', 'g'),
    replace: '$1\u00A0'
},
{
    name: 'pomlčka po peněžních částkách, nenásleduje-li Kč a zároveň předchází + nezlomitelná mezera',
    search: new RegExp('(Kč)\u0020?('+cislice+'+),[-–—]+', 'g'),
    replace: '$1\u00A0$3'
},
{
    name: 'nesprávná druhá část u rozsahu letopočtů',
    search: new RegExp('([^-])(1|2)('+cislice+')('+cislice+'{2})(-|–)('+cislice+'{2})([^0-9-])', 'g'),
    replace: '$1$2$3$4–$2$3$6$7'
},
{
    name: 'nesprávné tvary otvíracích uvozovek',
    search: new RegExp('(^|\u0020|'+interpunkceotviraci+')'+uvozovky+'('+alnum+')', 'g'),
    replace: '$1„$2'
},
{
    name: 'nesprávné tvary zavíracích uvozovek',
    search: new RegExp('('+alnum+interpunkce+'?)'+uvozovky+'(\u0020|'+interpunkcezaviraci+')', 'g'),
    replace: '$1“$2'
},
{
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku',
    search: new RegExp('('+pismena+interpunkcezaviraci+'?)\u0020[-–—]('+alnum+')', 'g'),
    replace: '$1\u00A0–\u0020$2'
},
{
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku 2',
    search: new RegExp('('+pismena+interpunkcezaviraci+'?)[-–—]\u0020('+alnum+')', 'g'),
    replace: '$1\u00A0–\u0020$2'
},
/*{//TODO
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku 3',
    search: new RegExp('' , 'g'),
    replace: ''
},*/
{
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku 4',
    search: new RegExp('('+pismena+')\u0020[-–—]\u0020('+alnum+')', 'g'),
    replace: '$1\u00A0–\u0020$2'
}];
