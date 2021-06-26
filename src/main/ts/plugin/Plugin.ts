import { themeCustomization } from '../core/assets/style.css';
import { Proofreader } from '../core/Proofreader';
import { cssMainStylesheet } from '../core/assets/style.css';
import { config } from '../core/Config';
import { message as msg } from '../core/utilities/Message';
import { TinyMceGui } from './TinyMceGui';
import { ProofreaderGui } from '../core/gui/ProofreaderGui';

declare const tinymce: any;

export default () => {
    tinymce.PluginManager.add('plinkorektor', (editor) => {
        msg('Pre-initialization.');
        let proofreader  = new Proofreader(config);
        editor.on('init', function () {
            let gui: ProofreaderGui = new TinyMceGui(editor, () => {editor.dom.addStyle(cssMainStylesheet);})
            proofreader.initialize(gui);
        });
        // Autocorrect triggered by editor change
        editor.on('remove', function () {
            proofreader.destroy();
        });
    });
    tinymce.DOM.addStyle(themeCustomization);
};
