import { MessageImportance } from './MessageImportance';
import { MistakeManager } from '../core/correction/MistakeManager';

export interface Config {
    // Global variables/constants
    debug: MessageImportance; // What severity of debug messages should be printed
    mistakes: MistakeManager|null; // The instance of the mistake manager,
    gui: ProofreaderGui;
}


