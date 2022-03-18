import * as $ from 'jquery';
import { decode } from 'html-entities';
// import { message as msg } from "../utilities/Message";
import { TextChunk } from './TextChunk';

export class HtmlParagraphChunk extends TextChunk {
  protected p;
  public constructor(p) {
    super();
    this.p = p;
    this.processing = this.p.getAttribute('data-pk-processing');
    this.changed = this.p.getAttribute('data-pk-changed');
    this.lastHash = this.p.getAttribute('data-pk-hash');
    if (this.p.getAttribute('data-pk-init')) {
      this.setFailed(false);
      this.setChanged(false);
      this.setProcessing(false);
      this.setLastHash(null);
      this.p.removeAttribute('data-pk-init');
    }
  }

  public getElement() {
    return this.p;
  }

  public setText(text: string) {
    return (this.p.innerText = text);
  }

  public getText(): string {
    return decode(this.p.textContent.trim());
  }

  public setProcessing(processing: boolean): void {
    this.processing = processing;
    if (!processing) {
      this.p.removeAttribute('data-pk-processing');
    } else {
      // This removes highlights when chunk is processing
      this.removeOldHighlights();
      this.p.setAttribute('data-pk-processing', 'true');
    }
  }

  public isProcessing(): boolean {
    return this.processing;
  }

  public isChanged(): boolean {
    return this.changed;
  }

  public getLastHash(): string {
    return this.lastHash;
  }

  public setLastHash(newHash: string): void {
    this.lastHash = newHash;
    if (newHash == null) {
      this.p.removeAttribute('data-pk-hash');
    } else {
      this.p.setAttribute('data-pk-hash', newHash);
    }
  }

  public setFailed(failed: boolean): void {
    this.failed = failed;
    if (failed) {
      this.p.setAttribute('data-pk-unprocessed', true);
      this.p.setAttribute('data-tooltip', 'Při opravě odstavce došlo k chybě.');
      $(this.p).on('click', () => {
        this.p.removeAttribute('data-tooltip');
      });
      this.p.removeAttribute('data-pk-processing');
    } else {
      this.p.removeAttribute('data-pk-unprocessed');
      this.p.removeAttribute('data-tooltip');
    }
  }

  public setChanged(changed: boolean): void {
    this.changed = changed;
    if (changed) {
      this.p.setAttribute('data-pk-changed', 'true');
    } else {
      this.p.removeAttribute('data-pk-changed');
    }
  }
  public isEmpty() {
    return this.p.textContent.trim().length === 0;
  }

  public getToken(tokenId: number) {
    return $(this.p).find('.pk-token:eq(' + tokenId + ')');
  }

  public removeOldHighlights() {
    // msg('Clearing old highlights on paragraph "' + this.lastHash + '".');
    $(this.p).find('.pk-token').removeClass('pk-token-correction');
    $(this.p).find('.pk-token').off('click');
  }

  public markTokenForCorrection(token) {
    // msg('Added error class on token "' + token[0].innerText + '" of hash "' + this.lastHash + '".');
    if (token[0]) token[0].classList.add('pk-token-correction');
  }

  public getTokenCount(): number {
    return $(this.p).find('.pk-token').length;
  }

  public getTokenText(tokenId: number): string {
    return this.getToken(tokenId)[0].textContent;
  }

  public getTokens(): any[] {
    let tokens = [];
    $(this.p)
      .find('.pk-token')
      .each(function (i, token) {
        tokens.push(token);
      });
    return tokens;
  }

  public isMarkedForCorrection(token: any): boolean {
    return token.classList.contains('pk-token-correction');
  }
}
