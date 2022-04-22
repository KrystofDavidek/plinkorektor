import { ProofreaderGui, HtmlParagraphChunk, parseEl, ParsedHtml, config, Mistake } from '../core';
import { About, TokensInfo } from 'src/demo/ts/models';
import { cssMistakeBadValue } from '../../../assets/editor-styles';
import * as _ from 'lodash';
import { getRawEditorContent } from './Plugin';
import { addMistakeHighlight, closePopover, removeMistakeHighlight, setHovers } from './utils';

export class TinyMceGui extends ProofreaderGui {
  private editor;
  private processingPars: number[] = [];
  private tokensInfo: TokensInfo = {};
  private tokensToIgnore: string[] = [];

  constructor(editor, stylesheetLoader: () => void = () => {}) {
    super();
    this.editor = editor;
    this.processing = $(this.editor.dom.select('html')[0]).attr('data-pk-processing');
    stylesheetLoader();
  }

  public setProcessing(processing: boolean) {
    if (processing) {
      this.resetMistakesCol();
      // msg('Processing indicator displayed.');
      $(this.editor.dom.select('html')[0]).removeAttr('data-pk-processing-finished');
      $(this.editor.dom.select('html')[0]).attr('data-pk-processing', 'true');
      $('.tox-tbtn').prop('disabled', true);
      $('.tox-tbtn').removeClass('tox-tbtn--active');
    } else {
      $(this.editor.dom.select('html')[0]).removeAttr('data-pk-processing');
      $(this.editor.dom.select('html')[0]).attr('data-pk-processing-finished', 'true');
      $('.tox-tbtn').prop('disabled', false);
      $('.tox-tbtn').addClass('tox-tbtn--active');
      // msg('Processing indicator hidden.');
    }
    this.processing = processing;
  }

  public setProcessingChunk(chunk: HtmlParagraphChunk) {
    // after specific paragraph is starting to process, remove corresponding cards and popovers
    const parId = this.getParId(chunk);
    $(`[id$="-${parId}"]`).remove();
    // Disable closing popovers when par is processing
    // chunk.getTokens().forEach((token) => {
    //   closePopover(token);
    // });
    this.processingPars.push(parId);
    this.onListChanged();
  }

  public setProcessingFinishedChunk(chunk: HtmlParagraphChunk) {
    const parId = this.getParId(chunk);
    this.processingPars = this.processingPars.filter((par) => par !== parId);
  }

  public isProcessing(): boolean {
    return this.processing;
  }

  public getChunks(): HtmlParagraphChunk[] {
    let content = $(this.editor.dom.select('html')[0]).find('p');
    let chunks: HtmlParagraphChunk[] = [];
    content.each((i, p) => {
      chunks.push(new HtmlParagraphChunk(p));
    });
    if (!this.editor.getContent()) {
      this.tokensInfo = {};
      this.resetMistakesCol();
    }
    return chunks;
  }

  public wrapTokens(chunk: HtmlParagraphChunk, tokens: string[], tokenPos: { from: number; to: number }[]) {
    let parsedHtml: ParsedHtml = parseEl($(chunk.getElement()));
    tokens.forEach(function (token, index) {
      parsedHtml.wrapToken(tokenPos[index].from, tokenPos[index].to, token);
    });
    $(chunk.getElement()).html(parsedHtml.getHtml());
  }

  public cleanTokens(chunk: HtmlParagraphChunk): void {
    $(chunk.getElement())
      .find('.pk-token')
      .replaceWith(function () {
        return $(this).contents();
      });
  }

  public getBookmark() {
    return this.editor.selection.getBookmark();
  }

  public moveToBookmark(bookmark) {
    this.editor.selection.moveToBookmark(bookmark);
  }

  public wrapMistakeContext(chunk: HtmlParagraphChunk, tokenId: number): string {
    return '<span style="' + cssMistakeBadValue + '">' + chunk.getTokenText(tokenId) + '</span>';
  }

