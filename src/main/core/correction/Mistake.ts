import { Correction } from './Correction';

export class Mistake {
  protected id: string; // Random identifier.
  protected tokens: number[]; // Tokens to be highlighted.
  protected name: string; // Name of the mistake.
  protected hint: string; // Hint of the mistake.
  protected corrections: Correction[]; // List of possible corrections.
  protected about: { url: string; label: string }[]; // List of possible links.
  protected flags: []; // List of possible flags.
  protected module: string;
  protected type: string;

  constructor() {
    this.id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '');
    this.tokens = [];
    this.name = '';
    this.corrections = [];
    this.about = [];
    this.flags = [];
  }

  public setTokens(newTokens: number[]) {
    this.tokens = [...newTokens];
  }

  public setName(name: string) {
    this.name = name;
  }

  public setHint(hint: string) {
    this.hint = hint;
  }

  public setAbout(newAbout: { url: string; label: string }[]) {
    this.about = newAbout;
  }

  public setFlags(flags: []) {
    this.flags = flags;
  }

  public setModule(module: string) {
    this.module = module;
  }

  public setType(type: string) {
    this.type = type;
  }

  public addCorrection(newCorrection: Correction) {
    this.corrections.push(newCorrection);
  }

  public clearCorrections() {
    this.corrections = [];
  }

  public getId() {
    return this.id;
  }

  public getAbout() {
    return this.about;
  }

  public getTokens() {
    return this.tokens;
  }

  public getCorrections() {
    return this.corrections;
  }

  public getFlags() {
    return this.flags;
  }

  public getModule() {
    return this.module;
  }

  public getType() {
    return this.type;
  }

  public getName() {
    return this.name;
  }

  public getHint() {
    return this.hint;
  }
}
