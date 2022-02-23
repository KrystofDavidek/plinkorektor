import { MessageImportance } from './MessageImportance';
import { MistakeManager } from '../correction/MistakeManager';
import { ProofreaderGui } from '../gui/ProofreaderGui';
import { Proofreader } from '../Proofreader';

export interface Config {
    // Global variables/constants
    debug: MessageImportance; // What severity of debug messages should be printed
    mistakes: MistakeManager|null; // The instance of the mistake manager,
    gui: ProofreaderGui;
    proofreader: Proofreader
}


