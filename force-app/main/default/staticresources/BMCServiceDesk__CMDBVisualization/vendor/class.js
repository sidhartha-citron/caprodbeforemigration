/*
 class.js

 by Matthias Ladkau (matthias@devt.de)

 Class objects with constructor and multi-inheritance support.

 Based on: Simple JavaScript Inheritance by John Resig
 http://ejohn.org/blog/simple-javascript-inheritance/

 Inspired by base2 and Prototype

 -------
The MIT License (MIT)

Copyright (c) 2015 Matthias Ladkau

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE
 -------

 Notes:

 Classes are created with the create method for example:

 CA = Class.create({
    attr : 123,
    init : function (arg) {
        this.attr = arg;
    }
 });

 Classes can have attributes and a constructor method called
 "init". Classes are instantiated like this:

 a = new CA("test");

 Given arguments are passed to the constructor method "init".
 Classes can be organized in an inheritence structure. A subclass
 of CA would be declared like this:

 CB = CA.create({
    ...
 });

 Functions can be overwritten in subclasses and the overwritten
 function can be called with "this._super(...)". For example:

 CB = CA.create({
    init : function (arg) {
        this._super(arg);
    }
 });

 It is possible to inherit from multiple classes. However one class
 must be choosen to be the primary class. The "instanceof" operator
 works only with primary superclasses. An example of multi inheritence
 would be:

 CC = CA.create(CX, {
    init : function (arg) {
        this._super(arg);
    }
 });

 In this example the class CC would inherit all functions from CX and CA.
 A call to "this._super" would first go to CX and to CA if the
 function is not defined in CX. Objects instantiated from class
 CC are "instanceof" CA but not CX.

 */

// BMC change: Class renamed to TWClass

var TWClass = function() {};

(function(){

    // Pattern which checks if a given function uses the function _super - this test
    // returns always true if toString on a function does not return the function code
    var functionUsesSuper = /abc/.test(function () { abc(); }) ? /\b_super\b/ : /.*/;

    // Flag which is used to detect if we are currently initialising
    var initializing = false;

    // Add create function to the new class object
    TWClass.create = function() {

        // Get the current prototype as the super prototype of the new class
        var _super        = this.prototype,
            _super_chain  = [ _super ];

        // Clone the current class object (without running the init constructor function)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Go through all given mixin objects. Each object should be either
        // a normal properties object or a constructor function.
        for (var i = 0; i < arguments.length; i++) {
            var properties = arguments[i];

            if (properties === undefined) {
                console.log("Warning: Undefined mixin");
            }

            // Check if the given mixin is a constructor function
            if (typeof properties === "function") {
                // Use the prototype as properties
                properties = properties.prototype;
            }

            // Copy the given properties to the cloned class object
            for (var name in properties) {

                // Check if we're overwriting an existing function and if the new function uses
                // it by calling _super
                if (typeof properties[name] == "function" && 
                    typeof _super[name] == "function" &&
                    functionUsesSuper.test(properties[name])) {

                    // If _super is called we need to wrap the given function
                    // in a closure and provide the right environment

                    prototype[name] = (
                        function(name, func, _super) {
                            return function() {
                                var t, ret;
                                // Save the current value in _super
                                t = this._super;
                                // Add the function from the current class object as _super function
                                this._super = _super[name];
                                // Run the function which calls _super
                                ret = func.apply(this, arguments);
                                // Restore the old value in _super
                                this._super = t;
                                // Return the result
                                return ret;
                            };
                        }
                    )(name, properties[name], _super);

                } else if (typeof properties[name] == "function" &&
                           functionUsesSuper.test(properties[name])) {

                    // Need to search for super in a higher up mixin

                    for (var j=0; j<_super_chain.length; j++) {
                        var _upper_super = _super_chain[j];

                        if (typeof _upper_super[name] == "function") {

                            // If _super of an upper super class is called we need
                            // to wrap the given function in a closure and
                            // provide the right environment

                            // jshint -W083
                            prototype[name] = (
                                function(name, func, _super) {
                                    return function() {
                                        var t, ret;
                                        // Save the current value in _super
                                        t = this._super;
                                        // Add the function from the current class object as _super function
                                        this._super = _upper_super[name];
                                        // Run the function which calls _super
                                        ret = func.apply(this, arguments);
                                        // Restore the old value in _super
                                        this._super = t;
                                        // Return the result
                                        return ret;
                                    };
                                }
                            )(name, properties[name], _super);
                            // jshint +W083

                            break;
                        }
                    }

                } else {

                    prototype[name] = properties[name];
                }
            }

            // Once the mixin is added it becomes the new super class
            // so we can have this._super call chains

            _super = properties;
            _super_chain.unshift(_super);
        }

        // Defining a constructor function which is used to call the constructor function init on objects
        var Class = function () {
            if ( !initializing && this.init ) {
                this.init.apply(this, arguments);
          }
        };

        // Put our constructed prototype object in place
        Class.prototype = prototype;

        // Constructor of the new object should be Class
        // (this must be done AFTER the prototype was assigned)
        Class.prototype.constructor = Class;

        // The current function becomes the create function
        // on the new object
        Class.create = arguments.callee;

        return Class;
    };
})();
