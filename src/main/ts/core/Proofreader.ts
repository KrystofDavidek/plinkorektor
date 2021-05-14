import * as md5 from 'md5';
import { message as msg } from './utilities/Message';
import { MessageImportance as MI } from '../types/MessageImportance';

import { MistakeManager } from './correction/MistakeManager';
import { Config } from '../types/Config';
import { WindowManager } from 'tinymce';
import { CursorManager } from '../types/CursorManager';


import { processApiCall } from './process/ApiCall';
import { guiHighlightTokens } from './gui/Tokens';

export class Proofreader {

    config: Config;
    autocorrectTrigger: NodeJS.Timeout;
    stylesheetLoader: () => void;

    constructor(config: Config, selection: CursorManager, windowmanager: WindowManager, stylesheetLoader: () => void = () => {}) {
        this.config = config;
        this.config.windowmanager = windowmanager;
        this.config.selection = selection;
        this.config.mistakes = new MistakeManager();
        this.stylesheetLoader = stylesheetLoader;
    }

    initialize(textfield) {
        msg('Initialization.');
        this.config.textfield = textfield;
        this.stylesheetLoader()
        msg('Proofreader was initialized.', MI.INFO);
        // Autocorrect periodically triggered
        this.autocorrectTrigger = setInterval(function () {
            this.process();
        }, 1000);
    }

    /**
     * Goes through every paragraph and if it changed it sends it to the corrector API and call addCorrections with API output
     */
    process() {
        const content = this.config.textfield.find('p');
        // Looping through paragraphs
        content.each((i, p) => {
            if(p.getAttribute('data-pk-init')) {
                p.removeAttribute('data-pk-hash');
                p.removeAttribute('data-pk-changed');
                p.removeAttribute('data-pk-processing');
                p.removeAttribute('data-pk-init');
            }
            if (p.getAttribute('data-pk-processing')) {
                msg('Already processing. Processing skipped.');
                return;
            }
            // Skipping empty paragraphs
            if (p.textContent.trim().length === 0) {
                msg('Empty paragraph. Processing skipped.');
                p.removeAttribute('data-pk-unprocessed');
                p.removeAttribute('data-tooltip');
                p.removeAttribute('data-pk-hash');
                p.removeAttribute('data-pk-changed');
                p.removeAttribute('data-pk-processing');
                return;
            }
            // Hashing for easier detection of changes and pointing in subsequent processes
            const hash = md5(p.textContent);
        
            // Changes are not over, skipping paragraph
            if (p.getAttribute('data-pk-hash') !== hash) {
                // Copying current highlights before paragraph hash is altered.
                this.config.mistakes.copyMistakes(p.getAttribute('data-pk-hash'), hash);
                // Updating hash.
                p.removeAttribute('data-pk-unprocessed');
                p.removeAttribute('data-tooltip');
                p.setAttribute('data-pk-hash', hash);
                p.setAttribute('data-pk-changed', "true");
                msg('Paragraph with changed hash "' + hash + '" si still changing. Processing skipped.');
                return;
            }
        
            // Skipping unchanged paragraph
            if (p.getAttribute('data-pk-hash') === hash && !p.getAttribute('data-pk-changed')) {
                p.removeAttribute('data-pk-changed');
                msg('Paragraph with unchanged hash "' + hash + ' wasn\'t changed last time". Processing skipped.');
                return;
            }
            p.removeAttribute('data-pk-unprocessed');
            p.removeAttribute('data-tooltip');
            p.removeAttribute('data-pk-changed');
            this.guiShowProcessingIndicator();
            p.setAttribute('data-pk-processing', "true");
        
            // Applying original highlights until the new api-call resolves itself.
            guiHighlightTokens(hash);
            // Call local regex corrections
            //processRegexAutocorrect(p);
            // Caling processing
            processApiCall(hash, p).always((ajaxCalls) => {
                console.log(ajaxCalls);
                if (ajaxCalls.length === 0) {
                    this.guiHideProcessingIndicator();
                }
            });
        });
    }

    /**
     * Displays indicator for processing.
     */
    guiShowProcessingIndicator() {
        msg('Processing indicator displayed.');
        this.config.textfield.attr('data-pk-processing', 'true');
    }

    /**
     * Hides indicator for processing.
     */
    guiHideProcessingIndicator() {
        this.config.textfield.removeAttr('data-pk-processing');
        msg('Processing indicator hidden.');
    }

    destroy() {
        clearInterval(this.autocorrectTrigger);
    }

}