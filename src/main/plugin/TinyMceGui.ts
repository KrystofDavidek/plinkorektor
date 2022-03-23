import { ProofreaderGui, HtmlParagraphChunk, parseEl, ParsedHtml, config, Mistake } from '../core';
import { About, TokensInfo } from 'src/demo/ts/models';
import { cssMistakeBadValue, cssMistakeDescription, cssMistakeNoCorrection } from '../../../assets/editor-styles';
import * as _ from 'lodash';
import { getRawEditorContent } from './Plugin';

export class TinyMceGui extends ProofreaderGui {
  private editor;
  private processingPars: number[] = [];
  private tokensInfo: TokensInfo = {};

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
    } else {
      $(this.editor.dom.select('html')[0]).removeAttr('data-pk-processing');
      $(this.editor.dom.select('html')[0]).attr('data-pk-processing-finished', 'true');
      // msg('Processing indicator hidden.');
    }
    this.processing = processing;
  }

  public setProcessingChunk(chunk: HtmlParagraphChunk) {
    // after specific paragraph is starting to process, remove corresponding cards and popovers
    const parId = this.getParId(chunk);
    $(`[id$="-${parId}"]`).remove();
    // chunk.getTokens().forEach((token) => {
    //   this.closePopover(token);
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
    const parId = this.getParId(chunk);
    this.deleteOldTokens(chunk, parId);
    // Removes original left-click triggers on tokens
    $(token).off('click');
    // Create dialog itself
    const currentMistakes = [];
    let suggestionRulebook = {};

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

      // const dialogOutput = this.buildSuggestionDialog(chunk, mistake, pos, parId);

      // suggestionRulebook = {
      //   ...suggestionRulebook,
      //   ...dialogOutput.partialRulebook,
      // };
      // currentMistakes.push({
      //   type: 'panel',
      //   direction: 'column',
      //   align: 'stretch',
      //   items: dialogOutput.suggestions,
      // });
    });

    $('.mistakes').append(this.createCard(pos, parId));
    this.sortCards();
    this.createFixHandler(chunk, token, pos, parId);
    this.createIgnoreHandler(chunk, token, pos, parId);
    if (chunk.getToken(pos).text().length > 1) this.setPopover(token, pos, parId);
    this.setHovers(token, pos, parId);
    this.onListChanged();

    $(token).click((e) => {
      e.preventDefault();
      return;

      this.editor.windowManager.open({
        title: 'Návrh na opravu',
        body: {
          type: 'panel',
          items: currentMistakes,
        },
        buttons: [],
        onAction: (instance, trigger) => {
          // Get mistake and correction information from the triger name.
          const [actionType, mistakeId, correctionId] = trigger.name.split('-');
          if (actionType == 'correction') {
            this.fixMistake(chunk, mistakeId, suggestionRulebook[correctionId]);
            config.proofreader.process();
          } else if (actionType == 'ignore') {
            this.ignoreMistake(chunk, mistakeId);
          } else if (actionType == 'allcorrection') {
            this.fixAll(chunk, mistakeId, suggestionRulebook[correctionId]);
            config.proofreader.process();
          }
          this.editor.windowManager.close();
        },
      });
    });
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

  private buildSuggestionDialog(chunk: HtmlParagraphChunk, mistake: Mistake, pos: number, parId: number) {
    const partialRulebook = {};
    const helperText = chunk.getContext(mistake);

    // Display mistake context
    const suggestions: any[] = [
      {
        type: 'htmlpanel',
        html:
          '<p style="text-align: center">' +
          helperText +
          '</p><p style="' +
          cssMistakeDescription +
          '">' +
          mistake.getDescription() +
          '</p>',
      },
    ];

    // Display suggested corrections
    const mistakes = mistake.getCorrections();
    if (!mistakes.length) {
      suggestions.push({
        type: 'htmlpanel',
        html: '<p style="' + cssMistakeNoCorrection + '">Žádné návrhy</p>',
      });
    }
    suggestions.push({
      type: 'button',
      name: 'ignore-' + mistake.getId(),
      text: 'Ignorovat chybu',
      borderless: true,
    });

    mistakes.forEach((correction) => {
      partialRulebook[correction.getId()] = correction.getRules();
      suggestions.push(
        {
          type: 'htmlpanel',
          html: correction.getDescription(),
        },
        {
          type: 'grid',
          columns: 2,
          items: [
            {
              type: 'button',
              name: 'correction-' + mistake.getId() + '-' + correction.getId(),
              text: 'Opravit jen tady',
              borderless: true,
            },
            {
              type: 'button',
              name: 'allcorrection-' + mistake.getId() + '-' + correction.getId(),
              text: 'Opravit všude',
              borderless: true,
            },
          ],
        },
      );
    });
    if (mistake.getAbout().length) {
      suggestions.push({
        type: 'htmlpanel',
        html: '<h4">Další informace</h4>',
      });
      mistake.getAbout().forEach((item) => {
        suggestions.push({
          type: 'htmlpanel',
          html: '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer">' + item.label + '</h4>',
        });
      });
    }

    return { suggestions, partialRulebook };
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

  getValueFromMistakeObj(atr: string, pos: number, parId: number) {
    if (this.tokensInfo[parId][pos].mistakes[0][atr]) {
      return this.tokensInfo[parId][pos].mistakes[0][atr];
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
    const correction = this.getValueFromMistakeObj('corrections', pos, parId)[0];
    const ids = this.getAllMistakesIds(pos, parId);
    this.tokensInfo[parId] = _.omit(this.tokensInfo[parId], pos);
    $(token).removeClass('pk-token-correction');
    if (!isIgnore) $(token).addClass('pk-token-correction-fixed');
    this.removeMistakeHighlight(pos, token, parId);
    if (isIgnore) {
      this.disableOtherTokens($(token).text());
      for (const id of ids) {
        this.ignoreMistake(chunk, id);
      }
    } else {
      this.fixMistake(chunk, correction.id, correction.rules);
    }
    this.onListChanged();
  }

  disableOtherTokens(tokenString: string) {
    Object.entries(this.tokensInfo).forEach(([parId, par]) => {
      Object.entries(par).forEach(([pos, info]) => {
        if (info.token === tokenString) {
          this.closePopover(info.htmlToken);
          $(`#${pos}-${parId}`).remove();
          this.onListChanged();
        }
      });
    });
  }

  createFixHandler(chunk, token, pos, parId) {
    $(document).off('click', `#${pos}-${parId}-fix`);
    $(document).on('click', `#${pos}-${parId}-fix`, () => {
      this.closePopover(token);
      this.fix(chunk, chunk.getToken(Number(pos)), pos, parId);
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
      this.closePopover(token);
      this.fix(chunk, chunk.getToken(Number(pos)), pos, parId, true);
    });
  }

  closePopover(token) {
    ($(token) as any).popover('hide');
    ($(token) as any).popover('disable');
    $('.popover').remove();
  }

  createFixAllHandler() {
    $(`#fix-all`).off('click');
    $(`#fix-all`).on('click', () => {
      for (const parId in this.tokensInfo) {
        if (!this.processingPars.includes(Number(parId))) {
          for (const pos in this.tokensInfo[parId]) {
            const token = this.tokensInfo[parId][pos].htmlToken;
            this.closePopover(token);
            this.fix(this.tokensInfo[parId][pos].chunk, token, pos, parId);
          }
        }
      }
      this.onListChanged();
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
      })
      .on('mouseenter', function () {
        var _this = this;
        ($(this) as any).popover('show');
        $('.popover').on('mouseleave', function () {
          ($(_this) as any).popover('hide');
        });
      })
      .on('mouseleave', function () {
        var _this = this;
        setTimeout(function () {
          if (!$('.popover:hover').length) {
            ($(_this) as any).popover('hide');
          }
        }, 100);
      });
  }

  setHovers(token, pos, parId) {
    $(token).mouseenter(() => {
      const position = $(`#${pos}-${parId}`).position();
      if (!position) return;
      $(`#${pos}-${parId}`).addClass('selected');
      $('.mistakes').animate(
        {
          scrollTop: position.top,
        },
        300,
      );
    });

    $(`#${pos}-${parId}`).mouseenter(() => {
      $(`#${pos}-${parId}`).addClass('selected');
      $(token).addClass('hovered');
    });

    $(`#${pos}-${parId}`).mouseleave(() => {
      this.removeMistakeHighlight(pos, token, parId);
    });

    $(token).mouseleave(() => {
      $(`#${pos}-${parId}`).removeClass('selected');
    });
  }

  removeMistakeHighlight(pos: number, token: string, parId: number) {
    $(`#${pos}-${parId}`).removeClass('selected');
    $(token).removeClass('hovered');
  }

  createCard(pos: number, parId: number) {
    const isCorrection = this.correctionExists(pos, parId);
    if (isCorrection) {
      if ($(`#${pos}-${parId}`).length || this.isCorrection(pos, parId)) return;
    }

    const token = this.getValueFromTokensInfo('token', pos, parId);
    const mistakes: Mistake[] = this.getValueFromTokensInfo('mistakes', pos, parId);
    const mainDesc = mistakes[0].getDescription();
    const mistakenPart = this.createMistakePart(token);
    let mainCorrectionPart = '';
    let secondaryDesc = '';
    if (isCorrection) {
      mainCorrectionPart = mistakes[0]['corrections'][0]['rules'][pos];
      secondaryDesc = mistakes[0]['corrections'][0]['description'];
    }
    const abouts: About[] = mistakes[0].getAbout();

    return `
    <div id="${pos}-${parId}" class="mistake p-3 mb-5 bg-white rounded">
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

  createPopoverContent(pos, parId) {
    if (!this.correctionExists(pos, parId)) return;
    if (this.isCorrection(pos, parId)) return;

    return `
    <div id="${pos}-${parId}-pop" class="popover-body">
      <span class="popover-text" type="button">${
        this.getValueFromMistakeObj('corrections', pos, parId)[0]['rules'][pos]
      }</span>
      <img id="${pos}-${parId}-fix" class="check icon" data-toggle="tooltip" data-placement="top" title="Opravit" src="assets/icons/check2.svg" alt="Check">
      <img id="${pos}-${parId}-ignore" class="cancel icon" data-toggle="tooltip" data-placement="top" title="Neopravovat" src="assets/icons/x.svg" alt="Remove"> 
    </div>
  `;
  }

  createMistakePart(stringToken: string) {
    return stringToken && stringToken.trim().length > 2
      ? `<span class="mistake-text"><strike>${stringToken}</strike></span>`
      : '';
  }

  isCorrection(pos, parId) {
    return (
      this.getValueFromMistakeObj('token', pos, parId) ===
      this.getValueFromMistakeObj('corrections', pos, parId)[0]['rules'][pos]
    );
  }

  correctionExists(pos, parId) {
    return this.getValueFromMistakeObj('corrections', pos, parId).length > 0;
  }
}