  deleteOldTokens(chunk, parId) {
    const posToDelete = [];
    if (!this.tokensInfo[parId]) return;
    const tokenCorrections = $(chunk.getElement()).find('.pk-token-correction');
    Object.entries(this.tokensInfo[parId]).forEach(([pos, info]) => {
      let exist = false;
      $.each(tokenCorrections, function (key, value) {
        if (value.textContent === info.token) {
          exist = true;
          return false;
        }
      });
      if (!exist) {
        posToDelete.push(pos);
      }
    });
    if (posToDelete.length > 0) {
      posToDelete.forEach((pos) => {
        this.tokensInfo[parId] = _.omit(this.tokensInfo[parId], pos);
        $(`#${pos}-${parId}`).remove();
      });
    }
  }

  public visualizeMistakes(chunk: HtmlParagraphChunk, pos: number, token) {
    if (this.tokensToIgnore.includes($(token).text())) {
      $(token).removeClass('pk-token-correction');
      return;
    }

    const parId = this.getParId(chunk);
    this.deleteOldTokens(chunk, parId);
    if (!this.initToken(chunk.getToken(pos).text(), token, pos, parId, chunk)) {
      return;
    }
    this.createFixAllHandler();
    this.onListChanged();

    config.mistakes.getMistakes(chunk.getLastHash()).forEach((mistake) => {
      if (!mistake.getTokens().includes(pos)) {
        return;
      }
      this.pushValueToTokensInfo('mistakes', mistake, pos, parId);
    });

    $('.mistakes').append(this.createCard(pos, parId));
    this.sortCards();
    this.createFixHandler(chunk, token, pos, parId);
    this.createIgnoreHandler(chunk, token, pos, parId);
    if (chunk.getToken(pos).text().length > 1) {
      this.setPopover(token, pos, parId);
      setHovers(token, pos, parId, true);
    } else {
      setHovers(token, pos, parId, false);
    }
    this.onListChanged();
  }

  sortCards() {
    const mylist = $('.mistakes');
    const listitems = mylist.children('div').get();
    listitems.sort(function (a, b) {
      const compA = Number($(a).attr('id').split('-')[1]);
      const compB = Number($(b).attr('id').split('-')[1]);
      return compA < compB ? -1 : compA > compB ? 1 : 0;
    });
    $.each(listitems, function (idx, itm) {
      mylist.append(itm);
    });
  }

  protected fixMistake(chunk: HtmlParagraphChunk, mistakeId: string, correctionRules) {
    Object.entries(correctionRules).forEach(([target, correctValue]: [any, string]) => {
      // TODO SMARTER WAY TO REPLACE TOKENS (USE ENGINE FOR PARSING)
      if (!$(chunk.getToken(target))[0]) return;
      let originalContent: string = $(chunk.getToken(target))[0].innerHTML;
      let contentParts = originalContent.replace(/(<[^(><.)]+>)/g, '|<>|$1|<>|').split('|<>|');
      let modifiedContentParts = contentParts.map((part) => {
        if (!part.match(/(<[^(><.)]+>)/)) {
          let newVal = correctValue.length > part.length ? correctValue.substring(0, part.length) : correctValue;
          correctValue = correctValue.length > part.length ? correctValue.slice(part.length) : '';
          return newVal;
        }
        return part;
      });
      if (correctValue.length > 0) {
        modifiedContentParts.push(correctValue);
      }
      let newContent = modifiedContentParts.join('');
      $(chunk.getToken(target))[0].innerHTML = newContent;
    });

    // Remove mistake record to hide it afterwards.
    config.mistakes.removeMistake(chunk.getLastHash(), mistakeId);
    // Save current content of editor
    localStorage.setItem('content', getRawEditorContent(this.editor));
  }

