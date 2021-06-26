
import { HtmlParagraphChunk } from '../correction/HtmlParagraphChunk';
import { message as msg } from '../utilities/Message';

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
}