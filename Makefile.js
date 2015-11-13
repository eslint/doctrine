/**
 * @fileoverview Build file
 * @author nzakas
 */
/* global cat, cd, cp, echo, exec, exit, find, ls, mkdir, mv, pwd, rm, target, test*/

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

require("shelljs/make");

var checker = require("npm-license"),
    dateformat = require("dateformat"),
    fs = require("fs"),
    nodeCLI = require("shelljs-nodecli"),
    os = require("os"),
    path = require("path"),
    semver = require("semver");

//------------------------------------------------------------------------------
// Settings
//------------------------------------------------------------------------------

var OPEN_SOURCE_LICENSES = [
    /MIT/, /BSD/, /Apache/, /ISC/, /WTF/, /Public Domain/
];

//------------------------------------------------------------------------------
// Data
//------------------------------------------------------------------------------

var NODE = "node ", // intentional extra space
    NODE_MODULES = "./node_modules/",

    // Utilities - intentional extra space at the end of each string
    MOCHA = NODE_MODULES + "mocha/bin/_mocha ",

    // Files
    MAKEFILE = "./Makefile.js",
    PACKAGE = "./package.json",
    /* eslint-disable no-use-before-define */
    JS_FILES = find("lib/").filter(fileType("js")).join(" "),
    TEST_FILES = find("test/").filter(fileType("js")).join(" "),
    /* eslint-enable no-use-before-define */

    // Regex
    TAG_REGEX = /^(?:Fix|Update|Breaking|Docs|Build|New|Upgrade):/,
    ISSUE_REGEX = /\((?:fixes|refs) #\d+(?:.*(?:fixes|refs) #\d+)*\)$/,

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
 * Returns package.json contents as a JavaScript object
 * @returns {Object} Contents of package.json for the project
 * @private
 */
function getPackageInfo() {
    return JSON.parse(fs.readFileSync(PACKAGE));
}

/**
 * Executes a command and returns the output instead of printing it to stdout.
 * @param {string} cmd The command string to execute.
 * @returns {string} The result of the executed command.
 */
function execSilent(cmd) {
    return exec(cmd, { silent: true }).output;
}

/**
 * Given a semver version, determine the type of version.
 * @param {string} version A semver version string.
 * @returns {string} The type of version.
 * @private
 */
function getReleaseType(version) {

    if (semver.patch(version) > 0) {
        return "patch";
    } else if (semver.minor(version) > 0) {
        return "minor";
    } else {
        return "major";
    }
}

/**
 * Creates a release version tag and pushes to origin.
 * @param {string} type The type of release to do (patch, minor, major)
 * @returns {void}
 */
function release(type) {
    var newVersion;/* , changes;*/

    target.test();
    echo("Generating new version");
    newVersion = execSilent("npm version " + type).trim();

    echo("Generating changelog");
    var releaseInfo = target.changelog();

    // add changelog to commit
    exec("git add CHANGELOG.md");
    exec("git commit --amend --no-edit");

    // replace existing tag
    exec("git tag -f " + newVersion);

    // push all the things
    echo("Publishing to git");
    exec("git push origin master --tags");

    echo("Publishing to npm");
    getPackageInfo().files.filter(function(dirPath) {
        return fs.lstatSync(dirPath).isDirectory();
    }).forEach(nodeCLI.exec.bind(nodeCLI, "linefix"));

    exec("npm publish");
    exec("git reset --hard");

}

/**
 * Splits a command result to separate lines.
 * @param {string} result The command result string.
 * @returns {array} The separated lines.
 */
function splitCommandResultToLines(result) {
    return result.trim().split("\n");
}

/**
 * Gets the tag name where a given file was introduced first.
 * @param {string} filePath The file path to check.
 * @returns {string} The tag name.
 */
function getTagOfFirstOccurrence(filePath) {
    var firstCommit = getFirstCommitOfFile(filePath),
        tags = execSilent("git tag --contains " + firstCommit);

    tags = splitCommandResultToLines(tags);
    return tags.reduce(function(list, version) {
        version = semver.valid(version.trim());
        if (version) {
            list.push(version);
        }
        return list;
    }, []).sort(semver.compare)[0];
}

/**
 * Returns the version tags
 * @returns {string[]} Tags
 * @private
 */
function getVersionTags() {
    var tags = splitCommandResultToLines(execSilent("git tag"));

    return tags.reduce(function(list, tag) {
        if (semver.valid(tag)) {
            list.push(tag);
        }
        return list;
    }, []).sort(semver.compare);
}

/**
 * Returns all the branch names
 * @returns {string[]} branch names
 * @private
 */
function getBranches() {
    var branchesRaw = splitCommandResultToLines(execSilent("git branch --list")),
        branches = [],
        branchName;

    for (var i = 0; i < branchesRaw.length; i++) {
        branchName = branchesRaw[i].replace(/^\*(.*)/, "$1").trim();
        branches.push(branchName);
    }
    return branches;
}

/**
 * Check if the branch name is valid
 * @param {string} branchName Branch name to check
 * @returns {boolean} true is branch exists
 * @private
 */
function hasBranch(branchName) {
    var branches = getBranches();
    return branches.indexOf(branchName) !== -1;
}

//------------------------------------------------------------------------------
// Tasks
//------------------------------------------------------------------------------

target.all = function() {
    target.test();
};

target.lint = function() {
    var errors = 0,
        makeFileCache = " ",
        jsCache = " ",
        testCache = " ",
        lastReturn;

    // using the cache locally to speed up linting process
    if (!process.env.TRAVIS) {
        makeFileCache = " --cache --cache-file .cache/makefile_cache ";
        jsCache = " --cache --cache-file .cache/js_cache ";
        testCache = " --cache --cache-file .cache/test_cache ";
    }

    // echo("Validating Makefile.js");
    // lastReturn = nodeCLI.exec("eslint", makeFileCache + MAKEFILE);
    // if (lastReturn.code !== 0) {
    //     errors++;
    // }

    echo("Validating JavaScript files");
    lastReturn = nodeCLI.exec("eslint", jsCache + JS_FILES);
    if (lastReturn.code !== 0) {
        errors++;
    }

    // echo("Validating JavaScript test files");
    // lastReturn = nodeCLI.exec("eslint", testCache + TEST_FILES);
    // if (lastReturn.code !== 0) {
    //     errors++;
    // }

    if (errors) {
        exit(1);
    }
};

target.test = function() {
    target.lint();
    var errors = 0,
        lastReturn;

    lastReturn = nodeCLI.exec("istanbul", "cover", MOCHA, "-- -R progress -t " + MOCHA_TIMEOUT, "-c", TEST_FILES);
    if (lastReturn.code !== 0) {
        errors++;
    }

    lastReturn = nodeCLI.exec("istanbul", "check-coverage", "--statement 99 --branch 97 --function 99 --lines 99");
    if (lastReturn.code !== 0) {
        errors++;
    }

    if (errors) {
        exit(1);
    }

    target.checkLicenses();
};

target.changelog = function() {

    // get most recent two tags
    var tags = getVersionTags(),
        rangeTags = tags.slice(tags.length - 2),
        now = new Date(),
        timestamp = dateformat(now, "mmmm d, yyyy"),
        releaseInfo = {
            releaseType: getReleaseType(rangeTags[1]),
            version: rangeTags[1]
        };

    // output header
    (rangeTags[1] + " - " + timestamp + "\n").to("CHANGELOG.tmp");

    // get log statements
    var logs = execSilent("git log --no-merges --pretty=format:\"* %s (%an)\" " + rangeTags.join("..")).split(/\n/g);
    logs.shift();   // get rid of version commit
    logs.forEach(function(log) {
        var tag = log.substring(2, log.indexOf(":")).toLowerCase();

        if (!releaseInfo["changelog_" + tag]) {
            releaseInfo["changelog_" + tag] = [];
        }

        releaseInfo["changelog_" + tag].push(log);
    });

    var output = logs.join("\n"); // and join it into a string
    releaseInfo.raw = output;

    logs.push(""); // to create empty lines
    logs.unshift("");

    // output log statements
    logs.join("\n").toEnd("CHANGELOG.tmp");

    // switch-o change-o
    cat("CHANGELOG.tmp", "CHANGELOG.md").to("CHANGELOG.md.tmp");
    rm("CHANGELOG.tmp");
    rm("CHANGELOG.md");
    mv("CHANGELOG.md.tmp", "CHANGELOG.md");

    return releaseInfo;
};

target.checkLicenses = function() {

    /**
     * Check if a dependency is eligible to be used by us
     * @param {object} dependency dependency to check
     * @returns {boolean} true if we have permission
     * @private
     */
    function isPermissible(dependency) {
        var licenses = dependency.licenses;

        if (Array.isArray(licenses)) {
            return licenses.some(function(license) {
                return isPermissible({
                    name: dependency.name,
                    licenses: license
                });
            });
        }

        return OPEN_SOURCE_LICENSES.some(function(license) {
            return license.test(licenses);
        });
    }

    echo("Validating licenses");

    checker.init({
        start: __dirname
    }, function(deps) {
        var impermissible = Object.keys(deps).map(function(dependency) {
            return {
                name: dependency,
                licenses: deps[dependency].licenses
            };
        }).filter(function(dependency) {
            return !isPermissible(dependency);
        });

        if (impermissible.length) {
            impermissible.forEach(function(dependency) {
                console.error("%s license for %s is impermissible.",
                    dependency.licenses,
                    dependency.name
                );
            });
            exit(1);
        }
    });
};

target.checkGitCommit = function() {
    var commitMsgs,
        failed;

    if (hasBranch("master")) {
        commitMsgs = splitCommandResultToLines(execSilent("git log HEAD --not master --format=format:%s --no-merges"));
    } else {
        commitMsgs = [execSilent("git log -1 --format=format:%s --no-merges")];
    }

    echo("Validating Commit Message");

    // No commit since master should not cause test to fail
    if (commitMsgs[0] === "") {
        return;
    }

    // Check for more than one commit
    if (commitMsgs.length > 1) {
        echo(" - More than one commit found, please squash.");
        failed = true;
    }

    // Only check non-release messages
    if (!semver.valid(commitMsgs[0])) {
        if (commitMsgs[0].slice(0, commitMsgs[0].indexOf("\n")).length > 72) {
            echo(" - First line of commit message must not exceed 72 characters");
            failed = true;
        }

        // Check for tag at start of message
        if (!TAG_REGEX.test(commitMsgs[0])) {
            echo([" - Commit summary must start with one of:",
                "    'Fix:'",
                "    'Update:'",
                "    'Breaking:'",
                "    'Docs:'",
                "    'Build:'",
                "    'New:'",
                "    'Upgrade:'",
                "   Please refer to the contribution guidelines for more details."].join("\n"));
            failed = true;
        }

        // Check for an issue reference at end (unless it's a documentation commit)
        if (!/^Docs:/.test(commitMsgs[0])) {
            if (!ISSUE_REGEX.test(commitMsgs[0])) {
                echo([" - Commit summary must end with with one of:",
                    "    '(fixes #1234)'",
                    "    '(refs #1234)'",
                    "   Where '1234' is the issue being addressed.",
                    "   Please refer to the contribution guidelines for more details."].join("\n"));
                failed = true;
            }
        }
    }

    if (failed) {
        exit(1);
    }
};

target.patch = function() {
    release("patch");
};

target.minor = function() {
    release("minor");
};

target.major = function() {
    release("major");
};
