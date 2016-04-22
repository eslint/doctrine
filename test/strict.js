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

describe('strict parse', function () {
    // https://github.com/Constellation/doctrine/issues/21
    it('unbalanced braces', function () {
        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * @param {const",
                    " */"
                ].join('\n'), { unwrap: true, strict: true });
        }).should.throw('Braces are not balanced');

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * @param {const",
                    " */"
                ].join('\n'), { unwrap: true });
        }).should.not.throw();

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * Description",
                    " * @param {string name Param description",
                    " * @param {int} foo Bar",
                    " */"
                ].join('\n'), { unwrap: true, strict: true });
        }).should.throw('Braces are not balanced');

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * Description",
                    " * @param {string name Param description",
                    " * @param {int} foo Bar",
                    " */"
                ].join('\n'), { unwrap: true });
        }).should.not.throw();

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * Description",
                    " * @returns {int",
                    " */"
                ].join('\n'), { unwrap: true, strict: true });
        }).should.throw('Braces are not balanced');

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * Description",
                    " * @returns {int",
                    " */"
                ].join('\n'), { unwrap: true });
        }).should.not.throw();
    });

    // https://github.com/Constellation/doctrine/issues/21
    it('incorrect tag starting with @@', function () {
        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * @@version",
                    " */"
                ].join('\n'), { unwrap: true, strict: true });
        }).should.throw('Missing or invalid title');

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * @@version",
                    " */"
                ].join('\n'), { unwrap: true });
        }).should.not.throw();

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * Description",
                    " * @@param {string} name Param description",
                    " */"
                ].join('\n'), { unwrap: true, strict: true });
        }).should.throw('Missing or invalid title');

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * Description",
                    " * @@param {string} name Param description",
                    " */"
                ].join('\n'), { unwrap: true });
        }).should.not.throw();

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * Description",
                    " * @kind ng",
                    " */"
                ].join('\n'), { unwrap: true, strict: true });
        }).should.throw('Invalid kind name \'ng\'');

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * Description",
                    " * @variation Animation",
                    " */"
                ].join('\n'), { unwrap: true, strict: true });
        }).should.throw('Invalid variation \'Animation\'');

        (function () {
            doctrine.parse(
                [
                    "/**",
                    " * Description",
                    " * @access ng",
                    " */"
                ].join('\n'), { unwrap: true, strict: true });
        }).should.throw('Invalid access name \'ng\'');
    });
});
