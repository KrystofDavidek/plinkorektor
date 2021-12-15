import * as $ from 'jquery';
import { ProofreaderGui, HtmlParagraphChunk, parseEl, ParsedHtml, config, Mistake } from 'plinkorektor-core';
import { MistakeInfo } from 'src/demo/ts/models';
import { cssMistakeBadValue, cssMistakeDescription, cssMistakeNoCorrection } from '../../assets/editor-styles';
import * as _ from 'lodash';

export class TinyMceGui extends ProofreaderGui {
  private editor;

  public mistakeInfo: MistakeInfo = {};

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

  public isProcessing(): boolean {
    return this.processing;
  }

  public getChunks(): HtmlParagraphChunk[] {
    let content = $(this.editor.dom.select('html')[0]).find('p');
    let chunks: HtmlParagraphChunk[] = [];
    content.each((i, p) => {
      chunks.push(new HtmlParagraphChunk(p));
    });
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

  public visualizeMistakes(chunk: HtmlParagraphChunk, pos: number, token) {
    const parId = this.getParId(chunk);
    this.resetMistakesCol();
    // Removes original left-click triggers on tokens
    $(token).off('click');
    // Create dialog itself
    const currentMistakes = [];
    let suggestionRulebook = {};

    if (!this.initMistake(chunk.getToken(pos).text(), token, pos, parId)) {
      return;
    }
    this.createFixAllHandler(chunk, parId);
    $(`#fix-all`).show();

    config.mistakes.getMistakes(chunk.getLastHash()).forEach((mistake) => {
      if (!mistake.getTokens().includes(pos)) {
        return;
      } // <-- continue;

      const dialogOutput = this.buildSuggestionDialog(chunk, mistake, pos, parId);

      suggestionRulebook = {
        ...suggestionRulebook,
        ...dialogOutput.partialRulebook,
      };
      currentMistakes.push({
        type: 'panel',
        direction: 'column',
        align: 'stretch',
        items: dialogOutput.suggestions,
      });
    });

    $('.mistakes').append(this.createCard(pos, parId));
    this.createFixHandler(chunk, pos, parId);
    this.setHovers(token, pos, parId);

    $(token).click((e) => {
      e.preventDefault();

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

  protected fixMistake(chunk: HtmlParagraphChunk, mistakeId: string, correctionRules) {
    Object.entries(correctionRules).forEach(([target, correctValue]: [any, string]) => {
      // TODO SMARTER WAY TO REPLACE TOKENS (USE ENGINE FOR PARSING)
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
      this.pushValueToMistakeObj('corrections', correction, pos, parId);

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

    this.setValueToMistakeObj('helperText', helperText, pos, parId);
    this.setValueToMistakeObj('description', mistake.getDescription(), pos, parId);

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
    if (Array.isArray(this.mistakeInfo[parId][pos][atr])) {
      return this.mistakeInfo[parId][pos][atr].length > 0;
    } else {
      return !!this.mistakeInfo[parId][pos][atr];
    }
  }

  initMistake(token, htmlToken, pos: number, parId: number): boolean {
    if (!this.mistakeInfo.hasOwnProperty(parId)) {
      this.mistakeInfo[parId] = {};
    }
    if ($(htmlToken).hasClass('pk-token-correction-fixed') || !$(htmlToken).hasClass('pk-token-correction')) {
      return false;
    }
    if (!this.mistakeInfo[parId].hasOwnProperty(pos)) {
      this.mistakeInfo[parId][pos] = {
        token: token,
        helperText: '',
        description: '',
        corrections: [],
      };
    }
    return true;
  }

  setValueToMistakeObj(atr: string, value: any, pos: number, parId: number) {
    if (!this.isValueSet('atr', pos, parId)) {
      this.mistakeInfo[parId][pos][atr] = value;
    }
  }

  pushValueToMistakeObj(atr: string, value: any, pos: number, parId: number) {
    this.mistakeInfo[parId][pos][atr].push(value);
  }

  getValueFromMistakeObj(atr: string, pos: number, parId: number) {
    if (this.mistakeInfo[parId][pos][atr]) {
      return this.mistakeInfo[parId][pos][atr];
    }
  }

  resetMistakesCol() {
    let isEmpty: boolean = true;
    Object.values(this.mistakeInfo).forEach((val) => {
      if (Object.keys(val).length > 0) isEmpty = false;
    });
    if (isEmpty) {
      $('#fix-all').hide();
      $('.mistakes').empty();
    }
  }

  fix(chunk, token, pos, parId) {
    $(`#${pos}-${parId}`).remove();
    if (!$(token).text()) {
      $(token).text(chunk.getToken(pos).text());
    }
    const correction = this.getValueFromMistakeObj('corrections', pos, parId)[0];
    this.mistakeInfo[parId] = _.omit(this.mistakeInfo[parId], pos);
    $(token).removeClass('pk-token-correction');
    $(token).addClass('pk-token-correction-fixed');
    this.removeMistakeHighlight(pos, token, parId);
    this.fixMistake(chunk, correction.id, correction.rules);
  }

  createFixHandler(chunk, pos, parId) {
    $(`#${pos}-${parId}`).on('click', () => {
      this.fix(chunk, chunk.getToken(Number(pos)), pos, parId);
      config.proofreader.process();
    });
  }

  createFixAllHandler(chunk: HtmlParagraphChunk, parId) {
    $(`#fix-all`).on('click', () => {
      for (const pos in this.mistakeInfo[parId]) {
        this.fix(chunk, chunk.getToken(Number(pos)), pos, parId);
      }
      $(`#fix-all`).hide();
      config.proofreader.process();
    });
  }

  setHovers(token, pos, parId) {
    $(token).mouseenter(() => {
      $(`#${pos}-${parId}`).addClass('selected');
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
    if (
      $(`#${pos}-${parId}`).length ||
      this.getValueFromMistakeObj('token', pos, parId) ===
        this.getValueFromMistakeObj('corrections', pos, parId)[0]['rules'][pos]
    ) {
      return;
    }
    return `<div id="${pos}-${parId}" class="mistake">
    <h4>${this.getValueFromMistakeObj('description', pos, parId)}</h4>
    <p>${this.getValueFromMistakeObj('token', pos, parId)} -> ${
      this.getValueFromMistakeObj('corrections', pos, parId)[0]['rules'][pos]
    }</p>
    <button id="${pos}-${parId}-fix" type="button" class="btn btn-primary">Fix</button>
    </div>`;
  }

  //
}
