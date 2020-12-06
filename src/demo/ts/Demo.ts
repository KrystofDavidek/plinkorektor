import Plugin from '../../main/ts/Plugin';

declare let tinymce: any;

Plugin();

tinymce.init({
  selector: 'textarea.tinymce',
  keep_styles: false, // prevent class copy on p
  plugins: 'code plinkorektor',
  menubar: 'korektor',
  menu: {
    korektor: {title: 'Korektor', items: 'pk-tagger pk-spellchecker'}
  },

  valid_elements: 'p[data-pk-hash],span[class]',
  valid_styles: {
    span: 'pk-token, pk-token-glue, pk-token-correction'
  },

  toolbar: false,

  setup: (editor) => {
    // Removal of keyboard shortcuts of editor
    editor.on('init', function () {
      editor.formatter.unregister('alignleft');
      editor.formatter.unregister('aligncenter');
      editor.formatter.unregister('alignright');
      editor.formatter.unregister('alignjustify');
      editor.formatter.unregister('bold');
      editor.formatter.unregister('italic');
      editor.formatter.unregister('underline');
      editor.formatter.unregister('strikethrough');
      editor.formatter.unregister('hilitecolor');
      editor.formatter.unregister('fontname');
      editor.formatter.unregister('fontsize');
      editor.formatter.unregister('h1');
      editor.formatter.unregister('h2');
      editor.formatter.unregister('h3');
      editor.formatter.unregister('h4');
      editor.formatter.unregister('h5');
      editor.formatter.unregister('h6');
      editor.formatter.unregister('div');
      editor.formatter.unregister('address');
      editor.formatter.unregister('pre');
      editor.formatter.unregister('code');
      editor.formatter.unregister('dt');
      editor.formatter.unregister('dd');
      editor.formatter.unregister('samp');
    });
  }
});
