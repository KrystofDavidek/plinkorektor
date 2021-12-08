import { copy } from './utils';
import Plugin from '../../main/plugin/Plugin';
import * as $ from 'jquery';

declare let tinymce: any;
declare var window: any;
window.$ = window.jQuery = $;

Plugin();

tinymce.init({
  selector: 'textarea.tinymce',
  keep_styles: false, // prevent class copy on p
  forced_root_block_attrs: {
    'data-pk-init': true,
  },
  content_style:
    "@import url('https://fonts.googleapis.com/css2?family=Varta&display=swap'); body { font-family: Varta; };",
  plugins: 'code plinkorektor',
  menubar: 'korektor',
  toolbar: 'none',
  menu: {
    korektor: { title: 'Korektor', items: 'pk-tagger pk-spellchecker' },
  },
  valid_elements: '*[*]',
  draggable_modal: true,
});

$(() => {
  copy(tinymce);
});
