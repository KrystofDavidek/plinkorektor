// IMPORTS

import { config } from '../Config';
import { Tagger, TaggerName } from '../../types/Tagger';
import { Spellchecker, SpellcheckerName } from '../../types/Spellchecker';

// CONSTANTS

const SPELLCHECKER_TOGGLE_EVENT = 'pk-spellchecker-change';
const TAGGER_TOGGLE_EVENT = 'pk-tagger-change';

// EXPORTS

/**
 * Creates dropdown menu on the toolbar.
 */
export function guiInitiateToolbar() {
    initiateTagger();
    initiateSpellchecker();
}

// TAGGER

/**
 * Initiates part of dropdown dealing with tagger change.
 */
function initiateTagger() {
    config.editor.ui.registry.addNestedMenuItem('pk-tagger', {
        text: 'Značkovač',
        getSubmenuItems() {
            return Object.values(Tagger).map((t) => ({
                type: 'togglemenuitem',
                text: TaggerName[t],
                onAction() { changeTagger(t); },
                onSetup(api) { initiateTaggerToggle(api, t); },
            }));
        }
    });
}

/**
 * Initiates tagger changing mechanism.
 * Works in sync with changeTagger() function.
 *
 * @param api Button API
 * @param tagger New tagger value.
 */
function initiateTaggerToggle(api, tagger: Tagger) {
    // Set correct tagger as active when change occurs.
    config.editor.on(TAGGER_TOGGLE_EVENT, function (e) {
        api.setActive(config.tagger === tagger);
    });

    // Set initiate tagger.
    api.setActive(config.tagger === tagger);
}

/**
 * Changes tagger.
 *
 * @param tagger New tagger value.
 */
function changeTagger(tagger: Tagger) {
    config.tagger = tagger;
    config.editor.fire(TAGGER_TOGGLE_EVENT);
}

// SPELLCHECKER

/**
 * Initiates part of dropdown dealing with spellchecker change.
 */
function initiateSpellchecker() {
    config.editor.ui.registry.addNestedMenuItem('pk-spellchecker', {
        text: 'Kontrola překlepů',
        getSubmenuItems() {
            return Object.values(Spellchecker).map((s) => ({
                type: 'togglemenuitem',
                text: SpellcheckerName[s],
                onAction: () => changeSpellchecker(s),
                onSetup: (api) => initiateSpellcheckerToggle(api, s),
            }));
        }
    });
}

/**
 * Initiates spellchecker changing mechanism.
 * Works in sync with changeSpellchecker() function.
 *
 * @param api Button API
 * @param spellchecker New spellchecker value.
 */
function initiateSpellcheckerToggle(api, spellchecker: Spellchecker) {
    // Set correct spellchecker as active when change occurs.
    config.editor.on(SPELLCHECKER_TOGGLE_EVENT, function (e) {
        api.setActive(config.spellchecker === spellchecker);
    });

    // Set initiate spellchecker.
    api.setActive(config.spellchecker === spellchecker);
}

/**
 * Changes spellchecker.
 *
 * @param spellchecker New spellchecker value.
 */
function changeSpellchecker(spellchecker: Spellchecker) {
    config.spellchecker = spellchecker;
    config.editor.fire(SPELLCHECKER_TOGGLE_EVENT);
}