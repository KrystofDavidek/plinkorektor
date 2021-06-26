import { TextChunk } from "../correction/TextChunk";

export abstract class ProofreaderGui {

    protected processing;

    abstract setProcessing(processing: boolean): void;
    abstract getChunks(): TextChunk[];
    abstract wrapTokens(chunk: TextChunk, tokens: string[], tokenPos: {from: number, to: number}[]): void;
    abstract cleanTokens(chunk: TextChunk): void;
    abstract getBookmark(): any;
    abstract moveToBookmark(bookmark: any);
    abstract wrapMistakeContext(chunk: TextChunk, tokenId: number);
    abstract visualizeMistakes(chunk: TextChunk, pos: number, token);

}