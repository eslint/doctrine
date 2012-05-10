/*
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>

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

/*jslint node:true */
'use strict';

var doctrine = require('../doctrine');
require('should');

describe('parse', function () {
    it('const', function () {
        var res = doctrine.parse('/** @const */');
        res.tags.should.have.length(1);
        res.tags[0].should.have.property('title', 'const');
    });

    it('const multiple', function () {
        var res = doctrine.parse("/**@const\n @const*/");
        res.tags.should.have.length(2);
        res.tags[0].should.have.property('title', 'const');
        res.tags[1].should.have.property('title', 'const');
    });

    it('const double', function () {
        var res = doctrine.parse("/**@const\n @const*/");
        res.tags.should.have.length(2);
        res.tags[0].should.have.property('title', 'const');
        res.tags[1].should.have.property('title', 'const');
    });

    it('const triple', function () {
        var res = doctrine.parse(
            [
                "/**",
                " * @const @const",
                " * @const @const",
                " * @const @const",
                " */"
            ].join('\n'), { unwrap: true });
        res.tags.should.have.length(3);
        res.tags[0].should.have.property('title', 'const');
        res.tags[1].should.have.property('title', 'const');
        res.tags[2].should.have.property('title', 'const');
    });

    it('param', function () {
        var res = doctrine.parse(
            [
                "/**",
                " * @param {String} userName",
                "*/",
            ].join('\n'), { unwrap: true });
        res.tags.should.have.length(1);
        res.tags[0].should.have.property('title', 'param');
        res.tags[0].should.have.property('name', 'userName');
        res.tags[0].should.have.property('type');
        res.tags[0].type.should.eql({
            type: 'NameExpression',
            name: 'String'
        });
    });

    it('param broken', function () {
        var res = doctrine.parse(
            [
                "/**",
                " * @param {String} userName",
                " * @param {String userName",
                "*/",
            ].join('\n'), { unwrap: true });
        res.tags.should.have.length(1);
        res.tags[0].should.have.property('title', 'param');
        res.tags[0].should.have.property('name', 'userName');
        res.tags[0].should.have.property('type');
        res.tags[0].type.should.eql({
            type: 'NameExpression',
            name: 'String'
        });
    });

    it('param record', function () {
        var res = doctrine.parse(
            [
                "/**",
                " * @param {{ok:String}} userName",
                "*/"
            ].join('\n'), { unwrap: true });
        res.tags.should.have.length(1);
        res.tags[0].should.have.property('title', 'param');
        res.tags[0].should.have.property('name', 'userName');
        res.tags[0].should.have.property('type');
        res.tags[0].type.should.eql({
            type: 'RecordType',
            fields: [{
                type: 'FieldType',
                key: 'ok',
                value: {
                    type: 'NameExpression',
                    name: 'String'
                }
            }]
        });
    });

    it('param record broken', function () {
        var res = doctrine.parse(
            [
                "/**",
                " * @param {{ok:String} userName",
                "*/"
            ].join('\n'), { unwrap: true });
        res.tags.should.be.empty;
    });

    it('param without braces', function () {
        var res = doctrine.parse(
            [
                "/**",
                " * @param string name description",
                "*/"
            ].join('\n'), { unwrap: true });
        res.tags.should.have.length(1);
        res.tags[0].should.have.property('title', 'param');
        res.tags[0].should.have.property('name', 'name');
        res.tags[0].should.have.property('type');
        res.tags[0].type.should.eql({
            type: 'NameExpression',
            name: 'string'
        });
        res.tags[0].should.have.property('description', 'description');
    });
});

describe('parseType', function () {
    it('union type closure-compiler extended', function () {
        var type = doctrine.parseType("string|number");
        type.should.eql({
            type: 'UnionType',
            elements: [{
                type: 'NameExpression',
                name: 'string'
            }, {
                type: 'NameExpression',
                name: 'number'
            }]
        });
    });

    it('empty union type', function () {
        var type = doctrine.parseType("()");
        type.should.eql({
            type: 'UnionType',
            elements: []
        });
    });

    it('comma last array type', function () {
        var type = doctrine.parseType("[string,]");
        type.should.eql({
            type: 'ArrayType',
            elements: [{
                type: 'NameExpression',
                name: 'string'
            }]
        });
    });

    it('comma last record type', function () {
        var type = doctrine.parseType("{,}");
        type.should.eql({
            type: 'RecordType',
            fields: []
        });
    });

    it('type application', function () {
        var type = doctrine.parseType("Array.<String>");
        type.should.eql({
            type: 'TypeApplication',
            expr: {
                type: 'NameExpression',
                name: 'Array'
            },
            applications: [{
                type: 'NameExpression',
                name: 'String'
            }]
        });
    });

    it('type application with multiple patterns', function () {
        var type = doctrine.parseType("Array.<String, Number>");
        type.should.eql({
            type: 'TypeApplication',
            expr: {
                type: 'NameExpression',
                name: 'Array'
            },
            applications: [{
                type: 'NameExpression',
                name: 'String'
            }, {
                type: 'NameExpression',
                name: 'Number'
            }]
        });
    });

    it('type application without dot', function () {
        var type = doctrine.parseType("Array<String>");
        type.should.eql({
            type: 'TypeApplication',
            expr: {
                type: 'NameExpression',
                name: 'Array'
            },
            applications: [{
                type: 'NameExpression',
                name: 'String'
            }]
        });
    });
});

describe('parseParamType', function () {
    it('question', function () {
        var type = doctrine.parseParamType("?");
        type.should.eql({
            type: 'NullableLiteral'
        });
    });

    it('question option', function () {
        var type = doctrine.parseParamType("?=");
        type.should.eql({
            type: 'OptionalType',
            expr: {
                type: 'NullableLiteral'
            }
        });
    });

    it('function option parameters former', function () {
        var type = doctrine.parseParamType("function(?, number)");
        type.should.eql({
            type: 'FunctionType',
            params: [{
                type: 'NullableLiteral'
            }, {
                type: 'NameExpression',
                name: 'number'
            }],
            result: null,
            this: null,
            new: false
        });
    });

    it('function option parameters latter', function () {
        var type = doctrine.parseParamType("function(number, ?)");
        type.should.eql({
            type: 'FunctionType',
            params: [{
                type: 'NameExpression',
                name: 'number'
            }, {
                type: 'NullableLiteral'
            }],
            result: null,
            this: null,
            new: false
        });
    });

    it('function type union', function () {
        var type = doctrine.parseParamType("function(): ?|number");
        type.should.eql({
            type: 'UnionType',
            elements: [{
                type: 'FunctionType',
                params: [],
                result: {
                    type: 'NullableLiteral'
                },
                this: null,
                new: false
            }, {
                type: 'NameExpression',
                name: 'number'
            }]
        });
    });
});

describe('invalid', function () {
    it('empty union pipe', function () {
        doctrine.parseType.bind(doctrine, "(|)").should.throw();
        doctrine.parseType.bind(doctrine, "(string|)").should.throw();
        doctrine.parseType.bind(doctrine, "(string||)").should.throw();
    });

    it('comma only array type', function () {
        doctrine.parseType.bind(doctrine, "[,]").should.throw();
    });

    it('comma only record type', function () {
        doctrine.parseType.bind(doctrine, "{,,}").should.throw();
    });
});
/* vim: set sw=4 ts=4 et tw=80 : */
