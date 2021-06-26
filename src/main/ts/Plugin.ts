import { themeCustomization } from './assets/style.css';
import { Proofreader } from './core/Proofreader';
import { cssMainStylesheet } from './assets/style.css';
import { config } from './core/Config';
import { message as msg } from './core/utilities/Message';
import * as $ from 'jquery';
import { TinyMceGui } from './core/gui/TinyMceGui';

declare const tinymce: any;

export default () => {
    tinymce.PluginManager.add('plinkorektor', (editor) => {
        msg('Pre-initialization.');
        let gui: ProofreaderGui = new TinyMceGui(editor, () => {editor.dom.addStyle(cssMainStylesheet);})
        let proofreader  = new Proofreader(config, gui);
        editor.on('init', function () {
            proofreader.initialize();
        });
        // Autocorrect triggered by editor change
        editor.on('remove', function () {
            proofreader.destroy();
        });
    });
    tinymce.DOM.addStyle(themeCustomization);
};
