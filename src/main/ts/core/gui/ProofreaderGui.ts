abstract class ProofreaderGui {

    protected processing;

    abstract setProcessing(processing: boolean): void;
    abstract getChunks(): TextChunk[];

}