abstract class TextChunk {
    protected processing: boolean;
    protected failed: boolean;
    protected changed: boolean;
    protected lastHash: string;

    abstract getElement(): any;
    abstract getText(): string;
    abstract getLastHash(): string;
    abstract setLastHash(newHash: string): void
    abstract setProcessing(val: boolean): void;
    abstract setFailed(val: boolean): void;
    abstract setChanged(changed: boolean): void;
    abstract isProcessing(): boolean;
    abstract isChanged(): boolean;
    abstract isEmpty(): boolean;
}