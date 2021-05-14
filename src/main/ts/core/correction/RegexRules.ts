import { RegexRule } from '../../types/RegexRule';

export const cislice: string = '[0123456789]';
export const mezery: string = '[\u{0020}\u{00A0}\u{1680}\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}\u{202F}\u{205F}\u{3000}]';
export const pismena: string = '[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]';
export const alnum: string = '[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9]';
export const mala_pismena: string = '[a-záčďéěíňóřšťúůýž]';
export const velka_pismena: string = '[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]';
export const interpunkce: string = '[\\.,;:!\\?\u{2013}\u{2014}\u{2026}\u{0028}\u{0029}\u{005B}\u{005D}\u{007B}\u{007D}\00AB\u{00BB}\u{201E}\u{201C}\u{201A}\u{2018}]';
export const interpunkce_zaviraci: string = '[\u{0029}\u{005D}\u{007D}\u{00AB}\u{2018}\u{201C}]';
export const interpunkce_otviraci: string = '[\u{0028}\u{005B}\u{007B}\u{00BB}\u{201A}\u{201E}]';
export const apostrof: string = '[\u{02BC}\u{0027}\u{0060}\u{2018}\u{2019}\u{00B4}]';
export const uvozovky: string = '[\u{0022}\u{0027}\u{0060}\u{2018}\u{2019}\u{201C}\u{201D}\u{00AB}\u{00B4}\u{2039}]';
export const zacatek_slova: string = '[\u{0020}\u{00A0}\u{1680}\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}\u{202F}\u{205F}\u{3000}\u{0028}\u{005B}\u{007B}\u{00AB}\u{201A}\u{201E}]';
export const konec_slova: string = '[\u{0020}\u{00A0}\u{1680}\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}\u{202F}\u{205F}\u{3000}\u{0029}\u{005D}\u{007D}\u{00BB}\u{2018}\u{201C}]';

