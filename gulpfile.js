/*
  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>

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

'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var eslint = require('gulp-eslint');
var istanbul = require('gulp-istanbul');

var SRC = [ 'doctrine.js' ];

var TEST = [ 'test/*.js' ];

var LINT = [
    'gulpfile.js'
].concat(SRC);

var ESLINT_OPTION = {
    'rules': {
        'quotes': 0,
        'eqeqeq': 0,
        'no-use-before-define': 0,
        'no-underscore-dangle': 0,
        'no-shadow': 0,
        'no-constant-condition': 0,
        'no-multi-spaces': 0
    },
    'env': {
        'node': true
    }
};

gulp.task('test', function (cb) {
    gulp.src(SRC)
        .pipe(istanbul()) // Covering files
        .on('finish', function () {
            gulp.src(TEST)
                .pipe(mocha({
                    reporter: 'spec',
                    timeout: 100000 // 100s
                    }))
                .pipe(istanbul.writeReports()) // Creating the reports after tests runned
                .on('end', cb);
        });
});

gulp.task('lint', function () {
    return gulp.src(LINT)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter(require('jshint-stylish')))
        .pipe(jshint.reporter('fail'))
        .pipe(eslint(ESLINT_OPTION))
        .pipe(eslint.formatEach('compact', process.stderr))
        .pipe(eslint.failOnError());
});

gulp.task('travis', [ 'lint', 'test' ]);
gulp.task('default', [ 'travis' ]);
