import { cssMainStylesheet } from '../../assets/style.css';
import { config } from '../Config';

/**
 * General settings bound to graphical user interface (GUI)
 */
export function guiLoadMainStylesheet() {
    config.editor.dom.addStyle(cssMainStylesheet);
}