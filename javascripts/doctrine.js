(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["doctrine"] = factory();
	else
		root["doctrine"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

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

	    var typed,
	        utility,
	        isArray,
	        jsdoc,
	        esutils,
	        hasOwnProperty;

	    esutils = __webpack_require__(1);
	    isArray = __webpack_require__(5);
	    typed = __webpack_require__(6);
	    utility = __webpack_require__(7);

	    function sliceSource(source, index, last) {
	        return source.slice(index, last);
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

	    function isParamTitle(title) {
	        return title === 'param' || title === 'argument' || title === 'arg';
	    }

	    function isReturnTitle(title) {
	        return title === 'return' || title === 'returns';
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
	        return isParamTitle(title) || isReturnTitle(title) ||
	            title === 'define' || title === 'enum' ||
	            title === 'implements' || title === 'this' ||
	            title === 'type' || title === 'typedef' || isProperty(title);
	    }

	    // Consider deprecation instead using 'isTypeParameterRequired' and 'Rules' declaration to pick when a type is optional/required
	    // This would require changes to 'parseType'
	    function isAllowedType(title) {
	        return isTypeParameterRequired(title) || title === 'throws' || title === 'const' || title === 'constant' ||
	            title === 'namespace' || title === 'member' || title === 'var' || title === 'module' ||
	            title === 'constructor' || title === 'class' || title === 'extends' || title === 'augments' ||
	            title === 'public' || title === 'private' || title === 'protected';
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

	        return result.replace(/\s+$/, '');
	    }

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
	                return utility.throwError('Braces are not balanced');
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
	                if (source.charCodeAt(index) === 0x3A /* ':' */ && (
	                        name === 'module' ||
	                        name === 'external' ||
	                        name === 'event')) {
	                    name += advance();
	                    name += scanIdentifier(last);

	                }
	                if(source.charCodeAt(index) === 0x5B  /* '[' */ && source.charCodeAt(index + 1) === 0x5D  /* ']' */){
	                    name += advance();
	                    name += advance();
	                }
	                while (source.charCodeAt(index) === 0x2E  /* '.' */ ||
	                        source.charCodeAt(index) === 0x23  /* '#' */ ||
	                        source.charCodeAt(index) === 0x7E  /* '~' */) {
	                    name += advance();
	                    name += scanIdentifier(last);
	                }
	            }

	            if (useBrackets) {
	                skipWhiteSpace(last);
	                // do we have a default value for this?
	                if (source.charCodeAt(index) === 0x3D  /* '=' */) {
	                    // consume the '='' symbol
	                    name += advance();
	                    skipWhiteSpace(last);

	                    var ch;
	                    var bracketDepth = 1;
	                    // scan in the default value
	                    while (index < last) {
	                        ch = source.charCodeAt(index);

	                        if (esutils.code.isWhiteSpace(ch)) {
	                            skipWhiteSpace(last);
	                            ch = source.charCodeAt(index);
	                        }

	                        if (ch === 0x5B /* '[' */) {
	                            bracketDepth++;
	                        } else if (ch === 0x5D  /* ']' */ &&
	                            --bracketDepth === 0) {
	                            break;
	                        }

	                        name += advance();
	                    }
	                }

	                skipWhiteSpace(last);

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
	            utility.assert(source.charCodeAt(index) === 0x40  /* '@' */);
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
	                        utility.assert(index < args.length, 'Message reference must be in range');
	                        return args[index];
	                    }
	                );

	            if (!this._tag.errors) {
	                this._tag.errors = [];
	            }
	            if (strict) {
	                utility.throwError(msg);
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
	                        if (!isParamTitle(this._title) && !isReturnTitle(this._title)) {
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

	        TagParser.prototype.parseCaption = function parseDescription() {
	            var description = trim(sliceSource(source, index, this._last));
	            var captionStartTag = '<caption>';
	            var captionEndTag = '</caption>';
	            var captionStart = description.indexOf(captionStartTag);
	            var captionEnd = description.indexOf(captionEndTag);
	            if (captionStart >= 0 && captionEnd >= 0) {
	                this._tag.caption = trim(description.substring(
	                    captionStart + captionStartTag.length, captionEnd));
	                this._tag.description = trim(description.substring(captionEnd + captionEndTag.length));
	            } else {
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

	        TagParser.prototype.parseThis = function parseAccess() {
	            // this name may be a name expression (e.g. {foo.bar})
	            // or a name path (e.g. foo.bar)
	            var value = trim(sliceSource(source, index, this._last));
	            if (value && value.charAt(0) === '{') {
	                var gotType = this.parseType();
	                if (gotType && this._tag.type.type === 'NameExpression') {
	                    this._tag.name = this._tag.type.name;
	                    return true;
	                } else {
	                    return this.addError('Invalid name for this');
	                }
	            } else {
	                return this.parseNamePath();
	            }
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
	                if (!this._tag.name) {
	                    this._tag.name = undefined;
	                }

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
	            // http://usejsdoc.org/tags-example.html
	            'example': ['parseCaption'],
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
	            'this': ['parseThis', 'ensureEnd'],
	            // http://usejsdoc.org/tags-todo.html
	            'todo': ['parseDescription'],
	            // http://usejsdoc.org/tags-typedef.html
	            'typedef': ['parseType', 'parseNamePathOptional'],
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

	            return this._tag;
	        };

	        function parseTag(options) {
	            var title, parser, tag;

	            // skip to tag
	            if (!skipToTag()) {
	                return null;
	            }

	            // scan title
	            title = scanTitle();

	            // construct tag parser
	            parser = new TagParser(options, title);
	            tag = parser.parse();

	            // Seek global index to end of this tag.
	            while (index < parser._last) {
	                advance();
	            }
	            return tag;
	        }

	        //
	        // Parse JSDoc
	        //

	        function scanJSDocDescription(preserveWhitespace) {
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

	            return preserveWhitespace ? description : trim(description);
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
	                            utility.throwError('Invalid "tags" parameter: ' + options.tags);
	                        }
	                    }
	                } else {
	                    utility.throwError('Invalid "tags" parameter: ' + options.tags);
	                }
	            }

	            length = source.length;
	            index = 0;
	            lineNumber = 0;
	            recoverable = options.recoverable;
	            sloppy = options.sloppy;
	            strict = options.strict;

	            description = scanJSDocDescription(options.preserveWhitespace);

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

	    exports.version = utility.VERSION;
	    exports.parse = jsdoc.parse;
	    exports.parseType = typed.parseType;
	    exports.parseParamType = typed.parseParamType;
	    exports.unwrapComment = unwrapComment;
	    exports.Syntax = shallowCopy(typed.Syntax);
	    exports.Error = utility.DoctrineError;
	    exports.type = {
	        Syntax: exports.Syntax,
	        parseType: typed.parseType,
	        parseParamType: typed.parseParamType,
	        stringify: typed.stringify
	    };
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/*
	  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

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

	    exports.ast = __webpack_require__(2);
	    exports.code = __webpack_require__(3);
	    exports.keyword = __webpack_require__(4);
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 2 */
/***/ function(module, exports) {

	/*
	  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

	  Redistribution and use in source and binary forms, with or without
	  modification, are permitted provided that the following conditions are met:

	    * Redistributions of source code must retain the above copyright
	      notice, this list of conditions and the following disclaimer.
	    * Redistributions in binary form must reproduce the above copyright
	      notice, this list of conditions and the following disclaimer in the
	      documentation and/or other materials provided with the distribution.

	  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
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

	    function isExpression(node) {
	        if (node == null) { return false; }
	        switch (node.type) {
	            case 'ArrayExpression':
	            case 'AssignmentExpression':
	            case 'BinaryExpression':
	            case 'CallExpression':
	            case 'ConditionalExpression':
	            case 'FunctionExpression':
	            case 'Identifier':
	            case 'Literal':
	            case 'LogicalExpression':
	            case 'MemberExpression':
	            case 'NewExpression':
	            case 'ObjectExpression':
	            case 'SequenceExpression':
	            case 'ThisExpression':
	            case 'UnaryExpression':
	            case 'UpdateExpression':
	                return true;
	        }
	        return false;
	    }

	    function isIterationStatement(node) {
	        if (node == null) { return false; }
	        switch (node.type) {
	            case 'DoWhileStatement':
	            case 'ForInStatement':
	            case 'ForStatement':
	            case 'WhileStatement':
	                return true;
	        }
	        return false;
	    }

	    function isStatement(node) {
	        if (node == null) { return false; }
	        switch (node.type) {
	            case 'BlockStatement':
	            case 'BreakStatement':
	            case 'ContinueStatement':
	            case 'DebuggerStatement':
	            case 'DoWhileStatement':
	            case 'EmptyStatement':
	            case 'ExpressionStatement':
	            case 'ForInStatement':
	            case 'ForStatement':
	            case 'IfStatement':
	            case 'LabeledStatement':
	            case 'ReturnStatement':
	            case 'SwitchStatement':
	            case 'ThrowStatement':
	            case 'TryStatement':
	            case 'VariableDeclaration':
	            case 'WhileStatement':
	            case 'WithStatement':
	                return true;
	        }
	        return false;
	    }

	    function isSourceElement(node) {
	      return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
	    }

	    function trailingStatement(node) {
	        switch (node.type) {
	        case 'IfStatement':
	            if (node.alternate != null) {
	                return node.alternate;
	            }
	            return node.consequent;

	        case 'LabeledStatement':
	        case 'ForStatement':
	        case 'ForInStatement':
	        case 'WhileStatement':
	        case 'WithStatement':
	            return node.body;
	        }
	        return null;
	    }

	    function isProblematicIfStatement(node) {
	        var current;

	        if (node.type !== 'IfStatement') {
	            return false;
	        }
	        if (node.alternate == null) {
	            return false;
	        }
	        current = node.consequent;
	        do {
	            if (current.type === 'IfStatement') {
	                if (current.alternate == null)  {
	                    return true;
	                }
	            }
	            current = trailingStatement(current);
	        } while (current);

	        return false;
	    }

	    module.exports = {
	        isExpression: isExpression,
	        isStatement: isStatement,
	        isIterationStatement: isIterationStatement,
	        isSourceElement: isSourceElement,
	        isProblematicIfStatement: isProblematicIfStatement,

	        trailingStatement: trailingStatement
	    };
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 3 */
/***/ function(module, exports) {

	/*
	  Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
	  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>

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

	    var Regex, NON_ASCII_WHITESPACES;

	    // See `tools/generate-identifier-regex.js`.
	    Regex = {
	        NonAsciiIdentifierStart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
	        NonAsciiIdentifierPart: new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0\u08A2-\u08AC\u08E4-\u08FE\u0900-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1D00-\u1DE6\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA697\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7B\uAA80-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]')
	    };

	    function isDecimalDigit(ch) {
	        return (ch >= 48 && ch <= 57);   // 0..9
	    }

	    function isHexDigit(ch) {
	        return isDecimalDigit(ch) ||    // 0..9
	            (97 <= ch && ch <= 102) ||  // a..f
	            (65 <= ch && ch <= 70);     // A..F
	    }

	    function isOctalDigit(ch) {
	        return (ch >= 48 && ch <= 55);   // 0..7
	    }

	    // 7.2 White Space

	    NON_ASCII_WHITESPACES = [
	        0x1680, 0x180E,
	        0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
	        0x202F, 0x205F,
	        0x3000,
	        0xFEFF
	    ];

	    function isWhiteSpace(ch) {
	        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
	            (ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0);
	    }

	    // 7.3 Line Terminators

	    function isLineTerminator(ch) {
	        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
	    }

	    // 7.6 Identifier Names and Identifiers

	    function isIdentifierStart(ch) {
	        return (ch >= 97 && ch <= 122) ||     // a..z
	            (ch >= 65 && ch <= 90) ||         // A..Z
	            (ch === 36) || (ch === 95) ||     // $ (dollar) and _ (underscore)
	            (ch === 92) ||                    // \ (backslash)
	            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(String.fromCharCode(ch)));
	    }

	    function isIdentifierPart(ch) {
	        return (ch >= 97 && ch <= 122) ||     // a..z
	            (ch >= 65 && ch <= 90) ||         // A..Z
	            (ch >= 48 && ch <= 57) ||         // 0..9
	            (ch === 36) || (ch === 95) ||     // $ (dollar) and _ (underscore)
	            (ch === 92) ||                    // \ (backslash)
	            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(String.fromCharCode(ch)));
	    }

	    module.exports = {
	        isDecimalDigit: isDecimalDigit,
	        isHexDigit: isHexDigit,
	        isOctalDigit: isOctalDigit,
	        isWhiteSpace: isWhiteSpace,
	        isLineTerminator: isLineTerminator,
	        isIdentifierStart: isIdentifierStart,
	        isIdentifierPart: isIdentifierPart
	    };
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*
	  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

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

	    var code = __webpack_require__(3);

	    function isStrictModeReservedWordES6(id) {
	        switch (id) {
	        case 'implements':
	        case 'interface':
	        case 'package':
	        case 'private':
	        case 'protected':
	        case 'public':
	        case 'static':
	        case 'let':
	            return true;
	        default:
	            return false;
	        }
	    }

	    function isKeywordES5(id, strict) {
	        // yield should not be treated as keyword under non-strict mode.
	        if (!strict && id === 'yield') {
	            return false;
	        }
	        return isKeywordES6(id, strict);
	    }

	    function isKeywordES6(id, strict) {
	        if (strict && isStrictModeReservedWordES6(id)) {
	            return true;
	        }

	        switch (id.length) {
	        case 2:
	            return (id === 'if') || (id === 'in') || (id === 'do');
	        case 3:
	            return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
	        case 4:
	            return (id === 'this') || (id === 'else') || (id === 'case') ||
	                (id === 'void') || (id === 'with') || (id === 'enum');
	        case 5:
	            return (id === 'while') || (id === 'break') || (id === 'catch') ||
	                (id === 'throw') || (id === 'const') || (id === 'yield') ||
	                (id === 'class') || (id === 'super');
	        case 6:
	            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
	                (id === 'switch') || (id === 'export') || (id === 'import');
	        case 7:
	            return (id === 'default') || (id === 'finally') || (id === 'extends');
	        case 8:
	            return (id === 'function') || (id === 'continue') || (id === 'debugger');
	        case 10:
	            return (id === 'instanceof');
	        default:
	            return false;
	        }
	    }

	    function isReservedWordES5(id, strict) {
	        return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
	    }

	    function isReservedWordES6(id, strict) {
	        return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
	    }

	    function isRestrictedWord(id) {
	        return id === 'eval' || id === 'arguments';
	    }

	    function isIdentifierName(id) {
	        var i, iz, ch;

	        if (id.length === 0) {
	            return false;
	        }

	        ch = id.charCodeAt(0);
	        if (!code.isIdentifierStart(ch) || ch === 92) {  // \ (backslash)
	            return false;
	        }

	        for (i = 1, iz = id.length; i < iz; ++i) {
	            ch = id.charCodeAt(i);
	            if (!code.isIdentifierPart(ch) || ch === 92) {  // \ (backslash)
	                return false;
	            }
	        }
	        return true;
	    }

	    function isIdentifierES5(id, strict) {
	        return isIdentifierName(id) && !isReservedWordES5(id, strict);
	    }

	    function isIdentifierES6(id, strict) {
	        return isIdentifierName(id) && !isReservedWordES6(id, strict);
	    }

	    module.exports = {
	        isKeywordES5: isKeywordES5,
	        isKeywordES6: isKeywordES6,
	        isReservedWordES5: isReservedWordES5,
	        isReservedWordES6: isReservedWordES6,
	        isRestrictedWord: isRestrictedWord,
	        isIdentifierName: isIdentifierName,
	        isIdentifierES5: isIdentifierES5,
	        isIdentifierES6: isIdentifierES6
	    };
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 5 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

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

	// "typed", the Type Expression Parser for doctrine.

	(function () {
	    'use strict';

	    var Syntax,
	        Token,
	        source,
	        length,
	        index,
	        previous,
	        token,
	        value,
	        esutils,
	        utility;

	    esutils = __webpack_require__(1);
	    utility = __webpack_require__(7);

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

	    function isTypeName(ch) {
	        return '><(){}[],:*|?!='.indexOf(String.fromCharCode(ch)) === -1 && !esutils.code.isWhiteSpace(ch) && !esutils.code.isLineTerminator(ch);
	    }

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
	            utility.throwError('unexpected quote');
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
	                        utility.throwError('unexpected token');
	                    }

	                    if (index < length) {
	                        ch = source.charCodeAt(index);
	                        if (esutils.code.isIdentifierStart(ch)) {
	                            utility.throwError('unexpected token');
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
	                            utility.throwError('unexpected token');
	                        }
	                    }
	                    value = parseInt(number, 8);
	                    return Token.NUMBER;
	                }

	                if (esutils.code.isDecimalDigit(ch)) {
	                    utility.throwError('unexpected token');
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
	                utility.throwError('unexpected token');
	            }
	        }

	        if (index < length) {
	            ch = source.charCodeAt(index);
	            if (esutils.code.isIdentifierStart(ch)) {
	                utility.throwError('unexpected token');
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
	            utility.assert(isTypeName(ch));
	            token = scanTypeName();
	            return token;
	        }
	    }

	    function consume(target, text) {
	        utility.assert(token === target, text || 'consumed token not matched');
	        next();
	    }

	    function expect(target, message) {
	        if (token !== target) {
	            utility.throwError(message || 'unexpected token');
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

	        utility.throwError('unexpected token');
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

	    // NameExpression :=
	    //    Identifier
	    //  | TagIdentifier ':' Identifier
	    //
	    // Tag identifier is one of "module", "external" or "event"
	    // Identifier is the same as Token.NAME, including any dots, something like
	    // namespace.module.MyClass
	    function parseNameExpression() {
	        var name = value;
	        expect(Token.NAME);

	        if (token === Token.COLON && (
	                name === 'module' ||
	                name === 'external' ||
	                name === 'event')) {
	            consume(Token.COLON);
	            name += ':' + value;
	            expect(Token.NAME);
	        }

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
	                    utility.throwError('unexpected token');
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
	        utility.assert(token === Token.NAME && value === 'function', 'FunctionType should start with \'function\'');
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
	            utility.throwError('unexpected token');
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
	                    token === Token.RBRACK || token === Token.GT) {
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
	            expect(Token.RBRACK, 'expected an array-style type declaration (' + value + '[])');
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

	        elements = [expr];
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
	            utility.throwError('not reach to EOF');
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
	            utility.throwError('not reach to EOF');
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
	            utility.throwError('Unknown type ' + node.type);
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
	}());
	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/*
	  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>

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

	    var VERSION;

	    VERSION = __webpack_require__(8).version;
	    exports.VERSION = VERSION;

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
	    exports.DoctrineError = DoctrineError;

	    function throwError(message) {
	        throw new DoctrineError(message);
	    }
	    exports.throwError = throwError;

	    exports.assert = __webpack_require__(9);
	}());

	/* vim: set sw=4 ts=4 et tw=80 : */


/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = {
		"name": "doctrine",
		"description": "JSDoc parser",
		"homepage": "https://github.com/eslint/doctrine",
		"main": "lib/doctrine.js",
		"version": "1.1.0",
		"engines": {
			"node": ">=0.10.0"
		},
		"directories": {
			"lib": "./lib"
		},
		"files": [
			"lib",
			"LICENSE.BSD",
			"LICENSE.closure-compiler",
			"LICENSE.esprima",
			"README.md"
		],
		"maintainers": [
			{
				"name": "Nicholas C. Zakas",
				"email": "nicholas+npm@nczconsulting.com",
				"web": "https://www.nczonline.net"
			},
			{
				"name": "Yusuke Suzuki",
				"email": "utatane.tea@gmail.com",
				"web": "https://github.com/Constellation"
			}
		],
		"repository": {
			"type": "git",
			"url": "http://github.com/eslint/doctrine.git"
		},
		"devDependencies": {
			"coveralls": "^2.11.2",
			"dateformat": "^1.0.11",
			"eslint": "^1.10.3",
			"istanbul": "^0.4.1",
			"linefix": "^0.1.1",
			"mocha": "^2.3.3",
			"npm-license": "^0.3.1",
			"semver": "^5.0.3",
			"shelljs": "^0.5.3",
			"shelljs-nodecli": "^0.1.1",
			"should": "^5.0.1"
		},
		"licenses": [
			{
				"type": "BSD",
				"url": "http://github.com/eslint/doctrine/raw/master/LICENSE.BSD"
			}
		],
		"scripts": {
			"test": "node Makefile.js test",
			"lint": "node Makefile.js lint"
		},
		"dependencies": {
			"esutils": "^1.1.6",
			"isarray": "^1.0.0"
		}
	};

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
	//
	// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
	//
	// Originally from narwhal.js (http://narwhaljs.org)
	// Copyright (c) 2009 Thomas Robinson <280north.com>
	//
	// Permission is hereby granted, free of charge, to any person obtaining a copy
	// of this software and associated documentation files (the 'Software'), to
	// deal in the Software without restriction, including without limitation the
	// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
	// sell copies of the Software, and to permit persons to whom the Software is
	// furnished to do so, subject to the following conditions:
	//
	// The above copyright notice and this permission notice shall be included in
	// all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
	// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	// when used in node, this will actually load the util module we depend on
	// versus loading the builtin util module as happens otherwise
	// this is a bug in node module loading as far as I am concerned
	var util = __webpack_require__(10);

	var pSlice = Array.prototype.slice;
	var hasOwn = Object.prototype.hasOwnProperty;

	// 1. The assert module provides functions that throw
	// AssertionError's when particular conditions are not met. The
	// assert module must conform to the following interface.

	var assert = module.exports = ok;

	// 2. The AssertionError is defined in assert.
	// new assert.AssertionError({ message: message,
	//                             actual: actual,
	//                             expected: expected })

	assert.AssertionError = function AssertionError(options) {
	  this.name = 'AssertionError';
	  this.actual = options.actual;
	  this.expected = options.expected;
	  this.operator = options.operator;
	  if (options.message) {
	    this.message = options.message;
	    this.generatedMessage = false;
	  } else {
	    this.message = getMessage(this);
	    this.generatedMessage = true;
	  }
	  var stackStartFunction = options.stackStartFunction || fail;

	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, stackStartFunction);
	  }
	  else {
	    // non v8 browsers so we can have a stacktrace
	    var err = new Error();
	    if (err.stack) {
	      var out = err.stack;

	      // try to strip useless frames
	      var fn_name = stackStartFunction.name;
	      var idx = out.indexOf('\n' + fn_name);
	      if (idx >= 0) {
	        // once we have located the function frame
	        // we need to strip out everything before it (and its line)
	        var next_line = out.indexOf('\n', idx + 1);
	        out = out.substring(next_line + 1);
	      }

	      this.stack = out;
	    }
	  }
	};

	// assert.AssertionError instanceof Error
	util.inherits(assert.AssertionError, Error);

	function replacer(key, value) {
	  if (util.isUndefined(value)) {
	    return '' + value;
	  }
	  if (util.isNumber(value) && !isFinite(value)) {
	    return value.toString();
	  }
	  if (util.isFunction(value) || util.isRegExp(value)) {
	    return value.toString();
	  }
	  return value;
	}

	function truncate(s, n) {
	  if (util.isString(s)) {
	    return s.length < n ? s : s.slice(0, n);
	  } else {
	    return s;
	  }
	}

	function getMessage(self) {
	  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
	         self.operator + ' ' +
	         truncate(JSON.stringify(self.expected, replacer), 128);
	}

	// At present only the three keys mentioned above are used and
	// understood by the spec. Implementations or sub modules can pass
	// other keys to the AssertionError's constructor - they will be
	// ignored.

	// 3. All of the following functions must throw an AssertionError
	// when a corresponding condition is not met, with a message that
	// may be undefined if not provided.  All assertion methods provide
	// both the actual and expected values to the assertion error for
	// display purposes.

	function fail(actual, expected, message, operator, stackStartFunction) {
	  throw new assert.AssertionError({
	    message: message,
	    actual: actual,
	    expected: expected,
	    operator: operator,
	    stackStartFunction: stackStartFunction
	  });
	}

	// EXTENSION! allows for well behaved errors defined elsewhere.
	assert.fail = fail;

	// 4. Pure assertion tests whether a value is truthy, as determined
	// by !!guard.
	// assert.ok(guard, message_opt);
	// This statement is equivalent to assert.equal(true, !!guard,
	// message_opt);. To test strictly for the value true, use
	// assert.strictEqual(true, guard, message_opt);.

	function ok(value, message) {
	  if (!value) fail(value, true, message, '==', assert.ok);
	}
	assert.ok = ok;

	// 5. The equality assertion tests shallow, coercive equality with
	// ==.
	// assert.equal(actual, expected, message_opt);

	assert.equal = function equal(actual, expected, message) {
	  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
	};

	// 6. The non-equality assertion tests for whether two objects are not equal
	// with != assert.notEqual(actual, expected, message_opt);

	assert.notEqual = function notEqual(actual, expected, message) {
	  if (actual == expected) {
	    fail(actual, expected, message, '!=', assert.notEqual);
	  }
	};

	// 7. The equivalence assertion tests a deep equality relation.
	// assert.deepEqual(actual, expected, message_opt);

	assert.deepEqual = function deepEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected)) {
	    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
	  }
	};

	function _deepEqual(actual, expected) {
	  // 7.1. All identical values are equivalent, as determined by ===.
	  if (actual === expected) {
	    return true;

	  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
	    if (actual.length != expected.length) return false;

	    for (var i = 0; i < actual.length; i++) {
	      if (actual[i] !== expected[i]) return false;
	    }

	    return true;

	  // 7.2. If the expected value is a Date object, the actual value is
	  // equivalent if it is also a Date object that refers to the same time.
	  } else if (util.isDate(actual) && util.isDate(expected)) {
	    return actual.getTime() === expected.getTime();

	  // 7.3 If the expected value is a RegExp object, the actual value is
	  // equivalent if it is also a RegExp object with the same source and
	  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
	  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
	    return actual.source === expected.source &&
	           actual.global === expected.global &&
	           actual.multiline === expected.multiline &&
	           actual.lastIndex === expected.lastIndex &&
	           actual.ignoreCase === expected.ignoreCase;

	  // 7.4. Other pairs that do not both pass typeof value == 'object',
	  // equivalence is determined by ==.
	  } else if (!util.isObject(actual) && !util.isObject(expected)) {
	    return actual == expected;

	  // 7.5 For all other Object pairs, including Array objects, equivalence is
	  // determined by having the same number of owned properties (as verified
	  // with Object.prototype.hasOwnProperty.call), the same set of keys
	  // (although not necessarily the same order), equivalent values for every
	  // corresponding key, and an identical 'prototype' property. Note: this
	  // accounts for both named and indexed properties on Arrays.
	  } else {
	    return objEquiv(actual, expected);
	  }
	}

	function isArguments(object) {
	  return Object.prototype.toString.call(object) == '[object Arguments]';
	}

	function objEquiv(a, b) {
	  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
	    return false;
	  // an identical 'prototype' property.
	  if (a.prototype !== b.prototype) return false;
	  // if one is a primitive, the other must be same
	  if (util.isPrimitive(a) || util.isPrimitive(b)) {
	    return a === b;
	  }
	  var aIsArgs = isArguments(a),
	      bIsArgs = isArguments(b);
	  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
	    return false;
	  if (aIsArgs) {
	    a = pSlice.call(a);
	    b = pSlice.call(b);
	    return _deepEqual(a, b);
	  }
	  var ka = objectKeys(a),
	      kb = objectKeys(b),
	      key, i;
	  // having the same number of owned properties (keys incorporates
	  // hasOwnProperty)
	  if (ka.length != kb.length)
	    return false;
	  //the same set of keys (although not necessarily the same order),
	  ka.sort();
	  kb.sort();
	  //~~~cheap key test
	  for (i = ka.length - 1; i >= 0; i--) {
	    if (ka[i] != kb[i])
	      return false;
	  }
	  //equivalent values for every corresponding key, and
	  //~~~possibly expensive deep test
	  for (i = ka.length - 1; i >= 0; i--) {
	    key = ka[i];
	    if (!_deepEqual(a[key], b[key])) return false;
	  }
	  return true;
	}

	// 8. The non-equivalence assertion tests for any deep inequality.
	// assert.notDeepEqual(actual, expected, message_opt);

	assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected)) {
	    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
	  }
	};

	// 9. The strict equality assertion tests strict equality, as determined by ===.
	// assert.strictEqual(actual, expected, message_opt);

	assert.strictEqual = function strictEqual(actual, expected, message) {
	  if (actual !== expected) {
	    fail(actual, expected, message, '===', assert.strictEqual);
	  }
	};

	// 10. The strict non-equality assertion tests for strict inequality, as
	// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

	assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
	  if (actual === expected) {
	    fail(actual, expected, message, '!==', assert.notStrictEqual);
	  }
	};

	function expectedException(actual, expected) {
	  if (!actual || !expected) {
	    return false;
	  }

	  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
	    return expected.test(actual);
	  } else if (actual instanceof expected) {
	    return true;
	  } else if (expected.call({}, actual) === true) {
	    return true;
	  }

	  return false;
	}

	function _throws(shouldThrow, block, expected, message) {
	  var actual;

	  if (util.isString(expected)) {
	    message = expected;
	    expected = null;
	  }

	  try {
	    block();
	  } catch (e) {
	    actual = e;
	  }

	  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
	            (message ? ' ' + message : '.');

	  if (shouldThrow && !actual) {
	    fail(actual, expected, 'Missing expected exception' + message);
	  }

	  if (!shouldThrow && expectedException(actual, expected)) {
	    fail(actual, expected, 'Got unwanted exception' + message);
	  }

	  if ((shouldThrow && actual && expected &&
	      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
	    throw actual;
	  }
	}

	// 11. Expected to throw an error:
	// assert.throws(block, Error_opt, message_opt);

	assert.throws = function(block, /*optional*/error, /*optional*/message) {
	  _throws.apply(this, [true].concat(pSlice.call(arguments)));
	};

	// EXTENSION! This is annoying to write outside this module.
	assert.doesNotThrow = function(block, /*optional*/message) {
	  _throws.apply(this, [false].concat(pSlice.call(arguments)));
	};

	assert.ifError = function(err) { if (err) {throw err;}};

	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    if (hasOwn.call(obj, key)) keys.push(key);
	  }
	  return keys;
	};


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};


	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (process.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};


	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};


	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;


	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = __webpack_require__(12);

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};


	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(13);

	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(11)))

/***/ },
/* 11 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 12 */
/***/ function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 13 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ }
/******/ ])
});
;