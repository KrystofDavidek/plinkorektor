import { themeCustomization } from './assets/style.css';
import { Proofreader } from './core/ProofreaderBase';
import { cssMainStylesheet } from './assets/style.css';
import { config } from './core/Config';
import { message as msg } from './core/utilities/Message';
import * as $ from 'jquery';

declare const tinymce: any;

export default () => {
    tinymce.PluginManager.add('plinkorektor', (editor) => {
        msg('Pre-initialization.');
        let proofreader  = new Proofreader(config, editor.selection, editor.windowManager, () => {editor.dom.addStyle(cssMainStylesheet);});
        editor.on('init', function () {
            proofreader.initialize($(editor.dom.select('html')[0]));
        });
        // Autocorrect triggered by editor change
        editor.on('remove', function () {
            proofreader.destroy();
        });
    });
    tinymce.DOM.addStyle(themeCustomization);
};
