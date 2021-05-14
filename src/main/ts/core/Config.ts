import { Config } from '../types/Config';
import { MessageImportance } from '../types/MessageImportance';

/**
 * Main configuration variable, contains options as well as global values.
 * See Config type description for more info.
 */
export let config: Config = {
  debug: MessageImportance.DEBUG,
  selection: null,
  textfield: null,
  windowmanager: null,
  mistakes: null,
};