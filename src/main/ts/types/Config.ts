import { MessageImportance } from './MessageImportance';
import { Editor } from './Editor';
import { MistakeManager } from '../core/correction/MistakeManager';

export interface Config {
    // Global variables/constants
    debug: MessageImportance; // What severity of debug messages should be printed
    editor: Editor|null; // The instance of the editor itself
    mistakes: MistakeManager|null; // The instance of the mistake manager
}