  getParId(chunk: HtmlParagraphChunk): number {
    let parId = -1;
    const content = $(this.editor.dom.select('html')[0]).find('p');
    content.each((i, p) => {
      if (chunk.getElement() === p) {
        parId = i;
        return;
      }
    });
    return parId;
  }

  isValueSet(atr: string, pos: number, parId: number) {
    if (Array.isArray(this.tokensInfo[parId][pos][atr])) {
      return this.tokensInfo[parId][pos][atr].length > 0;
    } else {
      return !!this.tokensInfo[parId][pos][atr];
    }
  }

  initToken(token, htmlToken, pos: number, parId: number, chunk): boolean {
    if (!this.tokensInfo.hasOwnProperty(parId)) {
      this.tokensInfo[parId] = {};
    }
    // Not create new info when token is corrected
    if ($(htmlToken).hasClass('pk-token-correction-fixed') || !$(htmlToken).hasClass('pk-token-correction')) {
      return false;
    }
    this.tokensInfo[parId][pos] = {
      chunk: chunk,
      token: token,
      htmlToken: htmlToken,
      mistakes: [],
    };
    return true;
  }

  setValueToTokensInfo(atr: string, value: any, pos: number, parId: number) {
    if (!this.isValueSet(atr, pos, parId)) {
      this.tokensInfo[parId][pos][atr] = value;
    }
  }

  pushValueToTokensInfo(atr: string, value: any, pos: number, parId: number) {
    this.tokensInfo[parId][pos][atr].push(value);
  }

  getTokenInfo(pos: number, parId: number) {
    return this.tokensInfo[parId][pos];
  }

  getValueFromTokensInfo(atr: string, pos: number, parId: number) {
    if (this.tokensInfo[parId][pos][atr]) {
      return this.tokensInfo[parId][pos][atr];
    }
  }

  getValueFromMistakeObj(atr: string, pos: number, parId: number, mistakeIndex: number) {
    if (this.tokensInfo[parId][pos].mistakes[mistakeIndex][atr]) {
      return this.tokensInfo[parId][pos].mistakes[mistakeIndex][atr];
    }
  }

  getAllMistakesIds(pos: number, parId: number) {
    const ids: string[] = [];
    if (this.tokensInfo[parId][pos].mistakes[0]) {
      this.tokensInfo[parId][pos].mistakes.forEach((mistake) => {
        ids.push(mistake.getId());
      });
    }
    return ids;
  }

  resetMistakesCol() {
    let isEmpty: boolean = true;
    Object.values(this.tokensInfo).forEach((val) => {
      if (Object.keys(val).length > 0) isEmpty = false;
    });
    if (isEmpty) {
      $('.mistakes').empty();
      this.onListChanged();
    }
  }

  fix(chunk, token, pos, parId, isIgnore = false) {
    if (!this.tokensInfo[parId][pos]) return;
    $(`#${pos}-${parId}`).remove();
    if (!$(token).text()) {
      $(token).text(chunk.getToken(pos).text());
    }
    // ! Has to change index to fix
    const correction = this.getValueFromMistakeObj('corrections', pos, parId, 0)[0];
    const ids = this.getAllMistakesIds(pos, parId);
    this.tokensInfo[parId] = _.omit(this.tokensInfo[parId], pos);
    $(token).removeClass('pk-token-correction');
    if (!isIgnore) $(token).addClass('pk-token-correction-fixed');
    removeMistakeHighlight(pos, token, parId);
    if (isIgnore) {
      const textToken = $(token).text();
      this.disableOtherTokens(textToken);
      if (!this.tokensToIgnore.includes(textToken)) this.tokensToIgnore.push(textToken);
      for (const id of ids) {
        this.ignoreMistake(chunk, id);
      }
    } else {
      if (correction) {
        this.fixMistake(chunk, correction.id, correction.rules);
      } else {
        $(token).removeClass('pk-token-correction-fixed');
      }
    }
    this.onListChanged();
  }

