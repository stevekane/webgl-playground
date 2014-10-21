(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var B = require("benchmark")

/*
 * The goal here is to explore the performance tradeoffs when iterating
 * over objects to perform an update.  In particular, we want to know what
 * overhead is associated with the following factors:
 *
 * 1) Size of object
 * 2) Regularity of object's "types"
 * 3) 
 *
 *
 *
 */

function SmallObject () {
  this.x  = 1
  this.y  = 2
  this.z  = 3
  this.dx = .1
  this.dy = .1
  this.dz = .1
}

function SmallObjectNested () {
  this.position = {
    x: 1,
    y: 2,
    z: 3 
  }
  this.velocity = {
    x: .1,
    y: .1,
    z: .1 
  }
}

function SmallNestedArrayObject () {
  this.position = new Float32Array([1,2,3])
  this.velocity = new Float32Array([.1,.1,.1])
}

var count = 10000
var sos   = []
var sons  = []
var sonas = []
var fta   = new Float32Array(count * 6)
var ita   = new Uint32Array(count * 6)
var ijsa  = []
var fjsa  = []
var poss  = new Float32Array(count * 3)
var vels  = new Float32Array(count * 3)

for (var i = 0; i < count; ++i) {
  sos.push(new SmallObject)
  sons.push(new SmallObjectNested)
  sonas.push(new SmallNestedArrayObject)
  fta.set([1, 2, 3, 0.1, 0.1, 0.1], i*6)
  ita.set([1, 2, 3, 1, 1, 1], i*6)
  
  poss.set([1, 2, 3], i*3) 
  vels.set([0.1, 0.1, 0.1], i*3) 
  
  //push group of ints
  ijsa.push(1)
  ijsa.push(2)
  ijsa.push(3)
  ijsa.push(1)
  ijsa.push(1)
  ijsa.push(1)

  //push group of floats
  fjsa.push(1.0)
  fjsa.push(2.0)
  fjsa.push(3.0)
  fjsa.push(0.1)
  fjsa.push(0.1)
  fjsa.push(0.1)
}

var suite = new B.Suite

suite.add("small objects", function () {
  var obj

  for (var j = 0; j < sos.length; ++j) {
    obj    = sos[j]
    obj.x += obj.dx
    obj.y += obj.dy
    obj.z += obj.dz
  }
})

suite.add("small nested objects", function () {
  var obj

  for (var j = 0; j < sons.length; ++j) {
    obj             = sons[j]
    obj.position.x += obj.velocity.x
    obj.position.y += obj.velocity.y
    obj.position.z += obj.velocity.z
  }
})

suite.add("small nested array object", function () {
  var obj

  for (var j = 0; j < sonas.length; ++j) {
    obj              = sonas[j] 
    obj.position[0] += obj.velocity[0]
    obj.position[1] += obj.velocity[1]
    obj.position[2] += obj.velocity[2]
  }
})

suite.add("flat floats array", function () {
  for (var j = 0; j < fta.length; j+=6) {
    fta[j]   += fta[j+3]
    fta[j+1] += fta[j+4]
    fta[j+2] += fta[j+5]
  }
})

suite.add("separate flat float arrays", function () {
  for (var j = 0; j < poss.length; j+=3) {
    poss[j]   += vels[j]  
    poss[j+1] += vels[j+1]  
    poss[j+2] += vels[j+2]  
  }
})

//suite.add("flat ints array", function () {
//  for (var j = 0; j < ita.length; j+=6) {
//    ita[j]   += ita[j+3]
//    ita[j+1] += ita[j+4]
//    ita[j+2] += ita[j+5]
//  }
//})

//suite.add("flat jsarray ints", function () {
//  for (var j = 0; j < ijsa.length; j+=6) {
//    ijsa[j]   += ijsa[j+3]
//    ijsa[j+1] += ijsa[j+4]
//    ijsa[j+2] += ijsa[j+5]
//  }
//})

//suite.add("flat jsarray floats", function () {
//  for (var j = 0; j < fjsa.length; j+=6) {
//    fjsa[j]   += fjsa[j+3]
//    fjsa[j+1] += fjsa[j+4]
//    fjsa[j+2] += fjsa[j+5]
//  }
//})

suite.on("cycle", function (e) {
  console.log(String(e.target))
})

suite.on("complete", function () {
  console.log(this.filter("fastest").pluck("name"))
})

//suite.run()
window.suites = {
  iterations: suite 
}

},{"benchmark":2}],2:[function(require,module,exports){
(function (process,global){
/*!
 * Benchmark.js v1.0.0 <http://benchmarkjs.com/>
 * Copyright 2010-2012 Mathias Bynens <http://mths.be/>
 * Based on JSLitmus.js, copyright Robert Kieffer <http://broofa.com/>
 * Modified by John-David Dalton <http://allyoucanleet.com/>
 * Available under MIT license <http://mths.be/mit>
 */
;(function(window, undefined) {
  'use strict';

  /** Used to assign each benchmark an incrimented id */
  var counter = 0;

  /** Detect DOM document object */
  var doc = isHostType(window, 'document') && document;

  /** Detect free variable `define` */
  var freeDefine = typeof define == 'function' &&
    typeof define.amd == 'object' && define.amd && define;

  /** Detect free variable `exports` */
  var freeExports = typeof exports == 'object' && exports &&
    (typeof global == 'object' && global && global == global.global && (window = global), exports);

  /** Detect free variable `require` */
  var freeRequire = typeof require == 'function' && require;

  /** Used to crawl all properties regardless of enumerability */
  var getAllKeys = Object.getOwnPropertyNames;

  /** Used to get property descriptors */
  var getDescriptor = Object.getOwnPropertyDescriptor;

  /** Used in case an object doesn't have its own method */
  var hasOwnProperty = {}.hasOwnProperty;

  /** Used to check if an object is extensible */
  var isExtensible = Object.isExtensible || function() { return true; };

  /** Used to access Wade Simmons' Node microtime module */
  var microtimeObject = req('microtime');

  /** Used to access the browser's high resolution timer */
  var perfObject = isHostType(window, 'performance') && performance;

  /** Used to call the browser's high resolution timer */
  var perfName = perfObject && (
    perfObject.now && 'now' ||
    perfObject.webkitNow && 'webkitNow'
  );

  /** Used to access Node's high resolution timer */
  var processObject = isHostType(window, 'process') && process;

  /** Used to check if an own property is enumerable */
  var propertyIsEnumerable = {}.propertyIsEnumerable;

  /** Used to set property descriptors */
  var setDescriptor = Object.defineProperty;

  /** Used to resolve a value's internal [[Class]] */
  var toString = {}.toString;

  /** Used to prevent a `removeChild` memory leak in IE < 9 */
  var trash = doc && doc.createElement('div');

  /** Used to integrity check compiled tests */
  var uid = 'uid' + (+new Date);

  /** Used to avoid infinite recursion when methods call each other */
  var calledBy = {};

  /** Used to avoid hz of Infinity */
  var divisors = {
    '1': 4096,
    '2': 512,
    '3': 64,
    '4': 8,
    '5': 0
  };

  /**
   * T-Distribution two-tailed critical values for 95% confidence
   * http://www.itl.nist.gov/div898/handbook/eda/section3/eda3672.htm
   */
  var tTable = {
    '1':  12.706,'2':  4.303, '3':  3.182, '4':  2.776, '5':  2.571, '6':  2.447,
    '7':  2.365, '8':  2.306, '9':  2.262, '10': 2.228, '11': 2.201, '12': 2.179,
    '13': 2.16,  '14': 2.145, '15': 2.131, '16': 2.12,  '17': 2.11,  '18': 2.101,
    '19': 2.093, '20': 2.086, '21': 2.08,  '22': 2.074, '23': 2.069, '24': 2.064,
    '25': 2.06,  '26': 2.056, '27': 2.052, '28': 2.048, '29': 2.045, '30': 2.042,
    'infinity': 1.96
  };

  /**
   * Critical Mann-Whitney U-values for 95% confidence
   * http://www.saburchill.com/IBbiology/stats/003.html
   */
  var uTable = {
    '5':  [0, 1, 2],
    '6':  [1, 2, 3, 5],
    '7':  [1, 3, 5, 6, 8],
    '8':  [2, 4, 6, 8, 10, 13],
    '9':  [2, 4, 7, 10, 12, 15, 17],
    '10': [3, 5, 8, 11, 14, 17, 20, 23],
    '11': [3, 6, 9, 13, 16, 19, 23, 26, 30],
    '12': [4, 7, 11, 14, 18, 22, 26, 29, 33, 37],
    '13': [4, 8, 12, 16, 20, 24, 28, 33, 37, 41, 45],
    '14': [5, 9, 13, 17, 22, 26, 31, 36, 40, 45, 50, 55],
    '15': [5, 10, 14, 19, 24, 29, 34, 39, 44, 49, 54, 59, 64],
    '16': [6, 11, 15, 21, 26, 31, 37, 42, 47, 53, 59, 64, 70, 75],
    '17': [6, 11, 17, 22, 28, 34, 39, 45, 51, 57, 63, 67, 75, 81, 87],
    '18': [7, 12, 18, 24, 30, 36, 42, 48, 55, 61, 67, 74, 80, 86, 93, 99],
    '19': [7, 13, 19, 25, 32, 38, 45, 52, 58, 65, 72, 78, 85, 92, 99, 106, 113],
    '20': [8, 14, 20, 27, 34, 41, 48, 55, 62, 69, 76, 83, 90, 98, 105, 112, 119, 127],
    '21': [8, 15, 22, 29, 36, 43, 50, 58, 65, 73, 80, 88, 96, 103, 111, 119, 126, 134, 142],
    '22': [9, 16, 23, 30, 38, 45, 53, 61, 69, 77, 85, 93, 101, 109, 117, 125, 133, 141, 150, 158],
    '23': [9, 17, 24, 32, 40, 48, 56, 64, 73, 81, 89, 98, 106, 115, 123, 132, 140, 149, 157, 166, 175],
    '24': [10, 17, 25, 33, 42, 50, 59, 67, 76, 85, 94, 102, 111, 120, 129, 138, 147, 156, 165, 174, 183, 192],
    '25': [10, 18, 27, 35, 44, 53, 62, 71, 80, 89, 98, 107, 117, 126, 135, 145, 154, 163, 173, 182, 192, 201, 211],
    '26': [11, 19, 28, 37, 46, 55, 64, 74, 83, 93, 102, 112, 122, 132, 141, 151, 161, 171, 181, 191, 200, 210, 220, 230],
    '27': [11, 20, 29, 38, 48, 57, 67, 77, 87, 97, 107, 118, 125, 138, 147, 158, 168, 178, 188, 199, 209, 219, 230, 240, 250],
    '28': [12, 21, 30, 40, 50, 60, 70, 80, 90, 101, 111, 122, 132, 143, 154, 164, 175, 186, 196, 207, 218, 228, 239, 250, 261, 272],
    '29': [13, 22, 32, 42, 52, 62, 73, 83, 94, 105, 116, 127, 138, 149, 160, 171, 182, 193, 204, 215, 226, 238, 249, 260, 271, 282, 294],
    '30': [13, 23, 33, 43, 54, 65, 76, 87, 98, 109, 120, 131, 143, 154, 166, 177, 189, 200, 212, 223, 235, 247, 258, 270, 282, 293, 305, 317]
  };

  /**
   * An object used to flag environments/features.
   *
   * @static
   * @memberOf Benchmark
   * @type Object
   */
  var support = {};

  (function() {

    /**
     * Detect Adobe AIR.
     *
     * @memberOf Benchmark.support
     * @type Boolean
     */
    support.air = isClassOf(window.runtime, 'ScriptBridgingProxyObject');

    /**
     * Detect if `arguments` objects have the correct internal [[Class]] value.
     *
     * @memberOf Benchmark.support
     * @type Boolean
     */
    support.argumentsClass = isClassOf(arguments, 'Arguments');

    /**
     * Detect if in a browser environment.
     *
     * @memberOf Benchmark.support
     * @type Boolean
     */
    support.browser = doc && isHostType(window, 'navigator');

    /**
     * Detect if strings support accessing characters by index.
     *
     * @memberOf Benchmark.support
     * @type Boolean
     */
    support.charByIndex =
      // IE 8 supports indexes on string literals but not string objects
      ('x'[0] + Object('x')[0]) == 'xx';

    /**
     * Detect if strings have indexes as own properties.
     *
     * @memberOf Benchmark.support
     * @type Boolean
     */
    support.charByOwnIndex =
      // Narwhal, Rhino, RingoJS, IE 8, and Opera < 10.52 support indexes on
      // strings but don't detect them as own properties
      support.charByIndex && hasKey('x', '0');

    /**
     * Detect if Java is enabled/exposed.
     *
     * @memberOf Benchmark.support
     * @type Boolean
     */
    support.java = isClassOf(window.java, 'JavaPackage');

    /**
     * Detect if the Timers API exists.
     *
     * @memberOf Benchmark.support
     * @type Boolean
     */
    support.timeout = isHostType(window, 'setTimeout') && isHostType(window, 'clearTimeout');

    /**
     * Detect if functions support decompilation.
     *
     * @name decompilation
     * @memberOf Benchmark.support
     * @type Boolean
     */
    try {
      // Safari 2.x removes commas in object literals
      // from Function#toString results
      // http://webk.it/11609
      // Firefox 3.6 and Opera 9.25 strip grouping
      // parentheses from Function#toString results
      // http://bugzil.la/559438
      support.decompilation = Function(
        'return (' + (function(x) { return { 'x': '' + (1 + x) + '', 'y': 0 }; }) + ')'
      )()(0).x === '1';
    } catch(e) {
      support.decompilation = false;
    }

    /**
     * Detect ES5+ property descriptor API.
     *
     * @name descriptors
     * @memberOf Benchmark.support
     * @type Boolean
     */
    try {
      var o = {};
      support.descriptors = (setDescriptor(o, o, o), 'value' in getDescriptor(o, o));
    } catch(e) {
      support.descriptors = false;
    }

    /**
     * Detect ES5+ Object.getOwnPropertyNames().
     *
     * @name getAllKeys
     * @memberOf Benchmark.support
     * @type Boolean
     */
    try {
      support.getAllKeys = /\bvalueOf\b/.test(getAllKeys(Object.prototype));
    } catch(e) {
      support.getAllKeys = false;
    }

    /**
     * Detect if own properties are iterated before inherited properties (all but IE < 9).
     *
     * @name iteratesOwnLast
     * @memberOf Benchmark.support
     * @type Boolean
     */
    support.iteratesOwnFirst = (function() {
      var props = [];
      function ctor() { this.x = 1; }
      ctor.prototype = { 'y': 1 };
      for (var prop in new ctor) { props.push(prop); }
      return props[0] == 'x';
    }());

    /**
     * Detect if a node's [[Class]] is resolvable (all but IE < 9)
     * and that the JS engine errors when attempting to coerce an object to a
     * string without a `toString` property value of `typeof` "function".
     *
     * @name nodeClass
     * @memberOf Benchmark.support
     * @type Boolean
     */
    try {
      support.nodeClass = ({ 'toString': 0 } + '', toString.call(doc || 0) != '[object Object]');
    } catch(e) {
      support.nodeClass = true;
    }
  }());

  /**
   * Timer object used by `clock()` and `Deferred#resolve`.
   *
   * @private
   * @type Object
   */
  var timer = {

   /**
    * The timer namespace object or constructor.
    *
    * @private
    * @memberOf timer
    * @type Function|Object
    */
    'ns': Date,

   /**
    * Starts the deferred timer.
    *
    * @private
    * @memberOf timer
    * @param {Object} deferred The deferred instance.
    */
    'start': null, // lazy defined in `clock()`

   /**
    * Stops the deferred timer.
    *
    * @private
    * @memberOf timer
    * @param {Object} deferred The deferred instance.
    */
    'stop': null // lazy defined in `clock()`
  };

  /** Shortcut for inverse results */
  var noArgumentsClass = !support.argumentsClass,
      noCharByIndex = !support.charByIndex,
      noCharByOwnIndex = !support.charByOwnIndex;

  /** Math shortcuts */
  var abs   = Math.abs,
      floor = Math.floor,
      max   = Math.max,
      min   = Math.min,
      pow   = Math.pow,
      sqrt  = Math.sqrt;

  /*--------------------------------------------------------------------------*/

  /**
   * The Benchmark constructor.
   *
   * @constructor
   * @param {String} name A name to identify the benchmark.
   * @param {Function|String} fn The test to benchmark.
   * @param {Object} [options={}] Options object.
   * @example
   *
   * // basic usage (the `new` operator is optional)
   * var bench = new Benchmark(fn);
   *
   * // or using a name first
   * var bench = new Benchmark('foo', fn);
   *
   * // or with options
   * var bench = new Benchmark('foo', fn, {
   *
   *   // displayed by Benchmark#toString if `name` is not available
   *   'id': 'xyz',
   *
   *   // called when the benchmark starts running
   *   'onStart': onStart,
   *
   *   // called after each run cycle
   *   'onCycle': onCycle,
   *
   *   // called when aborted
   *   'onAbort': onAbort,
   *
   *   // called when a test errors
   *   'onError': onError,
   *
   *   // called when reset
   *   'onReset': onReset,
   *
   *   // called when the benchmark completes running
   *   'onComplete': onComplete,
   *
   *   // compiled/called before the test loop
   *   'setup': setup,
   *
   *   // compiled/called after the test loop
   *   'teardown': teardown
   * });
   *
   * // or name and options
   * var bench = new Benchmark('foo', {
   *
   *   // a flag to indicate the benchmark is deferred
   *   'defer': true,
   *
   *   // benchmark test function
   *   'fn': function(deferred) {
   *     // call resolve() when the deferred test is finished
   *     deferred.resolve();
   *   }
   * });
   *
   * // or options only
   * var bench = new Benchmark({
   *
   *   // benchmark name
   *   'name': 'foo',
   *
   *   // benchmark test as a string
   *   'fn': '[1,2,3,4].sort()'
   * });
   *
   * // a test's `this` binding is set to the benchmark instance
   * var bench = new Benchmark('foo', function() {
   *   'My name is '.concat(this.name); // My name is foo
   * });
   */
  function Benchmark(name, fn, options) {
    var me = this;

    // allow instance creation without the `new` operator
    if (me == null || me.constructor != Benchmark) {
      return new Benchmark(name, fn, options);
    }
    // juggle arguments
    if (isClassOf(name, 'Object')) {
      // 1 argument (options)
      options = name;
    }
    else if (isClassOf(name, 'Function')) {
      // 2 arguments (fn, options)
      options = fn;
      fn = name;
    }
    else if (isClassOf(fn, 'Object')) {
      // 2 arguments (name, options)
      options = fn;
      fn = null;
      me.name = name;
    }
    else {
      // 3 arguments (name, fn [, options])
      me.name = name;
    }
    setOptions(me, options);
    me.id || (me.id = ++counter);
    me.fn == null && (me.fn = fn);
    me.stats = deepClone(me.stats);
    me.times = deepClone(me.times);
  }

  /**
   * The Deferred constructor.
   *
   * @constructor
   * @memberOf Benchmark
   * @param {Object} clone The cloned benchmark instance.
   */
  function Deferred(clone) {
    var me = this;
    if (me == null || me.constructor != Deferred) {
      return new Deferred(clone);
    }
    me.benchmark = clone;
    clock(me);
  }

  /**
   * The Event constructor.
   *
   * @constructor
   * @memberOf Benchmark
   * @param {String|Object} type The event type.
   */
  function Event(type) {
    var me = this;
    return (me == null || me.constructor != Event)
      ? new Event(type)
      : (type instanceof Event)
          ? type
          : extend(me, { 'timeStamp': +new Date }, typeof type == 'string' ? { 'type': type } : type);
  }

  /**
   * The Suite constructor.
   *
   * @constructor
   * @memberOf Benchmark
   * @param {String} name A name to identify the suite.
   * @param {Object} [options={}] Options object.
   * @example
   *
   * // basic usage (the `new` operator is optional)
   * var suite = new Benchmark.Suite;
   *
   * // or using a name first
   * var suite = new Benchmark.Suite('foo');
   *
   * // or with options
   * var suite = new Benchmark.Suite('foo', {
   *
   *   // called when the suite starts running
   *   'onStart': onStart,
   *
   *   // called between running benchmarks
   *   'onCycle': onCycle,
   *
   *   // called when aborted
   *   'onAbort': onAbort,
   *
   *   // called when a test errors
   *   'onError': onError,
   *
   *   // called when reset
   *   'onReset': onReset,
   *
   *   // called when the suite completes running
   *   'onComplete': onComplete
   * });
   */
  function Suite(name, options) {
    var me = this;

    // allow instance creation without the `new` operator
    if (me == null || me.constructor != Suite) {
      return new Suite(name, options);
    }
    // juggle arguments
    if (isClassOf(name, 'Object')) {
      // 1 argument (options)
      options = name;
    } else {
      // 2 arguments (name [, options])
      me.name = name;
    }
    setOptions(me, options);
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Note: Some array methods have been implemented in plain JavaScript to avoid
   * bugs in IE, Opera, Rhino, and Mobile Safari.
   *
   * IE compatibility mode and IE < 9 have buggy Array `shift()` and `splice()`
   * functions that fail to remove the last element, `object[0]`, of
   * array-like-objects even though the `length` property is set to `0`.
   * The `shift()` method is buggy in IE 8 compatibility mode, while `splice()`
   * is buggy regardless of mode in IE < 9 and buggy in compatibility mode in IE 9.
   *
   * In Opera < 9.50 and some older/beta Mobile Safari versions using `unshift()`
   * generically to augment the `arguments` object will pave the value at index 0
   * without incrimenting the other values's indexes.
   * https://github.com/documentcloud/underscore/issues/9
   *
   * Rhino and environments it powers, like Narwhal and RingoJS, may have
   * buggy Array `concat()`, `reverse()`, `shift()`, `slice()`, `splice()` and
   * `unshift()` functions that make sparse arrays non-sparse by assigning the
   * undefined indexes a value of undefined.
   * https://github.com/mozilla/rhino/commit/702abfed3f8ca043b2636efd31c14ba7552603dd
   */

  /**
   * Creates an array containing the elements of the host array followed by the
   * elements of each argument in order.
   *
   * @memberOf Benchmark.Suite
   * @returns {Array} The new array.
   */
  function concat() {
    var value,
        j = -1,
        length = arguments.length,
        result = slice.call(this),
        index = result.length;

    while (++j < length) {
      value = arguments[j];
      if (isClassOf(value, 'Array')) {
        for (var k = 0, l = value.length; k < l; k++, index++) {
          if (k in value) {
            result[index] = value[k];
          }
        }
      } else {
        result[index++] = value;
      }
    }
    return result;
  }

  /**
   * Utility function used by `shift()`, `splice()`, and `unshift()`.
   *
   * @private
   * @param {Number} start The index to start inserting elements.
   * @param {Number} deleteCount The number of elements to delete from the insert point.
   * @param {Array} elements The elements to insert.
   * @returns {Array} An array of deleted elements.
   */
  function insert(start, deleteCount, elements) {
    // `result` should have its length set to the `deleteCount`
    // see https://bugs.ecmascript.org/show_bug.cgi?id=332
    var deleteEnd = start + deleteCount,
        elementCount = elements ? elements.length : 0,
        index = start - 1,
        length = start + elementCount,
        object = this,
        result = Array(deleteCount),
        tail = slice.call(object, deleteEnd);

    // delete elements from the array
    while (++index < deleteEnd) {
      if (index in object) {
        result[index - start] = object[index];
        delete object[index];
      }
    }
    // insert elements
    index = start - 1;
    while (++index < length) {
      object[index] = elements[index - start];
    }
    // append tail elements
    start = index--;
    length = max(0, (object.length >>> 0) - deleteCount + elementCount);
    while (++index < length) {
      if ((index - start) in tail) {
        object[index] = tail[index - start];
      } else if (index in object) {
        delete object[index];
      }
    }
    // delete excess elements
    deleteCount = deleteCount > elementCount ? deleteCount - elementCount : 0;
    while (deleteCount--) {
      index = length + deleteCount;
      if (index in object) {
        delete object[index];
      }
    }
    object.length = length;
    return result;
  }

  /**
   * Rearrange the host array's elements in reverse order.
   *
   * @memberOf Benchmark.Suite
   * @returns {Array} The reversed array.
   */
  function reverse() {
    var upperIndex,
        value,
        index = -1,
        object = Object(this),
        length = object.length >>> 0,
        middle = floor(length / 2);

    if (length > 1) {
      while (++index < middle) {
        upperIndex = length - index - 1;
        value = upperIndex in object ? object[upperIndex] : uid;
        if (index in object) {
          object[upperIndex] = object[index];
        } else {
          delete object[upperIndex];
        }
        if (value != uid) {
          object[index] = value;
        } else {
          delete object[index];
        }
      }
    }
    return object;
  }

  /**
   * Removes the first element of the host array and returns it.
   *
   * @memberOf Benchmark.Suite
   * @returns {Mixed} The first element of the array.
   */
  function shift() {
    return insert.call(this, 0, 1)[0];
  }

  /**
   * Creates an array of the host array's elements from the start index up to,
   * but not including, the end index.
   *
   * @memberOf Benchmark.Suite
   * @param {Number} start The starting index.
   * @param {Number} end The end index.
   * @returns {Array} The new array.
   */
  function slice(start, end) {
    var index = -1,
        object = Object(this),
        length = object.length >>> 0,
        result = [];

    start = toInteger(start);
    start = start < 0 ? max(length + start, 0) : min(start, length);
    start--;
    end = end == null ? length : toInteger(end);
    end = end < 0 ? max(length + end, 0) : min(end, length);

    while ((++index, ++start) < end) {
      if (start in object) {
        result[index] = object[start];
      }
    }
    return result;
  }

  /**
   * Allows removing a range of elements and/or inserting elements into the
   * host array.
   *
   * @memberOf Benchmark.Suite
   * @param {Number} start The start index.
   * @param {Number} deleteCount The number of elements to delete.
   * @param {Mixed} [val1, val2, ...] values to insert at the `start` index.
   * @returns {Array} An array of removed elements.
   */
  function splice(start, deleteCount) {
    var object = Object(this),
        length = object.length >>> 0;

    start = toInteger(start);
    start = start < 0 ? max(length + start, 0) : min(start, length);

    // support the de-facto SpiderMonkey extension
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/splice#Parameters
    // https://bugs.ecmascript.org/show_bug.cgi?id=429
    deleteCount = arguments.length == 1
      ? length - start
      : min(max(toInteger(deleteCount), 0), length - start);

    return insert.call(object, start, deleteCount, slice.call(arguments, 2));
  }

  /**
   * Converts the specified `value` to an integer.
   *
   * @private
   * @param {Mixed} value The value to convert.
   * @returns {Number} The resulting integer.
   */
  function toInteger(value) {
    value = +value;
    return value === 0 || !isFinite(value) ? value || 0 : value - (value % 1);
  }

  /**
   * Appends arguments to the host array.
   *
   * @memberOf Benchmark.Suite
   * @returns {Number} The new length.
   */
  function unshift() {
    var object = Object(this);
    insert.call(object, 0, 0, arguments);
    return object.length;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * A generic `Function#bind` like method.
   *
   * @private
   * @param {Function} fn The function to be bound to `thisArg`.
   * @param {Mixed} thisArg The `this` binding for the given function.
   * @returns {Function} The bound function.
   */
  function bind(fn, thisArg) {
    return function() { fn.apply(thisArg, arguments); };
  }

  /**
   * Creates a function from the given arguments string and body.
   *
   * @private
   * @param {String} args The comma separated function arguments.
   * @param {String} body The function body.
   * @returns {Function} The new function.
   */
  function createFunction() {
    // lazy define
    createFunction = function(args, body) {
      var result,
          anchor = freeDefine ? define.amd : Benchmark,
          prop = uid + 'createFunction';

      runScript((freeDefine ? 'define.amd.' : 'Benchmark.') + prop + '=function(' + args + '){' + body + '}');
      result = anchor[prop];
      delete anchor[prop];
      return result;
    };
    // fix JaegerMonkey bug
    // http://bugzil.la/639720
    createFunction = support.browser && (createFunction('', 'return"' + uid + '"') || noop)() == uid ? createFunction : Function;
    return createFunction.apply(null, arguments);
  }

  /**
   * Delay the execution of a function based on the benchmark's `delay` property.
   *
   * @private
   * @param {Object} bench The benchmark instance.
   * @param {Object} fn The function to execute.
   */
  function delay(bench, fn) {
    bench._timerId = setTimeout(fn, bench.delay * 1e3);
  }

  /**
   * Destroys the given element.
   *
   * @private
   * @param {Element} element The element to destroy.
   */
  function destroyElement(element) {
    trash.appendChild(element);
    trash.innerHTML = '';
  }

  /**
   * Iterates over an object's properties, executing the `callback` for each.
   * Callbacks may terminate the loop by explicitly returning `false`.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} callback The function executed per own property.
   * @param {Object} options The options object.
   * @returns {Object} Returns the object iterated over.
   */
  function forProps() {
    var forShadowed,
        skipSeen,
        forArgs = true,
        shadowed = ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];

    (function(enumFlag, key) {
      // must use a non-native constructor to catch the Safari 2 issue
      function Klass() { this.valueOf = 0; };
      Klass.prototype.valueOf = 0;
      // check various for-in bugs
      for (key in new Klass) {
        enumFlag += key == 'valueOf' ? 1 : 0;
      }
      // check if `arguments` objects have non-enumerable indexes
      for (key in arguments) {
        key == '0' && (forArgs = false);
      }
      // Safari 2 iterates over shadowed properties twice
      // http://replay.waybackmachine.org/20090428222941/http://tobielangel.com/2007/1/29/for-in-loop-broken-in-safari/
      skipSeen = enumFlag == 2;
      // IE < 9 incorrectly makes an object's properties non-enumerable if they have
      // the same name as other non-enumerable properties in its prototype chain.
      forShadowed = !enumFlag;
    }(0));

    // lazy define
    forProps = function(object, callback, options) {
      options || (options = {});

      var result = object;
      object = Object(object);

      var ctor,
          key,
          keys,
          skipCtor,
          done = !result,
          which = options.which,
          allFlag = which == 'all',
          index = -1,
          iteratee = object,
          length = object.length,
          ownFlag = allFlag || which == 'own',
          seen = {},
          skipProto = isClassOf(object, 'Function'),
          thisArg = options.bind;

      if (thisArg !== undefined) {
        callback = bind(callback, thisArg);
      }
      // iterate all properties
      if (allFlag && support.getAllKeys) {
        for (index = 0, keys = getAllKeys(object), length = keys.length; index < length; index++) {
          key = keys[index];
          if (callback(object[key], key, object) === false) {
            break;
          }
        }
      }
      // else iterate only enumerable properties
      else {
        for (key in object) {
          // Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1
          // (if the prototype or a property on the prototype has been set)
          // incorrectly set a function's `prototype` property [[Enumerable]] value
          // to `true`. Because of this we standardize on skipping the `prototype`
          // property of functions regardless of their [[Enumerable]] value.
          if ((done =
              !(skipProto && key == 'prototype') &&
              !(skipSeen && (hasKey(seen, key) || !(seen[key] = true))) &&
              (!ownFlag || ownFlag && hasKey(object, key)) &&
              callback(object[key], key, object) === false)) {
            break;
          }
        }
        // in IE < 9 strings don't support accessing characters by index
        if (!done && (forArgs && isArguments(object) ||
            ((noCharByIndex || noCharByOwnIndex) && isClassOf(object, 'String') &&
              (iteratee = noCharByIndex ? object.split('') : object)))) {
          while (++index < length) {
            if ((done =
                callback(iteratee[index], String(index), object) === false)) {
              break;
            }
          }
        }
        if (!done && forShadowed) {
          // Because IE < 9 can't set the `[[Enumerable]]` attribute of an existing
          // property and the `constructor` property of a prototype defaults to
          // non-enumerable, we manually skip the `constructor` property when we
          // think we are iterating over a `prototype` object.
          ctor = object.constructor;
          skipCtor = ctor && ctor.prototype && ctor.prototype.constructor === ctor;
          for (index = 0; index < 7; index++) {
            key = shadowed[index];
            if (!(skipCtor && key == 'constructor') &&
                hasKey(object, key) &&
                callback(object[key], key, object) === false) {
              break;
            }
          }
        }
      }
      return result;
    };
    return forProps.apply(null, arguments);
  }

  /**
   * Gets the name of the first argument from a function's source.
   *
   * @private
   * @param {Function} fn The function.
   * @returns {String} The argument name.
   */
  function getFirstArgument(fn) {
    return (!hasKey(fn, 'toString') &&
      (/^[\s(]*function[^(]*\(([^\s,)]+)/.exec(fn) || 0)[1]) || '';
  }

  /**
   * Computes the arithmetic mean of a sample.
   *
   * @private
   * @param {Array} sample The sample.
   * @returns {Number} The mean.
   */
  function getMean(sample) {
    return reduce(sample, function(sum, x) {
      return sum + x;
    }) / sample.length || 0;
  }

  /**
   * Gets the source code of a function.
   *
   * @private
   * @param {Function} fn The function.
   * @param {String} altSource A string used when a function's source code is unretrievable.
   * @returns {String} The function's source code.
   */
  function getSource(fn, altSource) {
    var result = altSource;
    if (isStringable(fn)) {
      result = String(fn);
    } else if (support.decompilation) {
      // escape the `{` for Firefox 1
      result = (/^[^{]+\{([\s\S]*)}\s*$/.exec(fn) || 0)[1];
    }
    // trim string
    result = (result || '').replace(/^\s+|\s+$/g, '');

    // detect strings containing only the "use strict" directive
    return /^(?:\/\*+[\w|\W]*?\*\/|\/\/.*?[\n\r\u2028\u2029]|\s)*(["'])use strict\1;?$/.test(result)
      ? ''
      : result;
  }

  /**
   * Checks if a value is an `arguments` object.
   *
   * @private
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the value is an `arguments` object, else `false`.
   */
  function isArguments() {
    // lazy define
    isArguments = function(value) {
      return toString.call(value) == '[object Arguments]';
    };
    if (noArgumentsClass) {
      isArguments = function(value) {
        return hasKey(value, 'callee') &&
          !(propertyIsEnumerable && propertyIsEnumerable.call(value, 'callee'));
      };
    }
    return isArguments(arguments[0]);
  }

  /**
   * Checks if an object is of the specified class.
   *
   * @private
   * @param {Mixed} value The value to check.
   * @param {String} name The name of the class.
   * @returns {Boolean} Returns `true` if the value is of the specified class, else `false`.
   */
  function isClassOf(value, name) {
    return value != null && toString.call(value) == '[object ' + name + ']';
  }

  /**
   * Host objects can return type values that are different from their actual
   * data type. The objects we are concerned with usually return non-primitive
   * types of object, function, or unknown.
   *
   * @private
   * @param {Mixed} object The owner of the property.
   * @param {String} property The property to check.
   * @returns {Boolean} Returns `true` if the property value is a non-primitive, else `false`.
   */
  function isHostType(object, property) {
    var type = object != null ? typeof object[property] : 'number';
    return !/^(?:boolean|number|string|undefined)$/.test(type) &&
      (type == 'object' ? !!object[property] : true);
  }

  /**
   * Checks if a given `value` is an object created by the `Object` constructor
   * assuming objects created by the `Object` constructor have no inherited
   * enumerable properties and that there are no `Object.prototype` extensions.
   *
   * @private
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the `value` is a plain `Object` object, else `false`.
   */
  function isPlainObject(value) {
    // avoid non-objects and false positives for `arguments` objects in IE < 9
    var result = false;
    if (!(value && typeof value == 'object') || (noArgumentsClass && isArguments(value))) {
      return result;
    }
    // IE < 9 presents DOM nodes as `Object` objects except they have `toString`
    // methods that are `typeof` "string" and still can coerce nodes to strings.
    // Also check that the constructor is `Object` (i.e. `Object instanceof Object`)
    var ctor = value.constructor;
    if ((support.nodeClass || !(typeof value.toString != 'function' && typeof (value + '') == 'string')) &&
        (!isClassOf(ctor, 'Function') || ctor instanceof ctor)) {
      // In most environments an object's own properties are iterated before
      // its inherited properties. If the last iterated property is an object's
      // own property then there are no inherited enumerable properties.
      if (support.iteratesOwnFirst) {
        forProps(value, function(subValue, subKey) {
          result = subKey;
        });
        return result === false || hasKey(value, result);
      }
      // IE < 9 iterates inherited properties before own properties. If the first
      // iterated property is an object's own property then there are no inherited
      // enumerable properties.
      forProps(value, function(subValue, subKey) {
        result = !hasKey(value, subKey);
        return false;
      });
      return result === false;
    }
    return result;
  }

  /**
   * Checks if a value can be safely coerced to a string.
   *
   * @private
   * @param {Mixed} value The value to check.
   * @returns {Boolean} Returns `true` if the value can be coerced, else `false`.
   */
  function isStringable(value) {
    return hasKey(value, 'toString') || isClassOf(value, 'String');
  }

  /**
   * Wraps a function and passes `this` to the original function as the
   * first argument.
   *
   * @private
   * @param {Function} fn The function to be wrapped.
   * @returns {Function} The new function.
   */
  function methodize(fn) {
    return function() {
      var args = [this];
      args.push.apply(args, arguments);
      return fn.apply(null, args);
    };
  }

  /**
   * A no-operation function.
   *
   * @private
   */
  function noop() {
    // no operation performed
  }

  /**
   * A wrapper around require() to suppress `module missing` errors.
   *
   * @private
   * @param {String} id The module id.
   * @returns {Mixed} The exported module or `null`.
   */
  function req(id) {
    try {
      var result = freeExports && freeRequire(id);
    } catch(e) { }
    return result || null;
  }

  /**
   * Runs a snippet of JavaScript via script injection.
   *
   * @private
   * @param {String} code The code to run.
   */
  function runScript(code) {
    var anchor = freeDefine ? define.amd : Benchmark,
        script = doc.createElement('script'),
        sibling = doc.getElementsByTagName('script')[0],
        parent = sibling.parentNode,
        prop = uid + 'runScript',
        prefix = '(' + (freeDefine ? 'define.amd.' : 'Benchmark.') + prop + '||function(){})();';

    // Firefox 2.0.0.2 cannot use script injection as intended because it executes
    // asynchronously, but that's OK because script injection is only used to avoid
    // the previously commented JaegerMonkey bug.
    try {
      // remove the inserted script *before* running the code to avoid differences
      // in the expected script element count/order of the document.
      script.appendChild(doc.createTextNode(prefix + code));
      anchor[prop] = function() { destroyElement(script); };
    } catch(e) {
      parent = parent.cloneNode(false);
      sibling = null;
      script.text = code;
    }
    parent.insertBefore(script, sibling);
    delete anchor[prop];
  }

  /**
   * A helper function for setting options/event handlers.
   *
   * @private
   * @param {Object} bench The benchmark instance.
   * @param {Object} [options={}] Options object.
   */
  function setOptions(bench, options) {
    options = extend({}, bench.constructor.options, options);
    bench.options = forOwn(options, function(value, key) {
      if (value != null) {
        // add event listeners
        if (/^on[A-Z]/.test(key)) {
          forEach(key.split(' '), function(key) {
            bench.on(key.slice(2).toLowerCase(), value);
          });
        } else if (!hasKey(bench, key)) {
          bench[key] = deepClone(value);
        }
      }
    });
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Handles cycling/completing the deferred benchmark.
   *
   * @memberOf Benchmark.Deferred
   */
  function resolve() {
    var me = this,
        clone = me.benchmark,
        bench = clone._original;

    if (bench.aborted) {
      // cycle() -> clone cycle/complete event -> compute()'s invoked bench.run() cycle/complete
      me.teardown();
      clone.running = false;
      cycle(me);
    }
    else if (++me.cycles < clone.count) {
      // continue the test loop
      if (support.timeout) {
        // use setTimeout to avoid a call stack overflow if called recursively
        setTimeout(function() { clone.compiled.call(me, timer); }, 0);
      } else {
        clone.compiled.call(me, timer);
      }
    }
    else {
      timer.stop(me);
      me.teardown();
      delay(clone, function() { cycle(me); });
    }
  }

  /*--------------------------------------------------------------------------*/

  /**
   * A deep clone utility.
   *
   * @static
   * @memberOf Benchmark
   * @param {Mixed} value The value to clone.
   * @returns {Mixed} The cloned value.
   */
  function deepClone(value) {
    var accessor,
        circular,
        clone,
        ctor,
        descriptor,
        extensible,
        key,
        length,
        markerKey,
        parent,
        result,
        source,
        subIndex,
        data = { 'value': value },
        index = 0,
        marked = [],
        queue = { 'length': 0 },
        unmarked = [];

    /**
     * An easily detectable decorator for cloned values.
     */
    function Marker(object) {
      this.raw = object;
    }

    /**
     * The callback used by `forProps()`.
     */
    function forPropsCallback(subValue, subKey) {
      // exit early to avoid cloning the marker
      if (subValue && subValue.constructor == Marker) {
        return;
      }
      // add objects to the queue
      if (subValue === Object(subValue)) {
        queue[queue.length++] = { 'key': subKey, 'parent': clone, 'source': value };
      }
      // assign non-objects
      else {
        try {
          // will throw an error in strict mode if the property is read-only
          clone[subKey] = subValue;
        } catch(e) { }
      }
    }

    /**
     * Gets an available marker key for the given object.
     */
    function getMarkerKey(object) {
      // avoid collisions with existing keys
      var result = uid;
      while (object[result] && object[result].constructor != Marker) {
        result += 1;
      }
      return result;
    }

    do {
      key = data.key;
      parent = data.parent;
      source = data.source;
      clone = value = source ? source[key] : data.value;
      accessor = circular = descriptor = false;

      // create a basic clone to filter out functions, DOM elements, and
      // other non `Object` objects
      if (value === Object(value)) {
        // use custom deep clone function if available
        if (isClassOf(value.deepClone, 'Function')) {
          clone = value.deepClone();
        } else {
          ctor = value.constructor;
          switch (toString.call(value)) {
            case '[object Array]':
              clone = new ctor(value.length);
              break;

            case '[object Boolean]':
              clone = new ctor(value == true);
              break;

            case '[object Date]':
              clone = new ctor(+value);
              break;

            case '[object Object]':
              isPlainObject(value) && (clone = {});
              break;

            case '[object Number]':
            case '[object String]':
              clone = new ctor(value);
              break;

            case '[object RegExp]':
              clone = ctor(value.source,
                (value.global     ? 'g' : '') +
                (value.ignoreCase ? 'i' : '') +
                (value.multiline  ? 'm' : ''));
          }
        }
        // continue clone if `value` doesn't have an accessor descriptor
        // http://es5.github.com/#x8.10.1
        if (clone && clone != value &&
            !(descriptor = source && support.descriptors && getDescriptor(source, key),
              accessor = descriptor && (descriptor.get || descriptor.set))) {
          // use an existing clone (circular reference)
          if ((extensible = isExtensible(value))) {
            markerKey = getMarkerKey(value);
            if (value[markerKey]) {
              circular = clone = value[markerKey].raw;
            }
          } else {
            // for frozen/sealed objects
            for (subIndex = 0, length = unmarked.length; subIndex < length; subIndex++) {
              data = unmarked[subIndex];
              if (data.object === value) {
                circular = clone = data.clone;
                break;
              }
            }
          }
          if (!circular) {
            // mark object to allow quickly detecting circular references and tie it to its clone
            if (extensible) {
              value[markerKey] = new Marker(clone);
              marked.push({ 'key': markerKey, 'object': value });
            } else {
              // for frozen/sealed objects
              unmarked.push({ 'clone': clone, 'object': value });
            }
            // iterate over object properties
            forProps(value, forPropsCallback, { 'which': 'all' });
          }
        }
      }
      if (parent) {
        // for custom property descriptors
        if (accessor || (descriptor && !(descriptor.configurable && descriptor.enumerable && descriptor.writable))) {
          if ('value' in descriptor) {
            descriptor.value = clone;
          }
          setDescriptor(parent, key, descriptor);
        }
        // for default property descriptors
        else {
          parent[key] = clone;
        }
      } else {
        result = clone;
      }
    } while ((data = queue[index++]));

    // remove markers
    for (index = 0, length = marked.length; index < length; index++) {
      data = marked[index];
      delete data.object[data.key];
    }
    return result;
  }

  /**
   * An iteration utility for arrays and objects.
   * Callbacks may terminate the loop by explicitly returning `false`.
   *
   * @static
   * @memberOf Benchmark
   * @param {Array|Object} object The object to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} thisArg The `this` binding for the callback.
   * @returns {Array|Object} Returns the object iterated over.
   */
  function each(object, callback, thisArg) {
    var result = object;
    object = Object(object);

    var fn = callback,
        index = -1,
        length = object.length,
        isSnapshot = !!(object.snapshotItem && (length = object.snapshotLength)),
        isSplittable = (noCharByIndex || noCharByOwnIndex) && isClassOf(object, 'String'),
        isConvertable = isSnapshot || isSplittable || 'item' in object,
        origObject = object;

    // in Opera < 10.5 `hasKey(object, 'length')` returns `false` for NodeLists
    if (length === length >>> 0) {
      if (isConvertable) {
        // the third argument of the callback is the original non-array object
        callback = function(value, index) {
          return fn.call(this, value, index, origObject);
        };
        // in IE < 9 strings don't support accessing characters by index
        if (isSplittable) {
          object = object.split('');
        } else {
          object = [];
          while (++index < length) {
            // in Safari 2 `index in object` is always `false` for NodeLists
            object[index] = isSnapshot ? result.snapshotItem(index) : result[index];
          }
        }
      }
      forEach(object, callback, thisArg);
    } else {
      forOwn(object, callback, thisArg);
    }
    return result;
  }

  /**
   * Copies enumerable properties from the source(s) object to the destination object.
   *
   * @static
   * @memberOf Benchmark
   * @param {Object} destination The destination object.
   * @param {Object} [source={}] The source object.
   * @returns {Object} The destination object.
   */
  function extend(destination, source) {
    // Chrome < 14 incorrectly sets `destination` to `undefined` when we `delete arguments[0]`
    // http://code.google.com/p/v8/issues/detail?id=839
    var result = destination;
    delete arguments[0];

    forEach(arguments, function(source) {
      forProps(source, function(value, key) {
        result[key] = value;
      });
    });
    return result;
  }

  /**
   * A generic `Array#filter` like method.
   *
   * @static
   * @memberOf Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function|String} callback The function/alias called per iteration.
   * @param {Mixed} thisArg The `this` binding for the callback.
   * @returns {Array} A new array of values that passed callback filter.
   * @example
   *
   * // get odd numbers
   * Benchmark.filter([1, 2, 3, 4, 5], function(n) {
   *   return n % 2;
   * }); // -> [1, 3, 5];
   *
   * // get fastest benchmarks
   * Benchmark.filter(benches, 'fastest');
   *
   * // get slowest benchmarks
   * Benchmark.filter(benches, 'slowest');
   *
   * // get benchmarks that completed without erroring
   * Benchmark.filter(benches, 'successful');
   */
  function filter(array, callback, thisArg) {
    var result;

    if (callback == 'successful') {
      // callback to exclude those that are errored, unrun, or have hz of Infinity
      callback = function(bench) { return bench.cycles && isFinite(bench.hz); };
    }
    else if (callback == 'fastest' || callback == 'slowest') {
      // get successful, sort by period + margin of error, and filter fastest/slowest
      result = filter(array, 'successful').sort(function(a, b) {
        a = a.stats; b = b.stats;
        return (a.mean + a.moe > b.mean + b.moe ? 1 : -1) * (callback == 'fastest' ? 1 : -1);
      });
      result = filter(result, function(bench) {
        return result[0].compare(bench) == 0;
      });
    }
    return result || reduce(array, function(result, value, index) {
      return callback.call(thisArg, value, index, array) ? (result.push(value), result) : result;
    }, []);
  }

  /**
   * A generic `Array#forEach` like method.
   * Callbacks may terminate the loop by explicitly returning `false`.
   *
   * @static
   * @memberOf Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} thisArg The `this` binding for the callback.
   * @returns {Array} Returns the array iterated over.
   */
  function forEach(array, callback, thisArg) {
    var index = -1,
        length = (array = Object(array)).length >>> 0;

    if (thisArg !== undefined) {
      callback = bind(callback, thisArg);
    }
    while (++index < length) {
      if (index in array &&
          callback(array[index], index, array) === false) {
        break;
      }
    }
    return array;
  }

  /**
   * Iterates over an object's own properties, executing the `callback` for each.
   * Callbacks may terminate the loop by explicitly returning `false`.
   *
   * @static
   * @memberOf Benchmark
   * @param {Object} object The object to iterate over.
   * @param {Function} callback The function executed per own property.
   * @param {Mixed} thisArg The `this` binding for the callback.
   * @returns {Object} Returns the object iterated over.
   */
  function forOwn(object, callback, thisArg) {
    return forProps(object, callback, { 'bind': thisArg, 'which': 'own' });
  }

  /**
   * Converts a number to a more readable comma-separated string representation.
   *
   * @static
   * @memberOf Benchmark
   * @param {Number} number The number to convert.
   * @returns {String} The more readable string representation.
   */
  function formatNumber(number) {
    number = String(number).split('.');
    return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ',') +
      (number[1] ? '.' + number[1] : '');
  }

  /**
   * Checks if an object has the specified key as a direct property.
   *
   * @static
   * @memberOf Benchmark
   * @param {Object} object The object to check.
   * @param {String} key The key to check for.
   * @returns {Boolean} Returns `true` if key is a direct property, else `false`.
   */
  function hasKey() {
    // lazy define for worst case fallback (not as accurate)
    hasKey = function(object, key) {
      var parent = object != null && (object.constructor || Object).prototype;
      return !!parent && key in Object(object) && !(key in parent && object[key] === parent[key]);
    };
    // for modern browsers
    if (isClassOf(hasOwnProperty, 'Function')) {
      hasKey = function(object, key) {
        return object != null && hasOwnProperty.call(object, key);
      };
    }
    // for Safari 2
    else if ({}.__proto__ == Object.prototype) {
      hasKey = function(object, key) {
        var result = false;
        if (object != null) {
          object = Object(object);
          object.__proto__ = [object.__proto__, object.__proto__ = null, result = key in object][0];
        }
        return result;
      };
    }
    return hasKey.apply(this, arguments);
  }

  /**
   * A generic `Array#indexOf` like method.
   *
   * @static
   * @memberOf Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Mixed} value The value to search for.
   * @param {Number} [fromIndex=0] The index to start searching from.
   * @returns {Number} The index of the matched value or `-1`.
   */
  function indexOf(array, value, fromIndex) {
    var index = toInteger(fromIndex),
        length = (array = Object(array)).length >>> 0;

    index = (index < 0 ? max(0, length + index) : index) - 1;
    while (++index < length) {
      if (index in array && value === array[index]) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Modify a string by replacing named tokens with matching object property values.
   *
   * @static
   * @memberOf Benchmark
   * @param {String} string The string to modify.
   * @param {Object} object The template object.
   * @returns {String} The modified string.
   */
  function interpolate(string, object) {
    forOwn(object, function(value, key) {
      // escape regexp special characters in `key`
      string = string.replace(RegExp('#\\{' + key.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1') + '\\}', 'g'), value);
    });
    return string;
  }

  /**
   * Invokes a method on all items in an array.
   *
   * @static
   * @memberOf Benchmark
   * @param {Array} benches Array of benchmarks to iterate over.
   * @param {String|Object} name The name of the method to invoke OR options object.
   * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the method with.
   * @returns {Array} A new array of values returned from each method invoked.
   * @example
   *
   * // invoke `reset` on all benchmarks
   * Benchmark.invoke(benches, 'reset');
   *
   * // invoke `emit` with arguments
   * Benchmark.invoke(benches, 'emit', 'complete', listener);
   *
   * // invoke `run(true)`, treat benchmarks as a queue, and register invoke callbacks
   * Benchmark.invoke(benches, {
   *
   *   // invoke the `run` method
   *   'name': 'run',
   *
   *   // pass a single argument
   *   'args': true,
   *
   *   // treat as queue, removing benchmarks from front of `benches` until empty
   *   'queued': true,
   *
   *   // called before any benchmarks have been invoked.
   *   'onStart': onStart,
   *
   *   // called between invoking benchmarks
   *   'onCycle': onCycle,
   *
   *   // called after all benchmarks have been invoked.
   *   'onComplete': onComplete
   * });
   */
  function invoke(benches, name) {
    var args,
        bench,
        queued,
        index = -1,
        eventProps = { 'currentTarget': benches },
        options = { 'onStart': noop, 'onCycle': noop, 'onComplete': noop },
        result = map(benches, function(bench) { return bench; });

    /**
     * Invokes the method of the current object and if synchronous, fetches the next.
     */
    function execute() {
      var listeners,
          async = isAsync(bench);

      if (async) {
        // use `getNext` as the first listener
        bench.on('complete', getNext);
        listeners = bench.events.complete;
        listeners.splice(0, 0, listeners.pop());
      }
      // execute method
      result[index] = isClassOf(bench && bench[name], 'Function') ? bench[name].apply(bench, args) : undefined;
      // if synchronous return true until finished
      return !async && getNext();
    }

    /**
     * Fetches the next bench or executes `onComplete` callback.
     */
    function getNext(event) {
      var cycleEvent,
          last = bench,
          async = isAsync(last);

      if (async) {
        last.off('complete', getNext);
        last.emit('complete');
      }
      // emit "cycle" event
      eventProps.type = 'cycle';
      eventProps.target = last;
      cycleEvent = Event(eventProps);
      options.onCycle.call(benches, cycleEvent);

      // choose next benchmark if not exiting early
      if (!cycleEvent.aborted && raiseIndex() !== false) {
        bench = queued ? benches[0] : result[index];
        if (isAsync(bench)) {
          delay(bench, execute);
        }
        else if (async) {
          // resume execution if previously asynchronous but now synchronous
          while (execute()) { }
        }
        else {
          // continue synchronous execution
          return true;
        }
      } else {
        // emit "complete" event
        eventProps.type = 'complete';
        options.onComplete.call(benches, Event(eventProps));
      }
      // When used as a listener `event.aborted = true` will cancel the rest of
      // the "complete" listeners because they were already called above and when
      // used as part of `getNext` the `return false` will exit the execution while-loop.
      if (event) {
        event.aborted = true;
      } else {
        return false;
      }
    }

    /**
     * Checks if invoking `Benchmark#run` with asynchronous cycles.
     */
    function isAsync(object) {
      // avoid using `instanceof` here because of IE memory leak issues with host objects
      var async = args[0] && args[0].async;
      return Object(object).constructor == Benchmark && name == 'run' &&
        ((async == null ? object.options.async : async) && support.timeout || object.defer);
    }

    /**
     * Raises `index` to the next defined index or returns `false`.
     */
    function raiseIndex() {
      var length = result.length;
      if (queued) {
        // if queued remove the previous bench and subsequent skipped non-entries
        do {
          ++index > 0 && shift.call(benches);
        } while ((length = benches.length) && !('0' in benches));
      }
      else {
        while (++index < length && !(index in result)) { }
      }
      // if we reached the last index then return `false`
      return (queued ? length : index < length) ? index : (index = false);
    }

    // juggle arguments
    if (isClassOf(name, 'String')) {
      // 2 arguments (array, name)
      args = slice.call(arguments, 2);
    } else {
      // 2 arguments (array, options)
      options = extend(options, name);
      name = options.name;
      args = isClassOf(args = 'args' in options ? options.args : [], 'Array') ? args : [args];
      queued = options.queued;
    }

    // start iterating over the array
    if (raiseIndex() !== false) {
      // emit "start" event
      bench = result[index];
      eventProps.type = 'start';
      eventProps.target = bench;
      options.onStart.call(benches, Event(eventProps));

      // end early if the suite was aborted in an "onStart" listener
      if (benches.aborted && benches.constructor == Suite && name == 'run') {
        // emit "cycle" event
        eventProps.type = 'cycle';
        options.onCycle.call(benches, Event(eventProps));
        // emit "complete" event
        eventProps.type = 'complete';
        options.onComplete.call(benches, Event(eventProps));
      }
      // else start
      else {
        if (isAsync(bench)) {
          delay(bench, execute);
        } else {
          while (execute()) { }
        }
      }
    }
    return result;
  }

  /**
   * Creates a string of joined array values or object key-value pairs.
   *
   * @static
   * @memberOf Benchmark
   * @param {Array|Object} object The object to operate on.
   * @param {String} [separator1=','] The separator used between key-value pairs.
   * @param {String} [separator2=': '] The separator used between keys and values.
   * @returns {String} The joined result.
   */
  function join(object, separator1, separator2) {
    var result = [],
        length = (object = Object(object)).length,
        arrayLike = length === length >>> 0;

    separator2 || (separator2 = ': ');
    each(object, function(value, key) {
      result.push(arrayLike ? value : key + separator2 + value);
    });
    return result.join(separator1 || ',');
  }

  /**
   * A generic `Array#map` like method.
   *
   * @static
   * @memberOf Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} thisArg The `this` binding for the callback.
   * @returns {Array} A new array of values returned by the callback.
   */
  function map(array, callback, thisArg) {
    return reduce(array, function(result, value, index) {
      result[index] = callback.call(thisArg, value, index, array);
      return result;
    }, Array(Object(array).length >>> 0));
  }

  /**
   * Retrieves the value of a specified property from all items in an array.
   *
   * @static
   * @memberOf Benchmark
   * @param {Array} array The array to iterate over.
   * @param {String} property The property to pluck.
   * @returns {Array} A new array of property values.
   */
  function pluck(array, property) {
    return map(array, function(object) {
      return object == null ? undefined : object[property];
    });
  }

  /**
   * A generic `Array#reduce` like method.
   *
   * @static
   * @memberOf Benchmark
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @param {Mixed} accumulator Initial value of the accumulator.
   * @returns {Mixed} The accumulator.
   */
  function reduce(array, callback, accumulator) {
    var noaccum = arguments.length < 3;
    forEach(array, function(value, index) {
      accumulator = noaccum ? (noaccum = false, value) : callback(accumulator, value, index, array);
    });
    return accumulator;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Aborts all benchmarks in the suite.
   *
   * @name abort
   * @memberOf Benchmark.Suite
   * @returns {Object} The suite instance.
   */
  function abortSuite() {
    var event,
        me = this,
        resetting = calledBy.resetSuite;

    if (me.running) {
      event = Event('abort');
      me.emit(event);
      if (!event.cancelled || resetting) {
        // avoid infinite recursion
        calledBy.abortSuite = true;
        me.reset();
        delete calledBy.abortSuite;

        if (!resetting) {
          me.aborted = true;
          invoke(me, 'abort');
        }
      }
    }
    return me;
  }

  /**
   * Adds a test to the benchmark suite.
   *
   * @memberOf Benchmark.Suite
   * @param {String} name A name to identify the benchmark.
   * @param {Function|String} fn The test to benchmark.
   * @param {Object} [options={}] Options object.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * suite.add(fn);
   *
   * // or using a name first
   * suite.add('foo', fn);
   *
   * // or with options
   * suite.add('foo', fn, {
   *   'onCycle': onCycle,
   *   'onComplete': onComplete
   * });
   *
   * // or name and options
   * suite.add('foo', {
   *   'fn': fn,
   *   'onCycle': onCycle,
   *   'onComplete': onComplete
   * });
   *
   * // or options only
   * suite.add({
   *   'name': 'foo',
   *   'fn': fn,
   *   'onCycle': onCycle,
   *   'onComplete': onComplete
   * });
   */
  function add(name, fn, options) {
    var me = this,
        bench = Benchmark(name, fn, options),
        event = Event({ 'type': 'add', 'target': bench });

    if (me.emit(event), !event.cancelled) {
      me.push(bench);
    }
    return me;
  }

  /**
   * Creates a new suite with cloned benchmarks.
   *
   * @name clone
   * @memberOf Benchmark.Suite
   * @param {Object} options Options object to overwrite cloned options.
   * @returns {Object} The new suite instance.
   */
  function cloneSuite(options) {
    var me = this,
        result = new me.constructor(extend({}, me.options, options));

    // copy own properties
    forOwn(me, function(value, key) {
      if (!hasKey(result, key)) {
        result[key] = value && isClassOf(value.clone, 'Function')
          ? value.clone()
          : deepClone(value);
      }
    });
    return result;
  }

  /**
   * An `Array#filter` like method.
   *
   * @name filter
   * @memberOf Benchmark.Suite
   * @param {Function|String} callback The function/alias called per iteration.
   * @returns {Object} A new suite of benchmarks that passed callback filter.
   */
  function filterSuite(callback) {
    var me = this,
        result = new me.constructor;

    result.push.apply(result, filter(me, callback));
    return result;
  }

  /**
   * Resets all benchmarks in the suite.
   *
   * @name reset
   * @memberOf Benchmark.Suite
   * @returns {Object} The suite instance.
   */
  function resetSuite() {
    var event,
        me = this,
        aborting = calledBy.abortSuite;

    if (me.running && !aborting) {
      // no worries, `resetSuite()` is called within `abortSuite()`
      calledBy.resetSuite = true;
      me.abort();
      delete calledBy.resetSuite;
    }
    // reset if the state has changed
    else if ((me.aborted || me.running) &&
        (me.emit(event = Event('reset')), !event.cancelled)) {
      me.running = false;
      if (!aborting) {
        invoke(me, 'reset');
      }
    }
    return me;
  }

  /**
   * Runs the suite.
   *
   * @name run
   * @memberOf Benchmark.Suite
   * @param {Object} [options={}] Options object.
   * @returns {Object} The suite instance.
   * @example
   *
   * // basic usage
   * suite.run();
   *
   * // or with options
   * suite.run({ 'async': true, 'queued': true });
   */
  function runSuite(options) {
    var me = this;

    me.reset();
    me.running = true;
    options || (options = {});

    invoke(me, {
      'name': 'run',
      'args': options,
      'queued': options.queued,
      'onStart': function(event) {
        me.emit(event);
      },
      'onCycle': function(event) {
        var bench = event.target;
        if (bench.error) {
          me.emit({ 'type': 'error', 'target': bench });
        }
        me.emit(event);
        event.aborted = me.aborted;
      },
      'onComplete': function(event) {
        me.running = false;
        me.emit(event);
      }
    });
    return me;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Executes all registered listeners of the specified event type.
   *
   * @memberOf Benchmark, Benchmark.Suite
   * @param {String|Object} type The event type or object.
   * @returns {Mixed} Returns the return value of the last listener executed.
   */
  function emit(type) {
    var listeners,
        me = this,
        event = Event(type),
        events = me.events,
        args = (arguments[0] = event, arguments);

    event.currentTarget || (event.currentTarget = me);
    event.target || (event.target = me);
    delete event.result;

    if (events && (listeners = hasKey(events, event.type) && events[event.type])) {
      forEach(listeners.slice(), function(listener) {
        if ((event.result = listener.apply(me, args)) === false) {
          event.cancelled = true;
        }
        return !event.aborted;
      });
    }
    return event.result;
  }

  /**
   * Returns an array of event listeners for a given type that can be manipulated
   * to add or remove listeners.
   *
   * @memberOf Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   * @returns {Array} The listeners array.
   */
  function listeners(type) {
    var me = this,
        events = me.events || (me.events = {});

    return hasKey(events, type) ? events[type] : (events[type] = []);
  }

  /**
   * Unregisters a listener for the specified event type(s),
   * or unregisters all listeners for the specified event type(s),
   * or unregisters all listeners for all event types.
   *
   * @memberOf Benchmark, Benchmark.Suite
   * @param {String} [type] The event type.
   * @param {Function} [listener] The function to unregister.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // unregister a listener for an event type
   * bench.off('cycle', listener);
   *
   * // unregister a listener for multiple event types
   * bench.off('start cycle', listener);
   *
   * // unregister all listeners for an event type
   * bench.off('cycle');
   *
   * // unregister all listeners for multiple event types
   * bench.off('start cycle complete');
   *
   * // unregister all listeners for all event types
   * bench.off();
   */
  function off(type, listener) {
    var me = this,
        events = me.events;

    events && each(type ? type.split(' ') : events, function(listeners, type) {
      var index;
      if (typeof listeners == 'string') {
        type = listeners;
        listeners = hasKey(events, type) && events[type];
      }
      if (listeners) {
        if (listener) {
          index = indexOf(listeners, listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        } else {
          listeners.length = 0;
        }
      }
    });
    return me;
  }

  /**
   * Registers a listener for the specified event type(s).
   *
   * @memberOf Benchmark, Benchmark.Suite
   * @param {String} type The event type.
   * @param {Function} listener The function to register.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // register a listener for an event type
   * bench.on('cycle', listener);
   *
   * // register a listener for multiple event types
   * bench.on('start cycle', listener);
   */
  function on(type, listener) {
    var me = this,
        events = me.events || (me.events = {});

    forEach(type.split(' '), function(type) {
      (hasKey(events, type)
        ? events[type]
        : (events[type] = [])
      ).push(listener);
    });
    return me;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Aborts the benchmark without recording times.
   *
   * @memberOf Benchmark
   * @returns {Object} The benchmark instance.
   */
  function abort() {
    var event,
        me = this,
        resetting = calledBy.reset;

    if (me.running) {
      event = Event('abort');
      me.emit(event);
      if (!event.cancelled || resetting) {
        // avoid infinite recursion
        calledBy.abort = true;
        me.reset();
        delete calledBy.abort;

        if (support.timeout) {
          clearTimeout(me._timerId);
          delete me._timerId;
        }
        if (!resetting) {
          me.aborted = true;
          me.running = false;
        }
      }
    }
    return me;
  }

  /**
   * Creates a new benchmark using the same test and options.
   *
   * @memberOf Benchmark
   * @param {Object} options Options object to overwrite cloned options.
   * @returns {Object} The new benchmark instance.
   * @example
   *
   * var bizarro = bench.clone({
   *   'name': 'doppelganger'
   * });
   */
  function clone(options) {
    var me = this,
        result = new me.constructor(extend({}, me, options));

    // correct the `options` object
    result.options = extend({}, me.options, options);

    // copy own custom properties
    forOwn(me, function(value, key) {
      if (!hasKey(result, key)) {
        result[key] = deepClone(value);
      }
    });
    return result;
  }

  /**
   * Determines if a benchmark is faster than another.
   *
   * @memberOf Benchmark
   * @param {Object} other The benchmark to compare.
   * @returns {Number} Returns `-1` if slower, `1` if faster, and `0` if indeterminate.
   */
  function compare(other) {
    var critical,
        zStat,
        me = this,
        sample1 = me.stats.sample,
        sample2 = other.stats.sample,
        size1 = sample1.length,
        size2 = sample2.length,
        maxSize = max(size1, size2),
        minSize = min(size1, size2),
        u1 = getU(sample1, sample2),
        u2 = getU(sample2, sample1),
        u = min(u1, u2);

    function getScore(xA, sampleB) {
      return reduce(sampleB, function(total, xB) {
        return total + (xB > xA ? 0 : xB < xA ? 1 : 0.5);
      }, 0);
    }

    function getU(sampleA, sampleB) {
      return reduce(sampleA, function(total, xA) {
        return total + getScore(xA, sampleB);
      }, 0);
    }

    function getZ(u) {
      return (u - ((size1 * size2) / 2)) / sqrt((size1 * size2 * (size1 + size2 + 1)) / 12);
    }

    // exit early if comparing the same benchmark
    if (me == other) {
      return 0;
    }
    // reject the null hyphothesis the two samples come from the
    // same population (i.e. have the same median) if...
    if (size1 + size2 > 30) {
      // ...the z-stat is greater than 1.96 or less than -1.96
      // http://www.statisticslectures.com/topics/mannwhitneyu/
      zStat = getZ(u);
      return abs(zStat) > 1.96 ? (zStat > 0 ? -1 : 1) : 0;
    }
    // ...the U value is less than or equal the critical U value
    // http://www.geoib.com/mann-whitney-u-test.html
    critical = maxSize < 5 || minSize < 3 ? 0 : uTable[maxSize][minSize - 3];
    return u <= critical ? (u == u1 ? 1 : -1) : 0;
  }

  /**
   * Reset properties and abort if running.
   *
   * @memberOf Benchmark
   * @returns {Object} The benchmark instance.
   */
  function reset() {
    var data,
        event,
        me = this,
        index = 0,
        changes = { 'length': 0 },
        queue = { 'length': 0 };

    if (me.running && !calledBy.abort) {
      // no worries, `reset()` is called within `abort()`
      calledBy.reset = true;
      me.abort();
      delete calledBy.reset;
    }
    else {
      // a non-recursive solution to check if properties have changed
      // http://www.jslab.dk/articles/non.recursive.preorder.traversal.part4
      data = { 'destination': me, 'source': extend({}, me.constructor.prototype, me.options) };
      do {
        forOwn(data.source, function(value, key) {
          var changed,
              destination = data.destination,
              currValue = destination[key];

          if (value && typeof value == 'object') {
            if (isClassOf(value, 'Array')) {
              // check if an array value has changed to a non-array value
              if (!isClassOf(currValue, 'Array')) {
                changed = currValue = [];
              }
              // or has changed its length
              if (currValue.length != value.length) {
                changed = currValue = currValue.slice(0, value.length);
                currValue.length = value.length;
              }
            }
            // check if an object has changed to a non-object value
            else if (!currValue || typeof currValue != 'object') {
              changed = currValue = {};
            }
            // register a changed object
            if (changed) {
              changes[changes.length++] = { 'destination': destination, 'key': key, 'value': currValue };
            }
            queue[queue.length++] = { 'destination': currValue, 'source': value };
          }
          // register a changed primitive
          else if (value !== currValue && !(value == null || isClassOf(value, 'Function'))) {
            changes[changes.length++] = { 'destination': destination, 'key': key, 'value': value };
          }
        });
      }
      while ((data = queue[index++]));

      // if changed emit the `reset` event and if it isn't cancelled reset the benchmark
      if (changes.length && (me.emit(event = Event('reset')), !event.cancelled)) {
        forEach(changes, function(data) {
          data.destination[data.key] = data.value;
        });
      }
    }
    return me;
  }

  /**
   * Displays relevant benchmark information when coerced to a string.
   *
   * @name toString
   * @memberOf Benchmark
   * @returns {String} A string representation of the benchmark instance.
   */
  function toStringBench() {
    var me = this,
        error = me.error,
        hz = me.hz,
        id = me.id,
        stats = me.stats,
        size = stats.sample.length,
        pm = support.java ? '+/-' : '\xb1',
        result = me.name || (isNaN(id) ? id : '<Test #' + id + '>');

    if (error) {
      result += ': ' + join(error);
    } else {
      result += ' x ' + formatNumber(hz.toFixed(hz < 100 ? 2 : 0)) + ' ops/sec ' + pm +
        stats.rme.toFixed(2) + '% (' + size + ' run' + (size == 1 ? '' : 's') + ' sampled)';
    }
    return result;
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Clocks the time taken to execute a test per cycle (secs).
   *
   * @private
   * @param {Object} bench The benchmark instance.
   * @returns {Number} The time taken.
   */
  function clock() {
    var applet,
        options = Benchmark.options,
        template = { 'begin': 's$=new n$', 'end': 'r$=(new n$-s$)/1e3', 'uid': uid },
        timers = [{ 'ns': timer.ns, 'res': max(0.0015, getRes('ms')), 'unit': 'ms' }];

    // lazy define for hi-res timers
    clock = function(clone) {
      var deferred;
      if (clone instanceof Deferred) {
        deferred = clone;
        clone = deferred.benchmark;
      }

      var bench = clone._original,
          fn = bench.fn,
          fnArg = deferred ? getFirstArgument(fn) || 'deferred' : '',
          stringable = isStringable(fn);

      var source = {
        'setup': getSource(bench.setup, preprocess('m$.setup()')),
        'fn': getSource(fn, preprocess('m$.fn(' + fnArg + ')')),
        'fnArg': fnArg,
        'teardown': getSource(bench.teardown, preprocess('m$.teardown()'))
      };

      var count = bench.count = clone.count,
          decompilable = support.decompilation || stringable,
          id = bench.id,
          isEmpty = !(source.fn || stringable),
          name = bench.name || (typeof id == 'number' ? '<Test #' + id + '>' : id),
          ns = timer.ns,
          result = 0;

      // init `minTime` if needed
      clone.minTime = bench.minTime || (bench.minTime = bench.options.minTime = options.minTime);

      // repair nanosecond timer
      // (some Chrome builds erase the `ns` variable after millions of executions)
      if (applet) {
        try {
          ns.nanoTime();
        } catch(e) {
          // use non-element to avoid issues with libs that augment them
          ns = timer.ns = new applet.Packages.nano;
        }
      }

      // Compile in setup/teardown functions and the test loop.
      // Create a new compiled test, instead of using the cached `bench.compiled`,
      // to avoid potential engine optimizations enabled over the life of the test.
      var compiled = bench.compiled = createFunction(preprocess('t$'), interpolate(
        preprocess(deferred
          ? 'var d$=this,#{fnArg}=d$,m$=d$.benchmark._original,f$=m$.fn,su$=m$.setup,td$=m$.teardown;' +
            // when `deferred.cycles` is `0` then...
            'if(!d$.cycles){' +
            // set `deferred.fn`
            'd$.fn=function(){var #{fnArg}=d$;if(typeof f$=="function"){try{#{fn}\n}catch(e$){f$(d$)}}else{#{fn}\n}};' +
            // set `deferred.teardown`
            'd$.teardown=function(){d$.cycles=0;if(typeof td$=="function"){try{#{teardown}\n}catch(e$){td$()}}else{#{teardown}\n}};' +
            // execute the benchmark's `setup`
            'if(typeof su$=="function"){try{#{setup}\n}catch(e$){su$()}}else{#{setup}\n};' +
            // start timer
            't$.start(d$);' +
            // execute `deferred.fn` and return a dummy object
            '}d$.fn();return{}'

          : 'var r$,s$,m$=this,f$=m$.fn,i$=m$.count,n$=t$.ns;#{setup}\n#{begin};' +
            'while(i$--){#{fn}\n}#{end};#{teardown}\nreturn{elapsed:r$,uid:"#{uid}"}'),
        source
      ));

      try {
        if (isEmpty) {
          // Firefox may remove dead code from Function#toString results
          // http://bugzil.la/536085
          throw new Error('The test "' + name + '" is empty. This may be the result of dead code removal.');
        }
        else if (!deferred) {
          // pretest to determine if compiled code is exits early, usually by a
          // rogue `return` statement, by checking for a return object with the uid
          bench.count = 1;
          compiled = (compiled.call(bench, timer) || {}).uid == uid && compiled;
          bench.count = count;
        }
      } catch(e) {
        compiled = null;
        clone.error = e || new Error(String(e));
        bench.count = count;
      }
      // fallback when a test exits early or errors during pretest
      if (decompilable && !compiled && !deferred && !isEmpty) {
        compiled = createFunction(preprocess('t$'), interpolate(
          preprocess(
            (clone.error && !stringable
              ? 'var r$,s$,m$=this,f$=m$.fn,i$=m$.count'
              : 'function f$(){#{fn}\n}var r$,s$,m$=this,i$=m$.count'
            ) +
            ',n$=t$.ns;#{setup}\n#{begin};m$.f$=f$;while(i$--){m$.f$()}#{end};' +
            'delete m$.f$;#{teardown}\nreturn{elapsed:r$}'
          ),
          source
        ));

        try {
          // pretest one more time to check for errors
          bench.count = 1;
          compiled.call(bench, timer);
          bench.compiled = compiled;
          bench.count = count;
          delete clone.error;
        }
        catch(e) {
          bench.count = count;
          if (clone.error) {
            compiled = null;
          } else {
            bench.compiled = compiled;
            clone.error = e || new Error(String(e));
          }
        }
      }
      // assign `compiled` to `clone` before calling in case a deferred benchmark
      // immediately calls `deferred.resolve()`
      clone.compiled = compiled;
      // if no errors run the full test loop
      if (!clone.error) {
        result = compiled.call(deferred || bench, timer).elapsed;
      }
      return result;
    };

    /*------------------------------------------------------------------------*/

    /**
     * Gets the current timer's minimum resolution (secs).
     */
    function getRes(unit) {
      var measured,
          begin,
          count = 30,
          divisor = 1e3,
          ns = timer.ns,
          sample = [];

      // get average smallest measurable time
      while (count--) {
        if (unit == 'us') {
          divisor = 1e6;
          if (ns.stop) {
            ns.start();
            while (!(measured = ns.microseconds())) { }
          } else if (ns[perfName]) {
            divisor = 1e3;
            measured = Function('n', 'var r,s=n.' + perfName + '();while(!(r=n.' + perfName + '()-s)){};return r')(ns);
          } else {
            begin = ns();
            while (!(measured = ns() - begin)) { }
          }
        }
        else if (unit == 'ns') {
          divisor = 1e9;
          if (ns.nanoTime) {
            begin = ns.nanoTime();
            while (!(measured = ns.nanoTime() - begin)) { }
          } else {
            begin = (begin = ns())[0] + (begin[1] / divisor);
            while (!(measured = ((measured = ns())[0] + (measured[1] / divisor)) - begin)) { }
            divisor = 1;
          }
        }
        else {
          begin = new ns;
          while (!(measured = new ns - begin)) { }
        }
        // check for broken timers (nanoTime may have issues)
        // http://alivebutsleepy.srnet.cz/unreliable-system-nanotime/
        if (measured > 0) {
          sample.push(measured);
        } else {
          sample.push(Infinity);
          break;
        }
      }
      // convert to seconds
      return getMean(sample) / divisor;
    }

    /**
     * Replaces all occurrences of `$` with a unique number and
     * template tokens with content.
     */
    function preprocess(code) {
      return interpolate(code, template).replace(/\$/g, /\d+/.exec(uid));
    }

    /*------------------------------------------------------------------------*/

    // detect nanosecond support from a Java applet
    each(doc && doc.applets || [], function(element) {
      return !(timer.ns = applet = 'nanoTime' in element && element);
    });

    // check type in case Safari returns an object instead of a number
    try {
      if (typeof timer.ns.nanoTime() == 'number') {
        timers.push({ 'ns': timer.ns, 'res': getRes('ns'), 'unit': 'ns' });
      }
    } catch(e) { }

    // detect Chrome's microsecond timer:
    // enable benchmarking via the --enable-benchmarking command
    // line switch in at least Chrome 7 to use chrome.Interval
    try {
      if ((timer.ns = new (window.chrome || window.chromium).Interval)) {
        timers.push({ 'ns': timer.ns, 'res': getRes('us'), 'unit': 'us' });
      }
    } catch(e) { }

    // detect `performance.now` microsecond resolution timer
    if ((timer.ns = perfName && perfObject)) {
      timers.push({ 'ns': timer.ns, 'res': getRes('us'), 'unit': 'us' });
    }

    // detect Node's nanosecond resolution timer available in Node >= 0.8
    if (processObject && typeof (timer.ns = processObject.hrtime) == 'function') {
      timers.push({ 'ns': timer.ns, 'res': getRes('ns'), 'unit': 'ns' });
    }

    // detect Wade Simmons' Node microtime module
    if (microtimeObject && typeof (timer.ns = microtimeObject.now) == 'function') {
      timers.push({ 'ns': timer.ns,  'res': getRes('us'), 'unit': 'us' });
    }

    // pick timer with highest resolution
    timer = reduce(timers, function(timer, other) {
      return other.res < timer.res ? other : timer;
    });

    // remove unused applet
    if (timer.unit != 'ns' && applet) {
      applet = destroyElement(applet);
    }
    // error if there are no working timers
    if (timer.res == Infinity) {
      throw new Error('Benchmark.js was unable to find a working timer.');
    }
    // use API of chosen timer
    if (timer.unit == 'ns') {
      if (timer.ns.nanoTime) {
        extend(template, {
          'begin': 's$=n$.nanoTime()',
          'end': 'r$=(n$.nanoTime()-s$)/1e9'
        });
      } else {
        extend(template, {
          'begin': 's$=n$()',
          'end': 'r$=n$(s$);r$=r$[0]+(r$[1]/1e9)'
        });
      }
    }
    else if (timer.unit == 'us') {
      if (timer.ns.stop) {
        extend(template, {
          'begin': 's$=n$.start()',
          'end': 'r$=n$.microseconds()/1e6'
        });
      } else if (perfName) {
        extend(template, {
          'begin': 's$=n$.' + perfName + '()',
          'end': 'r$=(n$.' + perfName + '()-s$)/1e3'
        });
      } else {
        extend(template, {
          'begin': 's$=n$()',
          'end': 'r$=(n$()-s$)/1e6'
        });
      }
    }

    // define `timer` methods
    timer.start = createFunction(preprocess('o$'),
      preprocess('var n$=this.ns,#{begin};o$.elapsed=0;o$.timeStamp=s$'));

    timer.stop = createFunction(preprocess('o$'),
      preprocess('var n$=this.ns,s$=o$.timeStamp,#{end};o$.elapsed=r$'));

    // resolve time span required to achieve a percent uncertainty of at most 1%
    // http://spiff.rit.edu/classes/phys273/uncert/uncert.html
    options.minTime || (options.minTime = max(timer.res / 2 / 0.01, 0.05));
    return clock.apply(null, arguments);
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Computes stats on benchmark results.
   *
   * @private
   * @param {Object} bench The benchmark instance.
   * @param {Object} options The options object.
   */
  function compute(bench, options) {
    options || (options = {});

    var async = options.async,
        elapsed = 0,
        initCount = bench.initCount,
        minSamples = bench.minSamples,
        queue = [],
        sample = bench.stats.sample;

    /**
     * Adds a clone to the queue.
     */
    function enqueue() {
      queue.push(bench.clone({
        '_original': bench,
        'events': {
          'abort': [update],
          'cycle': [update],
          'error': [update],
          'start': [update]
        }
      }));
    }

    /**
     * Updates the clone/original benchmarks to keep their data in sync.
     */
    function update(event) {
      var clone = this,
          type = event.type;

      if (bench.running) {
        if (type == 'start') {
          // Note: `clone.minTime` prop is inited in `clock()`
          clone.count = bench.initCount;
        }
        else {
          if (type == 'error') {
            bench.error = clone.error;
          }
          if (type == 'abort') {
            bench.abort();
            bench.emit('cycle');
          } else {
            event.currentTarget = event.target = bench;
            bench.emit(event);
          }
        }
      } else if (bench.aborted) {
        // clear abort listeners to avoid triggering bench's abort/cycle again
        clone.events.abort.length = 0;
        clone.abort();
      }
    }

    /**
     * Determines if more clones should be queued or if cycling should stop.
     */
    function evaluate(event) {
      var critical,
          df,
          mean,
          moe,
          rme,
          sd,
          sem,
          variance,
          clone = event.target,
          done = bench.aborted,
          now = +new Date,
          size = sample.push(clone.times.period),
          maxedOut = size >= minSamples && (elapsed += now - clone.times.timeStamp) / 1e3 > bench.maxTime,
          times = bench.times,
          varOf = function(sum, x) { return sum + pow(x - mean, 2); };

      // exit early for aborted or unclockable tests
      if (done || clone.hz == Infinity) {
        maxedOut = !(size = sample.length = queue.length = 0);
      }

      if (!done) {
        // sample mean (estimate of the population mean)
        mean = getMean(sample);
        // sample variance (estimate of the population variance)
        variance = reduce(sample, varOf, 0) / (size - 1) || 0;
        // sample standard deviation (estimate of the population standard deviation)
        sd = sqrt(variance);
        // standard error of the mean (a.k.a. the standard deviation of the sampling distribution of the sample mean)
        sem = sd / sqrt(size);
        // degrees of freedom
        df = size - 1;
        // critical value
        critical = tTable[Math.round(df) || 1] || tTable.infinity;
        // margin of error
        moe = sem * critical;
        // relative margin of error
        rme = (moe / mean) * 100 || 0;

        extend(bench.stats, {
          'deviation': sd,
          'mean': mean,
          'moe': moe,
          'rme': rme,
          'sem': sem,
          'variance': variance
        });

        // Abort the cycle loop when the minimum sample size has been collected
        // and the elapsed time exceeds the maximum time allowed per benchmark.
        // We don't count cycle delays toward the max time because delays may be
        // increased by browsers that clamp timeouts for inactive tabs.
        // https://developer.mozilla.org/en/window.setTimeout#Inactive_tabs
        if (maxedOut) {
          // reset the `initCount` in case the benchmark is rerun
          bench.initCount = initCount;
          bench.running = false;
          done = true;
          times.elapsed = (now - times.timeStamp) / 1e3;
        }
        if (bench.hz != Infinity) {
          bench.hz = 1 / mean;
          times.cycle = mean * bench.count;
          times.period = mean;
        }
      }
      // if time permits, increase sample size to reduce the margin of error
      if (queue.length < 2 && !maxedOut) {
        enqueue();
      }
      // abort the invoke cycle when done
      event.aborted = done;
    }

    // init queue and begin
    enqueue();
    invoke(queue, {
      'name': 'run',
      'args': { 'async': async },
      'queued': true,
      'onCycle': evaluate,
      'onComplete': function() { bench.emit('complete'); }
    });
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Cycles a benchmark until a run `count` can be established.
   *
   * @private
   * @param {Object} clone The cloned benchmark instance.
   * @param {Object} options The options object.
   */
  function cycle(clone, options) {
    options || (options = {});

    var deferred;
    if (clone instanceof Deferred) {
      deferred = clone;
      clone = clone.benchmark;
    }

    var clocked,
        cycles,
        divisor,
        event,
        minTime,
        period,
        async = options.async,
        bench = clone._original,
        count = clone.count,
        times = clone.times;

    // continue, if not aborted between cycles
    if (clone.running) {
      // `minTime` is set to `Benchmark.options.minTime` in `clock()`
      cycles = ++clone.cycles;
      clocked = deferred ? deferred.elapsed : clock(clone);
      minTime = clone.minTime;

      if (cycles > bench.cycles) {
        bench.cycles = cycles;
      }
      if (clone.error) {
        event = Event('error');
        event.message = clone.error;
        clone.emit(event);
        if (!event.cancelled) {
          clone.abort();
        }
      }
    }

    // continue, if not errored
    if (clone.running) {
      // time taken to complete last test cycle
      bench.times.cycle = times.cycle = clocked;
      // seconds per operation
      period = bench.times.period = times.period = clocked / count;
      // ops per second
      bench.hz = clone.hz = 1 / period;
      // avoid working our way up to this next time
      bench.initCount = clone.initCount = count;
      // do we need to do another cycle?
      clone.running = clocked < minTime;

      if (clone.running) {
        // tests may clock at `0` when `initCount` is a small number,
        // to avoid that we set its count to something a bit higher
        if (!clocked && (divisor = divisors[clone.cycles]) != null) {
          count = floor(4e6 / divisor);
        }
        // calculate how many more iterations it will take to achive the `minTime`
        if (count <= clone.count) {
          count += Math.ceil((minTime - clocked) / period);
        }
        clone.running = count != Infinity;
      }
    }
    // should we exit early?
    event = Event('cycle');
    clone.emit(event);
    if (event.aborted) {
      clone.abort();
    }
    // figure out what to do next
    if (clone.running) {
      // start a new cycle
      clone.count = count;
      if (deferred) {
        clone.compiled.call(deferred, timer);
      } else if (async) {
        delay(clone, function() { cycle(clone, options); });
      } else {
        cycle(clone);
      }
    }
    else {
      // fix TraceMonkey bug associated with clock fallbacks
      // http://bugzil.la/509069
      if (support.browser) {
        runScript(uid + '=1;delete ' + uid);
      }
      // done
      clone.emit('complete');
    }
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Runs the benchmark.
   *
   * @memberOf Benchmark
   * @param {Object} [options={}] Options object.
   * @returns {Object} The benchmark instance.
   * @example
   *
   * // basic usage
   * bench.run();
   *
   * // or with options
   * bench.run({ 'async': true });
   */
  function run(options) {
    var me = this,
        event = Event('start');

    // set `running` to `false` so `reset()` won't call `abort()`
    me.running = false;
    me.reset();
    me.running = true;

    me.count = me.initCount;
    me.times.timeStamp = +new Date;
    me.emit(event);

    if (!event.cancelled) {
      options = { 'async': ((options = options && options.async) == null ? me.async : options) && support.timeout };

      // for clones created within `compute()`
      if (me._original) {
        if (me.defer) {
          Deferred(me);
        } else {
          cycle(me, options);
        }
      }
      // for original benchmarks
      else {
        compute(me, options);
      }
    }
    return me;
  }

  /*--------------------------------------------------------------------------*/

  // Firefox 1 erroneously defines variable and argument names of functions on
  // the function itself as non-configurable properties with `undefined` values.
  // The bugginess continues as the `Benchmark` constructor has an argument
  // named `options` and Firefox 1 will not assign a value to `Benchmark.options`,
  // making it non-writable in the process, unless it is the first property
  // assigned by for-in loop of `extend()`.
  extend(Benchmark, {

    /**
     * The default options copied by benchmark instances.
     *
     * @static
     * @memberOf Benchmark
     * @type Object
     */
    'options': {

      /**
       * A flag to indicate that benchmark cycles will execute asynchronously
       * by default.
       *
       * @memberOf Benchmark.options
       * @type Boolean
       */
      'async': false,

      /**
       * A flag to indicate that the benchmark clock is deferred.
       *
       * @memberOf Benchmark.options
       * @type Boolean
       */
      'defer': false,

      /**
       * The delay between test cycles (secs).
       * @memberOf Benchmark.options
       * @type Number
       */
      'delay': 0.005,

      /**
       * Displayed by Benchmark#toString when a `name` is not available
       * (auto-generated if absent).
       *
       * @memberOf Benchmark.options
       * @type String
       */
      'id': undefined,

      /**
       * The default number of times to execute a test on a benchmark's first cycle.
       *
       * @memberOf Benchmark.options
       * @type Number
       */
      'initCount': 1,

      /**
       * The maximum time a benchmark is allowed to run before finishing (secs).
       * Note: Cycle delays aren't counted toward the maximum time.
       *
       * @memberOf Benchmark.options
       * @type Number
       */
      'maxTime': 5,

      /**
       * The minimum sample size required to perform statistical analysis.
       *
       * @memberOf Benchmark.options
       * @type Number
       */
      'minSamples': 5,

      /**
       * The time needed to reduce the percent uncertainty of measurement to 1% (secs).
       *
       * @memberOf Benchmark.options
       * @type Number
       */
      'minTime': 0,

      /**
       * The name of the benchmark.
       *
       * @memberOf Benchmark.options
       * @type String
       */
      'name': undefined,

      /**
       * An event listener called when the benchmark is aborted.
       *
       * @memberOf Benchmark.options
       * @type Function
       */
      'onAbort': undefined,

      /**
       * An event listener called when the benchmark completes running.
       *
       * @memberOf Benchmark.options
       * @type Function
       */
      'onComplete': undefined,

      /**
       * An event listener called after each run cycle.
       *
       * @memberOf Benchmark.options
       * @type Function
       */
      'onCycle': undefined,

      /**
       * An event listener called when a test errors.
       *
       * @memberOf Benchmark.options
       * @type Function
       */
      'onError': undefined,

      /**
       * An event listener called when the benchmark is reset.
       *
       * @memberOf Benchmark.options
       * @type Function
       */
      'onReset': undefined,

      /**
       * An event listener called when the benchmark starts running.
       *
       * @memberOf Benchmark.options
       * @type Function
       */
      'onStart': undefined
    },

    /**
     * Platform object with properties describing things like browser name,
     * version, and operating system.
     *
     * @static
     * @memberOf Benchmark
     * @type Object
     */
    'platform': req('platform') || window.platform || {

      /**
       * The platform description.
       *
       * @memberOf Benchmark.platform
       * @type String
       */
      'description': window.navigator && navigator.userAgent || null,

      /**
       * The name of the browser layout engine.
       *
       * @memberOf Benchmark.platform
       * @type String|Null
       */
      'layout': null,

      /**
       * The name of the product hosting the browser.
       *
       * @memberOf Benchmark.platform
       * @type String|Null
       */
      'product': null,

      /**
       * The name of the browser/environment.
       *
       * @memberOf Benchmark.platform
       * @type String|Null
       */
      'name': null,

      /**
       * The name of the product's manufacturer.
       *
       * @memberOf Benchmark.platform
       * @type String|Null
       */
      'manufacturer': null,

      /**
       * The name of the operating system.
       *
       * @memberOf Benchmark.platform
       * @type String|Null
       */
      'os': null,

      /**
       * The alpha/beta release indicator.
       *
       * @memberOf Benchmark.platform
       * @type String|Null
       */
      'prerelease': null,

      /**
       * The browser/environment version.
       *
       * @memberOf Benchmark.platform
       * @type String|Null
       */
      'version': null,

      /**
       * Return platform description when the platform object is coerced to a string.
       *
       * @memberOf Benchmark.platform
       * @type Function
       * @returns {String} The platform description.
       */
      'toString': function() {
        return this.description || '';
      }
    },

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf Benchmark
     * @type String
     */
    'version': '1.0.0',

    // an object of environment/feature detection flags
    'support': support,

    // clone objects
    'deepClone': deepClone,

    // iteration utility
    'each': each,

    // augment objects
    'extend': extend,

    // generic Array#filter
    'filter': filter,

    // generic Array#forEach
    'forEach': forEach,

    // generic own property iteration utility
    'forOwn': forOwn,

    // converts a number to a comma-separated string
    'formatNumber': formatNumber,

    // generic Object#hasOwnProperty
    // (trigger hasKey's lazy define before assigning it to Benchmark)
    'hasKey': (hasKey(Benchmark, ''), hasKey),

    // generic Array#indexOf
    'indexOf': indexOf,

    // template utility
    'interpolate': interpolate,

    // invokes a method on each item in an array
    'invoke': invoke,

    // generic Array#join for arrays and objects
    'join': join,

    // generic Array#map
    'map': map,

    // retrieves a property value from each item in an array
    'pluck': pluck,

    // generic Array#reduce
    'reduce': reduce
  });

  /*--------------------------------------------------------------------------*/

  extend(Benchmark.prototype, {

    /**
     * The number of times a test was executed.
     *
     * @memberOf Benchmark
     * @type Number
     */
    'count': 0,

    /**
     * The number of cycles performed while benchmarking.
     *
     * @memberOf Benchmark
     * @type Number
     */
    'cycles': 0,

    /**
     * The number of executions per second.
     *
     * @memberOf Benchmark
     * @type Number
     */
    'hz': 0,

    /**
     * The compiled test function.
     *
     * @memberOf Benchmark
     * @type Function|String
     */
    'compiled': undefined,

    /**
     * The error object if the test failed.
     *
     * @memberOf Benchmark
     * @type Object
     */
    'error': undefined,

    /**
     * The test to benchmark.
     *
     * @memberOf Benchmark
     * @type Function|String
     */
    'fn': undefined,

    /**
     * A flag to indicate if the benchmark is aborted.
     *
     * @memberOf Benchmark
     * @type Boolean
     */
    'aborted': false,

    /**
     * A flag to indicate if the benchmark is running.
     *
     * @memberOf Benchmark
     * @type Boolean
     */
    'running': false,

    /**
     * Compiled into the test and executed immediately **before** the test loop.
     *
     * @memberOf Benchmark
     * @type Function|String
     * @example
     *
     * // basic usage
     * var bench = Benchmark({
     *   'setup': function() {
     *     var c = this.count,
     *         element = document.getElementById('container');
     *     while (c--) {
     *       element.appendChild(document.createElement('div'));
     *     }
     *   },
     *   'fn': function() {
     *     element.removeChild(element.lastChild);
     *   }
     * });
     *
     * // compiles to something like:
     * var c = this.count,
     *     element = document.getElementById('container');
     * while (c--) {
     *   element.appendChild(document.createElement('div'));
     * }
     * var start = new Date;
     * while (count--) {
     *   element.removeChild(element.lastChild);
     * }
     * var end = new Date - start;
     *
     * // or using strings
     * var bench = Benchmark({
     *   'setup': '\
     *     var a = 0;\n\
     *     (function() {\n\
     *       (function() {\n\
     *         (function() {',
     *   'fn': 'a += 1;',
     *   'teardown': '\
     *          }())\n\
     *        }())\n\
     *      }())'
     * });
     *
     * // compiles to something like:
     * var a = 0;
     * (function() {
     *   (function() {
     *     (function() {
     *       var start = new Date;
     *       while (count--) {
     *         a += 1;
     *       }
     *       var end = new Date - start;
     *     }())
     *   }())
     * }())
     */
    'setup': noop,

    /**
     * Compiled into the test and executed immediately **after** the test loop.
     *
     * @memberOf Benchmark
     * @type Function|String
     */
    'teardown': noop,

    /**
     * An object of stats including mean, margin or error, and standard deviation.
     *
     * @memberOf Benchmark
     * @type Object
     */
    'stats': {

      /**
       * The margin of error.
       *
       * @memberOf Benchmark#stats
       * @type Number
       */
      'moe': 0,

      /**
       * The relative margin of error (expressed as a percentage of the mean).
       *
       * @memberOf Benchmark#stats
       * @type Number
       */
      'rme': 0,

      /**
       * The standard error of the mean.
       *
       * @memberOf Benchmark#stats
       * @type Number
       */
      'sem': 0,

      /**
       * The sample standard deviation.
       *
       * @memberOf Benchmark#stats
       * @type Number
       */
      'deviation': 0,

      /**
       * The sample arithmetic mean.
       *
       * @memberOf Benchmark#stats
       * @type Number
       */
      'mean': 0,

      /**
       * The array of sampled periods.
       *
       * @memberOf Benchmark#stats
       * @type Array
       */
      'sample': [],

      /**
       * The sample variance.
       *
       * @memberOf Benchmark#stats
       * @type Number
       */
      'variance': 0
    },

    /**
     * An object of timing data including cycle, elapsed, period, start, and stop.
     *
     * @memberOf Benchmark
     * @type Object
     */
    'times': {

      /**
       * The time taken to complete the last cycle (secs).
       *
       * @memberOf Benchmark#times
       * @type Number
       */
      'cycle': 0,

      /**
       * The time taken to complete the benchmark (secs).
       *
       * @memberOf Benchmark#times
       * @type Number
       */
      'elapsed': 0,

      /**
       * The time taken to execute the test once (secs).
       *
       * @memberOf Benchmark#times
       * @type Number
       */
      'period': 0,

      /**
       * A timestamp of when the benchmark started (ms).
       *
       * @memberOf Benchmark#times
       * @type Number
       */
      'timeStamp': 0
    },

    // aborts benchmark (does not record times)
    'abort': abort,

    // creates a new benchmark using the same test and options
    'clone': clone,

    // compares benchmark's hertz with another
    'compare': compare,

    // executes listeners
    'emit': emit,

    // get listeners
    'listeners': listeners,

    // unregister listeners
    'off': off,

    // register listeners
    'on': on,

    // reset benchmark properties
    'reset': reset,

    // runs the benchmark
    'run': run,

    // pretty print benchmark info
    'toString': toStringBench
  });

  /*--------------------------------------------------------------------------*/

  extend(Deferred.prototype, {

    /**
     * The deferred benchmark instance.
     *
     * @memberOf Benchmark.Deferred
     * @type Object
     */
    'benchmark': null,

    /**
     * The number of deferred cycles performed while benchmarking.
     *
     * @memberOf Benchmark.Deferred
     * @type Number
     */
    'cycles': 0,

    /**
     * The time taken to complete the deferred benchmark (secs).
     *
     * @memberOf Benchmark.Deferred
     * @type Number
     */
    'elapsed': 0,

    /**
     * A timestamp of when the deferred benchmark started (ms).
     *
     * @memberOf Benchmark.Deferred
     * @type Number
     */
    'timeStamp': 0,

    // cycles/completes the deferred benchmark
    'resolve': resolve
  });

  /*--------------------------------------------------------------------------*/

  extend(Event.prototype, {

    /**
     * A flag to indicate if the emitters listener iteration is aborted.
     *
     * @memberOf Benchmark.Event
     * @type Boolean
     */
    'aborted': false,

    /**
     * A flag to indicate if the default action is cancelled.
     *
     * @memberOf Benchmark.Event
     * @type Boolean
     */
    'cancelled': false,

    /**
     * The object whose listeners are currently being processed.
     *
     * @memberOf Benchmark.Event
     * @type Object
     */
    'currentTarget': undefined,

    /**
     * The return value of the last executed listener.
     *
     * @memberOf Benchmark.Event
     * @type Mixed
     */
    'result': undefined,

    /**
     * The object to which the event was originally emitted.
     *
     * @memberOf Benchmark.Event
     * @type Object
     */
    'target': undefined,

    /**
     * A timestamp of when the event was created (ms).
     *
     * @memberOf Benchmark.Event
     * @type Number
     */
    'timeStamp': 0,

    /**
     * The event type.
     *
     * @memberOf Benchmark.Event
     * @type String
     */
    'type': ''
  });

  /*--------------------------------------------------------------------------*/

  /**
   * The default options copied by suite instances.
   *
   * @static
   * @memberOf Benchmark.Suite
   * @type Object
   */
  Suite.options = {

    /**
     * The name of the suite.
     *
     * @memberOf Benchmark.Suite.options
     * @type String
     */
    'name': undefined
  };

  /*--------------------------------------------------------------------------*/

  extend(Suite.prototype, {

    /**
     * The number of benchmarks in the suite.
     *
     * @memberOf Benchmark.Suite
     * @type Number
     */
    'length': 0,

    /**
     * A flag to indicate if the suite is aborted.
     *
     * @memberOf Benchmark.Suite
     * @type Boolean
     */
    'aborted': false,

    /**
     * A flag to indicate if the suite is running.
     *
     * @memberOf Benchmark.Suite
     * @type Boolean
     */
    'running': false,

    /**
     * An `Array#forEach` like method.
     * Callbacks may terminate the loop by explicitly returning `false`.
     *
     * @memberOf Benchmark.Suite
     * @param {Function} callback The function called per iteration.
     * @returns {Object} The suite iterated over.
     */
    'forEach': methodize(forEach),

    /**
     * An `Array#indexOf` like method.
     *
     * @memberOf Benchmark.Suite
     * @param {Mixed} value The value to search for.
     * @returns {Number} The index of the matched value or `-1`.
     */
    'indexOf': methodize(indexOf),

    /**
     * Invokes a method on all benchmarks in the suite.
     *
     * @memberOf Benchmark.Suite
     * @param {String|Object} name The name of the method to invoke OR options object.
     * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the method with.
     * @returns {Array} A new array of values returned from each method invoked.
     */
    'invoke': methodize(invoke),

    /**
     * Converts the suite of benchmarks to a string.
     *
     * @memberOf Benchmark.Suite
     * @param {String} [separator=','] A string to separate each element of the array.
     * @returns {String} The string.
     */
    'join': [].join,

    /**
     * An `Array#map` like method.
     *
     * @memberOf Benchmark.Suite
     * @param {Function} callback The function called per iteration.
     * @returns {Array} A new array of values returned by the callback.
     */
    'map': methodize(map),

    /**
     * Retrieves the value of a specified property from all benchmarks in the suite.
     *
     * @memberOf Benchmark.Suite
     * @param {String} property The property to pluck.
     * @returns {Array} A new array of property values.
     */
    'pluck': methodize(pluck),

    /**
     * Removes the last benchmark from the suite and returns it.
     *
     * @memberOf Benchmark.Suite
     * @returns {Mixed} The removed benchmark.
     */
    'pop': [].pop,

    /**
     * Appends benchmarks to the suite.
     *
     * @memberOf Benchmark.Suite
     * @returns {Number} The suite's new length.
     */
    'push': [].push,

    /**
     * Sorts the benchmarks of the suite.
     *
     * @memberOf Benchmark.Suite
     * @param {Function} [compareFn=null] A function that defines the sort order.
     * @returns {Object} The sorted suite.
     */
    'sort': [].sort,

    /**
     * An `Array#reduce` like method.
     *
     * @memberOf Benchmark.Suite
     * @param {Function} callback The function called per iteration.
     * @param {Mixed} accumulator Initial value of the accumulator.
     * @returns {Mixed} The accumulator.
     */
    'reduce': methodize(reduce),

    // aborts all benchmarks in the suite
    'abort': abortSuite,

    // adds a benchmark to the suite
    'add': add,

    // creates a new suite with cloned benchmarks
    'clone': cloneSuite,

    // executes listeners of a specified type
    'emit': emit,

    // creates a new suite of filtered benchmarks
    'filter': filterSuite,

    // get listeners
    'listeners': listeners,

    // unregister listeners
    'off': off,

   // register listeners
    'on': on,

    // resets all benchmarks in the suite
    'reset': resetSuite,

    // runs all benchmarks in the suite
    'run': runSuite,

    // array methods
    'concat': concat,

    'reverse': reverse,

    'shift': shift,

    'slice': slice,

    'splice': splice,

    'unshift': unshift
  });

  /*--------------------------------------------------------------------------*/

  // expose Deferred, Event and Suite
  extend(Benchmark, {
    'Deferred': Deferred,
    'Event': Event,
    'Suite': Suite
  });

  // expose Benchmark
  // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // define as an anonymous module so, through path mapping, it can be aliased
    define(function() {
      return Benchmark;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (freeExports) {
    // in Node.js or RingoJS v0.8.0+
    if (typeof module == 'object' && module && module.exports == freeExports) {
      (module.exports = Benchmark).Benchmark = Benchmark;
    }
    // in Narwhal or RingoJS v0.7.0-
    else {
      freeExports.Benchmark = Benchmark;
    }
  }
  // in a browser or Rhino
  else {
    // use square bracket notation so Closure Compiler won't munge `Benchmark`
    // http://code.google.com/closure/compiler/docs/api-tutorial3.html#export
    window['Benchmark'] = Benchmark;
  }

  // trigger clock's lazy define early to avoid a security error
  if (support.air) {
    clock({ '_original': { 'fn': noop, 'count': 1, 'options': {} } });
  }
}(this));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

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
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvYmVuY2htYXJrcy9sb29rdXAuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9iZW5jaG1hcmsvYmVuY2htYXJrLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaDFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgQiA9IHJlcXVpcmUoXCJiZW5jaG1hcmtcIilcblxuLypcbiAqIFRoZSBnb2FsIGhlcmUgaXMgdG8gZXhwbG9yZSB0aGUgcGVyZm9ybWFuY2UgdHJhZGVvZmZzIHdoZW4gaXRlcmF0aW5nXG4gKiBvdmVyIG9iamVjdHMgdG8gcGVyZm9ybSBhbiB1cGRhdGUuICBJbiBwYXJ0aWN1bGFyLCB3ZSB3YW50IHRvIGtub3cgd2hhdFxuICogb3ZlcmhlYWQgaXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBmb2xsb3dpbmcgZmFjdG9yczpcbiAqXG4gKiAxKSBTaXplIG9mIG9iamVjdFxuICogMikgUmVndWxhcml0eSBvZiBvYmplY3QncyBcInR5cGVzXCJcbiAqIDMpIFxuICpcbiAqXG4gKlxuICovXG5cbmZ1bmN0aW9uIFNtYWxsT2JqZWN0ICgpIHtcbiAgdGhpcy54ICA9IDFcbiAgdGhpcy55ICA9IDJcbiAgdGhpcy56ICA9IDNcbiAgdGhpcy5keCA9IC4xXG4gIHRoaXMuZHkgPSAuMVxuICB0aGlzLmR6ID0gLjFcbn1cblxuZnVuY3Rpb24gU21hbGxPYmplY3ROZXN0ZWQgKCkge1xuICB0aGlzLnBvc2l0aW9uID0ge1xuICAgIHg6IDEsXG4gICAgeTogMixcbiAgICB6OiAzIFxuICB9XG4gIHRoaXMudmVsb2NpdHkgPSB7XG4gICAgeDogLjEsXG4gICAgeTogLjEsXG4gICAgejogLjEgXG4gIH1cbn1cblxuZnVuY3Rpb24gU21hbGxOZXN0ZWRBcnJheU9iamVjdCAoKSB7XG4gIHRoaXMucG9zaXRpb24gPSBuZXcgRmxvYXQzMkFycmF5KFsxLDIsM10pXG4gIHRoaXMudmVsb2NpdHkgPSBuZXcgRmxvYXQzMkFycmF5KFsuMSwuMSwuMV0pXG59XG5cbnZhciBjb3VudCA9IDEwMDAwXG52YXIgc29zICAgPSBbXVxudmFyIHNvbnMgID0gW11cbnZhciBzb25hcyA9IFtdXG52YXIgZnRhICAgPSBuZXcgRmxvYXQzMkFycmF5KGNvdW50ICogNilcbnZhciBpdGEgICA9IG5ldyBVaW50MzJBcnJheShjb3VudCAqIDYpXG52YXIgaWpzYSAgPSBbXVxudmFyIGZqc2EgID0gW11cbnZhciBwb3NzICA9IG5ldyBGbG9hdDMyQXJyYXkoY291bnQgKiAzKVxudmFyIHZlbHMgID0gbmV3IEZsb2F0MzJBcnJheShjb3VudCAqIDMpXG5cbmZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICBzb3MucHVzaChuZXcgU21hbGxPYmplY3QpXG4gIHNvbnMucHVzaChuZXcgU21hbGxPYmplY3ROZXN0ZWQpXG4gIHNvbmFzLnB1c2gobmV3IFNtYWxsTmVzdGVkQXJyYXlPYmplY3QpXG4gIGZ0YS5zZXQoWzEsIDIsIDMsIDAuMSwgMC4xLCAwLjFdLCBpKjYpXG4gIGl0YS5zZXQoWzEsIDIsIDMsIDEsIDEsIDFdLCBpKjYpXG4gIFxuICBwb3NzLnNldChbMSwgMiwgM10sIGkqMykgXG4gIHZlbHMuc2V0KFswLjEsIDAuMSwgMC4xXSwgaSozKSBcbiAgXG4gIC8vcHVzaCBncm91cCBvZiBpbnRzXG4gIGlqc2EucHVzaCgxKVxuICBpanNhLnB1c2goMilcbiAgaWpzYS5wdXNoKDMpXG4gIGlqc2EucHVzaCgxKVxuICBpanNhLnB1c2goMSlcbiAgaWpzYS5wdXNoKDEpXG5cbiAgLy9wdXNoIGdyb3VwIG9mIGZsb2F0c1xuICBmanNhLnB1c2goMS4wKVxuICBmanNhLnB1c2goMi4wKVxuICBmanNhLnB1c2goMy4wKVxuICBmanNhLnB1c2goMC4xKVxuICBmanNhLnB1c2goMC4xKVxuICBmanNhLnB1c2goMC4xKVxufVxuXG52YXIgc3VpdGUgPSBuZXcgQi5TdWl0ZVxuXG5zdWl0ZS5hZGQoXCJzbWFsbCBvYmplY3RzXCIsIGZ1bmN0aW9uICgpIHtcbiAgdmFyIG9ialxuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgc29zLmxlbmd0aDsgKytqKSB7XG4gICAgb2JqICAgID0gc29zW2pdXG4gICAgb2JqLnggKz0gb2JqLmR4XG4gICAgb2JqLnkgKz0gb2JqLmR5XG4gICAgb2JqLnogKz0gb2JqLmR6XG4gIH1cbn0pXG5cbnN1aXRlLmFkZChcInNtYWxsIG5lc3RlZCBvYmplY3RzXCIsIGZ1bmN0aW9uICgpIHtcbiAgdmFyIG9ialxuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgc29ucy5sZW5ndGg7ICsraikge1xuICAgIG9iaiAgICAgICAgICAgICA9IHNvbnNbal1cbiAgICBvYmoucG9zaXRpb24ueCArPSBvYmoudmVsb2NpdHkueFxuICAgIG9iai5wb3NpdGlvbi55ICs9IG9iai52ZWxvY2l0eS55XG4gICAgb2JqLnBvc2l0aW9uLnogKz0gb2JqLnZlbG9jaXR5LnpcbiAgfVxufSlcblxuc3VpdGUuYWRkKFwic21hbGwgbmVzdGVkIGFycmF5IG9iamVjdFwiLCBmdW5jdGlvbiAoKSB7XG4gIHZhciBvYmpcblxuICBmb3IgKHZhciBqID0gMDsgaiA8IHNvbmFzLmxlbmd0aDsgKytqKSB7XG4gICAgb2JqICAgICAgICAgICAgICA9IHNvbmFzW2pdIFxuICAgIG9iai5wb3NpdGlvblswXSArPSBvYmoudmVsb2NpdHlbMF1cbiAgICBvYmoucG9zaXRpb25bMV0gKz0gb2JqLnZlbG9jaXR5WzFdXG4gICAgb2JqLnBvc2l0aW9uWzJdICs9IG9iai52ZWxvY2l0eVsyXVxuICB9XG59KVxuXG5zdWl0ZS5hZGQoXCJmbGF0IGZsb2F0cyBhcnJheVwiLCBmdW5jdGlvbiAoKSB7XG4gIGZvciAodmFyIGogPSAwOyBqIDwgZnRhLmxlbmd0aDsgais9Nikge1xuICAgIGZ0YVtqXSAgICs9IGZ0YVtqKzNdXG4gICAgZnRhW2orMV0gKz0gZnRhW2orNF1cbiAgICBmdGFbaisyXSArPSBmdGFbais1XVxuICB9XG59KVxuXG5zdWl0ZS5hZGQoXCJzZXBhcmF0ZSBmbGF0IGZsb2F0IGFycmF5c1wiLCBmdW5jdGlvbiAoKSB7XG4gIGZvciAodmFyIGogPSAwOyBqIDwgcG9zcy5sZW5ndGg7IGorPTMpIHtcbiAgICBwb3NzW2pdICAgKz0gdmVsc1tqXSAgXG4gICAgcG9zc1tqKzFdICs9IHZlbHNbaisxXSAgXG4gICAgcG9zc1tqKzJdICs9IHZlbHNbaisyXSAgXG4gIH1cbn0pXG5cbi8vc3VpdGUuYWRkKFwiZmxhdCBpbnRzIGFycmF5XCIsIGZ1bmN0aW9uICgpIHtcbi8vICBmb3IgKHZhciBqID0gMDsgaiA8IGl0YS5sZW5ndGg7IGorPTYpIHtcbi8vICAgIGl0YVtqXSAgICs9IGl0YVtqKzNdXG4vLyAgICBpdGFbaisxXSArPSBpdGFbais0XVxuLy8gICAgaXRhW2orMl0gKz0gaXRhW2orNV1cbi8vICB9XG4vL30pXG5cbi8vc3VpdGUuYWRkKFwiZmxhdCBqc2FycmF5IGludHNcIiwgZnVuY3Rpb24gKCkge1xuLy8gIGZvciAodmFyIGogPSAwOyBqIDwgaWpzYS5sZW5ndGg7IGorPTYpIHtcbi8vICAgIGlqc2Fbal0gICArPSBpanNhW2orM11cbi8vICAgIGlqc2FbaisxXSArPSBpanNhW2orNF1cbi8vICAgIGlqc2FbaisyXSArPSBpanNhW2orNV1cbi8vICB9XG4vL30pXG5cbi8vc3VpdGUuYWRkKFwiZmxhdCBqc2FycmF5IGZsb2F0c1wiLCBmdW5jdGlvbiAoKSB7XG4vLyAgZm9yICh2YXIgaiA9IDA7IGogPCBmanNhLmxlbmd0aDsgais9Nikge1xuLy8gICAgZmpzYVtqXSAgICs9IGZqc2FbaiszXVxuLy8gICAgZmpzYVtqKzFdICs9IGZqc2Fbais0XVxuLy8gICAgZmpzYVtqKzJdICs9IGZqc2Fbais1XVxuLy8gIH1cbi8vfSlcblxuc3VpdGUub24oXCJjeWNsZVwiLCBmdW5jdGlvbiAoZSkge1xuICBjb25zb2xlLmxvZyhTdHJpbmcoZS50YXJnZXQpKVxufSlcblxuc3VpdGUub24oXCJjb21wbGV0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gIGNvbnNvbGUubG9nKHRoaXMuZmlsdGVyKFwiZmFzdGVzdFwiKS5wbHVjayhcIm5hbWVcIikpXG59KVxuXG4vL3N1aXRlLnJ1bigpXG53aW5kb3cuc3VpdGVzID0ge1xuICBpdGVyYXRpb25zOiBzdWl0ZSBcbn1cbiIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwpe1xuLyohXG4gKiBCZW5jaG1hcmsuanMgdjEuMC4wIDxodHRwOi8vYmVuY2htYXJranMuY29tLz5cbiAqIENvcHlyaWdodCAyMDEwLTIwMTIgTWF0aGlhcyBCeW5lbnMgPGh0dHA6Ly9tdGhzLmJlLz5cbiAqIEJhc2VkIG9uIEpTTGl0bXVzLmpzLCBjb3B5cmlnaHQgUm9iZXJ0IEtpZWZmZXIgPGh0dHA6Ly9icm9vZmEuY29tLz5cbiAqIE1vZGlmaWVkIGJ5IEpvaG4tRGF2aWQgRGFsdG9uIDxodHRwOi8vYWxseW91Y2FubGVldC5jb20vPlxuICogQXZhaWxhYmxlIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwOi8vbXRocy5iZS9taXQ+XG4gKi9cbjsoZnVuY3Rpb24od2luZG93LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKiBVc2VkIHRvIGFzc2lnbiBlYWNoIGJlbmNobWFyayBhbiBpbmNyaW1lbnRlZCBpZCAqL1xuICB2YXIgY291bnRlciA9IDA7XG5cbiAgLyoqIERldGVjdCBET00gZG9jdW1lbnQgb2JqZWN0ICovXG4gIHZhciBkb2MgPSBpc0hvc3RUeXBlKHdpbmRvdywgJ2RvY3VtZW50JykgJiYgZG9jdW1lbnQ7XG5cbiAgLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBkZWZpbmVgICovXG4gIHZhciBmcmVlRGVmaW5lID0gdHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmXG4gICAgdHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCAmJiBkZWZpbmU7XG5cbiAgLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBleHBvcnRzYCAqL1xuICB2YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzICYmXG4gICAgKHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsICYmIGdsb2JhbCA9PSBnbG9iYWwuZ2xvYmFsICYmICh3aW5kb3cgPSBnbG9iYWwpLCBleHBvcnRzKTtcblxuICAvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYHJlcXVpcmVgICovXG4gIHZhciBmcmVlUmVxdWlyZSA9IHR5cGVvZiByZXF1aXJlID09ICdmdW5jdGlvbicgJiYgcmVxdWlyZTtcblxuICAvKiogVXNlZCB0byBjcmF3bCBhbGwgcHJvcGVydGllcyByZWdhcmRsZXNzIG9mIGVudW1lcmFiaWxpdHkgKi9cbiAgdmFyIGdldEFsbEtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcztcblxuICAvKiogVXNlZCB0byBnZXQgcHJvcGVydHkgZGVzY3JpcHRvcnMgKi9cbiAgdmFyIGdldERlc2NyaXB0b3IgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yO1xuXG4gIC8qKiBVc2VkIGluIGNhc2UgYW4gb2JqZWN0IGRvZXNuJ3QgaGF2ZSBpdHMgb3duIG1ldGhvZCAqL1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuICAvKiogVXNlZCB0byBjaGVjayBpZiBhbiBvYmplY3QgaXMgZXh0ZW5zaWJsZSAqL1xuICB2YXIgaXNFeHRlbnNpYmxlID0gT2JqZWN0LmlzRXh0ZW5zaWJsZSB8fCBmdW5jdGlvbigpIHsgcmV0dXJuIHRydWU7IH07XG5cbiAgLyoqIFVzZWQgdG8gYWNjZXNzIFdhZGUgU2ltbW9ucycgTm9kZSBtaWNyb3RpbWUgbW9kdWxlICovXG4gIHZhciBtaWNyb3RpbWVPYmplY3QgPSByZXEoJ21pY3JvdGltZScpO1xuXG4gIC8qKiBVc2VkIHRvIGFjY2VzcyB0aGUgYnJvd3NlcidzIGhpZ2ggcmVzb2x1dGlvbiB0aW1lciAqL1xuICB2YXIgcGVyZk9iamVjdCA9IGlzSG9zdFR5cGUod2luZG93LCAncGVyZm9ybWFuY2UnKSAmJiBwZXJmb3JtYW5jZTtcblxuICAvKiogVXNlZCB0byBjYWxsIHRoZSBicm93c2VyJ3MgaGlnaCByZXNvbHV0aW9uIHRpbWVyICovXG4gIHZhciBwZXJmTmFtZSA9IHBlcmZPYmplY3QgJiYgKFxuICAgIHBlcmZPYmplY3Qubm93ICYmICdub3cnIHx8XG4gICAgcGVyZk9iamVjdC53ZWJraXROb3cgJiYgJ3dlYmtpdE5vdydcbiAgKTtcblxuICAvKiogVXNlZCB0byBhY2Nlc3MgTm9kZSdzIGhpZ2ggcmVzb2x1dGlvbiB0aW1lciAqL1xuICB2YXIgcHJvY2Vzc09iamVjdCA9IGlzSG9zdFR5cGUod2luZG93LCAncHJvY2VzcycpICYmIHByb2Nlc3M7XG5cbiAgLyoqIFVzZWQgdG8gY2hlY2sgaWYgYW4gb3duIHByb3BlcnR5IGlzIGVudW1lcmFibGUgKi9cbiAgdmFyIHByb3BlcnR5SXNFbnVtZXJhYmxlID0ge30ucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbiAgLyoqIFVzZWQgdG8gc2V0IHByb3BlcnR5IGRlc2NyaXB0b3JzICovXG4gIHZhciBzZXREZXNjcmlwdG9yID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xuXG4gIC8qKiBVc2VkIHRvIHJlc29sdmUgYSB2YWx1ZSdzIGludGVybmFsIFtbQ2xhc3NdXSAqL1xuICB2YXIgdG9TdHJpbmcgPSB7fS50b1N0cmluZztcblxuICAvKiogVXNlZCB0byBwcmV2ZW50IGEgYHJlbW92ZUNoaWxkYCBtZW1vcnkgbGVhayBpbiBJRSA8IDkgKi9cbiAgdmFyIHRyYXNoID0gZG9jICYmIGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAvKiogVXNlZCB0byBpbnRlZ3JpdHkgY2hlY2sgY29tcGlsZWQgdGVzdHMgKi9cbiAgdmFyIHVpZCA9ICd1aWQnICsgKCtuZXcgRGF0ZSk7XG5cbiAgLyoqIFVzZWQgdG8gYXZvaWQgaW5maW5pdGUgcmVjdXJzaW9uIHdoZW4gbWV0aG9kcyBjYWxsIGVhY2ggb3RoZXIgKi9cbiAgdmFyIGNhbGxlZEJ5ID0ge307XG5cbiAgLyoqIFVzZWQgdG8gYXZvaWQgaHogb2YgSW5maW5pdHkgKi9cbiAgdmFyIGRpdmlzb3JzID0ge1xuICAgICcxJzogNDA5NixcbiAgICAnMic6IDUxMixcbiAgICAnMyc6IDY0LFxuICAgICc0JzogOCxcbiAgICAnNSc6IDBcbiAgfTtcblxuICAvKipcbiAgICogVC1EaXN0cmlidXRpb24gdHdvLXRhaWxlZCBjcml0aWNhbCB2YWx1ZXMgZm9yIDk1JSBjb25maWRlbmNlXG4gICAqIGh0dHA6Ly93d3cuaXRsLm5pc3QuZ292L2Rpdjg5OC9oYW5kYm9vay9lZGEvc2VjdGlvbjMvZWRhMzY3Mi5odG1cbiAgICovXG4gIHZhciB0VGFibGUgPSB7XG4gICAgJzEnOiAgMTIuNzA2LCcyJzogIDQuMzAzLCAnMyc6ICAzLjE4MiwgJzQnOiAgMi43NzYsICc1JzogIDIuNTcxLCAnNic6ICAyLjQ0NyxcbiAgICAnNyc6ICAyLjM2NSwgJzgnOiAgMi4zMDYsICc5JzogIDIuMjYyLCAnMTAnOiAyLjIyOCwgJzExJzogMi4yMDEsICcxMic6IDIuMTc5LFxuICAgICcxMyc6IDIuMTYsICAnMTQnOiAyLjE0NSwgJzE1JzogMi4xMzEsICcxNic6IDIuMTIsICAnMTcnOiAyLjExLCAgJzE4JzogMi4xMDEsXG4gICAgJzE5JzogMi4wOTMsICcyMCc6IDIuMDg2LCAnMjEnOiAyLjA4LCAgJzIyJzogMi4wNzQsICcyMyc6IDIuMDY5LCAnMjQnOiAyLjA2NCxcbiAgICAnMjUnOiAyLjA2LCAgJzI2JzogMi4wNTYsICcyNyc6IDIuMDUyLCAnMjgnOiAyLjA0OCwgJzI5JzogMi4wNDUsICczMCc6IDIuMDQyLFxuICAgICdpbmZpbml0eSc6IDEuOTZcbiAgfTtcblxuICAvKipcbiAgICogQ3JpdGljYWwgTWFubi1XaGl0bmV5IFUtdmFsdWVzIGZvciA5NSUgY29uZmlkZW5jZVxuICAgKiBodHRwOi8vd3d3LnNhYnVyY2hpbGwuY29tL0lCYmlvbG9neS9zdGF0cy8wMDMuaHRtbFxuICAgKi9cbiAgdmFyIHVUYWJsZSA9IHtcbiAgICAnNSc6ICBbMCwgMSwgMl0sXG4gICAgJzYnOiAgWzEsIDIsIDMsIDVdLFxuICAgICc3JzogIFsxLCAzLCA1LCA2LCA4XSxcbiAgICAnOCc6ICBbMiwgNCwgNiwgOCwgMTAsIDEzXSxcbiAgICAnOSc6ICBbMiwgNCwgNywgMTAsIDEyLCAxNSwgMTddLFxuICAgICcxMCc6IFszLCA1LCA4LCAxMSwgMTQsIDE3LCAyMCwgMjNdLFxuICAgICcxMSc6IFszLCA2LCA5LCAxMywgMTYsIDE5LCAyMywgMjYsIDMwXSxcbiAgICAnMTInOiBbNCwgNywgMTEsIDE0LCAxOCwgMjIsIDI2LCAyOSwgMzMsIDM3XSxcbiAgICAnMTMnOiBbNCwgOCwgMTIsIDE2LCAyMCwgMjQsIDI4LCAzMywgMzcsIDQxLCA0NV0sXG4gICAgJzE0JzogWzUsIDksIDEzLCAxNywgMjIsIDI2LCAzMSwgMzYsIDQwLCA0NSwgNTAsIDU1XSxcbiAgICAnMTUnOiBbNSwgMTAsIDE0LCAxOSwgMjQsIDI5LCAzNCwgMzksIDQ0LCA0OSwgNTQsIDU5LCA2NF0sXG4gICAgJzE2JzogWzYsIDExLCAxNSwgMjEsIDI2LCAzMSwgMzcsIDQyLCA0NywgNTMsIDU5LCA2NCwgNzAsIDc1XSxcbiAgICAnMTcnOiBbNiwgMTEsIDE3LCAyMiwgMjgsIDM0LCAzOSwgNDUsIDUxLCA1NywgNjMsIDY3LCA3NSwgODEsIDg3XSxcbiAgICAnMTgnOiBbNywgMTIsIDE4LCAyNCwgMzAsIDM2LCA0MiwgNDgsIDU1LCA2MSwgNjcsIDc0LCA4MCwgODYsIDkzLCA5OV0sXG4gICAgJzE5JzogWzcsIDEzLCAxOSwgMjUsIDMyLCAzOCwgNDUsIDUyLCA1OCwgNjUsIDcyLCA3OCwgODUsIDkyLCA5OSwgMTA2LCAxMTNdLFxuICAgICcyMCc6IFs4LCAxNCwgMjAsIDI3LCAzNCwgNDEsIDQ4LCA1NSwgNjIsIDY5LCA3NiwgODMsIDkwLCA5OCwgMTA1LCAxMTIsIDExOSwgMTI3XSxcbiAgICAnMjEnOiBbOCwgMTUsIDIyLCAyOSwgMzYsIDQzLCA1MCwgNTgsIDY1LCA3MywgODAsIDg4LCA5NiwgMTAzLCAxMTEsIDExOSwgMTI2LCAxMzQsIDE0Ml0sXG4gICAgJzIyJzogWzksIDE2LCAyMywgMzAsIDM4LCA0NSwgNTMsIDYxLCA2OSwgNzcsIDg1LCA5MywgMTAxLCAxMDksIDExNywgMTI1LCAxMzMsIDE0MSwgMTUwLCAxNThdLFxuICAgICcyMyc6IFs5LCAxNywgMjQsIDMyLCA0MCwgNDgsIDU2LCA2NCwgNzMsIDgxLCA4OSwgOTgsIDEwNiwgMTE1LCAxMjMsIDEzMiwgMTQwLCAxNDksIDE1NywgMTY2LCAxNzVdLFxuICAgICcyNCc6IFsxMCwgMTcsIDI1LCAzMywgNDIsIDUwLCA1OSwgNjcsIDc2LCA4NSwgOTQsIDEwMiwgMTExLCAxMjAsIDEyOSwgMTM4LCAxNDcsIDE1NiwgMTY1LCAxNzQsIDE4MywgMTkyXSxcbiAgICAnMjUnOiBbMTAsIDE4LCAyNywgMzUsIDQ0LCA1MywgNjIsIDcxLCA4MCwgODksIDk4LCAxMDcsIDExNywgMTI2LCAxMzUsIDE0NSwgMTU0LCAxNjMsIDE3MywgMTgyLCAxOTIsIDIwMSwgMjExXSxcbiAgICAnMjYnOiBbMTEsIDE5LCAyOCwgMzcsIDQ2LCA1NSwgNjQsIDc0LCA4MywgOTMsIDEwMiwgMTEyLCAxMjIsIDEzMiwgMTQxLCAxNTEsIDE2MSwgMTcxLCAxODEsIDE5MSwgMjAwLCAyMTAsIDIyMCwgMjMwXSxcbiAgICAnMjcnOiBbMTEsIDIwLCAyOSwgMzgsIDQ4LCA1NywgNjcsIDc3LCA4NywgOTcsIDEwNywgMTE4LCAxMjUsIDEzOCwgMTQ3LCAxNTgsIDE2OCwgMTc4LCAxODgsIDE5OSwgMjA5LCAyMTksIDIzMCwgMjQwLCAyNTBdLFxuICAgICcyOCc6IFsxMiwgMjEsIDMwLCA0MCwgNTAsIDYwLCA3MCwgODAsIDkwLCAxMDEsIDExMSwgMTIyLCAxMzIsIDE0MywgMTU0LCAxNjQsIDE3NSwgMTg2LCAxOTYsIDIwNywgMjE4LCAyMjgsIDIzOSwgMjUwLCAyNjEsIDI3Ml0sXG4gICAgJzI5JzogWzEzLCAyMiwgMzIsIDQyLCA1MiwgNjIsIDczLCA4MywgOTQsIDEwNSwgMTE2LCAxMjcsIDEzOCwgMTQ5LCAxNjAsIDE3MSwgMTgyLCAxOTMsIDIwNCwgMjE1LCAyMjYsIDIzOCwgMjQ5LCAyNjAsIDI3MSwgMjgyLCAyOTRdLFxuICAgICczMCc6IFsxMywgMjMsIDMzLCA0MywgNTQsIDY1LCA3NiwgODcsIDk4LCAxMDksIDEyMCwgMTMxLCAxNDMsIDE1NCwgMTY2LCAxNzcsIDE4OSwgMjAwLCAyMTIsIDIyMywgMjM1LCAyNDcsIDI1OCwgMjcwLCAyODIsIDI5MywgMzA1LCAzMTddXG4gIH07XG5cbiAgLyoqXG4gICAqIEFuIG9iamVjdCB1c2VkIHRvIGZsYWcgZW52aXJvbm1lbnRzL2ZlYXR1cmVzLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICB2YXIgc3VwcG9ydCA9IHt9O1xuXG4gIChmdW5jdGlvbigpIHtcblxuICAgIC8qKlxuICAgICAqIERldGVjdCBBZG9iZSBBSVIuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLnN1cHBvcnRcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgc3VwcG9ydC5haXIgPSBpc0NsYXNzT2Yod2luZG93LnJ1bnRpbWUsICdTY3JpcHRCcmlkZ2luZ1Byb3h5T2JqZWN0Jyk7XG5cbiAgICAvKipcbiAgICAgKiBEZXRlY3QgaWYgYGFyZ3VtZW50c2Agb2JqZWN0cyBoYXZlIHRoZSBjb3JyZWN0IGludGVybmFsIFtbQ2xhc3NdXSB2YWx1ZS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuc3VwcG9ydFxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICBzdXBwb3J0LmFyZ3VtZW50c0NsYXNzID0gaXNDbGFzc09mKGFyZ3VtZW50cywgJ0FyZ3VtZW50cycpO1xuXG4gICAgLyoqXG4gICAgICogRGV0ZWN0IGlmIGluIGEgYnJvd3NlciBlbnZpcm9ubWVudC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuc3VwcG9ydFxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICBzdXBwb3J0LmJyb3dzZXIgPSBkb2MgJiYgaXNIb3N0VHlwZSh3aW5kb3csICduYXZpZ2F0b3InKTtcblxuICAgIC8qKlxuICAgICAqIERldGVjdCBpZiBzdHJpbmdzIHN1cHBvcnQgYWNjZXNzaW5nIGNoYXJhY3RlcnMgYnkgaW5kZXguXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLnN1cHBvcnRcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgc3VwcG9ydC5jaGFyQnlJbmRleCA9XG4gICAgICAvLyBJRSA4IHN1cHBvcnRzIGluZGV4ZXMgb24gc3RyaW5nIGxpdGVyYWxzIGJ1dCBub3Qgc3RyaW5nIG9iamVjdHNcbiAgICAgICgneCdbMF0gKyBPYmplY3QoJ3gnKVswXSkgPT0gJ3h4JztcblxuICAgIC8qKlxuICAgICAqIERldGVjdCBpZiBzdHJpbmdzIGhhdmUgaW5kZXhlcyBhcyBvd24gcHJvcGVydGllcy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuc3VwcG9ydFxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICBzdXBwb3J0LmNoYXJCeU93bkluZGV4ID1cbiAgICAgIC8vIE5hcndoYWwsIFJoaW5vLCBSaW5nb0pTLCBJRSA4LCBhbmQgT3BlcmEgPCAxMC41MiBzdXBwb3J0IGluZGV4ZXMgb25cbiAgICAgIC8vIHN0cmluZ3MgYnV0IGRvbid0IGRldGVjdCB0aGVtIGFzIG93biBwcm9wZXJ0aWVzXG4gICAgICBzdXBwb3J0LmNoYXJCeUluZGV4ICYmIGhhc0tleSgneCcsICcwJyk7XG5cbiAgICAvKipcbiAgICAgKiBEZXRlY3QgaWYgSmF2YSBpcyBlbmFibGVkL2V4cG9zZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLnN1cHBvcnRcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgc3VwcG9ydC5qYXZhID0gaXNDbGFzc09mKHdpbmRvdy5qYXZhLCAnSmF2YVBhY2thZ2UnKTtcblxuICAgIC8qKlxuICAgICAqIERldGVjdCBpZiB0aGUgVGltZXJzIEFQSSBleGlzdHMuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLnN1cHBvcnRcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgc3VwcG9ydC50aW1lb3V0ID0gaXNIb3N0VHlwZSh3aW5kb3csICdzZXRUaW1lb3V0JykgJiYgaXNIb3N0VHlwZSh3aW5kb3csICdjbGVhclRpbWVvdXQnKTtcblxuICAgIC8qKlxuICAgICAqIERldGVjdCBpZiBmdW5jdGlvbnMgc3VwcG9ydCBkZWNvbXBpbGF0aW9uLlxuICAgICAqXG4gICAgICogQG5hbWUgZGVjb21waWxhdGlvblxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuc3VwcG9ydFxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0cnkge1xuICAgICAgLy8gU2FmYXJpIDIueCByZW1vdmVzIGNvbW1hcyBpbiBvYmplY3QgbGl0ZXJhbHNcbiAgICAgIC8vIGZyb20gRnVuY3Rpb24jdG9TdHJpbmcgcmVzdWx0c1xuICAgICAgLy8gaHR0cDovL3dlYmsuaXQvMTE2MDlcbiAgICAgIC8vIEZpcmVmb3ggMy42IGFuZCBPcGVyYSA5LjI1IHN0cmlwIGdyb3VwaW5nXG4gICAgICAvLyBwYXJlbnRoZXNlcyBmcm9tIEZ1bmN0aW9uI3RvU3RyaW5nIHJlc3VsdHNcbiAgICAgIC8vIGh0dHA6Ly9idWd6aWwubGEvNTU5NDM4XG4gICAgICBzdXBwb3J0LmRlY29tcGlsYXRpb24gPSBGdW5jdGlvbihcbiAgICAgICAgJ3JldHVybiAoJyArIChmdW5jdGlvbih4KSB7IHJldHVybiB7ICd4JzogJycgKyAoMSArIHgpICsgJycsICd5JzogMCB9OyB9KSArICcpJ1xuICAgICAgKSgpKDApLnggPT09ICcxJztcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHN1cHBvcnQuZGVjb21waWxhdGlvbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVjdCBFUzUrIHByb3BlcnR5IGRlc2NyaXB0b3IgQVBJLlxuICAgICAqXG4gICAgICogQG5hbWUgZGVzY3JpcHRvcnNcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLnN1cHBvcnRcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdHJ5IHtcbiAgICAgIHZhciBvID0ge307XG4gICAgICBzdXBwb3J0LmRlc2NyaXB0b3JzID0gKHNldERlc2NyaXB0b3IobywgbywgbyksICd2YWx1ZScgaW4gZ2V0RGVzY3JpcHRvcihvLCBvKSk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICBzdXBwb3J0LmRlc2NyaXB0b3JzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZWN0IEVTNSsgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoKS5cbiAgICAgKlxuICAgICAqIEBuYW1lIGdldEFsbEtleXNcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLnN1cHBvcnRcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdHJ5IHtcbiAgICAgIHN1cHBvcnQuZ2V0QWxsS2V5cyA9IC9cXGJ2YWx1ZU9mXFxiLy50ZXN0KGdldEFsbEtleXMoT2JqZWN0LnByb3RvdHlwZSkpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgc3VwcG9ydC5nZXRBbGxLZXlzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZWN0IGlmIG93biBwcm9wZXJ0aWVzIGFyZSBpdGVyYXRlZCBiZWZvcmUgaW5oZXJpdGVkIHByb3BlcnRpZXMgKGFsbCBidXQgSUUgPCA5KS5cbiAgICAgKlxuICAgICAqIEBuYW1lIGl0ZXJhdGVzT3duTGFzdFxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuc3VwcG9ydFxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICBzdXBwb3J0Lml0ZXJhdGVzT3duRmlyc3QgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcHJvcHMgPSBbXTtcbiAgICAgIGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMueCA9IDE7IH1cbiAgICAgIGN0b3IucHJvdG90eXBlID0geyAneSc6IDEgfTtcbiAgICAgIGZvciAodmFyIHByb3AgaW4gbmV3IGN0b3IpIHsgcHJvcHMucHVzaChwcm9wKTsgfVxuICAgICAgcmV0dXJuIHByb3BzWzBdID09ICd4JztcbiAgICB9KCkpO1xuXG4gICAgLyoqXG4gICAgICogRGV0ZWN0IGlmIGEgbm9kZSdzIFtbQ2xhc3NdXSBpcyByZXNvbHZhYmxlIChhbGwgYnV0IElFIDwgOSlcbiAgICAgKiBhbmQgdGhhdCB0aGUgSlMgZW5naW5lIGVycm9ycyB3aGVuIGF0dGVtcHRpbmcgdG8gY29lcmNlIGFuIG9iamVjdCB0byBhXG4gICAgICogc3RyaW5nIHdpdGhvdXQgYSBgdG9TdHJpbmdgIHByb3BlcnR5IHZhbHVlIG9mIGB0eXBlb2ZgIFwiZnVuY3Rpb25cIi5cbiAgICAgKlxuICAgICAqIEBuYW1lIG5vZGVDbGFzc1xuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuc3VwcG9ydFxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0cnkge1xuICAgICAgc3VwcG9ydC5ub2RlQ2xhc3MgPSAoeyAndG9TdHJpbmcnOiAwIH0gKyAnJywgdG9TdHJpbmcuY2FsbChkb2MgfHwgMCkgIT0gJ1tvYmplY3QgT2JqZWN0XScpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgc3VwcG9ydC5ub2RlQ2xhc3MgPSB0cnVlO1xuICAgIH1cbiAgfSgpKTtcblxuICAvKipcbiAgICogVGltZXIgb2JqZWN0IHVzZWQgYnkgYGNsb2NrKClgIGFuZCBgRGVmZXJyZWQjcmVzb2x2ZWAuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEB0eXBlIE9iamVjdFxuICAgKi9cbiAgdmFyIHRpbWVyID0ge1xuXG4gICAvKipcbiAgICAqIFRoZSB0aW1lciBuYW1lc3BhY2Ugb2JqZWN0IG9yIGNvbnN0cnVjdG9yLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAbWVtYmVyT2YgdGltZXJcbiAgICAqIEB0eXBlIEZ1bmN0aW9ufE9iamVjdFxuICAgICovXG4gICAgJ25zJzogRGF0ZSxcblxuICAgLyoqXG4gICAgKiBTdGFydHMgdGhlIGRlZmVycmVkIHRpbWVyLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAbWVtYmVyT2YgdGltZXJcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZWZlcnJlZCBUaGUgZGVmZXJyZWQgaW5zdGFuY2UuXG4gICAgKi9cbiAgICAnc3RhcnQnOiBudWxsLCAvLyBsYXp5IGRlZmluZWQgaW4gYGNsb2NrKClgXG5cbiAgIC8qKlxuICAgICogU3RvcHMgdGhlIGRlZmVycmVkIHRpbWVyLlxuICAgICpcbiAgICAqIEBwcml2YXRlXG4gICAgKiBAbWVtYmVyT2YgdGltZXJcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZWZlcnJlZCBUaGUgZGVmZXJyZWQgaW5zdGFuY2UuXG4gICAgKi9cbiAgICAnc3RvcCc6IG51bGwgLy8gbGF6eSBkZWZpbmVkIGluIGBjbG9jaygpYFxuICB9O1xuXG4gIC8qKiBTaG9ydGN1dCBmb3IgaW52ZXJzZSByZXN1bHRzICovXG4gIHZhciBub0FyZ3VtZW50c0NsYXNzID0gIXN1cHBvcnQuYXJndW1lbnRzQ2xhc3MsXG4gICAgICBub0NoYXJCeUluZGV4ID0gIXN1cHBvcnQuY2hhckJ5SW5kZXgsXG4gICAgICBub0NoYXJCeU93bkluZGV4ID0gIXN1cHBvcnQuY2hhckJ5T3duSW5kZXg7XG5cbiAgLyoqIE1hdGggc2hvcnRjdXRzICovXG4gIHZhciBhYnMgICA9IE1hdGguYWJzLFxuICAgICAgZmxvb3IgPSBNYXRoLmZsb29yLFxuICAgICAgbWF4ICAgPSBNYXRoLm1heCxcbiAgICAgIG1pbiAgID0gTWF0aC5taW4sXG4gICAgICBwb3cgICA9IE1hdGgucG93LFxuICAgICAgc3FydCAgPSBNYXRoLnNxcnQ7XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLyoqXG4gICAqIFRoZSBCZW5jaG1hcmsgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBBIG5hbWUgdG8gaWRlbnRpZnkgdGhlIGJlbmNobWFyay5cbiAgICogQHBhcmFtIHtGdW5jdGlvbnxTdHJpbmd9IGZuIFRoZSB0ZXN0IHRvIGJlbmNobWFyay5cbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBPcHRpb25zIG9iamVjdC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogLy8gYmFzaWMgdXNhZ2UgKHRoZSBgbmV3YCBvcGVyYXRvciBpcyBvcHRpb25hbClcbiAgICogdmFyIGJlbmNoID0gbmV3IEJlbmNobWFyayhmbik7XG4gICAqXG4gICAqIC8vIG9yIHVzaW5nIGEgbmFtZSBmaXJzdFxuICAgKiB2YXIgYmVuY2ggPSBuZXcgQmVuY2htYXJrKCdmb28nLCBmbik7XG4gICAqXG4gICAqIC8vIG9yIHdpdGggb3B0aW9uc1xuICAgKiB2YXIgYmVuY2ggPSBuZXcgQmVuY2htYXJrKCdmb28nLCBmbiwge1xuICAgKlxuICAgKiAgIC8vIGRpc3BsYXllZCBieSBCZW5jaG1hcmsjdG9TdHJpbmcgaWYgYG5hbWVgIGlzIG5vdCBhdmFpbGFibGVcbiAgICogICAnaWQnOiAneHl6JyxcbiAgICpcbiAgICogICAvLyBjYWxsZWQgd2hlbiB0aGUgYmVuY2htYXJrIHN0YXJ0cyBydW5uaW5nXG4gICAqICAgJ29uU3RhcnQnOiBvblN0YXJ0LFxuICAgKlxuICAgKiAgIC8vIGNhbGxlZCBhZnRlciBlYWNoIHJ1biBjeWNsZVxuICAgKiAgICdvbkN5Y2xlJzogb25DeWNsZSxcbiAgICpcbiAgICogICAvLyBjYWxsZWQgd2hlbiBhYm9ydGVkXG4gICAqICAgJ29uQWJvcnQnOiBvbkFib3J0LFxuICAgKlxuICAgKiAgIC8vIGNhbGxlZCB3aGVuIGEgdGVzdCBlcnJvcnNcbiAgICogICAnb25FcnJvcic6IG9uRXJyb3IsXG4gICAqXG4gICAqICAgLy8gY2FsbGVkIHdoZW4gcmVzZXRcbiAgICogICAnb25SZXNldCc6IG9uUmVzZXQsXG4gICAqXG4gICAqICAgLy8gY2FsbGVkIHdoZW4gdGhlIGJlbmNobWFyayBjb21wbGV0ZXMgcnVubmluZ1xuICAgKiAgICdvbkNvbXBsZXRlJzogb25Db21wbGV0ZSxcbiAgICpcbiAgICogICAvLyBjb21waWxlZC9jYWxsZWQgYmVmb3JlIHRoZSB0ZXN0IGxvb3BcbiAgICogICAnc2V0dXAnOiBzZXR1cCxcbiAgICpcbiAgICogICAvLyBjb21waWxlZC9jYWxsZWQgYWZ0ZXIgdGhlIHRlc3QgbG9vcFxuICAgKiAgICd0ZWFyZG93bic6IHRlYXJkb3duXG4gICAqIH0pO1xuICAgKlxuICAgKiAvLyBvciBuYW1lIGFuZCBvcHRpb25zXG4gICAqIHZhciBiZW5jaCA9IG5ldyBCZW5jaG1hcmsoJ2ZvbycsIHtcbiAgICpcbiAgICogICAvLyBhIGZsYWcgdG8gaW5kaWNhdGUgdGhlIGJlbmNobWFyayBpcyBkZWZlcnJlZFxuICAgKiAgICdkZWZlcic6IHRydWUsXG4gICAqXG4gICAqICAgLy8gYmVuY2htYXJrIHRlc3QgZnVuY3Rpb25cbiAgICogICAnZm4nOiBmdW5jdGlvbihkZWZlcnJlZCkge1xuICAgKiAgICAgLy8gY2FsbCByZXNvbHZlKCkgd2hlbiB0aGUgZGVmZXJyZWQgdGVzdCBpcyBmaW5pc2hlZFxuICAgKiAgICAgZGVmZXJyZWQucmVzb2x2ZSgpO1xuICAgKiAgIH1cbiAgICogfSk7XG4gICAqXG4gICAqIC8vIG9yIG9wdGlvbnMgb25seVxuICAgKiB2YXIgYmVuY2ggPSBuZXcgQmVuY2htYXJrKHtcbiAgICpcbiAgICogICAvLyBiZW5jaG1hcmsgbmFtZVxuICAgKiAgICduYW1lJzogJ2ZvbycsXG4gICAqXG4gICAqICAgLy8gYmVuY2htYXJrIHRlc3QgYXMgYSBzdHJpbmdcbiAgICogICAnZm4nOiAnWzEsMiwzLDRdLnNvcnQoKSdcbiAgICogfSk7XG4gICAqXG4gICAqIC8vIGEgdGVzdCdzIGB0aGlzYCBiaW5kaW5nIGlzIHNldCB0byB0aGUgYmVuY2htYXJrIGluc3RhbmNlXG4gICAqIHZhciBiZW5jaCA9IG5ldyBCZW5jaG1hcmsoJ2ZvbycsIGZ1bmN0aW9uKCkge1xuICAgKiAgICdNeSBuYW1lIGlzICcuY29uY2F0KHRoaXMubmFtZSk7IC8vIE15IG5hbWUgaXMgZm9vXG4gICAqIH0pO1xuICAgKi9cbiAgZnVuY3Rpb24gQmVuY2htYXJrKG5hbWUsIGZuLCBvcHRpb25zKSB7XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIC8vIGFsbG93IGluc3RhbmNlIGNyZWF0aW9uIHdpdGhvdXQgdGhlIGBuZXdgIG9wZXJhdG9yXG4gICAgaWYgKG1lID09IG51bGwgfHwgbWUuY29uc3RydWN0b3IgIT0gQmVuY2htYXJrKSB7XG4gICAgICByZXR1cm4gbmV3IEJlbmNobWFyayhuYW1lLCBmbiwgb3B0aW9ucyk7XG4gICAgfVxuICAgIC8vIGp1Z2dsZSBhcmd1bWVudHNcbiAgICBpZiAoaXNDbGFzc09mKG5hbWUsICdPYmplY3QnKSkge1xuICAgICAgLy8gMSBhcmd1bWVudCAob3B0aW9ucylcbiAgICAgIG9wdGlvbnMgPSBuYW1lO1xuICAgIH1cbiAgICBlbHNlIGlmIChpc0NsYXNzT2YobmFtZSwgJ0Z1bmN0aW9uJykpIHtcbiAgICAgIC8vIDIgYXJndW1lbnRzIChmbiwgb3B0aW9ucylcbiAgICAgIG9wdGlvbnMgPSBmbjtcbiAgICAgIGZuID0gbmFtZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoaXNDbGFzc09mKGZuLCAnT2JqZWN0JykpIHtcbiAgICAgIC8vIDIgYXJndW1lbnRzIChuYW1lLCBvcHRpb25zKVxuICAgICAgb3B0aW9ucyA9IGZuO1xuICAgICAgZm4gPSBudWxsO1xuICAgICAgbWUubmFtZSA9IG5hbWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gMyBhcmd1bWVudHMgKG5hbWUsIGZuIFssIG9wdGlvbnNdKVxuICAgICAgbWUubmFtZSA9IG5hbWU7XG4gICAgfVxuICAgIHNldE9wdGlvbnMobWUsIG9wdGlvbnMpO1xuICAgIG1lLmlkIHx8IChtZS5pZCA9ICsrY291bnRlcik7XG4gICAgbWUuZm4gPT0gbnVsbCAmJiAobWUuZm4gPSBmbik7XG4gICAgbWUuc3RhdHMgPSBkZWVwQ2xvbmUobWUuc3RhdHMpO1xuICAgIG1lLnRpbWVzID0gZGVlcENsb25lKG1lLnRpbWVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgRGVmZXJyZWQgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjbG9uZSBUaGUgY2xvbmVkIGJlbmNobWFyayBpbnN0YW5jZS5cbiAgICovXG4gIGZ1bmN0aW9uIERlZmVycmVkKGNsb25lKSB7XG4gICAgdmFyIG1lID0gdGhpcztcbiAgICBpZiAobWUgPT0gbnVsbCB8fCBtZS5jb25zdHJ1Y3RvciAhPSBEZWZlcnJlZCkge1xuICAgICAgcmV0dXJuIG5ldyBEZWZlcnJlZChjbG9uZSk7XG4gICAgfVxuICAgIG1lLmJlbmNobWFyayA9IGNsb25lO1xuICAgIGNsb2NrKG1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgRXZlbnQgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gdHlwZSBUaGUgZXZlbnQgdHlwZS5cbiAgICovXG4gIGZ1bmN0aW9uIEV2ZW50KHR5cGUpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuICAgIHJldHVybiAobWUgPT0gbnVsbCB8fCBtZS5jb25zdHJ1Y3RvciAhPSBFdmVudClcbiAgICAgID8gbmV3IEV2ZW50KHR5cGUpXG4gICAgICA6ICh0eXBlIGluc3RhbmNlb2YgRXZlbnQpXG4gICAgICAgICAgPyB0eXBlXG4gICAgICAgICAgOiBleHRlbmQobWUsIHsgJ3RpbWVTdGFtcCc6ICtuZXcgRGF0ZSB9LCB0eXBlb2YgdHlwZSA9PSAnc3RyaW5nJyA/IHsgJ3R5cGUnOiB0eXBlIH0gOiB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgU3VpdGUgY29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIEEgbmFtZSB0byBpZGVudGlmeSB0aGUgc3VpdGUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gT3B0aW9ucyBvYmplY3QuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIC8vIGJhc2ljIHVzYWdlICh0aGUgYG5ld2Agb3BlcmF0b3IgaXMgb3B0aW9uYWwpXG4gICAqIHZhciBzdWl0ZSA9IG5ldyBCZW5jaG1hcmsuU3VpdGU7XG4gICAqXG4gICAqIC8vIG9yIHVzaW5nIGEgbmFtZSBmaXJzdFxuICAgKiB2YXIgc3VpdGUgPSBuZXcgQmVuY2htYXJrLlN1aXRlKCdmb28nKTtcbiAgICpcbiAgICogLy8gb3Igd2l0aCBvcHRpb25zXG4gICAqIHZhciBzdWl0ZSA9IG5ldyBCZW5jaG1hcmsuU3VpdGUoJ2ZvbycsIHtcbiAgICpcbiAgICogICAvLyBjYWxsZWQgd2hlbiB0aGUgc3VpdGUgc3RhcnRzIHJ1bm5pbmdcbiAgICogICAnb25TdGFydCc6IG9uU3RhcnQsXG4gICAqXG4gICAqICAgLy8gY2FsbGVkIGJldHdlZW4gcnVubmluZyBiZW5jaG1hcmtzXG4gICAqICAgJ29uQ3ljbGUnOiBvbkN5Y2xlLFxuICAgKlxuICAgKiAgIC8vIGNhbGxlZCB3aGVuIGFib3J0ZWRcbiAgICogICAnb25BYm9ydCc6IG9uQWJvcnQsXG4gICAqXG4gICAqICAgLy8gY2FsbGVkIHdoZW4gYSB0ZXN0IGVycm9yc1xuICAgKiAgICdvbkVycm9yJzogb25FcnJvcixcbiAgICpcbiAgICogICAvLyBjYWxsZWQgd2hlbiByZXNldFxuICAgKiAgICdvblJlc2V0Jzogb25SZXNldCxcbiAgICpcbiAgICogICAvLyBjYWxsZWQgd2hlbiB0aGUgc3VpdGUgY29tcGxldGVzIHJ1bm5pbmdcbiAgICogICAnb25Db21wbGV0ZSc6IG9uQ29tcGxldGVcbiAgICogfSk7XG4gICAqL1xuICBmdW5jdGlvbiBTdWl0ZShuYW1lLCBvcHRpb25zKSB7XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIC8vIGFsbG93IGluc3RhbmNlIGNyZWF0aW9uIHdpdGhvdXQgdGhlIGBuZXdgIG9wZXJhdG9yXG4gICAgaWYgKG1lID09IG51bGwgfHwgbWUuY29uc3RydWN0b3IgIT0gU3VpdGUpIHtcbiAgICAgIHJldHVybiBuZXcgU3VpdGUobmFtZSwgb3B0aW9ucyk7XG4gICAgfVxuICAgIC8vIGp1Z2dsZSBhcmd1bWVudHNcbiAgICBpZiAoaXNDbGFzc09mKG5hbWUsICdPYmplY3QnKSkge1xuICAgICAgLy8gMSBhcmd1bWVudCAob3B0aW9ucylcbiAgICAgIG9wdGlvbnMgPSBuYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyAyIGFyZ3VtZW50cyAobmFtZSBbLCBvcHRpb25zXSlcbiAgICAgIG1lLm5hbWUgPSBuYW1lO1xuICAgIH1cbiAgICBzZXRPcHRpb25zKG1lLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBOb3RlOiBTb21lIGFycmF5IG1ldGhvZHMgaGF2ZSBiZWVuIGltcGxlbWVudGVkIGluIHBsYWluIEphdmFTY3JpcHQgdG8gYXZvaWRcbiAgICogYnVncyBpbiBJRSwgT3BlcmEsIFJoaW5vLCBhbmQgTW9iaWxlIFNhZmFyaS5cbiAgICpcbiAgICogSUUgY29tcGF0aWJpbGl0eSBtb2RlIGFuZCBJRSA8IDkgaGF2ZSBidWdneSBBcnJheSBgc2hpZnQoKWAgYW5kIGBzcGxpY2UoKWBcbiAgICogZnVuY3Rpb25zIHRoYXQgZmFpbCB0byByZW1vdmUgdGhlIGxhc3QgZWxlbWVudCwgYG9iamVjdFswXWAsIG9mXG4gICAqIGFycmF5LWxpa2Utb2JqZWN0cyBldmVuIHRob3VnaCB0aGUgYGxlbmd0aGAgcHJvcGVydHkgaXMgc2V0IHRvIGAwYC5cbiAgICogVGhlIGBzaGlmdCgpYCBtZXRob2QgaXMgYnVnZ3kgaW4gSUUgOCBjb21wYXRpYmlsaXR5IG1vZGUsIHdoaWxlIGBzcGxpY2UoKWBcbiAgICogaXMgYnVnZ3kgcmVnYXJkbGVzcyBvZiBtb2RlIGluIElFIDwgOSBhbmQgYnVnZ3kgaW4gY29tcGF0aWJpbGl0eSBtb2RlIGluIElFIDkuXG4gICAqXG4gICAqIEluIE9wZXJhIDwgOS41MCBhbmQgc29tZSBvbGRlci9iZXRhIE1vYmlsZSBTYWZhcmkgdmVyc2lvbnMgdXNpbmcgYHVuc2hpZnQoKWBcbiAgICogZ2VuZXJpY2FsbHkgdG8gYXVnbWVudCB0aGUgYGFyZ3VtZW50c2Agb2JqZWN0IHdpbGwgcGF2ZSB0aGUgdmFsdWUgYXQgaW5kZXggMFxuICAgKiB3aXRob3V0IGluY3JpbWVudGluZyB0aGUgb3RoZXIgdmFsdWVzJ3MgaW5kZXhlcy5cbiAgICogaHR0cHM6Ly9naXRodWIuY29tL2RvY3VtZW50Y2xvdWQvdW5kZXJzY29yZS9pc3N1ZXMvOVxuICAgKlxuICAgKiBSaGlubyBhbmQgZW52aXJvbm1lbnRzIGl0IHBvd2VycywgbGlrZSBOYXJ3aGFsIGFuZCBSaW5nb0pTLCBtYXkgaGF2ZVxuICAgKiBidWdneSBBcnJheSBgY29uY2F0KClgLCBgcmV2ZXJzZSgpYCwgYHNoaWZ0KClgLCBgc2xpY2UoKWAsIGBzcGxpY2UoKWAgYW5kXG4gICAqIGB1bnNoaWZ0KClgIGZ1bmN0aW9ucyB0aGF0IG1ha2Ugc3BhcnNlIGFycmF5cyBub24tc3BhcnNlIGJ5IGFzc2lnbmluZyB0aGVcbiAgICogdW5kZWZpbmVkIGluZGV4ZXMgYSB2YWx1ZSBvZiB1bmRlZmluZWQuXG4gICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tb3ppbGxhL3JoaW5vL2NvbW1pdC83MDJhYmZlZDNmOGNhMDQzYjI2MzZlZmQzMWMxNGJhNzU1MjYwM2RkXG4gICAqL1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGVsZW1lbnRzIG9mIHRoZSBob3N0IGFycmF5IGZvbGxvd2VkIGJ5IHRoZVxuICAgKiBlbGVtZW50cyBvZiBlYWNoIGFyZ3VtZW50IGluIG9yZGVyLlxuICAgKlxuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLlN1aXRlXG4gICAqIEByZXR1cm5zIHtBcnJheX0gVGhlIG5ldyBhcnJheS5cbiAgICovXG4gIGZ1bmN0aW9uIGNvbmNhdCgpIHtcbiAgICB2YXIgdmFsdWUsXG4gICAgICAgIGogPSAtMSxcbiAgICAgICAgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgICAgICAgcmVzdWx0ID0gc2xpY2UuY2FsbCh0aGlzKSxcbiAgICAgICAgaW5kZXggPSByZXN1bHQubGVuZ3RoO1xuXG4gICAgd2hpbGUgKCsraiA8IGxlbmd0aCkge1xuICAgICAgdmFsdWUgPSBhcmd1bWVudHNbal07XG4gICAgICBpZiAoaXNDbGFzc09mKHZhbHVlLCAnQXJyYXknKSkge1xuICAgICAgICBmb3IgKHZhciBrID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgayA8IGw7IGsrKywgaW5kZXgrKykge1xuICAgICAgICAgIGlmIChrIGluIHZhbHVlKSB7XG4gICAgICAgICAgICByZXN1bHRbaW5kZXhdID0gdmFsdWVba107XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHRbaW5kZXgrK10gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVdGlsaXR5IGZ1bmN0aW9uIHVzZWQgYnkgYHNoaWZ0KClgLCBgc3BsaWNlKClgLCBhbmQgYHVuc2hpZnQoKWAuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBzdGFydCBUaGUgaW5kZXggdG8gc3RhcnQgaW5zZXJ0aW5nIGVsZW1lbnRzLlxuICAgKiBAcGFyYW0ge051bWJlcn0gZGVsZXRlQ291bnQgVGhlIG51bWJlciBvZiBlbGVtZW50cyB0byBkZWxldGUgZnJvbSB0aGUgaW5zZXJ0IHBvaW50LlxuICAgKiBAcGFyYW0ge0FycmF5fSBlbGVtZW50cyBUaGUgZWxlbWVudHMgdG8gaW5zZXJ0LlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IEFuIGFycmF5IG9mIGRlbGV0ZWQgZWxlbWVudHMuXG4gICAqL1xuICBmdW5jdGlvbiBpbnNlcnQoc3RhcnQsIGRlbGV0ZUNvdW50LCBlbGVtZW50cykge1xuICAgIC8vIGByZXN1bHRgIHNob3VsZCBoYXZlIGl0cyBsZW5ndGggc2V0IHRvIHRoZSBgZGVsZXRlQ291bnRgXG4gICAgLy8gc2VlIGh0dHBzOi8vYnVncy5lY21hc2NyaXB0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MzMyXG4gICAgdmFyIGRlbGV0ZUVuZCA9IHN0YXJ0ICsgZGVsZXRlQ291bnQsXG4gICAgICAgIGVsZW1lbnRDb3VudCA9IGVsZW1lbnRzID8gZWxlbWVudHMubGVuZ3RoIDogMCxcbiAgICAgICAgaW5kZXggPSBzdGFydCAtIDEsXG4gICAgICAgIGxlbmd0aCA9IHN0YXJ0ICsgZWxlbWVudENvdW50LFxuICAgICAgICBvYmplY3QgPSB0aGlzLFxuICAgICAgICByZXN1bHQgPSBBcnJheShkZWxldGVDb3VudCksXG4gICAgICAgIHRhaWwgPSBzbGljZS5jYWxsKG9iamVjdCwgZGVsZXRlRW5kKTtcblxuICAgIC8vIGRlbGV0ZSBlbGVtZW50cyBmcm9tIHRoZSBhcnJheVxuICAgIHdoaWxlICgrK2luZGV4IDwgZGVsZXRlRW5kKSB7XG4gICAgICBpZiAoaW5kZXggaW4gb2JqZWN0KSB7XG4gICAgICAgIHJlc3VsdFtpbmRleCAtIHN0YXJ0XSA9IG9iamVjdFtpbmRleF07XG4gICAgICAgIGRlbGV0ZSBvYmplY3RbaW5kZXhdO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBpbnNlcnQgZWxlbWVudHNcbiAgICBpbmRleCA9IHN0YXJ0IC0gMTtcbiAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgb2JqZWN0W2luZGV4XSA9IGVsZW1lbnRzW2luZGV4IC0gc3RhcnRdO1xuICAgIH1cbiAgICAvLyBhcHBlbmQgdGFpbCBlbGVtZW50c1xuICAgIHN0YXJ0ID0gaW5kZXgtLTtcbiAgICBsZW5ndGggPSBtYXgoMCwgKG9iamVjdC5sZW5ndGggPj4+IDApIC0gZGVsZXRlQ291bnQgKyBlbGVtZW50Q291bnQpO1xuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBpZiAoKGluZGV4IC0gc3RhcnQpIGluIHRhaWwpIHtcbiAgICAgICAgb2JqZWN0W2luZGV4XSA9IHRhaWxbaW5kZXggLSBzdGFydF07XG4gICAgICB9IGVsc2UgaWYgKGluZGV4IGluIG9iamVjdCkge1xuICAgICAgICBkZWxldGUgb2JqZWN0W2luZGV4XTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gZGVsZXRlIGV4Y2VzcyBlbGVtZW50c1xuICAgIGRlbGV0ZUNvdW50ID0gZGVsZXRlQ291bnQgPiBlbGVtZW50Q291bnQgPyBkZWxldGVDb3VudCAtIGVsZW1lbnRDb3VudCA6IDA7XG4gICAgd2hpbGUgKGRlbGV0ZUNvdW50LS0pIHtcbiAgICAgIGluZGV4ID0gbGVuZ3RoICsgZGVsZXRlQ291bnQ7XG4gICAgICBpZiAoaW5kZXggaW4gb2JqZWN0KSB7XG4gICAgICAgIGRlbGV0ZSBvYmplY3RbaW5kZXhdO1xuICAgICAgfVxuICAgIH1cbiAgICBvYmplY3QubGVuZ3RoID0gbGVuZ3RoO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogUmVhcnJhbmdlIHRoZSBob3N0IGFycmF5J3MgZWxlbWVudHMgaW4gcmV2ZXJzZSBvcmRlci5cbiAgICpcbiAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSByZXZlcnNlZCBhcnJheS5cbiAgICovXG4gIGZ1bmN0aW9uIHJldmVyc2UoKSB7XG4gICAgdmFyIHVwcGVySW5kZXgsXG4gICAgICAgIHZhbHVlLFxuICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICBvYmplY3QgPSBPYmplY3QodGhpcyksXG4gICAgICAgIGxlbmd0aCA9IG9iamVjdC5sZW5ndGggPj4+IDAsXG4gICAgICAgIG1pZGRsZSA9IGZsb29yKGxlbmd0aCAvIDIpO1xuXG4gICAgaWYgKGxlbmd0aCA+IDEpIHtcbiAgICAgIHdoaWxlICgrK2luZGV4IDwgbWlkZGxlKSB7XG4gICAgICAgIHVwcGVySW5kZXggPSBsZW5ndGggLSBpbmRleCAtIDE7XG4gICAgICAgIHZhbHVlID0gdXBwZXJJbmRleCBpbiBvYmplY3QgPyBvYmplY3RbdXBwZXJJbmRleF0gOiB1aWQ7XG4gICAgICAgIGlmIChpbmRleCBpbiBvYmplY3QpIHtcbiAgICAgICAgICBvYmplY3RbdXBwZXJJbmRleF0gPSBvYmplY3RbaW5kZXhdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlbGV0ZSBvYmplY3RbdXBwZXJJbmRleF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbHVlICE9IHVpZCkge1xuICAgICAgICAgIG9iamVjdFtpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkZWxldGUgb2JqZWN0W2luZGV4XTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgdGhlIGZpcnN0IGVsZW1lbnQgb2YgdGhlIGhvc3QgYXJyYXkgYW5kIHJldHVybnMgaXQuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuU3VpdGVcbiAgICogQHJldHVybnMge01peGVkfSBUaGUgZmlyc3QgZWxlbWVudCBvZiB0aGUgYXJyYXkuXG4gICAqL1xuICBmdW5jdGlvbiBzaGlmdCgpIHtcbiAgICByZXR1cm4gaW5zZXJ0LmNhbGwodGhpcywgMCwgMSlbMF07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBhcnJheSBvZiB0aGUgaG9zdCBhcnJheSdzIGVsZW1lbnRzIGZyb20gdGhlIHN0YXJ0IGluZGV4IHVwIHRvLFxuICAgKiBidXQgbm90IGluY2x1ZGluZywgdGhlIGVuZCBpbmRleC5cbiAgICpcbiAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgKiBAcGFyYW0ge051bWJlcn0gc3RhcnQgVGhlIHN0YXJ0aW5nIGluZGV4LlxuICAgKiBAcGFyYW0ge051bWJlcn0gZW5kIFRoZSBlbmQgaW5kZXguXG4gICAqIEByZXR1cm5zIHtBcnJheX0gVGhlIG5ldyBhcnJheS5cbiAgICovXG4gIGZ1bmN0aW9uIHNsaWNlKHN0YXJ0LCBlbmQpIHtcbiAgICB2YXIgaW5kZXggPSAtMSxcbiAgICAgICAgb2JqZWN0ID0gT2JqZWN0KHRoaXMpLFxuICAgICAgICBsZW5ndGggPSBvYmplY3QubGVuZ3RoID4+PiAwLFxuICAgICAgICByZXN1bHQgPSBbXTtcblxuICAgIHN0YXJ0ID0gdG9JbnRlZ2VyKHN0YXJ0KTtcbiAgICBzdGFydCA9IHN0YXJ0IDwgMCA/IG1heChsZW5ndGggKyBzdGFydCwgMCkgOiBtaW4oc3RhcnQsIGxlbmd0aCk7XG4gICAgc3RhcnQtLTtcbiAgICBlbmQgPSBlbmQgPT0gbnVsbCA/IGxlbmd0aCA6IHRvSW50ZWdlcihlbmQpO1xuICAgIGVuZCA9IGVuZCA8IDAgPyBtYXgobGVuZ3RoICsgZW5kLCAwKSA6IG1pbihlbmQsIGxlbmd0aCk7XG5cbiAgICB3aGlsZSAoKCsraW5kZXgsICsrc3RhcnQpIDwgZW5kKSB7XG4gICAgICBpZiAoc3RhcnQgaW4gb2JqZWN0KSB7XG4gICAgICAgIHJlc3VsdFtpbmRleF0gPSBvYmplY3Rbc3RhcnRdO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEFsbG93cyByZW1vdmluZyBhIHJhbmdlIG9mIGVsZW1lbnRzIGFuZC9vciBpbnNlcnRpbmcgZWxlbWVudHMgaW50byB0aGVcbiAgICogaG9zdCBhcnJheS5cbiAgICpcbiAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgKiBAcGFyYW0ge051bWJlcn0gc3RhcnQgVGhlIHN0YXJ0IGluZGV4LlxuICAgKiBAcGFyYW0ge051bWJlcn0gZGVsZXRlQ291bnQgVGhlIG51bWJlciBvZiBlbGVtZW50cyB0byBkZWxldGUuXG4gICAqIEBwYXJhbSB7TWl4ZWR9IFt2YWwxLCB2YWwyLCAuLi5dIHZhbHVlcyB0byBpbnNlcnQgYXQgdGhlIGBzdGFydGAgaW5kZXguXG4gICAqIEByZXR1cm5zIHtBcnJheX0gQW4gYXJyYXkgb2YgcmVtb3ZlZCBlbGVtZW50cy5cbiAgICovXG4gIGZ1bmN0aW9uIHNwbGljZShzdGFydCwgZGVsZXRlQ291bnQpIHtcbiAgICB2YXIgb2JqZWN0ID0gT2JqZWN0KHRoaXMpLFxuICAgICAgICBsZW5ndGggPSBvYmplY3QubGVuZ3RoID4+PiAwO1xuXG4gICAgc3RhcnQgPSB0b0ludGVnZXIoc3RhcnQpO1xuICAgIHN0YXJ0ID0gc3RhcnQgPCAwID8gbWF4KGxlbmd0aCArIHN0YXJ0LCAwKSA6IG1pbihzdGFydCwgbGVuZ3RoKTtcblxuICAgIC8vIHN1cHBvcnQgdGhlIGRlLWZhY3RvIFNwaWRlck1vbmtleSBleHRlbnNpb25cbiAgICAvLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9zcGxpY2UjUGFyYW1ldGVyc1xuICAgIC8vIGh0dHBzOi8vYnVncy5lY21hc2NyaXB0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NDI5XG4gICAgZGVsZXRlQ291bnQgPSBhcmd1bWVudHMubGVuZ3RoID09IDFcbiAgICAgID8gbGVuZ3RoIC0gc3RhcnRcbiAgICAgIDogbWluKG1heCh0b0ludGVnZXIoZGVsZXRlQ291bnQpLCAwKSwgbGVuZ3RoIC0gc3RhcnQpO1xuXG4gICAgcmV0dXJuIGluc2VydC5jYWxsKG9iamVjdCwgc3RhcnQsIGRlbGV0ZUNvdW50LCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMikpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBzcGVjaWZpZWQgYHZhbHVlYCB0byBhbiBpbnRlZ2VyLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29udmVydC5cbiAgICogQHJldHVybnMge051bWJlcn0gVGhlIHJlc3VsdGluZyBpbnRlZ2VyLlxuICAgKi9cbiAgZnVuY3Rpb24gdG9JbnRlZ2VyKHZhbHVlKSB7XG4gICAgdmFsdWUgPSArdmFsdWU7XG4gICAgcmV0dXJuIHZhbHVlID09PSAwIHx8ICFpc0Zpbml0ZSh2YWx1ZSkgPyB2YWx1ZSB8fCAwIDogdmFsdWUgLSAodmFsdWUgJSAxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBlbmRzIGFyZ3VtZW50cyB0byB0aGUgaG9zdCBhcnJheS5cbiAgICpcbiAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbmV3IGxlbmd0aC5cbiAgICovXG4gIGZ1bmN0aW9uIHVuc2hpZnQoKSB7XG4gICAgdmFyIG9iamVjdCA9IE9iamVjdCh0aGlzKTtcbiAgICBpbnNlcnQuY2FsbChvYmplY3QsIDAsIDAsIGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIG9iamVjdC5sZW5ndGg7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogQSBnZW5lcmljIGBGdW5jdGlvbiNiaW5kYCBsaWtlIG1ldGhvZC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGJvdW5kIHRvIGB0aGlzQXJnYC5cbiAgICogQHBhcmFtIHtNaXhlZH0gdGhpc0FyZyBUaGUgYHRoaXNgIGJpbmRpbmcgZm9yIHRoZSBnaXZlbiBmdW5jdGlvbi5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBUaGUgYm91bmQgZnVuY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiBiaW5kKGZuLCB0aGlzQXJnKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkgeyBmbi5hcHBseSh0aGlzQXJnLCBhcmd1bWVudHMpOyB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmdW5jdGlvbiBmcm9tIHRoZSBnaXZlbiBhcmd1bWVudHMgc3RyaW5nIGFuZCBib2R5LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gYXJncyBUaGUgY29tbWEgc2VwYXJhdGVkIGZ1bmN0aW9uIGFyZ3VtZW50cy5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGJvZHkgVGhlIGZ1bmN0aW9uIGJvZHkuXG4gICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gVGhlIG5ldyBmdW5jdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIGNyZWF0ZUZ1bmN0aW9uKCkge1xuICAgIC8vIGxhenkgZGVmaW5lXG4gICAgY3JlYXRlRnVuY3Rpb24gPSBmdW5jdGlvbihhcmdzLCBib2R5KSB7XG4gICAgICB2YXIgcmVzdWx0LFxuICAgICAgICAgIGFuY2hvciA9IGZyZWVEZWZpbmUgPyBkZWZpbmUuYW1kIDogQmVuY2htYXJrLFxuICAgICAgICAgIHByb3AgPSB1aWQgKyAnY3JlYXRlRnVuY3Rpb24nO1xuXG4gICAgICBydW5TY3JpcHQoKGZyZWVEZWZpbmUgPyAnZGVmaW5lLmFtZC4nIDogJ0JlbmNobWFyay4nKSArIHByb3AgKyAnPWZ1bmN0aW9uKCcgKyBhcmdzICsgJyl7JyArIGJvZHkgKyAnfScpO1xuICAgICAgcmVzdWx0ID0gYW5jaG9yW3Byb3BdO1xuICAgICAgZGVsZXRlIGFuY2hvcltwcm9wXTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICAvLyBmaXggSmFlZ2VyTW9ua2V5IGJ1Z1xuICAgIC8vIGh0dHA6Ly9idWd6aWwubGEvNjM5NzIwXG4gICAgY3JlYXRlRnVuY3Rpb24gPSBzdXBwb3J0LmJyb3dzZXIgJiYgKGNyZWF0ZUZ1bmN0aW9uKCcnLCAncmV0dXJuXCInICsgdWlkICsgJ1wiJykgfHwgbm9vcCkoKSA9PSB1aWQgPyBjcmVhdGVGdW5jdGlvbiA6IEZ1bmN0aW9uO1xuICAgIHJldHVybiBjcmVhdGVGdW5jdGlvbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGF5IHRoZSBleGVjdXRpb24gb2YgYSBmdW5jdGlvbiBiYXNlZCBvbiB0aGUgYmVuY2htYXJrJ3MgYGRlbGF5YCBwcm9wZXJ0eS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGJlbmNoIFRoZSBiZW5jaG1hcmsgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmbiBUaGUgZnVuY3Rpb24gdG8gZXhlY3V0ZS5cbiAgICovXG4gIGZ1bmN0aW9uIGRlbGF5KGJlbmNoLCBmbikge1xuICAgIGJlbmNoLl90aW1lcklkID0gc2V0VGltZW91dChmbiwgYmVuY2guZGVsYXkgKiAxZTMpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBnaXZlbiBlbGVtZW50LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gZGVzdHJveS5cbiAgICovXG4gIGZ1bmN0aW9uIGRlc3Ryb3lFbGVtZW50KGVsZW1lbnQpIHtcbiAgICB0cmFzaC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICB0cmFzaC5pbm5lckhUTUwgPSAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBJdGVyYXRlcyBvdmVyIGFuIG9iamVjdCdzIHByb3BlcnRpZXMsIGV4ZWN1dGluZyB0aGUgYGNhbGxiYWNrYCBmb3IgZWFjaC5cbiAgICogQ2FsbGJhY2tzIG1heSB0ZXJtaW5hdGUgdGhlIGxvb3AgYnkgZXhwbGljaXRseSByZXR1cm5pbmcgYGZhbHNlYC5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIGV4ZWN1dGVkIHBlciBvd24gcHJvcGVydHkuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zIG9iamVjdC5cbiAgICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgb2JqZWN0IGl0ZXJhdGVkIG92ZXIuXG4gICAqL1xuICBmdW5jdGlvbiBmb3JQcm9wcygpIHtcbiAgICB2YXIgZm9yU2hhZG93ZWQsXG4gICAgICAgIHNraXBTZWVuLFxuICAgICAgICBmb3JBcmdzID0gdHJ1ZSxcbiAgICAgICAgc2hhZG93ZWQgPSBbJ2NvbnN0cnVjdG9yJywgJ2hhc093blByb3BlcnR5JywgJ2lzUHJvdG90eXBlT2YnLCAncHJvcGVydHlJc0VudW1lcmFibGUnLCAndG9Mb2NhbGVTdHJpbmcnLCAndG9TdHJpbmcnLCAndmFsdWVPZiddO1xuXG4gICAgKGZ1bmN0aW9uKGVudW1GbGFnLCBrZXkpIHtcbiAgICAgIC8vIG11c3QgdXNlIGEgbm9uLW5hdGl2ZSBjb25zdHJ1Y3RvciB0byBjYXRjaCB0aGUgU2FmYXJpIDIgaXNzdWVcbiAgICAgIGZ1bmN0aW9uIEtsYXNzKCkgeyB0aGlzLnZhbHVlT2YgPSAwOyB9O1xuICAgICAgS2xhc3MucHJvdG90eXBlLnZhbHVlT2YgPSAwO1xuICAgICAgLy8gY2hlY2sgdmFyaW91cyBmb3ItaW4gYnVnc1xuICAgICAgZm9yIChrZXkgaW4gbmV3IEtsYXNzKSB7XG4gICAgICAgIGVudW1GbGFnICs9IGtleSA9PSAndmFsdWVPZicgPyAxIDogMDtcbiAgICAgIH1cbiAgICAgIC8vIGNoZWNrIGlmIGBhcmd1bWVudHNgIG9iamVjdHMgaGF2ZSBub24tZW51bWVyYWJsZSBpbmRleGVzXG4gICAgICBmb3IgKGtleSBpbiBhcmd1bWVudHMpIHtcbiAgICAgICAga2V5ID09ICcwJyAmJiAoZm9yQXJncyA9IGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIC8vIFNhZmFyaSAyIGl0ZXJhdGVzIG92ZXIgc2hhZG93ZWQgcHJvcGVydGllcyB0d2ljZVxuICAgICAgLy8gaHR0cDovL3JlcGxheS53YXliYWNrbWFjaGluZS5vcmcvMjAwOTA0MjgyMjI5NDEvaHR0cDovL3RvYmllbGFuZ2VsLmNvbS8yMDA3LzEvMjkvZm9yLWluLWxvb3AtYnJva2VuLWluLXNhZmFyaS9cbiAgICAgIHNraXBTZWVuID0gZW51bUZsYWcgPT0gMjtcbiAgICAgIC8vIElFIDwgOSBpbmNvcnJlY3RseSBtYWtlcyBhbiBvYmplY3QncyBwcm9wZXJ0aWVzIG5vbi1lbnVtZXJhYmxlIGlmIHRoZXkgaGF2ZVxuICAgICAgLy8gdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGluIGl0cyBwcm90b3R5cGUgY2hhaW4uXG4gICAgICBmb3JTaGFkb3dlZCA9ICFlbnVtRmxhZztcbiAgICB9KDApKTtcblxuICAgIC8vIGxhenkgZGVmaW5lXG4gICAgZm9yUHJvcHMgPSBmdW5jdGlvbihvYmplY3QsIGNhbGxiYWNrLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgICB2YXIgcmVzdWx0ID0gb2JqZWN0O1xuICAgICAgb2JqZWN0ID0gT2JqZWN0KG9iamVjdCk7XG5cbiAgICAgIHZhciBjdG9yLFxuICAgICAgICAgIGtleSxcbiAgICAgICAgICBrZXlzLFxuICAgICAgICAgIHNraXBDdG9yLFxuICAgICAgICAgIGRvbmUgPSAhcmVzdWx0LFxuICAgICAgICAgIHdoaWNoID0gb3B0aW9ucy53aGljaCxcbiAgICAgICAgICBhbGxGbGFnID0gd2hpY2ggPT0gJ2FsbCcsXG4gICAgICAgICAgaW5kZXggPSAtMSxcbiAgICAgICAgICBpdGVyYXRlZSA9IG9iamVjdCxcbiAgICAgICAgICBsZW5ndGggPSBvYmplY3QubGVuZ3RoLFxuICAgICAgICAgIG93bkZsYWcgPSBhbGxGbGFnIHx8IHdoaWNoID09ICdvd24nLFxuICAgICAgICAgIHNlZW4gPSB7fSxcbiAgICAgICAgICBza2lwUHJvdG8gPSBpc0NsYXNzT2Yob2JqZWN0LCAnRnVuY3Rpb24nKSxcbiAgICAgICAgICB0aGlzQXJnID0gb3B0aW9ucy5iaW5kO1xuXG4gICAgICBpZiAodGhpc0FyZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNhbGxiYWNrID0gYmluZChjYWxsYmFjaywgdGhpc0FyZyk7XG4gICAgICB9XG4gICAgICAvLyBpdGVyYXRlIGFsbCBwcm9wZXJ0aWVzXG4gICAgICBpZiAoYWxsRmxhZyAmJiBzdXBwb3J0LmdldEFsbEtleXMpIHtcbiAgICAgICAgZm9yIChpbmRleCA9IDAsIGtleXMgPSBnZXRBbGxLZXlzKG9iamVjdCksIGxlbmd0aCA9IGtleXMubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgIGtleSA9IGtleXNbaW5kZXhdO1xuICAgICAgICAgIGlmIChjYWxsYmFjayhvYmplY3Rba2V5XSwga2V5LCBvYmplY3QpID09PSBmYWxzZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBlbHNlIGl0ZXJhdGUgb25seSBlbnVtZXJhYmxlIHByb3BlcnRpZXNcbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3IgKGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgICAvLyBGaXJlZm94IDwgMy42LCBPcGVyYSA+IDkuNTAgLSBPcGVyYSA8IDExLjYwLCBhbmQgU2FmYXJpIDwgNS4xXG4gICAgICAgICAgLy8gKGlmIHRoZSBwcm90b3R5cGUgb3IgYSBwcm9wZXJ0eSBvbiB0aGUgcHJvdG90eXBlIGhhcyBiZWVuIHNldClcbiAgICAgICAgICAvLyBpbmNvcnJlY3RseSBzZXQgYSBmdW5jdGlvbidzIGBwcm90b3R5cGVgIHByb3BlcnR5IFtbRW51bWVyYWJsZV1dIHZhbHVlXG4gICAgICAgICAgLy8gdG8gYHRydWVgLiBCZWNhdXNlIG9mIHRoaXMgd2Ugc3RhbmRhcmRpemUgb24gc2tpcHBpbmcgdGhlIGBwcm90b3R5cGVgXG4gICAgICAgICAgLy8gcHJvcGVydHkgb2YgZnVuY3Rpb25zIHJlZ2FyZGxlc3Mgb2YgdGhlaXIgW1tFbnVtZXJhYmxlXV0gdmFsdWUuXG4gICAgICAgICAgaWYgKChkb25lID1cbiAgICAgICAgICAgICAgIShza2lwUHJvdG8gJiYga2V5ID09ICdwcm90b3R5cGUnKSAmJlxuICAgICAgICAgICAgICAhKHNraXBTZWVuICYmIChoYXNLZXkoc2Vlbiwga2V5KSB8fCAhKHNlZW5ba2V5XSA9IHRydWUpKSkgJiZcbiAgICAgICAgICAgICAgKCFvd25GbGFnIHx8IG93bkZsYWcgJiYgaGFzS2V5KG9iamVjdCwga2V5KSkgJiZcbiAgICAgICAgICAgICAgY2FsbGJhY2sob2JqZWN0W2tleV0sIGtleSwgb2JqZWN0KSA9PT0gZmFsc2UpKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW4gSUUgPCA5IHN0cmluZ3MgZG9uJ3Qgc3VwcG9ydCBhY2Nlc3NpbmcgY2hhcmFjdGVycyBieSBpbmRleFxuICAgICAgICBpZiAoIWRvbmUgJiYgKGZvckFyZ3MgJiYgaXNBcmd1bWVudHMob2JqZWN0KSB8fFxuICAgICAgICAgICAgKChub0NoYXJCeUluZGV4IHx8IG5vQ2hhckJ5T3duSW5kZXgpICYmIGlzQ2xhc3NPZihvYmplY3QsICdTdHJpbmcnKSAmJlxuICAgICAgICAgICAgICAoaXRlcmF0ZWUgPSBub0NoYXJCeUluZGV4ID8gb2JqZWN0LnNwbGl0KCcnKSA6IG9iamVjdCkpKSkge1xuICAgICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoKGRvbmUgPVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGl0ZXJhdGVlW2luZGV4XSwgU3RyaW5nKGluZGV4KSwgb2JqZWN0KSA9PT0gZmFsc2UpKSB7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWRvbmUgJiYgZm9yU2hhZG93ZWQpIHtcbiAgICAgICAgICAvLyBCZWNhdXNlIElFIDwgOSBjYW4ndCBzZXQgdGhlIGBbW0VudW1lcmFibGVdXWAgYXR0cmlidXRlIG9mIGFuIGV4aXN0aW5nXG4gICAgICAgICAgLy8gcHJvcGVydHkgYW5kIHRoZSBgY29uc3RydWN0b3JgIHByb3BlcnR5IG9mIGEgcHJvdG90eXBlIGRlZmF1bHRzIHRvXG4gICAgICAgICAgLy8gbm9uLWVudW1lcmFibGUsIHdlIG1hbnVhbGx5IHNraXAgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgd2hlbiB3ZVxuICAgICAgICAgIC8vIHRoaW5rIHdlIGFyZSBpdGVyYXRpbmcgb3ZlciBhIGBwcm90b3R5cGVgIG9iamVjdC5cbiAgICAgICAgICBjdG9yID0gb2JqZWN0LmNvbnN0cnVjdG9yO1xuICAgICAgICAgIHNraXBDdG9yID0gY3RvciAmJiBjdG9yLnByb3RvdHlwZSAmJiBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9PT0gY3RvcjtcbiAgICAgICAgICBmb3IgKGluZGV4ID0gMDsgaW5kZXggPCA3OyBpbmRleCsrKSB7XG4gICAgICAgICAgICBrZXkgPSBzaGFkb3dlZFtpbmRleF07XG4gICAgICAgICAgICBpZiAoIShza2lwQ3RvciAmJiBrZXkgPT0gJ2NvbnN0cnVjdG9yJykgJiZcbiAgICAgICAgICAgICAgICBoYXNLZXkob2JqZWN0LCBrZXkpICYmXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sob2JqZWN0W2tleV0sIGtleSwgb2JqZWN0KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIGZvclByb3BzLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgZmlyc3QgYXJndW1lbnQgZnJvbSBhIGZ1bmN0aW9uJ3Mgc291cmNlLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24uXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBhcmd1bWVudCBuYW1lLlxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0Rmlyc3RBcmd1bWVudChmbikge1xuICAgIHJldHVybiAoIWhhc0tleShmbiwgJ3RvU3RyaW5nJykgJiZcbiAgICAgICgvXltcXHMoXSpmdW5jdGlvblteKF0qXFwoKFteXFxzLCldKykvLmV4ZWMoZm4pIHx8IDApWzFdKSB8fCAnJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlcyB0aGUgYXJpdGhtZXRpYyBtZWFuIG9mIGEgc2FtcGxlLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0FycmF5fSBzYW1wbGUgVGhlIHNhbXBsZS5cbiAgICogQHJldHVybnMge051bWJlcn0gVGhlIG1lYW4uXG4gICAqL1xuICBmdW5jdGlvbiBnZXRNZWFuKHNhbXBsZSkge1xuICAgIHJldHVybiByZWR1Y2Uoc2FtcGxlLCBmdW5jdGlvbihzdW0sIHgpIHtcbiAgICAgIHJldHVybiBzdW0gKyB4O1xuICAgIH0pIC8gc2FtcGxlLmxlbmd0aCB8fCAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNvdXJjZSBjb2RlIG9mIGEgZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGFsdFNvdXJjZSBBIHN0cmluZyB1c2VkIHdoZW4gYSBmdW5jdGlvbidzIHNvdXJjZSBjb2RlIGlzIHVucmV0cmlldmFibGUuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBmdW5jdGlvbidzIHNvdXJjZSBjb2RlLlxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0U291cmNlKGZuLCBhbHRTb3VyY2UpIHtcbiAgICB2YXIgcmVzdWx0ID0gYWx0U291cmNlO1xuICAgIGlmIChpc1N0cmluZ2FibGUoZm4pKSB7XG4gICAgICByZXN1bHQgPSBTdHJpbmcoZm4pO1xuICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5kZWNvbXBpbGF0aW9uKSB7XG4gICAgICAvLyBlc2NhcGUgdGhlIGB7YCBmb3IgRmlyZWZveCAxXG4gICAgICByZXN1bHQgPSAoL15bXntdK1xceyhbXFxzXFxTXSopfVxccyokLy5leGVjKGZuKSB8fCAwKVsxXTtcbiAgICB9XG4gICAgLy8gdHJpbSBzdHJpbmdcbiAgICByZXN1bHQgPSAocmVzdWx0IHx8ICcnKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG5cbiAgICAvLyBkZXRlY3Qgc3RyaW5ncyBjb250YWluaW5nIG9ubHkgdGhlIFwidXNlIHN0cmljdFwiIGRpcmVjdGl2ZVxuICAgIHJldHVybiAvXig/OlxcL1xcKitbXFx3fFxcV10qP1xcKlxcL3xcXC9cXC8uKj9bXFxuXFxyXFx1MjAyOFxcdTIwMjldfFxccykqKFtcIiddKXVzZSBzdHJpY3RcXDE7PyQvLnRlc3QocmVzdWx0KVxuICAgICAgPyAnJ1xuICAgICAgOiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgdmFsdWUgaXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWUgaXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gICAqL1xuICBmdW5jdGlvbiBpc0FyZ3VtZW50cygpIHtcbiAgICAvLyBsYXp5IGRlZmluZVxuICAgIGlzQXJndW1lbnRzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbiAgICB9O1xuICAgIGlmIChub0FyZ3VtZW50c0NsYXNzKSB7XG4gICAgICBpc0FyZ3VtZW50cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBoYXNLZXkodmFsdWUsICdjYWxsZWUnKSAmJlxuICAgICAgICAgICEocHJvcGVydHlJc0VudW1lcmFibGUgJiYgcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpKTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBpc0FyZ3VtZW50cyhhcmd1bWVudHNbMF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiBvYmplY3QgaXMgb2YgdGhlIHNwZWNpZmllZCBjbGFzcy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgY2xhc3MuXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWUgaXMgb2YgdGhlIHNwZWNpZmllZCBjbGFzcywgZWxzZSBgZmFsc2VgLlxuICAgKi9cbiAgZnVuY3Rpb24gaXNDbGFzc09mKHZhbHVlLCBuYW1lKSB7XG4gICAgcmV0dXJuIHZhbHVlICE9IG51bGwgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gJ1tvYmplY3QgJyArIG5hbWUgKyAnXSc7XG4gIH1cblxuICAvKipcbiAgICogSG9zdCBvYmplY3RzIGNhbiByZXR1cm4gdHlwZSB2YWx1ZXMgdGhhdCBhcmUgZGlmZmVyZW50IGZyb20gdGhlaXIgYWN0dWFsXG4gICAqIGRhdGEgdHlwZS4gVGhlIG9iamVjdHMgd2UgYXJlIGNvbmNlcm5lZCB3aXRoIHVzdWFsbHkgcmV0dXJuIG5vbi1wcmltaXRpdmVcbiAgICogdHlwZXMgb2Ygb2JqZWN0LCBmdW5jdGlvbiwgb3IgdW5rbm93bi5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtNaXhlZH0gb2JqZWN0IFRoZSBvd25lciBvZiB0aGUgcHJvcGVydHkuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBUaGUgcHJvcGVydHkgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgcHJvcGVydHkgdmFsdWUgaXMgYSBub24tcHJpbWl0aXZlLCBlbHNlIGBmYWxzZWAuXG4gICAqL1xuICBmdW5jdGlvbiBpc0hvc3RUeXBlKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICB2YXIgdHlwZSA9IG9iamVjdCAhPSBudWxsID8gdHlwZW9mIG9iamVjdFtwcm9wZXJ0eV0gOiAnbnVtYmVyJztcbiAgICByZXR1cm4gIS9eKD86Ym9vbGVhbnxudW1iZXJ8c3RyaW5nfHVuZGVmaW5lZCkkLy50ZXN0KHR5cGUpICYmXG4gICAgICAodHlwZSA9PSAnb2JqZWN0JyA/ICEhb2JqZWN0W3Byb3BlcnR5XSA6IHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGB2YWx1ZWAgaXMgYW4gb2JqZWN0IGNyZWF0ZWQgYnkgdGhlIGBPYmplY3RgIGNvbnN0cnVjdG9yXG4gICAqIGFzc3VtaW5nIG9iamVjdHMgY3JlYXRlZCBieSB0aGUgYE9iamVjdGAgY29uc3RydWN0b3IgaGF2ZSBubyBpbmhlcml0ZWRcbiAgICogZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGFuZCB0aGF0IHRoZXJlIGFyZSBubyBgT2JqZWN0LnByb3RvdHlwZWAgZXh0ZW5zaW9ucy5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGB2YWx1ZWAgaXMgYSBwbGFpbiBgT2JqZWN0YCBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAgICovXG4gIGZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgICAvLyBhdm9pZCBub24tb2JqZWN0cyBhbmQgZmFsc2UgcG9zaXRpdmVzIGZvciBgYXJndW1lbnRzYCBvYmplY3RzIGluIElFIDwgOVxuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICBpZiAoISh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCcpIHx8IChub0FyZ3VtZW50c0NsYXNzICYmIGlzQXJndW1lbnRzKHZhbHVlKSkpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8vIElFIDwgOSBwcmVzZW50cyBET00gbm9kZXMgYXMgYE9iamVjdGAgb2JqZWN0cyBleGNlcHQgdGhleSBoYXZlIGB0b1N0cmluZ2BcbiAgICAvLyBtZXRob2RzIHRoYXQgYXJlIGB0eXBlb2ZgIFwic3RyaW5nXCIgYW5kIHN0aWxsIGNhbiBjb2VyY2Ugbm9kZXMgdG8gc3RyaW5ncy5cbiAgICAvLyBBbHNvIGNoZWNrIHRoYXQgdGhlIGNvbnN0cnVjdG9yIGlzIGBPYmplY3RgIChpLmUuIGBPYmplY3QgaW5zdGFuY2VvZiBPYmplY3RgKVxuICAgIHZhciBjdG9yID0gdmFsdWUuY29uc3RydWN0b3I7XG4gICAgaWYgKChzdXBwb3J0Lm5vZGVDbGFzcyB8fCAhKHR5cGVvZiB2YWx1ZS50b1N0cmluZyAhPSAnZnVuY3Rpb24nICYmIHR5cGVvZiAodmFsdWUgKyAnJykgPT0gJ3N0cmluZycpKSAmJlxuICAgICAgICAoIWlzQ2xhc3NPZihjdG9yLCAnRnVuY3Rpb24nKSB8fCBjdG9yIGluc3RhbmNlb2YgY3RvcikpIHtcbiAgICAgIC8vIEluIG1vc3QgZW52aXJvbm1lbnRzIGFuIG9iamVjdCdzIG93biBwcm9wZXJ0aWVzIGFyZSBpdGVyYXRlZCBiZWZvcmVcbiAgICAgIC8vIGl0cyBpbmhlcml0ZWQgcHJvcGVydGllcy4gSWYgdGhlIGxhc3QgaXRlcmF0ZWQgcHJvcGVydHkgaXMgYW4gb2JqZWN0J3NcbiAgICAgIC8vIG93biBwcm9wZXJ0eSB0aGVuIHRoZXJlIGFyZSBubyBpbmhlcml0ZWQgZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICAgICAgaWYgKHN1cHBvcnQuaXRlcmF0ZXNPd25GaXJzdCkge1xuICAgICAgICBmb3JQcm9wcyh2YWx1ZSwgZnVuY3Rpb24oc3ViVmFsdWUsIHN1YktleSkge1xuICAgICAgICAgIHJlc3VsdCA9IHN1YktleTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN1bHQgPT09IGZhbHNlIHx8IGhhc0tleSh2YWx1ZSwgcmVzdWx0KTtcbiAgICAgIH1cbiAgICAgIC8vIElFIDwgOSBpdGVyYXRlcyBpbmhlcml0ZWQgcHJvcGVydGllcyBiZWZvcmUgb3duIHByb3BlcnRpZXMuIElmIHRoZSBmaXJzdFxuICAgICAgLy8gaXRlcmF0ZWQgcHJvcGVydHkgaXMgYW4gb2JqZWN0J3Mgb3duIHByb3BlcnR5IHRoZW4gdGhlcmUgYXJlIG5vIGluaGVyaXRlZFxuICAgICAgLy8gZW51bWVyYWJsZSBwcm9wZXJ0aWVzLlxuICAgICAgZm9yUHJvcHModmFsdWUsIGZ1bmN0aW9uKHN1YlZhbHVlLCBzdWJLZXkpIHtcbiAgICAgICAgcmVzdWx0ID0gIWhhc0tleSh2YWx1ZSwgc3ViS2V5KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzdWx0ID09PSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSB2YWx1ZSBjYW4gYmUgc2FmZWx5IGNvZXJjZWQgdG8gYSBzdHJpbmcuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZSBjYW4gYmUgY29lcmNlZCwgZWxzZSBgZmFsc2VgLlxuICAgKi9cbiAgZnVuY3Rpb24gaXNTdHJpbmdhYmxlKHZhbHVlKSB7XG4gICAgcmV0dXJuIGhhc0tleSh2YWx1ZSwgJ3RvU3RyaW5nJykgfHwgaXNDbGFzc09mKHZhbHVlLCAnU3RyaW5nJyk7XG4gIH1cblxuICAvKipcbiAgICogV3JhcHMgYSBmdW5jdGlvbiBhbmQgcGFzc2VzIGB0aGlzYCB0byB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgdGhlXG4gICAqIGZpcnN0IGFyZ3VtZW50LlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gYmUgd3JhcHBlZC5cbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBUaGUgbmV3IGZ1bmN0aW9uLlxuICAgKi9cbiAgZnVuY3Rpb24gbWV0aG9kaXplKGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFyZ3MgPSBbdGhpc107XG4gICAgICBhcmdzLnB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbm8tb3BlcmF0aW9uIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gbm9vcCgpIHtcbiAgICAvLyBubyBvcGVyYXRpb24gcGVyZm9ybWVkXG4gIH1cblxuICAvKipcbiAgICogQSB3cmFwcGVyIGFyb3VuZCByZXF1aXJlKCkgdG8gc3VwcHJlc3MgYG1vZHVsZSBtaXNzaW5nYCBlcnJvcnMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgbW9kdWxlIGlkLlxuICAgKiBAcmV0dXJucyB7TWl4ZWR9IFRoZSBleHBvcnRlZCBtb2R1bGUgb3IgYG51bGxgLlxuICAgKi9cbiAgZnVuY3Rpb24gcmVxKGlkKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZXN1bHQgPSBmcmVlRXhwb3J0cyAmJiBmcmVlUmVxdWlyZShpZCk7XG4gICAgfSBjYXRjaChlKSB7IH1cbiAgICByZXR1cm4gcmVzdWx0IHx8IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUnVucyBhIHNuaXBwZXQgb2YgSmF2YVNjcmlwdCB2aWEgc2NyaXB0IGluamVjdGlvbi5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGNvZGUgVGhlIGNvZGUgdG8gcnVuLlxuICAgKi9cbiAgZnVuY3Rpb24gcnVuU2NyaXB0KGNvZGUpIHtcbiAgICB2YXIgYW5jaG9yID0gZnJlZURlZmluZSA/IGRlZmluZS5hbWQgOiBCZW5jaG1hcmssXG4gICAgICAgIHNjcmlwdCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKSxcbiAgICAgICAgc2libGluZyA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0sXG4gICAgICAgIHBhcmVudCA9IHNpYmxpbmcucGFyZW50Tm9kZSxcbiAgICAgICAgcHJvcCA9IHVpZCArICdydW5TY3JpcHQnLFxuICAgICAgICBwcmVmaXggPSAnKCcgKyAoZnJlZURlZmluZSA/ICdkZWZpbmUuYW1kLicgOiAnQmVuY2htYXJrLicpICsgcHJvcCArICd8fGZ1bmN0aW9uKCl7fSkoKTsnO1xuXG4gICAgLy8gRmlyZWZveCAyLjAuMC4yIGNhbm5vdCB1c2Ugc2NyaXB0IGluamVjdGlvbiBhcyBpbnRlbmRlZCBiZWNhdXNlIGl0IGV4ZWN1dGVzXG4gICAgLy8gYXN5bmNocm9ub3VzbHksIGJ1dCB0aGF0J3MgT0sgYmVjYXVzZSBzY3JpcHQgaW5qZWN0aW9uIGlzIG9ubHkgdXNlZCB0byBhdm9pZFxuICAgIC8vIHRoZSBwcmV2aW91c2x5IGNvbW1lbnRlZCBKYWVnZXJNb25rZXkgYnVnLlxuICAgIHRyeSB7XG4gICAgICAvLyByZW1vdmUgdGhlIGluc2VydGVkIHNjcmlwdCAqYmVmb3JlKiBydW5uaW5nIHRoZSBjb2RlIHRvIGF2b2lkIGRpZmZlcmVuY2VzXG4gICAgICAvLyBpbiB0aGUgZXhwZWN0ZWQgc2NyaXB0IGVsZW1lbnQgY291bnQvb3JkZXIgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgc2NyaXB0LmFwcGVuZENoaWxkKGRvYy5jcmVhdGVUZXh0Tm9kZShwcmVmaXggKyBjb2RlKSk7XG4gICAgICBhbmNob3JbcHJvcF0gPSBmdW5jdGlvbigpIHsgZGVzdHJveUVsZW1lbnQoc2NyaXB0KTsgfTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHBhcmVudCA9IHBhcmVudC5jbG9uZU5vZGUoZmFsc2UpO1xuICAgICAgc2libGluZyA9IG51bGw7XG4gICAgICBzY3JpcHQudGV4dCA9IGNvZGU7XG4gICAgfVxuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoc2NyaXB0LCBzaWJsaW5nKTtcbiAgICBkZWxldGUgYW5jaG9yW3Byb3BdO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgaGVscGVyIGZ1bmN0aW9uIGZvciBzZXR0aW5nIG9wdGlvbnMvZXZlbnQgaGFuZGxlcnMuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBiZW5jaCBUaGUgYmVuY2htYXJrIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIE9wdGlvbnMgb2JqZWN0LlxuICAgKi9cbiAgZnVuY3Rpb24gc2V0T3B0aW9ucyhiZW5jaCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBleHRlbmQoe30sIGJlbmNoLmNvbnN0cnVjdG9yLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgIGJlbmNoLm9wdGlvbnMgPSBmb3JPd24ob3B0aW9ucywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgaWYgKHZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgLy8gYWRkIGV2ZW50IGxpc3RlbmVyc1xuICAgICAgICBpZiAoL15vbltBLVpdLy50ZXN0KGtleSkpIHtcbiAgICAgICAgICBmb3JFYWNoKGtleS5zcGxpdCgnICcpLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgIGJlbmNoLm9uKGtleS5zbGljZSgyKS50b0xvd2VyQ2FzZSgpLCB2YWx1ZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIWhhc0tleShiZW5jaCwga2V5KSkge1xuICAgICAgICAgIGJlbmNoW2tleV0gPSBkZWVwQ2xvbmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogSGFuZGxlcyBjeWNsaW5nL2NvbXBsZXRpbmcgdGhlIGRlZmVycmVkIGJlbmNobWFyay5cbiAgICpcbiAgICogQG1lbWJlck9mIEJlbmNobWFyay5EZWZlcnJlZFxuICAgKi9cbiAgZnVuY3Rpb24gcmVzb2x2ZSgpIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICBjbG9uZSA9IG1lLmJlbmNobWFyayxcbiAgICAgICAgYmVuY2ggPSBjbG9uZS5fb3JpZ2luYWw7XG5cbiAgICBpZiAoYmVuY2guYWJvcnRlZCkge1xuICAgICAgLy8gY3ljbGUoKSAtPiBjbG9uZSBjeWNsZS9jb21wbGV0ZSBldmVudCAtPiBjb21wdXRlKCkncyBpbnZva2VkIGJlbmNoLnJ1bigpIGN5Y2xlL2NvbXBsZXRlXG4gICAgICBtZS50ZWFyZG93bigpO1xuICAgICAgY2xvbmUucnVubmluZyA9IGZhbHNlO1xuICAgICAgY3ljbGUobWUpO1xuICAgIH1cbiAgICBlbHNlIGlmICgrK21lLmN5Y2xlcyA8IGNsb25lLmNvdW50KSB7XG4gICAgICAvLyBjb250aW51ZSB0aGUgdGVzdCBsb29wXG4gICAgICBpZiAoc3VwcG9ydC50aW1lb3V0KSB7XG4gICAgICAgIC8vIHVzZSBzZXRUaW1lb3V0IHRvIGF2b2lkIGEgY2FsbCBzdGFjayBvdmVyZmxvdyBpZiBjYWxsZWQgcmVjdXJzaXZlbHlcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2xvbmUuY29tcGlsZWQuY2FsbChtZSwgdGltZXIpOyB9LCAwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNsb25lLmNvbXBpbGVkLmNhbGwobWUsIHRpbWVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aW1lci5zdG9wKG1lKTtcbiAgICAgIG1lLnRlYXJkb3duKCk7XG4gICAgICBkZWxheShjbG9uZSwgZnVuY3Rpb24oKSB7IGN5Y2xlKG1lKTsgfSk7XG4gICAgfVxuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLyoqXG4gICAqIEEgZGVlcCBjbG9uZSB1dGlsaXR5LlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICogQHBhcmFtIHtNaXhlZH0gdmFsdWUgVGhlIHZhbHVlIHRvIGNsb25lLlxuICAgKiBAcmV0dXJucyB7TWl4ZWR9IFRoZSBjbG9uZWQgdmFsdWUuXG4gICAqL1xuICBmdW5jdGlvbiBkZWVwQ2xvbmUodmFsdWUpIHtcbiAgICB2YXIgYWNjZXNzb3IsXG4gICAgICAgIGNpcmN1bGFyLFxuICAgICAgICBjbG9uZSxcbiAgICAgICAgY3RvcixcbiAgICAgICAgZGVzY3JpcHRvcixcbiAgICAgICAgZXh0ZW5zaWJsZSxcbiAgICAgICAga2V5LFxuICAgICAgICBsZW5ndGgsXG4gICAgICAgIG1hcmtlcktleSxcbiAgICAgICAgcGFyZW50LFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIHNvdXJjZSxcbiAgICAgICAgc3ViSW5kZXgsXG4gICAgICAgIGRhdGEgPSB7ICd2YWx1ZSc6IHZhbHVlIH0sXG4gICAgICAgIGluZGV4ID0gMCxcbiAgICAgICAgbWFya2VkID0gW10sXG4gICAgICAgIHF1ZXVlID0geyAnbGVuZ3RoJzogMCB9LFxuICAgICAgICB1bm1hcmtlZCA9IFtdO1xuXG4gICAgLyoqXG4gICAgICogQW4gZWFzaWx5IGRldGVjdGFibGUgZGVjb3JhdG9yIGZvciBjbG9uZWQgdmFsdWVzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIE1hcmtlcihvYmplY3QpIHtcbiAgICAgIHRoaXMucmF3ID0gb2JqZWN0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBjYWxsYmFjayB1c2VkIGJ5IGBmb3JQcm9wcygpYC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmb3JQcm9wc0NhbGxiYWNrKHN1YlZhbHVlLCBzdWJLZXkpIHtcbiAgICAgIC8vIGV4aXQgZWFybHkgdG8gYXZvaWQgY2xvbmluZyB0aGUgbWFya2VyXG4gICAgICBpZiAoc3ViVmFsdWUgJiYgc3ViVmFsdWUuY29uc3RydWN0b3IgPT0gTWFya2VyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIGFkZCBvYmplY3RzIHRvIHRoZSBxdWV1ZVxuICAgICAgaWYgKHN1YlZhbHVlID09PSBPYmplY3Qoc3ViVmFsdWUpKSB7XG4gICAgICAgIHF1ZXVlW3F1ZXVlLmxlbmd0aCsrXSA9IHsgJ2tleSc6IHN1YktleSwgJ3BhcmVudCc6IGNsb25lLCAnc291cmNlJzogdmFsdWUgfTtcbiAgICAgIH1cbiAgICAgIC8vIGFzc2lnbiBub24tb2JqZWN0c1xuICAgICAgZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gd2lsbCB0aHJvdyBhbiBlcnJvciBpbiBzdHJpY3QgbW9kZSBpZiB0aGUgcHJvcGVydHkgaXMgcmVhZC1vbmx5XG4gICAgICAgICAgY2xvbmVbc3ViS2V5XSA9IHN1YlZhbHVlO1xuICAgICAgICB9IGNhdGNoKGUpIHsgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldHMgYW4gYXZhaWxhYmxlIG1hcmtlciBrZXkgZm9yIHRoZSBnaXZlbiBvYmplY3QuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0TWFya2VyS2V5KG9iamVjdCkge1xuICAgICAgLy8gYXZvaWQgY29sbGlzaW9ucyB3aXRoIGV4aXN0aW5nIGtleXNcbiAgICAgIHZhciByZXN1bHQgPSB1aWQ7XG4gICAgICB3aGlsZSAob2JqZWN0W3Jlc3VsdF0gJiYgb2JqZWN0W3Jlc3VsdF0uY29uc3RydWN0b3IgIT0gTWFya2VyKSB7XG4gICAgICAgIHJlc3VsdCArPSAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBkbyB7XG4gICAgICBrZXkgPSBkYXRhLmtleTtcbiAgICAgIHBhcmVudCA9IGRhdGEucGFyZW50O1xuICAgICAgc291cmNlID0gZGF0YS5zb3VyY2U7XG4gICAgICBjbG9uZSA9IHZhbHVlID0gc291cmNlID8gc291cmNlW2tleV0gOiBkYXRhLnZhbHVlO1xuICAgICAgYWNjZXNzb3IgPSBjaXJjdWxhciA9IGRlc2NyaXB0b3IgPSBmYWxzZTtcblxuICAgICAgLy8gY3JlYXRlIGEgYmFzaWMgY2xvbmUgdG8gZmlsdGVyIG91dCBmdW5jdGlvbnMsIERPTSBlbGVtZW50cywgYW5kXG4gICAgICAvLyBvdGhlciBub24gYE9iamVjdGAgb2JqZWN0c1xuICAgICAgaWYgKHZhbHVlID09PSBPYmplY3QodmFsdWUpKSB7XG4gICAgICAgIC8vIHVzZSBjdXN0b20gZGVlcCBjbG9uZSBmdW5jdGlvbiBpZiBhdmFpbGFibGVcbiAgICAgICAgaWYgKGlzQ2xhc3NPZih2YWx1ZS5kZWVwQ2xvbmUsICdGdW5jdGlvbicpKSB7XG4gICAgICAgICAgY2xvbmUgPSB2YWx1ZS5kZWVwQ2xvbmUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdG9yID0gdmFsdWUuY29uc3RydWN0b3I7XG4gICAgICAgICAgc3dpdGNoICh0b1N0cmluZy5jYWxsKHZhbHVlKSkge1xuICAgICAgICAgICAgY2FzZSAnW29iamVjdCBBcnJheV0nOlxuICAgICAgICAgICAgICBjbG9uZSA9IG5ldyBjdG9yKHZhbHVlLmxlbmd0aCk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgICAgICAgICAgY2xvbmUgPSBuZXcgY3Rvcih2YWx1ZSA9PSB0cnVlKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ1tvYmplY3QgRGF0ZV0nOlxuICAgICAgICAgICAgICBjbG9uZSA9IG5ldyBjdG9yKCt2YWx1ZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IE9iamVjdF0nOlxuICAgICAgICAgICAgICBpc1BsYWluT2JqZWN0KHZhbHVlKSAmJiAoY2xvbmUgPSB7fSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzpcbiAgICAgICAgICAgICAgY2xvbmUgPSBuZXcgY3Rvcih2YWx1ZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdbb2JqZWN0IFJlZ0V4cF0nOlxuICAgICAgICAgICAgICBjbG9uZSA9IGN0b3IodmFsdWUuc291cmNlLFxuICAgICAgICAgICAgICAgICh2YWx1ZS5nbG9iYWwgICAgID8gJ2cnIDogJycpICtcbiAgICAgICAgICAgICAgICAodmFsdWUuaWdub3JlQ2FzZSA/ICdpJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgKHZhbHVlLm11bHRpbGluZSAgPyAnbScgOiAnJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBjb250aW51ZSBjbG9uZSBpZiBgdmFsdWVgIGRvZXNuJ3QgaGF2ZSBhbiBhY2Nlc3NvciBkZXNjcmlwdG9yXG4gICAgICAgIC8vIGh0dHA6Ly9lczUuZ2l0aHViLmNvbS8jeDguMTAuMVxuICAgICAgICBpZiAoY2xvbmUgJiYgY2xvbmUgIT0gdmFsdWUgJiZcbiAgICAgICAgICAgICEoZGVzY3JpcHRvciA9IHNvdXJjZSAmJiBzdXBwb3J0LmRlc2NyaXB0b3JzICYmIGdldERlc2NyaXB0b3Ioc291cmNlLCBrZXkpLFxuICAgICAgICAgICAgICBhY2Nlc3NvciA9IGRlc2NyaXB0b3IgJiYgKGRlc2NyaXB0b3IuZ2V0IHx8IGRlc2NyaXB0b3Iuc2V0KSkpIHtcbiAgICAgICAgICAvLyB1c2UgYW4gZXhpc3RpbmcgY2xvbmUgKGNpcmN1bGFyIHJlZmVyZW5jZSlcbiAgICAgICAgICBpZiAoKGV4dGVuc2libGUgPSBpc0V4dGVuc2libGUodmFsdWUpKSkge1xuICAgICAgICAgICAgbWFya2VyS2V5ID0gZ2V0TWFya2VyS2V5KHZhbHVlKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZVttYXJrZXJLZXldKSB7XG4gICAgICAgICAgICAgIGNpcmN1bGFyID0gY2xvbmUgPSB2YWx1ZVttYXJrZXJLZXldLnJhdztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gZm9yIGZyb3plbi9zZWFsZWQgb2JqZWN0c1xuICAgICAgICAgICAgZm9yIChzdWJJbmRleCA9IDAsIGxlbmd0aCA9IHVubWFya2VkLmxlbmd0aDsgc3ViSW5kZXggPCBsZW5ndGg7IHN1YkluZGV4KyspIHtcbiAgICAgICAgICAgICAgZGF0YSA9IHVubWFya2VkW3N1YkluZGV4XTtcbiAgICAgICAgICAgICAgaWYgKGRhdGEub2JqZWN0ID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNpcmN1bGFyID0gY2xvbmUgPSBkYXRhLmNsb25lO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghY2lyY3VsYXIpIHtcbiAgICAgICAgICAgIC8vIG1hcmsgb2JqZWN0IHRvIGFsbG93IHF1aWNrbHkgZGV0ZWN0aW5nIGNpcmN1bGFyIHJlZmVyZW5jZXMgYW5kIHRpZSBpdCB0byBpdHMgY2xvbmVcbiAgICAgICAgICAgIGlmIChleHRlbnNpYmxlKSB7XG4gICAgICAgICAgICAgIHZhbHVlW21hcmtlcktleV0gPSBuZXcgTWFya2VyKGNsb25lKTtcbiAgICAgICAgICAgICAgbWFya2VkLnB1c2goeyAna2V5JzogbWFya2VyS2V5LCAnb2JqZWN0JzogdmFsdWUgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBmb3IgZnJvemVuL3NlYWxlZCBvYmplY3RzXG4gICAgICAgICAgICAgIHVubWFya2VkLnB1c2goeyAnY2xvbmUnOiBjbG9uZSwgJ29iamVjdCc6IHZhbHVlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaXRlcmF0ZSBvdmVyIG9iamVjdCBwcm9wZXJ0aWVzXG4gICAgICAgICAgICBmb3JQcm9wcyh2YWx1ZSwgZm9yUHJvcHNDYWxsYmFjaywgeyAnd2hpY2gnOiAnYWxsJyB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgLy8gZm9yIGN1c3RvbSBwcm9wZXJ0eSBkZXNjcmlwdG9yc1xuICAgICAgICBpZiAoYWNjZXNzb3IgfHwgKGRlc2NyaXB0b3IgJiYgIShkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSAmJiBkZXNjcmlwdG9yLmVudW1lcmFibGUgJiYgZGVzY3JpcHRvci53cml0YWJsZSkpKSB7XG4gICAgICAgICAgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikge1xuICAgICAgICAgICAgZGVzY3JpcHRvci52YWx1ZSA9IGNsb25lO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZXREZXNjcmlwdG9yKHBhcmVudCwga2V5LCBkZXNjcmlwdG9yKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBmb3IgZGVmYXVsdCBwcm9wZXJ0eSBkZXNjcmlwdG9yc1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBwYXJlbnRba2V5XSA9IGNsb25lO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBjbG9uZTtcbiAgICAgIH1cbiAgICB9IHdoaWxlICgoZGF0YSA9IHF1ZXVlW2luZGV4KytdKSk7XG5cbiAgICAvLyByZW1vdmUgbWFya2Vyc1xuICAgIGZvciAoaW5kZXggPSAwLCBsZW5ndGggPSBtYXJrZWQubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgZGF0YSA9IG1hcmtlZFtpbmRleF07XG4gICAgICBkZWxldGUgZGF0YS5vYmplY3RbZGF0YS5rZXldO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIGl0ZXJhdGlvbiB1dGlsaXR5IGZvciBhcnJheXMgYW5kIG9iamVjdHMuXG4gICAqIENhbGxiYWNrcyBtYXkgdGVybWluYXRlIHRoZSBsb29wIGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHRoaXNBcmcgVGhlIGB0aGlzYCBiaW5kaW5nIGZvciB0aGUgY2FsbGJhY2suXG4gICAqIEByZXR1cm5zIHtBcnJheXxPYmplY3R9IFJldHVybnMgdGhlIG9iamVjdCBpdGVyYXRlZCBvdmVyLlxuICAgKi9cbiAgZnVuY3Rpb24gZWFjaChvYmplY3QsIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgdmFyIHJlc3VsdCA9IG9iamVjdDtcbiAgICBvYmplY3QgPSBPYmplY3Qob2JqZWN0KTtcblxuICAgIHZhciBmbiA9IGNhbGxiYWNrLFxuICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICBsZW5ndGggPSBvYmplY3QubGVuZ3RoLFxuICAgICAgICBpc1NuYXBzaG90ID0gISEob2JqZWN0LnNuYXBzaG90SXRlbSAmJiAobGVuZ3RoID0gb2JqZWN0LnNuYXBzaG90TGVuZ3RoKSksXG4gICAgICAgIGlzU3BsaXR0YWJsZSA9IChub0NoYXJCeUluZGV4IHx8IG5vQ2hhckJ5T3duSW5kZXgpICYmIGlzQ2xhc3NPZihvYmplY3QsICdTdHJpbmcnKSxcbiAgICAgICAgaXNDb252ZXJ0YWJsZSA9IGlzU25hcHNob3QgfHwgaXNTcGxpdHRhYmxlIHx8ICdpdGVtJyBpbiBvYmplY3QsXG4gICAgICAgIG9yaWdPYmplY3QgPSBvYmplY3Q7XG5cbiAgICAvLyBpbiBPcGVyYSA8IDEwLjUgYGhhc0tleShvYmplY3QsICdsZW5ndGgnKWAgcmV0dXJucyBgZmFsc2VgIGZvciBOb2RlTGlzdHNcbiAgICBpZiAobGVuZ3RoID09PSBsZW5ndGggPj4+IDApIHtcbiAgICAgIGlmIChpc0NvbnZlcnRhYmxlKSB7XG4gICAgICAgIC8vIHRoZSB0aGlyZCBhcmd1bWVudCBvZiB0aGUgY2FsbGJhY2sgaXMgdGhlIG9yaWdpbmFsIG5vbi1hcnJheSBvYmplY3RcbiAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbih2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCB2YWx1ZSwgaW5kZXgsIG9yaWdPYmplY3QpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBpbiBJRSA8IDkgc3RyaW5ncyBkb24ndCBzdXBwb3J0IGFjY2Vzc2luZyBjaGFyYWN0ZXJzIGJ5IGluZGV4XG4gICAgICAgIGlmIChpc1NwbGl0dGFibGUpIHtcbiAgICAgICAgICBvYmplY3QgPSBvYmplY3Quc3BsaXQoJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9iamVjdCA9IFtdO1xuICAgICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAvLyBpbiBTYWZhcmkgMiBgaW5kZXggaW4gb2JqZWN0YCBpcyBhbHdheXMgYGZhbHNlYCBmb3IgTm9kZUxpc3RzXG4gICAgICAgICAgICBvYmplY3RbaW5kZXhdID0gaXNTbmFwc2hvdCA/IHJlc3VsdC5zbmFwc2hvdEl0ZW0oaW5kZXgpIDogcmVzdWx0W2luZGV4XTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvckVhY2gob2JqZWN0LCBjYWxsYmFjaywgdGhpc0FyZyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvck93bihvYmplY3QsIGNhbGxiYWNrLCB0aGlzQXJnKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGZyb20gdGhlIHNvdXJjZShzKSBvYmplY3QgdG8gdGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0aW5hdGlvbiBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuICAgKiBAcGFyYW0ge09iamVjdH0gW3NvdXJjZT17fV0gVGhlIHNvdXJjZSBvYmplY3QuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG4gICAqL1xuICBmdW5jdGlvbiBleHRlbmQoZGVzdGluYXRpb24sIHNvdXJjZSkge1xuICAgIC8vIENocm9tZSA8IDE0IGluY29ycmVjdGx5IHNldHMgYGRlc3RpbmF0aW9uYCB0byBgdW5kZWZpbmVkYCB3aGVuIHdlIGBkZWxldGUgYXJndW1lbnRzWzBdYFxuICAgIC8vIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTgzOVxuICAgIHZhciByZXN1bHQgPSBkZXN0aW5hdGlvbjtcbiAgICBkZWxldGUgYXJndW1lbnRzWzBdO1xuXG4gICAgZm9yRWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgZm9yUHJvcHMoc291cmNlLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEEgZ2VuZXJpYyBgQXJyYXkjZmlsdGVyYCBsaWtlIG1ldGhvZC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBjYWxsYmFjayBUaGUgZnVuY3Rpb24vYWxpYXMgY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHRoaXNBcmcgVGhlIGB0aGlzYCBiaW5kaW5nIGZvciB0aGUgY2FsbGJhY2suXG4gICAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgYXJyYXkgb2YgdmFsdWVzIHRoYXQgcGFzc2VkIGNhbGxiYWNrIGZpbHRlci5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogLy8gZ2V0IG9kZCBudW1iZXJzXG4gICAqIEJlbmNobWFyay5maWx0ZXIoWzEsIDIsIDMsIDQsIDVdLCBmdW5jdGlvbihuKSB7XG4gICAqICAgcmV0dXJuIG4gJSAyO1xuICAgKiB9KTsgLy8gLT4gWzEsIDMsIDVdO1xuICAgKlxuICAgKiAvLyBnZXQgZmFzdGVzdCBiZW5jaG1hcmtzXG4gICAqIEJlbmNobWFyay5maWx0ZXIoYmVuY2hlcywgJ2Zhc3Rlc3QnKTtcbiAgICpcbiAgICogLy8gZ2V0IHNsb3dlc3QgYmVuY2htYXJrc1xuICAgKiBCZW5jaG1hcmsuZmlsdGVyKGJlbmNoZXMsICdzbG93ZXN0Jyk7XG4gICAqXG4gICAqIC8vIGdldCBiZW5jaG1hcmtzIHRoYXQgY29tcGxldGVkIHdpdGhvdXQgZXJyb3JpbmdcbiAgICogQmVuY2htYXJrLmZpbHRlcihiZW5jaGVzLCAnc3VjY2Vzc2Z1bCcpO1xuICAgKi9cbiAgZnVuY3Rpb24gZmlsdGVyKGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHZhciByZXN1bHQ7XG5cbiAgICBpZiAoY2FsbGJhY2sgPT0gJ3N1Y2Nlc3NmdWwnKSB7XG4gICAgICAvLyBjYWxsYmFjayB0byBleGNsdWRlIHRob3NlIHRoYXQgYXJlIGVycm9yZWQsIHVucnVuLCBvciBoYXZlIGh6IG9mIEluZmluaXR5XG4gICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uKGJlbmNoKSB7IHJldHVybiBiZW5jaC5jeWNsZXMgJiYgaXNGaW5pdGUoYmVuY2guaHopOyB9O1xuICAgIH1cbiAgICBlbHNlIGlmIChjYWxsYmFjayA9PSAnZmFzdGVzdCcgfHwgY2FsbGJhY2sgPT0gJ3Nsb3dlc3QnKSB7XG4gICAgICAvLyBnZXQgc3VjY2Vzc2Z1bCwgc29ydCBieSBwZXJpb2QgKyBtYXJnaW4gb2YgZXJyb3IsIGFuZCBmaWx0ZXIgZmFzdGVzdC9zbG93ZXN0XG4gICAgICByZXN1bHQgPSBmaWx0ZXIoYXJyYXksICdzdWNjZXNzZnVsJykuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGEgPSBhLnN0YXRzOyBiID0gYi5zdGF0cztcbiAgICAgICAgcmV0dXJuIChhLm1lYW4gKyBhLm1vZSA+IGIubWVhbiArIGIubW9lID8gMSA6IC0xKSAqIChjYWxsYmFjayA9PSAnZmFzdGVzdCcgPyAxIDogLTEpO1xuICAgICAgfSk7XG4gICAgICByZXN1bHQgPSBmaWx0ZXIocmVzdWx0LCBmdW5jdGlvbihiZW5jaCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0WzBdLmNvbXBhcmUoYmVuY2gpID09IDA7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdCB8fCByZWR1Y2UoYXJyYXksIGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGluZGV4KSB7XG4gICAgICByZXR1cm4gY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaW5kZXgsIGFycmF5KSA/IChyZXN1bHQucHVzaCh2YWx1ZSksIHJlc3VsdCkgOiByZXN1bHQ7XG4gICAgfSwgW10pO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgZ2VuZXJpYyBgQXJyYXkjZm9yRWFjaGAgbGlrZSBtZXRob2QuXG4gICAqIENhbGxiYWNrcyBtYXkgdGVybWluYXRlIHRoZSBsb29wIGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHRoaXNBcmcgVGhlIGB0aGlzYCBiaW5kaW5nIGZvciB0aGUgY2FsbGJhY2suXG4gICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgaXRlcmF0ZWQgb3Zlci5cbiAgICovXG4gIGZ1bmN0aW9uIGZvckVhY2goYXJyYXksIGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgdmFyIGluZGV4ID0gLTEsXG4gICAgICAgIGxlbmd0aCA9IChhcnJheSA9IE9iamVjdChhcnJheSkpLmxlbmd0aCA+Pj4gMDtcblxuICAgIGlmICh0aGlzQXJnICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNhbGxiYWNrID0gYmluZChjYWxsYmFjaywgdGhpc0FyZyk7XG4gICAgfVxuICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBpZiAoaW5kZXggaW4gYXJyYXkgJiZcbiAgICAgICAgICBjYWxsYmFjayhhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSkgPT09IGZhbHNlKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG4gIH1cblxuICAvKipcbiAgICogSXRlcmF0ZXMgb3ZlciBhbiBvYmplY3QncyBvd24gcHJvcGVydGllcywgZXhlY3V0aW5nIHRoZSBgY2FsbGJhY2tgIGZvciBlYWNoLlxuICAgKiBDYWxsYmFja3MgbWF5IHRlcm1pbmF0ZSB0aGUgbG9vcCBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIGV4ZWN1dGVkIHBlciBvd24gcHJvcGVydHkuXG4gICAqIEBwYXJhbSB7TWl4ZWR9IHRoaXNBcmcgVGhlIGB0aGlzYCBiaW5kaW5nIGZvciB0aGUgY2FsbGJhY2suXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG9iamVjdCBpdGVyYXRlZCBvdmVyLlxuICAgKi9cbiAgZnVuY3Rpb24gZm9yT3duKG9iamVjdCwgY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICByZXR1cm4gZm9yUHJvcHMob2JqZWN0LCBjYWxsYmFjaywgeyAnYmluZCc6IHRoaXNBcmcsICd3aGljaCc6ICdvd24nIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgbnVtYmVyIHRvIGEgbW9yZSByZWFkYWJsZSBjb21tYS1zZXBhcmF0ZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICogQHBhcmFtIHtOdW1iZXJ9IG51bWJlciBUaGUgbnVtYmVyIHRvIGNvbnZlcnQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBtb3JlIHJlYWRhYmxlIHN0cmluZyByZXByZXNlbnRhdGlvbi5cbiAgICovXG4gIGZ1bmN0aW9uIGZvcm1hdE51bWJlcihudW1iZXIpIHtcbiAgICBudW1iZXIgPSBTdHJpbmcobnVtYmVyKS5zcGxpdCgnLicpO1xuICAgIHJldHVybiBudW1iZXJbMF0ucmVwbGFjZSgvKD89KD86XFxkezN9KSskKSg/IVxcYikvZywgJywnKSArXG4gICAgICAobnVtYmVyWzFdID8gJy4nICsgbnVtYmVyWzFdIDogJycpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhbiBvYmplY3QgaGFzIHRoZSBzcGVjaWZpZWQga2V5IGFzIGEgZGlyZWN0IHByb3BlcnR5LlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNoZWNrLlxuICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IFRoZSBrZXkgdG8gY2hlY2sgZm9yLlxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYga2V5IGlzIGEgZGlyZWN0IHByb3BlcnR5LCBlbHNlIGBmYWxzZWAuXG4gICAqL1xuICBmdW5jdGlvbiBoYXNLZXkoKSB7XG4gICAgLy8gbGF6eSBkZWZpbmUgZm9yIHdvcnN0IGNhc2UgZmFsbGJhY2sgKG5vdCBhcyBhY2N1cmF0ZSlcbiAgICBoYXNLZXkgPSBmdW5jdGlvbihvYmplY3QsIGtleSkge1xuICAgICAgdmFyIHBhcmVudCA9IG9iamVjdCAhPSBudWxsICYmIChvYmplY3QuY29uc3RydWN0b3IgfHwgT2JqZWN0KS5wcm90b3R5cGU7XG4gICAgICByZXR1cm4gISFwYXJlbnQgJiYga2V5IGluIE9iamVjdChvYmplY3QpICYmICEoa2V5IGluIHBhcmVudCAmJiBvYmplY3Rba2V5XSA9PT0gcGFyZW50W2tleV0pO1xuICAgIH07XG4gICAgLy8gZm9yIG1vZGVybiBicm93c2Vyc1xuICAgIGlmIChpc0NsYXNzT2YoaGFzT3duUHJvcGVydHksICdGdW5jdGlvbicpKSB7XG4gICAgICBoYXNLZXkgPSBmdW5jdGlvbihvYmplY3QsIGtleSkge1xuICAgICAgICByZXR1cm4gb2JqZWN0ICE9IG51bGwgJiYgaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSk7XG4gICAgICB9O1xuICAgIH1cbiAgICAvLyBmb3IgU2FmYXJpIDJcbiAgICBlbHNlIGlmICh7fS5fX3Byb3RvX18gPT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgICAgaGFzS2V5ID0gZnVuY3Rpb24ob2JqZWN0LCBrZXkpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICBpZiAob2JqZWN0ICE9IG51bGwpIHtcbiAgICAgICAgICBvYmplY3QgPSBPYmplY3Qob2JqZWN0KTtcbiAgICAgICAgICBvYmplY3QuX19wcm90b19fID0gW29iamVjdC5fX3Byb3RvX18sIG9iamVjdC5fX3Byb3RvX18gPSBudWxsLCByZXN1bHQgPSBrZXkgaW4gb2JqZWN0XVswXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGhhc0tleS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgZ2VuZXJpYyBgQXJyYXkjaW5kZXhPZmAgbGlrZSBtZXRob2QuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyLlxuICAgKiBAcGFyYW0ge01peGVkfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IFtmcm9tSW5kZXg9MF0gVGhlIGluZGV4IHRvIHN0YXJ0IHNlYXJjaGluZyBmcm9tLlxuICAgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgdmFsdWUgb3IgYC0xYC5cbiAgICovXG4gIGZ1bmN0aW9uIGluZGV4T2YoYXJyYXksIHZhbHVlLCBmcm9tSW5kZXgpIHtcbiAgICB2YXIgaW5kZXggPSB0b0ludGVnZXIoZnJvbUluZGV4KSxcbiAgICAgICAgbGVuZ3RoID0gKGFycmF5ID0gT2JqZWN0KGFycmF5KSkubGVuZ3RoID4+PiAwO1xuXG4gICAgaW5kZXggPSAoaW5kZXggPCAwID8gbWF4KDAsIGxlbmd0aCArIGluZGV4KSA6IGluZGV4KSAtIDE7XG4gICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgIGlmIChpbmRleCBpbiBhcnJheSAmJiB2YWx1ZSA9PT0gYXJyYXlbaW5kZXhdKSB7XG4gICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIE1vZGlmeSBhIHN0cmluZyBieSByZXBsYWNpbmcgbmFtZWQgdG9rZW5zIHdpdGggbWF0Y2hpbmcgb2JqZWN0IHByb3BlcnR5IHZhbHVlcy5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBtb2RpZnkuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIHRlbXBsYXRlIG9iamVjdC5cbiAgICogQHJldHVybnMge1N0cmluZ30gVGhlIG1vZGlmaWVkIHN0cmluZy5cbiAgICovXG4gIGZ1bmN0aW9uIGludGVycG9sYXRlKHN0cmluZywgb2JqZWN0KSB7XG4gICAgZm9yT3duKG9iamVjdCwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgLy8gZXNjYXBlIHJlZ2V4cCBzcGVjaWFsIGNoYXJhY3RlcnMgaW4gYGtleWBcbiAgICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKFJlZ0V4cCgnI1xcXFx7JyArIGtleS5yZXBsYWNlKC8oWy4qKz9ePSE6JHt9KCl8W1xcXVxcL1xcXFxdKS9nLCAnXFxcXCQxJykgKyAnXFxcXH0nLCAnZycpLCB2YWx1ZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2VzIGEgbWV0aG9kIG9uIGFsbCBpdGVtcyBpbiBhbiBhcnJheS5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEBwYXJhbSB7QXJyYXl9IGJlbmNoZXMgQXJyYXkgb2YgYmVuY2htYXJrcyB0byBpdGVyYXRlIG92ZXIuXG4gICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHRvIGludm9rZSBPUiBvcHRpb25zIG9iamVjdC5cbiAgICogQHBhcmFtIHtNaXhlZH0gW2FyZzEsIGFyZzIsIC4uLl0gQXJndW1lbnRzIHRvIGludm9rZSB0aGUgbWV0aG9kIHdpdGguXG4gICAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgYXJyYXkgb2YgdmFsdWVzIHJldHVybmVkIGZyb20gZWFjaCBtZXRob2QgaW52b2tlZC5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogLy8gaW52b2tlIGByZXNldGAgb24gYWxsIGJlbmNobWFya3NcbiAgICogQmVuY2htYXJrLmludm9rZShiZW5jaGVzLCAncmVzZXQnKTtcbiAgICpcbiAgICogLy8gaW52b2tlIGBlbWl0YCB3aXRoIGFyZ3VtZW50c1xuICAgKiBCZW5jaG1hcmsuaW52b2tlKGJlbmNoZXMsICdlbWl0JywgJ2NvbXBsZXRlJywgbGlzdGVuZXIpO1xuICAgKlxuICAgKiAvLyBpbnZva2UgYHJ1bih0cnVlKWAsIHRyZWF0IGJlbmNobWFya3MgYXMgYSBxdWV1ZSwgYW5kIHJlZ2lzdGVyIGludm9rZSBjYWxsYmFja3NcbiAgICogQmVuY2htYXJrLmludm9rZShiZW5jaGVzLCB7XG4gICAqXG4gICAqICAgLy8gaW52b2tlIHRoZSBgcnVuYCBtZXRob2RcbiAgICogICAnbmFtZSc6ICdydW4nLFxuICAgKlxuICAgKiAgIC8vIHBhc3MgYSBzaW5nbGUgYXJndW1lbnRcbiAgICogICAnYXJncyc6IHRydWUsXG4gICAqXG4gICAqICAgLy8gdHJlYXQgYXMgcXVldWUsIHJlbW92aW5nIGJlbmNobWFya3MgZnJvbSBmcm9udCBvZiBgYmVuY2hlc2AgdW50aWwgZW1wdHlcbiAgICogICAncXVldWVkJzogdHJ1ZSxcbiAgICpcbiAgICogICAvLyBjYWxsZWQgYmVmb3JlIGFueSBiZW5jaG1hcmtzIGhhdmUgYmVlbiBpbnZva2VkLlxuICAgKiAgICdvblN0YXJ0Jzogb25TdGFydCxcbiAgICpcbiAgICogICAvLyBjYWxsZWQgYmV0d2VlbiBpbnZva2luZyBiZW5jaG1hcmtzXG4gICAqICAgJ29uQ3ljbGUnOiBvbkN5Y2xlLFxuICAgKlxuICAgKiAgIC8vIGNhbGxlZCBhZnRlciBhbGwgYmVuY2htYXJrcyBoYXZlIGJlZW4gaW52b2tlZC5cbiAgICogICAnb25Db21wbGV0ZSc6IG9uQ29tcGxldGVcbiAgICogfSk7XG4gICAqL1xuICBmdW5jdGlvbiBpbnZva2UoYmVuY2hlcywgbmFtZSkge1xuICAgIHZhciBhcmdzLFxuICAgICAgICBiZW5jaCxcbiAgICAgICAgcXVldWVkLFxuICAgICAgICBpbmRleCA9IC0xLFxuICAgICAgICBldmVudFByb3BzID0geyAnY3VycmVudFRhcmdldCc6IGJlbmNoZXMgfSxcbiAgICAgICAgb3B0aW9ucyA9IHsgJ29uU3RhcnQnOiBub29wLCAnb25DeWNsZSc6IG5vb3AsICdvbkNvbXBsZXRlJzogbm9vcCB9LFxuICAgICAgICByZXN1bHQgPSBtYXAoYmVuY2hlcywgZnVuY3Rpb24oYmVuY2gpIHsgcmV0dXJuIGJlbmNoOyB9KTtcblxuICAgIC8qKlxuICAgICAqIEludm9rZXMgdGhlIG1ldGhvZCBvZiB0aGUgY3VycmVudCBvYmplY3QgYW5kIGlmIHN5bmNocm9ub3VzLCBmZXRjaGVzIHRoZSBuZXh0LlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGV4ZWN1dGUoKSB7XG4gICAgICB2YXIgbGlzdGVuZXJzLFxuICAgICAgICAgIGFzeW5jID0gaXNBc3luYyhiZW5jaCk7XG5cbiAgICAgIGlmIChhc3luYykge1xuICAgICAgICAvLyB1c2UgYGdldE5leHRgIGFzIHRoZSBmaXJzdCBsaXN0ZW5lclxuICAgICAgICBiZW5jaC5vbignY29tcGxldGUnLCBnZXROZXh0KTtcbiAgICAgICAgbGlzdGVuZXJzID0gYmVuY2guZXZlbnRzLmNvbXBsZXRlO1xuICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKDAsIDAsIGxpc3RlbmVycy5wb3AoKSk7XG4gICAgICB9XG4gICAgICAvLyBleGVjdXRlIG1ldGhvZFxuICAgICAgcmVzdWx0W2luZGV4XSA9IGlzQ2xhc3NPZihiZW5jaCAmJiBiZW5jaFtuYW1lXSwgJ0Z1bmN0aW9uJykgPyBiZW5jaFtuYW1lXS5hcHBseShiZW5jaCwgYXJncykgOiB1bmRlZmluZWQ7XG4gICAgICAvLyBpZiBzeW5jaHJvbm91cyByZXR1cm4gdHJ1ZSB1bnRpbCBmaW5pc2hlZFxuICAgICAgcmV0dXJuICFhc3luYyAmJiBnZXROZXh0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmV0Y2hlcyB0aGUgbmV4dCBiZW5jaCBvciBleGVjdXRlcyBgb25Db21wbGV0ZWAgY2FsbGJhY2suXG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0TmV4dChldmVudCkge1xuICAgICAgdmFyIGN5Y2xlRXZlbnQsXG4gICAgICAgICAgbGFzdCA9IGJlbmNoLFxuICAgICAgICAgIGFzeW5jID0gaXNBc3luYyhsYXN0KTtcblxuICAgICAgaWYgKGFzeW5jKSB7XG4gICAgICAgIGxhc3Qub2ZmKCdjb21wbGV0ZScsIGdldE5leHQpO1xuICAgICAgICBsYXN0LmVtaXQoJ2NvbXBsZXRlJyk7XG4gICAgICB9XG4gICAgICAvLyBlbWl0IFwiY3ljbGVcIiBldmVudFxuICAgICAgZXZlbnRQcm9wcy50eXBlID0gJ2N5Y2xlJztcbiAgICAgIGV2ZW50UHJvcHMudGFyZ2V0ID0gbGFzdDtcbiAgICAgIGN5Y2xlRXZlbnQgPSBFdmVudChldmVudFByb3BzKTtcbiAgICAgIG9wdGlvbnMub25DeWNsZS5jYWxsKGJlbmNoZXMsIGN5Y2xlRXZlbnQpO1xuXG4gICAgICAvLyBjaG9vc2UgbmV4dCBiZW5jaG1hcmsgaWYgbm90IGV4aXRpbmcgZWFybHlcbiAgICAgIGlmICghY3ljbGVFdmVudC5hYm9ydGVkICYmIHJhaXNlSW5kZXgoKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgYmVuY2ggPSBxdWV1ZWQgPyBiZW5jaGVzWzBdIDogcmVzdWx0W2luZGV4XTtcbiAgICAgICAgaWYgKGlzQXN5bmMoYmVuY2gpKSB7XG4gICAgICAgICAgZGVsYXkoYmVuY2gsIGV4ZWN1dGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGFzeW5jKSB7XG4gICAgICAgICAgLy8gcmVzdW1lIGV4ZWN1dGlvbiBpZiBwcmV2aW91c2x5IGFzeW5jaHJvbm91cyBidXQgbm93IHN5bmNocm9ub3VzXG4gICAgICAgICAgd2hpbGUgKGV4ZWN1dGUoKSkgeyB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgLy8gY29udGludWUgc3luY2hyb25vdXMgZXhlY3V0aW9uXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGVtaXQgXCJjb21wbGV0ZVwiIGV2ZW50XG4gICAgICAgIGV2ZW50UHJvcHMudHlwZSA9ICdjb21wbGV0ZSc7XG4gICAgICAgIG9wdGlvbnMub25Db21wbGV0ZS5jYWxsKGJlbmNoZXMsIEV2ZW50KGV2ZW50UHJvcHMpKTtcbiAgICAgIH1cbiAgICAgIC8vIFdoZW4gdXNlZCBhcyBhIGxpc3RlbmVyIGBldmVudC5hYm9ydGVkID0gdHJ1ZWAgd2lsbCBjYW5jZWwgdGhlIHJlc3Qgb2ZcbiAgICAgIC8vIHRoZSBcImNvbXBsZXRlXCIgbGlzdGVuZXJzIGJlY2F1c2UgdGhleSB3ZXJlIGFscmVhZHkgY2FsbGVkIGFib3ZlIGFuZCB3aGVuXG4gICAgICAvLyB1c2VkIGFzIHBhcnQgb2YgYGdldE5leHRgIHRoZSBgcmV0dXJuIGZhbHNlYCB3aWxsIGV4aXQgdGhlIGV4ZWN1dGlvbiB3aGlsZS1sb29wLlxuICAgICAgaWYgKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LmFib3J0ZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrcyBpZiBpbnZva2luZyBgQmVuY2htYXJrI3J1bmAgd2l0aCBhc3luY2hyb25vdXMgY3ljbGVzLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzQXN5bmMob2JqZWN0KSB7XG4gICAgICAvLyBhdm9pZCB1c2luZyBgaW5zdGFuY2VvZmAgaGVyZSBiZWNhdXNlIG9mIElFIG1lbW9yeSBsZWFrIGlzc3VlcyB3aXRoIGhvc3Qgb2JqZWN0c1xuICAgICAgdmFyIGFzeW5jID0gYXJnc1swXSAmJiBhcmdzWzBdLmFzeW5jO1xuICAgICAgcmV0dXJuIE9iamVjdChvYmplY3QpLmNvbnN0cnVjdG9yID09IEJlbmNobWFyayAmJiBuYW1lID09ICdydW4nICYmXG4gICAgICAgICgoYXN5bmMgPT0gbnVsbCA/IG9iamVjdC5vcHRpb25zLmFzeW5jIDogYXN5bmMpICYmIHN1cHBvcnQudGltZW91dCB8fCBvYmplY3QuZGVmZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJhaXNlcyBgaW5kZXhgIHRvIHRoZSBuZXh0IGRlZmluZWQgaW5kZXggb3IgcmV0dXJucyBgZmFsc2VgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJhaXNlSW5kZXgoKSB7XG4gICAgICB2YXIgbGVuZ3RoID0gcmVzdWx0Lmxlbmd0aDtcbiAgICAgIGlmIChxdWV1ZWQpIHtcbiAgICAgICAgLy8gaWYgcXVldWVkIHJlbW92ZSB0aGUgcHJldmlvdXMgYmVuY2ggYW5kIHN1YnNlcXVlbnQgc2tpcHBlZCBub24tZW50cmllc1xuICAgICAgICBkbyB7XG4gICAgICAgICAgKytpbmRleCA+IDAgJiYgc2hpZnQuY2FsbChiZW5jaGVzKTtcbiAgICAgICAgfSB3aGlsZSAoKGxlbmd0aCA9IGJlbmNoZXMubGVuZ3RoKSAmJiAhKCcwJyBpbiBiZW5jaGVzKSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGggJiYgIShpbmRleCBpbiByZXN1bHQpKSB7IH1cbiAgICAgIH1cbiAgICAgIC8vIGlmIHdlIHJlYWNoZWQgdGhlIGxhc3QgaW5kZXggdGhlbiByZXR1cm4gYGZhbHNlYFxuICAgICAgcmV0dXJuIChxdWV1ZWQgPyBsZW5ndGggOiBpbmRleCA8IGxlbmd0aCkgPyBpbmRleCA6IChpbmRleCA9IGZhbHNlKTtcbiAgICB9XG5cbiAgICAvLyBqdWdnbGUgYXJndW1lbnRzXG4gICAgaWYgKGlzQ2xhc3NPZihuYW1lLCAnU3RyaW5nJykpIHtcbiAgICAgIC8vIDIgYXJndW1lbnRzIChhcnJheSwgbmFtZSlcbiAgICAgIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIDIgYXJndW1lbnRzIChhcnJheSwgb3B0aW9ucylcbiAgICAgIG9wdGlvbnMgPSBleHRlbmQob3B0aW9ucywgbmFtZSk7XG4gICAgICBuYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgYXJncyA9IGlzQ2xhc3NPZihhcmdzID0gJ2FyZ3MnIGluIG9wdGlvbnMgPyBvcHRpb25zLmFyZ3MgOiBbXSwgJ0FycmF5JykgPyBhcmdzIDogW2FyZ3NdO1xuICAgICAgcXVldWVkID0gb3B0aW9ucy5xdWV1ZWQ7XG4gICAgfVxuXG4gICAgLy8gc3RhcnQgaXRlcmF0aW5nIG92ZXIgdGhlIGFycmF5XG4gICAgaWYgKHJhaXNlSW5kZXgoKSAhPT0gZmFsc2UpIHtcbiAgICAgIC8vIGVtaXQgXCJzdGFydFwiIGV2ZW50XG4gICAgICBiZW5jaCA9IHJlc3VsdFtpbmRleF07XG4gICAgICBldmVudFByb3BzLnR5cGUgPSAnc3RhcnQnO1xuICAgICAgZXZlbnRQcm9wcy50YXJnZXQgPSBiZW5jaDtcbiAgICAgIG9wdGlvbnMub25TdGFydC5jYWxsKGJlbmNoZXMsIEV2ZW50KGV2ZW50UHJvcHMpKTtcblxuICAgICAgLy8gZW5kIGVhcmx5IGlmIHRoZSBzdWl0ZSB3YXMgYWJvcnRlZCBpbiBhbiBcIm9uU3RhcnRcIiBsaXN0ZW5lclxuICAgICAgaWYgKGJlbmNoZXMuYWJvcnRlZCAmJiBiZW5jaGVzLmNvbnN0cnVjdG9yID09IFN1aXRlICYmIG5hbWUgPT0gJ3J1bicpIHtcbiAgICAgICAgLy8gZW1pdCBcImN5Y2xlXCIgZXZlbnRcbiAgICAgICAgZXZlbnRQcm9wcy50eXBlID0gJ2N5Y2xlJztcbiAgICAgICAgb3B0aW9ucy5vbkN5Y2xlLmNhbGwoYmVuY2hlcywgRXZlbnQoZXZlbnRQcm9wcykpO1xuICAgICAgICAvLyBlbWl0IFwiY29tcGxldGVcIiBldmVudFxuICAgICAgICBldmVudFByb3BzLnR5cGUgPSAnY29tcGxldGUnO1xuICAgICAgICBvcHRpb25zLm9uQ29tcGxldGUuY2FsbChiZW5jaGVzLCBFdmVudChldmVudFByb3BzKSk7XG4gICAgICB9XG4gICAgICAvLyBlbHNlIHN0YXJ0XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYgKGlzQXN5bmMoYmVuY2gpKSB7XG4gICAgICAgICAgZGVsYXkoYmVuY2gsIGV4ZWN1dGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHdoaWxlIChleGVjdXRlKCkpIHsgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0cmluZyBvZiBqb2luZWQgYXJyYXkgdmFsdWVzIG9yIG9iamVjdCBrZXktdmFsdWUgcGFpcnMuXG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gb3BlcmF0ZSBvbi5cbiAgICogQHBhcmFtIHtTdHJpbmd9IFtzZXBhcmF0b3IxPScsJ10gVGhlIHNlcGFyYXRvciB1c2VkIGJldHdlZW4ga2V5LXZhbHVlIHBhaXJzLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gW3NlcGFyYXRvcjI9JzogJ10gVGhlIHNlcGFyYXRvciB1c2VkIGJldHdlZW4ga2V5cyBhbmQgdmFsdWVzLlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgam9pbmVkIHJlc3VsdC5cbiAgICovXG4gIGZ1bmN0aW9uIGpvaW4ob2JqZWN0LCBzZXBhcmF0b3IxLCBzZXBhcmF0b3IyKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdLFxuICAgICAgICBsZW5ndGggPSAob2JqZWN0ID0gT2JqZWN0KG9iamVjdCkpLmxlbmd0aCxcbiAgICAgICAgYXJyYXlMaWtlID0gbGVuZ3RoID09PSBsZW5ndGggPj4+IDA7XG5cbiAgICBzZXBhcmF0b3IyIHx8IChzZXBhcmF0b3IyID0gJzogJyk7XG4gICAgZWFjaChvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGFycmF5TGlrZSA/IHZhbHVlIDoga2V5ICsgc2VwYXJhdG9yMiArIHZhbHVlKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0LmpvaW4oc2VwYXJhdG9yMSB8fCAnLCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgZ2VuZXJpYyBgQXJyYXkjbWFwYCBsaWtlIG1ldGhvZC5cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICogQHBhcmFtIHtNaXhlZH0gdGhpc0FyZyBUaGUgYHRoaXNgIGJpbmRpbmcgZm9yIHRoZSBjYWxsYmFjay5cbiAgICogQHJldHVybnMge0FycmF5fSBBIG5ldyBhcnJheSBvZiB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrLlxuICAgKi9cbiAgZnVuY3Rpb24gbWFwKGFycmF5LCBjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHJldHVybiByZWR1Y2UoYXJyYXksIGZ1bmN0aW9uKHJlc3VsdCwgdmFsdWUsIGluZGV4KSB7XG4gICAgICByZXN1bHRbaW5kZXhdID0gY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaW5kZXgsIGFycmF5KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSwgQXJyYXkoT2JqZWN0KGFycmF5KS5sZW5ndGggPj4+IDApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgdGhlIHZhbHVlIG9mIGEgc3BlY2lmaWVkIHByb3BlcnR5IGZyb20gYWxsIGl0ZW1zIGluIGFuIGFycmF5LlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5IFRoZSBwcm9wZXJ0eSB0byBwbHVjay5cbiAgICogQHJldHVybnMge0FycmF5fSBBIG5ldyBhcnJheSBvZiBwcm9wZXJ0eSB2YWx1ZXMuXG4gICAqL1xuICBmdW5jdGlvbiBwbHVjayhhcnJheSwgcHJvcGVydHkpIHtcbiAgICByZXR1cm4gbWFwKGFycmF5LCBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQSBnZW5lcmljIGBBcnJheSNyZWR1Y2VgIGxpa2UgbWV0aG9kLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgKiBAcGFyYW0ge01peGVkfSBhY2N1bXVsYXRvciBJbml0aWFsIHZhbHVlIG9mIHRoZSBhY2N1bXVsYXRvci5cbiAgICogQHJldHVybnMge01peGVkfSBUaGUgYWNjdW11bGF0b3IuXG4gICAqL1xuICBmdW5jdGlvbiByZWR1Y2UoYXJyYXksIGNhbGxiYWNrLCBhY2N1bXVsYXRvcikge1xuICAgIHZhciBub2FjY3VtID0gYXJndW1lbnRzLmxlbmd0aCA8IDM7XG4gICAgZm9yRWFjaChhcnJheSwgZnVuY3Rpb24odmFsdWUsIGluZGV4KSB7XG4gICAgICBhY2N1bXVsYXRvciA9IG5vYWNjdW0gPyAobm9hY2N1bSA9IGZhbHNlLCB2YWx1ZSkgOiBjYWxsYmFjayhhY2N1bXVsYXRvciwgdmFsdWUsIGluZGV4LCBhcnJheSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLyoqXG4gICAqIEFib3J0cyBhbGwgYmVuY2htYXJrcyBpbiB0aGUgc3VpdGUuXG4gICAqXG4gICAqIEBuYW1lIGFib3J0XG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuU3VpdGVcbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIHN1aXRlIGluc3RhbmNlLlxuICAgKi9cbiAgZnVuY3Rpb24gYWJvcnRTdWl0ZSgpIHtcbiAgICB2YXIgZXZlbnQsXG4gICAgICAgIG1lID0gdGhpcyxcbiAgICAgICAgcmVzZXR0aW5nID0gY2FsbGVkQnkucmVzZXRTdWl0ZTtcblxuICAgIGlmIChtZS5ydW5uaW5nKSB7XG4gICAgICBldmVudCA9IEV2ZW50KCdhYm9ydCcpO1xuICAgICAgbWUuZW1pdChldmVudCk7XG4gICAgICBpZiAoIWV2ZW50LmNhbmNlbGxlZCB8fCByZXNldHRpbmcpIHtcbiAgICAgICAgLy8gYXZvaWQgaW5maW5pdGUgcmVjdXJzaW9uXG4gICAgICAgIGNhbGxlZEJ5LmFib3J0U3VpdGUgPSB0cnVlO1xuICAgICAgICBtZS5yZXNldCgpO1xuICAgICAgICBkZWxldGUgY2FsbGVkQnkuYWJvcnRTdWl0ZTtcblxuICAgICAgICBpZiAoIXJlc2V0dGluZykge1xuICAgICAgICAgIG1lLmFib3J0ZWQgPSB0cnVlO1xuICAgICAgICAgIGludm9rZShtZSwgJ2Fib3J0Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSB0ZXN0IHRvIHRoZSBiZW5jaG1hcmsgc3VpdGUuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuU3VpdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgQSBuYW1lIHRvIGlkZW50aWZ5IHRoZSBiZW5jaG1hcmsuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBmbiBUaGUgdGVzdCB0byBiZW5jaG1hcmsuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gT3B0aW9ucyBvYmplY3QuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBiZW5jaG1hcmsgaW5zdGFuY2UuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIC8vIGJhc2ljIHVzYWdlXG4gICAqIHN1aXRlLmFkZChmbik7XG4gICAqXG4gICAqIC8vIG9yIHVzaW5nIGEgbmFtZSBmaXJzdFxuICAgKiBzdWl0ZS5hZGQoJ2ZvbycsIGZuKTtcbiAgICpcbiAgICogLy8gb3Igd2l0aCBvcHRpb25zXG4gICAqIHN1aXRlLmFkZCgnZm9vJywgZm4sIHtcbiAgICogICAnb25DeWNsZSc6IG9uQ3ljbGUsXG4gICAqICAgJ29uQ29tcGxldGUnOiBvbkNvbXBsZXRlXG4gICAqIH0pO1xuICAgKlxuICAgKiAvLyBvciBuYW1lIGFuZCBvcHRpb25zXG4gICAqIHN1aXRlLmFkZCgnZm9vJywge1xuICAgKiAgICdmbic6IGZuLFxuICAgKiAgICdvbkN5Y2xlJzogb25DeWNsZSxcbiAgICogICAnb25Db21wbGV0ZSc6IG9uQ29tcGxldGVcbiAgICogfSk7XG4gICAqXG4gICAqIC8vIG9yIG9wdGlvbnMgb25seVxuICAgKiBzdWl0ZS5hZGQoe1xuICAgKiAgICduYW1lJzogJ2ZvbycsXG4gICAqICAgJ2ZuJzogZm4sXG4gICAqICAgJ29uQ3ljbGUnOiBvbkN5Y2xlLFxuICAgKiAgICdvbkNvbXBsZXRlJzogb25Db21wbGV0ZVxuICAgKiB9KTtcbiAgICovXG4gIGZ1bmN0aW9uIGFkZChuYW1lLCBmbiwgb3B0aW9ucykge1xuICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgIGJlbmNoID0gQmVuY2htYXJrKG5hbWUsIGZuLCBvcHRpb25zKSxcbiAgICAgICAgZXZlbnQgPSBFdmVudCh7ICd0eXBlJzogJ2FkZCcsICd0YXJnZXQnOiBiZW5jaCB9KTtcblxuICAgIGlmIChtZS5lbWl0KGV2ZW50KSwgIWV2ZW50LmNhbmNlbGxlZCkge1xuICAgICAgbWUucHVzaChiZW5jaCk7XG4gICAgfVxuICAgIHJldHVybiBtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHN1aXRlIHdpdGggY2xvbmVkIGJlbmNobWFya3MuXG4gICAqXG4gICAqIEBuYW1lIGNsb25lXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuU3VpdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcndyaXRlIGNsb25lZCBvcHRpb25zLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgbmV3IHN1aXRlIGluc3RhbmNlLlxuICAgKi9cbiAgZnVuY3Rpb24gY2xvbmVTdWl0ZShvcHRpb25zKSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgcmVzdWx0ID0gbmV3IG1lLmNvbnN0cnVjdG9yKGV4dGVuZCh7fSwgbWUub3B0aW9ucywgb3B0aW9ucykpO1xuXG4gICAgLy8gY29weSBvd24gcHJvcGVydGllc1xuICAgIGZvck93bihtZSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgaWYgKCFoYXNLZXkocmVzdWx0LCBrZXkpKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdmFsdWUgJiYgaXNDbGFzc09mKHZhbHVlLmNsb25lLCAnRnVuY3Rpb24nKVxuICAgICAgICAgID8gdmFsdWUuY2xvbmUoKVxuICAgICAgICAgIDogZGVlcENsb25lKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIGBBcnJheSNmaWx0ZXJgIGxpa2UgbWV0aG9kLlxuICAgKlxuICAgKiBAbmFtZSBmaWx0ZXJcbiAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufFN0cmluZ30gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uL2FsaWFzIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBBIG5ldyBzdWl0ZSBvZiBiZW5jaG1hcmtzIHRoYXQgcGFzc2VkIGNhbGxiYWNrIGZpbHRlci5cbiAgICovXG4gIGZ1bmN0aW9uIGZpbHRlclN1aXRlKGNhbGxiYWNrKSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgcmVzdWx0ID0gbmV3IG1lLmNvbnN0cnVjdG9yO1xuXG4gICAgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBmaWx0ZXIobWUsIGNhbGxiYWNrKSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgYWxsIGJlbmNobWFya3MgaW4gdGhlIHN1aXRlLlxuICAgKlxuICAgKiBAbmFtZSByZXNldFxuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLlN1aXRlXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBzdWl0ZSBpbnN0YW5jZS5cbiAgICovXG4gIGZ1bmN0aW9uIHJlc2V0U3VpdGUoKSB7XG4gICAgdmFyIGV2ZW50LFxuICAgICAgICBtZSA9IHRoaXMsXG4gICAgICAgIGFib3J0aW5nID0gY2FsbGVkQnkuYWJvcnRTdWl0ZTtcblxuICAgIGlmIChtZS5ydW5uaW5nICYmICFhYm9ydGluZykge1xuICAgICAgLy8gbm8gd29ycmllcywgYHJlc2V0U3VpdGUoKWAgaXMgY2FsbGVkIHdpdGhpbiBgYWJvcnRTdWl0ZSgpYFxuICAgICAgY2FsbGVkQnkucmVzZXRTdWl0ZSA9IHRydWU7XG4gICAgICBtZS5hYm9ydCgpO1xuICAgICAgZGVsZXRlIGNhbGxlZEJ5LnJlc2V0U3VpdGU7XG4gICAgfVxuICAgIC8vIHJlc2V0IGlmIHRoZSBzdGF0ZSBoYXMgY2hhbmdlZFxuICAgIGVsc2UgaWYgKChtZS5hYm9ydGVkIHx8IG1lLnJ1bm5pbmcpICYmXG4gICAgICAgIChtZS5lbWl0KGV2ZW50ID0gRXZlbnQoJ3Jlc2V0JykpLCAhZXZlbnQuY2FuY2VsbGVkKSkge1xuICAgICAgbWUucnVubmluZyA9IGZhbHNlO1xuICAgICAgaWYgKCFhYm9ydGluZykge1xuICAgICAgICBpbnZva2UobWUsICdyZXNldCcpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWU7XG4gIH1cblxuICAvKipcbiAgICogUnVucyB0aGUgc3VpdGUuXG4gICAqXG4gICAqIEBuYW1lIHJ1blxuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLlN1aXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gT3B0aW9ucyBvYmplY3QuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBzdWl0ZSBpbnN0YW5jZS5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogLy8gYmFzaWMgdXNhZ2VcbiAgICogc3VpdGUucnVuKCk7XG4gICAqXG4gICAqIC8vIG9yIHdpdGggb3B0aW9uc1xuICAgKiBzdWl0ZS5ydW4oeyAnYXN5bmMnOiB0cnVlLCAncXVldWVkJzogdHJ1ZSB9KTtcbiAgICovXG4gIGZ1bmN0aW9uIHJ1blN1aXRlKG9wdGlvbnMpIHtcbiAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgbWUucmVzZXQoKTtcbiAgICBtZS5ydW5uaW5nID0gdHJ1ZTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgaW52b2tlKG1lLCB7XG4gICAgICAnbmFtZSc6ICdydW4nLFxuICAgICAgJ2FyZ3MnOiBvcHRpb25zLFxuICAgICAgJ3F1ZXVlZCc6IG9wdGlvbnMucXVldWVkLFxuICAgICAgJ29uU3RhcnQnOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBtZS5lbWl0KGV2ZW50KTtcbiAgICAgIH0sXG4gICAgICAnb25DeWNsZSc6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBiZW5jaCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgaWYgKGJlbmNoLmVycm9yKSB7XG4gICAgICAgICAgbWUuZW1pdCh7ICd0eXBlJzogJ2Vycm9yJywgJ3RhcmdldCc6IGJlbmNoIH0pO1xuICAgICAgICB9XG4gICAgICAgIG1lLmVtaXQoZXZlbnQpO1xuICAgICAgICBldmVudC5hYm9ydGVkID0gbWUuYWJvcnRlZDtcbiAgICAgIH0sXG4gICAgICAnb25Db21wbGV0ZSc6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIG1lLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgbWUuZW1pdChldmVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG1lO1xuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLyoqXG4gICAqIEV4ZWN1dGVzIGFsbCByZWdpc3RlcmVkIGxpc3RlbmVycyBvZiB0aGUgc3BlY2lmaWVkIGV2ZW50IHR5cGUuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmssIEJlbmNobWFyay5TdWl0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHR5cGUgVGhlIGV2ZW50IHR5cGUgb3Igb2JqZWN0LlxuICAgKiBAcmV0dXJucyB7TWl4ZWR9IFJldHVybnMgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgbGFzdCBsaXN0ZW5lciBleGVjdXRlZC5cbiAgICovXG4gIGZ1bmN0aW9uIGVtaXQodHlwZSkge1xuICAgIHZhciBsaXN0ZW5lcnMsXG4gICAgICAgIG1lID0gdGhpcyxcbiAgICAgICAgZXZlbnQgPSBFdmVudCh0eXBlKSxcbiAgICAgICAgZXZlbnRzID0gbWUuZXZlbnRzLFxuICAgICAgICBhcmdzID0gKGFyZ3VtZW50c1swXSA9IGV2ZW50LCBhcmd1bWVudHMpO1xuXG4gICAgZXZlbnQuY3VycmVudFRhcmdldCB8fCAoZXZlbnQuY3VycmVudFRhcmdldCA9IG1lKTtcbiAgICBldmVudC50YXJnZXQgfHwgKGV2ZW50LnRhcmdldCA9IG1lKTtcbiAgICBkZWxldGUgZXZlbnQucmVzdWx0O1xuXG4gICAgaWYgKGV2ZW50cyAmJiAobGlzdGVuZXJzID0gaGFzS2V5KGV2ZW50cywgZXZlbnQudHlwZSkgJiYgZXZlbnRzW2V2ZW50LnR5cGVdKSkge1xuICAgICAgZm9yRWFjaChsaXN0ZW5lcnMuc2xpY2UoKSwgZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKChldmVudC5yZXN1bHQgPSBsaXN0ZW5lci5hcHBseShtZSwgYXJncykpID09PSBmYWxzZSkge1xuICAgICAgICAgIGV2ZW50LmNhbmNlbGxlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICFldmVudC5hYm9ydGVkO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBldmVudC5yZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBldmVudCBsaXN0ZW5lcnMgZm9yIGEgZ2l2ZW4gdHlwZSB0aGF0IGNhbiBiZSBtYW5pcHVsYXRlZFxuICAgKiB0byBhZGQgb3IgcmVtb3ZlIGxpc3RlbmVycy5cbiAgICpcbiAgICogQG1lbWJlck9mIEJlbmNobWFyaywgQmVuY2htYXJrLlN1aXRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBldmVudCB0eXBlLlxuICAgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBsaXN0ZW5lcnMgYXJyYXkuXG4gICAqL1xuICBmdW5jdGlvbiBsaXN0ZW5lcnModHlwZSkge1xuICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgIGV2ZW50cyA9IG1lLmV2ZW50cyB8fCAobWUuZXZlbnRzID0ge30pO1xuXG4gICAgcmV0dXJuIGhhc0tleShldmVudHMsIHR5cGUpID8gZXZlbnRzW3R5cGVdIDogKGV2ZW50c1t0eXBlXSA9IFtdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVycyBhIGxpc3RlbmVyIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50IHR5cGUocyksXG4gICAqIG9yIHVucmVnaXN0ZXJzIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQgdHlwZShzKSxcbiAgICogb3IgdW5yZWdpc3RlcnMgYWxsIGxpc3RlbmVycyBmb3IgYWxsIGV2ZW50IHR5cGVzLlxuICAgKlxuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLCBCZW5jaG1hcmsuU3VpdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IFt0eXBlXSBUaGUgZXZlbnQgdHlwZS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2xpc3RlbmVyXSBUaGUgZnVuY3Rpb24gdG8gdW5yZWdpc3Rlci5cbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIGJlbmNobWFyayBpbnN0YW5jZS5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogLy8gdW5yZWdpc3RlciBhIGxpc3RlbmVyIGZvciBhbiBldmVudCB0eXBlXG4gICAqIGJlbmNoLm9mZignY3ljbGUnLCBsaXN0ZW5lcik7XG4gICAqXG4gICAqIC8vIHVucmVnaXN0ZXIgYSBsaXN0ZW5lciBmb3IgbXVsdGlwbGUgZXZlbnQgdHlwZXNcbiAgICogYmVuY2gub2ZmKCdzdGFydCBjeWNsZScsIGxpc3RlbmVyKTtcbiAgICpcbiAgICogLy8gdW5yZWdpc3RlciBhbGwgbGlzdGVuZXJzIGZvciBhbiBldmVudCB0eXBlXG4gICAqIGJlbmNoLm9mZignY3ljbGUnKTtcbiAgICpcbiAgICogLy8gdW5yZWdpc3RlciBhbGwgbGlzdGVuZXJzIGZvciBtdWx0aXBsZSBldmVudCB0eXBlc1xuICAgKiBiZW5jaC5vZmYoJ3N0YXJ0IGN5Y2xlIGNvbXBsZXRlJyk7XG4gICAqXG4gICAqIC8vIHVucmVnaXN0ZXIgYWxsIGxpc3RlbmVycyBmb3IgYWxsIGV2ZW50IHR5cGVzXG4gICAqIGJlbmNoLm9mZigpO1xuICAgKi9cbiAgZnVuY3Rpb24gb2ZmKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgZXZlbnRzID0gbWUuZXZlbnRzO1xuXG4gICAgZXZlbnRzICYmIGVhY2godHlwZSA/IHR5cGUuc3BsaXQoJyAnKSA6IGV2ZW50cywgZnVuY3Rpb24obGlzdGVuZXJzLCB0eXBlKSB7XG4gICAgICB2YXIgaW5kZXg7XG4gICAgICBpZiAodHlwZW9mIGxpc3RlbmVycyA9PSAnc3RyaW5nJykge1xuICAgICAgICB0eXBlID0gbGlzdGVuZXJzO1xuICAgICAgICBsaXN0ZW5lcnMgPSBoYXNLZXkoZXZlbnRzLCB0eXBlKSAmJiBldmVudHNbdHlwZV07XG4gICAgICB9XG4gICAgICBpZiAobGlzdGVuZXJzKSB7XG4gICAgICAgIGlmIChsaXN0ZW5lcikge1xuICAgICAgICAgIGluZGV4ID0gaW5kZXhPZihsaXN0ZW5lcnMsIGxpc3RlbmVyKTtcbiAgICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgbGlzdGVuZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpc3RlbmVycy5sZW5ndGggPSAwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVycyBhIGxpc3RlbmVyIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50IHR5cGUocykuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmssIEJlbmNobWFyay5TdWl0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBUaGUgZXZlbnQgdHlwZS5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgVGhlIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgYmVuY2htYXJrIGluc3RhbmNlLlxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiAvLyByZWdpc3RlciBhIGxpc3RlbmVyIGZvciBhbiBldmVudCB0eXBlXG4gICAqIGJlbmNoLm9uKCdjeWNsZScsIGxpc3RlbmVyKTtcbiAgICpcbiAgICogLy8gcmVnaXN0ZXIgYSBsaXN0ZW5lciBmb3IgbXVsdGlwbGUgZXZlbnQgdHlwZXNcbiAgICogYmVuY2gub24oJ3N0YXJ0IGN5Y2xlJywgbGlzdGVuZXIpO1xuICAgKi9cbiAgZnVuY3Rpb24gb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICBldmVudHMgPSBtZS5ldmVudHMgfHwgKG1lLmV2ZW50cyA9IHt9KTtcblxuICAgIGZvckVhY2godHlwZS5zcGxpdCgnICcpLCBmdW5jdGlvbih0eXBlKSB7XG4gICAgICAoaGFzS2V5KGV2ZW50cywgdHlwZSlcbiAgICAgICAgPyBldmVudHNbdHlwZV1cbiAgICAgICAgOiAoZXZlbnRzW3R5cGVdID0gW10pXG4gICAgICApLnB1c2gobGlzdGVuZXIpO1xuICAgIH0pO1xuICAgIHJldHVybiBtZTtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBBYm9ydHMgdGhlIGJlbmNobWFyayB3aXRob3V0IHJlY29yZGluZyB0aW1lcy5cbiAgICpcbiAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgYmVuY2htYXJrIGluc3RhbmNlLlxuICAgKi9cbiAgZnVuY3Rpb24gYWJvcnQoKSB7XG4gICAgdmFyIGV2ZW50LFxuICAgICAgICBtZSA9IHRoaXMsXG4gICAgICAgIHJlc2V0dGluZyA9IGNhbGxlZEJ5LnJlc2V0O1xuXG4gICAgaWYgKG1lLnJ1bm5pbmcpIHtcbiAgICAgIGV2ZW50ID0gRXZlbnQoJ2Fib3J0Jyk7XG4gICAgICBtZS5lbWl0KGV2ZW50KTtcbiAgICAgIGlmICghZXZlbnQuY2FuY2VsbGVkIHx8IHJlc2V0dGluZykge1xuICAgICAgICAvLyBhdm9pZCBpbmZpbml0ZSByZWN1cnNpb25cbiAgICAgICAgY2FsbGVkQnkuYWJvcnQgPSB0cnVlO1xuICAgICAgICBtZS5yZXNldCgpO1xuICAgICAgICBkZWxldGUgY2FsbGVkQnkuYWJvcnQ7XG5cbiAgICAgICAgaWYgKHN1cHBvcnQudGltZW91dCkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChtZS5fdGltZXJJZCk7XG4gICAgICAgICAgZGVsZXRlIG1lLl90aW1lcklkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcmVzZXR0aW5nKSB7XG4gICAgICAgICAgbWUuYWJvcnRlZCA9IHRydWU7XG4gICAgICAgICAgbWUucnVubmluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGJlbmNobWFyayB1c2luZyB0aGUgc2FtZSB0ZXN0IGFuZCBvcHRpb25zLlxuICAgKlxuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJ3cml0ZSBjbG9uZWQgb3B0aW9ucy5cbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIG5ldyBiZW5jaG1hcmsgaW5zdGFuY2UuXG4gICAqIEBleGFtcGxlXG4gICAqXG4gICAqIHZhciBiaXphcnJvID0gYmVuY2guY2xvbmUoe1xuICAgKiAgICduYW1lJzogJ2RvcHBlbGdhbmdlcidcbiAgICogfSk7XG4gICAqL1xuICBmdW5jdGlvbiBjbG9uZShvcHRpb25zKSB7XG4gICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgcmVzdWx0ID0gbmV3IG1lLmNvbnN0cnVjdG9yKGV4dGVuZCh7fSwgbWUsIG9wdGlvbnMpKTtcblxuICAgIC8vIGNvcnJlY3QgdGhlIGBvcHRpb25zYCBvYmplY3RcbiAgICByZXN1bHQub3B0aW9ucyA9IGV4dGVuZCh7fSwgbWUub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAvLyBjb3B5IG93biBjdXN0b20gcHJvcGVydGllc1xuICAgIGZvck93bihtZSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgaWYgKCFoYXNLZXkocmVzdWx0LCBrZXkpKSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gZGVlcENsb25lKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYSBiZW5jaG1hcmsgaXMgZmFzdGVyIHRoYW4gYW5vdGhlci5cbiAgICpcbiAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgKiBAcGFyYW0ge09iamVjdH0gb3RoZXIgVGhlIGJlbmNobWFyayB0byBjb21wYXJlLlxuICAgKiBAcmV0dXJucyB7TnVtYmVyfSBSZXR1cm5zIGAtMWAgaWYgc2xvd2VyLCBgMWAgaWYgZmFzdGVyLCBhbmQgYDBgIGlmIGluZGV0ZXJtaW5hdGUuXG4gICAqL1xuICBmdW5jdGlvbiBjb21wYXJlKG90aGVyKSB7XG4gICAgdmFyIGNyaXRpY2FsLFxuICAgICAgICB6U3RhdCxcbiAgICAgICAgbWUgPSB0aGlzLFxuICAgICAgICBzYW1wbGUxID0gbWUuc3RhdHMuc2FtcGxlLFxuICAgICAgICBzYW1wbGUyID0gb3RoZXIuc3RhdHMuc2FtcGxlLFxuICAgICAgICBzaXplMSA9IHNhbXBsZTEubGVuZ3RoLFxuICAgICAgICBzaXplMiA9IHNhbXBsZTIubGVuZ3RoLFxuICAgICAgICBtYXhTaXplID0gbWF4KHNpemUxLCBzaXplMiksXG4gICAgICAgIG1pblNpemUgPSBtaW4oc2l6ZTEsIHNpemUyKSxcbiAgICAgICAgdTEgPSBnZXRVKHNhbXBsZTEsIHNhbXBsZTIpLFxuICAgICAgICB1MiA9IGdldFUoc2FtcGxlMiwgc2FtcGxlMSksXG4gICAgICAgIHUgPSBtaW4odTEsIHUyKTtcblxuICAgIGZ1bmN0aW9uIGdldFNjb3JlKHhBLCBzYW1wbGVCKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKHNhbXBsZUIsIGZ1bmN0aW9uKHRvdGFsLCB4Qikge1xuICAgICAgICByZXR1cm4gdG90YWwgKyAoeEIgPiB4QSA/IDAgOiB4QiA8IHhBID8gMSA6IDAuNSk7XG4gICAgICB9LCAwKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRVKHNhbXBsZUEsIHNhbXBsZUIpIHtcbiAgICAgIHJldHVybiByZWR1Y2Uoc2FtcGxlQSwgZnVuY3Rpb24odG90YWwsIHhBKSB7XG4gICAgICAgIHJldHVybiB0b3RhbCArIGdldFNjb3JlKHhBLCBzYW1wbGVCKTtcbiAgICAgIH0sIDApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFoodSkge1xuICAgICAgcmV0dXJuICh1IC0gKChzaXplMSAqIHNpemUyKSAvIDIpKSAvIHNxcnQoKHNpemUxICogc2l6ZTIgKiAoc2l6ZTEgKyBzaXplMiArIDEpKSAvIDEyKTtcbiAgICB9XG5cbiAgICAvLyBleGl0IGVhcmx5IGlmIGNvbXBhcmluZyB0aGUgc2FtZSBiZW5jaG1hcmtcbiAgICBpZiAobWUgPT0gb3RoZXIpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICAvLyByZWplY3QgdGhlIG51bGwgaHlwaG90aGVzaXMgdGhlIHR3byBzYW1wbGVzIGNvbWUgZnJvbSB0aGVcbiAgICAvLyBzYW1lIHBvcHVsYXRpb24gKGkuZS4gaGF2ZSB0aGUgc2FtZSBtZWRpYW4pIGlmLi4uXG4gICAgaWYgKHNpemUxICsgc2l6ZTIgPiAzMCkge1xuICAgICAgLy8gLi4udGhlIHotc3RhdCBpcyBncmVhdGVyIHRoYW4gMS45NiBvciBsZXNzIHRoYW4gLTEuOTZcbiAgICAgIC8vIGh0dHA6Ly93d3cuc3RhdGlzdGljc2xlY3R1cmVzLmNvbS90b3BpY3MvbWFubndoaXRuZXl1L1xuICAgICAgelN0YXQgPSBnZXRaKHUpO1xuICAgICAgcmV0dXJuIGFicyh6U3RhdCkgPiAxLjk2ID8gKHpTdGF0ID4gMCA/IC0xIDogMSkgOiAwO1xuICAgIH1cbiAgICAvLyAuLi50aGUgVSB2YWx1ZSBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdGhlIGNyaXRpY2FsIFUgdmFsdWVcbiAgICAvLyBodHRwOi8vd3d3Lmdlb2liLmNvbS9tYW5uLXdoaXRuZXktdS10ZXN0Lmh0bWxcbiAgICBjcml0aWNhbCA9IG1heFNpemUgPCA1IHx8IG1pblNpemUgPCAzID8gMCA6IHVUYWJsZVttYXhTaXplXVttaW5TaXplIC0gM107XG4gICAgcmV0dXJuIHUgPD0gY3JpdGljYWwgPyAodSA9PSB1MSA/IDEgOiAtMSkgOiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHByb3BlcnRpZXMgYW5kIGFib3J0IGlmIHJ1bm5pbmcuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIGJlbmNobWFyayBpbnN0YW5jZS5cbiAgICovXG4gIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIHZhciBkYXRhLFxuICAgICAgICBldmVudCxcbiAgICAgICAgbWUgPSB0aGlzLFxuICAgICAgICBpbmRleCA9IDAsXG4gICAgICAgIGNoYW5nZXMgPSB7ICdsZW5ndGgnOiAwIH0sXG4gICAgICAgIHF1ZXVlID0geyAnbGVuZ3RoJzogMCB9O1xuXG4gICAgaWYgKG1lLnJ1bm5pbmcgJiYgIWNhbGxlZEJ5LmFib3J0KSB7XG4gICAgICAvLyBubyB3b3JyaWVzLCBgcmVzZXQoKWAgaXMgY2FsbGVkIHdpdGhpbiBgYWJvcnQoKWBcbiAgICAgIGNhbGxlZEJ5LnJlc2V0ID0gdHJ1ZTtcbiAgICAgIG1lLmFib3J0KCk7XG4gICAgICBkZWxldGUgY2FsbGVkQnkucmVzZXQ7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gYSBub24tcmVjdXJzaXZlIHNvbHV0aW9uIHRvIGNoZWNrIGlmIHByb3BlcnRpZXMgaGF2ZSBjaGFuZ2VkXG4gICAgICAvLyBodHRwOi8vd3d3LmpzbGFiLmRrL2FydGljbGVzL25vbi5yZWN1cnNpdmUucHJlb3JkZXIudHJhdmVyc2FsLnBhcnQ0XG4gICAgICBkYXRhID0geyAnZGVzdGluYXRpb24nOiBtZSwgJ3NvdXJjZSc6IGV4dGVuZCh7fSwgbWUuY29uc3RydWN0b3IucHJvdG90eXBlLCBtZS5vcHRpb25zKSB9O1xuICAgICAgZG8ge1xuICAgICAgICBmb3JPd24oZGF0YS5zb3VyY2UsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICB2YXIgY2hhbmdlZCxcbiAgICAgICAgICAgICAgZGVzdGluYXRpb24gPSBkYXRhLmRlc3RpbmF0aW9uLFxuICAgICAgICAgICAgICBjdXJyVmFsdWUgPSBkZXN0aW5hdGlvbltrZXldO1xuXG4gICAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKGlzQ2xhc3NPZih2YWx1ZSwgJ0FycmF5JykpIHtcbiAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgYW4gYXJyYXkgdmFsdWUgaGFzIGNoYW5nZWQgdG8gYSBub24tYXJyYXkgdmFsdWVcbiAgICAgICAgICAgICAgaWYgKCFpc0NsYXNzT2YoY3VyclZhbHVlLCAnQXJyYXknKSkge1xuICAgICAgICAgICAgICAgIGNoYW5nZWQgPSBjdXJyVmFsdWUgPSBbXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBvciBoYXMgY2hhbmdlZCBpdHMgbGVuZ3RoXG4gICAgICAgICAgICAgIGlmIChjdXJyVmFsdWUubGVuZ3RoICE9IHZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNoYW5nZWQgPSBjdXJyVmFsdWUgPSBjdXJyVmFsdWUuc2xpY2UoMCwgdmFsdWUubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICBjdXJyVmFsdWUubGVuZ3RoID0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjaGVjayBpZiBhbiBvYmplY3QgaGFzIGNoYW5nZWQgdG8gYSBub24tb2JqZWN0IHZhbHVlXG4gICAgICAgICAgICBlbHNlIGlmICghY3VyclZhbHVlIHx8IHR5cGVvZiBjdXJyVmFsdWUgIT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgY2hhbmdlZCA9IGN1cnJWYWx1ZSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcmVnaXN0ZXIgYSBjaGFuZ2VkIG9iamVjdFxuICAgICAgICAgICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgY2hhbmdlc1tjaGFuZ2VzLmxlbmd0aCsrXSA9IHsgJ2Rlc3RpbmF0aW9uJzogZGVzdGluYXRpb24sICdrZXknOiBrZXksICd2YWx1ZSc6IGN1cnJWYWx1ZSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcXVldWVbcXVldWUubGVuZ3RoKytdID0geyAnZGVzdGluYXRpb24nOiBjdXJyVmFsdWUsICdzb3VyY2UnOiB2YWx1ZSB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyByZWdpc3RlciBhIGNoYW5nZWQgcHJpbWl0aXZlXG4gICAgICAgICAgZWxzZSBpZiAodmFsdWUgIT09IGN1cnJWYWx1ZSAmJiAhKHZhbHVlID09IG51bGwgfHwgaXNDbGFzc09mKHZhbHVlLCAnRnVuY3Rpb24nKSkpIHtcbiAgICAgICAgICAgIGNoYW5nZXNbY2hhbmdlcy5sZW5ndGgrK10gPSB7ICdkZXN0aW5hdGlvbic6IGRlc3RpbmF0aW9uLCAna2V5Jzoga2V5LCAndmFsdWUnOiB2YWx1ZSB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB3aGlsZSAoKGRhdGEgPSBxdWV1ZVtpbmRleCsrXSkpO1xuXG4gICAgICAvLyBpZiBjaGFuZ2VkIGVtaXQgdGhlIGByZXNldGAgZXZlbnQgYW5kIGlmIGl0IGlzbid0IGNhbmNlbGxlZCByZXNldCB0aGUgYmVuY2htYXJrXG4gICAgICBpZiAoY2hhbmdlcy5sZW5ndGggJiYgKG1lLmVtaXQoZXZlbnQgPSBFdmVudCgncmVzZXQnKSksICFldmVudC5jYW5jZWxsZWQpKSB7XG4gICAgICAgIGZvckVhY2goY2hhbmdlcywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGRhdGEuZGVzdGluYXRpb25bZGF0YS5rZXldID0gZGF0YS52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNwbGF5cyByZWxldmFudCBiZW5jaG1hcmsgaW5mb3JtYXRpb24gd2hlbiBjb2VyY2VkIHRvIGEgc3RyaW5nLlxuICAgKlxuICAgKiBAbmFtZSB0b1N0cmluZ1xuICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBiZW5jaG1hcmsgaW5zdGFuY2UuXG4gICAqL1xuICBmdW5jdGlvbiB0b1N0cmluZ0JlbmNoKCkge1xuICAgIHZhciBtZSA9IHRoaXMsXG4gICAgICAgIGVycm9yID0gbWUuZXJyb3IsXG4gICAgICAgIGh6ID0gbWUuaHosXG4gICAgICAgIGlkID0gbWUuaWQsXG4gICAgICAgIHN0YXRzID0gbWUuc3RhdHMsXG4gICAgICAgIHNpemUgPSBzdGF0cy5zYW1wbGUubGVuZ3RoLFxuICAgICAgICBwbSA9IHN1cHBvcnQuamF2YSA/ICcrLy0nIDogJ1xceGIxJyxcbiAgICAgICAgcmVzdWx0ID0gbWUubmFtZSB8fCAoaXNOYU4oaWQpID8gaWQgOiAnPFRlc3QgIycgKyBpZCArICc+Jyk7XG5cbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHJlc3VsdCArPSAnOiAnICsgam9pbihlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSAnIHggJyArIGZvcm1hdE51bWJlcihoei50b0ZpeGVkKGh6IDwgMTAwID8gMiA6IDApKSArICcgb3BzL3NlYyAnICsgcG0gK1xuICAgICAgICBzdGF0cy5ybWUudG9GaXhlZCgyKSArICclICgnICsgc2l6ZSArICcgcnVuJyArIChzaXplID09IDEgPyAnJyA6ICdzJykgKyAnIHNhbXBsZWQpJztcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBDbG9ja3MgdGhlIHRpbWUgdGFrZW4gdG8gZXhlY3V0ZSBhIHRlc3QgcGVyIGN5Y2xlIChzZWNzKS5cbiAgICpcbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGJlbmNoIFRoZSBiZW5jaG1hcmsgaW5zdGFuY2UuXG4gICAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSB0aW1lIHRha2VuLlxuICAgKi9cbiAgZnVuY3Rpb24gY2xvY2soKSB7XG4gICAgdmFyIGFwcGxldCxcbiAgICAgICAgb3B0aW9ucyA9IEJlbmNobWFyay5vcHRpb25zLFxuICAgICAgICB0ZW1wbGF0ZSA9IHsgJ2JlZ2luJzogJ3MkPW5ldyBuJCcsICdlbmQnOiAnciQ9KG5ldyBuJC1zJCkvMWUzJywgJ3VpZCc6IHVpZCB9LFxuICAgICAgICB0aW1lcnMgPSBbeyAnbnMnOiB0aW1lci5ucywgJ3Jlcyc6IG1heCgwLjAwMTUsIGdldFJlcygnbXMnKSksICd1bml0JzogJ21zJyB9XTtcblxuICAgIC8vIGxhenkgZGVmaW5lIGZvciBoaS1yZXMgdGltZXJzXG4gICAgY2xvY2sgPSBmdW5jdGlvbihjbG9uZSkge1xuICAgICAgdmFyIGRlZmVycmVkO1xuICAgICAgaWYgKGNsb25lIGluc3RhbmNlb2YgRGVmZXJyZWQpIHtcbiAgICAgICAgZGVmZXJyZWQgPSBjbG9uZTtcbiAgICAgICAgY2xvbmUgPSBkZWZlcnJlZC5iZW5jaG1hcms7XG4gICAgICB9XG5cbiAgICAgIHZhciBiZW5jaCA9IGNsb25lLl9vcmlnaW5hbCxcbiAgICAgICAgICBmbiA9IGJlbmNoLmZuLFxuICAgICAgICAgIGZuQXJnID0gZGVmZXJyZWQgPyBnZXRGaXJzdEFyZ3VtZW50KGZuKSB8fCAnZGVmZXJyZWQnIDogJycsXG4gICAgICAgICAgc3RyaW5nYWJsZSA9IGlzU3RyaW5nYWJsZShmbik7XG5cbiAgICAgIHZhciBzb3VyY2UgPSB7XG4gICAgICAgICdzZXR1cCc6IGdldFNvdXJjZShiZW5jaC5zZXR1cCwgcHJlcHJvY2VzcygnbSQuc2V0dXAoKScpKSxcbiAgICAgICAgJ2ZuJzogZ2V0U291cmNlKGZuLCBwcmVwcm9jZXNzKCdtJC5mbignICsgZm5BcmcgKyAnKScpKSxcbiAgICAgICAgJ2ZuQXJnJzogZm5BcmcsXG4gICAgICAgICd0ZWFyZG93bic6IGdldFNvdXJjZShiZW5jaC50ZWFyZG93biwgcHJlcHJvY2VzcygnbSQudGVhcmRvd24oKScpKVxuICAgICAgfTtcblxuICAgICAgdmFyIGNvdW50ID0gYmVuY2guY291bnQgPSBjbG9uZS5jb3VudCxcbiAgICAgICAgICBkZWNvbXBpbGFibGUgPSBzdXBwb3J0LmRlY29tcGlsYXRpb24gfHwgc3RyaW5nYWJsZSxcbiAgICAgICAgICBpZCA9IGJlbmNoLmlkLFxuICAgICAgICAgIGlzRW1wdHkgPSAhKHNvdXJjZS5mbiB8fCBzdHJpbmdhYmxlKSxcbiAgICAgICAgICBuYW1lID0gYmVuY2gubmFtZSB8fCAodHlwZW9mIGlkID09ICdudW1iZXInID8gJzxUZXN0ICMnICsgaWQgKyAnPicgOiBpZCksXG4gICAgICAgICAgbnMgPSB0aW1lci5ucyxcbiAgICAgICAgICByZXN1bHQgPSAwO1xuXG4gICAgICAvLyBpbml0IGBtaW5UaW1lYCBpZiBuZWVkZWRcbiAgICAgIGNsb25lLm1pblRpbWUgPSBiZW5jaC5taW5UaW1lIHx8IChiZW5jaC5taW5UaW1lID0gYmVuY2gub3B0aW9ucy5taW5UaW1lID0gb3B0aW9ucy5taW5UaW1lKTtcblxuICAgICAgLy8gcmVwYWlyIG5hbm9zZWNvbmQgdGltZXJcbiAgICAgIC8vIChzb21lIENocm9tZSBidWlsZHMgZXJhc2UgdGhlIGBuc2AgdmFyaWFibGUgYWZ0ZXIgbWlsbGlvbnMgb2YgZXhlY3V0aW9ucylcbiAgICAgIGlmIChhcHBsZXQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBucy5uYW5vVGltZSgpO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAvLyB1c2Ugbm9uLWVsZW1lbnQgdG8gYXZvaWQgaXNzdWVzIHdpdGggbGlicyB0aGF0IGF1Z21lbnQgdGhlbVxuICAgICAgICAgIG5zID0gdGltZXIubnMgPSBuZXcgYXBwbGV0LlBhY2thZ2VzLm5hbm87XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQ29tcGlsZSBpbiBzZXR1cC90ZWFyZG93biBmdW5jdGlvbnMgYW5kIHRoZSB0ZXN0IGxvb3AuXG4gICAgICAvLyBDcmVhdGUgYSBuZXcgY29tcGlsZWQgdGVzdCwgaW5zdGVhZCBvZiB1c2luZyB0aGUgY2FjaGVkIGBiZW5jaC5jb21waWxlZGAsXG4gICAgICAvLyB0byBhdm9pZCBwb3RlbnRpYWwgZW5naW5lIG9wdGltaXphdGlvbnMgZW5hYmxlZCBvdmVyIHRoZSBsaWZlIG9mIHRoZSB0ZXN0LlxuICAgICAgdmFyIGNvbXBpbGVkID0gYmVuY2guY29tcGlsZWQgPSBjcmVhdGVGdW5jdGlvbihwcmVwcm9jZXNzKCd0JCcpLCBpbnRlcnBvbGF0ZShcbiAgICAgICAgcHJlcHJvY2VzcyhkZWZlcnJlZFxuICAgICAgICAgID8gJ3ZhciBkJD10aGlzLCN7Zm5Bcmd9PWQkLG0kPWQkLmJlbmNobWFyay5fb3JpZ2luYWwsZiQ9bSQuZm4sc3UkPW0kLnNldHVwLHRkJD1tJC50ZWFyZG93bjsnICtcbiAgICAgICAgICAgIC8vIHdoZW4gYGRlZmVycmVkLmN5Y2xlc2AgaXMgYDBgIHRoZW4uLi5cbiAgICAgICAgICAgICdpZighZCQuY3ljbGVzKXsnICtcbiAgICAgICAgICAgIC8vIHNldCBgZGVmZXJyZWQuZm5gXG4gICAgICAgICAgICAnZCQuZm49ZnVuY3Rpb24oKXt2YXIgI3tmbkFyZ309ZCQ7aWYodHlwZW9mIGYkPT1cImZ1bmN0aW9uXCIpe3RyeXsje2ZufVxcbn1jYXRjaChlJCl7ZiQoZCQpfX1lbHNleyN7Zm59XFxufX07JyArXG4gICAgICAgICAgICAvLyBzZXQgYGRlZmVycmVkLnRlYXJkb3duYFxuICAgICAgICAgICAgJ2QkLnRlYXJkb3duPWZ1bmN0aW9uKCl7ZCQuY3ljbGVzPTA7aWYodHlwZW9mIHRkJD09XCJmdW5jdGlvblwiKXt0cnl7I3t0ZWFyZG93bn1cXG59Y2F0Y2goZSQpe3RkJCgpfX1lbHNleyN7dGVhcmRvd259XFxufX07JyArXG4gICAgICAgICAgICAvLyBleGVjdXRlIHRoZSBiZW5jaG1hcmsncyBgc2V0dXBgXG4gICAgICAgICAgICAnaWYodHlwZW9mIHN1JD09XCJmdW5jdGlvblwiKXt0cnl7I3tzZXR1cH1cXG59Y2F0Y2goZSQpe3N1JCgpfX1lbHNleyN7c2V0dXB9XFxufTsnICtcbiAgICAgICAgICAgIC8vIHN0YXJ0IHRpbWVyXG4gICAgICAgICAgICAndCQuc3RhcnQoZCQpOycgK1xuICAgICAgICAgICAgLy8gZXhlY3V0ZSBgZGVmZXJyZWQuZm5gIGFuZCByZXR1cm4gYSBkdW1teSBvYmplY3RcbiAgICAgICAgICAgICd9ZCQuZm4oKTtyZXR1cm57fSdcblxuICAgICAgICAgIDogJ3ZhciByJCxzJCxtJD10aGlzLGYkPW0kLmZuLGkkPW0kLmNvdW50LG4kPXQkLm5zOyN7c2V0dXB9XFxuI3tiZWdpbn07JyArXG4gICAgICAgICAgICAnd2hpbGUoaSQtLSl7I3tmbn1cXG59I3tlbmR9OyN7dGVhcmRvd259XFxucmV0dXJue2VsYXBzZWQ6ciQsdWlkOlwiI3t1aWR9XCJ9JyksXG4gICAgICAgIHNvdXJjZVxuICAgICAgKSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChpc0VtcHR5KSB7XG4gICAgICAgICAgLy8gRmlyZWZveCBtYXkgcmVtb3ZlIGRlYWQgY29kZSBmcm9tIEZ1bmN0aW9uI3RvU3RyaW5nIHJlc3VsdHNcbiAgICAgICAgICAvLyBodHRwOi8vYnVnemlsLmxhLzUzNjA4NVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIHRlc3QgXCInICsgbmFtZSArICdcIiBpcyBlbXB0eS4gVGhpcyBtYXkgYmUgdGhlIHJlc3VsdCBvZiBkZWFkIGNvZGUgcmVtb3ZhbC4nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICghZGVmZXJyZWQpIHtcbiAgICAgICAgICAvLyBwcmV0ZXN0IHRvIGRldGVybWluZSBpZiBjb21waWxlZCBjb2RlIGlzIGV4aXRzIGVhcmx5LCB1c3VhbGx5IGJ5IGFcbiAgICAgICAgICAvLyByb2d1ZSBgcmV0dXJuYCBzdGF0ZW1lbnQsIGJ5IGNoZWNraW5nIGZvciBhIHJldHVybiBvYmplY3Qgd2l0aCB0aGUgdWlkXG4gICAgICAgICAgYmVuY2guY291bnQgPSAxO1xuICAgICAgICAgIGNvbXBpbGVkID0gKGNvbXBpbGVkLmNhbGwoYmVuY2gsIHRpbWVyKSB8fCB7fSkudWlkID09IHVpZCAmJiBjb21waWxlZDtcbiAgICAgICAgICBiZW5jaC5jb3VudCA9IGNvdW50O1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgY29tcGlsZWQgPSBudWxsO1xuICAgICAgICBjbG9uZS5lcnJvciA9IGUgfHwgbmV3IEVycm9yKFN0cmluZyhlKSk7XG4gICAgICAgIGJlbmNoLmNvdW50ID0gY291bnQ7XG4gICAgICB9XG4gICAgICAvLyBmYWxsYmFjayB3aGVuIGEgdGVzdCBleGl0cyBlYXJseSBvciBlcnJvcnMgZHVyaW5nIHByZXRlc3RcbiAgICAgIGlmIChkZWNvbXBpbGFibGUgJiYgIWNvbXBpbGVkICYmICFkZWZlcnJlZCAmJiAhaXNFbXB0eSkge1xuICAgICAgICBjb21waWxlZCA9IGNyZWF0ZUZ1bmN0aW9uKHByZXByb2Nlc3MoJ3QkJyksIGludGVycG9sYXRlKFxuICAgICAgICAgIHByZXByb2Nlc3MoXG4gICAgICAgICAgICAoY2xvbmUuZXJyb3IgJiYgIXN0cmluZ2FibGVcbiAgICAgICAgICAgICAgPyAndmFyIHIkLHMkLG0kPXRoaXMsZiQ9bSQuZm4saSQ9bSQuY291bnQnXG4gICAgICAgICAgICAgIDogJ2Z1bmN0aW9uIGYkKCl7I3tmbn1cXG59dmFyIHIkLHMkLG0kPXRoaXMsaSQ9bSQuY291bnQnXG4gICAgICAgICAgICApICtcbiAgICAgICAgICAgICcsbiQ9dCQubnM7I3tzZXR1cH1cXG4je2JlZ2lufTttJC5mJD1mJDt3aGlsZShpJC0tKXttJC5mJCgpfSN7ZW5kfTsnICtcbiAgICAgICAgICAgICdkZWxldGUgbSQuZiQ7I3t0ZWFyZG93bn1cXG5yZXR1cm57ZWxhcHNlZDpyJH0nXG4gICAgICAgICAgKSxcbiAgICAgICAgICBzb3VyY2VcbiAgICAgICAgKSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBwcmV0ZXN0IG9uZSBtb3JlIHRpbWUgdG8gY2hlY2sgZm9yIGVycm9yc1xuICAgICAgICAgIGJlbmNoLmNvdW50ID0gMTtcbiAgICAgICAgICBjb21waWxlZC5jYWxsKGJlbmNoLCB0aW1lcik7XG4gICAgICAgICAgYmVuY2guY29tcGlsZWQgPSBjb21waWxlZDtcbiAgICAgICAgICBiZW5jaC5jb3VudCA9IGNvdW50O1xuICAgICAgICAgIGRlbGV0ZSBjbG9uZS5lcnJvcjtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaChlKSB7XG4gICAgICAgICAgYmVuY2guY291bnQgPSBjb3VudDtcbiAgICAgICAgICBpZiAoY2xvbmUuZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbXBpbGVkID0gbnVsbDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmVuY2guY29tcGlsZWQgPSBjb21waWxlZDtcbiAgICAgICAgICAgIGNsb25lLmVycm9yID0gZSB8fCBuZXcgRXJyb3IoU3RyaW5nKGUpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGFzc2lnbiBgY29tcGlsZWRgIHRvIGBjbG9uZWAgYmVmb3JlIGNhbGxpbmcgaW4gY2FzZSBhIGRlZmVycmVkIGJlbmNobWFya1xuICAgICAgLy8gaW1tZWRpYXRlbHkgY2FsbHMgYGRlZmVycmVkLnJlc29sdmUoKWBcbiAgICAgIGNsb25lLmNvbXBpbGVkID0gY29tcGlsZWQ7XG4gICAgICAvLyBpZiBubyBlcnJvcnMgcnVuIHRoZSBmdWxsIHRlc3QgbG9vcFxuICAgICAgaWYgKCFjbG9uZS5lcnJvcikge1xuICAgICAgICByZXN1bHQgPSBjb21waWxlZC5jYWxsKGRlZmVycmVkIHx8IGJlbmNoLCB0aW1lcikuZWxhcHNlZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGN1cnJlbnQgdGltZXIncyBtaW5pbXVtIHJlc29sdXRpb24gKHNlY3MpLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGdldFJlcyh1bml0KSB7XG4gICAgICB2YXIgbWVhc3VyZWQsXG4gICAgICAgICAgYmVnaW4sXG4gICAgICAgICAgY291bnQgPSAzMCxcbiAgICAgICAgICBkaXZpc29yID0gMWUzLFxuICAgICAgICAgIG5zID0gdGltZXIubnMsXG4gICAgICAgICAgc2FtcGxlID0gW107XG5cbiAgICAgIC8vIGdldCBhdmVyYWdlIHNtYWxsZXN0IG1lYXN1cmFibGUgdGltZVxuICAgICAgd2hpbGUgKGNvdW50LS0pIHtcbiAgICAgICAgaWYgKHVuaXQgPT0gJ3VzJykge1xuICAgICAgICAgIGRpdmlzb3IgPSAxZTY7XG4gICAgICAgICAgaWYgKG5zLnN0b3ApIHtcbiAgICAgICAgICAgIG5zLnN0YXJ0KCk7XG4gICAgICAgICAgICB3aGlsZSAoIShtZWFzdXJlZCA9IG5zLm1pY3Jvc2Vjb25kcygpKSkgeyB9XG4gICAgICAgICAgfSBlbHNlIGlmIChuc1twZXJmTmFtZV0pIHtcbiAgICAgICAgICAgIGRpdmlzb3IgPSAxZTM7XG4gICAgICAgICAgICBtZWFzdXJlZCA9IEZ1bmN0aW9uKCduJywgJ3ZhciByLHM9bi4nICsgcGVyZk5hbWUgKyAnKCk7d2hpbGUoIShyPW4uJyArIHBlcmZOYW1lICsgJygpLXMpKXt9O3JldHVybiByJykobnMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBiZWdpbiA9IG5zKCk7XG4gICAgICAgICAgICB3aGlsZSAoIShtZWFzdXJlZCA9IG5zKCkgLSBiZWdpbikpIHsgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh1bml0ID09ICducycpIHtcbiAgICAgICAgICBkaXZpc29yID0gMWU5O1xuICAgICAgICAgIGlmIChucy5uYW5vVGltZSkge1xuICAgICAgICAgICAgYmVnaW4gPSBucy5uYW5vVGltZSgpO1xuICAgICAgICAgICAgd2hpbGUgKCEobWVhc3VyZWQgPSBucy5uYW5vVGltZSgpIC0gYmVnaW4pKSB7IH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYmVnaW4gPSAoYmVnaW4gPSBucygpKVswXSArIChiZWdpblsxXSAvIGRpdmlzb3IpO1xuICAgICAgICAgICAgd2hpbGUgKCEobWVhc3VyZWQgPSAoKG1lYXN1cmVkID0gbnMoKSlbMF0gKyAobWVhc3VyZWRbMV0gLyBkaXZpc29yKSkgLSBiZWdpbikpIHsgfVxuICAgICAgICAgICAgZGl2aXNvciA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGJlZ2luID0gbmV3IG5zO1xuICAgICAgICAgIHdoaWxlICghKG1lYXN1cmVkID0gbmV3IG5zIC0gYmVnaW4pKSB7IH1cbiAgICAgICAgfVxuICAgICAgICAvLyBjaGVjayBmb3IgYnJva2VuIHRpbWVycyAobmFub1RpbWUgbWF5IGhhdmUgaXNzdWVzKVxuICAgICAgICAvLyBodHRwOi8vYWxpdmVidXRzbGVlcHkuc3JuZXQuY3ovdW5yZWxpYWJsZS1zeXN0ZW0tbmFub3RpbWUvXG4gICAgICAgIGlmIChtZWFzdXJlZCA+IDApIHtcbiAgICAgICAgICBzYW1wbGUucHVzaChtZWFzdXJlZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2FtcGxlLnB1c2goSW5maW5pdHkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBjb252ZXJ0IHRvIHNlY29uZHNcbiAgICAgIHJldHVybiBnZXRNZWFuKHNhbXBsZSkgLyBkaXZpc29yO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlcGxhY2VzIGFsbCBvY2N1cnJlbmNlcyBvZiBgJGAgd2l0aCBhIHVuaXF1ZSBudW1iZXIgYW5kXG4gICAgICogdGVtcGxhdGUgdG9rZW5zIHdpdGggY29udGVudC5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBwcmVwcm9jZXNzKGNvZGUpIHtcbiAgICAgIHJldHVybiBpbnRlcnBvbGF0ZShjb2RlLCB0ZW1wbGF0ZSkucmVwbGFjZSgvXFwkL2csIC9cXGQrLy5leGVjKHVpZCkpO1xuICAgIH1cblxuICAgIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAgIC8vIGRldGVjdCBuYW5vc2Vjb25kIHN1cHBvcnQgZnJvbSBhIEphdmEgYXBwbGV0XG4gICAgZWFjaChkb2MgJiYgZG9jLmFwcGxldHMgfHwgW10sIGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICAgIHJldHVybiAhKHRpbWVyLm5zID0gYXBwbGV0ID0gJ25hbm9UaW1lJyBpbiBlbGVtZW50ICYmIGVsZW1lbnQpO1xuICAgIH0pO1xuXG4gICAgLy8gY2hlY2sgdHlwZSBpbiBjYXNlIFNhZmFyaSByZXR1cm5zIGFuIG9iamVjdCBpbnN0ZWFkIG9mIGEgbnVtYmVyXG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgdGltZXIubnMubmFub1RpbWUoKSA9PSAnbnVtYmVyJykge1xuICAgICAgICB0aW1lcnMucHVzaCh7ICducyc6IHRpbWVyLm5zLCAncmVzJzogZ2V0UmVzKCducycpLCAndW5pdCc6ICducycgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaChlKSB7IH1cblxuICAgIC8vIGRldGVjdCBDaHJvbWUncyBtaWNyb3NlY29uZCB0aW1lcjpcbiAgICAvLyBlbmFibGUgYmVuY2htYXJraW5nIHZpYSB0aGUgLS1lbmFibGUtYmVuY2htYXJraW5nIGNvbW1hbmRcbiAgICAvLyBsaW5lIHN3aXRjaCBpbiBhdCBsZWFzdCBDaHJvbWUgNyB0byB1c2UgY2hyb21lLkludGVydmFsXG4gICAgdHJ5IHtcbiAgICAgIGlmICgodGltZXIubnMgPSBuZXcgKHdpbmRvdy5jaHJvbWUgfHwgd2luZG93LmNocm9taXVtKS5JbnRlcnZhbCkpIHtcbiAgICAgICAgdGltZXJzLnB1c2goeyAnbnMnOiB0aW1lci5ucywgJ3Jlcyc6IGdldFJlcygndXMnKSwgJ3VuaXQnOiAndXMnIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2goZSkgeyB9XG5cbiAgICAvLyBkZXRlY3QgYHBlcmZvcm1hbmNlLm5vd2AgbWljcm9zZWNvbmQgcmVzb2x1dGlvbiB0aW1lclxuICAgIGlmICgodGltZXIubnMgPSBwZXJmTmFtZSAmJiBwZXJmT2JqZWN0KSkge1xuICAgICAgdGltZXJzLnB1c2goeyAnbnMnOiB0aW1lci5ucywgJ3Jlcyc6IGdldFJlcygndXMnKSwgJ3VuaXQnOiAndXMnIH0pO1xuICAgIH1cblxuICAgIC8vIGRldGVjdCBOb2RlJ3MgbmFub3NlY29uZCByZXNvbHV0aW9uIHRpbWVyIGF2YWlsYWJsZSBpbiBOb2RlID49IDAuOFxuICAgIGlmIChwcm9jZXNzT2JqZWN0ICYmIHR5cGVvZiAodGltZXIubnMgPSBwcm9jZXNzT2JqZWN0LmhydGltZSkgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGltZXJzLnB1c2goeyAnbnMnOiB0aW1lci5ucywgJ3Jlcyc6IGdldFJlcygnbnMnKSwgJ3VuaXQnOiAnbnMnIH0pO1xuICAgIH1cblxuICAgIC8vIGRldGVjdCBXYWRlIFNpbW1vbnMnIE5vZGUgbWljcm90aW1lIG1vZHVsZVxuICAgIGlmIChtaWNyb3RpbWVPYmplY3QgJiYgdHlwZW9mICh0aW1lci5ucyA9IG1pY3JvdGltZU9iamVjdC5ub3cpID09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRpbWVycy5wdXNoKHsgJ25zJzogdGltZXIubnMsICAncmVzJzogZ2V0UmVzKCd1cycpLCAndW5pdCc6ICd1cycgfSk7XG4gICAgfVxuXG4gICAgLy8gcGljayB0aW1lciB3aXRoIGhpZ2hlc3QgcmVzb2x1dGlvblxuICAgIHRpbWVyID0gcmVkdWNlKHRpbWVycywgZnVuY3Rpb24odGltZXIsIG90aGVyKSB7XG4gICAgICByZXR1cm4gb3RoZXIucmVzIDwgdGltZXIucmVzID8gb3RoZXIgOiB0aW1lcjtcbiAgICB9KTtcblxuICAgIC8vIHJlbW92ZSB1bnVzZWQgYXBwbGV0XG4gICAgaWYgKHRpbWVyLnVuaXQgIT0gJ25zJyAmJiBhcHBsZXQpIHtcbiAgICAgIGFwcGxldCA9IGRlc3Ryb3lFbGVtZW50KGFwcGxldCk7XG4gICAgfVxuICAgIC8vIGVycm9yIGlmIHRoZXJlIGFyZSBubyB3b3JraW5nIHRpbWVyc1xuICAgIGlmICh0aW1lci5yZXMgPT0gSW5maW5pdHkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQmVuY2htYXJrLmpzIHdhcyB1bmFibGUgdG8gZmluZCBhIHdvcmtpbmcgdGltZXIuJyk7XG4gICAgfVxuICAgIC8vIHVzZSBBUEkgb2YgY2hvc2VuIHRpbWVyXG4gICAgaWYgKHRpbWVyLnVuaXQgPT0gJ25zJykge1xuICAgICAgaWYgKHRpbWVyLm5zLm5hbm9UaW1lKSB7XG4gICAgICAgIGV4dGVuZCh0ZW1wbGF0ZSwge1xuICAgICAgICAgICdiZWdpbic6ICdzJD1uJC5uYW5vVGltZSgpJyxcbiAgICAgICAgICAnZW5kJzogJ3IkPShuJC5uYW5vVGltZSgpLXMkKS8xZTknXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZXh0ZW5kKHRlbXBsYXRlLCB7XG4gICAgICAgICAgJ2JlZ2luJzogJ3MkPW4kKCknLFxuICAgICAgICAgICdlbmQnOiAnciQ9biQocyQpO3IkPXIkWzBdKyhyJFsxXS8xZTkpJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAodGltZXIudW5pdCA9PSAndXMnKSB7XG4gICAgICBpZiAodGltZXIubnMuc3RvcCkge1xuICAgICAgICBleHRlbmQodGVtcGxhdGUsIHtcbiAgICAgICAgICAnYmVnaW4nOiAncyQ9biQuc3RhcnQoKScsXG4gICAgICAgICAgJ2VuZCc6ICdyJD1uJC5taWNyb3NlY29uZHMoKS8xZTYnXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChwZXJmTmFtZSkge1xuICAgICAgICBleHRlbmQodGVtcGxhdGUsIHtcbiAgICAgICAgICAnYmVnaW4nOiAncyQ9biQuJyArIHBlcmZOYW1lICsgJygpJyxcbiAgICAgICAgICAnZW5kJzogJ3IkPShuJC4nICsgcGVyZk5hbWUgKyAnKCktcyQpLzFlMydcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBleHRlbmQodGVtcGxhdGUsIHtcbiAgICAgICAgICAnYmVnaW4nOiAncyQ9biQoKScsXG4gICAgICAgICAgJ2VuZCc6ICdyJD0obiQoKS1zJCkvMWU2J1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBkZWZpbmUgYHRpbWVyYCBtZXRob2RzXG4gICAgdGltZXIuc3RhcnQgPSBjcmVhdGVGdW5jdGlvbihwcmVwcm9jZXNzKCdvJCcpLFxuICAgICAgcHJlcHJvY2VzcygndmFyIG4kPXRoaXMubnMsI3tiZWdpbn07byQuZWxhcHNlZD0wO28kLnRpbWVTdGFtcD1zJCcpKTtcblxuICAgIHRpbWVyLnN0b3AgPSBjcmVhdGVGdW5jdGlvbihwcmVwcm9jZXNzKCdvJCcpLFxuICAgICAgcHJlcHJvY2VzcygndmFyIG4kPXRoaXMubnMscyQ9byQudGltZVN0YW1wLCN7ZW5kfTtvJC5lbGFwc2VkPXIkJykpO1xuXG4gICAgLy8gcmVzb2x2ZSB0aW1lIHNwYW4gcmVxdWlyZWQgdG8gYWNoaWV2ZSBhIHBlcmNlbnQgdW5jZXJ0YWludHkgb2YgYXQgbW9zdCAxJVxuICAgIC8vIGh0dHA6Ly9zcGlmZi5yaXQuZWR1L2NsYXNzZXMvcGh5czI3My91bmNlcnQvdW5jZXJ0Lmh0bWxcbiAgICBvcHRpb25zLm1pblRpbWUgfHwgKG9wdGlvbnMubWluVGltZSA9IG1heCh0aW1lci5yZXMgLyAyIC8gMC4wMSwgMC4wNSkpO1xuICAgIHJldHVybiBjbG9jay5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLyoqXG4gICAqIENvbXB1dGVzIHN0YXRzIG9uIGJlbmNobWFyayByZXN1bHRzLlxuICAgKlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gYmVuY2ggVGhlIGJlbmNobWFyayBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgKi9cbiAgZnVuY3Rpb24gY29tcHV0ZShiZW5jaCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG5cbiAgICB2YXIgYXN5bmMgPSBvcHRpb25zLmFzeW5jLFxuICAgICAgICBlbGFwc2VkID0gMCxcbiAgICAgICAgaW5pdENvdW50ID0gYmVuY2guaW5pdENvdW50LFxuICAgICAgICBtaW5TYW1wbGVzID0gYmVuY2gubWluU2FtcGxlcyxcbiAgICAgICAgcXVldWUgPSBbXSxcbiAgICAgICAgc2FtcGxlID0gYmVuY2guc3RhdHMuc2FtcGxlO1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGNsb25lIHRvIHRoZSBxdWV1ZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlbnF1ZXVlKCkge1xuICAgICAgcXVldWUucHVzaChiZW5jaC5jbG9uZSh7XG4gICAgICAgICdfb3JpZ2luYWwnOiBiZW5jaCxcbiAgICAgICAgJ2V2ZW50cyc6IHtcbiAgICAgICAgICAnYWJvcnQnOiBbdXBkYXRlXSxcbiAgICAgICAgICAnY3ljbGUnOiBbdXBkYXRlXSxcbiAgICAgICAgICAnZXJyb3InOiBbdXBkYXRlXSxcbiAgICAgICAgICAnc3RhcnQnOiBbdXBkYXRlXVxuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlcyB0aGUgY2xvbmUvb3JpZ2luYWwgYmVuY2htYXJrcyB0byBrZWVwIHRoZWlyIGRhdGEgaW4gc3luYy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiB1cGRhdGUoZXZlbnQpIHtcbiAgICAgIHZhciBjbG9uZSA9IHRoaXMsXG4gICAgICAgICAgdHlwZSA9IGV2ZW50LnR5cGU7XG5cbiAgICAgIGlmIChiZW5jaC5ydW5uaW5nKSB7XG4gICAgICAgIGlmICh0eXBlID09ICdzdGFydCcpIHtcbiAgICAgICAgICAvLyBOb3RlOiBgY2xvbmUubWluVGltZWAgcHJvcCBpcyBpbml0ZWQgaW4gYGNsb2NrKClgXG4gICAgICAgICAgY2xvbmUuY291bnQgPSBiZW5jaC5pbml0Q291bnQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaWYgKHR5cGUgPT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgYmVuY2guZXJyb3IgPSBjbG9uZS5lcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHR5cGUgPT0gJ2Fib3J0Jykge1xuICAgICAgICAgICAgYmVuY2guYWJvcnQoKTtcbiAgICAgICAgICAgIGJlbmNoLmVtaXQoJ2N5Y2xlJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQgPSBldmVudC50YXJnZXQgPSBiZW5jaDtcbiAgICAgICAgICAgIGJlbmNoLmVtaXQoZXZlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChiZW5jaC5hYm9ydGVkKSB7XG4gICAgICAgIC8vIGNsZWFyIGFib3J0IGxpc3RlbmVycyB0byBhdm9pZCB0cmlnZ2VyaW5nIGJlbmNoJ3MgYWJvcnQvY3ljbGUgYWdhaW5cbiAgICAgICAgY2xvbmUuZXZlbnRzLmFib3J0Lmxlbmd0aCA9IDA7XG4gICAgICAgIGNsb25lLmFib3J0KCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyBpZiBtb3JlIGNsb25lcyBzaG91bGQgYmUgcXVldWVkIG9yIGlmIGN5Y2xpbmcgc2hvdWxkIHN0b3AuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZXZhbHVhdGUoZXZlbnQpIHtcbiAgICAgIHZhciBjcml0aWNhbCxcbiAgICAgICAgICBkZixcbiAgICAgICAgICBtZWFuLFxuICAgICAgICAgIG1vZSxcbiAgICAgICAgICBybWUsXG4gICAgICAgICAgc2QsXG4gICAgICAgICAgc2VtLFxuICAgICAgICAgIHZhcmlhbmNlLFxuICAgICAgICAgIGNsb25lID0gZXZlbnQudGFyZ2V0LFxuICAgICAgICAgIGRvbmUgPSBiZW5jaC5hYm9ydGVkLFxuICAgICAgICAgIG5vdyA9ICtuZXcgRGF0ZSxcbiAgICAgICAgICBzaXplID0gc2FtcGxlLnB1c2goY2xvbmUudGltZXMucGVyaW9kKSxcbiAgICAgICAgICBtYXhlZE91dCA9IHNpemUgPj0gbWluU2FtcGxlcyAmJiAoZWxhcHNlZCArPSBub3cgLSBjbG9uZS50aW1lcy50aW1lU3RhbXApIC8gMWUzID4gYmVuY2gubWF4VGltZSxcbiAgICAgICAgICB0aW1lcyA9IGJlbmNoLnRpbWVzLFxuICAgICAgICAgIHZhck9mID0gZnVuY3Rpb24oc3VtLCB4KSB7IHJldHVybiBzdW0gKyBwb3coeCAtIG1lYW4sIDIpOyB9O1xuXG4gICAgICAvLyBleGl0IGVhcmx5IGZvciBhYm9ydGVkIG9yIHVuY2xvY2thYmxlIHRlc3RzXG4gICAgICBpZiAoZG9uZSB8fCBjbG9uZS5oeiA9PSBJbmZpbml0eSkge1xuICAgICAgICBtYXhlZE91dCA9ICEoc2l6ZSA9IHNhbXBsZS5sZW5ndGggPSBxdWV1ZS5sZW5ndGggPSAwKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFkb25lKSB7XG4gICAgICAgIC8vIHNhbXBsZSBtZWFuIChlc3RpbWF0ZSBvZiB0aGUgcG9wdWxhdGlvbiBtZWFuKVxuICAgICAgICBtZWFuID0gZ2V0TWVhbihzYW1wbGUpO1xuICAgICAgICAvLyBzYW1wbGUgdmFyaWFuY2UgKGVzdGltYXRlIG9mIHRoZSBwb3B1bGF0aW9uIHZhcmlhbmNlKVxuICAgICAgICB2YXJpYW5jZSA9IHJlZHVjZShzYW1wbGUsIHZhck9mLCAwKSAvIChzaXplIC0gMSkgfHwgMDtcbiAgICAgICAgLy8gc2FtcGxlIHN0YW5kYXJkIGRldmlhdGlvbiAoZXN0aW1hdGUgb2YgdGhlIHBvcHVsYXRpb24gc3RhbmRhcmQgZGV2aWF0aW9uKVxuICAgICAgICBzZCA9IHNxcnQodmFyaWFuY2UpO1xuICAgICAgICAvLyBzdGFuZGFyZCBlcnJvciBvZiB0aGUgbWVhbiAoYS5rLmEuIHRoZSBzdGFuZGFyZCBkZXZpYXRpb24gb2YgdGhlIHNhbXBsaW5nIGRpc3RyaWJ1dGlvbiBvZiB0aGUgc2FtcGxlIG1lYW4pXG4gICAgICAgIHNlbSA9IHNkIC8gc3FydChzaXplKTtcbiAgICAgICAgLy8gZGVncmVlcyBvZiBmcmVlZG9tXG4gICAgICAgIGRmID0gc2l6ZSAtIDE7XG4gICAgICAgIC8vIGNyaXRpY2FsIHZhbHVlXG4gICAgICAgIGNyaXRpY2FsID0gdFRhYmxlW01hdGgucm91bmQoZGYpIHx8IDFdIHx8IHRUYWJsZS5pbmZpbml0eTtcbiAgICAgICAgLy8gbWFyZ2luIG9mIGVycm9yXG4gICAgICAgIG1vZSA9IHNlbSAqIGNyaXRpY2FsO1xuICAgICAgICAvLyByZWxhdGl2ZSBtYXJnaW4gb2YgZXJyb3JcbiAgICAgICAgcm1lID0gKG1vZSAvIG1lYW4pICogMTAwIHx8IDA7XG5cbiAgICAgICAgZXh0ZW5kKGJlbmNoLnN0YXRzLCB7XG4gICAgICAgICAgJ2RldmlhdGlvbic6IHNkLFxuICAgICAgICAgICdtZWFuJzogbWVhbixcbiAgICAgICAgICAnbW9lJzogbW9lLFxuICAgICAgICAgICdybWUnOiBybWUsXG4gICAgICAgICAgJ3NlbSc6IHNlbSxcbiAgICAgICAgICAndmFyaWFuY2UnOiB2YXJpYW5jZVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBYm9ydCB0aGUgY3ljbGUgbG9vcCB3aGVuIHRoZSBtaW5pbXVtIHNhbXBsZSBzaXplIGhhcyBiZWVuIGNvbGxlY3RlZFxuICAgICAgICAvLyBhbmQgdGhlIGVsYXBzZWQgdGltZSBleGNlZWRzIHRoZSBtYXhpbXVtIHRpbWUgYWxsb3dlZCBwZXIgYmVuY2htYXJrLlxuICAgICAgICAvLyBXZSBkb24ndCBjb3VudCBjeWNsZSBkZWxheXMgdG93YXJkIHRoZSBtYXggdGltZSBiZWNhdXNlIGRlbGF5cyBtYXkgYmVcbiAgICAgICAgLy8gaW5jcmVhc2VkIGJ5IGJyb3dzZXJzIHRoYXQgY2xhbXAgdGltZW91dHMgZm9yIGluYWN0aXZlIHRhYnMuXG4gICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL3dpbmRvdy5zZXRUaW1lb3V0I0luYWN0aXZlX3RhYnNcbiAgICAgICAgaWYgKG1heGVkT3V0KSB7XG4gICAgICAgICAgLy8gcmVzZXQgdGhlIGBpbml0Q291bnRgIGluIGNhc2UgdGhlIGJlbmNobWFyayBpcyByZXJ1blxuICAgICAgICAgIGJlbmNoLmluaXRDb3VudCA9IGluaXRDb3VudDtcbiAgICAgICAgICBiZW5jaC5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgdGltZXMuZWxhcHNlZCA9IChub3cgLSB0aW1lcy50aW1lU3RhbXApIC8gMWUzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChiZW5jaC5oeiAhPSBJbmZpbml0eSkge1xuICAgICAgICAgIGJlbmNoLmh6ID0gMSAvIG1lYW47XG4gICAgICAgICAgdGltZXMuY3ljbGUgPSBtZWFuICogYmVuY2guY291bnQ7XG4gICAgICAgICAgdGltZXMucGVyaW9kID0gbWVhbjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gaWYgdGltZSBwZXJtaXRzLCBpbmNyZWFzZSBzYW1wbGUgc2l6ZSB0byByZWR1Y2UgdGhlIG1hcmdpbiBvZiBlcnJvclxuICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA8IDIgJiYgIW1heGVkT3V0KSB7XG4gICAgICAgIGVucXVldWUoKTtcbiAgICAgIH1cbiAgICAgIC8vIGFib3J0IHRoZSBpbnZva2UgY3ljbGUgd2hlbiBkb25lXG4gICAgICBldmVudC5hYm9ydGVkID0gZG9uZTtcbiAgICB9XG5cbiAgICAvLyBpbml0IHF1ZXVlIGFuZCBiZWdpblxuICAgIGVucXVldWUoKTtcbiAgICBpbnZva2UocXVldWUsIHtcbiAgICAgICduYW1lJzogJ3J1bicsXG4gICAgICAnYXJncyc6IHsgJ2FzeW5jJzogYXN5bmMgfSxcbiAgICAgICdxdWV1ZWQnOiB0cnVlLFxuICAgICAgJ29uQ3ljbGUnOiBldmFsdWF0ZSxcbiAgICAgICdvbkNvbXBsZXRlJzogZnVuY3Rpb24oKSB7IGJlbmNoLmVtaXQoJ2NvbXBsZXRlJyk7IH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBDeWNsZXMgYSBiZW5jaG1hcmsgdW50aWwgYSBydW4gYGNvdW50YCBjYW4gYmUgZXN0YWJsaXNoZWQuXG4gICAqXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjbG9uZSBUaGUgY2xvbmVkIGJlbmNobWFyayBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgVGhlIG9wdGlvbnMgb2JqZWN0LlxuICAgKi9cbiAgZnVuY3Rpb24gY3ljbGUoY2xvbmUsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgdmFyIGRlZmVycmVkO1xuICAgIGlmIChjbG9uZSBpbnN0YW5jZW9mIERlZmVycmVkKSB7XG4gICAgICBkZWZlcnJlZCA9IGNsb25lO1xuICAgICAgY2xvbmUgPSBjbG9uZS5iZW5jaG1hcms7XG4gICAgfVxuXG4gICAgdmFyIGNsb2NrZWQsXG4gICAgICAgIGN5Y2xlcyxcbiAgICAgICAgZGl2aXNvcixcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIG1pblRpbWUsXG4gICAgICAgIHBlcmlvZCxcbiAgICAgICAgYXN5bmMgPSBvcHRpb25zLmFzeW5jLFxuICAgICAgICBiZW5jaCA9IGNsb25lLl9vcmlnaW5hbCxcbiAgICAgICAgY291bnQgPSBjbG9uZS5jb3VudCxcbiAgICAgICAgdGltZXMgPSBjbG9uZS50aW1lcztcblxuICAgIC8vIGNvbnRpbnVlLCBpZiBub3QgYWJvcnRlZCBiZXR3ZWVuIGN5Y2xlc1xuICAgIGlmIChjbG9uZS5ydW5uaW5nKSB7XG4gICAgICAvLyBgbWluVGltZWAgaXMgc2V0IHRvIGBCZW5jaG1hcmsub3B0aW9ucy5taW5UaW1lYCBpbiBgY2xvY2soKWBcbiAgICAgIGN5Y2xlcyA9ICsrY2xvbmUuY3ljbGVzO1xuICAgICAgY2xvY2tlZCA9IGRlZmVycmVkID8gZGVmZXJyZWQuZWxhcHNlZCA6IGNsb2NrKGNsb25lKTtcbiAgICAgIG1pblRpbWUgPSBjbG9uZS5taW5UaW1lO1xuXG4gICAgICBpZiAoY3ljbGVzID4gYmVuY2guY3ljbGVzKSB7XG4gICAgICAgIGJlbmNoLmN5Y2xlcyA9IGN5Y2xlcztcbiAgICAgIH1cbiAgICAgIGlmIChjbG9uZS5lcnJvcikge1xuICAgICAgICBldmVudCA9IEV2ZW50KCdlcnJvcicpO1xuICAgICAgICBldmVudC5tZXNzYWdlID0gY2xvbmUuZXJyb3I7XG4gICAgICAgIGNsb25lLmVtaXQoZXZlbnQpO1xuICAgICAgICBpZiAoIWV2ZW50LmNhbmNlbGxlZCkge1xuICAgICAgICAgIGNsb25lLmFib3J0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBjb250aW51ZSwgaWYgbm90IGVycm9yZWRcbiAgICBpZiAoY2xvbmUucnVubmluZykge1xuICAgICAgLy8gdGltZSB0YWtlbiB0byBjb21wbGV0ZSBsYXN0IHRlc3QgY3ljbGVcbiAgICAgIGJlbmNoLnRpbWVzLmN5Y2xlID0gdGltZXMuY3ljbGUgPSBjbG9ja2VkO1xuICAgICAgLy8gc2Vjb25kcyBwZXIgb3BlcmF0aW9uXG4gICAgICBwZXJpb2QgPSBiZW5jaC50aW1lcy5wZXJpb2QgPSB0aW1lcy5wZXJpb2QgPSBjbG9ja2VkIC8gY291bnQ7XG4gICAgICAvLyBvcHMgcGVyIHNlY29uZFxuICAgICAgYmVuY2guaHogPSBjbG9uZS5oeiA9IDEgLyBwZXJpb2Q7XG4gICAgICAvLyBhdm9pZCB3b3JraW5nIG91ciB3YXkgdXAgdG8gdGhpcyBuZXh0IHRpbWVcbiAgICAgIGJlbmNoLmluaXRDb3VudCA9IGNsb25lLmluaXRDb3VudCA9IGNvdW50O1xuICAgICAgLy8gZG8gd2UgbmVlZCB0byBkbyBhbm90aGVyIGN5Y2xlP1xuICAgICAgY2xvbmUucnVubmluZyA9IGNsb2NrZWQgPCBtaW5UaW1lO1xuXG4gICAgICBpZiAoY2xvbmUucnVubmluZykge1xuICAgICAgICAvLyB0ZXN0cyBtYXkgY2xvY2sgYXQgYDBgIHdoZW4gYGluaXRDb3VudGAgaXMgYSBzbWFsbCBudW1iZXIsXG4gICAgICAgIC8vIHRvIGF2b2lkIHRoYXQgd2Ugc2V0IGl0cyBjb3VudCB0byBzb21ldGhpbmcgYSBiaXQgaGlnaGVyXG4gICAgICAgIGlmICghY2xvY2tlZCAmJiAoZGl2aXNvciA9IGRpdmlzb3JzW2Nsb25lLmN5Y2xlc10pICE9IG51bGwpIHtcbiAgICAgICAgICBjb3VudCA9IGZsb29yKDRlNiAvIGRpdmlzb3IpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNhbGN1bGF0ZSBob3cgbWFueSBtb3JlIGl0ZXJhdGlvbnMgaXQgd2lsbCB0YWtlIHRvIGFjaGl2ZSB0aGUgYG1pblRpbWVgXG4gICAgICAgIGlmIChjb3VudCA8PSBjbG9uZS5jb3VudCkge1xuICAgICAgICAgIGNvdW50ICs9IE1hdGguY2VpbCgobWluVGltZSAtIGNsb2NrZWQpIC8gcGVyaW9kKTtcbiAgICAgICAgfVxuICAgICAgICBjbG9uZS5ydW5uaW5nID0gY291bnQgIT0gSW5maW5pdHk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIHNob3VsZCB3ZSBleGl0IGVhcmx5P1xuICAgIGV2ZW50ID0gRXZlbnQoJ2N5Y2xlJyk7XG4gICAgY2xvbmUuZW1pdChldmVudCk7XG4gICAgaWYgKGV2ZW50LmFib3J0ZWQpIHtcbiAgICAgIGNsb25lLmFib3J0KCk7XG4gICAgfVxuICAgIC8vIGZpZ3VyZSBvdXQgd2hhdCB0byBkbyBuZXh0XG4gICAgaWYgKGNsb25lLnJ1bm5pbmcpIHtcbiAgICAgIC8vIHN0YXJ0IGEgbmV3IGN5Y2xlXG4gICAgICBjbG9uZS5jb3VudCA9IGNvdW50O1xuICAgICAgaWYgKGRlZmVycmVkKSB7XG4gICAgICAgIGNsb25lLmNvbXBpbGVkLmNhbGwoZGVmZXJyZWQsIHRpbWVyKTtcbiAgICAgIH0gZWxzZSBpZiAoYXN5bmMpIHtcbiAgICAgICAgZGVsYXkoY2xvbmUsIGZ1bmN0aW9uKCkgeyBjeWNsZShjbG9uZSwgb3B0aW9ucyk7IH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3ljbGUoY2xvbmUpO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIGZpeCBUcmFjZU1vbmtleSBidWcgYXNzb2NpYXRlZCB3aXRoIGNsb2NrIGZhbGxiYWNrc1xuICAgICAgLy8gaHR0cDovL2J1Z3ppbC5sYS81MDkwNjlcbiAgICAgIGlmIChzdXBwb3J0LmJyb3dzZXIpIHtcbiAgICAgICAgcnVuU2NyaXB0KHVpZCArICc9MTtkZWxldGUgJyArIHVpZCk7XG4gICAgICB9XG4gICAgICAvLyBkb25lXG4gICAgICBjbG9uZS5lbWl0KCdjb21wbGV0ZScpO1xuICAgIH1cbiAgfVxuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8qKlxuICAgKiBSdW5zIHRoZSBiZW5jaG1hcmsuXG4gICAqXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBPcHRpb25zIG9iamVjdC5cbiAgICogQHJldHVybnMge09iamVjdH0gVGhlIGJlbmNobWFyayBpbnN0YW5jZS5cbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogLy8gYmFzaWMgdXNhZ2VcbiAgICogYmVuY2gucnVuKCk7XG4gICAqXG4gICAqIC8vIG9yIHdpdGggb3B0aW9uc1xuICAgKiBiZW5jaC5ydW4oeyAnYXN5bmMnOiB0cnVlIH0pO1xuICAgKi9cbiAgZnVuY3Rpb24gcnVuKG9wdGlvbnMpIHtcbiAgICB2YXIgbWUgPSB0aGlzLFxuICAgICAgICBldmVudCA9IEV2ZW50KCdzdGFydCcpO1xuXG4gICAgLy8gc2V0IGBydW5uaW5nYCB0byBgZmFsc2VgIHNvIGByZXNldCgpYCB3b24ndCBjYWxsIGBhYm9ydCgpYFxuICAgIG1lLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICBtZS5yZXNldCgpO1xuICAgIG1lLnJ1bm5pbmcgPSB0cnVlO1xuXG4gICAgbWUuY291bnQgPSBtZS5pbml0Q291bnQ7XG4gICAgbWUudGltZXMudGltZVN0YW1wID0gK25ldyBEYXRlO1xuICAgIG1lLmVtaXQoZXZlbnQpO1xuXG4gICAgaWYgKCFldmVudC5jYW5jZWxsZWQpIHtcbiAgICAgIG9wdGlvbnMgPSB7ICdhc3luYyc6ICgob3B0aW9ucyA9IG9wdGlvbnMgJiYgb3B0aW9ucy5hc3luYykgPT0gbnVsbCA/IG1lLmFzeW5jIDogb3B0aW9ucykgJiYgc3VwcG9ydC50aW1lb3V0IH07XG5cbiAgICAgIC8vIGZvciBjbG9uZXMgY3JlYXRlZCB3aXRoaW4gYGNvbXB1dGUoKWBcbiAgICAgIGlmIChtZS5fb3JpZ2luYWwpIHtcbiAgICAgICAgaWYgKG1lLmRlZmVyKSB7XG4gICAgICAgICAgRGVmZXJyZWQobWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN5Y2xlKG1lLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gZm9yIG9yaWdpbmFsIGJlbmNobWFya3NcbiAgICAgIGVsc2Uge1xuICAgICAgICBjb21wdXRlKG1lLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lO1xuICB9XG5cbiAgLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cbiAgLy8gRmlyZWZveCAxIGVycm9uZW91c2x5IGRlZmluZXMgdmFyaWFibGUgYW5kIGFyZ3VtZW50IG5hbWVzIG9mIGZ1bmN0aW9ucyBvblxuICAvLyB0aGUgZnVuY3Rpb24gaXRzZWxmIGFzIG5vbi1jb25maWd1cmFibGUgcHJvcGVydGllcyB3aXRoIGB1bmRlZmluZWRgIHZhbHVlcy5cbiAgLy8gVGhlIGJ1Z2dpbmVzcyBjb250aW51ZXMgYXMgdGhlIGBCZW5jaG1hcmtgIGNvbnN0cnVjdG9yIGhhcyBhbiBhcmd1bWVudFxuICAvLyBuYW1lZCBgb3B0aW9uc2AgYW5kIEZpcmVmb3ggMSB3aWxsIG5vdCBhc3NpZ24gYSB2YWx1ZSB0byBgQmVuY2htYXJrLm9wdGlvbnNgLFxuICAvLyBtYWtpbmcgaXQgbm9uLXdyaXRhYmxlIGluIHRoZSBwcm9jZXNzLCB1bmxlc3MgaXQgaXMgdGhlIGZpcnN0IHByb3BlcnR5XG4gIC8vIGFzc2lnbmVkIGJ5IGZvci1pbiBsb29wIG9mIGBleHRlbmQoKWAuXG4gIGV4dGVuZChCZW5jaG1hcmssIHtcblxuICAgIC8qKlxuICAgICAqIFRoZSBkZWZhdWx0IG9wdGlvbnMgY29waWVkIGJ5IGJlbmNobWFyayBpbnN0YW5jZXMuXG4gICAgICpcbiAgICAgKiBAc3RhdGljXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAqL1xuICAgICdvcHRpb25zJzoge1xuXG4gICAgICAvKipcbiAgICAgICAqIEEgZmxhZyB0byBpbmRpY2F0ZSB0aGF0IGJlbmNobWFyayBjeWNsZXMgd2lsbCBleGVjdXRlIGFzeW5jaHJvbm91c2x5XG4gICAgICAgKiBieSBkZWZhdWx0LlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsub3B0aW9uc1xuICAgICAgICogQHR5cGUgQm9vbGVhblxuICAgICAgICovXG4gICAgICAnYXN5bmMnOiBmYWxzZSxcblxuICAgICAgLyoqXG4gICAgICAgKiBBIGZsYWcgdG8gaW5kaWNhdGUgdGhhdCB0aGUgYmVuY2htYXJrIGNsb2NrIGlzIGRlZmVycmVkLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsub3B0aW9uc1xuICAgICAgICogQHR5cGUgQm9vbGVhblxuICAgICAgICovXG4gICAgICAnZGVmZXInOiBmYWxzZSxcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgZGVsYXkgYmV0d2VlbiB0ZXN0IGN5Y2xlcyAoc2VjcykuXG4gICAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLm9wdGlvbnNcbiAgICAgICAqIEB0eXBlIE51bWJlclxuICAgICAgICovXG4gICAgICAnZGVsYXknOiAwLjAwNSxcblxuICAgICAgLyoqXG4gICAgICAgKiBEaXNwbGF5ZWQgYnkgQmVuY2htYXJrI3RvU3RyaW5nIHdoZW4gYSBgbmFtZWAgaXMgbm90IGF2YWlsYWJsZVxuICAgICAgICogKGF1dG8tZ2VuZXJhdGVkIGlmIGFic2VudCkuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5vcHRpb25zXG4gICAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgICAqL1xuICAgICAgJ2lkJzogdW5kZWZpbmVkLFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSBkZWZhdWx0IG51bWJlciBvZiB0aW1lcyB0byBleGVjdXRlIGEgdGVzdCBvbiBhIGJlbmNobWFyaydzIGZpcnN0IGN5Y2xlLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsub3B0aW9uc1xuICAgICAgICogQHR5cGUgTnVtYmVyXG4gICAgICAgKi9cbiAgICAgICdpbml0Q291bnQnOiAxLFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSBtYXhpbXVtIHRpbWUgYSBiZW5jaG1hcmsgaXMgYWxsb3dlZCB0byBydW4gYmVmb3JlIGZpbmlzaGluZyAoc2VjcykuXG4gICAgICAgKiBOb3RlOiBDeWNsZSBkZWxheXMgYXJlbid0IGNvdW50ZWQgdG93YXJkIHRoZSBtYXhpbXVtIHRpbWUuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5vcHRpb25zXG4gICAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgICAqL1xuICAgICAgJ21heFRpbWUnOiA1LFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSBtaW5pbXVtIHNhbXBsZSBzaXplIHJlcXVpcmVkIHRvIHBlcmZvcm0gc3RhdGlzdGljYWwgYW5hbHlzaXMuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5vcHRpb25zXG4gICAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgICAqL1xuICAgICAgJ21pblNhbXBsZXMnOiA1LFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSB0aW1lIG5lZWRlZCB0byByZWR1Y2UgdGhlIHBlcmNlbnQgdW5jZXJ0YWludHkgb2YgbWVhc3VyZW1lbnQgdG8gMSUgKHNlY3MpLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsub3B0aW9uc1xuICAgICAgICogQHR5cGUgTnVtYmVyXG4gICAgICAgKi9cbiAgICAgICdtaW5UaW1lJzogMCxcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgbmFtZSBvZiB0aGUgYmVuY2htYXJrLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsub3B0aW9uc1xuICAgICAgICogQHR5cGUgU3RyaW5nXG4gICAgICAgKi9cbiAgICAgICduYW1lJzogdW5kZWZpbmVkLFxuXG4gICAgICAvKipcbiAgICAgICAqIEFuIGV2ZW50IGxpc3RlbmVyIGNhbGxlZCB3aGVuIHRoZSBiZW5jaG1hcmsgaXMgYWJvcnRlZC5cbiAgICAgICAqXG4gICAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLm9wdGlvbnNcbiAgICAgICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAgICAgKi9cbiAgICAgICdvbkFib3J0JzogdW5kZWZpbmVkLFxuXG4gICAgICAvKipcbiAgICAgICAqIEFuIGV2ZW50IGxpc3RlbmVyIGNhbGxlZCB3aGVuIHRoZSBiZW5jaG1hcmsgY29tcGxldGVzIHJ1bm5pbmcuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5vcHRpb25zXG4gICAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAgICovXG4gICAgICAnb25Db21wbGV0ZSc6IHVuZGVmaW5lZCxcblxuICAgICAgLyoqXG4gICAgICAgKiBBbiBldmVudCBsaXN0ZW5lciBjYWxsZWQgYWZ0ZXIgZWFjaCBydW4gY3ljbGUuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5vcHRpb25zXG4gICAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAgICovXG4gICAgICAnb25DeWNsZSc6IHVuZGVmaW5lZCxcblxuICAgICAgLyoqXG4gICAgICAgKiBBbiBldmVudCBsaXN0ZW5lciBjYWxsZWQgd2hlbiBhIHRlc3QgZXJyb3JzLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsub3B0aW9uc1xuICAgICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgICAqL1xuICAgICAgJ29uRXJyb3InOiB1bmRlZmluZWQsXG5cbiAgICAgIC8qKlxuICAgICAgICogQW4gZXZlbnQgbGlzdGVuZXIgY2FsbGVkIHdoZW4gdGhlIGJlbmNobWFyayBpcyByZXNldC5cbiAgICAgICAqXG4gICAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLm9wdGlvbnNcbiAgICAgICAqIEB0eXBlIEZ1bmN0aW9uXG4gICAgICAgKi9cbiAgICAgICdvblJlc2V0JzogdW5kZWZpbmVkLFxuXG4gICAgICAvKipcbiAgICAgICAqIEFuIGV2ZW50IGxpc3RlbmVyIGNhbGxlZCB3aGVuIHRoZSBiZW5jaG1hcmsgc3RhcnRzIHJ1bm5pbmcuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5vcHRpb25zXG4gICAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAgICovXG4gICAgICAnb25TdGFydCc6IHVuZGVmaW5lZFxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBQbGF0Zm9ybSBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIGRlc2NyaWJpbmcgdGhpbmdzIGxpa2UgYnJvd3NlciBuYW1lLFxuICAgICAqIHZlcnNpb24sIGFuZCBvcGVyYXRpbmcgc3lzdGVtLlxuICAgICAqXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgKi9cbiAgICAncGxhdGZvcm0nOiByZXEoJ3BsYXRmb3JtJykgfHwgd2luZG93LnBsYXRmb3JtIHx8IHtcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgcGxhdGZvcm0gZGVzY3JpcHRpb24uXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5wbGF0Zm9ybVxuICAgICAgICogQHR5cGUgU3RyaW5nXG4gICAgICAgKi9cbiAgICAgICdkZXNjcmlwdGlvbic6IHdpbmRvdy5uYXZpZ2F0b3IgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBudWxsLFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSBuYW1lIG9mIHRoZSBicm93c2VyIGxheW91dCBlbmdpbmUuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5wbGF0Zm9ybVxuICAgICAgICogQHR5cGUgU3RyaW5nfE51bGxcbiAgICAgICAqL1xuICAgICAgJ2xheW91dCc6IG51bGwsXG5cbiAgICAgIC8qKlxuICAgICAgICogVGhlIG5hbWUgb2YgdGhlIHByb2R1Y3QgaG9zdGluZyB0aGUgYnJvd3Nlci5cbiAgICAgICAqXG4gICAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLnBsYXRmb3JtXG4gICAgICAgKiBAdHlwZSBTdHJpbmd8TnVsbFxuICAgICAgICovXG4gICAgICAncHJvZHVjdCc6IG51bGwsXG5cbiAgICAgIC8qKlxuICAgICAgICogVGhlIG5hbWUgb2YgdGhlIGJyb3dzZXIvZW52aXJvbm1lbnQuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5wbGF0Zm9ybVxuICAgICAgICogQHR5cGUgU3RyaW5nfE51bGxcbiAgICAgICAqL1xuICAgICAgJ25hbWUnOiBudWxsLFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSBuYW1lIG9mIHRoZSBwcm9kdWN0J3MgbWFudWZhY3R1cmVyLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsucGxhdGZvcm1cbiAgICAgICAqIEB0eXBlIFN0cmluZ3xOdWxsXG4gICAgICAgKi9cbiAgICAgICdtYW51ZmFjdHVyZXInOiBudWxsLFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSBuYW1lIG9mIHRoZSBvcGVyYXRpbmcgc3lzdGVtLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsucGxhdGZvcm1cbiAgICAgICAqIEB0eXBlIFN0cmluZ3xOdWxsXG4gICAgICAgKi9cbiAgICAgICdvcyc6IG51bGwsXG5cbiAgICAgIC8qKlxuICAgICAgICogVGhlIGFscGhhL2JldGEgcmVsZWFzZSBpbmRpY2F0b3IuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5wbGF0Zm9ybVxuICAgICAgICogQHR5cGUgU3RyaW5nfE51bGxcbiAgICAgICAqL1xuICAgICAgJ3ByZXJlbGVhc2UnOiBudWxsLFxuXG4gICAgICAvKipcbiAgICAgICAqIFRoZSBicm93c2VyL2Vudmlyb25tZW50IHZlcnNpb24uXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyay5wbGF0Zm9ybVxuICAgICAgICogQHR5cGUgU3RyaW5nfE51bGxcbiAgICAgICAqL1xuICAgICAgJ3ZlcnNpb24nOiBudWxsLFxuXG4gICAgICAvKipcbiAgICAgICAqIFJldHVybiBwbGF0Zm9ybSBkZXNjcmlwdGlvbiB3aGVuIHRoZSBwbGF0Zm9ybSBvYmplY3QgaXMgY29lcmNlZCB0byBhIHN0cmluZy5cbiAgICAgICAqXG4gICAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLnBsYXRmb3JtXG4gICAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAgICogQHJldHVybnMge1N0cmluZ30gVGhlIHBsYXRmb3JtIGRlc2NyaXB0aW9uLlxuICAgICAgICovXG4gICAgICAndG9TdHJpbmcnOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVzY3JpcHRpb24gfHwgJyc7XG4gICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBzZW1hbnRpYyB2ZXJzaW9uIG51bWJlci5cbiAgICAgKlxuICAgICAqIEBzdGF0aWNcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAgICogQHR5cGUgU3RyaW5nXG4gICAgICovXG4gICAgJ3ZlcnNpb24nOiAnMS4wLjAnLFxuXG4gICAgLy8gYW4gb2JqZWN0IG9mIGVudmlyb25tZW50L2ZlYXR1cmUgZGV0ZWN0aW9uIGZsYWdzXG4gICAgJ3N1cHBvcnQnOiBzdXBwb3J0LFxuXG4gICAgLy8gY2xvbmUgb2JqZWN0c1xuICAgICdkZWVwQ2xvbmUnOiBkZWVwQ2xvbmUsXG5cbiAgICAvLyBpdGVyYXRpb24gdXRpbGl0eVxuICAgICdlYWNoJzogZWFjaCxcblxuICAgIC8vIGF1Z21lbnQgb2JqZWN0c1xuICAgICdleHRlbmQnOiBleHRlbmQsXG5cbiAgICAvLyBnZW5lcmljIEFycmF5I2ZpbHRlclxuICAgICdmaWx0ZXInOiBmaWx0ZXIsXG5cbiAgICAvLyBnZW5lcmljIEFycmF5I2ZvckVhY2hcbiAgICAnZm9yRWFjaCc6IGZvckVhY2gsXG5cbiAgICAvLyBnZW5lcmljIG93biBwcm9wZXJ0eSBpdGVyYXRpb24gdXRpbGl0eVxuICAgICdmb3JPd24nOiBmb3JPd24sXG5cbiAgICAvLyBjb252ZXJ0cyBhIG51bWJlciB0byBhIGNvbW1hLXNlcGFyYXRlZCBzdHJpbmdcbiAgICAnZm9ybWF0TnVtYmVyJzogZm9ybWF0TnVtYmVyLFxuXG4gICAgLy8gZ2VuZXJpYyBPYmplY3QjaGFzT3duUHJvcGVydHlcbiAgICAvLyAodHJpZ2dlciBoYXNLZXkncyBsYXp5IGRlZmluZSBiZWZvcmUgYXNzaWduaW5nIGl0IHRvIEJlbmNobWFyaylcbiAgICAnaGFzS2V5JzogKGhhc0tleShCZW5jaG1hcmssICcnKSwgaGFzS2V5KSxcblxuICAgIC8vIGdlbmVyaWMgQXJyYXkjaW5kZXhPZlxuICAgICdpbmRleE9mJzogaW5kZXhPZixcblxuICAgIC8vIHRlbXBsYXRlIHV0aWxpdHlcbiAgICAnaW50ZXJwb2xhdGUnOiBpbnRlcnBvbGF0ZSxcblxuICAgIC8vIGludm9rZXMgYSBtZXRob2Qgb24gZWFjaCBpdGVtIGluIGFuIGFycmF5XG4gICAgJ2ludm9rZSc6IGludm9rZSxcblxuICAgIC8vIGdlbmVyaWMgQXJyYXkjam9pbiBmb3IgYXJyYXlzIGFuZCBvYmplY3RzXG4gICAgJ2pvaW4nOiBqb2luLFxuXG4gICAgLy8gZ2VuZXJpYyBBcnJheSNtYXBcbiAgICAnbWFwJzogbWFwLFxuXG4gICAgLy8gcmV0cmlldmVzIGEgcHJvcGVydHkgdmFsdWUgZnJvbSBlYWNoIGl0ZW0gaW4gYW4gYXJyYXlcbiAgICAncGx1Y2snOiBwbHVjayxcblxuICAgIC8vIGdlbmVyaWMgQXJyYXkjcmVkdWNlXG4gICAgJ3JlZHVjZSc6IHJlZHVjZVxuICB9KTtcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICBleHRlbmQoQmVuY2htYXJrLnByb3RvdHlwZSwge1xuXG4gICAgLyoqXG4gICAgICogVGhlIG51bWJlciBvZiB0aW1lcyBhIHRlc3Qgd2FzIGV4ZWN1dGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgICdjb3VudCc6IDAsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIGN5Y2xlcyBwZXJmb3JtZWQgd2hpbGUgYmVuY2htYXJraW5nLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgICdjeWNsZXMnOiAwLFxuXG4gICAgLyoqXG4gICAgICogVGhlIG51bWJlciBvZiBleGVjdXRpb25zIHBlciBzZWNvbmQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgJ2h6JzogMCxcblxuICAgIC8qKlxuICAgICAqIFRoZSBjb21waWxlZCB0ZXN0IGZ1bmN0aW9uLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgICAqIEB0eXBlIEZ1bmN0aW9ufFN0cmluZ1xuICAgICAqL1xuICAgICdjb21waWxlZCc6IHVuZGVmaW5lZCxcblxuICAgIC8qKlxuICAgICAqIFRoZSBlcnJvciBvYmplY3QgaWYgdGhlIHRlc3QgZmFpbGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAqL1xuICAgICdlcnJvcic6IHVuZGVmaW5lZCxcblxuICAgIC8qKlxuICAgICAqIFRoZSB0ZXN0IHRvIGJlbmNobWFyay5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICAgKiBAdHlwZSBGdW5jdGlvbnxTdHJpbmdcbiAgICAgKi9cbiAgICAnZm4nOiB1bmRlZmluZWQsXG5cbiAgICAvKipcbiAgICAgKiBBIGZsYWcgdG8gaW5kaWNhdGUgaWYgdGhlIGJlbmNobWFyayBpcyBhYm9ydGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICAnYWJvcnRlZCc6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogQSBmbGFnIHRvIGluZGljYXRlIGlmIHRoZSBiZW5jaG1hcmsgaXMgcnVubmluZy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgJ3J1bm5pbmcnOiBmYWxzZSxcblxuICAgIC8qKlxuICAgICAqIENvbXBpbGVkIGludG8gdGhlIHRlc3QgYW5kIGV4ZWN1dGVkIGltbWVkaWF0ZWx5ICoqYmVmb3JlKiogdGhlIHRlc3QgbG9vcC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmtcbiAgICAgKiBAdHlwZSBGdW5jdGlvbnxTdHJpbmdcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqXG4gICAgICogLy8gYmFzaWMgdXNhZ2VcbiAgICAgKiB2YXIgYmVuY2ggPSBCZW5jaG1hcmsoe1xuICAgICAqICAgJ3NldHVwJzogZnVuY3Rpb24oKSB7XG4gICAgICogICAgIHZhciBjID0gdGhpcy5jb3VudCxcbiAgICAgKiAgICAgICAgIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGFpbmVyJyk7XG4gICAgICogICAgIHdoaWxlIChjLS0pIHtcbiAgICAgKiAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKTtcbiAgICAgKiAgICAgfVxuICAgICAqICAgfSxcbiAgICAgKiAgICdmbic6IGZ1bmN0aW9uKCkge1xuICAgICAqICAgICBlbGVtZW50LnJlbW92ZUNoaWxkKGVsZW1lbnQubGFzdENoaWxkKTtcbiAgICAgKiAgIH1cbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIC8vIGNvbXBpbGVzIHRvIHNvbWV0aGluZyBsaWtlOlxuICAgICAqIHZhciBjID0gdGhpcy5jb3VudCxcbiAgICAgKiAgICAgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250YWluZXInKTtcbiAgICAgKiB3aGlsZSAoYy0tKSB7XG4gICAgICogICBlbGVtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKTtcbiAgICAgKiB9XG4gICAgICogdmFyIHN0YXJ0ID0gbmV3IERhdGU7XG4gICAgICogd2hpbGUgKGNvdW50LS0pIHtcbiAgICAgKiAgIGVsZW1lbnQucmVtb3ZlQ2hpbGQoZWxlbWVudC5sYXN0Q2hpbGQpO1xuICAgICAqIH1cbiAgICAgKiB2YXIgZW5kID0gbmV3IERhdGUgLSBzdGFydDtcbiAgICAgKlxuICAgICAqIC8vIG9yIHVzaW5nIHN0cmluZ3NcbiAgICAgKiB2YXIgYmVuY2ggPSBCZW5jaG1hcmsoe1xuICAgICAqICAgJ3NldHVwJzogJ1xcXG4gICAgICogICAgIHZhciBhID0gMDtcXG5cXFxuICAgICAqICAgICAoZnVuY3Rpb24oKSB7XFxuXFxcbiAgICAgKiAgICAgICAoZnVuY3Rpb24oKSB7XFxuXFxcbiAgICAgKiAgICAgICAgIChmdW5jdGlvbigpIHsnLFxuICAgICAqICAgJ2ZuJzogJ2EgKz0gMTsnLFxuICAgICAqICAgJ3RlYXJkb3duJzogJ1xcXG4gICAgICogICAgICAgICAgfSgpKVxcblxcXG4gICAgICogICAgICAgIH0oKSlcXG5cXFxuICAgICAqICAgICAgfSgpKSdcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIC8vIGNvbXBpbGVzIHRvIHNvbWV0aGluZyBsaWtlOlxuICAgICAqIHZhciBhID0gMDtcbiAgICAgKiAoZnVuY3Rpb24oKSB7XG4gICAgICogICAoZnVuY3Rpb24oKSB7XG4gICAgICogICAgIChmdW5jdGlvbigpIHtcbiAgICAgKiAgICAgICB2YXIgc3RhcnQgPSBuZXcgRGF0ZTtcbiAgICAgKiAgICAgICB3aGlsZSAoY291bnQtLSkge1xuICAgICAqICAgICAgICAgYSArPSAxO1xuICAgICAqICAgICAgIH1cbiAgICAgKiAgICAgICB2YXIgZW5kID0gbmV3IERhdGUgLSBzdGFydDtcbiAgICAgKiAgICAgfSgpKVxuICAgICAqICAgfSgpKVxuICAgICAqIH0oKSlcbiAgICAgKi9cbiAgICAnc2V0dXAnOiBub29wLFxuXG4gICAgLyoqXG4gICAgICogQ29tcGlsZWQgaW50byB0aGUgdGVzdCBhbmQgZXhlY3V0ZWQgaW1tZWRpYXRlbHkgKiphZnRlcioqIHRoZSB0ZXN0IGxvb3AuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrXG4gICAgICogQHR5cGUgRnVuY3Rpb258U3RyaW5nXG4gICAgICovXG4gICAgJ3RlYXJkb3duJzogbm9vcCxcblxuICAgIC8qKlxuICAgICAqIEFuIG9iamVjdCBvZiBzdGF0cyBpbmNsdWRpbmcgbWVhbiwgbWFyZ2luIG9yIGVycm9yLCBhbmQgc3RhbmRhcmQgZGV2aWF0aW9uLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAqL1xuICAgICdzdGF0cyc6IHtcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgbWFyZ2luIG9mIGVycm9yLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsjc3RhdHNcbiAgICAgICAqIEB0eXBlIE51bWJlclxuICAgICAgICovXG4gICAgICAnbW9lJzogMCxcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgcmVsYXRpdmUgbWFyZ2luIG9mIGVycm9yIChleHByZXNzZWQgYXMgYSBwZXJjZW50YWdlIG9mIHRoZSBtZWFuKS5cbiAgICAgICAqXG4gICAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrI3N0YXRzXG4gICAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgICAqL1xuICAgICAgJ3JtZSc6IDAsXG5cbiAgICAgIC8qKlxuICAgICAgICogVGhlIHN0YW5kYXJkIGVycm9yIG9mIHRoZSBtZWFuLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsjc3RhdHNcbiAgICAgICAqIEB0eXBlIE51bWJlclxuICAgICAgICovXG4gICAgICAnc2VtJzogMCxcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgc2FtcGxlIHN0YW5kYXJkIGRldmlhdGlvbi5cbiAgICAgICAqXG4gICAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrI3N0YXRzXG4gICAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgICAqL1xuICAgICAgJ2RldmlhdGlvbic6IDAsXG5cbiAgICAgIC8qKlxuICAgICAgICogVGhlIHNhbXBsZSBhcml0aG1ldGljIG1lYW4uXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyayNzdGF0c1xuICAgICAgICogQHR5cGUgTnVtYmVyXG4gICAgICAgKi9cbiAgICAgICdtZWFuJzogMCxcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgYXJyYXkgb2Ygc2FtcGxlZCBwZXJpb2RzLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsjc3RhdHNcbiAgICAgICAqIEB0eXBlIEFycmF5XG4gICAgICAgKi9cbiAgICAgICdzYW1wbGUnOiBbXSxcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgc2FtcGxlIHZhcmlhbmNlLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsjc3RhdHNcbiAgICAgICAqIEB0eXBlIE51bWJlclxuICAgICAgICovXG4gICAgICAndmFyaWFuY2UnOiAwXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFuIG9iamVjdCBvZiB0aW1pbmcgZGF0YSBpbmNsdWRpbmcgY3ljbGUsIGVsYXBzZWQsIHBlcmlvZCwgc3RhcnQsIGFuZCBzdG9wLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFya1xuICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAqL1xuICAgICd0aW1lcyc6IHtcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgdGltZSB0YWtlbiB0byBjb21wbGV0ZSB0aGUgbGFzdCBjeWNsZSAoc2VjcykuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyayN0aW1lc1xuICAgICAgICogQHR5cGUgTnVtYmVyXG4gICAgICAgKi9cbiAgICAgICdjeWNsZSc6IDAsXG5cbiAgICAgIC8qKlxuICAgICAgICogVGhlIHRpbWUgdGFrZW4gdG8gY29tcGxldGUgdGhlIGJlbmNobWFyayAoc2VjcykuXG4gICAgICAgKlxuICAgICAgICogQG1lbWJlck9mIEJlbmNobWFyayN0aW1lc1xuICAgICAgICogQHR5cGUgTnVtYmVyXG4gICAgICAgKi9cbiAgICAgICdlbGFwc2VkJzogMCxcblxuICAgICAgLyoqXG4gICAgICAgKiBUaGUgdGltZSB0YWtlbiB0byBleGVjdXRlIHRoZSB0ZXN0IG9uY2UgKHNlY3MpLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsjdGltZXNcbiAgICAgICAqIEB0eXBlIE51bWJlclxuICAgICAgICovXG4gICAgICAncGVyaW9kJzogMCxcblxuICAgICAgLyoqXG4gICAgICAgKiBBIHRpbWVzdGFtcCBvZiB3aGVuIHRoZSBiZW5jaG1hcmsgc3RhcnRlZCAobXMpLlxuICAgICAgICpcbiAgICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsjdGltZXNcbiAgICAgICAqIEB0eXBlIE51bWJlclxuICAgICAgICovXG4gICAgICAndGltZVN0YW1wJzogMFxuICAgIH0sXG5cbiAgICAvLyBhYm9ydHMgYmVuY2htYXJrIChkb2VzIG5vdCByZWNvcmQgdGltZXMpXG4gICAgJ2Fib3J0JzogYWJvcnQsXG5cbiAgICAvLyBjcmVhdGVzIGEgbmV3IGJlbmNobWFyayB1c2luZyB0aGUgc2FtZSB0ZXN0IGFuZCBvcHRpb25zXG4gICAgJ2Nsb25lJzogY2xvbmUsXG5cbiAgICAvLyBjb21wYXJlcyBiZW5jaG1hcmsncyBoZXJ0eiB3aXRoIGFub3RoZXJcbiAgICAnY29tcGFyZSc6IGNvbXBhcmUsXG5cbiAgICAvLyBleGVjdXRlcyBsaXN0ZW5lcnNcbiAgICAnZW1pdCc6IGVtaXQsXG5cbiAgICAvLyBnZXQgbGlzdGVuZXJzXG4gICAgJ2xpc3RlbmVycyc6IGxpc3RlbmVycyxcblxuICAgIC8vIHVucmVnaXN0ZXIgbGlzdGVuZXJzXG4gICAgJ29mZic6IG9mZixcblxuICAgIC8vIHJlZ2lzdGVyIGxpc3RlbmVyc1xuICAgICdvbic6IG9uLFxuXG4gICAgLy8gcmVzZXQgYmVuY2htYXJrIHByb3BlcnRpZXNcbiAgICAncmVzZXQnOiByZXNldCxcblxuICAgIC8vIHJ1bnMgdGhlIGJlbmNobWFya1xuICAgICdydW4nOiBydW4sXG5cbiAgICAvLyBwcmV0dHkgcHJpbnQgYmVuY2htYXJrIGluZm9cbiAgICAndG9TdHJpbmcnOiB0b1N0cmluZ0JlbmNoXG4gIH0pO1xuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIGV4dGVuZChEZWZlcnJlZC5wcm90b3R5cGUsIHtcblxuICAgIC8qKlxuICAgICAqIFRoZSBkZWZlcnJlZCBiZW5jaG1hcmsgaW5zdGFuY2UuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLkRlZmVycmVkXG4gICAgICogQHR5cGUgT2JqZWN0XG4gICAgICovXG4gICAgJ2JlbmNobWFyayc6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIGRlZmVycmVkIGN5Y2xlcyBwZXJmb3JtZWQgd2hpbGUgYmVuY2htYXJraW5nLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5EZWZlcnJlZFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgICdjeWNsZXMnOiAwLFxuXG4gICAgLyoqXG4gICAgICogVGhlIHRpbWUgdGFrZW4gdG8gY29tcGxldGUgdGhlIGRlZmVycmVkIGJlbmNobWFyayAoc2VjcykuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLkRlZmVycmVkXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgJ2VsYXBzZWQnOiAwLFxuXG4gICAgLyoqXG4gICAgICogQSB0aW1lc3RhbXAgb2Ygd2hlbiB0aGUgZGVmZXJyZWQgYmVuY2htYXJrIHN0YXJ0ZWQgKG1zKS5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuRGVmZXJyZWRcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICAndGltZVN0YW1wJzogMCxcblxuICAgIC8vIGN5Y2xlcy9jb21wbGV0ZXMgdGhlIGRlZmVycmVkIGJlbmNobWFya1xuICAgICdyZXNvbHZlJzogcmVzb2x2ZVxuICB9KTtcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICBleHRlbmQoRXZlbnQucHJvdG90eXBlLCB7XG5cbiAgICAvKipcbiAgICAgKiBBIGZsYWcgdG8gaW5kaWNhdGUgaWYgdGhlIGVtaXR0ZXJzIGxpc3RlbmVyIGl0ZXJhdGlvbiBpcyBhYm9ydGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5FdmVudFxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICAnYWJvcnRlZCc6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogQSBmbGFnIHRvIGluZGljYXRlIGlmIHRoZSBkZWZhdWx0IGFjdGlvbiBpcyBjYW5jZWxsZWQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLkV2ZW50XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgICdjYW5jZWxsZWQnOiBmYWxzZSxcblxuICAgIC8qKlxuICAgICAqIFRoZSBvYmplY3Qgd2hvc2UgbGlzdGVuZXJzIGFyZSBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5FdmVudFxuICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAqL1xuICAgICdjdXJyZW50VGFyZ2V0JzogdW5kZWZpbmVkLFxuXG4gICAgLyoqXG4gICAgICogVGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgbGFzdCBleGVjdXRlZCBsaXN0ZW5lci5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuRXZlbnRcbiAgICAgKiBAdHlwZSBNaXhlZFxuICAgICAqL1xuICAgICdyZXN1bHQnOiB1bmRlZmluZWQsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgb2JqZWN0IHRvIHdoaWNoIHRoZSBldmVudCB3YXMgb3JpZ2luYWxseSBlbWl0dGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5FdmVudFxuICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAqL1xuICAgICd0YXJnZXQnOiB1bmRlZmluZWQsXG5cbiAgICAvKipcbiAgICAgKiBBIHRpbWVzdGFtcCBvZiB3aGVuIHRoZSBldmVudCB3YXMgY3JlYXRlZCAobXMpLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5FdmVudFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgICd0aW1lU3RhbXAnOiAwLFxuXG4gICAgLyoqXG4gICAgICogVGhlIGV2ZW50IHR5cGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLkV2ZW50XG4gICAgICogQHR5cGUgU3RyaW5nXG4gICAgICovXG4gICAgJ3R5cGUnOiAnJ1xuICB9KTtcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICAvKipcbiAgICogVGhlIGRlZmF1bHQgb3B0aW9ucyBjb3BpZWQgYnkgc3VpdGUgaW5zdGFuY2VzLlxuICAgKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuU3VpdGVcbiAgICogQHR5cGUgT2JqZWN0XG4gICAqL1xuICBTdWl0ZS5vcHRpb25zID0ge1xuXG4gICAgLyoqXG4gICAgICogVGhlIG5hbWUgb2YgdGhlIHN1aXRlLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZS5vcHRpb25zXG4gICAgICogQHR5cGUgU3RyaW5nXG4gICAgICovXG4gICAgJ25hbWUnOiB1bmRlZmluZWRcbiAgfTtcblxuICAvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuICBleHRlbmQoU3VpdGUucHJvdG90eXBlLCB7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbnVtYmVyIG9mIGJlbmNobWFya3MgaW4gdGhlIHN1aXRlLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgICdsZW5ndGgnOiAwLFxuXG4gICAgLyoqXG4gICAgICogQSBmbGFnIHRvIGluZGljYXRlIGlmIHRoZSBzdWl0ZSBpcyBhYm9ydGVkLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICAnYWJvcnRlZCc6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogQSBmbGFnIHRvIGluZGljYXRlIGlmIHRoZSBzdWl0ZSBpcyBydW5uaW5nLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICAncnVubmluZyc6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogQW4gYEFycmF5I2ZvckVhY2hgIGxpa2UgbWV0aG9kLlxuICAgICAqIENhbGxiYWNrcyBtYXkgdGVybWluYXRlIHRoZSBsb29wIGJ5IGV4cGxpY2l0bHkgcmV0dXJuaW5nIGBmYWxzZWAuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLlN1aXRlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIGNhbGxlZCBwZXIgaXRlcmF0aW9uLlxuICAgICAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBzdWl0ZSBpdGVyYXRlZCBvdmVyLlxuICAgICAqL1xuICAgICdmb3JFYWNoJzogbWV0aG9kaXplKGZvckVhY2gpLFxuXG4gICAgLyoqXG4gICAgICogQW4gYEFycmF5I2luZGV4T2ZgIGxpa2UgbWV0aG9kLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgICAqIEBwYXJhbSB7TWl4ZWR9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZWFyY2ggZm9yLlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCB2YWx1ZSBvciBgLTFgLlxuICAgICAqL1xuICAgICdpbmRleE9mJzogbWV0aG9kaXplKGluZGV4T2YpLFxuXG4gICAgLyoqXG4gICAgICogSW52b2tlcyBhIG1ldGhvZCBvbiBhbGwgYmVuY2htYXJrcyBpbiB0aGUgc3VpdGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLlN1aXRlXG4gICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBtZXRob2QgdG8gaW52b2tlIE9SIG9wdGlvbnMgb2JqZWN0LlxuICAgICAqIEBwYXJhbSB7TWl4ZWR9IFthcmcxLCBhcmcyLCAuLi5dIEFyZ3VtZW50cyB0byBpbnZva2UgdGhlIG1ldGhvZCB3aXRoLlxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgYXJyYXkgb2YgdmFsdWVzIHJldHVybmVkIGZyb20gZWFjaCBtZXRob2QgaW52b2tlZC5cbiAgICAgKi9cbiAgICAnaW52b2tlJzogbWV0aG9kaXplKGludm9rZSksXG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0cyB0aGUgc3VpdGUgb2YgYmVuY2htYXJrcyB0byBhIHN0cmluZy5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuU3VpdGVcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3NlcGFyYXRvcj0nLCddIEEgc3RyaW5nIHRvIHNlcGFyYXRlIGVhY2ggZWxlbWVudCBvZiB0aGUgYXJyYXkuXG4gICAgICogQHJldHVybnMge1N0cmluZ30gVGhlIHN0cmluZy5cbiAgICAgKi9cbiAgICAnam9pbic6IFtdLmpvaW4sXG5cbiAgICAvKipcbiAgICAgKiBBbiBgQXJyYXkjbWFwYCBsaWtlIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBtZW1iZXJPZiBCZW5jaG1hcmsuU3VpdGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gY2FsbGVkIHBlciBpdGVyYXRpb24uXG4gICAgICogQHJldHVybnMge0FycmF5fSBBIG5ldyBhcnJheSBvZiB2YWx1ZXMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrLlxuICAgICAqL1xuICAgICdtYXAnOiBtZXRob2RpemUobWFwKSxcblxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlcyB0aGUgdmFsdWUgb2YgYSBzcGVjaWZpZWQgcHJvcGVydHkgZnJvbSBhbGwgYmVuY2htYXJrcyBpbiB0aGUgc3VpdGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLlN1aXRlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5IFRoZSBwcm9wZXJ0eSB0byBwbHVjay5cbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IGFycmF5IG9mIHByb3BlcnR5IHZhbHVlcy5cbiAgICAgKi9cbiAgICAncGx1Y2snOiBtZXRob2RpemUocGx1Y2spLFxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgbGFzdCBiZW5jaG1hcmsgZnJvbSB0aGUgc3VpdGUgYW5kIHJldHVybnMgaXQuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLlN1aXRlXG4gICAgICogQHJldHVybnMge01peGVkfSBUaGUgcmVtb3ZlZCBiZW5jaG1hcmsuXG4gICAgICovXG4gICAgJ3BvcCc6IFtdLnBvcCxcblxuICAgIC8qKlxuICAgICAqIEFwcGVuZHMgYmVuY2htYXJrcyB0byB0aGUgc3VpdGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLlN1aXRlXG4gICAgICogQHJldHVybnMge051bWJlcn0gVGhlIHN1aXRlJ3MgbmV3IGxlbmd0aC5cbiAgICAgKi9cbiAgICAncHVzaCc6IFtdLnB1c2gsXG5cbiAgICAvKipcbiAgICAgKiBTb3J0cyB0aGUgYmVuY2htYXJrcyBvZiB0aGUgc3VpdGUuXG4gICAgICpcbiAgICAgKiBAbWVtYmVyT2YgQmVuY2htYXJrLlN1aXRlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NvbXBhcmVGbj1udWxsXSBBIGZ1bmN0aW9uIHRoYXQgZGVmaW5lcyB0aGUgc29ydCBvcmRlci5cbiAgICAgKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgc29ydGVkIHN1aXRlLlxuICAgICAqL1xuICAgICdzb3J0JzogW10uc29ydCxcblxuICAgIC8qKlxuICAgICAqIEFuIGBBcnJheSNyZWR1Y2VgIGxpa2UgbWV0aG9kLlxuICAgICAqXG4gICAgICogQG1lbWJlck9mIEJlbmNobWFyay5TdWl0ZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAgICAgKiBAcGFyYW0ge01peGVkfSBhY2N1bXVsYXRvciBJbml0aWFsIHZhbHVlIG9mIHRoZSBhY2N1bXVsYXRvci5cbiAgICAgKiBAcmV0dXJucyB7TWl4ZWR9IFRoZSBhY2N1bXVsYXRvci5cbiAgICAgKi9cbiAgICAncmVkdWNlJzogbWV0aG9kaXplKHJlZHVjZSksXG5cbiAgICAvLyBhYm9ydHMgYWxsIGJlbmNobWFya3MgaW4gdGhlIHN1aXRlXG4gICAgJ2Fib3J0JzogYWJvcnRTdWl0ZSxcblxuICAgIC8vIGFkZHMgYSBiZW5jaG1hcmsgdG8gdGhlIHN1aXRlXG4gICAgJ2FkZCc6IGFkZCxcblxuICAgIC8vIGNyZWF0ZXMgYSBuZXcgc3VpdGUgd2l0aCBjbG9uZWQgYmVuY2htYXJrc1xuICAgICdjbG9uZSc6IGNsb25lU3VpdGUsXG5cbiAgICAvLyBleGVjdXRlcyBsaXN0ZW5lcnMgb2YgYSBzcGVjaWZpZWQgdHlwZVxuICAgICdlbWl0JzogZW1pdCxcblxuICAgIC8vIGNyZWF0ZXMgYSBuZXcgc3VpdGUgb2YgZmlsdGVyZWQgYmVuY2htYXJrc1xuICAgICdmaWx0ZXInOiBmaWx0ZXJTdWl0ZSxcblxuICAgIC8vIGdldCBsaXN0ZW5lcnNcbiAgICAnbGlzdGVuZXJzJzogbGlzdGVuZXJzLFxuXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lcnNcbiAgICAnb2ZmJzogb2ZmLFxuXG4gICAvLyByZWdpc3RlciBsaXN0ZW5lcnNcbiAgICAnb24nOiBvbixcblxuICAgIC8vIHJlc2V0cyBhbGwgYmVuY2htYXJrcyBpbiB0aGUgc3VpdGVcbiAgICAncmVzZXQnOiByZXNldFN1aXRlLFxuXG4gICAgLy8gcnVucyBhbGwgYmVuY2htYXJrcyBpbiB0aGUgc3VpdGVcbiAgICAncnVuJzogcnVuU3VpdGUsXG5cbiAgICAvLyBhcnJheSBtZXRob2RzXG4gICAgJ2NvbmNhdCc6IGNvbmNhdCxcblxuICAgICdyZXZlcnNlJzogcmV2ZXJzZSxcblxuICAgICdzaGlmdCc6IHNoaWZ0LFxuXG4gICAgJ3NsaWNlJzogc2xpY2UsXG5cbiAgICAnc3BsaWNlJzogc3BsaWNlLFxuXG4gICAgJ3Vuc2hpZnQnOiB1bnNoaWZ0XG4gIH0pO1xuXG4gIC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xuXG4gIC8vIGV4cG9zZSBEZWZlcnJlZCwgRXZlbnQgYW5kIFN1aXRlXG4gIGV4dGVuZChCZW5jaG1hcmssIHtcbiAgICAnRGVmZXJyZWQnOiBEZWZlcnJlZCxcbiAgICAnRXZlbnQnOiBFdmVudCxcbiAgICAnU3VpdGUnOiBTdWl0ZVxuICB9KTtcblxuICAvLyBleHBvc2UgQmVuY2htYXJrXG4gIC8vIHNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMsIGxpa2Ugci5qcywgY2hlY2sgZm9yIHNwZWNpZmljIGNvbmRpdGlvbiBwYXR0ZXJucyBsaWtlIHRoZSBmb2xsb3dpbmc6XG4gIGlmICh0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIGRlZmluZSBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlIHNvLCB0aHJvdWdoIHBhdGggbWFwcGluZywgaXQgY2FuIGJlIGFsaWFzZWRcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gQmVuY2htYXJrO1xuICAgIH0pO1xuICB9XG4gIC8vIGNoZWNrIGZvciBgZXhwb3J0c2AgYWZ0ZXIgYGRlZmluZWAgaW4gY2FzZSBhIGJ1aWxkIG9wdGltaXplciBhZGRzIGFuIGBleHBvcnRzYCBvYmplY3RcbiAgZWxzZSBpZiAoZnJlZUV4cG9ydHMpIHtcbiAgICAvLyBpbiBOb2RlLmpzIG9yIFJpbmdvSlMgdjAuOC4wK1xuICAgIGlmICh0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJiBtb2R1bGUuZXhwb3J0cyA9PSBmcmVlRXhwb3J0cykge1xuICAgICAgKG1vZHVsZS5leHBvcnRzID0gQmVuY2htYXJrKS5CZW5jaG1hcmsgPSBCZW5jaG1hcms7XG4gICAgfVxuICAgIC8vIGluIE5hcndoYWwgb3IgUmluZ29KUyB2MC43LjAtXG4gICAgZWxzZSB7XG4gICAgICBmcmVlRXhwb3J0cy5CZW5jaG1hcmsgPSBCZW5jaG1hcms7XG4gICAgfVxuICB9XG4gIC8vIGluIGEgYnJvd3NlciBvciBSaGlub1xuICBlbHNlIHtcbiAgICAvLyB1c2Ugc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gc28gQ2xvc3VyZSBDb21waWxlciB3b24ndCBtdW5nZSBgQmVuY2htYXJrYFxuICAgIC8vIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vY2xvc3VyZS9jb21waWxlci9kb2NzL2FwaS10dXRvcmlhbDMuaHRtbCNleHBvcnRcbiAgICB3aW5kb3dbJ0JlbmNobWFyayddID0gQmVuY2htYXJrO1xuICB9XG5cbiAgLy8gdHJpZ2dlciBjbG9jaydzIGxhenkgZGVmaW5lIGVhcmx5IHRvIGF2b2lkIGEgc2VjdXJpdHkgZXJyb3JcbiAgaWYgKHN1cHBvcnQuYWlyKSB7XG4gICAgY2xvY2soeyAnX29yaWdpbmFsJzogeyAnZm4nOiBub29wLCAnY291bnQnOiAxLCAnb3B0aW9ucyc6IHt9IH0gfSk7XG4gIH1cbn0odGhpcykpO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZSgnX3Byb2Nlc3MnKSx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIl19
