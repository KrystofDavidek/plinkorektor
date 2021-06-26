import { themeCustomization } from '../core/assets/style.css';
import { Proofreader } from '../core/Proofreader';
import { cssMainStylesheet } from '../core/assets/style.css';
import { config } from '../core/Config';
import { message as msg } from '../core/utilities/Message';
import { TinyMceGui } from './TinyMceGui';
import { ProofreaderGui } from '../core/gui/ProofreaderGui';
import * as $ from 'jquery';

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
        editor.ui.registry.addButton('reporterror', {
            text: 'Nahlásit chybu',
            onAction: function (_) {
                let selection = editor.selection.getContent({format: 'text'});
                let paragraph = editor.selection.getNode();
                while($(paragraph)[0].tagName != "P") {
                    paragraph = $(paragraph)[0].parent();
                };
                let confirmed = confirm("Chcete nahlásit chybně opravený text: \n" + selection + "\n nacházející se v tomto odstavci: \n " + $(paragraph).text());
                if(confirmed) {
                    proofreader.report(selection, $(paragraph).html());
                }
            }
        });
    });
    tinymce.DOM.addStyle(themeCustomization);
};
