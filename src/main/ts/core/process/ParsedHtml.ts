export class ParsedHtml {
    elements: ParsedHtmlElement[];

    constructor() {
        this.elements = [];
    }

    add(element:ParsedHtmlElement) {
        this.elements.push(element);
    }

    join(parsedHtml: ParsedHtml) {
        this.elements.concat(parsedHtml.getElements());
    }

    getElements(): ParsedHtmlElement[] {
        return this.elements;
    }

    getHtml(): string {
        return this.elements.map((element) => element.content).join("");
    }

    getTextRangeElementIndices(from: number, to: number) {
        let indexedText = this.getIndexedText();
        let start = -1;
        let end = -1;
        for(let index of indexedText.indexes) {
            if(index.from <= from) {
                start = index.index;
            }
            if(index.to >= to && end == -1) {
                end = index.index;
            }
        }
        console.log(start, end);
        if(start == -1 || end == -1) {
            return [];
        }
        return {from: start, to: end};
    }

    getElementsRange(from, to) {
        return this.elements.slice(from, to + 1);
    }

    wrapTextRange(from: number, to: number) {
        let range = this.getTextRangeElementIndices(from, to);
    }

    getIndexedText(): {
        text: string; 
        indexes: {
            from: number, to: number, index: number 
        }[]
    } {
        let indexedText = {
            text: "",
            indexes: []
        };
        let charCount = 0;
        for(let index in this.elements) {
            if(this.elements[index].type == ParsedHtmlElementType.TEXT) {
                indexedText.text += this.elements[index].content;
                indexedText.indexes.push({
                    from: charCount,
                    to: charCount + this.elements[index].content.length - 1,
                    index: parseInt(index)
                });
                charCount += this.elements[index].content.length;
            }
        }
        return indexedText;
    }

    setLink(position, linkTo) {
        this.elements[position].linked = linkTo;
    }
}

export interface ParsedHtmlElement {
    type: ParsedHtmlElementType;
    content: string;
    linked?: number;
}

export enum ParsedHtmlElementType {
    TEXT,
    BEGIN,
    END,
    ISOLATED
}