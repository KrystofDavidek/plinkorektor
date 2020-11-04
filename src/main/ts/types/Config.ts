import { Tagger } from './Tagger';
import { Spellchecker } from './Spellchecker';
import { MessageImportance } from './MessageImportance';
import { Editor } from './Editor';
import { MistakeManager } from '../core/correction/MistakeManager';

export interface Config {
    // Options
    tagger: Tagger; // Which tagger should be used within proofreader
    spellchecker: Spellchecker; // Which spellchecker variant should be used

    // Global variables/constants
    debug: MessageImportance; // What severity of debug messages should be printed
    editor: Editor|null; // The instance of the editor itself
    mistakes: MistakeManager|null; // The instance of the mistake manager
}