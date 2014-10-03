(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter
  , inherits = require('inherits')

module.exports = fps

// Try use performance.now(), otherwise try
// +new Date.
var now = (
  (function(){ return this }()).performance &&
  'function' === typeof performance.now
) ? function() { return performance.now() }
  : Date.now || function() { return +new Date }

function fps(opts) {
  if (!(this instanceof fps)) return new fps(opts)
  EventEmitter.call(this)

  opts = opts || {}
  this.last = now()
  this.rate = 0
  this.time = 0
  this.decay = opts.decay || 1
  this.every = opts.every || 1
  this.ticks = 0
}
inherits(fps, EventEmitter)

fps.prototype.tick = function() {
  var time = now()
    , diff = time - this.last
    , fps = diff

  this.ticks += 1
  this.last = time
  this.time += (fps - this.time) * this.decay
  this.rate = 1000 / this.time
  if (!(this.ticks % this.every)) this.emit('data', this.rate)
}


},{"events":1,"inherits":3}],3:[function(require,module,exports){
module.exports = inherits

function inherits (c, p, proto) {
  proto = proto || {}
  var e = {}
  ;[c.prototype, proto].forEach(function (s) {
    Object.getOwnPropertyNames(s).forEach(function (k) {
      e[k] = Object.getOwnPropertyDescriptor(s, k)
    })
  })
  c.prototype = Object.create(p.prototype, e)
  c.super = p
}

//function Child () {
//  Child.super.call(this)
//  console.error([this
//                ,this.constructor
//                ,this.constructor === Child
//                ,this.constructor.super === Parent
//                ,Object.getPrototypeOf(this) === Child.prototype
//                ,Object.getPrototypeOf(Object.getPrototypeOf(this))
//                 === Parent.prototype
//                ,this instanceof Child
//                ,this instanceof Parent])
//}
//function Parent () {}
//inherits(Child, Parent)
//new Child

},{}],4:[function(require,module,exports){
var prodash = {
  functions:   require("./src/functions"),
  transducers: require("./src/transducers"),
  array:       require("./src/array"),
  object:      require("./src/object")
}

module.exports = prodash

},{"./src/array":5,"./src/functions":6,"./src/object":7,"./src/transducers":8}],5:[function(require,module,exports){
var fns         = require("./functions")
var curry       = fns.curry
var demethodize = fns.demethodize
var array       = {}

var find = curry(function (predFn, ar) {
  for (var i = 0; i < ar.length; ++i) {
    if (predFn(ar[i])) return ar[i] 
  }
  return null
})

var forEach = curry(function (transFn, ar) {
  for (var i = 0; i < ar.length; ++i) {
    ar[i] = transFn(ar[i]) 
  }
})

var reverse = function (list) {
  var backwards = []

  for (var i = 0, len = list.length; i < len; ++i) {
    backwards[i] = list[len-1-i]
  }
  return backwards
}

var concat = demethodize(Array.prototype, "concat")

var flatten = function (arrayOfArrays) {
  var flattened = []
  var subarray

  for (var i = 0; i < arrayOfArrays.length; ++i) {
    subarray = arrayOfArrays[i]
    for (var j = 0; j < subarray.length; ++j) {
      flattened.push(subarray[j]) 
    }
  }
  return flattened
}

var push = function (array, el) {
  array.push(el)
  return array
}

var unshift = function (array, el) {
  array.unshift(el)
  return array
}

var slice = function (start, end, array) {
  return array.slice(start, end)
}

var remove = function (fn, array) {
  for (var i = 0; i < array.length; ++i) {
    if (fn(array[i])) {
      array.splice(i, 1)
    }
  }
  return array
}

array.find    = find
array.forEach = forEach
array.reverse = reverse
array.concat  = concat
array.flatten = flatten
array.slice   = slice
array.push    = push
array.unshift = unshift
array.remove  = remove

module.exports = array

},{"./functions":6}],6:[function(require,module,exports){
var fns = {}

var demethodize = function (obj, fnName) {
  return Function.prototype.call.bind(obj[fnName]) 
}

var instanceOf = function (constructor, col) { 
  return col instanceof constructor
}

var apply = function (fn, argsList) { 
  return fn.apply(this, argsList) 
}

var call = function (fn) { 
  var args = []

  for (var i = 0; i < arguments.length - 1; ++i) {
    args[i] = arguments[i + 1] 
  }
  return fn.apply(this, args) 
}

var compose = function (fns) {
  return function composed (val) {
    for (var i = fns.length - 1; i >= 0; --i) {
      val = fns[i](val)
    }
    return val
  }
}

var flip = function (fn) {
  return function () {
    var backwards = []

    for (var i = 0, len = arguments.length; i < len; ++i) {
      backwards[i] = arguments[len-1-i]
    }
    return apply(fn, backwards)
  }
}

var partial = function (fn) {
  var args = []

  for (var i = 0; i < arguments.length - 1; ++i) {
    args[i] = arguments[i + 1] 
  }

  return function () {
    for (var j = 0, startingIndex = args.length; j < arguments.length; ++j) {
      args[j + startingIndex] = arguments[j] 
    }

    return fn.apply(null, args)
  }
}

//utility function used in curry def
var innerCurry = function (fn, args) {
  return function () {
    for (var i = 0, startingIndex = args.length; i < arguments.length; ++i) {
      args[i + startingIndex] = arguments[i] 
    }

    return fn.apply(null, args);
  };
};

//arity argument is used most often internally
var curry = function (fn, arity) {
  var fnArity = arity || fn.length

  return function () {
    var missingArgsCount = fnArity - arguments.length
    var notEnoughArgs    = missingArgsCount > 0
    var args             = []

    for (var i = 0; i < arguments.length; ++i) {
      args[i] = arguments[i] 
    }

    if (notEnoughArgs) return curry(innerCurry(fn, args), missingArgsCount)
    else               return fn.apply(null, args)
  }
}

fns.demethodize = demethodize
fns.instanceOf  = instanceOf
fns.flip        = flip
fns.compose     = compose
fns.partial     = partial
fns.curry       = curry
fns.call        = call
fns.apply       = apply
module.exports  = fns

},{}],7:[function(require,module,exports){
var fns         = require("./functions")
var curry       = fns.curry
var object      = {}

var extend = curry(function (host, obj) {
  var ks = Object.keys(obj)

  for (var i = 0; i < ks.length; ++i) {
    host[ks[i]] = obj[ks[i]]
  }
  return host
})

var hasKey = curry(function (key, e) {
  return e[key] !== undefined
})

var hasKeys = curry(function (keys, e) {
  var res = true

  for (var i = 0; i < keys.length; ++i) {
    res = res && e[keys[i]] !== undefined
  }
  return res
})

object.hasKey  = hasKey
object.hasKeys = hasKeys
object.extend  = extend

module.exports = object

},{"./functions":6}],8:[function(require,module,exports){
var fns        = require("./functions")
var curry      = fns.curry
var compose    = fns.compose
var instanceOf = fns.instanceOf
var trans      = {}

var redIdentity = function (acc, x) { return x }

var reduceArray = function (fn, accum, arr) {
  var index = -1
  var len   = arr.length

  while (++index < len) {
    accum = fn(accum, arr[index])
  }
  return accum
}

var reduceObject = function (fn, accum, obj) {
  var index = -1
  var ks    = Object.keys(obj)
  var len   = ks.length
  var key
  var kv

  while (++index < len) {
    key     = ks[index]
    kv      = {}
    kv[key] = obj[key]
    accum   = fn(accum, kv)
  }
  return accum
}

var consArray = function (array, el) {
  array.push(el)
  return array
}

var consObject = function (host, obj) {
  var ks = Object.keys(obj)

  for (var i = 0; i < ks.length; ++i) {
    host[ks[i]] = obj[ks[i]]
  }
  return host
}

var reduce = curry(function (fn, accum, col) {
  if      (instanceOf(Array, col))        return reduceArray(fn, accum, col)
  else if (instanceOf(Float32Array, col)) return reduceArray(fn, accum, col)
  else if (instanceOf(Uint32Array, col))  return reduceArray(fn, accum, col)
  else if (col.__reduce !== undefined)    return col.__reduce(fn, accum, col)
  else if (instanceOf(Object, col))       return reduceObject(fn, accum, col)
  else                                    throw new Error("unknown collection type")
})

var cons = curry(function (col, el) {
  if      (instanceOf(Array, col))   return consArray(col, el)
  else if (col.__cons !== undefined) return col.__cons(col, el)
  else if (instanceOf(Object, col))  return consObject(col, el)
  else                               throw new Error("unknown collection type")
})

var empty = function (col) {
  if      (instanceOf(Array, col))        return []
  else if (instanceOf(Float32Array, col)) return new Float32Array
  else if (instanceOf(Uint32Array, col))  return new Uint32Array
  else if (col.__empty !== undefined)     return col.__empty()
  else if (instanceOf(Object, col))       return {}
  else                                    throw new Error("unknown collection type")
}

var mapping = curry(function (transFn, stepFn) {
  return function (acc, x) {
    return stepFn(acc, transFn(x))
  }
})

var plucking = curry(function (propName, stepFn) {
  return mapping(function (x) { return x[propName] }, stepFn)
})

var filtering = curry(function (predFn, stepFn) {
  return function (acc, x) {
    return predFn(x) ? stepFn(acc, x) : acc 
  }
})

var checking = curry(function (prop, val, stepFn) {
  return filtering(function (x) { return x[prop] === val }, stepFn)
})

//THIS WILL MUTATE THE STRUCTURE PROVIDED TO IT DIRECTLY
var mutating = curry(function (mutFn, stepFn) {
  return function (acc, x) {
    mutFn(x)
    return stepFn(acc, x)
  }
})

var cat = function (fn) {
  return function (acc, x) {
    return reduce(fn, acc, x) 
  }
}

var map = curry(function (fn, col) {
  return reduce(mapping(fn, cons), empty(col), col)
})

var mapcatting = curry(function (transFn, stepFn) {
  return compose([cat, mapping(transFn)])(stepFn)
})

var filter = curry(function (predFn, col) {
  return reduce(filtering(predFn, cons), empty(col), col)
})

var mutate = curry(function (transFn, col) {
  return reduce(transFn(redIdentity), undefined, col)
})

var transduce = curry(function (transFn, stepFn, init, col) {
  return reduce(transFn(stepFn), init, col)
})

var sequence = curry(function (transFn, col) {
  return reduce(transFn(cons), empty(col), col)
})

var into = curry(function (to, transFn, from) {
  return transduce(transFn, cons, to, from)
})

trans.reduce     = reduce
trans.cons       = cons
trans.empty      = empty
trans.mapping    = mapping
trans.plucking   = plucking
trans.cat        = cat
trans.filtering  = filtering
trans.checking   = checking
trans.map        = map
trans.mapcatting = mapcatting
trans.mutating   = mutating
trans.mutate     = mutate
trans.filter     = filter
trans.transduce  = transduce
trans.sequence   = sequence
trans.into       = into
module.exports   = trans

},{"./functions":6}],9:[function(require,module,exports){
var prodash       = require("prodash")
var async         = require("async")
var fps           = require("fps")
var mat4          = require("gl-mat4")
var graph         = require("../modules/graph")
var loaders       = require("../modules/loaders")
var utils         = require("../modules/gl-utils")
var random        = require("../modules/random")
var physics       = require("../modules/physics")
var lifetime      = require("../modules/lifetime")
var emitters      = require("../modules/emitters")
var clock         = require("../modules/clock")
var camera        = require("../modules/camera")
var Graph         = graph.Graph
var attachById    = graph.attachById
var partial       = prodash.functions.partial
var Particle      = emitters.Particle
var Emitter       = emitters.Emitter
var updateEmitter = emitters.updateEmitter
var loadShader    = loaders.loadShader
var updateBuffer  = utils.updateBuffer
var clearContext  = utils.clearContext
var LoadedProgram = utils.LoadedProgram
var randBound     = random.randBound
var updatePhysics = physics.updatePhysics
var killTheOld    = lifetime.killTheOld
var Clock         = clock.Clock
var updateClock   = clock.updateClock
var Camera        = camera.Camera
var updateCamera  = camera.updateCamera
var canvas        = document.getElementById("playground")
var stats         = document.getElementById("stats")
var gl            = canvas.getContext("webgl")
var shaders       = {
  vertex:   "/shaders/01v.glsl",
  fragment: "/shaders/01f.glsl"
}

//(World -> Node) -> String -> World -> Void
var forEachNode = function (fn, nodeId, world) {
  var node = world.graph.nodes[nodeId]

  fn(world, node)
  for (var i = 0; i < node.childIds.length; ++i) {
    forEachNode(fn, node.childIds[i], world)
  }
}

//(World -> Node) -> World -> Void
var updateEntities = function (fn, world) {
  forEachNode(fn, world.graph.rootNodeId, world)
}

function makeUpdate (world) {
  updateClock(world.clock, performance.now())
  return function update () {
    updateClock(world.clock, performance.now())
    updateCamera(world, world.camera)
    updateEntities(killTheOld, world)
    updateEntities(updatePhysics, world)
    updateEntities(updateEmitter, world)
  }
}

function makeAnimate (gl, world) {
  var rawPositions = []
  var buildBuffers = function (world, node) {
    if (node.living && node.renderable) {
      rawPositions.push(node.position[0]) 
      rawPositions.push(node.position[1]) 
      rawPositions.push(node.position[2]) 
    }
  }
  var positions 
  //temporary... should refactor
  var lp = world.programs.particle

  return function animate () {
    rawPositions = []
    updateEntities(buildBuffers, world)
    positions = new Float32Array(rawPositions)

    clearContext(gl)
    gl.useProgram(world.programs.particle.program)
    gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
    gl.uniform2f(lp.uniforms.uScreenSize, canvas.clientWidth, canvas.clientHeight)
    gl.uniformMatrix4fv(lp.uniforms.uView, false, world.camera.view)
    gl.uniformMatrix4fv(lp.uniforms.uProjection, false, world.camera.projection)
    gl.uniform1f(lp.uniforms.uSize, 1.0)
    updateBuffer(gl, 3, lp.attributes.aPosition, lp.buffers.aPosition, positions)
    gl.drawArrays(gl.POINTS, 0, positions.length / 3)
    requestAnimationFrame(animate) 
  }
}

async.parallel({
  vertex:   partial(loadShader, "/shaders/01v.glsl"),
  fragment: partial(loadShader, "/shaders/01f.glsl")
}, function (err, shaders) {
  var fov             = .5 * Math.PI
  var aspect          = canvas.clientWidth / canvas.clientHeight
  var particleProgram = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var world           = {
    clock:    Clock(performance.now()),
    camera:   Camera(0, 0, 3, fov, aspect, 1, 10),
    graph:    Graph(),
    programs: {
      particle: particleProgram
    }
  }

  window.world = world
  window.gl = gl

  var spawnAt = function (speed, x, y, dx, dy) {
    var e = Emitter(1000, 10, speed, .1, x, y, 0, dx, dy, 0)  

    attachById(world.graph, world.graph.rootNodeId, e)
    for (var j = 0; j < 50; ++j) {
      attachById(world.graph, e.id, Particle(1000, 0, 0, 0))
    }
  }

  var buildEmitter = function (transFn) {
    var count  = 8
    var spread = 2
    var diff   = spread / count
    var e

    for (var i = -1 * count; i < 1 * count; i+=.1 * count) {
      spawnAt(.004, transFn(i) * diff, i / count, 1, 0)
    }
  }
  buildEmitter(Math.sin)
  setInterval(makeUpdate(world), 25)
  requestAnimationFrame(makeAnimate(gl, world))
})

},{"../modules/camera":10,"../modules/clock":11,"../modules/emitters":12,"../modules/gl-utils":13,"../modules/graph":14,"../modules/lifetime":15,"../modules/loaders":16,"../modules/physics":17,"../modules/random":18,"async":"async","fps":2,"gl-mat4":"gl-mat4","prodash":4}],10:[function(require,module,exports){
var mat4     = require("gl-mat4")
var vec3     = require("./vec3")
var Vec3     = vec3.Vec3
var rotSpeed = Math.PI / 1800
var camera   = {}


var Camera = function (x, y, z, fov, aspect, near, far) {
  if (!(this instanceof Camera)) return new Camera(x, y, z, fov, aspect, near, far)

  this.position   = Vec3(x, y ,z)
  this.fov        = fov
  this.near       = near
  this.far        = far
  this.aspect     = aspect
  this.projection = mat4.perspective(mat4.create(), fov, aspect, near, far)

  this.eye        = Vec3(x, y, z)
  this.lookAt     = Vec3(0, 0, 0)
  this.up         = Vec3(0, 1, 0)
  this.view       = mat4.lookAt(mat4.create(), this.eye, this.lookAt, this.up)
}

var updateCamera = function (world, camera) {
  var dT   = world.clock.dT
  var view = world.camera.view

  mat4.rotateY(view, view, rotSpeed * dT)
}


camera.Camera       = Camera
camera.updateCamera = updateCamera
module.exports = camera

},{"./vec3":19,"gl-mat4":"gl-mat4"}],11:[function(require,module,exports){
var clock = {}

var Clock = function (now) {
  if (!(this instanceof Clock)) return new Clock(now)
  this.oldTime = now
  this.newTime = now
  this.dT      = this.newTime - this.oldTime
}

var updateClock = function (clock, newTime) {
  clock.oldTime = clock.newTime
  clock.newTime = newTime
  clock.dT      = clock.newTime - clock.oldTime
}

clock.Clock       = Clock
clock.updateClock = updateClock

module.exports = clock

},{}],12:[function(require,module,exports){
var uuid      = require("node-uuid")
var prodash   = require("prodash")
var random    = require("./random")
var vec3      = require("./vec3")
var Vec3      = vec3.Vec3
var find      = prodash.array.find
var curry     = prodash.functions.curry
var randBound = random.randBound
var emitters  = {}

var Particle = function (lifespan, px, py, pz) {
  return {
    id:           uuid.v4(),
    position:     Vec3(px, py, pz),
    velocity:     Vec3(0, 0, 0),
    acceleration: Vec3(0, -0.0000015, 0),
    //acceleration: Vec3(0, 0, 0),
    renderable:   true,
    size:         4.0,
    timeToDie:    0,
    lifespan:     lifespan,
    living:       false
  }
}

var Emitter = function (lifespan, rate, speed, spread, px, py, pz, dx, dy, dz) {
  return {
    id:           uuid.v4(),
    emitter:      true,
    rate:         rate, 
    speed:        speed,
    spread:       spread,
    nextFireTime: 0,
    position:     Vec3(px, py, pz),
    velocity:     Vec3(0, 0, 0),
    acceleration: Vec3(0, 0, 0),
    direction:    Vec3(dx, dy, dz),
    renderable:   false,
    living:       true
  }
}


var scaleAndSpread = function (scale, spread, val) {
  return scale * (val + randBound(-1 * spread, spread))
}

var findFirstDead = function (graph, childIds) {
  var childNode

  for (var i = 0; i < childIds.length; ++i) {
    childNode = graph.nodes[childIds[i]]
    if (!childNode.living) return childNode
  }
  return undefined
}

var updateEmitter = function (world, e) {
  var time = world.clock.newTime
  var particle 

  if (!e.emitter) return
  if (!e.living)  return
  if (time > e.nextFireTime) {
    particle             = findFirstDead(world.graph, e.childIds)
    particle.timeToDie   = time + particle.lifespan
    particle.living      = true
    particle.position[0] = e.position[0]
    particle.position[1] = e.position[1]
    particle.position[2] = e.position[2]
    particle.velocity[0] = scaleAndSpread(e.speed, e.spread, e.direction[0])
    particle.velocity[1] = scaleAndSpread(e.speed, e.spread, e.direction[1])
    particle.velocity[2] = scaleAndSpread(e.speed, e.spread, e.direction[2])
    e.nextFireTime += e.rate
  }
}

emitters.Particle      = Particle
emitters.Emitter       = Emitter
emitters.updateEmitter = updateEmitter
module.exports         = emitters

},{"./random":18,"./vec3":19,"node-uuid":"node-uuid","prodash":4}],13:[function(require,module,exports){
var utils = {}

var clearContext = function (gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
}

var updateBuffer = function (gl, chunkSize, attribute, buffer, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(attribute)
  gl.vertexAttribPointer(attribute, chunkSize, gl.FLOAT, false, 0, 0)
  return buffer
}

//given src and type, compile and return shader
function compile (gl, shaderType, src) {
  var shader = gl.createShader(shaderType)

  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  return shader
}

//link your program w/ opengl
function link (gl, vs, fs) {
  var program = gl.createProgram()

  gl.attachShader(program, vs) 
  gl.attachShader(program, fs) 
  gl.linkProgram(program)
  return program
}

/*
 * We want to create a wrapper for a loaded gl program
 * that includes pointers to all the uniforms and attributes
 * defined for this program.  This makes it more convenient
 * to change these values
 */
var LoadedProgram = function (gl, vSrc, fSrc) {
  var vs            = compile(gl, gl.VERTEX_SHADER, vSrc)
  var fs            = compile(gl, gl.FRAGMENT_SHADER, fSrc)
  var program       = link(gl, vs, fs)
  var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
  var numUniforms   = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  var lp = {
    vertex: {
      src:    vSrc,
      shader: vs 
    },
    fragment: {
      src:    fSrc,
      shader: fs 
    },
    program:    program,
    uniforms:   {}, 
    attributes: {},
    buffers:    {}
  }
  var aName
  var uName

  for (var i = 0; i < numAttributes; ++i) {
    aName                = gl.getActiveAttrib(program, i).name
    lp.attributes[aName] = gl.getAttribLocation(program, aName)
    lp.buffers[aName]    = gl.createBuffer()
  }

  for (var j = 0; j < numUniforms; ++j) {
    uName              = gl.getActiveUniform(program, j).name
    lp.uniforms[uName] = gl.getUniformLocation(program, uName)
  }

  return lp 
}

utils.clearContext  = clearContext
utils.updateBuffer  = updateBuffer
utils.LoadedProgram = LoadedProgram
module.exports      = utils

},{}],14:[function(require,module,exports){
var prodash   = require("prodash")
var uuid      = require("node-uuid")
var transduce = prodash.transducers.transduce
var filtering = prodash.transducers.filtering
var cons      = prodash.transducers.cons
var extend    = prodash.object.extend
var curry     = prodash.functions.curry
var remove    = prodash.array.remove
var graph     = {}

var Node = function (hash) {
  if (!(this instanceof Node)) return new Node(hash) 

  extend(this, hash)
  this.id       = this.id || uuid.v4()
  this.parentId = this.parentId || null
  this.childIds = this.childIds || []
}

var Graph = function (rootNode) {
  if (!(this instanceof Graph)) return new Graph
  var rootNode = rootNode || Node({ id: uuid.v4() })

  this.nodes              = {}
  this.rootNodeId         = rootNode.id
  this.nodes[rootNode.id] = rootNode
}

//used internally by graph.__reduce to support iteration
var nodeReduce = function (redFn, nodeId, accum, graph) {
  var node = graph.nodes[nodeId]

  accum = redFn(accum, node)

  for (var i = 0; i < node.childIds.length; ++i) {
    accum = nodeReduce(redFn, node.childIds[i], accum, graph)   
  }
  return accum
}

//Graph -> String -> Node -> Void
var attachById = curry(function (graph, parentId, node) {
  if(!graph.nodes[parentId]) throw new Error(parentId + " not found in graph")
  var node = node instanceof Node ? node : Node(node)

  graph.nodes[node.id]          = node
  graph.nodes[node.id].parentId = parentId
  graph.nodes[parentId].childIds.push(node.id)
})

Graph.prototype.__reduce = function (redFn, accum, graph) {
  return nodeReduce(redFn, graph.rootNodeId, accum, graph)
}

Graph.prototype.__empty = function () { return new Graph }

graph.Node       = Node
graph.Graph      = Graph
graph.attachById = attachById
module.exports   = graph

},{"node-uuid":"node-uuid","prodash":4}],15:[function(require,module,exports){
var fns      = require("prodash")
var curry    = fns.functions.curry
var lifetime = {}

lifetime.killTheOld = function (world, e) {
  var time = world.clock.newTime

  if (!e.lifespan)                     return
  if (e.living && time >= e.timeToDie) e.living = false
}

module.exports = lifetime

},{"prodash":4}],16:[function(require,module,exports){
var loaders  = {}

loaders.loadShader = function (path, cb) {
  var xhr = new XMLHttpRequest

  xhr.responseType = "string"
  xhr.onload       = function () { cb(null, xhr.response) }
  xhr.onerror      = function () { cb(new Error("Could not load " + path)) }
  xhr.open("GET", path, true)
  xhr.send(null)
}

module.exports = loaders

},{}],17:[function(require,module,exports){
var fns     = require("prodash")
var curry   = fns.functions.curry
var physics = {}

var hasPhysics = function (node) { 
  return !!node.position && !!node.velocity && !!node.acceleration 
}
physics.updatePosition = function (dT, e) {
  e.position[0] = e.position[0] + dT * e.velocity[0]
  e.position[1] = e.position[1] + dT * e.velocity[1]
  e.position[2] = e.position[2] + dT * e.velocity[2]
  return e
}

physics.updateVelocity = function (dT, e) {
  e.velocity[0] = e.velocity[0] + dT * e.acceleration[0]
  e.velocity[1] = e.velocity[1] + dT * e.acceleration[1]
  e.velocity[2] = e.velocity[2] + dT * e.acceleration[2]
  return e
}

physics.updatePhysics = function (world, e) {
  if (!hasPhysics(e)) return
  if (!e.living)      return
  physics.updateVelocity(world.clock.dT, e)
  physics.updatePosition(world.clock.dT, e)
  return e
}

module.exports = physics

},{"prodash":4}],18:[function(require,module,exports){
var random = {}

random.randBound = function (min, max) {
  return Math.random() * (max - min) + min
}

module.exports = random

},{}],19:[function(require,module,exports){
var vec3 = {}

vec3.Vec3 = function (x, y, z) {
  var out = new Float32Array(3)

  out[0] = x
  out[1] = y
  out[2] = z

  return out
}

module.exports = vec3

},{}]},{},[9])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvaW5kZXguanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9wcm9kYXNoLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvYXJyYXkuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9vYmplY3QuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy90cmFuc2R1Y2Vycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL2V4YW1wbGVzLzAxLUJhc2ljLVNldHVwLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9jYW1lcmEuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2Nsb2NrLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9lbWl0dGVycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvZ2wtdXRpbHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2dyYXBoLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9saWZldGltZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbG9hZGVycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvcGh5c2ljcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvcmFuZG9tLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy92ZWMzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlclxuICAsIGluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZwc1xuXG4vLyBUcnkgdXNlIHBlcmZvcm1hbmNlLm5vdygpLCBvdGhlcndpc2UgdHJ5XG4vLyArbmV3IERhdGUuXG52YXIgbm93ID0gKFxuICAoZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMgfSgpKS5wZXJmb3JtYW5jZSAmJlxuICAnZnVuY3Rpb24nID09PSB0eXBlb2YgcGVyZm9ybWFuY2Uubm93XG4pID8gZnVuY3Rpb24oKSB7IHJldHVybiBwZXJmb3JtYW5jZS5ub3coKSB9XG4gIDogRGF0ZS5ub3cgfHwgZnVuY3Rpb24oKSB7IHJldHVybiArbmV3IERhdGUgfVxuXG5mdW5jdGlvbiBmcHMob3B0cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgZnBzKSkgcmV0dXJuIG5ldyBmcHMob3B0cylcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcylcblxuICBvcHRzID0gb3B0cyB8fCB7fVxuICB0aGlzLmxhc3QgPSBub3coKVxuICB0aGlzLnJhdGUgPSAwXG4gIHRoaXMudGltZSA9IDBcbiAgdGhpcy5kZWNheSA9IG9wdHMuZGVjYXkgfHwgMVxuICB0aGlzLmV2ZXJ5ID0gb3B0cy5ldmVyeSB8fCAxXG4gIHRoaXMudGlja3MgPSAwXG59XG5pbmhlcml0cyhmcHMsIEV2ZW50RW1pdHRlcilcblxuZnBzLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHZhciB0aW1lID0gbm93KClcbiAgICAsIGRpZmYgPSB0aW1lIC0gdGhpcy5sYXN0XG4gICAgLCBmcHMgPSBkaWZmXG5cbiAgdGhpcy50aWNrcyArPSAxXG4gIHRoaXMubGFzdCA9IHRpbWVcbiAgdGhpcy50aW1lICs9IChmcHMgLSB0aGlzLnRpbWUpICogdGhpcy5kZWNheVxuICB0aGlzLnJhdGUgPSAxMDAwIC8gdGhpcy50aW1lXG4gIGlmICghKHRoaXMudGlja3MgJSB0aGlzLmV2ZXJ5KSkgdGhpcy5lbWl0KCdkYXRhJywgdGhpcy5yYXRlKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGluaGVyaXRzXG5cbmZ1bmN0aW9uIGluaGVyaXRzIChjLCBwLCBwcm90bykge1xuICBwcm90byA9IHByb3RvIHx8IHt9XG4gIHZhciBlID0ge31cbiAgO1tjLnByb3RvdHlwZSwgcHJvdG9dLmZvckVhY2goZnVuY3Rpb24gKHMpIHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhzKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICBlW2tdID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihzLCBrKVxuICAgIH0pXG4gIH0pXG4gIGMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwLnByb3RvdHlwZSwgZSlcbiAgYy5zdXBlciA9IHBcbn1cblxuLy9mdW5jdGlvbiBDaGlsZCAoKSB7XG4vLyAgQ2hpbGQuc3VwZXIuY2FsbCh0aGlzKVxuLy8gIGNvbnNvbGUuZXJyb3IoW3RoaXNcbi8vICAgICAgICAgICAgICAgICx0aGlzLmNvbnN0cnVjdG9yXG4vLyAgICAgICAgICAgICAgICAsdGhpcy5jb25zdHJ1Y3RvciA9PT0gQ2hpbGRcbi8vICAgICAgICAgICAgICAgICx0aGlzLmNvbnN0cnVjdG9yLnN1cGVyID09PSBQYXJlbnRcbi8vICAgICAgICAgICAgICAgICxPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgPT09IENoaWxkLnByb3RvdHlwZVxuLy8gICAgICAgICAgICAgICAgLE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykpXG4vLyAgICAgICAgICAgICAgICAgPT09IFBhcmVudC5wcm90b3R5cGVcbi8vICAgICAgICAgICAgICAgICx0aGlzIGluc3RhbmNlb2YgQ2hpbGRcbi8vICAgICAgICAgICAgICAgICx0aGlzIGluc3RhbmNlb2YgUGFyZW50XSlcbi8vfVxuLy9mdW5jdGlvbiBQYXJlbnQgKCkge31cbi8vaW5oZXJpdHMoQ2hpbGQsIFBhcmVudClcbi8vbmV3IENoaWxkXG4iLCJ2YXIgcHJvZGFzaCA9IHtcbiAgZnVuY3Rpb25zOiAgIHJlcXVpcmUoXCIuL3NyYy9mdW5jdGlvbnNcIiksXG4gIHRyYW5zZHVjZXJzOiByZXF1aXJlKFwiLi9zcmMvdHJhbnNkdWNlcnNcIiksXG4gIGFycmF5OiAgICAgICByZXF1aXJlKFwiLi9zcmMvYXJyYXlcIiksXG4gIG9iamVjdDogICAgICByZXF1aXJlKFwiLi9zcmMvb2JqZWN0XCIpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcHJvZGFzaFxuIiwidmFyIGZucyAgICAgICAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgY3VycnkgICAgICAgPSBmbnMuY3VycnlcbnZhciBkZW1ldGhvZGl6ZSA9IGZucy5kZW1ldGhvZGl6ZVxudmFyIGFycmF5ICAgICAgID0ge31cblxudmFyIGZpbmQgPSBjdXJyeShmdW5jdGlvbiAocHJlZEZuLCBhcikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKHByZWRGbihhcltpXSkpIHJldHVybiBhcltpXSBcbiAgfVxuICByZXR1cm4gbnVsbFxufSlcblxudmFyIGZvckVhY2ggPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgYXIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhci5sZW5ndGg7ICsraSkge1xuICAgIGFyW2ldID0gdHJhbnNGbihhcltpXSkgXG4gIH1cbn0pXG5cbnZhciByZXZlcnNlID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgdmFyIGJhY2t3YXJkcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBiYWNrd2FyZHNbaV0gPSBsaXN0W2xlbi0xLWldXG4gIH1cbiAgcmV0dXJuIGJhY2t3YXJkc1xufVxuXG52YXIgY29uY2F0ID0gZGVtZXRob2RpemUoQXJyYXkucHJvdG90eXBlLCBcImNvbmNhdFwiKVxuXG52YXIgZmxhdHRlbiA9IGZ1bmN0aW9uIChhcnJheU9mQXJyYXlzKSB7XG4gIHZhciBmbGF0dGVuZWQgPSBbXVxuICB2YXIgc3ViYXJyYXlcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5T2ZBcnJheXMubGVuZ3RoOyArK2kpIHtcbiAgICBzdWJhcnJheSA9IGFycmF5T2ZBcnJheXNbaV1cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHN1YmFycmF5Lmxlbmd0aDsgKytqKSB7XG4gICAgICBmbGF0dGVuZWQucHVzaChzdWJhcnJheVtqXSkgXG4gICAgfVxuICB9XG4gIHJldHVybiBmbGF0dGVuZWRcbn1cblxudmFyIHB1c2ggPSBmdW5jdGlvbiAoYXJyYXksIGVsKSB7XG4gIGFycmF5LnB1c2goZWwpXG4gIHJldHVybiBhcnJheVxufVxuXG52YXIgdW5zaGlmdCA9IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgYXJyYXkudW5zaGlmdChlbClcbiAgcmV0dXJuIGFycmF5XG59XG5cbnZhciBzbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kLCBhcnJheSkge1xuICByZXR1cm4gYXJyYXkuc2xpY2Uoc3RhcnQsIGVuZClcbn1cblxudmFyIHJlbW92ZSA9IGZ1bmN0aW9uIChmbiwgYXJyYXkpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7ICsraSkge1xuICAgIGlmIChmbihhcnJheVtpXSkpIHtcbiAgICAgIGFycmF5LnNwbGljZShpLCAxKVxuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXlcbn1cblxuYXJyYXkuZmluZCAgICA9IGZpbmRcbmFycmF5LmZvckVhY2ggPSBmb3JFYWNoXG5hcnJheS5yZXZlcnNlID0gcmV2ZXJzZVxuYXJyYXkuY29uY2F0ICA9IGNvbmNhdFxuYXJyYXkuZmxhdHRlbiA9IGZsYXR0ZW5cbmFycmF5LnNsaWNlICAgPSBzbGljZVxuYXJyYXkucHVzaCAgICA9IHB1c2hcbmFycmF5LnVuc2hpZnQgPSB1bnNoaWZ0XG5hcnJheS5yZW1vdmUgID0gcmVtb3ZlXG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlcbiIsInZhciBmbnMgPSB7fVxuXG52YXIgZGVtZXRob2RpemUgPSBmdW5jdGlvbiAob2JqLCBmbk5hbWUpIHtcbiAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsLmJpbmQob2JqW2ZuTmFtZV0pIFxufVxuXG52YXIgaW5zdGFuY2VPZiA9IGZ1bmN0aW9uIChjb25zdHJ1Y3RvciwgY29sKSB7IFxuICByZXR1cm4gY29sIGluc3RhbmNlb2YgY29uc3RydWN0b3Jcbn1cblxudmFyIGFwcGx5ID0gZnVuY3Rpb24gKGZuLCBhcmdzTGlzdCkgeyBcbiAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3NMaXN0KSBcbn1cblxudmFyIGNhbGwgPSBmdW5jdGlvbiAoZm4pIHsgXG4gIHZhciBhcmdzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAxOyArK2kpIHtcbiAgICBhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXSBcbiAgfVxuICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncykgXG59XG5cbnZhciBjb21wb3NlID0gZnVuY3Rpb24gKGZucykge1xuICByZXR1cm4gZnVuY3Rpb24gY29tcG9zZWQgKHZhbCkge1xuICAgIGZvciAodmFyIGkgPSBmbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHZhbCA9IGZuc1tpXSh2YWwpXG4gICAgfVxuICAgIHJldHVybiB2YWxcbiAgfVxufVxuXG52YXIgZmxpcCA9IGZ1bmN0aW9uIChmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBiYWNrd2FyZHMgPSBbXVxuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgYmFja3dhcmRzW2ldID0gYXJndW1lbnRzW2xlbi0xLWldXG4gICAgfVxuICAgIHJldHVybiBhcHBseShmbiwgYmFja3dhcmRzKVxuICB9XG59XG5cbnZhciBwYXJ0aWFsID0gZnVuY3Rpb24gKGZuKSB7XG4gIHZhciBhcmdzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAxOyArK2kpIHtcbiAgICBhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXSBcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaiA9IDAsIHN0YXJ0aW5nSW5kZXggPSBhcmdzLmxlbmd0aDsgaiA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraikge1xuICAgICAgYXJnc1tqICsgc3RhcnRpbmdJbmRleF0gPSBhcmd1bWVudHNbal0gXG4gICAgfVxuXG4gICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpXG4gIH1cbn1cblxuLy91dGlsaXR5IGZ1bmN0aW9uIHVzZWQgaW4gY3VycnkgZGVmXG52YXIgaW5uZXJDdXJyeSA9IGZ1bmN0aW9uIChmbiwgYXJncykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBzdGFydGluZ0luZGV4ID0gYXJncy5sZW5ndGg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGFyZ3NbaSArIHN0YXJ0aW5nSW5kZXhdID0gYXJndW1lbnRzW2ldIFxuICAgIH1cblxuICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgfTtcbn07XG5cbi8vYXJpdHkgYXJndW1lbnQgaXMgdXNlZCBtb3N0IG9mdGVuIGludGVybmFsbHlcbnZhciBjdXJyeSA9IGZ1bmN0aW9uIChmbiwgYXJpdHkpIHtcbiAgdmFyIGZuQXJpdHkgPSBhcml0eSB8fCBmbi5sZW5ndGhcblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtaXNzaW5nQXJnc0NvdW50ID0gZm5Bcml0eSAtIGFyZ3VtZW50cy5sZW5ndGhcbiAgICB2YXIgbm90RW5vdWdoQXJncyAgICA9IG1pc3NpbmdBcmdzQ291bnQgPiAwXG4gICAgdmFyIGFyZ3MgICAgICAgICAgICAgPSBbXVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV0gXG4gICAgfVxuXG4gICAgaWYgKG5vdEVub3VnaEFyZ3MpIHJldHVybiBjdXJyeShpbm5lckN1cnJ5KGZuLCBhcmdzKSwgbWlzc2luZ0FyZ3NDb3VudClcbiAgICBlbHNlICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpXG4gIH1cbn1cblxuZm5zLmRlbWV0aG9kaXplID0gZGVtZXRob2RpemVcbmZucy5pbnN0YW5jZU9mICA9IGluc3RhbmNlT2ZcbmZucy5mbGlwICAgICAgICA9IGZsaXBcbmZucy5jb21wb3NlICAgICA9IGNvbXBvc2VcbmZucy5wYXJ0aWFsICAgICA9IHBhcnRpYWxcbmZucy5jdXJyeSAgICAgICA9IGN1cnJ5XG5mbnMuY2FsbCAgICAgICAgPSBjYWxsXG5mbnMuYXBwbHkgICAgICAgPSBhcHBseVxubW9kdWxlLmV4cG9ydHMgID0gZm5zXG4iLCJ2YXIgZm5zICAgICAgICAgPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcbnZhciBjdXJyeSAgICAgICA9IGZucy5jdXJyeVxudmFyIG9iamVjdCAgICAgID0ge31cblxudmFyIGV4dGVuZCA9IGN1cnJ5KGZ1bmN0aW9uIChob3N0LCBvYmopIHtcbiAgdmFyIGtzID0gT2JqZWN0LmtleXMob2JqKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga3MubGVuZ3RoOyArK2kpIHtcbiAgICBob3N0W2tzW2ldXSA9IG9ialtrc1tpXV1cbiAgfVxuICByZXR1cm4gaG9zdFxufSlcblxudmFyIGhhc0tleSA9IGN1cnJ5KGZ1bmN0aW9uIChrZXksIGUpIHtcbiAgcmV0dXJuIGVba2V5XSAhPT0gdW5kZWZpbmVkXG59KVxuXG52YXIgaGFzS2V5cyA9IGN1cnJ5KGZ1bmN0aW9uIChrZXlzLCBlKSB7XG4gIHZhciByZXMgPSB0cnVlXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgcmVzID0gcmVzICYmIGVba2V5c1tpXV0gIT09IHVuZGVmaW5lZFxuICB9XG4gIHJldHVybiByZXNcbn0pXG5cbm9iamVjdC5oYXNLZXkgID0gaGFzS2V5XG5vYmplY3QuaGFzS2V5cyA9IGhhc0tleXNcbm9iamVjdC5leHRlbmQgID0gZXh0ZW5kXG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0XG4iLCJ2YXIgZm5zICAgICAgICA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxudmFyIGN1cnJ5ICAgICAgPSBmbnMuY3VycnlcbnZhciBjb21wb3NlICAgID0gZm5zLmNvbXBvc2VcbnZhciBpbnN0YW5jZU9mID0gZm5zLmluc3RhbmNlT2ZcbnZhciB0cmFucyAgICAgID0ge31cblxudmFyIHJlZElkZW50aXR5ID0gZnVuY3Rpb24gKGFjYywgeCkgeyByZXR1cm4geCB9XG5cbnZhciByZWR1Y2VBcnJheSA9IGZ1bmN0aW9uIChmbiwgYWNjdW0sIGFycikge1xuICB2YXIgaW5kZXggPSAtMVxuICB2YXIgbGVuICAgPSBhcnIubGVuZ3RoXG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW4pIHtcbiAgICBhY2N1bSA9IGZuKGFjY3VtLCBhcnJbaW5kZXhdKVxuICB9XG4gIHJldHVybiBhY2N1bVxufVxuXG52YXIgcmVkdWNlT2JqZWN0ID0gZnVuY3Rpb24gKGZuLCBhY2N1bSwgb2JqKSB7XG4gIHZhciBpbmRleCA9IC0xXG4gIHZhciBrcyAgICA9IE9iamVjdC5rZXlzKG9iailcbiAgdmFyIGxlbiAgID0ga3MubGVuZ3RoXG4gIHZhciBrZXlcbiAgdmFyIGt2XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW4pIHtcbiAgICBrZXkgICAgID0ga3NbaW5kZXhdXG4gICAga3YgICAgICA9IHt9XG4gICAga3Zba2V5XSA9IG9ialtrZXldXG4gICAgYWNjdW0gICA9IGZuKGFjY3VtLCBrdilcbiAgfVxuICByZXR1cm4gYWNjdW1cbn1cblxudmFyIGNvbnNBcnJheSA9IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgYXJyYXkucHVzaChlbClcbiAgcmV0dXJuIGFycmF5XG59XG5cbnZhciBjb25zT2JqZWN0ID0gZnVuY3Rpb24gKGhvc3QsIG9iaikge1xuICB2YXIga3MgPSBPYmplY3Qua2V5cyhvYmopXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrcy5sZW5ndGg7ICsraSkge1xuICAgIGhvc3Rba3NbaV1dID0gb2JqW2tzW2ldXVxuICB9XG4gIHJldHVybiBob3N0XG59XG5cbnZhciByZWR1Y2UgPSBjdXJyeShmdW5jdGlvbiAoZm4sIGFjY3VtLCBjb2wpIHtcbiAgaWYgICAgICAoaW5zdGFuY2VPZihBcnJheSwgY29sKSkgICAgICAgIHJldHVybiByZWR1Y2VBcnJheShmbiwgYWNjdW0sIGNvbClcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihGbG9hdDMyQXJyYXksIGNvbCkpIHJldHVybiByZWR1Y2VBcnJheShmbiwgYWNjdW0sIGNvbClcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihVaW50MzJBcnJheSwgY29sKSkgIHJldHVybiByZWR1Y2VBcnJheShmbiwgYWNjdW0sIGNvbClcbiAgZWxzZSBpZiAoY29sLl9fcmVkdWNlICE9PSB1bmRlZmluZWQpICAgIHJldHVybiBjb2wuX19yZWR1Y2UoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoT2JqZWN0LCBjb2wpKSAgICAgICByZXR1cm4gcmVkdWNlT2JqZWN0KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBjb2xsZWN0aW9uIHR5cGVcIilcbn0pXG5cbnZhciBjb25zID0gY3VycnkoZnVuY3Rpb24gKGNvbCwgZWwpIHtcbiAgaWYgICAgICAoaW5zdGFuY2VPZihBcnJheSwgY29sKSkgICByZXR1cm4gY29uc0FycmF5KGNvbCwgZWwpXG4gIGVsc2UgaWYgKGNvbC5fX2NvbnMgIT09IHVuZGVmaW5lZCkgcmV0dXJuIGNvbC5fX2NvbnMoY29sLCBlbClcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihPYmplY3QsIGNvbCkpICByZXR1cm4gY29uc09iamVjdChjb2wsIGVsKVxuICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gY29sbGVjdGlvbiB0eXBlXCIpXG59KVxuXG52YXIgZW1wdHkgPSBmdW5jdGlvbiAoY29sKSB7XG4gIGlmICAgICAgKGluc3RhbmNlT2YoQXJyYXksIGNvbCkpICAgICAgICByZXR1cm4gW11cbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihGbG9hdDMyQXJyYXksIGNvbCkpIHJldHVybiBuZXcgRmxvYXQzMkFycmF5XG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoVWludDMyQXJyYXksIGNvbCkpICByZXR1cm4gbmV3IFVpbnQzMkFycmF5XG4gIGVsc2UgaWYgKGNvbC5fX2VtcHR5ICE9PSB1bmRlZmluZWQpICAgICByZXR1cm4gY29sLl9fZW1wdHkoKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKE9iamVjdCwgY29sKSkgICAgICAgcmV0dXJuIHt9XG4gIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIGNvbGxlY3Rpb24gdHlwZVwiKVxufVxuXG52YXIgbWFwcGluZyA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBzdGVwRm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICByZXR1cm4gc3RlcEZuKGFjYywgdHJhbnNGbih4KSlcbiAgfVxufSlcblxudmFyIHBsdWNraW5nID0gY3VycnkoZnVuY3Rpb24gKHByb3BOYW1lLCBzdGVwRm4pIHtcbiAgcmV0dXJuIG1hcHBpbmcoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHhbcHJvcE5hbWVdIH0sIHN0ZXBGbilcbn0pXG5cbnZhciBmaWx0ZXJpbmcgPSBjdXJyeShmdW5jdGlvbiAocHJlZEZuLCBzdGVwRm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICByZXR1cm4gcHJlZEZuKHgpID8gc3RlcEZuKGFjYywgeCkgOiBhY2MgXG4gIH1cbn0pXG5cbnZhciBjaGVja2luZyA9IGN1cnJ5KGZ1bmN0aW9uIChwcm9wLCB2YWwsIHN0ZXBGbikge1xuICByZXR1cm4gZmlsdGVyaW5nKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4W3Byb3BdID09PSB2YWwgfSwgc3RlcEZuKVxufSlcblxuLy9USElTIFdJTEwgTVVUQVRFIFRIRSBTVFJVQ1RVUkUgUFJPVklERUQgVE8gSVQgRElSRUNUTFlcbnZhciBtdXRhdGluZyA9IGN1cnJ5KGZ1bmN0aW9uIChtdXRGbiwgc3RlcEZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgbXV0Rm4oeClcbiAgICByZXR1cm4gc3RlcEZuKGFjYywgeClcbiAgfVxufSlcblxudmFyIGNhdCA9IGZ1bmN0aW9uIChmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgIHJldHVybiByZWR1Y2UoZm4sIGFjYywgeCkgXG4gIH1cbn1cblxudmFyIG1hcCA9IGN1cnJ5KGZ1bmN0aW9uIChmbiwgY29sKSB7XG4gIHJldHVybiByZWR1Y2UobWFwcGluZyhmbiwgY29ucyksIGVtcHR5KGNvbCksIGNvbClcbn0pXG5cbnZhciBtYXBjYXR0aW5nID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIHN0ZXBGbikge1xuICByZXR1cm4gY29tcG9zZShbY2F0LCBtYXBwaW5nKHRyYW5zRm4pXSkoc3RlcEZuKVxufSlcblxudmFyIGZpbHRlciA9IGN1cnJ5KGZ1bmN0aW9uIChwcmVkRm4sIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKGZpbHRlcmluZyhwcmVkRm4sIGNvbnMpLCBlbXB0eShjb2wpLCBjb2wpXG59KVxuXG52YXIgbXV0YXRlID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKHRyYW5zRm4ocmVkSWRlbnRpdHkpLCB1bmRlZmluZWQsIGNvbClcbn0pXG5cbnZhciB0cmFuc2R1Y2UgPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgc3RlcEZuLCBpbml0LCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZSh0cmFuc0ZuKHN0ZXBGbiksIGluaXQsIGNvbClcbn0pXG5cbnZhciBzZXF1ZW5jZSA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZSh0cmFuc0ZuKGNvbnMpLCBlbXB0eShjb2wpLCBjb2wpXG59KVxuXG52YXIgaW50byA9IGN1cnJ5KGZ1bmN0aW9uICh0bywgdHJhbnNGbiwgZnJvbSkge1xuICByZXR1cm4gdHJhbnNkdWNlKHRyYW5zRm4sIGNvbnMsIHRvLCBmcm9tKVxufSlcblxudHJhbnMucmVkdWNlICAgICA9IHJlZHVjZVxudHJhbnMuY29ucyAgICAgICA9IGNvbnNcbnRyYW5zLmVtcHR5ICAgICAgPSBlbXB0eVxudHJhbnMubWFwcGluZyAgICA9IG1hcHBpbmdcbnRyYW5zLnBsdWNraW5nICAgPSBwbHVja2luZ1xudHJhbnMuY2F0ICAgICAgICA9IGNhdFxudHJhbnMuZmlsdGVyaW5nICA9IGZpbHRlcmluZ1xudHJhbnMuY2hlY2tpbmcgICA9IGNoZWNraW5nXG50cmFucy5tYXAgICAgICAgID0gbWFwXG50cmFucy5tYXBjYXR0aW5nID0gbWFwY2F0dGluZ1xudHJhbnMubXV0YXRpbmcgICA9IG11dGF0aW5nXG50cmFucy5tdXRhdGUgICAgID0gbXV0YXRlXG50cmFucy5maWx0ZXIgICAgID0gZmlsdGVyXG50cmFucy50cmFuc2R1Y2UgID0gdHJhbnNkdWNlXG50cmFucy5zZXF1ZW5jZSAgID0gc2VxdWVuY2VcbnRyYW5zLmludG8gICAgICAgPSBpbnRvXG5tb2R1bGUuZXhwb3J0cyAgID0gdHJhbnNcbiIsInZhciBwcm9kYXNoICAgICAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciBhc3luYyAgICAgICAgID0gcmVxdWlyZShcImFzeW5jXCIpXG52YXIgZnBzICAgICAgICAgICA9IHJlcXVpcmUoXCJmcHNcIilcbnZhciBtYXQ0ICAgICAgICAgID0gcmVxdWlyZShcImdsLW1hdDRcIilcbnZhciBncmFwaCAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvZ3JhcGhcIilcbnZhciBsb2FkZXJzICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbG9hZGVyc1wiKVxudmFyIHV0aWxzICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9nbC11dGlsc1wiKVxudmFyIHJhbmRvbSAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9yYW5kb21cIilcbnZhciBwaHlzaWNzICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvcGh5c2ljc1wiKVxudmFyIGxpZmV0aW1lICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9saWZldGltZVwiKVxudmFyIGVtaXR0ZXJzICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9lbWl0dGVyc1wiKVxudmFyIGNsb2NrICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9jbG9ja1wiKVxudmFyIGNhbWVyYSAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9jYW1lcmFcIilcbnZhciBHcmFwaCAgICAgICAgID0gZ3JhcGguR3JhcGhcbnZhciBhdHRhY2hCeUlkICAgID0gZ3JhcGguYXR0YWNoQnlJZFxudmFyIHBhcnRpYWwgICAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5wYXJ0aWFsXG52YXIgUGFydGljbGUgICAgICA9IGVtaXR0ZXJzLlBhcnRpY2xlXG52YXIgRW1pdHRlciAgICAgICA9IGVtaXR0ZXJzLkVtaXR0ZXJcbnZhciB1cGRhdGVFbWl0dGVyID0gZW1pdHRlcnMudXBkYXRlRW1pdHRlclxudmFyIGxvYWRTaGFkZXIgICAgPSBsb2FkZXJzLmxvYWRTaGFkZXJcbnZhciB1cGRhdGVCdWZmZXIgID0gdXRpbHMudXBkYXRlQnVmZmVyXG52YXIgY2xlYXJDb250ZXh0ICA9IHV0aWxzLmNsZWFyQ29udGV4dFxudmFyIExvYWRlZFByb2dyYW0gPSB1dGlscy5Mb2FkZWRQcm9ncmFtXG52YXIgcmFuZEJvdW5kICAgICA9IHJhbmRvbS5yYW5kQm91bmRcbnZhciB1cGRhdGVQaHlzaWNzID0gcGh5c2ljcy51cGRhdGVQaHlzaWNzXG52YXIga2lsbFRoZU9sZCAgICA9IGxpZmV0aW1lLmtpbGxUaGVPbGRcbnZhciBDbG9jayAgICAgICAgID0gY2xvY2suQ2xvY2tcbnZhciB1cGRhdGVDbG9jayAgID0gY2xvY2sudXBkYXRlQ2xvY2tcbnZhciBDYW1lcmEgICAgICAgID0gY2FtZXJhLkNhbWVyYVxudmFyIHVwZGF0ZUNhbWVyYSAgPSBjYW1lcmEudXBkYXRlQ2FtZXJhXG52YXIgY2FudmFzICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGxheWdyb3VuZFwiKVxudmFyIHN0YXRzICAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0YXRzXCIpXG52YXIgZ2wgICAgICAgICAgICA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIilcbnZhciBzaGFkZXJzICAgICAgID0ge1xuICB2ZXJ0ZXg6ICAgXCIvc2hhZGVycy8wMXYuZ2xzbFwiLFxuICBmcmFnbWVudDogXCIvc2hhZGVycy8wMWYuZ2xzbFwiXG59XG5cbi8vKFdvcmxkIC0+IE5vZGUpIC0+IFN0cmluZyAtPiBXb3JsZCAtPiBWb2lkXG52YXIgZm9yRWFjaE5vZGUgPSBmdW5jdGlvbiAoZm4sIG5vZGVJZCwgd29ybGQpIHtcbiAgdmFyIG5vZGUgPSB3b3JsZC5ncmFwaC5ub2Rlc1tub2RlSWRdXG5cbiAgZm4od29ybGQsIG5vZGUpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZElkcy5sZW5ndGg7ICsraSkge1xuICAgIGZvckVhY2hOb2RlKGZuLCBub2RlLmNoaWxkSWRzW2ldLCB3b3JsZClcbiAgfVxufVxuXG4vLyhXb3JsZCAtPiBOb2RlKSAtPiBXb3JsZCAtPiBWb2lkXG52YXIgdXBkYXRlRW50aXRpZXMgPSBmdW5jdGlvbiAoZm4sIHdvcmxkKSB7XG4gIGZvckVhY2hOb2RlKGZuLCB3b3JsZC5ncmFwaC5yb290Tm9kZUlkLCB3b3JsZClcbn1cblxuZnVuY3Rpb24gbWFrZVVwZGF0ZSAod29ybGQpIHtcbiAgdXBkYXRlQ2xvY2sod29ybGQuY2xvY2ssIHBlcmZvcm1hbmNlLm5vdygpKVxuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICgpIHtcbiAgICB1cGRhdGVDbG9jayh3b3JsZC5jbG9jaywgcGVyZm9ybWFuY2Uubm93KCkpXG4gICAgdXBkYXRlQ2FtZXJhKHdvcmxkLCB3b3JsZC5jYW1lcmEpXG4gICAgdXBkYXRlRW50aXRpZXMoa2lsbFRoZU9sZCwgd29ybGQpXG4gICAgdXBkYXRlRW50aXRpZXModXBkYXRlUGh5c2ljcywgd29ybGQpXG4gICAgdXBkYXRlRW50aXRpZXModXBkYXRlRW1pdHRlciwgd29ybGQpXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZUFuaW1hdGUgKGdsLCB3b3JsZCkge1xuICB2YXIgcmF3UG9zaXRpb25zID0gW11cbiAgdmFyIGJ1aWxkQnVmZmVycyA9IGZ1bmN0aW9uICh3b3JsZCwgbm9kZSkge1xuICAgIGlmIChub2RlLmxpdmluZyAmJiBub2RlLnJlbmRlcmFibGUpIHtcbiAgICAgIHJhd1Bvc2l0aW9ucy5wdXNoKG5vZGUucG9zaXRpb25bMF0pIFxuICAgICAgcmF3UG9zaXRpb25zLnB1c2gobm9kZS5wb3NpdGlvblsxXSkgXG4gICAgICByYXdQb3NpdGlvbnMucHVzaChub2RlLnBvc2l0aW9uWzJdKSBcbiAgICB9XG4gIH1cbiAgdmFyIHBvc2l0aW9ucyBcbiAgLy90ZW1wb3JhcnkuLi4gc2hvdWxkIHJlZmFjdG9yXG4gIHZhciBscCA9IHdvcmxkLnByb2dyYW1zLnBhcnRpY2xlXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xuICAgIHJhd1Bvc2l0aW9ucyA9IFtdXG4gICAgdXBkYXRlRW50aXRpZXMoYnVpbGRCdWZmZXJzLCB3b3JsZClcbiAgICBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KHJhd1Bvc2l0aW9ucylcblxuICAgIGNsZWFyQ29udGV4dChnbClcbiAgICBnbC51c2VQcm9ncmFtKHdvcmxkLnByb2dyYW1zLnBhcnRpY2xlLnByb2dyYW0pXG4gICAgZ2wudW5pZm9ybTRmKGxwLnVuaWZvcm1zLnVDb2xvciwgMS4wLCAwLjAsIDAuMCwgMS4wKVxuICAgIGdsLnVuaWZvcm0yZihscC51bmlmb3Jtcy51U2NyZWVuU2l6ZSwgY2FudmFzLmNsaWVudFdpZHRoLCBjYW52YXMuY2xpZW50SGVpZ2h0KVxuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYobHAudW5pZm9ybXMudVZpZXcsIGZhbHNlLCB3b3JsZC5jYW1lcmEudmlldylcbiAgICBnbC51bmlmb3JtTWF0cml4NGZ2KGxwLnVuaWZvcm1zLnVQcm9qZWN0aW9uLCBmYWxzZSwgd29ybGQuY2FtZXJhLnByb2plY3Rpb24pXG4gICAgZ2wudW5pZm9ybTFmKGxwLnVuaWZvcm1zLnVTaXplLCAxLjApXG4gICAgdXBkYXRlQnVmZmVyKGdsLCAzLCBscC5hdHRyaWJ1dGVzLmFQb3NpdGlvbiwgbHAuYnVmZmVycy5hUG9zaXRpb24sIHBvc2l0aW9ucylcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlBPSU5UUywgMCwgcG9zaXRpb25zLmxlbmd0aCAvIDMpXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpIFxuICB9XG59XG5cbmFzeW5jLnBhcmFsbGVsKHtcbiAgdmVydGV4OiAgIHBhcnRpYWwobG9hZFNoYWRlciwgXCIvc2hhZGVycy8wMXYuZ2xzbFwiKSxcbiAgZnJhZ21lbnQ6IHBhcnRpYWwobG9hZFNoYWRlciwgXCIvc2hhZGVycy8wMWYuZ2xzbFwiKVxufSwgZnVuY3Rpb24gKGVyciwgc2hhZGVycykge1xuICB2YXIgZm92ICAgICAgICAgICAgID0gLjUgKiBNYXRoLlBJXG4gIHZhciBhc3BlY3QgICAgICAgICAgPSBjYW52YXMuY2xpZW50V2lkdGggLyBjYW52YXMuY2xpZW50SGVpZ2h0XG4gIHZhciBwYXJ0aWNsZVByb2dyYW0gPSBMb2FkZWRQcm9ncmFtKGdsLCBzaGFkZXJzLnZlcnRleCwgc2hhZGVycy5mcmFnbWVudClcbiAgdmFyIHdvcmxkICAgICAgICAgICA9IHtcbiAgICBjbG9jazogICAgQ2xvY2socGVyZm9ybWFuY2Uubm93KCkpLFxuICAgIGNhbWVyYTogICBDYW1lcmEoMCwgMCwgMywgZm92LCBhc3BlY3QsIDEsIDEwKSxcbiAgICBncmFwaDogICAgR3JhcGgoKSxcbiAgICBwcm9ncmFtczoge1xuICAgICAgcGFydGljbGU6IHBhcnRpY2xlUHJvZ3JhbVxuICAgIH1cbiAgfVxuXG4gIHdpbmRvdy53b3JsZCA9IHdvcmxkXG4gIHdpbmRvdy5nbCA9IGdsXG5cbiAgdmFyIHNwYXduQXQgPSBmdW5jdGlvbiAoc3BlZWQsIHgsIHksIGR4LCBkeSkge1xuICAgIHZhciBlID0gRW1pdHRlcigxMDAwLCAxMCwgc3BlZWQsIC4xLCB4LCB5LCAwLCBkeCwgZHksIDApICBcblxuICAgIGF0dGFjaEJ5SWQod29ybGQuZ3JhcGgsIHdvcmxkLmdyYXBoLnJvb3ROb2RlSWQsIGUpXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCA1MDsgKytqKSB7XG4gICAgICBhdHRhY2hCeUlkKHdvcmxkLmdyYXBoLCBlLmlkLCBQYXJ0aWNsZSgxMDAwLCAwLCAwLCAwKSlcbiAgICB9XG4gIH1cblxuICB2YXIgYnVpbGRFbWl0dGVyID0gZnVuY3Rpb24gKHRyYW5zRm4pIHtcbiAgICB2YXIgY291bnQgID0gOFxuICAgIHZhciBzcHJlYWQgPSAyXG4gICAgdmFyIGRpZmYgICA9IHNwcmVhZCAvIGNvdW50XG4gICAgdmFyIGVcblxuICAgIGZvciAodmFyIGkgPSAtMSAqIGNvdW50OyBpIDwgMSAqIGNvdW50OyBpKz0uMSAqIGNvdW50KSB7XG4gICAgICBzcGF3bkF0KC4wMDQsIHRyYW5zRm4oaSkgKiBkaWZmLCBpIC8gY291bnQsIDEsIDApXG4gICAgfVxuICB9XG4gIGJ1aWxkRW1pdHRlcihNYXRoLnNpbilcbiAgc2V0SW50ZXJ2YWwobWFrZVVwZGF0ZSh3b3JsZCksIDI1KVxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobWFrZUFuaW1hdGUoZ2wsIHdvcmxkKSlcbn0pXG4iLCJ2YXIgbWF0NCAgICAgPSByZXF1aXJlKFwiZ2wtbWF0NFwiKVxudmFyIHZlYzMgICAgID0gcmVxdWlyZShcIi4vdmVjM1wiKVxudmFyIFZlYzMgICAgID0gdmVjMy5WZWMzXG52YXIgcm90U3BlZWQgPSBNYXRoLlBJIC8gMTgwMFxudmFyIGNhbWVyYSAgID0ge31cblxuXG52YXIgQ2FtZXJhID0gZnVuY3Rpb24gKHgsIHksIHosIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENhbWVyYSkpIHJldHVybiBuZXcgQ2FtZXJhKHgsIHksIHosIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpXG5cbiAgdGhpcy5wb3NpdGlvbiAgID0gVmVjMyh4LCB5ICx6KVxuICB0aGlzLmZvdiAgICAgICAgPSBmb3ZcbiAgdGhpcy5uZWFyICAgICAgID0gbmVhclxuICB0aGlzLmZhciAgICAgICAgPSBmYXJcbiAgdGhpcy5hc3BlY3QgICAgID0gYXNwZWN0XG4gIHRoaXMucHJvamVjdGlvbiA9IG1hdDQucGVyc3BlY3RpdmUobWF0NC5jcmVhdGUoKSwgZm92LCBhc3BlY3QsIG5lYXIsIGZhcilcblxuICB0aGlzLmV5ZSAgICAgICAgPSBWZWMzKHgsIHksIHopXG4gIHRoaXMubG9va0F0ICAgICA9IFZlYzMoMCwgMCwgMClcbiAgdGhpcy51cCAgICAgICAgID0gVmVjMygwLCAxLCAwKVxuICB0aGlzLnZpZXcgICAgICAgPSBtYXQ0Lmxvb2tBdChtYXQ0LmNyZWF0ZSgpLCB0aGlzLmV5ZSwgdGhpcy5sb29rQXQsIHRoaXMudXApXG59XG5cbnZhciB1cGRhdGVDYW1lcmEgPSBmdW5jdGlvbiAod29ybGQsIGNhbWVyYSkge1xuICB2YXIgZFQgICA9IHdvcmxkLmNsb2NrLmRUXG4gIHZhciB2aWV3ID0gd29ybGQuY2FtZXJhLnZpZXdcblxuICBtYXQ0LnJvdGF0ZVkodmlldywgdmlldywgcm90U3BlZWQgKiBkVClcbn1cblxuXG5jYW1lcmEuQ2FtZXJhICAgICAgID0gQ2FtZXJhXG5jYW1lcmEudXBkYXRlQ2FtZXJhID0gdXBkYXRlQ2FtZXJhXG5tb2R1bGUuZXhwb3J0cyA9IGNhbWVyYVxuIiwidmFyIGNsb2NrID0ge31cblxudmFyIENsb2NrID0gZnVuY3Rpb24gKG5vdykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2xvY2spKSByZXR1cm4gbmV3IENsb2NrKG5vdylcbiAgdGhpcy5vbGRUaW1lID0gbm93XG4gIHRoaXMubmV3VGltZSA9IG5vd1xuICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcbn1cblxudmFyIHVwZGF0ZUNsb2NrID0gZnVuY3Rpb24gKGNsb2NrLCBuZXdUaW1lKSB7XG4gIGNsb2NrLm9sZFRpbWUgPSBjbG9jay5uZXdUaW1lXG4gIGNsb2NrLm5ld1RpbWUgPSBuZXdUaW1lXG4gIGNsb2NrLmRUICAgICAgPSBjbG9jay5uZXdUaW1lIC0gY2xvY2sub2xkVGltZVxufVxuXG5jbG9jay5DbG9jayAgICAgICA9IENsb2NrXG5jbG9jay51cGRhdGVDbG9jayA9IHVwZGF0ZUNsb2NrXG5cbm1vZHVsZS5leHBvcnRzID0gY2xvY2tcbiIsInZhciB1dWlkICAgICAgPSByZXF1aXJlKFwibm9kZS11dWlkXCIpXG52YXIgcHJvZGFzaCAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciByYW5kb20gICAgPSByZXF1aXJlKFwiLi9yYW5kb21cIilcbnZhciB2ZWMzICAgICAgPSByZXF1aXJlKFwiLi92ZWMzXCIpXG52YXIgVmVjMyAgICAgID0gdmVjMy5WZWMzXG52YXIgZmluZCAgICAgID0gcHJvZGFzaC5hcnJheS5maW5kXG52YXIgY3VycnkgICAgID0gcHJvZGFzaC5mdW5jdGlvbnMuY3VycnlcbnZhciByYW5kQm91bmQgPSByYW5kb20ucmFuZEJvdW5kXG52YXIgZW1pdHRlcnMgID0ge31cblxudmFyIFBhcnRpY2xlID0gZnVuY3Rpb24gKGxpZmVzcGFuLCBweCwgcHksIHB6KSB7XG4gIHJldHVybiB7XG4gICAgaWQ6ICAgICAgICAgICB1dWlkLnY0KCksXG4gICAgcG9zaXRpb246ICAgICBWZWMzKHB4LCBweSwgcHopLFxuICAgIHZlbG9jaXR5OiAgICAgVmVjMygwLCAwLCAwKSxcbiAgICBhY2NlbGVyYXRpb246IFZlYzMoMCwgLTAuMDAwMDAxNSwgMCksXG4gICAgLy9hY2NlbGVyYXRpb246IFZlYzMoMCwgMCwgMCksXG4gICAgcmVuZGVyYWJsZTogICB0cnVlLFxuICAgIHNpemU6ICAgICAgICAgNC4wLFxuICAgIHRpbWVUb0RpZTogICAgMCxcbiAgICBsaWZlc3BhbjogICAgIGxpZmVzcGFuLFxuICAgIGxpdmluZzogICAgICAgZmFsc2VcbiAgfVxufVxuXG52YXIgRW1pdHRlciA9IGZ1bmN0aW9uIChsaWZlc3BhbiwgcmF0ZSwgc3BlZWQsIHNwcmVhZCwgcHgsIHB5LCBweiwgZHgsIGR5LCBkeikge1xuICByZXR1cm4ge1xuICAgIGlkOiAgICAgICAgICAgdXVpZC52NCgpLFxuICAgIGVtaXR0ZXI6ICAgICAgdHJ1ZSxcbiAgICByYXRlOiAgICAgICAgIHJhdGUsIFxuICAgIHNwZWVkOiAgICAgICAgc3BlZWQsXG4gICAgc3ByZWFkOiAgICAgICBzcHJlYWQsXG4gICAgbmV4dEZpcmVUaW1lOiAwLFxuICAgIHBvc2l0aW9uOiAgICAgVmVjMyhweCwgcHksIHB6KSxcbiAgICB2ZWxvY2l0eTogICAgIFZlYzMoMCwgMCwgMCksXG4gICAgYWNjZWxlcmF0aW9uOiBWZWMzKDAsIDAsIDApLFxuICAgIGRpcmVjdGlvbjogICAgVmVjMyhkeCwgZHksIGR6KSxcbiAgICByZW5kZXJhYmxlOiAgIGZhbHNlLFxuICAgIGxpdmluZzogICAgICAgdHJ1ZVxuICB9XG59XG5cblxudmFyIHNjYWxlQW5kU3ByZWFkID0gZnVuY3Rpb24gKHNjYWxlLCBzcHJlYWQsIHZhbCkge1xuICByZXR1cm4gc2NhbGUgKiAodmFsICsgcmFuZEJvdW5kKC0xICogc3ByZWFkLCBzcHJlYWQpKVxufVxuXG52YXIgZmluZEZpcnN0RGVhZCA9IGZ1bmN0aW9uIChncmFwaCwgY2hpbGRJZHMpIHtcbiAgdmFyIGNoaWxkTm9kZVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRJZHMubGVuZ3RoOyArK2kpIHtcbiAgICBjaGlsZE5vZGUgPSBncmFwaC5ub2Rlc1tjaGlsZElkc1tpXV1cbiAgICBpZiAoIWNoaWxkTm9kZS5saXZpbmcpIHJldHVybiBjaGlsZE5vZGVcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbnZhciB1cGRhdGVFbWl0dGVyID0gZnVuY3Rpb24gKHdvcmxkLCBlKSB7XG4gIHZhciB0aW1lID0gd29ybGQuY2xvY2submV3VGltZVxuICB2YXIgcGFydGljbGUgXG5cbiAgaWYgKCFlLmVtaXR0ZXIpIHJldHVyblxuICBpZiAoIWUubGl2aW5nKSAgcmV0dXJuXG4gIGlmICh0aW1lID4gZS5uZXh0RmlyZVRpbWUpIHtcbiAgICBwYXJ0aWNsZSAgICAgICAgICAgICA9IGZpbmRGaXJzdERlYWQod29ybGQuZ3JhcGgsIGUuY2hpbGRJZHMpXG4gICAgcGFydGljbGUudGltZVRvRGllICAgPSB0aW1lICsgcGFydGljbGUubGlmZXNwYW5cbiAgICBwYXJ0aWNsZS5saXZpbmcgICAgICA9IHRydWVcbiAgICBwYXJ0aWNsZS5wb3NpdGlvblswXSA9IGUucG9zaXRpb25bMF1cbiAgICBwYXJ0aWNsZS5wb3NpdGlvblsxXSA9IGUucG9zaXRpb25bMV1cbiAgICBwYXJ0aWNsZS5wb3NpdGlvblsyXSA9IGUucG9zaXRpb25bMl1cbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVswXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblswXSlcbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVsxXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblsxXSlcbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVsyXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblsyXSlcbiAgICBlLm5leHRGaXJlVGltZSArPSBlLnJhdGVcbiAgfVxufVxuXG5lbWl0dGVycy5QYXJ0aWNsZSAgICAgID0gUGFydGljbGVcbmVtaXR0ZXJzLkVtaXR0ZXIgICAgICAgPSBFbWl0dGVyXG5lbWl0dGVycy51cGRhdGVFbWl0dGVyID0gdXBkYXRlRW1pdHRlclxubW9kdWxlLmV4cG9ydHMgICAgICAgICA9IGVtaXR0ZXJzXG4iLCJ2YXIgdXRpbHMgPSB7fVxuXG52YXIgY2xlYXJDb250ZXh0ID0gZnVuY3Rpb24gKGdsKSB7XG4gIGdsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMS4wKVxuICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxufVxuXG52YXIgdXBkYXRlQnVmZmVyID0gZnVuY3Rpb24gKGdsLCBjaHVua1NpemUsIGF0dHJpYnV0ZSwgYnVmZmVyLCBkYXRhKSB7XG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGF0dHJpYnV0ZSlcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihhdHRyaWJ1dGUsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxuICByZXR1cm4gYnVmZmVyXG59XG5cbi8vZ2l2ZW4gc3JjIGFuZCB0eXBlLCBjb21waWxlIGFuZCByZXR1cm4gc2hhZGVyXG5mdW5jdGlvbiBjb21waWxlIChnbCwgc2hhZGVyVHlwZSwgc3JjKSB7XG4gIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoc2hhZGVyVHlwZSlcblxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxuICByZXR1cm4gc2hhZGVyXG59XG5cbi8vbGluayB5b3VyIHByb2dyYW0gdy8gb3BlbmdsXG5mdW5jdGlvbiBsaW5rIChnbCwgdnMsIGZzKSB7XG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpXG5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKSBcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKSBcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcbiAgcmV0dXJuIHByb2dyYW1cbn1cblxuLypcbiAqIFdlIHdhbnQgdG8gY3JlYXRlIGEgd3JhcHBlciBmb3IgYSBsb2FkZWQgZ2wgcHJvZ3JhbVxuICogdGhhdCBpbmNsdWRlcyBwb2ludGVycyB0byBhbGwgdGhlIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzXG4gKiBkZWZpbmVkIGZvciB0aGlzIHByb2dyYW0uICBUaGlzIG1ha2VzIGl0IG1vcmUgY29udmVuaWVudFxuICogdG8gY2hhbmdlIHRoZXNlIHZhbHVlc1xuICovXG52YXIgTG9hZGVkUHJvZ3JhbSA9IGZ1bmN0aW9uIChnbCwgdlNyYywgZlNyYykge1xuICB2YXIgdnMgICAgICAgICAgICA9IGNvbXBpbGUoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIHZhciBmcyAgICAgICAgICAgID0gY29tcGlsZShnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICB2YXIgcHJvZ3JhbSAgICAgICA9IGxpbmsoZ2wsIHZzLCBmcylcbiAgdmFyIG51bUF0dHJpYnV0ZXMgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKVxuICB2YXIgbnVtVW5pZm9ybXMgICA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKVxuICB2YXIgbHAgPSB7XG4gICAgdmVydGV4OiB7XG4gICAgICBzcmM6ICAgIHZTcmMsXG4gICAgICBzaGFkZXI6IHZzIFxuICAgIH0sXG4gICAgZnJhZ21lbnQ6IHtcbiAgICAgIHNyYzogICAgZlNyYyxcbiAgICAgIHNoYWRlcjogZnMgXG4gICAgfSxcbiAgICBwcm9ncmFtOiAgICBwcm9ncmFtLFxuICAgIHVuaWZvcm1zOiAgIHt9LCBcbiAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICBidWZmZXJzOiAgICB7fVxuICB9XG4gIHZhciBhTmFtZVxuICB2YXIgdU5hbWVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bUF0dHJpYnV0ZXM7ICsraSkge1xuICAgIGFOYW1lICAgICAgICAgICAgICAgID0gZ2wuZ2V0QWN0aXZlQXR0cmliKHByb2dyYW0sIGkpLm5hbWVcbiAgICBscC5hdHRyaWJ1dGVzW2FOYW1lXSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIGFOYW1lKVxuICAgIGxwLmJ1ZmZlcnNbYU5hbWVdICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgfVxuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgbnVtVW5pZm9ybXM7ICsraikge1xuICAgIHVOYW1lICAgICAgICAgICAgICA9IGdsLmdldEFjdGl2ZVVuaWZvcm0ocHJvZ3JhbSwgaikubmFtZVxuICAgIGxwLnVuaWZvcm1zW3VOYW1lXSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCB1TmFtZSlcbiAgfVxuXG4gIHJldHVybiBscCBcbn1cblxudXRpbHMuY2xlYXJDb250ZXh0ICA9IGNsZWFyQ29udGV4dFxudXRpbHMudXBkYXRlQnVmZmVyICA9IHVwZGF0ZUJ1ZmZlclxudXRpbHMuTG9hZGVkUHJvZ3JhbSA9IExvYWRlZFByb2dyYW1cbm1vZHVsZS5leHBvcnRzICAgICAgPSB1dGlsc1xuIiwidmFyIHByb2Rhc2ggICA9IHJlcXVpcmUoXCJwcm9kYXNoXCIpXG52YXIgdXVpZCAgICAgID0gcmVxdWlyZShcIm5vZGUtdXVpZFwiKVxudmFyIHRyYW5zZHVjZSA9IHByb2Rhc2gudHJhbnNkdWNlcnMudHJhbnNkdWNlXG52YXIgZmlsdGVyaW5nID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5maWx0ZXJpbmdcbnZhciBjb25zICAgICAgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLmNvbnNcbnZhciBleHRlbmQgICAgPSBwcm9kYXNoLm9iamVjdC5leHRlbmRcbnZhciBjdXJyeSAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5jdXJyeVxudmFyIHJlbW92ZSAgICA9IHByb2Rhc2guYXJyYXkucmVtb3ZlXG52YXIgZ3JhcGggICAgID0ge31cblxudmFyIE5vZGUgPSBmdW5jdGlvbiAoaGFzaCkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTm9kZSkpIHJldHVybiBuZXcgTm9kZShoYXNoKSBcblxuICBleHRlbmQodGhpcywgaGFzaClcbiAgdGhpcy5pZCAgICAgICA9IHRoaXMuaWQgfHwgdXVpZC52NCgpXG4gIHRoaXMucGFyZW50SWQgPSB0aGlzLnBhcmVudElkIHx8IG51bGxcbiAgdGhpcy5jaGlsZElkcyA9IHRoaXMuY2hpbGRJZHMgfHwgW11cbn1cblxudmFyIEdyYXBoID0gZnVuY3Rpb24gKHJvb3ROb2RlKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBHcmFwaCkpIHJldHVybiBuZXcgR3JhcGhcbiAgdmFyIHJvb3ROb2RlID0gcm9vdE5vZGUgfHwgTm9kZSh7IGlkOiB1dWlkLnY0KCkgfSlcblxuICB0aGlzLm5vZGVzICAgICAgICAgICAgICA9IHt9XG4gIHRoaXMucm9vdE5vZGVJZCAgICAgICAgID0gcm9vdE5vZGUuaWRcbiAgdGhpcy5ub2Rlc1tyb290Tm9kZS5pZF0gPSByb290Tm9kZVxufVxuXG4vL3VzZWQgaW50ZXJuYWxseSBieSBncmFwaC5fX3JlZHVjZSB0byBzdXBwb3J0IGl0ZXJhdGlvblxudmFyIG5vZGVSZWR1Y2UgPSBmdW5jdGlvbiAocmVkRm4sIG5vZGVJZCwgYWNjdW0sIGdyYXBoKSB7XG4gIHZhciBub2RlID0gZ3JhcGgubm9kZXNbbm9kZUlkXVxuXG4gIGFjY3VtID0gcmVkRm4oYWNjdW0sIG5vZGUpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgYWNjdW0gPSBub2RlUmVkdWNlKHJlZEZuLCBub2RlLmNoaWxkSWRzW2ldLCBhY2N1bSwgZ3JhcGgpICAgXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59XG5cbi8vR3JhcGggLT4gU3RyaW5nIC0+IE5vZGUgLT4gVm9pZFxudmFyIGF0dGFjaEJ5SWQgPSBjdXJyeShmdW5jdGlvbiAoZ3JhcGgsIHBhcmVudElkLCBub2RlKSB7XG4gIGlmKCFncmFwaC5ub2Rlc1twYXJlbnRJZF0pIHRocm93IG5ldyBFcnJvcihwYXJlbnRJZCArIFwiIG5vdCBmb3VuZCBpbiBncmFwaFwiKVxuICB2YXIgbm9kZSA9IG5vZGUgaW5zdGFuY2VvZiBOb2RlID8gbm9kZSA6IE5vZGUobm9kZSlcblxuICBncmFwaC5ub2Rlc1tub2RlLmlkXSAgICAgICAgICA9IG5vZGVcbiAgZ3JhcGgubm9kZXNbbm9kZS5pZF0ucGFyZW50SWQgPSBwYXJlbnRJZFxuICBncmFwaC5ub2Rlc1twYXJlbnRJZF0uY2hpbGRJZHMucHVzaChub2RlLmlkKVxufSlcblxuR3JhcGgucHJvdG90eXBlLl9fcmVkdWNlID0gZnVuY3Rpb24gKHJlZEZuLCBhY2N1bSwgZ3JhcGgpIHtcbiAgcmV0dXJuIG5vZGVSZWR1Y2UocmVkRm4sIGdyYXBoLnJvb3ROb2RlSWQsIGFjY3VtLCBncmFwaClcbn1cblxuR3JhcGgucHJvdG90eXBlLl9fZW1wdHkgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgR3JhcGggfVxuXG5ncmFwaC5Ob2RlICAgICAgID0gTm9kZVxuZ3JhcGguR3JhcGggICAgICA9IEdyYXBoXG5ncmFwaC5hdHRhY2hCeUlkID0gYXR0YWNoQnlJZFxubW9kdWxlLmV4cG9ydHMgICA9IGdyYXBoXG4iLCJ2YXIgZm5zICAgICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIGN1cnJ5ICAgID0gZm5zLmZ1bmN0aW9ucy5jdXJyeVxudmFyIGxpZmV0aW1lID0ge31cblxubGlmZXRpbWUua2lsbFRoZU9sZCA9IGZ1bmN0aW9uICh3b3JsZCwgZSkge1xuICB2YXIgdGltZSA9IHdvcmxkLmNsb2NrLm5ld1RpbWVcblxuICBpZiAoIWUubGlmZXNwYW4pICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gIGlmIChlLmxpdmluZyAmJiB0aW1lID49IGUudGltZVRvRGllKSBlLmxpdmluZyA9IGZhbHNlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGlmZXRpbWVcbiIsInZhciBsb2FkZXJzICA9IHt9XG5cbmxvYWRlcnMubG9hZFNoYWRlciA9IGZ1bmN0aW9uIChwYXRoLCBjYikge1xuICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG5cbiAgeGhyLnJlc3BvbnNlVHlwZSA9IFwic3RyaW5nXCJcbiAgeGhyLm9ubG9hZCAgICAgICA9IGZ1bmN0aW9uICgpIHsgY2IobnVsbCwgeGhyLnJlc3BvbnNlKSB9XG4gIHhoci5vbmVycm9yICAgICAgPSBmdW5jdGlvbiAoKSB7IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpIH1cbiAgeGhyLm9wZW4oXCJHRVRcIiwgcGF0aCwgdHJ1ZSlcbiAgeGhyLnNlbmQobnVsbClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsb2FkZXJzXG4iLCJ2YXIgZm5zICAgICA9IHJlcXVpcmUoXCJwcm9kYXNoXCIpXG52YXIgY3VycnkgICA9IGZucy5mdW5jdGlvbnMuY3VycnlcbnZhciBwaHlzaWNzID0ge31cblxudmFyIGhhc1BoeXNpY3MgPSBmdW5jdGlvbiAobm9kZSkgeyBcbiAgcmV0dXJuICEhbm9kZS5wb3NpdGlvbiAmJiAhIW5vZGUudmVsb2NpdHkgJiYgISFub2RlLmFjY2VsZXJhdGlvbiBcbn1cbnBoeXNpY3MudXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbiAoZFQsIGUpIHtcbiAgZS5wb3NpdGlvblswXSA9IGUucG9zaXRpb25bMF0gKyBkVCAqIGUudmVsb2NpdHlbMF1cbiAgZS5wb3NpdGlvblsxXSA9IGUucG9zaXRpb25bMV0gKyBkVCAqIGUudmVsb2NpdHlbMV1cbiAgZS5wb3NpdGlvblsyXSA9IGUucG9zaXRpb25bMl0gKyBkVCAqIGUudmVsb2NpdHlbMl1cbiAgcmV0dXJuIGVcbn1cblxucGh5c2ljcy51cGRhdGVWZWxvY2l0eSA9IGZ1bmN0aW9uIChkVCwgZSkge1xuICBlLnZlbG9jaXR5WzBdID0gZS52ZWxvY2l0eVswXSArIGRUICogZS5hY2NlbGVyYXRpb25bMF1cbiAgZS52ZWxvY2l0eVsxXSA9IGUudmVsb2NpdHlbMV0gKyBkVCAqIGUuYWNjZWxlcmF0aW9uWzFdXG4gIGUudmVsb2NpdHlbMl0gPSBlLnZlbG9jaXR5WzJdICsgZFQgKiBlLmFjY2VsZXJhdGlvblsyXVxuICByZXR1cm4gZVxufVxuXG5waHlzaWNzLnVwZGF0ZVBoeXNpY3MgPSBmdW5jdGlvbiAod29ybGQsIGUpIHtcbiAgaWYgKCFoYXNQaHlzaWNzKGUpKSByZXR1cm5cbiAgaWYgKCFlLmxpdmluZykgICAgICByZXR1cm5cbiAgcGh5c2ljcy51cGRhdGVWZWxvY2l0eSh3b3JsZC5jbG9jay5kVCwgZSlcbiAgcGh5c2ljcy51cGRhdGVQb3NpdGlvbih3b3JsZC5jbG9jay5kVCwgZSlcbiAgcmV0dXJuIGVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwaHlzaWNzXG4iLCJ2YXIgcmFuZG9tID0ge31cblxucmFuZG9tLnJhbmRCb3VuZCA9IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFuZG9tXG4iLCJ2YXIgdmVjMyA9IHt9XG5cbnZlYzMuVmVjMyA9IGZ1bmN0aW9uICh4LCB5LCB6KSB7XG4gIHZhciBvdXQgPSBuZXcgRmxvYXQzMkFycmF5KDMpXG5cbiAgb3V0WzBdID0geFxuICBvdXRbMV0gPSB5XG4gIG91dFsyXSA9IHpcblxuICByZXR1cm4gb3V0XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdmVjM1xuIl19
