import { Correction } from './../core/correction/Correction';
import { ProofreaderGui, HtmlParagraphChunk, parseEl, ParsedHtml, config, Mistake } from '../core';
import { About, TokensInfo } from 'src/demo/ts/models';
import { cssMistakeBadValue } from '../../../assets/editor-styles';
import * as _ from 'lodash';
import { getRawEditorContent } from './Plugin';
import { addMistakeHighlight, closePopover, removeMistakeHighlight, setHovers } from './utils';
import { isMistakeToAutocorrect } from '../core/process/RegexProcess';

export class TinyMceGui extends ProofreaderGui {
  private editor;
  private processingPars: number[] = [];
  private tokensInfo: TokensInfo = {};
  private tokensToIgnore: string[] = [];
  private autocorrectedTokens: string[] = [];

  constructor(editor, stylesheetLoader: () => void = () => {}) {
    super();
    this.editor = editor;
    this.processing = $(this.editor.dom.select('html')[0]).attr('data-pk-processing');
    $('#delete-content').on('click', () => {
      localStorage.setItem('content', '<p></p>');
      this.editor.setContent('<p><p/>');
      this.tokensInfo = {};
      this.resetMistakesCol();
    });
    $(document).on('click', '#process', () => {
      config.proofreader.process();
      if (!this.wasAPICalled) this.showToast();
    });
    $(document).on('keydown', (e) => {
      if (e.shiftKey && e.which == 13) {
        $('#process').click();
      }
    });
    stylesheetLoader();
  }

  public showToast() {}

  public setProcessing(processing: boolean) {
    const $editor = $(this.editor.dom.select('html')[0]);
    if (processing) {
      this.resetMistakesCol();
      // msg('Processing indicator displayed.');
      $editor.removeAttr('data-pk-processing-finished');
      $editor.attr('data-pk-processing', 'true');
      $editor.animate({ scrollTop: 0 }, 500);
      $editor.addClass('disable-overflow');
      if ($editor.children('.loader-container').length === 0) {
        $('<div class="loader-container"><div class="loader"></div></div>').hide().prependTo($editor).fadeIn(500);
      }
      $editor.children('.mce-content-body').addClass('disable-editor');
      this.editor.setMode('readonly');
      this.setDisabling(true);
    } else {
      $editor.children('.loader-container').fadeOut(500, function () {
        $(this).remove();
      });
      this.autocorrectedTokens = [];
      $editor.children('.mce-content-body').removeClass('disable-editor');
      $editor.removeAttr('data-pk-processing');
      $editor.attr('data-pk-processing-finished', 'true');
      $editor.removeClass('disable-overflow');
      this.editor.setMode('design');
      this.setDisabling(false);
    }
    this.processing = processing;
  }

