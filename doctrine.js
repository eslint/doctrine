/*
  Copyright (C) 2012-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2014 Dan Tao <daniel.tao@gmail.com>
  Copyright (C) 2013 Andrew Eisenberg <andrew@eisenberg.as>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var VERSION,
        typed,
        jsdoc,
        esutils,
        isArray,
        hasOwnProperty;

    // Sync with package.json.
    VERSION = require('./package.json').version;

    esutils = require('esutils');

    function sliceSource(source, index, last) {
        return source.slice(index, last);
    }

    isArray = Array.isArray;
    if (!isArray) {
        isArray = function isArray(ary) {
            return Object.prototype.toString.call(ary) === '[object Array]';
        };
    }

    hasOwnProperty = (function () {
        var func = Object.prototype.hasOwnProperty;
        return function hasOwnProperty(obj, name) {
            return func.call(obj, name);
        };
    }());

    function shallowCopy(obj) {
        var ret = {}, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }

    function isASCIIAlphanumeric(ch) {
        return (ch >= 0x61  /* 'a' */ && ch <= 0x7A  /* 'z' */) ||
            (ch >= 0x41  /* 'A' */ && ch <= 0x5A  /* 'Z' */) ||
            (ch >= 0x30  /* '0' */ && ch <= 0x39  /* '9' */);
    }

    function isTypeName(ch) {
        return '><(){}[],:*|?!='.indexOf(String.fromCharCode(ch)) === -1 && !esutils.code.isWhiteSpace(ch) && !esutils.code.isLineTerminator(ch);
    }

    function isParamTitle(title) {
        return title === 'param' || title === 'argument' || title === 'arg';
    }

    function isProperty(title) {
        return title === 'property' || title === 'prop';
    }

    function isNameParameterRequired(title) {
        return isParamTitle(title) || isProperty(title) ||
            title === 'alias' || title === 'this' || title === 'mixes' || title === 'requires';
    }

    function isAllowedName(title) {
        return isNameParameterRequired(title) || title === 'const' || title === 'constant';
    }

    function isAllowedNested(title) {
        return isProperty(title) || isParamTitle(title);
    }

    function isTypeParameterRequired(title) {
        return isParamTitle(title) || title === 'define' || title === 'enum' ||
            title === 'implements' || title === 'return' ||
            title === 'this' || title === 'type' || title === 'typedef' ||
            title === 'returns' || isProperty(title);
    }

    // Consider deprecation instead using 'isTypeParameterRequired' and 'Rules' declaration to pick when a type is optional/required
    // This would require changes to 'parseType'
    function isAllowedType(title) {
        return isTypeParameterRequired(title) || title === 'throws' || title === 'const' || title === 'constant' ||
            title === 'namespace' || title === 'member' || title === 'var' || title === 'module' ||
            title === 'constructor' || title === 'class' || title === 'extends' || title === 'augments' ||
            title === 'public' || title === 'private' || title === 'protected';
    }

    function DoctrineError(message) {
        this.name = 'DoctrineError';
        this.message = message;
    }
    DoctrineError.prototype = (function () {
        var Middle = function () { };
        Middle.prototype = Error.prototype;
        return new Middle();
    }());
    DoctrineError.prototype.constructor = DoctrineError;

    function throwError(message) {
        throw new DoctrineError(message);
    }

    function assert(cond, text) {
        if (VERSION.slice(-3) === 'dev') {
            if (!cond) {
                throwError(text);
            }
        }
    }

    function trim(str) {
        return str.replace(/^\s+/, '').replace(/\s+$/, '');
    }

    function unwrapComment(doc) {
        // JSDoc comment is following form
        //   /**
        //    * .......
        //    */
        // remove /**, */ and *
        var BEFORE_STAR = 0,
            STAR = 1,
            AFTER_STAR = 2,
            index,
            len,
            mode,
            result,
            ch;

        doc = doc.replace(/^\/\*\*?/, '').replace(/\*\/$/, '');
        index = 0;
        len = doc.length;
        mode = BEFORE_STAR;
        result = '';

        while (index < len) {
            ch = doc.charCodeAt(index);
            switch (mode) {
            case BEFORE_STAR:
                if (esutils.code.isLineTerminator(ch)) {
                    result += String.fromCharCode(ch);
                } else if (ch === 0x2A  /* '*' */) {
                    mode = STAR;
                } else if (!esutils.code.isWhiteSpace(ch)) {
                    result += String.fromCharCode(ch);
                    mode = AFTER_STAR;
                }
                break;

            case STAR:
                if (!esutils.code.isWhiteSpace(ch)) {
                    result += String.fromCharCode(ch);
                }
                mode = esutils.code.isLineTerminator(ch) ? BEFORE_STAR : AFTER_STAR;
                break;

            case AFTER_STAR:
                result += String.fromCharCode(ch);
                if (esutils.code.isLineTerminator(ch)) {
                    mode = BEFORE_STAR;
                }
                break;
            }
            index += 1;
        }

        return result;
    }

    // Type Expression Parser

    (function (exports) {
        var Syntax,
            Token,
            source,
            length,
            index,
            previous,
            token,
            value;

        Syntax = {
            NullableLiteral: 'NullableLiteral',
            AllLiteral: 'AllLiteral',
            NullLiteral: 'NullLiteral',
            UndefinedLiteral: 'UndefinedLiteral',
            VoidLiteral: 'VoidLiteral',
            UnionType: 'UnionType',
            ArrayType: 'ArrayType',
            RecordType: 'RecordType',
            FieldType: 'FieldType',
            FunctionType: 'FunctionType',
            ParameterType: 'ParameterType',
            RestType: 'RestType',
            NonNullableType: 'NonNullableType',
            OptionalType: 'OptionalType',
            NullableType: 'NullableType',
            NameExpression: 'NameExpression',
            TypeApplication: 'TypeApplication'
        };

        Token = {
            ILLEGAL: 0,    // ILLEGAL
            DOT_LT: 1,     // .<
            REST: 2,       // ...
            LT: 3,         // <
            GT: 4,         // >
            LPAREN: 5,     // (
            RPAREN: 6,     // )
            LBRACE: 7,     // {
            RBRACE: 8,     // }
            LBRACK: 9,    // [
            RBRACK: 10,    // ]
            COMMA: 11,     // ,
            COLON: 12,     // :
            STAR: 13,      // *
            PIPE: 14,      // |
            QUESTION: 15,  // ?
            BANG: 16,      // !
            EQUAL: 17,     // =
            NAME: 18,      // name token
            STRING: 19,    // string
            NUMBER: 20,    // number
            EOF: 21
        };

        function Context(previous, index, token, value) {
            this._previous = previous;
            this._index = index;
            this._token = token;
            this._value = value;
        }

        Context.prototype.restore = function () {
            previous = this._previous;
            index = this._index;
            token = this._token;
            value = this._value;
        };

        Context.save = function () {
            return new Context(previous, index, token, value);
        };

        function advance() {
            var ch = source.charAt(index);
            index += 1;
            return ch;
        }

        function scanHexEscape(prefix) {
            var i, len, ch, code = 0;

            len = (prefix === 'u') ? 4 : 2;
            for (i = 0; i < len; ++i) {
                if (index < length && esutils.code.isHexDigit(source.charCodeAt(index))) {
                    ch = advance();
                    code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
                } else {
                    return '';
                }
            }
            return String.fromCharCode(code);
        }

        function scanString() {
            var str = '', quote, ch, code, unescaped, restore; //TODO review removal octal = false
            quote = source.charAt(index);
            ++index;

            while (index < length) {
                ch = advance();

                if (ch === quote) {
                    quote = '';
                    break;
                } else if (ch === '\\') {
                    ch = advance();
                    if (!esutils.code.isLineTerminator(ch.charCodeAt(0))) {
                        switch (ch) {
                        case 'n':
                            str += '\n';
                            break;
                        case 'r':
                            str += '\r';
                            break;
                        case 't':
                            str += '\t';
                            break;
                        case 'u':
                        case 'x':
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                str += unescaped;
                            } else {
                                index = restore;
                                str += ch;
                            }
                            break;
                        case 'b':
                            str += '\b';
                            break;
                        case 'f':
                            str += '\f';
                            break;
                        case 'v':
                            str += '\v';
                            break;

                        default:
                            if (esutils.code.isOctalDigit(ch.charCodeAt(0))) {
                                code = '01234567'.indexOf(ch);

                                // \0 is not octal escape sequence
                                // Deprecating unused code. TODO review removal
                                //if (code !== 0) {
                                //    octal = true;
                                //}

                                if (index < length && esutils.code.isOctalDigit(source.charCodeAt(index))) {
                                    //TODO Review Removal octal = true;
                                    code = code * 8 + '01234567'.indexOf(advance());

                                    // 3 digits are only allowed when string starts
                                    // with 0, 1, 2, 3
                                    if ('0123'.indexOf(ch) >= 0 &&
                                            index < length &&
                                            esutils.code.isOctalDigit(source.charCodeAt(index))) {
                                        code = code * 8 + '01234567'.indexOf(advance());
                                    }
                                }
                                str += String.fromCharCode(code);
                            } else {
                                str += ch;
                            }
                            break;
                        }
                    } else {
                        if (ch ===  '\r' && source.charCodeAt(index) === 0x0A  /* '\n' */) {
                            ++index;
                        }
                    }
                } else if (esutils.code.isLineTerminator(ch.charCodeAt(0))) {
                    break;
                } else {
                    str += ch;
                }
            }

            if (quote !== '') {
                throwError('unexpected quote');
            }

            value = str;
            return Token.STRING;
        }

        function scanNumber() {
            var number, ch;

            number = '';
            ch = source.charCodeAt(index);

            if (ch !== 0x2E  /* '.' */) {
                number = advance();
                ch = source.charCodeAt(index);

                if (number === '0') {
                    if (ch === 0x78  /* 'x' */ || ch === 0x58  /* 'X' */) {
                        number += advance();
                        while (index < length) {
                            ch = source.charCodeAt(index);
                            if (!esutils.code.isHexDigit(ch)) {
                                break;
                            }
                            number += advance();
                        }

                        if (number.length <= 2) {
                            // only 0x
                            throwError('unexpected token');
                        }

                        if (index < length) {
                            ch = source.charCodeAt(index);
                            if (esutils.code.isIdentifierStart(ch)) {
                                throwError('unexpected token');
                            }
                        }
                        value = parseInt(number, 16);
                        return Token.NUMBER;
                    }

                    if (esutils.code.isOctalDigit(ch)) {
                        number += advance();
                        while (index < length) {
                            ch = source.charCodeAt(index);
                            if (!esutils.code.isOctalDigit(ch)) {
                                break;
                            }
                            number += advance();
                        }

                        if (index < length) {
                            ch = source.charCodeAt(index);
                            if (esutils.code.isIdentifierStart(ch) || esutils.code.isDecimalDigit(ch)) {
                                throwError('unexpected token');
                            }
                        }
                        value = parseInt(number, 8);
                        return Token.NUMBER;
                    }

                    if (esutils.code.isDecimalDigit(ch)) {
                        throwError('unexpected token');
                    }
                }

                while (index < length) {
                    ch = source.charCodeAt(index);
                    if (!esutils.code.isDecimalDigit(ch)) {
                        break;
                    }
                    number += advance();
                }
            }

            if (ch === 0x2E  /* '.' */) {
                number += advance();
                while (index < length) {
                    ch = source.charCodeAt(index);
                    if (!esutils.code.isDecimalDigit(ch)) {
                        break;
                    }
                    number += advance();
                }
            }

            if (ch === 0x65  /* 'e' */ || ch === 0x45  /* 'E' */) {
                number += advance();

                ch = source.charCodeAt(index);
                if (ch === 0x2B  /* '+' */ || ch === 0x2D  /* '-' */) {
                    number += advance();
                }

                ch = source.charCodeAt(index);
                if (esutils.code.isDecimalDigit(ch)) {
                    number += advance();
                    while (index < length) {
                        ch = source.charCodeAt(index);
                        if (!esutils.code.isDecimalDigit(ch)) {
                            break;
                        }
                        number += advance();
                    }
                } else {
                    throwError('unexpected token');
                }
            }

            if (index < length) {
                ch = source.charCodeAt(index);
                if (esutils.code.isIdentifierStart(ch)) {
                    throwError('unexpected token');
                }
            }

            value = parseFloat(number);
            return Token.NUMBER;
        }


        function scanTypeName() {
            var ch, ch2;

            value = advance();
            while (index < length && isTypeName(source.charCodeAt(index))) {
                ch = source.charCodeAt(index);
                if (ch === 0x2E  /* '.' */) {
                    if ((index + 1) >= length) {
                        return Token.ILLEGAL;
                    }
                    ch2 = source.charCodeAt(index + 1);
                    if (ch2 === 0x3C  /* '<' */) {
                        break;
                    }
                }
                value += advance();
            }
            return Token.NAME;
        }

        function next() {
            var ch;

            previous = index;

            while (index < length && esutils.code.isWhiteSpace(source.charCodeAt(index))) {
                advance();
            }
            if (index >= length) {
                token = Token.EOF;
                return token;
            }

            ch = source.charCodeAt(index);
            switch (ch) {
            case 0x27:  /* ''' */
            case 0x22:  /* '"' */
                token = scanString();
                return token;

            case 0x3A:  /* ':' */
                advance();
                token = Token.COLON;
                return token;

            case 0x2C:  /* ',' */
                advance();
                token = Token.COMMA;
                return token;

            case 0x28:  /* '(' */
                advance();
                token = Token.LPAREN;
                return token;

            case 0x29:  /* ')' */
                advance();
                token = Token.RPAREN;
                return token;

            case 0x5B:  /* '[' */
                advance();
                token = Token.LBRACK;
                return token;

            case 0x5D:  /* ']' */
                advance();
                token = Token.RBRACK;
                return token;

            case 0x7B:  /* '{' */
                advance();
                token = Token.LBRACE;
                return token;

            case 0x7D:  /* '}' */
                advance();
                token = Token.RBRACE;
                return token;

            case 0x2E:  /* '.' */
                if (index + 1 < length) {
                    ch = source.charCodeAt(index + 1);
                    if (ch === 0x3C  /* '<' */) {
                        advance();  // '.'
                        advance();  // '<'
                        token = Token.DOT_LT;
                        return token;
                    }

                    if (ch === 0x2E  /* '.' */ && index + 2 < length && source.charCodeAt(index + 2) === 0x2E  /* '.' */) {
                        advance();  // '.'
                        advance();  // '.'
                        advance();  // '.'
                        token = Token.REST;
                        return token;
                    }

                    if (esutils.code.isDecimalDigit(ch)) {
                        token = scanNumber();
                        return token;
                    }
                }
                token = Token.ILLEGAL;
                return token;

            case 0x3C:  /* '<' */
                advance();
                token = Token.LT;
                return token;

            case 0x3E:  /* '>' */
                advance();
                token = Token.GT;
                return token;

            case 0x2A:  /* '*' */
                advance();
                token = Token.STAR;
                return token;

            case 0x7C:  /* '|' */
                advance();
                token = Token.PIPE;
                return token;

            case 0x3F:  /* '?' */
                advance();
                token = Token.QUESTION;
                return token;

            case 0x21:  /* '!' */
                advance();
                token = Token.BANG;
                return token;

            case 0x3D:  /* '=' */
                advance();
                token = Token.EQUAL;
                return token;

            default:
                if (esutils.code.isDecimalDigit(ch)) {
                    token = scanNumber();
                    return token;
                }

                // type string permits following case,
                //
                // namespace.module.MyClass
                //
                // this reduced 1 token TK_NAME
                assert(isTypeName(ch));
                token = scanTypeName();
                return token;
            }
        }

        function consume(target, text) {
            assert(token === target, text || 'consumed token not matched');
            next();
        }

        function expect(target) {
            if (token !== target) {
                throwError('unexpected token');
            }
            next();
        }

        // UnionType := '(' TypeUnionList ')'
        //
        // TypeUnionList :=
        //     <<empty>>
        //   | NonemptyTypeUnionList
        //
        // NonemptyTypeUnionList :=
        //     TypeExpression
        //   | TypeExpression '|' NonemptyTypeUnionList
        function parseUnionType() {
            var elements;
            consume(Token.LPAREN, 'UnionType should start with (');
            elements = [];
            if (token !== Token.RPAREN) {
                while (true) {
                    elements.push(parseTypeExpression());
                    if (token === Token.RPAREN) {
                        break;
                    }
                    expect(Token.PIPE);
                }
            }
            consume(Token.RPAREN, 'UnionType should end with )');
            return {
                type: Syntax.UnionType,
                elements: elements
            };
        }

        // ArrayType := '[' ElementTypeList ']'
        //
        // ElementTypeList :=
        //     <<empty>>
        //  | TypeExpression
        //  | '...' TypeExpression
        //  | TypeExpression ',' ElementTypeList
        function parseArrayType() {
            var elements;
            consume(Token.LBRACK, 'ArrayType should start with [');
            elements = [];
            while (token !== Token.RBRACK) {
                if (token === Token.REST) {
                    consume(Token.REST);
                    elements.push({
                        type: Syntax.RestType,
                        expression: parseTypeExpression()
                    });
                    break;
                } else {
                    elements.push(parseTypeExpression());
                }
                if (token !== Token.RBRACK) {
                    expect(Token.COMMA);
                }
            }
            expect(Token.RBRACK);
            return {
                type: Syntax.ArrayType,
                elements: elements
            };
        }

        function parseFieldName() {
            var v = value;
            if (token === Token.NAME || token === Token.STRING) {
                next();
                return v;
            }

            if (token === Token.NUMBER) {
                consume(Token.NUMBER);
                return String(v);
            }

            throwError('unexpected token');
        }

        // FieldType :=
        //     FieldName
        //   | FieldName ':' TypeExpression
        //
        // FieldName :=
        //     NameExpression
        //   | StringLiteral
        //   | NumberLiteral
        //   | ReservedIdentifier
        function parseFieldType() {
            var key;

            key = parseFieldName();
            if (token === Token.COLON) {
                consume(Token.COLON);
                return {
                    type: Syntax.FieldType,
                    key: key,
                    value: parseTypeExpression()
                };
            }
            return {
                type: Syntax.FieldType,
                key: key,
                value: null
            };
        }

        // RecordType := '{' FieldTypeList '}'
        //
        // FieldTypeList :=
        //     <<empty>>
        //   | FieldType
        //   | FieldType ',' FieldTypeList
        function parseRecordType() {
            var fields;

            consume(Token.LBRACE, 'RecordType should start with {');
            fields = [];
            if (token === Token.COMMA) {
                consume(Token.COMMA);
            } else {
                while (token !== Token.RBRACE) {
                    fields.push(parseFieldType());
                    if (token !== Token.RBRACE) {
                        expect(Token.COMMA);
                    }
                }
            }
            expect(Token.RBRACE);
            return {
                type: Syntax.RecordType,
                fields: fields
            };
        }

        function parseNameExpression() {
            var name = value;
            expect(Token.NAME);
            return {
                type: Syntax.NameExpression,
                name: name
            };
        }

        // TypeExpressionList :=
        //     TopLevelTypeExpression
        //   | TopLevelTypeExpression ',' TypeExpressionList
        function parseTypeExpressionList() {
            var elements = [];

            elements.push(parseTop());
            while (token === Token.COMMA) {
                consume(Token.COMMA);
                elements.push(parseTop());
            }
            return elements;
        }

        // TypeName :=
        //     NameExpression
        //   | NameExpression TypeApplication
        //
        // TypeApplication :=
        //     '.<' TypeExpressionList '>'
        //   | '<' TypeExpressionList '>'   // this is extension of doctrine
        function parseTypeName() {
            var expr, applications;

            expr = parseNameExpression();
            if (token === Token.DOT_LT || token === Token.LT) {
                next();
                applications = parseTypeExpressionList();
                expect(Token.GT);
                return {
                    type: Syntax.TypeApplication,
                    expression: expr,
                    applications: applications
                };
            }
            return expr;
        }

        // ResultType :=
        //     <<empty>>
        //   | ':' void
        //   | ':' TypeExpression
        //
        // BNF is above
        // but, we remove <<empty>> pattern, so token is always TypeToken::COLON
        function parseResultType() {
            consume(Token.COLON, 'ResultType should start with :');
            if (token === Token.NAME && value === 'void') {
                consume(Token.NAME);
                return {
                    type: Syntax.VoidLiteral
                };
            }
            return parseTypeExpression();
        }

        // ParametersType :=
        //     RestParameterType
        //   | NonRestParametersType
        //   | NonRestParametersType ',' RestParameterType
        //
        // RestParameterType :=
        //     '...'
        //     '...' Identifier
        //
        // NonRestParametersType :=
        //     ParameterType ',' NonRestParametersType
        //   | ParameterType
        //   | OptionalParametersType
        //
        // OptionalParametersType :=
        //     OptionalParameterType
        //   | OptionalParameterType, OptionalParametersType
        //
        // OptionalParameterType := ParameterType=
        //
        // ParameterType := TypeExpression | Identifier ':' TypeExpression
        //
        // Identifier is "new" or "this"
        function parseParametersType() {
            var params = [], optionalSequence = false, expr, rest = false;

            while (token !== Token.RPAREN) {
                if (token === Token.REST) {
                    // RestParameterType
                    consume(Token.REST);
                    rest = true;
                }

                expr = parseTypeExpression();
                if (expr.type === Syntax.NameExpression && token === Token.COLON) {
                    // Identifier ':' TypeExpression
                    consume(Token.COLON);
                    expr = {
                        type: Syntax.ParameterType,
                        name: expr.name,
                        expression: parseTypeExpression()
                    };
                }
                if (token === Token.EQUAL) {
                    consume(Token.EQUAL);
                    expr = {
                        type: Syntax.OptionalType,
                        expression: expr
                    };
                    optionalSequence = true;
                } else {
                    if (optionalSequence) {
                        throwError('unexpected token');
                    }
                }
                if (rest) {
                    expr = {
                        type: Syntax.RestType,
                        expression: expr
                    };
                }
                params.push(expr);
                if (token !== Token.RPAREN) {
                    expect(Token.COMMA);
                }
            }
            return params;
        }

        // FunctionType := 'function' FunctionSignatureType
        //
        // FunctionSignatureType :=
        //   | TypeParameters '(' ')' ResultType
        //   | TypeParameters '(' ParametersType ')' ResultType
        //   | TypeParameters '(' 'this' ':' TypeName ')' ResultType
        //   | TypeParameters '(' 'this' ':' TypeName ',' ParametersType ')' ResultType
        function parseFunctionType() {
            var isNew, thisBinding, params, result, fnType;
            assert(token === Token.NAME && value === 'function', 'FunctionType should start with \'function\'');
            consume(Token.NAME);

            // Google Closure Compiler is not implementing TypeParameters.
            // So we do not. if we don't get '(', we see it as error.
            expect(Token.LPAREN);

            isNew = false;
            params = [];
            thisBinding = null;
            if (token !== Token.RPAREN) {
                // ParametersType or 'this'
                if (token === Token.NAME &&
                        (value === 'this' || value === 'new')) {
                    // 'this' or 'new'
                    // 'new' is Closure Compiler extension
                    isNew = value === 'new';
                    consume(Token.NAME);
                    expect(Token.COLON);
                    thisBinding = parseTypeName();
                    if (token === Token.COMMA) {
                        consume(Token.COMMA);
                        params = parseParametersType();
                    }
                } else {
                    params = parseParametersType();
                }
            }

            expect(Token.RPAREN);

            result = null;
            if (token === Token.COLON) {
                result = parseResultType();
            }

            fnType = {
                type: Syntax.FunctionType,
                params: params,
                result: result
            };
            if (thisBinding) {
                // avoid adding null 'new' and 'this' properties
                fnType['this'] = thisBinding;
                if (isNew) {
                    fnType['new'] = true;
                }
            }
            return fnType;
        }

        // BasicTypeExpression :=
        //     '*'
        //   | 'null'
        //   | 'undefined'
        //   | TypeName
        //   | FunctionType
        //   | UnionType
        //   | RecordType
        //   | ArrayType
        function parseBasicTypeExpression() {
            var context;
            switch (token) {
            case Token.STAR:
                consume(Token.STAR);
                return {
                    type: Syntax.AllLiteral
                };

            case Token.LPAREN:
                return parseUnionType();

            case Token.LBRACK:
                return parseArrayType();

            case Token.LBRACE:
                return parseRecordType();

            case Token.NAME:
                if (value === 'null') {
                    consume(Token.NAME);
                    return {
                        type: Syntax.NullLiteral
                    };
                }

                if (value === 'undefined') {
                    consume(Token.NAME);
                    return {
                        type: Syntax.UndefinedLiteral
                    };
                }

                context = Context.save();
                if (value === 'function') {
                    try {
                        return parseFunctionType();
                    } catch (e) {
                        context.restore();
                    }
                }

                return parseTypeName();

            default:
                throwError('unexpected token');
            }
        }

        // TypeExpression :=
        //     BasicTypeExpression
        //   | '?' BasicTypeExpression
        //   | '!' BasicTypeExpression
        //   | BasicTypeExpression '?'
        //   | BasicTypeExpression '!'
        //   | '?'
        //   | BasicTypeExpression '[]'
        function parseTypeExpression() {
            var expr;

            if (token === Token.QUESTION) {
                consume(Token.QUESTION);
                if (token === Token.COMMA || token === Token.EQUAL || token === Token.RBRACE ||
                        token === Token.RPAREN || token === Token.PIPE || token === Token.EOF ||
                        token === Token.RBRACK) {
                    return {
                        type: Syntax.NullableLiteral
                    };
                }
                return {
                    type: Syntax.NullableType,
                    expression: parseBasicTypeExpression(),
                    prefix: true
                };
            }

            if (token === Token.BANG) {
                consume(Token.BANG);
                return {
                    type: Syntax.NonNullableType,
                    expression: parseBasicTypeExpression(),
                    prefix: true
                };
            }

            expr = parseBasicTypeExpression();
            if (token === Token.BANG) {
                consume(Token.BANG);
                return {
                    type: Syntax.NonNullableType,
                    expression: expr,
                    prefix: false
                };
            }

            if (token === Token.QUESTION) {
                consume(Token.QUESTION);
                return {
                    type: Syntax.NullableType,
                    expression: expr,
                    prefix: false
                };
            }

            if (token === Token.LBRACK) {
                consume(Token.LBRACK);
                consume(Token.RBRACK, 'expected an array-style type declaration (' + value + '[])');
                return {
                    type: Syntax.TypeApplication,
                    expression: {
                        type: Syntax.NameExpression,
                        name: 'Array'
                    },
                    applications: [expr]
                };
            }

            return expr;
        }

        // TopLevelTypeExpression :=
        //      TypeExpression
        //    | TypeUnionList
        //
        // This rule is Google Closure Compiler extension, not ES4
        // like,
        //   { number | string }
        // If strict to ES4, we should write it as
        //   { (number|string) }
        function parseTop() {
            var expr, elements;

            expr = parseTypeExpression();
            if (token !== Token.PIPE) {
                return expr;
            }

            elements = [ expr ];
            consume(Token.PIPE);
            while (true) {
                elements.push(parseTypeExpression());
                if (token !== Token.PIPE) {
                    break;
                }
                consume(Token.PIPE);
            }

            return {
                type: Syntax.UnionType,
                elements: elements
            };
        }

        function parseTopParamType() {
            var expr;

            if (token === Token.REST) {
                consume(Token.REST);
                return {
                    type: Syntax.RestType,
                    expression: parseTop()
                };
            }

            expr = parseTop();
            if (token === Token.EQUAL) {
                consume(Token.EQUAL);
                return {
                    type: Syntax.OptionalType,
                    expression: expr
                };
            }

            return expr;
        }

        function parseType(src, opt) {
            var expr;

            source = src;
            length = source.length;
            index = 0;
            previous = 0;

            next();
            expr = parseTop();

            if (opt && opt.midstream) {
                return {
                    expression: expr,
                    index: previous
                };
            }

            if (token !== Token.EOF) {
                throwError('not reach to EOF');
            }

            return expr;
        }

        function parseParamType(src, opt) {
            var expr;

            source = src;
            length = source.length;
            index = 0;
            previous = 0;

            next();
            expr = parseTopParamType();

            if (opt && opt.midstream) {
                return {
                    expression: expr,
                    index: previous
                };
            }

            if (token !== Token.EOF) {
                throwError('not reach to EOF');
            }

            return expr;
        }

        function stringifyImpl(node, compact, topLevel) {
            var result, i, iz;

            switch (node.type) {
            case Syntax.NullableLiteral:
                result = '?';
                break;

            case Syntax.AllLiteral:
                result = '*';
                break;

            case Syntax.NullLiteral:
                result = 'null';
                break;

            case Syntax.UndefinedLiteral:
                result = 'undefined';
                break;

            case Syntax.VoidLiteral:
                result = 'void';
                break;

            case Syntax.UnionType:
                if (!topLevel) {
                    result = '(';
                } else {
                    result = '';
                }

                for (i = 0, iz = node.elements.length; i < iz; ++i) {
                    result += stringifyImpl(node.elements[i], compact);
                    if ((i + 1) !== iz) {
                        result += '|';
                    }
                }

                if (!topLevel) {
                    result += ')';
                }
                break;

            case Syntax.ArrayType:
                result = '[';
                for (i = 0, iz = node.elements.length; i < iz; ++i) {
                    result += stringifyImpl(node.elements[i], compact);
                    if ((i + 1) !== iz) {
                        result += compact ? ',' : ', ';
                    }
                }
                result += ']';
                break;

            case Syntax.RecordType:
                result = '{';
                for (i = 0, iz = node.fields.length; i < iz; ++i) {
                    result += stringifyImpl(node.fields[i], compact);
                    if ((i + 1) !== iz) {
                        result += compact ? ',' : ', ';
                    }
                }
                result += '}';
                break;

            case Syntax.FieldType:
                if (node.value) {
                    result = node.key + (compact ? ':' : ': ') + stringifyImpl(node.value, compact);
                } else {
                    result = node.key;
                }
                break;

            case Syntax.FunctionType:
                result = compact ? 'function(' : 'function (';

                if (node['this']) {
                    if (node['new']) {
                        result += (compact ? 'new:' : 'new: ');
                    } else {
                        result += (compact ? 'this:' : 'this: ');
                    }

                    result += stringifyImpl(node['this'], compact);

                    if (node.params.length !== 0) {
                        result += compact ? ',' : ', ';
                    }
                }

                for (i = 0, iz = node.params.length; i < iz; ++i) {
                    result += stringifyImpl(node.params[i], compact);
                    if ((i + 1) !== iz) {
                        result += compact ? ',' : ', ';
                    }
                }

                result += ')';

                if (node.result) {
                    result += (compact ? ':' : ': ') + stringifyImpl(node.result, compact);
                }
                break;

            case Syntax.ParameterType:
                result = node.name + (compact ? ':' : ': ') + stringifyImpl(node.expression, compact);
                break;

            case Syntax.RestType:
                result = '...';
                if (node.expression) {
                    result += stringifyImpl(node.expression, compact);
                }
                break;

            case Syntax.NonNullableType:
                if (node.prefix) {
                    result = '!' + stringifyImpl(node.expression, compact);
                } else {
                    result = stringifyImpl(node.expression, compact) + '!';
                }
                break;

            case Syntax.OptionalType:
                result = stringifyImpl(node.expression, compact) + '=';
                break;

            case Syntax.NullableType:
                if (node.prefix) {
                    result = '?' + stringifyImpl(node.expression, compact);
                } else {
                    result = stringifyImpl(node.expression, compact) + '?';
                }
                break;

            case Syntax.NameExpression:
                result = node.name;
                break;

            case Syntax.TypeApplication:
                result = stringifyImpl(node.expression, compact) + '.<';
                for (i = 0, iz = node.applications.length; i < iz; ++i) {
                    result += stringifyImpl(node.applications[i], compact);
                    if ((i + 1) !== iz) {
                        result += compact ? ',' : ', ';
                    }
                }
                result += '>';
                break;

            default:
                throwError('Unknown type ' + node.type);
            }

            return result;
        }

        function stringify(node, options) {
            if (options == null) {
                options = {};
            }
            return stringifyImpl(node, options.compact, options.topLevel);
        }

        exports.parseType = parseType;
        exports.parseParamType = parseParamType;
        exports.stringify = stringify;
        exports.Syntax = Syntax;
    }(typed = {}));

    // JSDoc Tag Parser

    (function (exports) {
        var Rules,
            index,
            lineNumber,
            length,
            source,
            recoverable,
            sloppy,
            strict;

        function advance() {
            var ch = source.charCodeAt(index);
            index += 1;
            if (esutils.code.isLineTerminator(ch) && !(ch === 0x0D  /* '\r' */ && source.charCodeAt(index) === 0x0A  /* '\n' */)) {
                lineNumber += 1;
            }
            return String.fromCharCode(ch);
        }

        function scanTitle() {
            var title = '';
            // waste '@'
            advance();

            while (index < length && isASCIIAlphanumeric(source.charCodeAt(index))) {
                title += advance();
            }

            return title;
        }

        function seekContent() {
            var ch, waiting, last = index;

            waiting = false;
            while (last < length) {
                ch = source.charCodeAt(last);
                if (esutils.code.isLineTerminator(ch) && !(ch === 0x0D  /* '\r' */ && source.charCodeAt(last + 1) === 0x0A  /* '\n' */)) {
                    lineNumber += 1;
                    waiting = true;
                } else if (waiting) {
                    if (ch === 0x40  /* '@' */) {
                        break;
                    }
                    if (!esutils.code.isWhiteSpace(ch)) {
                        waiting = false;
                    }
                }
                last += 1;
            }
            return last;
        }

        // type expression may have nest brace, such as,
        // { { ok: string } }
        //
        // therefore, scanning type expression with balancing braces.
        function parseType(title, last) {
            var ch, brace, type, direct = false;


            // search '{'
            while (index < last) {
                ch = source.charCodeAt(index);
                if (esutils.code.isWhiteSpace(ch)) {
                    advance();
                } else if (ch === 0x7B  /* '{' */) {
                    advance();
                    break;
                } else {
                    // this is direct pattern
                    direct = true;
                    break;
                }
            }


            if (direct) {
                return null;
            }

            // type expression { is found
            brace = 1;
            type = '';
            while (index < last) {
                ch = source.charCodeAt(index);
                if (esutils.code.isLineTerminator(ch)) {
                    advance();
                } else {
                    if (ch === 0x7D  /* '}' */) {
                        brace -= 1;
                        if (brace === 0) {
                            advance();
                            break;
                        }
                    } else if (ch === 0x7B  /* '{' */) {
                        brace += 1;
                    }
                    type += advance();
                }
            }

            if (brace !== 0) {
                // braces is not balanced
                return throwError('Braces are not balanced');
            }

            if (isParamTitle(title)) {
                return typed.parseParamType(type);
            }
            return typed.parseType(type);
        }

        function scanIdentifier(last) {
            var identifier;
            if (!esutils.code.isIdentifierStart(source.charCodeAt(index))) {
                return null;
            }
            identifier = advance();
            while (index < last && esutils.code.isIdentifierPart(source.charCodeAt(index))) {
                identifier += advance();
            }
            return identifier;
        }

        function skipWhiteSpace(last) {
            while (index < last && (esutils.code.isWhiteSpace(source.charCodeAt(index)) || esutils.code.isLineTerminator(source.charCodeAt(index)))) {
                advance();
            }
        }

        function parseName(last, allowBrackets, allowNestedParams) {
            var name = '', useBrackets;

            skipWhiteSpace(last);

            if (index >= last) {
                return null;
            }

            if (allowBrackets && source.charCodeAt(index) === 0x5B  /* '[' */) {
                useBrackets = true;
                name = advance();
            }

            if (!esutils.code.isIdentifierStart(source.charCodeAt(index))) {
                return null;
            }

            name += scanIdentifier(last);

            if (allowNestedParams) {
                while (source.charCodeAt(index) === 0x2E  /* '.' */ ||
                        source.charCodeAt(index) === 0x23  /* '#' */ ||
                        source.charCodeAt(index) === 0x7E  /* '~' */) {
                    name += advance();
                    name += scanIdentifier(last);
                }
            }

            if (useBrackets) {
                // do we have a default value for this?
                if (source.charCodeAt(index) === 0x3D  /* '=' */) {

                    // consume the '='' symbol
                    name += advance();
                    // scan in the default value
                    while (index < last && source.charCodeAt(index) !== 0x5D  /* ']' */) {
                        name += advance();
                    }
                }

                if (index >= last  || source.charCodeAt(index) !== 0x5D  /* ']' */) {
                    // we never found a closing ']'
                    return null;
                }

                // collect the last ']'
                name += advance();
            }

            return name;
        }

        function skipToTag() {
            while (index < length && source.charCodeAt(index) !== 0x40  /* '@' */) {
                advance();
            }
            if (index >= length) {
                return false;
            }
            assert(source.charCodeAt(index) === 0x40  /* '@' */);
            return true;
        }

        function TagParser(options, title) {
            this._options = options;
            this._title = title;
            this._tag = {
                title: title,
                description: null
            };
            if (this._options.lineNumbers) {
                this._tag.lineNumber = lineNumber;
            }
            this._last = 0;
            // space to save special information for title parsers.
            this._extra = { };
        }

        // addError(err, ...)
        TagParser.prototype.addError = function addError(errorText) {
            var args = Array.prototype.slice.call(arguments, 1),
                msg = errorText.replace(
                    /%(\d)/g,
                    function (whole, index) {
                        assert(index < args.length, 'Message reference must be in range');
                        return args[index];
                    }
                );

            if (!this._tag.errors) {
                this._tag.errors = [];
            }
            if (strict) {
                throwError(msg);
            }
            this._tag.errors.push(msg);
            return recoverable;
        };

        TagParser.prototype.parseType = function () {
            // type required titles
            if (isTypeParameterRequired(this._title)) {
                try {
                    this._tag.type = parseType(this._title, this._last);
                    if (!this._tag.type) {
                        if (!isParamTitle(this._title)) {
                            if (!this.addError('Missing or invalid tag type')) {
                                return false;
                            }
                        }
                    }
                } catch (error) {
                    this._tag.type = null;
                    if (!this.addError(error.message)) {
                        return false;
                    }
                }
            } else if (isAllowedType(this._title)) {
                // optional types
                try {
                    this._tag.type = parseType(this._title, this._last);
                } catch (e) {
                    //For optional types, lets drop the thrown error when we hit the end of the file
                }
            }
            return true;
        };

        TagParser.prototype._parseNamePath = function (optional) {
            var name;
            name = parseName(this._last, sloppy && isParamTitle(this._title), true);
            if (!name) {
                if (!optional) {
                    if (!this.addError('Missing or invalid tag name')) {
                        return false;
                    }
                }
            }
            this._tag.name = name;
            return true;
        };

        TagParser.prototype.parseNamePath = function () {
            return this._parseNamePath(false);
        };

        TagParser.prototype.parseNamePathOptional = function () {
            return this._parseNamePath(true);
        };


        TagParser.prototype.parseName = function () {
            var assign, name;

            // param, property requires name
            if (isAllowedName(this._title)) {
                this._tag.name = parseName(this._last, sloppy && isParamTitle(this._title), isAllowedNested(this._title));
                if (!this._tag.name) {
                    if (!isNameParameterRequired(this._title)) {
                        return true;
                    }

                    // it's possible the name has already been parsed but interpreted as a type
                    // it's also possible this is a sloppy declaration, in which case it will be
                    // fixed at the end
                    if (isParamTitle(this._title) && this._tag.type && this._tag.type.name) {
                        this._extra.name = this._tag.type;
                        this._tag.name = this._tag.type.name;
                        this._tag.type = null;
                    } else {
                        if (!this.addError('Missing or invalid tag name')) {
                            return false;
                        }
                    }
                } else {
                    name = this._tag.name;
                    if (name.charAt(0) === '[' && name.charAt(name.length - 1) === ']') {
                        // extract the default value if there is one
                        // example: @param {string} [somebody=John Doe] description
                        assign = name.substring(1, name.length - 1).split('=');
                        if (assign[1]) {
                            this._tag['default'] = assign[1];
                        }
                        this._tag.name = assign[0];

                        // convert to an optional type
                        if (this._tag.type && this._tag.type.type !== 'OptionalType') {
                            this._tag.type = {
                                type: 'OptionalType',
                                expression: this._tag.type
                            };
                        }
                    }
                }
            }

            return true;
        };

        TagParser.prototype.parseDescription = function parseDescription() {
            var description = trim(sliceSource(source, index, this._last));
            if (description) {
                if ((/^-\s+/).test(description)) {
                    description = description.substring(2);
                }
                this._tag.description = description;
            }
            return true;
        };

        TagParser.prototype.parseKind = function parseKind() {
            var kind, kinds;
            kinds = {
                'class': true,
                'constant': true,
                'event': true,
                'external': true,
                'file': true,
                'function': true,
                'member': true,
                'mixin': true,
                'module': true,
                'namespace': true,
                'typedef': true
            };
            kind = trim(sliceSource(source, index, this._last));
            this._tag.kind = kind;
            if (!hasOwnProperty(kinds, kind)) {
                if (!this.addError('Invalid kind name \'%0\'', kind)) {
                    return false;
                }
            }
            return true;
        };

        TagParser.prototype.parseAccess = function parseAccess() {
            var access;
            access = trim(sliceSource(source, index, this._last));
            this._tag.access = access;
            if (access !== 'private' && access !== 'protected' && access !== 'public') {
                if (!this.addError('Invalid access name \'%0\'', access)) {
                    return false;
                }
            }
            return true;
        };

        TagParser.prototype.parseVariation = function parseVariation() {
            var variation, text;
            text = trim(sliceSource(source, index, this._last));
            variation = parseFloat(text, 10);
            this._tag.variation = variation;
            if (isNaN(variation)) {
                if (!this.addError('Invalid variation \'%0\'', text)) {
                    return false;
                }
            }
            return true;
        };

        TagParser.prototype.ensureEnd = function () {
            var shouldBeEmpty = trim(sliceSource(source, index, this._last));
            if (shouldBeEmpty) {
                if (!this.addError('Unknown content \'%0\'', shouldBeEmpty)) {
                    return false;
                }
            }
            return true;
        };

        TagParser.prototype.epilogue = function epilogue() {
            var description;

            description = this._tag.description;
            // un-fix potentially sloppy declaration
            if (isParamTitle(this._title) && !this._tag.type && description && description.charAt(0) === '[') {
                this._tag.type = this._extra.name;
                this._tag.name = undefined;

                if (!sloppy) {
                    if (!this.addError('Missing or invalid tag name')) {
                        return false;
                    }
                }
            }

            return true;
        };

        Rules = {
            // http://usejsdoc.org/tags-access.html
            'access': ['parseAccess'],
            // http://usejsdoc.org/tags-alias.html
            'alias': ['parseNamePath', 'ensureEnd'],
            // http://usejsdoc.org/tags-augments.html
            'augments': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
            // http://usejsdoc.org/tags-constructor.html
            'constructor': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
            // Synonym: http://usejsdoc.org/tags-constructor.html
            'class': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
            // Synonym: http://usejsdoc.org/tags-extends.html
            'extends': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
            // http://usejsdoc.org/tags-deprecated.html
            'deprecated': ['parseDescription'],
            // http://usejsdoc.org/tags-global.html
            'global': ['ensureEnd'],
            // http://usejsdoc.org/tags-inner.html
            'inner': ['ensureEnd'],
            // http://usejsdoc.org/tags-instance.html
            'instance': ['ensureEnd'],
            // http://usejsdoc.org/tags-kind.html
            'kind': ['parseKind'],
            // http://usejsdoc.org/tags-mixes.html
            'mixes': ['parseNamePath', 'ensureEnd'],
            // http://usejsdoc.org/tags-mixin.html
            'mixin': ['parseNamePathOptional', 'ensureEnd'],
            // http://usejsdoc.org/tags-member.html
            'member': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
            // http://usejsdoc.org/tags-method.html
            'method': ['parseNamePathOptional', 'ensureEnd'],
            // http://usejsdoc.org/tags-module.html
            'module': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
            // Synonym: http://usejsdoc.org/tags-method.html
            'func': ['parseNamePathOptional', 'ensureEnd'],
            // Synonym: http://usejsdoc.org/tags-method.html
            'function': ['parseNamePathOptional', 'ensureEnd'],
            // Synonym: http://usejsdoc.org/tags-member.html
            'var': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
            // http://usejsdoc.org/tags-name.html
            'name': ['parseNamePath', 'ensureEnd'],
            // http://usejsdoc.org/tags-namespace.html
            'namespace': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
            // http://usejsdoc.org/tags-private.html
            'private': ['parseType', 'parseDescription'],
            // http://usejsdoc.org/tags-protected.html
            'protected': ['parseType', 'parseDescription'],
            // http://usejsdoc.org/tags-public.html
            'public': ['parseType', 'parseDescription'],
            // http://usejsdoc.org/tags-readonly.html
            'readonly': ['ensureEnd'],
            // http://usejsdoc.org/tags-requires.html
            'requires': ['parseNamePath', 'ensureEnd'],
            // http://usejsdoc.org/tags-since.html
            'since': ['parseDescription'],
            // http://usejsdoc.org/tags-static.html
            'static': ['ensureEnd'],
            // http://usejsdoc.org/tags-summary.html
            'summary': ['parseDescription'],
            // http://usejsdoc.org/tags-this.html
            'this': ['parseNamePath', 'ensureEnd'],
            // http://usejsdoc.org/tags-todo.html
            'todo': ['parseDescription'],
            // http://usejsdoc.org/tags-variation.html
            'variation': ['parseVariation'],
            // http://usejsdoc.org/tags-version.html
            'version': ['parseDescription']
        };

        TagParser.prototype.parse = function parse() {
            var i, iz, sequences, method;

            // empty title
            if (!this._title) {
                if (!this.addError('Missing or invalid title')) {
                    return null;
                }
            }

            // Seek to content last index.
            this._last = seekContent(this._title);

            if (hasOwnProperty(Rules, this._title)) {
                sequences = Rules[this._title];
            } else {
                // default sequences
                sequences = ['parseType', 'parseName', 'parseDescription', 'epilogue'];
            }

            for (i = 0, iz = sequences.length; i < iz; ++i) {
                method = sequences[i];
                if (!this[method]()) {
                    return null;
                }
            }

            // Seek global index to end of this tag.
            index = this._last;
            return this._tag;
        };

        function parseTag(options) {
            var title, parser;

            // skip to tag
            if (!skipToTag()) {
                return null;
            }

            // scan title
            title = scanTitle();

            // construct tag parser
            parser = new TagParser(options, title);
            return parser.parse();
        }

        //
        // Parse JSDoc
        //

        function scanJSDocDescription() {
            var description = '', ch, atAllowed;

            atAllowed = true;
            while (index < length) {
                ch = source.charCodeAt(index);

                if (atAllowed && ch === 0x40  /* '@' */) {
                    break;
                }

                if (esutils.code.isLineTerminator(ch)) {
                    atAllowed = true;
                } else if (atAllowed && !esutils.code.isWhiteSpace(ch)) {
                    atAllowed = false;
                }

                description += advance();
            }
            return trim(description);
        }

        function parse(comment, options) {
            var tags = [], tag, description, interestingTags, i, iz;

            if (options === undefined) {
                options = {};
            }

            if (typeof options.unwrap === 'boolean' && options.unwrap) {
                source = unwrapComment(comment);
            } else {
                source = comment;
            }

            // array of relevant tags
            if (options.tags) {
                if (isArray(options.tags)) {
                    interestingTags = { };
                    for (i = 0, iz = options.tags.length; i < iz; i++) {
                        if (typeof options.tags[i] === 'string') {
                            interestingTags[options.tags[i]] = true;
                        } else {
                            throwError('Invalid "tags" parameter: ' + options.tags);
                        }
                    }
                } else {
                    throwError('Invalid "tags" parameter: ' + options.tags);
                }
            }

            length = source.length;
            index = 0;
            lineNumber = 0;
            recoverable = options.recoverable;
            sloppy = options.sloppy;
            strict = options.strict;

            description = scanJSDocDescription();

            while (true) {
                tag = parseTag(options);
                if (!tag) {
                    break;
                }
                if (!interestingTags || interestingTags.hasOwnProperty(tag.title)) {
                    tags.push(tag);
                }
            }

            return {
                description: description,
                tags: tags
            };
        }
        exports.parse = parse;
    }(jsdoc = {}));

    exports.version = VERSION;
    exports.parse = jsdoc.parse;
    exports.parseType = typed.parseType;
    exports.parseParamType = typed.parseParamType;
    exports.unwrapComment = unwrapComment;
    exports.Syntax = shallowCopy(typed.Syntax);
    exports.Error = DoctrineError;
    exports.type = {
        Syntax: exports.Syntax,
        parseType: typed.parseType,
        parseParamType: typed.parseParamType,
        stringify: typed.stringify
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */
