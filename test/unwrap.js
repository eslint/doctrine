/*
 * @fileoverview Main Doctrine object
 * @author Yusuke Suzuki <utatane.tea@gmail.com>
 */

/*jslint node:true */
'use strict';

var fs = require('fs'),
    path = require('path'),
    root = path.join(path.dirname(fs.realpathSync(__filename)), '..'),
    doctrine = require(root);
require('should');

describe('unwrapComment', function () {
  it('normal', function () {
    doctrine.unwrapComment('/**\n * @const\n * @const\n */').should.equal('\n@const\n@const');
  });

  it('single', function () {
    doctrine.unwrapComment('/**x*/').should.equal('x');
  });

  it('more stars', function () {
    doctrine.unwrapComment('/***x*/').should.equal('x');
    doctrine.unwrapComment('/****x*/').should.equal('*x');
  });

  it('2 lines', function () {
    doctrine.unwrapComment('/**x\n * y\n*/').should.equal('x\ny');
  });

  it('2 lines with space', function () {
    doctrine.unwrapComment('/**x\n *    y\n*/').should.equal('x\n   y');
  });

  it('3 lines with blank line', function () {
    doctrine.unwrapComment('/**x\n *\n \* y\n*/').should.equal('x\n\ny');
  });
});
/* vim: set sw=4 ts=4 et tw=80 : */
