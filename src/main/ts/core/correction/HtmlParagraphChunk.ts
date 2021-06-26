import { decode } from 'html-entities';

export class HtmlParagraphChunk extends TextChunk {
    protected p;
    public constructor(p) {
        super();
        this.p = p;
        this.processing = p.getAttribute('data-pk-processing');
        this.changed = p.getAttribute('data-pk-changed');
        this.lastHash = p.getAttribute('data-pk-hash');
        if(this.p.getAttribute('data-pk-init')) {
            this.setFailed(false);
            this.setChanged(false);
            this.setProcessing(false);
            this.setLastHash(null);
            this.p.removeAttribute('data-pk-init');
        }
    }

    public getElement() {
        return this.p;
    }

    public getText():string {
        return decode(this.p.textContent.trim());
    }

    public setProcessing(processing:boolean):void {
        this.processing = processing;
        if(!processing) {
            this.p.removeAttribute('data-pk-processing');
        }   else {
            this.p.setAttribute('data-pk-processing', "true");
        }
    }

    public isProcessing(): boolean {
        return this.processing;
    }

    public isChanged(): boolean {
        return this.changed;
    }

    public getLastHash(): string {
        return this.lastHash;
    }

    public setLastHash(newHash: string): void {
        this.lastHash = newHash;
        if(newHash == null) {
            this.p.removeAttribute('data-pk-hash');
        }   else {
            this.p.setAttribute('data-pk-hash', newHash);
        }
    }

    public setFailed(failed:boolean):void {
        this.failed = failed;
        if(failed) {
            this.p.setAttribute('data-pk-unprocessed', true);
            this.p.setAttribute('data-tooltip', 'Při opravě odstavce došlo k chybě.');
            $(this.p).on('click', () => {
                this.p.removeAttribute('data-tooltip');
            })
            this.p.removeAttribute('data-pk-processing');
        }   else {
            this.p.removeAttribute('data-pk-unprocessed');
            this.p.removeAttribute('data-tooltip');
        }
    }

    public setChanged(changed: boolean): void {
        this.changed = changed;
        if(changed) { 
            this.p.setAttribute('data-pk-changed', "true");
        }   else {
            this.p.removeAttribute('data-pk-changed');
        }
    }
    public isEmpty() {
        return this.p.textContent.trim().length === 0;
    }

    public clean() {
        this.p.removeAttribute('data-pk-hash');
    }
}