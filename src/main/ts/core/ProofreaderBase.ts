import { config } from './Config';

import { guiLoadMainStylesheet } from './gui/Css';

import { message as msg } from './Message';
import { MessageImportance as MI } from '../types/MessageImportance';

import { MistakeManager } from './correction/MistakeManager';
import { process } from './process/Process';

export const proofreaderBase = (editor) => {
    msg('Pre-initialization.');
    config.editor = editor;
    config.mistakes = new MistakeManager();

    editor.on('init', function () {
        msg('Initialization.');
        guiLoadMainStylesheet();
        msg('Editor was initialized.', MI.INFO);
        // Autocorrect periodically triggered
        autocorrectTrigger = setInterval(function () {
            process();
        }, 1000);
    });

    // Autocorrect triggered by editor change
    editor.on('remove', function () {
        clearInterval(autocorrectTrigger);
    });
};

export let autocorrectTrigger;