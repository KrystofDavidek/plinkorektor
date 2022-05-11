import { copy } from './interface-utils';
import Plugin from '../../main/plugin/Plugin';

declare let tinymce: any;

// Delete in production
Plugin();

if (!localStorage.getItem('content')) {
  localStorage.setItem(
    'content',
    '<p>Testovacý věta, dost hrubá chiba. Tohle je mé město brno. Tohle je take hruba chiba?</p>',
  );
}

// if (!localStorage.getItem('content')) {
//   localStorage.setItem('content', '<p></p>');
// }

tinymce.init({
  selector: 'textarea.tinymce',
  keep_styles: false, // prevent class copy on p
  forced_root_block_attrs: {
    'data-pk-init': true,
  },
  content_style:
    "@import url('https://fonts.googleapis.com/css2?family=Varta&display=swap'); body { font-family: Varta; }; ",
  plugins: 'code plinkorektor paste',
  paste_as_text: true,
  resize: false,
  width: '100%',
  height: '100%',
  statusbar: false,
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
  $(document).on('click', `.toggler`, (e) => {
    $('.suggestions').hide();
    $('.editor-container').addClass('expanded');
    $('.toggler')
      .addClass('toggler--close')
      .html(
        '<img data-toggle="tooltip" data-placement="top" title="Zobrazit seznam chyb"  src="assets/icons/collapse-left.svg" alt="Left Arrow" />',
      );
  });
  $(document).on('click', `.toggler--close`, (e) => {
    $('.suggestions').fadeIn(500);
    $('.editor-container').removeClass('expanded');
    $('.toggler')
      .removeClass('toggler--close')
      .html(
        '<img data-toggle="tooltip" data-placement="top" title="Skrýt seznam chyb" src="assets/icons/collapse-right.svg" alt="Right Arrow" />',
      );
  });
});
