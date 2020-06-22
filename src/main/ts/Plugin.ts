declare const tinymce: any;

const setup = (editor, url) => {
  editor.ui.registry.addButton('plinkorektor', {
    text: 'plinkorektor button',
    onAction: () => {
      // tslint:disable-next-line:no-console
      editor.setContent('<p>content added from plinkorektor</p>');
    }
  });
};

export default () => {
  tinymce.PluginManager.add('plinkorektor', setup);
};