  disableOtherTokens(tokenString: string) {
    Object.entries(this.tokensInfo).forEach(([parId, par]) => {
      Object.entries(par).forEach(([pos, info]) => {
        if (info.token === tokenString) {
          closePopover(info.htmlToken);
          $(`#${pos}-${parId}`).remove();
          this.onListChanged();
        }
      });
    });
  }

  createFixHandler(chunk, token, pos, parId) {
    $(document).off('click', `#${pos}-${parId}-fix`);
    $(document).on('click', `#${pos}-${parId}-fix`, () => {
      closePopover(token);
      this.fix(chunk, chunk.getToken(Number(pos)), pos, parId);
      this.editor.undoManager.add();
      config.proofreader.process();
    });
  }

  onListChanged() {
    const size = $('.mistakes').children().length;
    if (size === 0) {
      $('#fix-all').hide();
    } else {
      $(`#fix-all`).show().css('display', 'block');
    }
  }

  createIgnoreHandler(chunk, token, pos, parId) {
    $(document).off('click', `#${pos}-${parId}-ignore`);
    $(document).on('click', `#${pos}-${parId}-ignore`, () => {
      closePopover(token);
      this.fix(chunk, chunk.getToken(Number(pos)), pos, parId, true);
    });
  }

  createFixAllHandler() {
    $(`#fix-all`).off('click');
    $(`#fix-all`).on('click', () => {
      for (const parId in this.tokensInfo) {
        // Disable fix all to already processing par
        // if (!this.processingPars.includes(Number(parId))) {
        // }
        for (const pos in this.tokensInfo[parId]) {
          const token = this.tokensInfo[parId][pos].htmlToken;
          closePopover(token);
          this.fix(this.tokensInfo[parId][pos].chunk, token, pos, parId);
        }
      }
      this.onListChanged();
      this.editor.undoManager.add();
      config.proofreader.process();
    });
  }

  setPopover(token, pos, parId) {
    $(token).attr({
      'data-toggle': 'popover',
      'data-placement': 'bottom',
      'data-content': this.createPopoverContent(pos, parId),
    });

    ($(token) as any)
      .popover({
        trigger: 'manual',
        animation: true,
        html: true,
        container: '.tox-edit-area',
      })
      .on('mouseenter', function () {
        // Cases when highlights are removed when multiple corrections are performed
        if (!$(token).hasClass('pk-token-correction')) return;

        const _this = this;
        ($(this) as any).popover('show');
        addMistakeHighlight(pos, token, parId);
        $('.popover').on('mouseleave', function () {
          ($(_this) as any).popover('hide');
          removeMistakeHighlight(pos, token, parId);
        });
      })
      .on('mouseleave', function () {
        const _this = this;
        setTimeout(function () {
          if (!$('.popover:hover').length) {
            ($(_this) as any).popover('hide');
            removeMistakeHighlight(pos, token, parId);
          }
        }, 1);
      });
  }

