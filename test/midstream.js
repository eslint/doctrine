/*
 * @fileoverview Main Doctrine object
 * @author Yusuke Suzuki <utatane.tea@gmail.com>
 */

/*global require describe it*/
/*jslint node:true */
'use strict';

var fs = require('fs'),
    path = require('path'),
    root = path.join(path.dirname(fs.realpathSync(__filename)), '..'),
    doctrine = require(root);
require('should');

describe('midstream', function () {
    it('parseType', function () {
        var res = doctrine.parseType('string name', { midstream: true });
        res.should.eql({
            "expression": {
                "name": "string",
                "type": "NameExpression"
            },
            "index": 6
        });
    });

    it('parseParamType', function () {
        var res = doctrine.parseParamType('...test ok', { midstream: true });
        res.should.eql({
            "expression": {
                "expression": {
                    "name": "test",
                    "type": "NameExpression"
                },
                "type": "RestType"
            },
            "index": 7
        });
    });
});

/* vim: set sw=4 ts=4 et tw=80 : */
