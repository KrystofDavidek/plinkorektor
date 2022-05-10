import { config } from '../Config';
// import { message as msg } from "../utilities/Message";
import * as md5 from 'md5';
import { Mistake } from './Mistake';

export abstract class TextChunk {
  protected processing: boolean;
  protected failed: boolean;
  protected changed: boolean;
  protected lastHash: string;

  abstract getElement(): any;
  abstract getText(): string;
  abstract getLastHash(): string;
  abstract setLastHash(newHash: string): void;
  abstract setProcessing(val: boolean): void;
  abstract setFailed(val: boolean): void;
  abstract setChanged(changed: boolean): void;
  abstract isProcessing(): boolean;
  abstract isChanged(): boolean;
  abstract isEmpty(): boolean;
  abstract getToken(tokenId: number): any;
  abstract getTokenText(tokenId: number): string;
  abstract getTokenCount(): number;
  abstract getTokens(): any[];
  abstract removeOldHighlights(): void;
  abstract markTokenForCorrection(token: any, mistakeId?): void;
  abstract isMarkedForCorrection(token: any): boolean;

  /**
   * Highlights tokens with suggested corrections.
   *
   * @param {string} hash MD5 hash of the paragraph
   */
  public highlightTokens() {
    // Clear old highlights
    this.removeOldHighlights();
    config.mistakes.autoremove();

    // Get mistakes from the manager
    const mistakes = config.mistakes.getMistakes(this.lastHash);

    // Highlight correct tokens
    // msg('Building new highlights on paragraph "' + this.lastHash + '".');
    mistakes.forEach((mistake) => {
      const highlights = mistake.getTokens();
      highlights.forEach((tokenId) => {
        const token = this.getToken(tokenId);
        this.markTokenForCorrection(token, mistake.getId());
      });
    });
    // Binds tokens to corresponding correction dialogs
    this.getTokens().forEach((token, pos) => {
      // Skip tokens with no correction bound
      if (!this.isMarkedForCorrection(token)) {
        return;
      } // <-- continue;
      config.gui.visualizeMistakes(this, pos, token);
    });
  }

  createTokens(tokens: string[]) {
    // Checking if paragraph with given hash was altered during tokenization.
    try {
      //   const content = this.getElement();
      let tokenizationSuccess = false;
      const newHash = md5(this.getText());

      // If content was changed, do not insert tokens (& remove hash attribute)
      if (this.getLastHash() !== newHash) {
        // msg('Paragraph was altered during correction. Tokens insertion aborted. Hash "' + $(content).attr('data-pk-hash') + '" removed');
        this.setLastHash(null);

        // If content was not changed, insert tokens (& set success variable)
      } else {
        // msg('Paragraph with hash "' + this.getLastHash() + '" was not altered during correction. Inserting tokens.');
        config.gui.cleanTokens(this);

        // calculate token positions
        let tokenPos: { from: number; to: number }[] = [];
        let charCount = 0;
        for (let token of tokens) {
          tokenPos.push({
            from: charCount,
            to: charCount + token.length - 1,
          });
          charCount += token.length;
        }

        const bookmark = config.gui.getBookmark();
        config.gui.wrapTokens(this, tokens, tokenPos);
        config.gui.moveToBookmark(bookmark);
        tokenizationSuccess = true;
      }

      // Debug messages
      if (tokenizationSuccess) {
        // msg('Token insertion successful on hash "' + this.lastHash + '".');
      } else {
        // msg('Token insertion did not happen on hash "' + this.lastHash + '".');
      }

      // Return
      return tokenizationSuccess;
    } catch (err) {
      throw new Error(err);
    }
  }

  getContext(mistake: Mistake) {
    // Get minimal and maximal highlighted token
    const minimalToken = Math.min.apply(null, mistake.getTokens());
    const maximalToken = Math.max.apply(null, mistake.getTokens());

    // Define boundaries
    const minimalBoundary = Math.max(minimalToken - 20, 0);
    const maximalBoundary = Math.min(maximalToken + 21, this.getTokenCount());

    // Display highlighted tokens and suitable context
    let helperText = '';
    for (let j = minimalBoundary; j < maximalBoundary; j++) {
      if (mistake.getTokens().includes(j)) {
        helperText += config.gui.wrapMistakeContext(this, j);
      } else {
        helperText += this.getTokenText(j);
      }
    }

    // Add ellipsis (…) if context is not matching start or end of the paragraph
    if (minimalBoundary > 0) {
      helperText = '…' + helperText.trim();
    }
    if (maximalBoundary < this.getTokenCount()) {
      helperText = helperText.trim() + '…';
    }

    return helperText;
  }
}
