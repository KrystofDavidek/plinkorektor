import { config } from '../Config';
import { Mistake } from '../correction/Mistake';
import { TextChunk } from '../correction/TextChunk';
import * as $ from 'jquery';

export type MistakeStructure = {
  base: number;
  tokens: {
    token: string;
    at: number;
    description: string;
  }[];
};

export type MistakeCoords = {
  mistakeId: string;
  chunk: TextChunk;
  base: number;
};
export abstract class ProofreaderGui {
  protected processing;
  public wasAPICalled;

  abstract isProcessing(): boolean;
  abstract setProcessing(processing: boolean): void;
  abstract setProcessingChunk(chunk: TextChunk): void;
  abstract setProcessingFinishedChunk(chunk: TextChunk): void;
  abstract getChunks(): TextChunk[];
  abstract wrapTokens(chunk: TextChunk, tokens: string[], tokenPos: { from: number; to: number }[]): void;
  abstract cleanTokens(chunk: TextChunk): void;
  abstract getBookmark(): any;
  abstract moveToBookmark(bookmark: any);
  abstract wrapMistakeContext(chunk: TextChunk, tokenId: number);
  abstract visualizeMistakes(chunk: TextChunk, pos: number, token);

  protected abstract fixMistake(chunk: TextChunk, mistakeId, correctionRules);

  protected findSameMistakes(chunk: TextChunk, mistakeId: string, allChunks: TextChunk[]): MistakeCoords[] {
    let mistakes: Mistake[] = config.mistakes.getMistakes(chunk.getLastHash());
    let selectedMistake: Mistake;
    mistakes.forEach((mistake) => {
      if (mistake.getId() === mistakeId) {
        selectedMistake = mistake;
      }
    });
    let mistakeStructure = this.getMistakeStructure(chunk, selectedMistake);

    // find corresponding mistakes in all chunks
    let sameMistakes: MistakeCoords[] = [];
    allChunks.forEach((currentChunk: TextChunk) => {
      mistakes = config.mistakes.getMistakes(currentChunk.getLastHash());
      mistakes.forEach((currentMistake) => {
        let mistStructure: MistakeStructure = this.getMistakeStructure(currentChunk, currentMistake);
        if (
          mistStructure.tokens.every(
            (tok, i) =>
              tok.at == mistakeStructure.tokens[i].at &&
              tok.description == mistakeStructure.tokens[i].description &&
              tok.token == mistakeStructure.tokens[i].token,
          )
        ) {
          sameMistakes.push({
            mistakeId: currentMistake.getId(),
            chunk: currentChunk,
            base: mistStructure.base,
          });
        }
      });
    });
    return sameMistakes;
  }

  protected getMistakeStructure(chunk, mistake: Mistake): MistakeStructure {
    let tokens = chunk.getTokens();
    let mistakeStructure = {
      base: mistake.getTokens()[0],
      tokens: [],
    };
    mistake.getTokens().forEach((tokenPos: number) => {
      let tokenForm = $(tokens[tokenPos]).text();
      let tokenRelativePos = tokenPos - mistakeStructure.base;
      mistakeStructure.tokens.push({
        token: tokenForm,
        at: tokenRelativePos,
        description: mistake.getName(),
      });
    });
    return mistakeStructure;
  }

  protected ignoreMistake(chunk: TextChunk, mistakeId: string) {
    let allChunks = this.getChunks();
    let sameMistakes: MistakeCoords[] = this.findSameMistakes(chunk, mistakeId, allChunks);
    // Remove mistake record to hide it afterwards.
    sameMistakes.forEach((coord: MistakeCoords) => {
      config.mistakes.removeMistake(coord.chunk.getLastHash(), coord.mistakeId);
    });
    // allChunks.forEach((currentChunk: TextChunk) => {
    //   currentChunk.highlightTokens();
    // });
  }

  protected fixAll(chunk: TextChunk, mistakeId: string, correctionRules) {
    let allChunks = this.getChunks();
    let originalBase = parseInt(Object.keys(correctionRules)[0]);
    let sameMistakes: MistakeCoords[] = this.findSameMistakes(chunk, mistakeId, allChunks);
    sameMistakes.forEach((coord: MistakeCoords) => {
      let rules = {};
      if (coord.chunk.getLastHash() === chunk.getLastHash() && mistakeId == coord.mistakeId) {
        rules = correctionRules;
      } else {
        Object.entries(correctionRules).forEach(([target, correctValue]: [any, string]) => {
          rules[target - originalBase + coord.base] = correctValue;
        });
      }
      this.fixMistake(coord.chunk, coord.mistakeId, rules);
    });
  }
}
