import { Correction } from './Correction';

export class Mistake {
    protected id: string; // Random identifier.
    protected tokens: number[]; // Tokens to be highlighted.
    protected description: string; // Description of the mistake.
    protected corrections: Correction[]; // List of possible corrections.
    protected about: {url: string; label: string}[]; // List of possible corrections.

    constructor() {
        this.id = Math.random().toString(36).replace(/[^a-z]+/g, '');
        this.tokens = [];
        this.description = '';
        this.corrections = [];
        this.about = [];
    }

    public setTokens(newTokens: number[]) {
        this.tokens = [... newTokens];
    }

    public setDescription(newDescription: string) {
        this.description = newDescription;
    }

    public setAbout(newAbout: {url: string; label: string}[]) {
        this.about = newAbout;
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

    public getDescription() {
        return this.description;
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
}