import { Korektor } from './core/Korektor'

var _corrections = {};
const API_PATH = 'https://nlp.fi.muni.cz/projekty/corrector/api/api.cgi';

declare const tinymce: any;

export default () => {
  tinymce.PluginManager.add('plinkorektor', Korektor);
};
