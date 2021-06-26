import * as $ from 'jquery';
import { cssMistakeBadValue, cssMistakeDescription, cssMistakeNoCorrection } from '../core/assets/style.css';
import { config } from '../core/Config';
import { HtmlParagraphChunk } from '../core/correction/HtmlParagraphChunk';
import { Mistake } from '../core/correction/Mistake';
import { parseEl } from '../core/process/HtmlParser';
import { ParsedHtml } from '../core/process/ParsedHtml';
import { message as msg } from '../core/utilities/Message';
import { ProofreaderGui } from '../core/gui/ProofreaderGui';

export class TinyMceGui extends ProofreaderGui {

    private editor;
    constructor(editor, stylesheetLoader: () => void = () => {}) {
        super();
        this.editor = editor;
        this.processing = $(this.editor.dom.select('html')[0]).attr('data-pk-processing');
        stylesheetLoader();
    }

    public setProcessing(processing: boolean) {
        if(processing) {
            msg('Processing indicator displayed.');
            $(this.editor.dom.select('html')[0]).attr('data-pk-processing', 'true');
        }   else {
            $(this.editor.dom.select('html')[0]).removeAttr('data-pk-processing');
            msg('Processing indicator hidden.');
        }
    }

    public getChunks(): HtmlParagraphChunk[] {
        let content = $(this.editor.dom.select('html')[0]).find('p');
        let chunks: HtmlParagraphChunk[] = [];
        content.each((i, p) => {
            chunks.push(new HtmlParagraphChunk(p));
        });
        return chunks;
    }

    public wrapTokens(chunk: HtmlParagraphChunk, tokens: string[], tokenPos: {from: number, to: number}[]) {
        let parsedHtml: ParsedHtml = parseEl($(chunk.getElement()));
        tokens.forEach(function (token, index) {
            parsedHtml.wrapToken(tokenPos[index].from, tokenPos[index].to, token)
        });
        $(chunk.getElement()).html(parsedHtml.getHtml());  
    }

    public cleanTokens(chunk: HtmlParagraphChunk):void {
        $(chunk.getElement()).find(".pk-token").replaceWith(function() {
            return $( this ).contents();
        });
    }

    public getBookmark() {
        return this.editor.selection.getBookmark();
    }

    public moveToBookmark(bookmark) {
        this.editor.selection.moveToBookmark(bookmark);
    }

    public wrapMistakeContext(chunk: HtmlParagraphChunk, tokenId: number): string {
        return '<span style="' + cssMistakeBadValue + '">' + chunk.getTokenText(tokenId) + '</span>'; 
    }

    public visualizeMistakes(chunk: HtmlParagraphChunk, pos: number, token) {
        // Removes original left-click triggers on tokens
        $(token).off('click');
        // Create dialog itself
        const currentMistakes = [];
        let suggestionRulebook = {};

        config.mistakes.getMistakes(chunk.getLastHash()).forEach((mistake) => {
            if (!mistake.getTokens().includes(pos)) { return; } // <-- continue;

            const dialogOutput = this.buildSuggestionDialog(chunk, mistake);

            suggestionRulebook = {...suggestionRulebook, ...dialogOutput.partialRulebook};
            currentMistakes.push({
                type: 'panel',
                direction: 'column',
                align: 'stretch',
                items: dialogOutput.suggestions,
            });
        });

        $(token).click((e) => {
            e.preventDefault();
            this.editor.windowManager.open({
                title: 'Návrh na opravu',
                body: {
                    type: 'panel',
                    items: currentMistakes
                },
                buttons: [],
                onAction: (instance, trigger) => {
                    if (trigger.name.startsWith('correction')) {
                        // Get mistake and correction information from the triger name.
                        const parts = trigger.name.split('-');

                        // Apply correction.
                        Object.entries(suggestionRulebook[parts[2]]).forEach(([target, correctValue]: [any, string]) => {
                            let originalContent: string = $(chunk.getToken(target))[0].innerHTML;
                            let contentParts = originalContent.replace(/(<[^(><.)]+>)/g, "|<>|$1|<>|").split("|<>|");
                            console.log(contentParts);
                            let modifiedContentParts = contentParts.map((part) => {
                                if(!part.match(/(<[^(><.)]+>)/)) {
                                    let newVal = correctValue.length > part.length ? correctValue.substring(0, part.length) : correctValue;
                                    correctValue = correctValue.length > part.length ? correctValue.slice(part.length) : "";
                                    return newVal;
                                }
                                return part;
                            });
                            if(correctValue.length > 0) {
                                modifiedContentParts.push(correctValue);
                            }
                            let newContent = modifiedContentParts.join("");
                            $(chunk.getToken(target))[0].innerHTML = newContent;
                        });

                        // Remove mistake record to hide it afterwards.
                        config.mistakes.removeMistake(chunk.getLastHash(), parts[1]);
                        config.proofreader.process();

                        this.editor.windowManager.close();
                    }
                }
            });

        });
    }

    private buildSuggestionDialog(chunk: HtmlParagraphChunk, mistake: Mistake) {
        const partialRulebook = {};
        const helperText = chunk.getContext(mistake);
        // Display mistake context
        const suggestions: any[] = [{
            type: 'htmlpanel',
            html: '<p style="text-align: center">' + helperText + '</p><p style="' + cssMistakeDescription + '">' + mistake.getDescription() + '</p>'
        }];
    
        // Display suggested corrections
        const mistakes = mistake.getCorrections();
        if (!mistakes.length) {
            suggestions.push(
                {
                    type: 'htmlpanel',
                    html: '<p style="' + cssMistakeNoCorrection + '">Žádné návrhy</p>'
                }
            );
        }
        mistakes.forEach((correction) => {
            partialRulebook[correction.getId()] = correction.getRules();
            suggestions.push(
                {
                    type: 'button',
                    name: 'correction-' + mistake.getId() + '-' + correction.getId(),
                    text: correction.getDescription(),
                    borderless: true,
                }
            );
        });
        if (mistake.getAbout().length) {
            suggestions.push(
                {
                    type: 'htmlpanel',
                    html: '<h4">Další informace</h4>'
                }
            );
            mistake.getAbout().forEach((item) => {
                suggestions.push(
                    {
                        type: 'htmlpanel',
                        html: '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer">' + item.label + '</h4>'
                    }
                );
            });
        }
        return {suggestions, partialRulebook};
    }


}