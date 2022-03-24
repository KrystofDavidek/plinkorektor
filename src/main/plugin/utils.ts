export const removeMistakeHighlight = (pos: number, token: string, parId: number) => {
  $(`#${pos}-${parId}`).removeClass('selected');
  $(token).removeClass('hovered');
};

export const addMistakeHighlight = (pos: number, token: string, parId: number) => {
  $(`#${pos}-${parId}`).addClass('selected');
  $(token).addClass('hovered');
};

export const closePopover = (token) => {
  ($(token) as any).popover('hide');
  ($(token) as any).popover('disable');
  $('.popover').remove();
};

export const setHovers = (token, pos, parId, isPopover) => {
  $(token).mouseenter(() => {
    const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if (width > 770) {
      const cardElement = $(`#${pos}-${parId}`).get()[0];
      if (cardElement) cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    $(`#${pos}-${parId}`).addClass('selected');
  });

  $(`#${pos}-${parId}`).mouseenter(() => {
    addMistakeHighlight(pos, token, parId);
  });

  if (!isPopover) {
    $(token).mouseleave(() => {
      removeMistakeHighlight(pos, token, parId);
    });
  }
  $(`#${pos}-${parId}`).mouseleave(() => {
    removeMistakeHighlight(pos, token, parId);
  });
};
