import * as _ from "lodash";
export class ParsedHtml {
    elements: ParsedHtmlElement[];

    constructor() {
        this.elements = [];
    }

    add(element:ParsedHtmlElement) {
        this.elements.push(element);
    }

    join(parsedHtml: ParsedHtml) {
        this.elements = this.elements.concat(parsedHtml.getElements());
    }

    getElements(): ParsedHtmlElement[] {
        return this.elements;
    }

    getHtml(): string {
        return this.elements.map((element) => element.content).join("");
    }

    getTextRangeElementIndices(from: number, to: number): {
        from: {
            index: number, 
            position:number
        }, 
        to: {
            index: number, 
            position:number
        }
    } {
        let indexedText = this.getIndexedText();
        let start = null;
        let end = null;
        for(let index of indexedText.indexes) {
            if(index.from <= from) {
                start = {
                    position: from - index.from,
                    index: index.index
                };
            }
            if(index.to >= to && end == null) {
                end = {
                    position: to - index.from,
                    index: index.index
                };
            }
        }
        if(start == -1 || end == -1) {
            return null;
        }
        return {from: start, to: end};
    }

    getElementsRange(from, to) {
        return this.elements.slice(from, to + 1);
    }

    isolateToken(from: number, to: number, token: string) {
        let range = this.getTextRangeElementIndices(from, to);
        let fromWithToken = this.elements[range.from.index].content.substring(range.from.position);
        let fromBeforeToken = this.elements[range.from.index].content.substring(0, range.from.position);
        let toWithToken = this.elements[range.to.index].content.substring(0, range.to.position + 1); 
        let toAfterToken = this.elements[range.to.index].content.substring(range.to.position + 1);
        if(range.from.index == range.to.index) {
            let newElements: ParsedHtmlElement[] = []
            if(fromBeforeToken.length) {
                newElements.push({
                    type: ParsedHtmlElementType.TEXT,
                    content: fromBeforeToken
                });
            }
            newElements.push({
                type: ParsedHtmlElementType.TEXT,
                content: token
            });
            if(toAfterToken.length) {
                newElements.push({
                    type: ParsedHtmlElementType.TEXT,
                    content: toAfterToken
                });
            }
            this.elements = this.modifyRange(range.from.index, range.to.index, newElements);
        }   else {
            if(fromBeforeToken.length) {
                let newElements = [
                    {
                        type: ParsedHtmlElementType.TEXT,
                        content: fromBeforeToken
                    },
                    {
                        type: ParsedHtmlElementType.TEXT,
                        content: fromWithToken
                    }
                ];
                this.elements = this.modifyRange(range.from.index, range.from.index, newElements);
            }
            if(toAfterToken.length) {
                let newElements = [
                    {
                        type: ParsedHtmlElementType.TEXT,
                        content: toWithToken
                    },
                    {
                        type: ParsedHtmlElementType.TEXT,
                        content: toAfterToken
                    }
                ];
                this.elements = this.modifyRange(range.to.index + (fromBeforeToken.length ? 1 : 0), range.to.index + (fromBeforeToken.length ? 1 : 0), newElements);
            }
        }
        this.fixLinks();
    }
    
