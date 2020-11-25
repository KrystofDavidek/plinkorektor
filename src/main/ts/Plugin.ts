import { themeCustomization } from './assets/style.css';
import { proofreaderBase } from './core/ProofreaderBase';

declare const tinymce: any;

export default () => {
    tinymce.PluginManager.add('plinkorektor', proofreaderBase);
    tinymce.DOM.addStyle(themeCustomization);
};
