import { MessageImportance } from './MessageImportance';
import { MistakeManager } from '../core/correction/MistakeManager';
import { WindowManager } from 'tinymce';
import { CursorManager } from './CursorManager';

export interface Config {
    // Global variables/constants
    debug: MessageImportance; // What severity of debug messages should be printed
    selection: CursorManager|null;
    windowmanager: WindowManager| null;
    textfield: JQuery;
    mistakes: MistakeManager|null; // The instance of the mistake manager
}


