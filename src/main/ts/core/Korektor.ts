import { Hash } from './Hash';
import { Gui } from './Gui';

export const Korektor = (editor, url) => {
      
  Gui.toolbarButton.init(editor); 
    
  editor.on('init', function() {
      Gui.processing.init(editor);
      Gui.loadCss(editor, url);
  });

  var debug_mode = (editor.getParam('plinkorektor--debug', false) !== false);
  if (debug_mode) {console.log('PLINKOREKTOR: Initiated.');}

  ////////////////////////////////////////////////////////////////////////////////

  // Autocorrect triggered by editor change
  editor.off('Change');
  editor.on('Change', function() {
      Gui.processing.show(editor);
      autocorrect();
  });

  
  /**
   * Goes through every paragraph and if it changed it sends it to the corrector API and call addCorrections with API output
   */
  function autocorrect() {
      var content = editor.dom.select('p');
      // Looping through paragraphs
      content.forEach(function(p) {
        /*
          // Skipping empty paragraphs
          if ($(p).text().length === 0) {
              if (debug_mode) {console.log('PLINKOREKTOR: Empty paragraph. Processing skipped.');}
              $(p).removeAttr('data-pk-hash');
              return;
          }
          
          // Hashing for easier detection of changes and pointing in subsequent processes
          var hash = Hash($(p).text());

          // Skipping unchanged paragraphs
          if ($(p).attr('data-pk-hash') === hash) {
              if (debug_mode) {console.log('PLINKOREKTOR: Paragraph with unchanged hash "' + hash +'". Processing skipped.');}
              return;
          }
              
          // Updating hash
          var old_hash = $(p).attr('data-pk-hash');
          if (debug_mode) {console.log('PLINKOREKTOR: Paragraph with new hash "' + hash +'" (previously ' + ($(p).attr('data-pk-hash')===undefined ? 'undefined' : '"' + $(p).attr('data-pk-hash') + '"') + '). Started processing.');}
          $(p).attr('data-pk-hash', hash);
          $(editor).trigger('plinkorektor--new-hash', [hash, old_hash]);

          // Calling the corrector API
          $.ajax({
              type: 'POST',
              dataType: 'json',
              url: API_PATH,
              data: {
                  'text': $(p).text(),
                  'config': JSON.stringify(pk.apiConnection.config)
              },
              success: function(data) {
                  // Reporting invalid AJAX input status
                  if (!data['ok']) {
                      console.error('PLINKOREKTOR: Somethig went wrong on the server.');
                      return;
                  }

                  // Building tokens
                  var tokens = '';
                  data['tokens'].forEach(function(token) {
                      tokens += '<span class="pk-token">' + token + '</span>';
                  })
                  // Checking if paragraph with given hash was altered during tokenization.
                  var paragraph = editor.dom.select('p[data-pk-hash="' + hash + '"]');
                  var corrector_success = false;
                  paragraph.forEach(function(p) {
                      var hash = Hash($(p).text())

                      // If content was changed, do not insert tokens (& remove hash attribute)
                      if ($(p).attr('data-pk-hash') !== hash) {
                          if (debug_mode) {console.log('PLINKOREKTOR: Paragraph was altered during correction. Tokens insertion aborted. Hash "' + $(p).attr('data-pk-hash') + '" removed');}
                          $(p).removeAttr('data-pk-hash');
                          return;
                      }

                      // If content was not changed, insert tokens (& set success variable)
                      if (debug_mode) {console.log('PLINKOREKTOR: Paragraph with hash "' + $(p).attr('data-pk-hash') + '" was not altered during correction. Inserting tokens.');}
                      var bookmark = editor.selection.getBookmark(2, true);
                      $(p).html(tokens);
                      editor.selection.moveToBookmark(bookmark);
                      corrector_success = true;
                  });

                  // If tokenization was successful, trigger the tokenizer event
                  if (corrector_success) {
                      if (debug_mode) {console.log('PLINKOREKTOR: Token insertion successful, triggering "tokenized" event on hash "' + hash + '".');}
                      addCorrections(hash, data["mistakes"]);
                      return;
                  }

                  // Only debug message otherwise
                  if (debug_mode) {console.log('PLINKOREKTOR: Token insertion did not happen, "correction" event on hash "' + hash + '" was not triggered.');}

              },
              error: function() {
                  console.error('PLINKOREKTOR: AJAX request failed.');
              }
          });
          */
      });
  }

  /**
   * Adds all correction and calls renderCorrections afterwards
   * @param {*} hash MD5 hash of the paragraph
   * @param {*} mistakes Collection of mistakes
   */
  function addCorrections(hash, mistakes) {
      mistakes.forEach(function (mistake) {
          addCorrection(hash, mistake["highlights"], "unknown", "unknown", mistake["description"], mistake["corrections"] )
      })
      if (debug_mode) {console.log('PLINKOREKTOR: Called correction render on hash "' + hash + '".');}
      renderCorrections(hash);   
  }

  /**
   * Adds regular correction to the mix.
   * 
   * @param {string} hash MD5 hash of the paragraph
   * @param {int[]} tokens List of tokens to be highlighted
   * @param {string} type Type of mistake (spelling, grammar,...)
   * @param {string} module Name of the module which suggested this correction
   * @param {string} err_text Text to be displayed for correction
   * @param {object} err_rules Rules to apply when correction is accepted
   */
  function addCorrection(hash, tokens, type, module, err_text, err_rules) {
      if (debug_mode) {console.log('PLINKOREKTOR: Function addCorrection called by module "' + module + '" on hash "' + hash + '".');}
      var correction = {
          tokens: tokens,
          type: type,
          module: module,
          err_text: err_text,
          err_rules: err_rules
      };

      if (!_corrections.hasOwnProperty(hash)) {
          _corrections[hash] = [];
          if (debug_mode) {console.log('PLINKOREKTOR: Hash "' + hash + '" was not present in corrections dict, so it was added.');}
      }

      _corrections[hash].push(correction);
      if (debug_mode) {console.log('PLINKOREKTOR: Correction was added.');}
  }

  /**
   * Highlights tokens with suggested corrections.
   * 
   * @param {string} hash MD5 hash of the paragraph
   */
  function renderCorrections(hash) {
      // Checks if there are any corrections for given hash
      if (_corrections.hasOwnProperty(hash)) {
          if (debug_mode) {console.log('PLINKOREKTOR: Function renderCorrections called on hash "' + hash + '".');}

          // Adds corresponding highlights to tokens
          _corrections[hash].forEach(function(correction) {
              correction['tokens'].forEach(function(token) {
                  var token = editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token:eq(' + token + ')');
                  if (debug_mode) {console.log('PLINKOREKTOR: Added error class on token "' + token.innerText + '" of hash "' + hash + '".');}
                  
                  token.classList.add('pk-token-correction');
                  //$(token).addClass('pk-token-correction-' + correction.type);
              });
          });

          if (debug_mode) {console.log('PLINKOREKTOR CORRECTION MANAGER: Activating correction.');}

          // Calls to create corresponding dialog windows to highlighted tokens.
          activateCorrections(hash);
      }
      Gui.processing.hide(editor);
  }

  /**
   * Creates correction dialogs for highlighted tokens.
   * 
   * @param {string} hash MD5 hash of the paragraph
   */
  function activateCorrections(hash) {
    // Removes original left-click triggers on tokens
      // @todo remove
      //$(editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token')).off('click');


      // Binds tokens to corresponding correction dialogs
      editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token').forEach(function(token, i) {
          // Skip tokens with no correction bound
          if (!token.classList.contains('pk-token-correction')) {return;}  // <-- continue;

          // Creates dialog itself
          let current_corrections = [];
          _corrections[hash].forEach(function(correction) {
              // Skip if correction doesn't match token
              if (!correction.tokens.includes(i)) {return;}  // <-- continue;

              // Context displaying
              /// Get minimal and maximal highlighted token
              let minimal_token = Math.min.apply(null, correction.tokens);
              let maximal_token = Math.max.apply(null, correction.tokens);

              /// Display highlighted tokens and suitable context
              let helper_text = '';
              for (let i = Math.max(minimal_token-20, 0); i < Math.min(maximal_token+21,editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token').length); i++) {
                  if (correction.tokens.includes(i)) {helper_text += '<b>';}
                  helper_text += editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token:eq(' + i + ')').textContent;
                  if (correction.tokens.includes(i)) {helper_text += '</b>';}
              }
              
              /// Add ellipsis (…) if context is not matching start or end of the paragraph
              if (minimal_token-20 > 0) {helper_text = '…' + helper_text.trim();}
              if (maximal_token+21 < editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token').length) {
                  helper_text = helper_text.trim() + '…';
              }
              
              // Correction dialog displaying
              var suggestions = [{
                  type: 'container',
                  html: '<p style="font-weight:bold">'+ correction.err_text+'</p><p style="text-align: center">' + helper_text + '</p>'
              }];
              correction.err_rules.forEach(function (suggestion) {
                  suggestions.push(
                      {
                          type: 'button', 
                          name: 'correction',
                          value: JSON.stringify(suggestion.rules),
                          text: suggestion.description,
                          onclick: function(e) {
                              Object.entries(suggestion.rules).forEach(function([target, correctValue]) {
                                  editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token:eq(' + target + ')').textContent = correctValue;
                              })
                              tinymce.PluginManager.get('plinkorektor')(editor).autocorrect();
                              editor.windowManager.close();
                          }
                      }
                  )
              })


              current_corrections.push({
                  type: 'container',
                  layout: 'flex',
                  direction: 'column',
                  align: 'stretch',
                  items: suggestions
              });
          });
          /*
          $(token).click(function(e) {
              e.preventDefault();
              editor.windowManager.open({
                  title: 'Návrh na opravu',
                  body: current_corrections,
                  buttons: []
              });
          });
          */
      });
  }

  ////////////////////////////////////////////////////////////////////////////////
 
  /*
  $(editor).on('plinkorektor--new-hash' , function(event, hash, old_hash) {
      if (debug_mode) {console.log('PLINKOREKTOR: Clearing data on newly hashed paragraph "' + hash + ' (before "' + old_hash + '")".');}
      // Removing existing corrections of the hash
      if (typeof old_hash!=="undefined") {
          $(editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token')).removeClass('pk-token-correction');
          $(editor.dom.select('p[data-pk-hash="' + hash + '"] .pk-token')).off('contextmenu');

      if ($(editor.dom.select('p[data-pk-hash="' + old_hash + '"]')).length===0) {
        delete _corrections[old_hash];
      }
      }
      if (debug_mode) {console.log('PLINKOREKTOR: Clearing data on paragraph "' + hash + ' ended".');}
  });
  */

  ////////////////////////////////////////////////////////////////////////////////

  return {
      autocorrect: autocorrect,
      addCorrection: addCorrection,
      renderCorrections: renderCorrections
  };
}