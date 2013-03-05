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
/*global require describe it*/
/*jslint node:true */
'use strict';

var doctrine = require('../doctrine');
var assert = require('assert');
require('should');

// tests for the stringify function.  
// ensure that we can parse and then stringify and the results are identical
describe('stringify', function () {
    
    function testStringify(text) {
        it (text, function() {
            var result = doctrine.parse("@param {" + text + "} name");
            //    console.log("Parse Tree: " + JSON.stringify(result, null, " "));
            var stringed = doctrine.stringify(result.tags[0].type);
            text.should.equal(stringed);
        });
    }
    
        // simple
    testStringify("String");
    testStringify("*");
    testStringify("null");
    testStringify("undefined");
    testStringify("void");
    //testStringify("?=");  // Failing
    
    // rest
    testStringify("...string");
    testStringify("...[string]");
    testStringify("...[[string]]");
    
    // optional, nullable, nonnullable
    testStringify("string=");
    testStringify("?string");
    testStringify("!string");
    testStringify("!string=");

    // type applications
    testStringify("Array.<String>");
    testStringify("Array.<String,Number>");

    // union types
    testStringify("()");
    testStringify("(String|Number)");

    // Arrays
    testStringify("[String]");
    testStringify("[String,Number]");
    testStringify("[(String|Number)]");

    // Record types
    testStringify("{a}");
    testStringify("{a:String}");
    testStringify("{a:String,b}");
    testStringify("{a:String,b:object}");
    testStringify("{a:String,b:foo.bar.baz}");
    testStringify("{a:(String|Number),b,c:Array.<String>}");
    testStringify("...{a:(String|Number),b,c:Array.<String>}");
    testStringify("{a:(String|Number),b,c:Array.<String>}=");
    
    // fn types
    testStringify("function(a)");
    testStringify("function(a):String");
    testStringify("function(a:number):String");
    testStringify("function(a:number,b:Array.<(String|Number|Object)>):String");
    testStringify("function(a:number,callback:function(a:Array.<(String|Number|Object)>):boolean):String");
    testStringify("function(a:(string|number),this:string,new:true):function():number");
    testStringify("function(a:(string|number),this:string,new:true):function(a:function(val):result):number");
  

    
});



// node unit variant of test. OK to delete. Use this if we want to switch back to nodeunit
//    function testStringify(text) {
//        var result = doctrine.parse("@param {" + text + "} name");
//        //    console.log("Parse Tree: " + JSON.stringify(result, null, " "));
//        var stringed = doctrine.stringify(result.tags[0].type);
//        test.equal(text, stringed, "Parse Tree: " + JSON.stringify(result, null, " "));
//    }