  createCard(pos: number, parId: number) {
    const mistakes: Mistake[] = this.getValueFromTokensInfo('mistakes', pos, parId);
    // primaryMistakeIndex;
    const i = this.getPrimaryMistakeIndex(mistakes);
    const isCorrection = this.correctionExists(pos, parId, i);
    if (isCorrection) {
      if ($(`#${pos}-${parId}`).length || this.isTokenEqualToCorrection(pos, parId, i)) return;
    }
    if (this.cardWithSameMistakeIdExists(mistakes[i].getId())) return;

    const mainDesc = mistakes[i].getDescription();
    const token = this.getValueFromTokensInfo('token', pos, parId);
    const mistakenPart = this.createMistakePart(token);
    let mainCorrectionPart = '';
    let secondaryDesc = '';
    if (isCorrection) {
      mainCorrectionPart = mistakes[i]['corrections'][0]['rules'][pos];
      secondaryDesc = mistakes[i]['corrections'][0]['description'];
    }
    const abouts: About[] = mistakes[i].getAbout();

    return `
    <div id="${pos}-${parId}" data-id=${mistakes[i].getId()} class="mistake p-3 mb-5 bg-white rounded">
      ${mainDesc ? `<h4>${mainDesc}</h4><hr/>` : ''}
      ${
        mistakenPart && mainCorrectionPart
          ? `${mistakenPart}
          <img class="arrow-icon" src="assets/icons/arrow-right.svg" alt="Arrow">
          <span class="correct-text">${mainCorrectionPart}</span>`
          : `${secondaryDesc ? `<p>${secondaryDesc}</p>` : ''}`
      }
      <div class=action-buttons>
        ${
          isCorrection
            ? `<button id="${pos}-${parId}-fix" type="button" class="button fix-button">Opravit</button>`
            : ''
        } 
        <button id="${pos}-${parId}-ignore" type="button" class="button">Neopravovat</button>
      </div>
      <button type="button" data-toggle="collapse" data-target="#collapse${pos}-${parId}" aria-expanded="false"  aria-controls="collapse${pos}-${parId}" class="btn btn-link show-more">Zobrazit více</button>
      <div class="collapse" id="collapse${pos}-${parId}">
        <div class="card card-body">
           ${
             abouts.length > 0
               ? `<p><span class="correct-text">${abouts[0].label}: </span><a href="${abouts[0].url}">${abouts[0].url}</a></p>`
               : ''
           }
        </div>
      </div>
    </div>
    `;
  }

  getPrimaryMistakeIndex(mistakes: Mistake[]) {
    if (mistakes.length > 1) {
      let counter = 0;
      for (const mistake of mistakes) {
        if (mistake.getType() && !mistake.getType().startsWith('spelling')) {
          return counter;
        }
        counter++;
      }
    }
    return 0;
  }

  createPopoverContent(pos, parId) {
    const mistakes: Mistake[] = this.getValueFromTokensInfo('mistakes', pos, parId);
    const i = this.getPrimaryMistakeIndex(mistakes);

    if (!this.correctionExists(pos, parId, i)) return;
    if (this.isTokenEqualToCorrection(pos, parId, i)) return;

    // Check if exists correction with same position in par
    if (!this.getValueFromMistakeObj('corrections', pos, parId, i)[0]['rules'][pos]) return;

    return `
    <div id="${pos}-${parId}-pop" class="popover-body">
      <div id="${pos}-${parId}-fix" class="popover-text">${
      this.getValueFromMistakeObj('corrections', pos, parId, i)[0]['rules'][pos]
    }</div>
      <div class="popover-icons">
        <img id="${pos}-${parId}-fix" class="check icon" data-toggle="tooltip" data-placement="top" title="Opravit" src="assets/icons/check2.svg" alt="Check">
        <img id="${pos}-${parId}-ignore" class="cancel icon" data-toggle="tooltip" data-placement="top" title="Neopravovat" src="assets/icons/x.svg" alt="Remove">
      </div>
    </div>
  `;
  }

  createMistakePart(stringToken: string) {
    return stringToken && stringToken.trim().length > 2
      ? `<span class="mistake-text"><strike>${stringToken}</strike></span>`
      : '';
  }

  isTokenEqualToCorrection(pos, parId, mistakeIndex) {
    const token = this.getValueFromMistakeObj('token', pos, parId, mistakeIndex);
    const correction = this.getValueFromMistakeObj('corrections', pos, parId, mistakeIndex)[0]['rules'][pos];

    if (!token || !correction) return false;
    return token === correction;
  }

  correctionExists(pos, parId, mistakeIndex) {
    return this.getValueFromMistakeObj('corrections', pos, parId, mistakeIndex).length > 0;
  }

  cardWithSameMistakeIdExists(id) {
    return $(`[data-id="${id}"]`).length > 0;
  }
}
