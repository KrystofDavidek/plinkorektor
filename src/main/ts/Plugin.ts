import { proofreaderBase } from './core/ProofreaderBase';

declare const tinymce: any;

export default () => {
    tinymce.PluginManager.add('plinkorektor', proofreaderBase);
};
