import { copy, deleteContent } from './interface-utils';
import Plugin from '../../main/plugin/Plugin';

declare let tinymce: any;

// Delete in production
// Plugin();

// if (!localStorage.getItem('content')) {
//   localStorage.setItem(
//     'content',
//     '<p>Testovacý věta, dost hrubá chiba. Tohle je mé město brno. Tohle je take hruba chiba?</p>',
//   );
// }

if (!localStorage.getItem('content')) {
  localStorage.setItem('content', '<p></p>');
}

tinymce.init({
  selector: 'textarea.tinymce',
  keep_styles: false, // prevent class copy on p
  forced_root_block_attrs: {
    'data-pk-init': true,
  },
  content_css: '/css/iframe.css',
  content_style:
    "@import url('https://fonts.googleapis.com/css2?family=Varta&display=swap'); body { font-family: Varta; }; ",
  plugins: 'code plinkorektor paste',
  paste_as_text: true,
  resize: false,
  width: '100%',
  height: '100%',
  menubar: 'korektor',
  toolbar: 'undo redo',
  menu: {
    korektor: { title: 'Korektor', items: 'pk-tagger pk-spellchecker' },
  },
  valid_elements: '*[*]',
  draggable_modal: true,
});

$(() => {
  copy(tinymce);
  deleteContent(tinymce);
});
