import { Config } from '../types/Config';
import { Tagger } from '../types/Tagger';
import { Spellchecker } from '../types/Spellchecker';
import { MessageImportance } from '../types/MessageImportance';

/**
 * Main configuration variable, contains options as well as global values.
 * See Config type description for more info.
 */
export let config: Config = {
  tagger: Tagger.MAJKA,
  spellchecker: Spellchecker.DATAFILE,
  debug: MessageImportance.DEBUG,
  editor: null,
  mistakes: null,
};