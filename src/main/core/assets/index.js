"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var named_references_1 = require("./named-references");
var numeric_unicode_map_1 = require("./numeric-unicode-map");
var surrogate_pairs_1 = require("./surrogate-pairs");
var allNamedReferences = __assign(__assign({}, named_references_1.namedReferences), { all: named_references_1.namedReferences.html5 });
var encodeRegExps = {
    // HTML ENTITIES HACK HERE
    specialChars: /[ <>'"&]/g,
    nonAscii: /(?:[<>'"&\u0080-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g,
    nonAsciiPrintable: /(?:[<>'"&\x01-\x08\x11-\x15\x17-\x1F\x7f-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g,
    extensive: /(?:[\x01-\x0c\x0e-\x1f\x21-\x2c\x2e-\x2f\x3a-\x40\x5b-\x60\x7b-\x7d\x7f-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g
};
var defaultEncodeOptions = {
    mode: 'specialChars',
    level: 'all',
    numeric: 'decimal'
};
function encode(text, _a) {
    var _b = _a === void 0 ? defaultEncodeOptions : _a, _c = _b.mode, mode = _c === void 0 ? 'specialChars' : _c, _d = _b.numeric, numeric = _d === void 0 ? 'decimal' : _d, _e = _b.level, level = _e === void 0 ? 'all' : _e;
    if (!text) {
        return '';
    }
    var references = allNamedReferences[level].characters;
    var isHex = numeric === 'hexadecimal';
    return text.replace(encodeRegExps[mode], function (input) {
        var entity = references[input];
        if (entity) {
            return entity;
        }
        var code = input.length > 1 ? surrogate_pairs_1.getCodePoint(input, 0) : input.charCodeAt(0);
        return (isHex ? '&#x' + code.toString(16) : '&#' + code) + ';';
    });
}
exports.encode = encode;
var defaultDecodeOptions = {
    scope: 'body',
    level: 'all'
};
var strict = /&(?:#\d+|#x[\da-fA-F]+|[0-9a-zA-Z]+);/g;
var attribute = /&(?:#\d+|#x[\da-fA-F]+|[0-9a-zA-Z]+)[;=]?/g;
var baseDecodeRegExps = {
    xml: {
        strict: strict,
        attribute: attribute,
        body: named_references_1.bodyRegExps.xml
    },
    html4: {
        strict: strict,
        attribute: attribute,
        body: named_references_1.bodyRegExps.html4
    },
    html5: {
        strict: strict,
        attribute: attribute,
        body: named_references_1.bodyRegExps.html5
    }
};
var decodeRegExps = __assign(__assign({}, baseDecodeRegExps), { all: baseDecodeRegExps.html5 });
var fromCharCode = String.fromCharCode;
var outOfBoundsChar = fromCharCode(65533);
function decode(text, _a) {
    var _b = _a === void 0 ? defaultDecodeOptions : _a, _c = _b.level, level = _c === void 0 ? 'all' : _c, _d = _b.scope, scope = _d === void 0 ? level === 'xml' ? 'strict' : 'body' : _d;
    if (!text) {
        return '';
    }
    var references = allNamedReferences[level].entities;
    var isAttribute = scope === 'attribute';
    return text.replace(decodeRegExps[level][scope], function (entity) {
        if (isAttribute && entity[entity.length - 1] === '=') {
            return entity;
        }
        if (entity[1] != '#') {
            return references[entity] || entity;
        }
        var secondChar = entity[2];
        var code = secondChar == 'x' || secondChar == 'X' ? parseInt(entity.substr(3), 16) : parseInt(entity.substr(2));
        return code >= 0x10ffff
            ? outOfBoundsChar
            : code > 65535
                ? surrogate_pairs_1.fromCodePoint(code)
                : fromCharCode(numeric_unicode_map_1.numericUnicodeMap[code] || code);
    });
}
exports.decode = decode;
