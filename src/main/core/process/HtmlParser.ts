import * as $ from 'jquery';
import { ParsedHtml, ParsedHtmlElementType } from './ParsedHtml';


export const HTML_TOKEN_START = "<span class=\"pk-token\">";
export const HTML_TOKEN_END = "</span>";


export function parseEl(element): ParsedHtml {
    let parsedHtml = new ParsedHtml(HTML_TOKEN_START, HTML_TOKEN_END);
    element.contents().map(function (ind, el) {
        if (el.nodeType == 3) {
            parsedHtml.add({ type: ParsedHtmlElementType.TEXT, content: el.textContent });
        } else {
            var attrs = [];
            if (el.attributes && el.attributes.length) {
                attrs = Array.from(el.attributes).map(function (attr: any) {
                    return " " + attr.name + "=\"" + attr.textContent + "\"";
                })
            }
            if (el.children.length || el.textContent.length) {
                let startPos = parsedHtml.getElements().length;
                parsedHtml.add({ type: ParsedHtmlElementType.BEGIN, content: "<" + el.localName + attrs.join("") + ">" });
                if (el.children.length) {
                    parsedHtml.join(parseEl($(el)));
                } else {
                    parsedHtml.add({ type: ParsedHtmlElementType.TEXT, content: el.textContent });
                }
                let endPos = parsedHtml.getElements().length;
                parsedHtml.add({ type: ParsedHtmlElementType.END, content: "</" + el.localName + ">" });
                parsedHtml.setLink(startPos, endPos);
                parsedHtml.setLink(endPos, startPos);
            }
            else {
                parsedHtml.add({ type: ParsedHtmlElementType.ISOLATED, content: el.outerHTML });
            }
        }
    });
    return parsedHtml;
}
