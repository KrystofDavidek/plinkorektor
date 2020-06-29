import { Tagger, TaggerName } from '../types/Tagger';
import { Spellchecker, SpellcheckerName } from '../types/Spellchecker';
import { Editor } from '../types/Editor';
import { Style } from '../assets/style.css';

interface GuiConfig {
  tagger: Tagger,
  spellchecker: Spellchecker,
}

let gui_config: GuiConfig = {
  tagger: Tagger.MAJKA,
  spellchecker: Spellchecker.DATAFILE,
}

export const Gui = {
  /**
     * Loads mandatory CSS file (highlighting words etc.)
     * 
     * @param {Editor} editor Instance of the editor
     * @param {string} url Base url for the plugin
     */
  loadCss: function (editor: Editor, url) {
    editor.dom.addStyle(Style);
  },

  /**
   * Aggregates information about processing message in the status bar 
   */
  processing: {
    /**
     * Initiates processing message field
     */
    init: function (editor) {
      let statusbar = editor.theme.panel && editor.theme.panel.find('#statusbar')[0];

      if (statusbar) {
        statusbar.insert({
          type: 'label',
          name: 'pk-processing',
          text: '',
          classes: 'pk-processing',
          disabled: editor.settings.readonly
        }, 0);

        // CSS file does not cover status bar
        let pk_processing = editor.theme.panel.find('#pk-processing')[0];
        pk_processing.$el.css('font-size', 'inherit');
        pk_processing.$el.css('padding', '8px 0');
        pk_processing.$el.css('text-transform', 'uppercase');
      }
    },

    show: function (editor) {
      editor.theme.panel.find('#pk-processing').text('probíhá kontrola pravopisu');
    },

    hide: function (editor) {
      editor.theme.panel.find('#pk-processing').text('');
    }
  },

  toolbarButton: {
    init: function (editor) {
      // Tagger
      const fireTaggerChange = function (editor, new_tagger) {
        gui_config.tagger = new_tagger;
        editor.fire('pk-tagger-change');
      }

      const toggleTagger = function (editor, api, tagger) {
        editor.on('pk-tagger-change', function (e) {
          api.setActive(gui_config.tagger == tagger);
        });
        api.setActive(gui_config.tagger == tagger);
      }

      editor.ui.registry.addNestedMenuItem('pk-tagger', {
        text: "Značkovač",
        getSubmenuItems: function() {
          return Object.values(Tagger).map(t => (
            {
              type: 'togglemenuitem',
              text: TaggerName[t],
              onAction: function() { fireTaggerChange(editor, t); },
              onSetup: function (api) { toggleTagger(editor, api, t); },
            }
          ));
        }
      });

      // Spellchecker

      const fireSpellcheckerChange = function (editor, new_spellchecker) {
        gui_config.spellchecker = new_spellchecker;
        editor.fire('pk-spellchecker-change');
      }
 
      const toggleSpellchecker = function (editor, api, spellchecker) {
        editor.on('pk-spellchecker-change', function (e) {
          api.setActive(gui_config.spellchecker == spellchecker);
        });
        api.setActive(gui_config.spellchecker == spellchecker);
      }

      editor.ui.registry.addNestedMenuItem('pk-spellchecker', {
        text: "Kontrola překlepů",
        getSubmenuItems: function() {
          return Object.values(Spellchecker).map(s => (
            {
              type: 'togglemenuitem',
              text: SpellcheckerName[s],
              onAction: () => fireSpellcheckerChange(editor, s),
              onSetup: (api) => toggleSpellchecker(editor, api, s),
            }
          ));
        }
      });
    }
  }
}