  private setDisabling(isDisable: boolean) {
    if (isDisable) {
      $('.to-disable').addClass('disable');
      $('.mistakes').hide(500);
      $('.tox-tbtn').removeClass('tox-tbtn--active');
    } else {
      $('.to-disable').removeClass('disable');
      $('.mistakes').show(500);
      $('.tox-tbtn').addClass('tox-tbtn--active');
    }
    $('.tox-tbtn').prop('disabled', isDisable);
    $('#process').prop('disabled', isDisable);
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

    config.mistakes.getMistakes(chunk.getLastHash()).forEach((mistake) => {
      if (!mistake.getTokens().includes(pos)) {
        return;
      }
      if (isMistakeToAutocorrect(mistake)) {
        const correction: Correction = mistake.getCorrections()[0];
        if (correction) {
          const rules = _.cloneDeep(correction.getRules());
          for (const rule of Object.keys(rules)) {
            if (!this.autocorrectedTokens.includes(rule)) {
              this.autocorrectedTokens.push(rule);
            } else {
              delete rules[rule];
            }
          }
          $(token).removeClass('pk-token-correction');
          removeMistakeHighlight(pos, token, parId);
          this.fixMistake(chunk, correction.getId(), rules);
          return;
        }
      }
      if (mistake?.getType()?.startsWith('agreement') && mistake?.getTokens()?.indexOf(pos) > 0) {
        return;
      }
      this.pushValueToTokensInfo('mistakes', mistake, pos, parId);
    });

    if (this.getValueFromTokensInfo('mistakes', pos, parId).length === 0) {
      return;
    }
    this.createFixAllHandler();
    $('.mistakes').append(this.createCard(pos, parId));
    this.sortCards();
    this.createFixHandler(chunk, token, pos, parId);
    this.createIgnoreHandler(chunk, token, pos, parId);
    // For correct highlighting mistakes with multiple tokens
    const firsMistakeId = this.getValueFromTokensInfo('mistakes', pos, parId)[0].getId();
    if (chunk.getToken(pos).text().length > 1) {
      this.setPopover(token, pos, parId, chunk, firsMistakeId);
      setHovers(token, pos, parId, true, chunk, firsMistakeId);
    } else {
      setHovers(token, pos, parId, false, chunk, firsMistakeId);
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
    if (this.tokensInfo[parId] && this.tokensInfo[parId][pos] && this.tokensInfo[parId][pos][atr]) {
      return this.tokensInfo[parId][pos][atr];
    } else {
      return undefined;
    }
  }

  getValueFromMistakeObj(atr: string, pos: number, parId: number, mistakeIndex: number) {
    if (
      this.tokensInfo[parId][pos].mistakes &&
      this.tokensInfo[parId][pos].mistakes[mistakeIndex] &&
      this.tokensInfo[parId][pos].mistakes[mistakeIndex][atr]
    ) {
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

  fix(chunk: HtmlParagraphChunk, token, pos, parId, isIgnore = false, mistakeId = 0, correctionId = 0) {
    if (!this.tokensInfo[parId][pos]) return;
    $(`#${pos}-${parId}`).remove();
    if (!$(token).text()) {
      $(token).text(chunk.getToken(pos).text());
    }

    const mistakes = this.sortMistakes(this.getValueFromTokensInfo('mistakes', pos, parId));
    const corrections = mistakes[mistakeId]?.corrections;
    const correction = corrections?.length > 0 ? corrections[correctionId] : undefined;

    const ids = this.getAllMistakesIds(pos, parId);
    this.tokensInfo[parId] = _.omit(this.tokensInfo[parId], pos);
    $(token).removeClass('pk-token-correction');
    if (!isIgnore) $(token).addClass('pk-token-correction-fixed');
    const tokenMistakeId = $(token).attr('data-id');
    removeMistakeHighlight(pos, token, parId, chunk, tokenMistakeId);
    if (isIgnore) {
      const textToken = $(token).text();
      const mistake = config.mistakes.getMistake(chunk.getLastHash(), tokenMistakeId);
      if (!this.tokensToIgnore.includes(textToken) && !mistake?.getType().startsWith('agreement')) {
        // If not disabling, ignoring another tokens after another correction has to be done
        this.disableOtherTokens(textToken);
        this.tokensToIgnore.push(textToken);
      }
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
          $(info.htmlToken).removeClass('pk-token-correction');
          $(`#${pos}-${parId}`).remove();
          this.onListChanged();
        }
      });
    });
  }

  createFixHandler(chunk, token, pos, parId) {
    $(document).off('click', `#${pos}-${parId}-fix`);
    $(document).on('click', `#${pos}-${parId}-fix`, (e) => {
      const [mistakeId, correctionId] = $(e.target).attr('data-mistakeId-correctionId')
        ? $(e.target).attr('data-mistakeId-correctionId').split('-')
        : [0, 0];

      closePopover(token);
      this.fix(chunk, chunk.getToken(Number(pos)), pos, parId, false, Number(mistakeId), Number(correctionId));
      this.editor.undoManager.add();
      // config.proofreader.process();
    });
  }

  onListChanged() {
    const size = $('.mistakes').children().length;
    let shown = false;
    if (size > 0) {
      $('.mistakes-counter').show().text(size);
      $('.mistakes')
        .children()
        .each((i, itm) => {
          if ($(itm).find('.correction-part').length > 0) {
            $(`#fix-all`).show(100).css('display', 'block');
            shown = true;
            return false;
          }
        });
    } else {
      $('.mistakes-counter').hide(500);
    }
    if (!shown) $('#fix-all').hide();
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
      // config.proofreader.process();
    });
  }

  setPopover(token, pos, parId, chunk, firsMistakeId) {
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
          removeMistakeHighlight(pos, token, parId, chunk, firsMistakeId);
        });
      })
      .on('mouseleave', function () {
        const _this = this;
        setTimeout(function () {
          if (!$('.popover:hover').length) {
            ($(_this) as any).popover('hide');
            removeMistakeHighlight(pos, token, parId, chunk, firsMistakeId);
          }
        }, 1);
      });
  }

  createCard(pos: number, parId: number) {
    const mistakes = this.sortMistakes(this.getValueFromTokensInfo('mistakes', pos, parId));
    if (!mistakes || !mistakes[0] || this.cardsWithSameMistakeIdExist(mistakes)) return;

    let mainCorrectionPart = '';
    const isCorrection = this.correctionExists(pos, parId, 0);
    if (isCorrection) {
      if ($(`#${pos}-${parId}`).length || this.isTokenEqualToCorrection(pos, parId, 0)) {
        return;
      } else {
        mainCorrectionPart = this.getCorrectionPart(
          pos,
          parId,
          this.getValueFromMistakeObj('corrections', pos, parId, 0)[0],
          0,
          0,
          true,
        );
      }
    }

    const mistakeDescription = this.formatDescription(mistakes[0].getDescription());
    const abouts: About[] = mistakes[0].getAbout();
    const showDetails = mistakes.length > 1 || abouts.length > 0 || mistakes[0].corrections.length > 1;

    return `
    <div id="${pos}-${parId}" data-id=${mistakes[0].getId()} class="mistake bg-white rounded">
      <div class="main-content-container">
        <img id="${pos}-${parId}-ignore" class="card-cancel icon" data-toggle="tooltip" data-placement="top" title="Neopravovat"  src="assets/icons/x.svg" alt="Remove">
        ${mainCorrectionPart ? mainCorrectionPart : ''}
        <div class="desc-container">
          <div class="main-mistake-desc">
          ${mistakeDescription ? mistakeDescription : ''}
          </div>
          ${
            showDetails
              ? `<button type="button" data-toggle="modal" data-target="#modal${pos}-${parId}" class="btn btn-link show-more">Zobrazit více</button>
              ${this.createModal(mistakes, pos, parId)}`
              : ''
          }
        </div>
      </div>
    </div>
    `;
  }

  isToStrike(string) {
    if (string.length > 1) return true;
    return /^[\da-z]+$/i.test(string);
  }

  getCorrectionPart(pos, parId, correction: Correction, mistakeId, correctionId, isLine = true): string {
    if (!correction.getAction()) return '';
    const idTag = mistakeId + '-' + correctionId;
    let value = correction.getAction().value;
    let correctionPart = '';

    if (correction.getAction().type === 'change' && this.isToStrike(value[0])) {
      correctionPart = `
        <span><strike>${value[0]}</strike></span>
        <img class="arrow-icon" src="assets/icons/arrow-right.svg" alt="Arrow">
        <span data-mistakeId-correctionId="${idTag}" id="${pos}-${parId}-fix" data-toggle="tooltip" data-placement="top" title="Opravit" class="correct-text with-tooltip to-fix" data-dismiss="modal">${value[1]}</span>
        `;
    } else if (correction.getAction().type === 'remove') {
      correctionPart = `<span data-mistakeId-correctionId="${idTag}" id="${pos}-${parId}-fix" data-toggle="tooltip" data-placement="top" title="Opravit" class="with-tooltip to-fix-strike" data-dismiss="modal"><strike>${value}</strike></span>`;
    } else {
      if (Array.isArray(value)) {
        value = value[1];
      }
      correctionPart = `<span data-mistakeId-correctionId="${idTag}" id="${pos}-${parId}-fix" data-toggle="tooltip" data-placement="top" title="Opravit" class="correct-text with-tooltip to-fix" data-dismiss="modal">${value}</span>`;
    }
    // switch (correction.getAction().type) {
    //   case 'description':
    //     correctionPart = `<span data-mistakeId-correctionId="${idTag}" id="${pos}-${parId}-fix" data-toggle="tooltip" data-placement="top" title="Opravit" class="correct-text with-tooltip to-fix" data-dismiss="modal">${value}</span>`;
    //     break;
    //   case 'remove':
    //     correctionPart = `<span data-mistakeId-correctionId="${idTag}" id="${pos}-${parId}-fix" data-toggle="tooltip" data-placement="top" title="Opravit" class="with-tooltip to-fix-strike" data-dismiss="modal"><strike>${value}</strike></span>`;
    //     break;
    //   case 'change':
    //     correctionPart = `
    //     <span><strike>${value[0]}</strike></span>
    //     <img class="arrow-icon" src="assets/icons/arrow-right.svg" alt="Arrow">
    //     <span data-mistakeId-correctionId="${idTag}" id="${pos}-${parId}-fix" data-toggle="tooltip" data-placement="top" title="Opravit" class="correct-text with-tooltip to-fix" data-dismiss="modal">${value[1]}</span>
    //     `;
    //     break;
    // }
    return isLine
      ? `<div class="correction-part">${correctionPart}</div><hr/>`
      : `<div class="correction-part">${correctionPart}</div>`;
  }

  getPrimaryMistakeIndex(mistakes: Mistake[]) {
    if (mistakes?.length > 1) {
      let counter = 0;
      for (const mistake of mistakes) {
        if (mistake.getType() && !mistake.getType().startsWith('capitals')) {
          return counter;
        }
        counter++;
      }
    }
    return 0;
  }

  sortMistakes(mistakes: Mistake[]) {
    if (mistakes?.length > 1) {
      for (const mistake of mistakes) {
        const mistakeType = mistake.getType();
        if (mistakeType) {
          if (mistakeType.startsWith('commas')) {
            return this.putElementToStart(mistakes, mistake);
          } else if (mistakeType.startsWith('capitals')) {
            return this.putElementToEnd(mistakes, mistake);
          }
        }
      }
    }
    return mistakes;
  }

  putElementToStart(array, element) {
    const fromIndex = array.indexOf(element);
    const selectedElement = array.splice(fromIndex, 1)[0];
    array.splice(0, 0, selectedElement);
    return array;
  }

  putElementToEnd(array, element) {
    array.push(array.splice(array.indexOf(element), 1)[0]);
    return array;
  }

  createAboutLinks(mistake: Mistake) {
    const htmlLinks = mistake
      .getAbout()
      .map(
        (about) =>
          ` <p>
              <span class="correct-text">${about.label}: </span>
              <a href="${about.url}" target="_blank">${about.url}</a>
              </p>`,
      )
      .join('');
    return `<div>${htmlLinks}<hr/></div>`;
  }

  createModal(mistakes: Mistake[], pos, parId) {
    const rows = { htmlParts: [] };

    for (const mistakeId of mistakes.keys()) {
      let correctionsCounter = 0;
      let isLastCorrection = false;
      if (!this.correctionExists(pos, parId, mistakeId)) {
        if (mistakes[mistakeId].getAbout().length > 0) {
          rows.htmlParts.push(`<span>${this.formatDescription(mistakes[mistakeId].getDescription())}</span>`);
          rows.htmlParts.push(this.createAboutLinks(mistakes[mistakeId]));
        } else {
          rows.htmlParts.push(`<span>${this.formatDescription(mistakes[mistakeId].getDescription())}</span><hr/>`);
        }
      }

      correctionsLoop: for (const correctionId of mistakes[mistakeId]['corrections'].keys()) {
        // Check if exists correction with same position in par
        if (!this.getValueFromMistakeObj('corrections', pos, parId, mistakeId)[correctionId]['rules'][pos])
          continue correctionsLoop;

        if (correctionsCounter === 0)
          rows.htmlParts.push(`<span>${this.formatDescription(mistakes[mistakeId].getDescription())}</span>`);
        if (correctionsCounter + 1 === mistakes[mistakeId]['corrections'].length) isLastCorrection = true;
        if (this.isTokenEqualToCorrection(pos, parId, mistakeId)) continue correctionsLoop;
        if (isLastCorrection && mistakes[mistakeId].getAbout().length > 0) {
          rows.htmlParts.push(
            this.getCorrectionPart(
              pos,
              parId,
              this.getValueFromMistakeObj('corrections', pos, parId, mistakeId)[correctionId],
              mistakeId,
              correctionId,
              false,
            ),
          );
          rows.htmlParts.push(this.createAboutLinks(mistakes[mistakeId]));
        } else {
          rows.htmlParts.push(
            this.getCorrectionPart(
              pos,
              parId,
              this.getValueFromMistakeObj('corrections', pos, parId, mistakeId)[correctionId],
              mistakeId,
              correctionId,
              true,
            ),
          );
        }

        correctionsCounter++;
      }
    }

    return `
          <div
            class="modal"
            id="modal${pos}-${parId}"
            tabindex="-1"
            role="dialog"
            aria-labelledby="Details Modal"
            aria-hidden="true"
          >
            <div class="modal-dialog modal-dialog-centered" role="document">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="Details Modal">Detailní informace</h5>
                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                 <div class="modal-body modal-details">
                    ${rows.htmlParts.join('')}
                </div>
              </div>
            </div>
          </div>
    `;
  }

  formatDescription(description: string) {
    let newDesc = description.replace(/„/g, '<span class="mistake-quotes">');
    newDesc = newDesc.replace(/“/g, '</span>');
    return newDesc;
  }

  createPopoverContent(pos, parId) {
    let mistakes: Mistake[] = this.getValueFromTokensInfo('mistakes', pos, parId);
    if (!mistakes) return;
    mistakes = this.sortMistakes(mistakes);
    const maxRow = 5;
    let counter = 0;
    const rows = { htmlParts: [], corrections: [] };

    for (const mistakeId of mistakes.keys()) {
      if (!this.correctionExists(pos, parId, mistakeId)) break;
      if (this.isTokenEqualToCorrection(pos, parId, mistakeId)) break;

      correctionsLoop: for (const correctionId of mistakes[mistakeId]['corrections'].keys()) {
        if (counter === maxRow - 1) break;
        // Check if exists correction with same position in par
        if (!this.getValueFromMistakeObj('corrections', pos, parId, mistakeId)[correctionId]['rules'][pos])
          continue correctionsLoop;
        const correction = this.getValueFromMistakeObj('corrections', pos, parId, mistakeId)[correctionId]['rules'][
          pos
        ];
        if (rows.corrections.includes(correction)) {
          continue correctionsLoop;
        }
        rows.corrections.push(correction);
        rows.htmlParts.push(this.createPopRow(pos, parId, correction, mistakeId, correctionId));
        counter++;
      }
    }
    // <img id="${pos}-${parId}-ignore" class="cancel-popover icon" data-toggle="tooltip" data-placement="top" title="Neopravovat" src="assets/icons/x.svg" alt="Remove">
    return `
    <div id="${pos}-${parId}-pop" class="popover-body">
      ${rows.htmlParts.join('')}
    </div>
  `;
  }

  createPopRow(pos, parId, correction: string, mistakeId, correctionId) {
    // idTag has to be everywhere because of click handler
    const idTag = mistakeId + '-' + correctionId;
    return `
      <div data-mistakeId-correctionId="${idTag}" id="${pos}-${parId}-fix" data-toggle="tooltip" data-placement="top" title="Opravit" class="popover-row">
        <div data-mistakeId-correctionId="${idTag}" class="popover-text">
        ${correction}
        </div>
        <div class="popover-icons" data-mistakeId-correctionId="${idTag}">
          <img data-mistakeId-correctionId="${idTag}" id="${pos}-${parId}-fix" class="check icon" data-toggle="tooltip" data-placement="top" title="Opravit" src="assets/icons/check2.svg" alt="Check">
        </div>
      </div>`;
  }

  createMistakePart(stringToken: string) {
    return stringToken && stringToken.trim().length > 2 ? `<span"><strike>${stringToken}</strike></span>` : '';
  }

  isTokenEqualToCorrection(pos, parId, mistakeIndex) {
    const token = this.getValueFromMistakeObj('token', pos, parId, mistakeIndex);
    const correction = this.getValueFromMistakeObj('corrections', pos, parId, mistakeIndex)[0]['rules'][pos];

    if (!token || !correction) return false;
    return token === correction;
  }

  correctionExists(pos, parId, mistakeIndex) {
    return this.getValueFromMistakeObj('corrections', pos, parId, mistakeIndex)?.length > 0;
  }

  cardsWithSameMistakeIdExist(mistakes: Mistake[]) {
    let exist = false;
    for (const id of mistakes.map((mistake) => mistake.getId())) {
      exist = false;
      if ($(`[data-id="${id}"]`).length > 0) {
        exist = true;
      }
    }
    return exist;
  }
}