export let highlightRegexRules: RegexRule[] = [

    {
        name: 'násobné mezery',
        description: 'Nadbytečné mezery',
        correctionLabel: 'Odstraňte nadbytečné mezery',
        search: new RegExp(mezery + '{2,}' , 'g'),
        replace: '\u{0020}'
    },
    {
        name: 'nezlomitelné mezery po jednopísmenných předložkách',
        description: 'Použijte pevnou mezeru',
        correctionLabel: 'Opravte obyčejnou mezeru na pevnou (za předložkou, zkratkou, …)',
        about:[{
            url: 'IJP',
            label: 'https://prirucka.ujc.cas.cz/?id=880'
        }],
        search: new RegExp('('+ zacatek_slova + pismena + ')\u{0020}' , 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nezlomitelné mezery po iniciálách a jednopísmenných zkratkách s tečkou',
        description: 'Použijte pevnou mezeru',
        correctionLabel: 'Opravte obyčejnou mezeru na pevnou (za předložkou, zkratkou, …)',
        about:[{
            url: 'IJP',
            label: 'https://prirucka.ujc.cas.cz/?id=880'
        }],
        search: new RegExp('(' + zacatek_slova + pismena + '\\.)\u{0020}(?=' + alnum + ')', 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nezlomitelné mezery po řadových číslovkých vyjádřených číslicí',
        description: 'Použijte pevnou mezeru',
        correctionLabel: 'Opravte obyčejnou mezeru na pevnou (za předložkou, zkratkou, …)',
        about:[{
            url: 'IJP',
            label: 'https://prirucka.ujc.cas.cz/?id=880'
        }],
        search: new RegExp('(' + cislice + '{1,2}\\.)\u{0020}(?=' + mala_pismena + ')', 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nadbytečná mezera před tečkou',
        description: 'Nadbytečná mezera',
        correctionLabel: 'Odstraňte nadbytečnou mezeru před ! ? .',
        search: new RegExp('\u{0020}\\.' , 'g'),
        replace: '.'
    },
    {
        name: 'chybějící mezera po tečce',
        description: 'Chybějící mezera',
        correctionLabel: 'Vložte mezeru za tečku ',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=160#nadpis10',
            label: 'IJP'
        }],
        search: new RegExp('([' + interpunkce_zaviraci + alnum + ']\\.)(?=' + alnum + ')', 'g'),
        replace: '$1\u{0020}'
    },
    {
        name: 'nadbytečná tečka',
        description: 'Nadbytečná tečka',
        search: new RegExp('(' + alnum + ')\\.\\.\u{0020}' , 'g'),
        replace: '$1.\u{0020}'
    },
    {
        name: 'chybějící úzká mezera mezi řády čísel (a oprava chybné tečky)',
        description: 'Nesprávný znak',
        correctionLabel: 'Odstraňte tečku mezi číslicemi',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=786',
            label: 'IJP'
        }],
        search: new RegExp('(' + cislice + '{1,3})\u{0020}|\\.(?=' + cislice + '{3}[^' + cislice + '])' , 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nadbytečná mezera před čárkou',
        description: 'Nadbytečná mezera před čárkou',
        search: new RegExp('\u{0020},' , 'g'),
        replace: ','
    },
    {
        name: 'chybějící mezera po čárce',
        description: 'Chybějící mezera',
        correctionLabel: 'Vložte mezeru za čárku',
        search: new RegExp('(' + pismena + '),(?=' + pismena + ')', 'g'),
        replace: '$1,\u{0020}'
    },
    {
        name: 'chybějící mezera po středníku a/nebo nadbytečná před ním',
        description: 'Chybějící mezera po středníku a/nebo nadbytečná před ním',
        search: new RegExp('(' + alnum + ')\u{0020}?;\u{0020}?(' + alnum + ')' , 'g'),
        replace: '$1; $2'
    },
    {
        name: 'nadbytečná mezera před otazníkem',
        description: 'Nadbytečná mezera před otazníkem',
        search: new RegExp('\u{0020}\\?(\u{0020}|(' + interpunkce_zaviraci + '))' , 'g'),
        replace: '?$1'
    },
    {
        name: 'dva a více otazníků',
        description: 'Nesprávný znak',
        correctionLabel: 'Opravte počet interpunkčních znamének',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=160#nadpis9',
            label: 'IJP'
        }],
        search: new RegExp('\\?\\?+' , 'g'),
        replace: '???'
    },
    {
        name: 'nadbytečná mezera před vykřičníkem',
        description: 'Nadbytečná mezera před vykřičníkem',
        search: new RegExp('\u{0020}!(\u{0020}|(' + interpunkce_zaviraci + '))' , 'g'),
        replace: '!$1'
    },
    {
        name: 'dva a více vykřičníků',
        description: 'Nesprávný znak',
        correctionLabel: 'Opravte počet interpunkčních znamének',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=160#nadpis9',
            label: 'IJP'
        }],
        search: new RegExp(/!!+/ , 'g'),
        replace: '!!!'
    },
    {
        name: 'nadbytečná mezera před dvojtečkou nebo chybějící po ní',
        description: 'Nadbytečná mezera před dvojtečkou nebo chybějící po ní',
        search: new RegExp('(' + pismena + ')\u{0020}?:\u{0020}?(' + pismena + ')' , 'g'),
        replace: '$1:\u{0020}$2'
    },
    {
        name: 'tři a více teček jako ligatura',
        description: 'Nesprávný znak',
        correctionLabel: 'Použijte znak tři tečky (výpustka) místo tří jednotlivých teček za sebou',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=166',
            label: 'IJP'
        }],
        search: new RegExp('\\.{3,}' , 'g'),
        replace: '\u{2026}'
    },
    {
        name: 'nadbytečná mezera před třemi tečkami',
        description: 'Chybějící mezera',
        correctionLabel: 'Doplňte mezeru za „slovo"',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=166',
            label: 'IJP'
        }],
        search: new RegExp('(' + alnum + ')\u{0020}(\u{2026}|(\\.{3}))', 'g'),
        replace: '$1\u{2026}'
    },
    {
        name: 'nadbytečné koncovky u číslic',
        description: 'Nadbytečné koncovky u číslic',
        search: new RegExp('(' + cislice + '+)-?((ti)|(mi))', 'g'),
        replace: '$1'
    },
	{
        name: 'nesprávný zápis složených adjektiv a adverbií',
        description: 'Nesprávný zápis složených adjektiv a adverbií',
        search: new RegExp('([' + cislice + ']+)-([' + pismena + ']+)([(ý)(ého)(ému)(ého)(ém)(ým)(á)(é)(ou)(í)(ých)(ým)(ými)(ího)(ímu)(ím)(ích)(ími)(ě)(e)])', 'g'),
        replace: '$1$2$3'
    },
    {
        name: 'nesprávný a/nebo nesprávně umístěný apostrof u letopočtu',
        description: 'Nesprávný znak ',
        correctionLabel: 'Použijte znak pro apostrof',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=168',
            label: 'IJP'
        }],
        search: new RegExp(apostrof + '\u{0020}?(' + cislice + '{2})(?=[^' + cislice + '])', 'g'),
        replace: '\u{02BC}$1'
    },
    {
        name: 'nesprávná varianta apostrofu',
        description: 'Nesprávný znak ',
        correctionLabel: 'Použijte znak pro apostrof',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=168',
            label: 'IJP'
        }],
        search: new RegExp('(' + pismena + ')\u{0020}?' + apostrof + '\u{0020}?(?=' + pismena + ')', 'g'),
        replace: '$1\u{02BC}'
    },
    {
        name: 'nadbytečné mezery před lomítkem a po něm v číselných zápisech',
        description: 'Nadbytečné mezery ',
        correctionLabel: 'Odstraňte nadbytečné mezery okolo lomítka',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=167',
            label: 'IJP'
        }],
        search: new RegExp('(' + cislice + '){1,4}\u{0020}?/\u{0020}?(?=' + cislice + '{1,4})' , 'g'),
        replace: '$1/'
    },
    {
        name: 'nadbytečné koncovky u procentních zápisů',
        description: 'Nesprávný tvar slova',
        correctionLabel: 'Odstraňte nadbytečnou koncovku',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=785#nadpis3',
            label: 'IJP'
        },
        {
            url: 'https://prirucka.ujc.cas.cz/?id=790',
            label: 'IJP'
        }],
        search: new RegExp('(' + cislice + '%)-?ní' + pismena + '{0,2}', 'g'),
        replace: '$1'
    },
    {
        name: 'chybějící nezlomitelná mezera po znaku § a odstranění dvojitého §',
        description: 'Nesprávný znak',
        correctionLabel: 'Ponechte pouze jeden znak pro §',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=785#nadpis3',
            label: 'IJP'
        }],
        search: new RegExp('§{1,2}\u{0020}?(?=' + cislice + ')', 'g'),
        replace: '§\u{00A0}'
    },
    {
        name: 'chybějící nezlomitelné mezery před znakem & a po něm u spojení slov',
        description: 'Nesprávná mezera',
        correctionLabel: 'Změňte běžnou mezislovní mezeru na pevnou',
        search: new RegExp('(' + pismena + '{2,})\u{0020}?&\u{0020}?(' + pismena + '{2,})', 'g'),
        replace: '$1\u{0020}&\u{0020}$2'
    },
    {
        name: 'nadbytečné mezery před znakem & a po něm u spojení písmen',
        description: 'Nesprávná mezera',
        correctionLabel: 'Změňte běžnou mezislovní mezeru na pevnou',
        search: new RegExp('(^' + pismena + ')\u{0020}?&\u{0020}?(' + pismena + konec_slova + ')', 'g'),
        replace: '$1&$2'
    },
    {
        name: 'chybějící nezlomitelné mezery po znaménkách narození a úmrtí',
        description: 'Nesprávná mezera',
        correctionLabel: 'Změňte běžnou mezislovní mezeru na pevnou',
        search: new RegExp('(\\*|†)\u{0020}?(?=' + cislice + ')' , 'g'),
        replace: '$1\u{00A0}'
    },
    {
        name: 'nadbytečná tečka u otazníku nebo vykřičníku',
        description: 'Nesprávný znak',
        correctionLabel: 'Odstraňte tečku za ! ?',
        search: new RegExp('([\\?!])\\.', 'g'),
        replace: '$1'
    },
    {
        name: 'nezlomitelná mezera po znaku průměr',
        description: 'Nesprávná mezera',
        correctionLabel: 'Změňte běžnou mezislovní mezeru na pevnou',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=785#nadpis3',
            label: 'IJP'
        },
        {
            url: 'https://prirucka.ujc.cas.cz/?id=880 ',
            label: 'IJP'
        }],
        search: new RegExp('\u{2300}\u{0020}?(' + cislice + ')', 'g'),
        replace: '\u{2300}\u{00A0}$1'
    },
    {
        name: 'mezera u hashtagů',
        description: 'Mezera u hashtagů',
        search: new RegExp('#\u{0020}?(' + pismena + ')', 'g'),
        replace: '#$1'
    },
    {
        name: 'nadbytečné mezery uvnitř uvozovek zleva',
        description: 'Nesprávné mezery',
        correctionLabel: 'Odstraňte nadbytečné mezery',
        search: new RegExp('(' + interpunkce_otviraci + ')\u{0020}(?=(' + alnum + '))', 'g'),
        replace: '$1'
    },
    {
        name: 'nadbytečné mezery uvnitř uvozovek zprava',
        description: 'Nesprávné mezery',
        correctionLabel: 'Odstraňte nadbytečné mezery',
        search: new RegExp('(' + alnum + interpunkce + '?)\u{0020}(' + interpunkce_zaviraci + ')', 'g'),
        replace: '$1$2'
    },
    {
        name: 'chybějící mezery vně závorek zleva',
        description: 'Chybějící mezery před počáteční | za koncovou závorkou',
        correctionLabel: 'Doplňte chybějící mezery',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=163',
            label: 'IJP'
        }],
        search: new RegExp('(' + alnum + ')(' + interpunkce_otviraci + ')(' + alnum + ')', 'g'),
        replace: '$1\u{0020}$2$3'
    },
    {
        name: 'chybějící mezery vně závorek zprava',
        description: 'Chybějící mezery před počáteční | za koncovou závorkou',
        correctionLabel: 'Doplňte chybějící mezery',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=163',
            label: 'IJP'
        }],
        search: new RegExp('(' + alnum + interpunkce + '?)(' + interpunkce_zaviraci + ')(' + alnum + ')', 'g'),
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
        description: 'Nesprávný znak',
        correctionLabel: 'Použijte znak pro pomlčku',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=165',
            label: 'IJP'
        }],
        search: new RegExp('([^' + cislice + '][12]' + cislice + '{3})[-—]([12]' + cislice + '{3}[^' + cislice + '])', 'g'),
        replace: '$1–$2'
    },
    {
        name: 'nesprávný spojovník nebo dlouhá pomlčka v rozsahu čtyřmístných letopočtů 2',
        description: 'Nesprávný znak',
        correctionLabel: 'Použijte znak pro pomlčku',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=165',
            label: 'IJP'
        }],
        search: new RegExp('([^' + cislice + '][12]' + cislice + '{3})\u0020–\u{0020}([12]' + cislice + '{3}[^' + cislice + '])', 'g'),
        replace: '$1–$2'
    },
    {
        name: 'nesprávný spojovník nebo dlouhá pomlčka v rozsahu trojmístných letopočtů',
        description: 'Nesprávný znak',
        correctionLabel: 'Použijte znak pro pomlčku',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=165',
            label: 'IJP'
        }],
        search: new RegExp('(?=[^' + cislice + ']' + cislice + '{3})[-—](?=' + cislice + '{3}[^' + cislice + '])', 'g'),
        replace: '$1–$2'
    },
    {
        name: 'nesprávný spojovník nebo dlouhá pomlčka v rozsahu desetiletí a století',
        description: 'Nesprávný znak',
        correctionLabel: 'Použijte znak pro pomlčku',
        about:[{
            url: 'https://prirucka.ujc.cas.cz/?id=165',
            label: 'IJP'
        }],
        search: new RegExp('(' + cislice + '+\\.)\u{0020}?[-—]\u{0020}?(' + cislice + '+\\.)', 'g'),
        replace: '$1–$2'
    },
    
    




    {
    name: 'oprava čárek místo uvozovek',
    description: 'Oprava čárek místo uvozovek',
    search: new RegExp(',,([a-zA-Z0-9])', 'g'),
    replace: '\u{201E}$1'
},
{
    name: 'nadbytečná mezera u desetinných čísel',
    description: 'Nadbytečná mezera',
    correctionLabel: 'Odstraňte nadbytečnou mezeru vedle čárky',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=791#nadpis3',
        label: 'IJP'
    }],
    search: new RegExp('(' + cislice + ')\u{0020}?,\u{0020}?(' + cislice + ')', 'g'),
    replace: '$1,$2'
},
{
    name: 'tři tečky v závorkách do správné podoby',
    description: 'Nesprávný znak',
    correctionLabel: 'Pro vypuštěný text použijte závorky a znak tři tečky (…)',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=166',
        label: 'IJP'
    }],
    search: new RegExp('[/\\(\\<\\[](\u{2026}|(\\.{3}))[/\\)\\>\\]]', 'g'),
    replace: '[\u{2026}]'
},
{
    name: 'chybějící nezlomitelná mezera před znakem %, ‰',
    description: 'Nesprávná mezera',
    correctionLabel: 'Změňte běžnou mezislovní mezeru na pevnou',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=785#nadpis3',
        label: 'IJP'
    }],
    search: new RegExp('(' + cislice + ')\u{0020}(%|‰)', 'g'),
    replace: '$1\u{00A0}$2'
},
{
    name: 'chybějící nezlomitelné mezery před znakem ° s udanou teplotní stupnicí',
    description: 'Nesprávná mezera',
    correctionLabel: 'Změňte běžnou mezislovní mezeru na pevnou',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=785#nadpis3',
        label: 'IJP'
    },
    {
        url: 'https://prirucka.ujc.cas.cz/?id=880',
        label: 'IJP'
    }],
    search: new RegExp('(' + cislice + ')\u{0020}?°\u{0020}?([CFRDN])', 'g'),
    replace: '$1\u00A0°$2'
},
{
    name: 'nezlomitelná mezera a odstranění znaku stupně u Kelvinovy teplotní stupnice',
    description: 'Nesprávná mezera',
    correctionLabel: 'Změňte běžnou mezislovní mezeru na pevnou',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=785#nadpis3',
        label: 'IJP'
    },
    {
        url: 'https://prirucka.ujc.cas.cz/?id=880',
        label: 'IJP'
    }],
    search: new RegExp('(' + cislice + ')\u{0020}?°?\u{0020}?K$', 'g'),
    replace: '$1\u00A0K'
},
{
    name: 'mezery u znaku × při uvádění rozměrů',
    description: 'Chybějící mezery',
    correctionLabel: 'Doplňte mezery okolo znaku ×',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=785#nadpis4',
        label: 'IJP'
    }],
    search: new RegExp('(' + alnum + ')\u{0020}?[x×]\u{0020}?(' + cislice + ')', 'g'),
    replace: '$1\u00A0×\u{00A0}$2'
},
{
    name: 'mezery u znaku × při zápisu adverbií',
    description: 'Nesprávná mezera',
    correctionLabel: 'Odstraňte mezeru před ×',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=785#nadpis4',
        label: 'IJP'
    }],
    search: new RegExp('(' + cislice + ')\u{0020}?[x×]\u{0020}?(' + pismena + ')', 'g'),
    replace: '$1×\u{0020}$2'
},
{
    name: 'nezlomitelná mezera po znaku #',
    description: 'Nesprávná mezera',
    search: new RegExp('#\u{0020}?(' + cislice + ')', 'g'),
    replace: '#\u{00A0}$1'
},
/*{ //TODO
    name: 'mezera u hashtagů s rokem',
    search: new RegExp('' , 'g'),
    replace: ''
},*/
{
    name: 'nezlomitelné mezery před znaménky = a + a po nich v obecných, nematematických zápisech',
    description: 'Nesprávná mezera',
    correctionLabel: 'Změňte běžnou mezislovní mezeru na pevnou',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=785#nadpis4',
        label: 'IJP'
    },
    {
        url: 'https://prirucka.ujc.cas.cz/?id=880',
        label: 'IJP'
    }],
    search: new RegExp('(' + alnum + ')\u{0020}?([=|\\+])\u{0020}?(' + pismena + ')', 'g'),
    replace: '$1\u{00A0}$2\u{00A0}$3'
},
{
    name: 'pomlčka po peněžních částkách, následuje-li Kč nebo korun + nezlomitelná mezera',
    description: 'Nesprávný znak',
    correctionLabel: 'Odstraňte nadbytečnou čárku a pomlčku',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=786',
        label: 'IJP'
    },
    {
        url: 'https://prirucka.ujc.cas.cz/?id=165',
        label: 'IJP'
    }],
    search: new RegExp('(' + cislice + '),[-–—]+\u{0020}?(?=(Kč)|(korun))', 'g'),
    replace: '$1\u{00A0}'
},
{
    name: 'pomlčka po peněžních částkách, nenásleduje-li Kč a zároveň předchází + nezlomitelná mezera',
    description: 'Nesprávný znak',
    correctionLabel: 'Odstraňte nadbytečnou čárku a pomlčku',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=786',
        label: 'IJP'
    },
    {
        url: 'https://prirucka.ujc.cas.cz/?id=165',
        label: 'IJP'
    }],
    search: new RegExp('(Kč)\u{0020}?(' + cislice + '+),[-–—]+', 'g'),
    replace: '$1\u{00A0}$3'
},
{
    name: 'nesprávná druhá část u rozsahu letopočtů',
    description: 'Nesprávná druhá část u rozsahu letopočtů',
    search: new RegExp('([^-])(1|2)(' + cislice + ')(' + cislice + '{2})(-|–)(' + cislice + '{2})([^0-9-])', 'g'),
    replace: '$1$2$3$4–$2$3$6$7'
},
{
    name: 'nesprávné tvary otvíracích uvozovek',
    description: 'Nesprávné uvozovky',
    correctionLabel: 'Opravte uvozovky',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=162',
        label: 'IJP'
    }],
    search: new RegExp('(^|\u{0020}|' + interpunkce_otviraci + ')' + uvozovky + '(' + alnum + ')', 'g'),
    replace: '$1„$2'
},
{
    name: 'nesprávné tvary zavíracích uvozovek',
    description: 'Nesprávné uvozovky',
    correctionLabel: 'Opravte uvozovky',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=162',
        label: 'IJP'
    }],
    search: new RegExp('(' + alnum + interpunkce + '?)' + uvozovky + '(\u{0020}|' + interpunkce_zaviraci + ')', 'g'),
    replace: '$1“$2'
},
{
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku',
    description: 'Nesprávný znak',
    correctionLabel: 'Použijte znak pro pomlčku',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=165',
        label: 'IJP'
    }],
    search: new RegExp('(' + pismena + interpunkce_zaviraci + '?)\u{0020}[-–—](' + alnum + ')', 'g'),
    replace: '$1\u00A0–\u{0020}$2'
},
{
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku 2',
    description: 'Nesprávný znak',
    correctionLabel: 'Použijte znak pro pomlčku',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=165',
        label: 'IJP'
    }],
    search: new RegExp('(' + pismena + interpunkce_zaviraci + '?)[-–—]\u{0020}(' + alnum + ')', 'g'),
    replace: '$1\u00A0–\u{0020}$2'
},
/*{//TODO
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku 3',
    search: new RegExp('' , 'g'),
    replace: ''
},*/
{
    name: 'nesprávné nebo chybějící mezery okolo větné pomlčky nebo nesprávného spojovníku 4',
    description: 'Nesprávný znak',
    correctionLabel: 'Použijte znak pro pomlčku',
    about:[{
        url: 'https://prirucka.ujc.cas.cz/?id=165',
        label: 'IJP'
    }],
    search: new RegExp('(' + pismena + ')\u{0020}[-–—]\u{0020}(' + alnum + ')', 'g'),
    replace: '$1\u00A0–\u{0020}$2'
}];
