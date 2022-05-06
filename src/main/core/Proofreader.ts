import * as md5 from 'md5';
// import { message as msg } from "./utilities/Message";
// import { MessageImportance as MI } from "./types/MessageImportance";

import { MistakeManager } from './correction/MistakeManager';
import { Config } from './types/Config';

import { processApiCall } from './process/ApiCall';
import { ProofreaderGui } from './gui/ProofreaderGui';

export class Proofreader {
  config: Config;
  autocorrectTrigger: NodeJS.Timeout;

  constructor(config: Config) {
    this.config = config;
    this.config.mistakes = new MistakeManager();
    this.config.proofreader = this;
  }

  initialize(gui: ProofreaderGui) {
    // msg("Initialization.");
    this.config.gui = gui;
    // msg("Proofreader was initialized.", MI.INFO);
    // Autocorrect periodically triggered
    // this.autocorrectTrigger = setInterval(() => {
    //   this.process();
    // }, 1000);
  }

  report(selection: string, context: string, note: string) {
    //TODO
  }

  /**
   * Goes through every paragraph and if it changed it sends it to the corrector API and call addCorrections with API output
   */
  process() {
    // Looping through paragraphs
    let wasAPICalled = false;
    this.config.gui.getChunks().forEach((chunk) => {
      if (chunk.isProcessing()) {
        // msg("Already processing. Processing skipped.");
        return;
      }
      // Skipping empty paragraphs
      if (chunk.isEmpty()) {
        // msg("Empty paragraph. Processing skipped.");
        chunk.setProcessing(false);
        chunk.setChanged(false);
        chunk.setFailed(false);
        chunk.setLastHash(null);
        return;
      }
      // Hashing for easier detection of changes and pointing in subsequent processes
      const hash = md5(chunk.getText());

      // Changes are not over, skipping paragraph
      if (chunk.getLastHash() !== hash) {
        // Copying current highlights before paragraph hash is altered.
        this.config.mistakes.copyMistakes(chunk.getLastHash(), hash);
        // Updating hash.
        chunk.setFailed(false);
        chunk.setLastHash(hash);
        chunk.setChanged(true);
        // msg('Paragraph with changed hash "' + hash + '" si still changing. Processing skipped.');
        // return;
      }

      // Skipping unchanged paragraph
      if (chunk.getLastHash() === hash && !chunk.isChanged()) {
        chunk.setChanged(false);
        // msg('Paragraph with unchanged hash "' + hash + " wasn't changed last time\". Processing skipped.");
        return;
      }
      chunk.setFailed(false);
      chunk.setChanged(false);
      this.config.gui.setProcessing(true);
      chunk.setProcessing(true);
      this.config.gui.setProcessingChunk(chunk);

      // Applying original highlights until the new api-call resolves itself.
      // chunk.highlightTokens();
      // Caling processing
      processApiCall(hash, chunk);
      wasAPICalled = true;
    });
    this.config.gui.wasAPICalled = wasAPICalled;
  }

  destroy() {
    clearInterval(this.autocorrectTrigger);
  }
}
