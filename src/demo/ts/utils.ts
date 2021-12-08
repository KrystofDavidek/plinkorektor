const copyToClipboard = (str: string) => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

export const copy = (tinymce) => {
  $('#copy').on('click', () => {
    copyToClipboard(tinymce.activeEditor.getContent({ format: 'text' }));
  });
};
