import Plugin from '../../main/ts/plugin/Plugin';

declare let tinymce: any;

Plugin();

tinymce.init({
  selector: 'textarea.tinymce',
  keep_styles: false, // prevent class copy on p
  forced_root_block_attrs: {
    'data-pk-init': true
  },
  content_style: '@import url(\'https://fonts.googleapis.com/css2?family=Varta&display=swap\'); body { font-family: Varta; };',
  plugins: 'code plinkorektor',
  menubar: 'korektor',
  toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright alignjustify | outdent indent | newdocument | reporterror | calculate-confustion-matrix',
  menu: {
    korektor: {title: 'Korektor', items: 'pk-tagger pk-spellchecker'}
  },

  valid_elements: '*[*]',
});
