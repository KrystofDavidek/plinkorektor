export class Correction {
    protected id: string; // Random identifier.
    protected description: string; // Description of the correction (button).
    protected rules: Record<number, string>; // Rules to apply (eg {1: 'foo'} means change token on pos. 1 to value 'foo').

    constructor() {
        this.id = Math.random().toString(36).replace(/[^a-z]+/g, '');
        this.description = '';
        this.rules = {};
    }

    public setDescription(newDescription: string) {
        this.description = newDescription;
    }

    public setRules(newRules: Record<number, string>) {
        this.rules = {... newRules};
    }

    public getId() {
        return this.id;
    }

    public getDescription() {
        return this.description;
    }

    public getRules() {
        return {... this.rules};
    }
}