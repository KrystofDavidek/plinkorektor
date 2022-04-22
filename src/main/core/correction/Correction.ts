type Action = {
  type: 'description' | 'remove' | 'change';
  value: string | string[];
};

export class Correction {
  protected id: string; // Random identifier.
  protected description: string; // Description of the correction (button).
  protected rules: Record<number, string>; // Rules to apply (eg {1: 'foo'} means change token on pos. 1 to value 'foo').
  protected action: Action; // Action for better mistake visualization.

  constructor() {
    this.id = Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, '');
    this.description = '';
    this.rules = {};
  }

  public setDescription(newDescription: string) {
    this.description = newDescription;
  }

  public setRules(newRules: Record<number, string>) {
    this.rules = { ...newRules };
  }

  public setAction(newAction: Action) {
    this.action = newAction;
  }

  public getId() {
    return this.id;
  }

  public getDescription() {
    return this.description;
  }

  public getRules() {
    return { ...this.rules };
  }

  public getAction() {
    return this.action;
  }
}
