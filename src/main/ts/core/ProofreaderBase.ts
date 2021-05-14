import { config } from './Config';

import { message as msg } from './utilities/Message';
import { MessageImportance as MI } from '../types/MessageImportance';

import { MistakeManager } from './correction/MistakeManager';
import { process } from './process/Process';
import { Config } from '../types/Config';
import { WindowManager } from 'tinymce';
import { CursorManager } from '../types/CursorManager';
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
        config.textfield = textfield;
        this.stylesheetLoader()
        msg('Editor was initialized.', MI.INFO);
        // Autocorrect periodically triggered
        this.autocorrectTrigger = setInterval(function () {
            process();
        }, 1000);
    }

    destroy() {
        clearInterval(this.autocorrectTrigger);
    }

}