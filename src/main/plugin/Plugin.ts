import { cssMainStylesheet, themeCustomization } from '../../assets/editor-styles';
import { TinyMceGui } from './TinyMceGui';
import * as $ from 'jquery';
import { config, Proofreader, ProofreaderGui, message as msg } from 'plinkorektor-core';

declare const tinymce: any;

export const MISTAKE_BG_COLOR = 'rgb(255, 255, 0)';

export default () => {
  tinymce.PluginManager.add('plinkorektor', (editor) => {
    msg('Pre-initialization.');
    let proofreader = new Proofreader(config);
    editor.on('init', function () {
      let gui: ProofreaderGui = new TinyMceGui(editor, () => {
        editor.dom.addStyle(cssMainStylesheet);
      });
      proofreader.initialize(gui);
    });
    // Autocorrect triggered by editor change
    editor.on('remove', function () {
      proofreader.destroy();
    });
    editor.ui.registry.addButton('reporterror', {
      text: 'Nahlásit chybu',
      onAction: function (_) {
        let selection = editor.selection.getContent({ format: 'text' });
        let paragraph = editor.selection.getNode();
        while ($(paragraph)[0].tagName != 'P') {
          paragraph = $(paragraph)[0].parent();
        }
        let note = prompt(
          'Chystáte se nahlásit chybně opravený text: \n' +
            selection +
            '\n nacházející se v tomto odstavci: \n ' +
            $(paragraph).text() +
            ' \n Zde můžete doplnit poznámku: ',
        );
        if (note) {
          proofreader.report(selection, $(paragraph).html(), note);
        }
      },
      onSetup: function (buttonApi) {
        var editorEventCallback = function () {
          buttonApi.setDisabled(proofreader.config.gui.isProcessing());
        };
        editor.on('NodeChange', editorEventCallback);

        /* onSetup should always return the unbind handlers */
        return function (buttonApi) {
          editor.off('NodeChange', editorEventCallback);
        };
      },
    });
    editor.ui.registry.addButton('calculate-confustion-matrix', {
      text: 'Statistiky oprav',
      onAction: function (_) {
        let tokens = editor.dom.select('.pk-token');
        let total = tokens.length;
        let [TP, FP, TN, FN]: number[] = [0, 0, 0, 0];
        $(tokens).each((i, token) => {
          let hasError = $(token).hasClass('pk-token-correction');
          let shouldHaveError = realBackgroundColor(token) == MISTAKE_BG_COLOR;
          if (hasError && shouldHaveError) {
            TP += 1;
          } else if (!hasError && !shouldHaveError) {
            TN += 1;
          } else if (hasError && !shouldHaveError) {
            FP += 1;
          } else if (!hasError && shouldHaveError) {
            FN += 1;
          }
        });
        let precision: number = (TP / (TP + FP)) * 100;
        let recall: number = TP + FN == 0 ? 100 : (TP / (TP + FN)) * 100;
        let results: string =
          'Celkem tokenů: ' +
          total +
          ' TP: ' +
          TP +
          ' FP: ' +
          FP +
          ' TN: ' +
          TN +
          ' FN: ' +
          FN +
          ' \n Přesnost: ' +
          Math.floor(precision * 100) / 100 +
          ' % Pokrytí: ' +
          Math.floor(recall * 100) / 100 +
          ' %';
        $('.tox-statusbar.stats').remove();
        $('.tox-statusbar').before('<div class="tox-statusbar stats">' + results + '</div>');
      },
      onSetup: function (buttonApi) {
        var editorEventCallback = function () {
          buttonApi.setDisabled(proofreader.config.gui.isProcessing());
        };
        editor.on('NodeChange', editorEventCallback);

        /* onSetup should always return the unbind handlers */
        return function (buttonApi) {
          editor.off('NodeChange', editorEventCallback);
        };
      },
    });
  });
  tinymce.DOM.addStyle(themeCustomization);
};

function realBackgroundColor(elem) {
  var transparent = 'rgba(0, 0, 0, 0)';
  var transparentIE11 = 'transparent';
  if (!elem) return transparent;

  var bg = getComputedStyle(elem).backgroundColor;
  if (bg === transparent || bg === transparentIE11) {
    return realBackgroundColor(elem.parentElement);
  } else {
    return bg;
  }
}