    wrapToken(from: number, to: number, token: string) {
        this.isolateToken(from, to, token);
        // FIND RELEVANT RANGE OF SEGMENTS (CLOSEST COMMON ANCESTOR TO TOKEN AND ALL OF ITS FORMATING)
        let range = this.getTextRangeElementIndices(from, to);
        let min = range.from.index;
        let max = range.to.index;
        let elements = this.getElementsRange(min, max);
        for (let element of elements) {
            if(element.linked !== undefined && element.linked < min) {
                min = element.linked;
            }
            if(element.linked !== undefined && element.linked > max) {
                max = element.linked;
            }
        }
        if(min == range.from.index && max == range.from.index) {
            let opening: ParsedHtmlElement[] = [{
                type: ParsedHtmlElementType.BEGIN,
                content: "<span class=\"pk-token\">",
                token: true,
                linked: elements.length + 2  
            }];
            let ending: ParsedHtmlElement[] = [{
                type: ParsedHtmlElementType.END,
                content: "</span>",
                token: true,
                linked: 0
            }]
            let wrappedElements: ParsedHtmlElement[] = opening.concat(elements, ending);
            this.elements = this.modifyRange(min, max, wrappedElements);
            this.fixLinks();
            return this.getElements();
        }
        let leftPos = range.from.index - min;
        let rightShift = max - range.to.index;
        elements = this.getElementsRange(min, max);
        elements = this.fixLinks(elements);
        let rightPos = elements.length - rightShift - 1;
        // FIND OPEN SPAN POS
        let start = leftPos - 1;
        while(start >= 0 && elements[start].type != ParsedHtmlElementType.TEXT) {
            if(elements[start].type == ParsedHtmlElementType.ISOLATED || (elements[start].type == ParsedHtmlElementType.BEGIN)) {
                leftPos = start;
            }
            start--;
        }
        // FIND CLOSE SPAN POS
        start = rightPos + 1;
        while(start < elements.length && elements[start].type != ParsedHtmlElementType.TEXT) {
            if(elements[start].type == ParsedHtmlElementType.ISOLATED || elements[start].type == ParsedHtmlElementType.END) {
                rightPos = start;
            }
            start++;
        }
        // FIX CROSSING TAGS
        let trailingEndTags: ParsedHtmlElement[] = [];
        let correspondingStartTags: ParsedHtmlElement[] = [];
        let trailingStartTags: ParsedHtmlElement[] = [];
        let correspondingEndTags: ParsedHtmlElement[] = [];
        for(let pos = leftPos; pos <= rightPos; pos++) {
            if(elements[pos].linked !== undefined) {
                if(elements[pos].type == ParsedHtmlElementType.BEGIN && elements[pos].linked > rightPos) {
                    trailingEndTags.push(_.cloneDeep(elements[elements[pos].linked]));
                    correspondingStartTags.push(_.cloneDeep(elements[pos]));
                }
                if(elements[pos].type == ParsedHtmlElementType.END && elements[pos].linked < leftPos) {
                    trailingStartTags.push(_.cloneDeep(elements[elements[pos].linked]));
                    correspondingEndTags.push(_.cloneDeep(elements[pos]));
                }
            }
        }
        // PUT IT TOGETHER
        let wrappedElements: ParsedHtmlElement[] = correspondingEndTags;
        wrappedElements.push({
            type: ParsedHtmlElementType.BEGIN,
            token: true,
            content: "<span class=\"pk-token\">",
            linked: rightPos + correspondingEndTags.length + trailingStartTags.length + trailingEndTags.length + 1
        });
        wrappedElements = wrappedElements.concat(trailingStartTags.reverse(), elements.slice(leftPos, rightPos + 1), trailingEndTags.reverse());
        wrappedElements.push({
            type: ParsedHtmlElementType.END,
            token: true,
            content: "</span>",
            linked: leftPos + correspondingEndTags.length    
        });
        wrappedElements = wrappedElements.concat(correspondingStartTags);
        // REPLACE ORIGINAL SEGMENTS BY WRAPPED VERSION AND FIX LINKS BETWEEN SEGMENTS
        this.elements = this.modifyRange(min, max, this.modifyRange(leftPos, rightPos, wrappedElements, elements));
        this.fixLinks();
        return this.getElements();
    }

    modifyRange(from: number, to: number, newElements: ParsedHtmlElement[], sourceRange?: ParsedHtmlElement[]) {
        if(!sourceRange) {
            sourceRange = this.elements;
        }
        let prefix = [];
        if(from > 0) {
            prefix = sourceRange.slice(0, from);
        }
        let sufix = [];
        if(to < sourceRange.length - 1) {
            sufix = sourceRange.slice(to + 1, this.elements.length);
        }
        return prefix.concat(newElements, sufix);
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

    fixLinks(elements?: ParsedHtmlElement[]) {
        if(!elements) {
            elements = this.elements;
        }
        let begins = [];
        for(let pos in elements) {
            if(elements[pos].type == ParsedHtmlElementType.BEGIN) {
                begins.push(pos);
            } 
            if(elements[pos].type == ParsedHtmlElementType.END) {
                let link = begins.pop();
                elements[pos].linked = parseInt(link);
                elements[link].linked = parseInt(pos);
            }
        }
        return elements;
    }
}

export interface ParsedHtmlElement {
    type: ParsedHtmlElementType;
    content: string;
    linked?: number;
    token?: boolean;
}

export enum ParsedHtmlElementType {
    TEXT,
    BEGIN,
    END,
    ISOLATED
}