import { config } from '../Config';
import { message as msg } from '../Message';
import { Mistake } from './Mistake';

export class MistakeManager {
    protected mistakes: Record<string, Mistake[]>;

    constructor() {
        this.mistakes = {};
    }

    public addMistake(hash: string, mistake: Mistake) {
        if (!this.mistakes.hasOwnProperty(hash)) {
            this.mistakes[hash] = [];
            msg('Hash "' + hash + '" was not present in the mistakes dict, so it was added.');
        }

        this.mistakes[hash].push(mistake);
        msg('Mistake was added to hash "' + hash + '".');
    }

    public removeMistake(hash: string, mistakeId: string) {
        if (!this.mistakes.hasOwnProperty(hash)) { return; }

        this.mistakes[hash].forEach((mistake) => {
            if (mistake.getId() === mistakeId) {
                const index = this.mistakes[hash].indexOf(mistake);
                if (index > -1) {
                    this.mistakes[hash].splice(index, 1);
                }

                return;
            }
        });
    }

    public copyMistakes(oldHash: string, newHash: string) {
        if (!this.mistakes.hasOwnProperty(oldHash)) { return; }

        this.mistakes[newHash] = [... this.mistakes[oldHash]];
    }

    public removeMistakes(hash: string) {
        delete this.mistakes[hash];
        msg('Hash "' + hash + '" was removed from the mistakes list.');
    }

    public getMistakes(hash: string) {
        if (!this.mistakes.hasOwnProperty(hash)) {
            return [];
        }

        return [... this.mistakes[hash]];
    }

    public autoremove() {
        const keys = Object.keys(this.mistakes);

        // Find inactive hashes
        config.editor.dom.select('p[data-pk-hash]').forEach((p) => {
            const hash = p.getAttribute('data-pk-hash');
            const index = keys.indexOf(hash);
            if (index > -1) {
                keys.splice(index, 1);
            }
        });

        // Delete them one by one
        keys.forEach((key) => {
            this.removeMistakes(key);
        });
    }
}