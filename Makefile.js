/**
 * @fileoverview Build file
 * @author nzakas
 */
/* global exec, exit, find, target*/

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

require("shelljs/make");

var nodeCLI = require("shelljs-nodecli");

//------------------------------------------------------------------------------
// Data
//------------------------------------------------------------------------------

var NODE_MODULES = "./node_modules/",

    // Utilities - intentional extra space at the end of each string
    MOCHA = NODE_MODULES + "mocha/bin/_mocha ",

    // Files
    /* eslint-disable no-use-before-define */
    TEST_FILES = find("test/").filter(fileType("js")).join(" "),
    /* eslint-enable no-use-before-define */

    // Settings
    MOCHA_TIMEOUT = 4000;

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Generates a function that matches files with a particular extension.
 * @param {string} extension The file extension (i.e. "js")
 * @returns {Function} The function to pass into a filter method.
 * @private
 */
function fileType(extension) {
    return function(filename) {
        return filename.substring(filename.lastIndexOf(".") + 1) === extension;
    };
}

/**
 * Splits a command result to separate lines.
 * @param {string} result The command result string.
 * @returns {array} The separated lines.
 */
function splitCommandResultToLines(result) {
    return result.trim().split("\n");
}

//------------------------------------------------------------------------------
// Tasks
//------------------------------------------------------------------------------

target.all = function() {
    target.test();
};

target.test = function() {

    var errors = 0,
        lastReturn;

    lastReturn = nodeCLI.exec("istanbul", "cover", MOCHA, "-- -R dot -t " + MOCHA_TIMEOUT, "-c", TEST_FILES);
    if (lastReturn.code !== 0) {
        errors++;
    }

    lastReturn = nodeCLI.exec("istanbul", "check-coverage", "--statement 99 --branch 97 --function 100 --lines 99");
    if (lastReturn.code !== 0) {
        errors++;
    }

    if (errors) {
        exit(1);
    }

};

