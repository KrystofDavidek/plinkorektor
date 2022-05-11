import { HtmlParagraphChunk } from './../core/correction/HtmlParagraphChunk';
import { config } from './../core/Config';

export const removeMistakeHighlight = (pos: number, tokens, parId: number, chunk?: HtmlParagraphChunk, mistakeId?) => {
  const mistake = mistakeId ? config.mistakes.getMistake(chunk.getLastHash(), mistakeId) : undefined;

  if (mistakeId && mistake?.getType() && mistake?.getTokens().length > 1) {
    const mistakeTokens = $(chunk.getElement()).find(`[data-id='${mistakeId}']`);
    const card = $('.mistakes').find(`[data-id='${mistakeId}']`)[0];
    $(card).removeClass('selected');
    for (const token of mistakeTokens) {
      $(token).removeClass('hovered');
    }
  } else {
    $(`#${pos}-${parId}`).removeClass('selected');
    if (Array.isArray(tokens)) {
      tokens.forEach((token) => {
        $(token).removeClass('hovered');
      });
    } else {
      $(tokens).removeClass('hovered');
    }
  }
};

export const addMistakeHighlight = (pos: number, tokens, parId: number) => {
  $(`#${pos}-${parId}`).addClass('selected');
  if (Array.isArray(tokens)) {
    tokens.forEach((token) => {
      $(token).addClass('hovered');
    });
  } else {
    $(tokens).addClass('hovered');
  }
};

export const closePopover = (token) => {
  ($(token) as any).popover('hide');
  ($(token) as any).popover('disable');
  $('.popover').remove();
};

export const setHovers = (token, pos, parId, isPopover, chunk, mistakeId) => {
  let tokens;
  tokens = $(chunk.getElement()).find(`[data-id='${mistakeId}']`);
  const card = $('.mistakes').find(`[data-id='${mistakeId}']`)[0];
  // When mistakes are reordered, previous token has to be used
  if (tokens.length === 0) {
    tokens = $.makeArray(token);
  }

  for (const token of tokens) {
    let isInTime;
    $(token).mouseenter(() => {
      isInTime = true;
      const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      if (width > 770) {
        setTimeout(() => {
          const cardElement = $(card).get()[0];
          if (cardElement && isInTime)
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        }, 750);
      }
      $(card).addClass('selected');
      if (Array.isArray(tokens)) {
        tokens.forEach((token) => {
          $(token).addClass('hovered');
        });
      } else {
        $(tokens).addClass('hovered');
      }
    });

    $(card).mouseenter(() => {
      addMistakeHighlight(pos, token, parId);
    });

    $(token).mouseleave(() => {
      isInTime = false;
      removeMistakeHighlight(pos, token, parId, chunk, mistakeId);
    });

    $(card).mouseleave(() => {
      removeMistakeHighlight(pos, token, parId, chunk, mistakeId);
    });
  }
};
