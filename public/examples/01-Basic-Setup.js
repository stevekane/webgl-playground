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
  var found
  var childNode

  for (var i = 0; i < childIds.length; ++i) {
    childNode = graph.nodes[childIds[i]]
    found = childNode.living ? found : childNode
  }
  return found
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvaW5kZXguanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9wcm9kYXNoLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvYXJyYXkuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9vYmplY3QuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy90cmFuc2R1Y2Vycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL2V4YW1wbGVzLzAxLUJhc2ljLVNldHVwLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9jYW1lcmEuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2Nsb2NrLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9lbWl0dGVycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvZ2wtdXRpbHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2dyYXBoLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9saWZldGltZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbG9hZGVycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvcGh5c2ljcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvcmFuZG9tLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy92ZWMzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyXG4gICwgaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gZnBzXG5cbi8vIFRyeSB1c2UgcGVyZm9ybWFuY2Uubm93KCksIG90aGVyd2lzZSB0cnlcbi8vICtuZXcgRGF0ZS5cbnZhciBub3cgPSAoXG4gIChmdW5jdGlvbigpeyByZXR1cm4gdGhpcyB9KCkpLnBlcmZvcm1hbmNlICYmXG4gICdmdW5jdGlvbicgPT09IHR5cGVvZiBwZXJmb3JtYW5jZS5ub3dcbikgPyBmdW5jdGlvbigpIHsgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpIH1cbiAgOiBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHsgcmV0dXJuICtuZXcgRGF0ZSB9XG5cbmZ1bmN0aW9uIGZwcyhvcHRzKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBmcHMpKSByZXR1cm4gbmV3IGZwcyhvcHRzKVxuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKVxuXG4gIG9wdHMgPSBvcHRzIHx8IHt9XG4gIHRoaXMubGFzdCA9IG5vdygpXG4gIHRoaXMucmF0ZSA9IDBcbiAgdGhpcy50aW1lID0gMFxuICB0aGlzLmRlY2F5ID0gb3B0cy5kZWNheSB8fCAxXG4gIHRoaXMuZXZlcnkgPSBvcHRzLmV2ZXJ5IHx8IDFcbiAgdGhpcy50aWNrcyA9IDBcbn1cbmluaGVyaXRzKGZwcywgRXZlbnRFbWl0dGVyKVxuXG5mcHMucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHRpbWUgPSBub3coKVxuICAgICwgZGlmZiA9IHRpbWUgLSB0aGlzLmxhc3RcbiAgICAsIGZwcyA9IGRpZmZcblxuICB0aGlzLnRpY2tzICs9IDFcbiAgdGhpcy5sYXN0ID0gdGltZVxuICB0aGlzLnRpbWUgKz0gKGZwcyAtIHRoaXMudGltZSkgKiB0aGlzLmRlY2F5XG4gIHRoaXMucmF0ZSA9IDEwMDAgLyB0aGlzLnRpbWVcbiAgaWYgKCEodGhpcy50aWNrcyAlIHRoaXMuZXZlcnkpKSB0aGlzLmVtaXQoJ2RhdGEnLCB0aGlzLnJhdGUpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gaW5oZXJpdHNcblxuZnVuY3Rpb24gaW5oZXJpdHMgKGMsIHAsIHByb3RvKSB7XG4gIHByb3RvID0gcHJvdG8gfHwge31cbiAgdmFyIGUgPSB7fVxuICA7W2MucHJvdG90eXBlLCBwcm90b10uZm9yRWFjaChmdW5jdGlvbiAocykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHMpLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgIGVba10gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHMsIGspXG4gICAgfSlcbiAgfSlcbiAgYy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHAucHJvdG90eXBlLCBlKVxuICBjLnN1cGVyID0gcFxufVxuXG4vL2Z1bmN0aW9uIENoaWxkICgpIHtcbi8vICBDaGlsZC5zdXBlci5jYWxsKHRoaXMpXG4vLyAgY29uc29sZS5lcnJvcihbdGhpc1xuLy8gICAgICAgICAgICAgICAgLHRoaXMuY29uc3RydWN0b3Jcbi8vICAgICAgICAgICAgICAgICx0aGlzLmNvbnN0cnVjdG9yID09PSBDaGlsZFxuLy8gICAgICAgICAgICAgICAgLHRoaXMuY29uc3RydWN0b3Iuc3VwZXIgPT09IFBhcmVudFxuLy8gICAgICAgICAgICAgICAgLE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSA9PT0gQ2hpbGQucHJvdG90eXBlXG4vLyAgICAgICAgICAgICAgICAsT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSlcbi8vICAgICAgICAgICAgICAgICA9PT0gUGFyZW50LnByb3RvdHlwZVxuLy8gICAgICAgICAgICAgICAgLHRoaXMgaW5zdGFuY2VvZiBDaGlsZFxuLy8gICAgICAgICAgICAgICAgLHRoaXMgaW5zdGFuY2VvZiBQYXJlbnRdKVxuLy99XG4vL2Z1bmN0aW9uIFBhcmVudCAoKSB7fVxuLy9pbmhlcml0cyhDaGlsZCwgUGFyZW50KVxuLy9uZXcgQ2hpbGRcbiIsInZhciBwcm9kYXNoID0ge1xuICBmdW5jdGlvbnM6ICAgcmVxdWlyZShcIi4vc3JjL2Z1bmN0aW9uc1wiKSxcbiAgdHJhbnNkdWNlcnM6IHJlcXVpcmUoXCIuL3NyYy90cmFuc2R1Y2Vyc1wiKSxcbiAgYXJyYXk6ICAgICAgIHJlcXVpcmUoXCIuL3NyYy9hcnJheVwiKSxcbiAgb2JqZWN0OiAgICAgIHJlcXVpcmUoXCIuL3NyYy9vYmplY3RcIilcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwcm9kYXNoXG4iLCJ2YXIgZm5zICAgICAgICAgPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcbnZhciBjdXJyeSAgICAgICA9IGZucy5jdXJyeVxudmFyIGRlbWV0aG9kaXplID0gZm5zLmRlbWV0aG9kaXplXG52YXIgYXJyYXkgICAgICAgPSB7fVxuXG52YXIgZmluZCA9IGN1cnJ5KGZ1bmN0aW9uIChwcmVkRm4sIGFyKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAocHJlZEZuKGFyW2ldKSkgcmV0dXJuIGFyW2ldIFxuICB9XG4gIHJldHVybiBudWxsXG59KVxuXG52YXIgZm9yRWFjaCA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBhcikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyLmxlbmd0aDsgKytpKSB7XG4gICAgYXJbaV0gPSB0cmFuc0ZuKGFyW2ldKSBcbiAgfVxufSlcblxudmFyIHJldmVyc2UgPSBmdW5jdGlvbiAobGlzdCkge1xuICB2YXIgYmFja3dhcmRzID0gW11cblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGlzdC5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGJhY2t3YXJkc1tpXSA9IGxpc3RbbGVuLTEtaV1cbiAgfVxuICByZXR1cm4gYmFja3dhcmRzXG59XG5cbnZhciBjb25jYXQgPSBkZW1ldGhvZGl6ZShBcnJheS5wcm90b3R5cGUsIFwiY29uY2F0XCIpXG5cbnZhciBmbGF0dGVuID0gZnVuY3Rpb24gKGFycmF5T2ZBcnJheXMpIHtcbiAgdmFyIGZsYXR0ZW5lZCA9IFtdXG4gIHZhciBzdWJhcnJheVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlPZkFycmF5cy5sZW5ndGg7ICsraSkge1xuICAgIHN1YmFycmF5ID0gYXJyYXlPZkFycmF5c1tpXVxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3ViYXJyYXkubGVuZ3RoOyArK2opIHtcbiAgICAgIGZsYXR0ZW5lZC5wdXNoKHN1YmFycmF5W2pdKSBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZsYXR0ZW5lZFxufVxuXG52YXIgcHVzaCA9IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgYXJyYXkucHVzaChlbClcbiAgcmV0dXJuIGFycmF5XG59XG5cbnZhciB1bnNoaWZ0ID0gZnVuY3Rpb24gKGFycmF5LCBlbCkge1xuICBhcnJheS51bnNoaWZ0KGVsKVxuICByZXR1cm4gYXJyYXlcbn1cblxudmFyIHNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIGFycmF5KSB7XG4gIHJldHVybiBhcnJheS5zbGljZShzdGFydCwgZW5kKVxufVxuXG52YXIgcmVtb3ZlID0gZnVuY3Rpb24gKGZuLCBhcnJheSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKGZuKGFycmF5W2ldKSkge1xuICAgICAgYXJyYXkuc3BsaWNlKGksIDEpXG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheVxufVxuXG5hcnJheS5maW5kICAgID0gZmluZFxuYXJyYXkuZm9yRWFjaCA9IGZvckVhY2hcbmFycmF5LnJldmVyc2UgPSByZXZlcnNlXG5hcnJheS5jb25jYXQgID0gY29uY2F0XG5hcnJheS5mbGF0dGVuID0gZmxhdHRlblxuYXJyYXkuc2xpY2UgICA9IHNsaWNlXG5hcnJheS5wdXNoICAgID0gcHVzaFxuYXJyYXkudW5zaGlmdCA9IHVuc2hpZnRcbmFycmF5LnJlbW92ZSAgPSByZW1vdmVcblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheVxuIiwidmFyIGZucyA9IHt9XG5cbnZhciBkZW1ldGhvZGl6ZSA9IGZ1bmN0aW9uIChvYmosIGZuTmFtZSkge1xuICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGwuYmluZChvYmpbZm5OYW1lXSkgXG59XG5cbnZhciBpbnN0YW5jZU9mID0gZnVuY3Rpb24gKGNvbnN0cnVjdG9yLCBjb2wpIHsgXG4gIHJldHVybiBjb2wgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvclxufVxuXG52YXIgYXBwbHkgPSBmdW5jdGlvbiAoZm4sIGFyZ3NMaXN0KSB7IFxuICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJnc0xpc3QpIFxufVxuXG52YXIgY2FsbCA9IGZ1bmN0aW9uIChmbikgeyBcbiAgdmFyIGFyZ3MgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aCAtIDE7ICsraSkge1xuICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdIFxuICB9XG4gIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKSBcbn1cblxudmFyIGNvbXBvc2UgPSBmdW5jdGlvbiAoZm5zKSB7XG4gIHJldHVybiBmdW5jdGlvbiBjb21wb3NlZCAodmFsKSB7XG4gICAgZm9yICh2YXIgaSA9IGZucy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdmFsID0gZm5zW2ldKHZhbClcbiAgICB9XG4gICAgcmV0dXJuIHZhbFxuICB9XG59XG5cbnZhciBmbGlwID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJhY2t3YXJkcyA9IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBiYWNrd2FyZHNbaV0gPSBhcmd1bWVudHNbbGVuLTEtaV1cbiAgICB9XG4gICAgcmV0dXJuIGFwcGx5KGZuLCBiYWNrd2FyZHMpXG4gIH1cbn1cblxudmFyIHBhcnRpYWwgPSBmdW5jdGlvbiAoZm4pIHtcbiAgdmFyIGFyZ3MgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aCAtIDE7ICsraSkge1xuICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdIFxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBqID0gMCwgc3RhcnRpbmdJbmRleCA9IGFyZ3MubGVuZ3RoOyBqIDwgYXJndW1lbnRzLmxlbmd0aDsgKytqKSB7XG4gICAgICBhcmdzW2ogKyBzdGFydGluZ0luZGV4XSA9IGFyZ3VtZW50c1tqXSBcbiAgICB9XG5cbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncylcbiAgfVxufVxuXG4vL3V0aWxpdHkgZnVuY3Rpb24gdXNlZCBpbiBjdXJyeSBkZWZcbnZhciBpbm5lckN1cnJ5ID0gZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHN0YXJ0aW5nSW5kZXggPSBhcmdzLmxlbmd0aDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgYXJnc1tpICsgc3RhcnRpbmdJbmRleF0gPSBhcmd1bWVudHNbaV0gXG4gICAgfVxuXG4gICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICB9O1xufTtcblxuLy9hcml0eSBhcmd1bWVudCBpcyB1c2VkIG1vc3Qgb2Z0ZW4gaW50ZXJuYWxseVxudmFyIGN1cnJ5ID0gZnVuY3Rpb24gKGZuLCBhcml0eSkge1xuICB2YXIgZm5Bcml0eSA9IGFyaXR5IHx8IGZuLmxlbmd0aFxuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1pc3NpbmdBcmdzQ291bnQgPSBmbkFyaXR5IC0gYXJndW1lbnRzLmxlbmd0aFxuICAgIHZhciBub3RFbm91Z2hBcmdzICAgID0gbWlzc2luZ0FyZ3NDb3VudCA+IDBcbiAgICB2YXIgYXJncyAgICAgICAgICAgICA9IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXSBcbiAgICB9XG5cbiAgICBpZiAobm90RW5vdWdoQXJncykgcmV0dXJuIGN1cnJ5KGlubmVyQ3VycnkoZm4sIGFyZ3MpLCBtaXNzaW5nQXJnc0NvdW50KVxuICAgIGVsc2UgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncylcbiAgfVxufVxuXG5mbnMuZGVtZXRob2RpemUgPSBkZW1ldGhvZGl6ZVxuZm5zLmluc3RhbmNlT2YgID0gaW5zdGFuY2VPZlxuZm5zLmZsaXAgICAgICAgID0gZmxpcFxuZm5zLmNvbXBvc2UgICAgID0gY29tcG9zZVxuZm5zLnBhcnRpYWwgICAgID0gcGFydGlhbFxuZm5zLmN1cnJ5ICAgICAgID0gY3VycnlcbmZucy5jYWxsICAgICAgICA9IGNhbGxcbmZucy5hcHBseSAgICAgICA9IGFwcGx5XG5tb2R1bGUuZXhwb3J0cyAgPSBmbnNcbiIsInZhciBmbnMgICAgICAgICA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxudmFyIGN1cnJ5ICAgICAgID0gZm5zLmN1cnJ5XG52YXIgb2JqZWN0ICAgICAgPSB7fVxuXG52YXIgZXh0ZW5kID0gY3VycnkoZnVuY3Rpb24gKGhvc3QsIG9iaikge1xuICB2YXIga3MgPSBPYmplY3Qua2V5cyhvYmopXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrcy5sZW5ndGg7ICsraSkge1xuICAgIGhvc3Rba3NbaV1dID0gb2JqW2tzW2ldXVxuICB9XG4gIHJldHVybiBob3N0XG59KVxuXG52YXIgaGFzS2V5ID0gY3VycnkoZnVuY3Rpb24gKGtleSwgZSkge1xuICByZXR1cm4gZVtrZXldICE9PSB1bmRlZmluZWRcbn0pXG5cbnZhciBoYXNLZXlzID0gY3VycnkoZnVuY3Rpb24gKGtleXMsIGUpIHtcbiAgdmFyIHJlcyA9IHRydWVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICByZXMgPSByZXMgJiYgZVtrZXlzW2ldXSAhPT0gdW5kZWZpbmVkXG4gIH1cbiAgcmV0dXJuIHJlc1xufSlcblxub2JqZWN0Lmhhc0tleSAgPSBoYXNLZXlcbm9iamVjdC5oYXNLZXlzID0gaGFzS2V5c1xub2JqZWN0LmV4dGVuZCAgPSBleHRlbmRcblxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RcbiIsInZhciBmbnMgICAgICAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgY3VycnkgICAgICA9IGZucy5jdXJyeVxudmFyIGNvbXBvc2UgICAgPSBmbnMuY29tcG9zZVxudmFyIGluc3RhbmNlT2YgPSBmbnMuaW5zdGFuY2VPZlxudmFyIHRyYW5zICAgICAgPSB7fVxuXG52YXIgcmVkSWRlbnRpdHkgPSBmdW5jdGlvbiAoYWNjLCB4KSB7IHJldHVybiB4IH1cblxudmFyIHJlZHVjZUFycmF5ID0gZnVuY3Rpb24gKGZuLCBhY2N1bSwgYXJyKSB7XG4gIHZhciBpbmRleCA9IC0xXG4gIHZhciBsZW4gICA9IGFyci5sZW5ndGhcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbikge1xuICAgIGFjY3VtID0gZm4oYWNjdW0sIGFycltpbmRleF0pXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59XG5cbnZhciByZWR1Y2VPYmplY3QgPSBmdW5jdGlvbiAoZm4sIGFjY3VtLCBvYmopIHtcbiAgdmFyIGluZGV4ID0gLTFcbiAgdmFyIGtzICAgID0gT2JqZWN0LmtleXMob2JqKVxuICB2YXIgbGVuICAgPSBrcy5sZW5ndGhcbiAgdmFyIGtleVxuICB2YXIga3ZcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbikge1xuICAgIGtleSAgICAgPSBrc1tpbmRleF1cbiAgICBrdiAgICAgID0ge31cbiAgICBrdltrZXldID0gb2JqW2tleV1cbiAgICBhY2N1bSAgID0gZm4oYWNjdW0sIGt2KVxuICB9XG4gIHJldHVybiBhY2N1bVxufVxuXG52YXIgY29uc0FycmF5ID0gZnVuY3Rpb24gKGFycmF5LCBlbCkge1xuICBhcnJheS5wdXNoKGVsKVxuICByZXR1cm4gYXJyYXlcbn1cblxudmFyIGNvbnNPYmplY3QgPSBmdW5jdGlvbiAoaG9zdCwgb2JqKSB7XG4gIHZhciBrcyA9IE9iamVjdC5rZXlzKG9iailcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtzLmxlbmd0aDsgKytpKSB7XG4gICAgaG9zdFtrc1tpXV0gPSBvYmpba3NbaV1dXG4gIH1cbiAgcmV0dXJuIGhvc3Rcbn1cblxudmFyIHJlZHVjZSA9IGN1cnJ5KGZ1bmN0aW9uIChmbiwgYWNjdW0sIGNvbCkge1xuICBpZiAgICAgIChpbnN0YW5jZU9mKEFycmF5LCBjb2wpKSAgICAgICAgcmV0dXJuIHJlZHVjZUFycmF5KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKEZsb2F0MzJBcnJheSwgY29sKSkgcmV0dXJuIHJlZHVjZUFycmF5KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKFVpbnQzMkFycmF5LCBjb2wpKSAgcmV0dXJuIHJlZHVjZUFycmF5KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChjb2wuX19yZWR1Y2UgIT09IHVuZGVmaW5lZCkgICAgcmV0dXJuIGNvbC5fX3JlZHVjZShmbiwgYWNjdW0sIGNvbClcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihPYmplY3QsIGNvbCkpICAgICAgIHJldHVybiByZWR1Y2VPYmplY3QoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIGNvbGxlY3Rpb24gdHlwZVwiKVxufSlcblxudmFyIGNvbnMgPSBjdXJyeShmdW5jdGlvbiAoY29sLCBlbCkge1xuICBpZiAgICAgIChpbnN0YW5jZU9mKEFycmF5LCBjb2wpKSAgIHJldHVybiBjb25zQXJyYXkoY29sLCBlbClcbiAgZWxzZSBpZiAoY29sLl9fY29ucyAhPT0gdW5kZWZpbmVkKSByZXR1cm4gY29sLl9fY29ucyhjb2wsIGVsKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKE9iamVjdCwgY29sKSkgIHJldHVybiBjb25zT2JqZWN0KGNvbCwgZWwpXG4gIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBjb2xsZWN0aW9uIHR5cGVcIilcbn0pXG5cbnZhciBlbXB0eSA9IGZ1bmN0aW9uIChjb2wpIHtcbiAgaWYgICAgICAoaW5zdGFuY2VPZihBcnJheSwgY29sKSkgICAgICAgIHJldHVybiBbXVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKEZsb2F0MzJBcnJheSwgY29sKSkgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXlcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihVaW50MzJBcnJheSwgY29sKSkgIHJldHVybiBuZXcgVWludDMyQXJyYXlcbiAgZWxzZSBpZiAoY29sLl9fZW1wdHkgIT09IHVuZGVmaW5lZCkgICAgIHJldHVybiBjb2wuX19lbXB0eSgpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoT2JqZWN0LCBjb2wpKSAgICAgICByZXR1cm4ge31cbiAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gY29sbGVjdGlvbiB0eXBlXCIpXG59XG5cbnZhciBtYXBwaW5nID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIHN0ZXBGbikge1xuICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgIHJldHVybiBzdGVwRm4oYWNjLCB0cmFuc0ZuKHgpKVxuICB9XG59KVxuXG52YXIgcGx1Y2tpbmcgPSBjdXJyeShmdW5jdGlvbiAocHJvcE5hbWUsIHN0ZXBGbikge1xuICByZXR1cm4gbWFwcGluZyhmdW5jdGlvbiAoeCkgeyByZXR1cm4geFtwcm9wTmFtZV0gfSwgc3RlcEZuKVxufSlcblxudmFyIGZpbHRlcmluZyA9IGN1cnJ5KGZ1bmN0aW9uIChwcmVkRm4sIHN0ZXBGbikge1xuICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgIHJldHVybiBwcmVkRm4oeCkgPyBzdGVwRm4oYWNjLCB4KSA6IGFjYyBcbiAgfVxufSlcblxudmFyIGNoZWNraW5nID0gY3VycnkoZnVuY3Rpb24gKHByb3AsIHZhbCwgc3RlcEZuKSB7XG4gIHJldHVybiBmaWx0ZXJpbmcoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHhbcHJvcF0gPT09IHZhbCB9LCBzdGVwRm4pXG59KVxuXG4vL1RISVMgV0lMTCBNVVRBVEUgVEhFIFNUUlVDVFVSRSBQUk9WSURFRCBUTyBJVCBESVJFQ1RMWVxudmFyIG11dGF0aW5nID0gY3VycnkoZnVuY3Rpb24gKG11dEZuLCBzdGVwRm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICBtdXRGbih4KVxuICAgIHJldHVybiBzdGVwRm4oYWNjLCB4KVxuICB9XG59KVxuXG52YXIgY2F0ID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgcmV0dXJuIHJlZHVjZShmbiwgYWNjLCB4KSBcbiAgfVxufVxuXG52YXIgbWFwID0gY3VycnkoZnVuY3Rpb24gKGZuLCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZShtYXBwaW5nKGZuLCBjb25zKSwgZW1wdHkoY29sKSwgY29sKVxufSlcblxudmFyIG1hcGNhdHRpbmcgPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgc3RlcEZuKSB7XG4gIHJldHVybiBjb21wb3NlKFtjYXQsIG1hcHBpbmcodHJhbnNGbildKShzdGVwRm4pXG59KVxuXG52YXIgZmlsdGVyID0gY3VycnkoZnVuY3Rpb24gKHByZWRGbiwgY29sKSB7XG4gIHJldHVybiByZWR1Y2UoZmlsdGVyaW5nKHByZWRGbiwgY29ucyksIGVtcHR5KGNvbCksIGNvbClcbn0pXG5cbnZhciBtdXRhdGUgPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgY29sKSB7XG4gIHJldHVybiByZWR1Y2UodHJhbnNGbihyZWRJZGVudGl0eSksIHVuZGVmaW5lZCwgY29sKVxufSlcblxudmFyIHRyYW5zZHVjZSA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBzdGVwRm4sIGluaXQsIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKHRyYW5zRm4oc3RlcEZuKSwgaW5pdCwgY29sKVxufSlcblxudmFyIHNlcXVlbmNlID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKHRyYW5zRm4oY29ucyksIGVtcHR5KGNvbCksIGNvbClcbn0pXG5cbnZhciBpbnRvID0gY3VycnkoZnVuY3Rpb24gKHRvLCB0cmFuc0ZuLCBmcm9tKSB7XG4gIHJldHVybiB0cmFuc2R1Y2UodHJhbnNGbiwgY29ucywgdG8sIGZyb20pXG59KVxuXG50cmFucy5yZWR1Y2UgICAgID0gcmVkdWNlXG50cmFucy5jb25zICAgICAgID0gY29uc1xudHJhbnMuZW1wdHkgICAgICA9IGVtcHR5XG50cmFucy5tYXBwaW5nICAgID0gbWFwcGluZ1xudHJhbnMucGx1Y2tpbmcgICA9IHBsdWNraW5nXG50cmFucy5jYXQgICAgICAgID0gY2F0XG50cmFucy5maWx0ZXJpbmcgID0gZmlsdGVyaW5nXG50cmFucy5jaGVja2luZyAgID0gY2hlY2tpbmdcbnRyYW5zLm1hcCAgICAgICAgPSBtYXBcbnRyYW5zLm1hcGNhdHRpbmcgPSBtYXBjYXR0aW5nXG50cmFucy5tdXRhdGluZyAgID0gbXV0YXRpbmdcbnRyYW5zLm11dGF0ZSAgICAgPSBtdXRhdGVcbnRyYW5zLmZpbHRlciAgICAgPSBmaWx0ZXJcbnRyYW5zLnRyYW5zZHVjZSAgPSB0cmFuc2R1Y2VcbnRyYW5zLnNlcXVlbmNlICAgPSBzZXF1ZW5jZVxudHJhbnMuaW50byAgICAgICA9IGludG9cbm1vZHVsZS5leHBvcnRzICAgPSB0cmFuc1xuIiwidmFyIHByb2Rhc2ggICAgICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIGFzeW5jICAgICAgICAgPSByZXF1aXJlKFwiYXN5bmNcIilcbnZhciBmcHMgICAgICAgICAgID0gcmVxdWlyZShcImZwc1wiKVxudmFyIG1hdDQgICAgICAgICAgPSByZXF1aXJlKFwiZ2wtbWF0NFwiKVxudmFyIGdyYXBoICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9ncmFwaFwiKVxudmFyIGxvYWRlcnMgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9sb2FkZXJzXCIpXG52YXIgdXRpbHMgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2dsLXV0aWxzXCIpXG52YXIgcmFuZG9tICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL3JhbmRvbVwiKVxudmFyIHBoeXNpY3MgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9waHlzaWNzXCIpXG52YXIgbGlmZXRpbWUgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2xpZmV0aW1lXCIpXG52YXIgZW1pdHRlcnMgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2VtaXR0ZXJzXCIpXG52YXIgY2xvY2sgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2Nsb2NrXCIpXG52YXIgY2FtZXJhICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2NhbWVyYVwiKVxudmFyIEdyYXBoICAgICAgICAgPSBncmFwaC5HcmFwaFxudmFyIGF0dGFjaEJ5SWQgICAgPSBncmFwaC5hdHRhY2hCeUlkXG52YXIgcGFydGlhbCAgICAgICA9IHByb2Rhc2guZnVuY3Rpb25zLnBhcnRpYWxcbnZhciBQYXJ0aWNsZSAgICAgID0gZW1pdHRlcnMuUGFydGljbGVcbnZhciBFbWl0dGVyICAgICAgID0gZW1pdHRlcnMuRW1pdHRlclxudmFyIHVwZGF0ZUVtaXR0ZXIgPSBlbWl0dGVycy51cGRhdGVFbWl0dGVyXG52YXIgbG9hZFNoYWRlciAgICA9IGxvYWRlcnMubG9hZFNoYWRlclxudmFyIHVwZGF0ZUJ1ZmZlciAgPSB1dGlscy51cGRhdGVCdWZmZXJcbnZhciBjbGVhckNvbnRleHQgID0gdXRpbHMuY2xlYXJDb250ZXh0XG52YXIgTG9hZGVkUHJvZ3JhbSA9IHV0aWxzLkxvYWRlZFByb2dyYW1cbnZhciByYW5kQm91bmQgICAgID0gcmFuZG9tLnJhbmRCb3VuZFxudmFyIHVwZGF0ZVBoeXNpY3MgPSBwaHlzaWNzLnVwZGF0ZVBoeXNpY3NcbnZhciBraWxsVGhlT2xkICAgID0gbGlmZXRpbWUua2lsbFRoZU9sZFxudmFyIENsb2NrICAgICAgICAgPSBjbG9jay5DbG9ja1xudmFyIHVwZGF0ZUNsb2NrICAgPSBjbG9jay51cGRhdGVDbG9ja1xudmFyIENhbWVyYSAgICAgICAgPSBjYW1lcmEuQ2FtZXJhXG52YXIgdXBkYXRlQ2FtZXJhICA9IGNhbWVyYS51cGRhdGVDYW1lcmFcbnZhciBjYW52YXMgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwbGF5Z3JvdW5kXCIpXG52YXIgc3RhdHMgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhdHNcIilcbnZhciBnbCAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKVxudmFyIHNoYWRlcnMgICAgICAgPSB7XG4gIHZlcnRleDogICBcIi9zaGFkZXJzLzAxdi5nbHNsXCIsXG4gIGZyYWdtZW50OiBcIi9zaGFkZXJzLzAxZi5nbHNsXCJcbn1cblxuLy8oV29ybGQgLT4gTm9kZSkgLT4gU3RyaW5nIC0+IFdvcmxkIC0+IFZvaWRcbnZhciBmb3JFYWNoTm9kZSA9IGZ1bmN0aW9uIChmbiwgbm9kZUlkLCB3b3JsZCkge1xuICB2YXIgbm9kZSA9IHdvcmxkLmdyYXBoLm5vZGVzW25vZGVJZF1cblxuICBmbih3b3JsZCwgbm9kZSlcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgZm9yRWFjaE5vZGUoZm4sIG5vZGUuY2hpbGRJZHNbaV0sIHdvcmxkKVxuICB9XG59XG5cbi8vKFdvcmxkIC0+IE5vZGUpIC0+IFdvcmxkIC0+IFZvaWRcbnZhciB1cGRhdGVFbnRpdGllcyA9IGZ1bmN0aW9uIChmbiwgd29ybGQpIHtcbiAgZm9yRWFjaE5vZGUoZm4sIHdvcmxkLmdyYXBoLnJvb3ROb2RlSWQsIHdvcmxkKVxufVxuXG5mdW5jdGlvbiBtYWtlVXBkYXRlICh3b3JsZCkge1xuICB1cGRhdGVDbG9jayh3b3JsZC5jbG9jaywgcGVyZm9ybWFuY2Uubm93KCkpXG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xuICAgIHVwZGF0ZUNsb2NrKHdvcmxkLmNsb2NrLCBwZXJmb3JtYW5jZS5ub3coKSlcbiAgICB1cGRhdGVDYW1lcmEod29ybGQsIHdvcmxkLmNhbWVyYSlcbiAgICB1cGRhdGVFbnRpdGllcyhraWxsVGhlT2xkLCB3b3JsZClcbiAgICB1cGRhdGVFbnRpdGllcyh1cGRhdGVQaHlzaWNzLCB3b3JsZClcbiAgICB1cGRhdGVFbnRpdGllcyh1cGRhdGVFbWl0dGVyLCB3b3JsZClcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlQW5pbWF0ZSAoZ2wsIHdvcmxkKSB7XG4gIHZhciByYXdQb3NpdGlvbnMgPSBbXVxuICB2YXIgYnVpbGRCdWZmZXJzID0gZnVuY3Rpb24gKHdvcmxkLCBub2RlKSB7XG4gICAgaWYgKG5vZGUubGl2aW5nICYmIG5vZGUucmVuZGVyYWJsZSkge1xuICAgICAgcmF3UG9zaXRpb25zLnB1c2gobm9kZS5wb3NpdGlvblswXSkgXG4gICAgICByYXdQb3NpdGlvbnMucHVzaChub2RlLnBvc2l0aW9uWzFdKSBcbiAgICAgIHJhd1Bvc2l0aW9ucy5wdXNoKG5vZGUucG9zaXRpb25bMl0pIFxuICAgIH1cbiAgfVxuICB2YXIgcG9zaXRpb25zIFxuICAvL3RlbXBvcmFyeS4uLiBzaG91bGQgcmVmYWN0b3JcbiAgdmFyIGxwID0gd29ybGQucHJvZ3JhbXMucGFydGljbGVcblxuICByZXR1cm4gZnVuY3Rpb24gYW5pbWF0ZSAoKSB7XG4gICAgcmF3UG9zaXRpb25zID0gW11cbiAgICB1cGRhdGVFbnRpdGllcyhidWlsZEJ1ZmZlcnMsIHdvcmxkKVxuICAgIHBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkocmF3UG9zaXRpb25zKVxuXG4gICAgY2xlYXJDb250ZXh0KGdsKVxuICAgIGdsLnVzZVByb2dyYW0od29ybGQucHJvZ3JhbXMucGFydGljbGUucHJvZ3JhbSlcbiAgICBnbC51bmlmb3JtNGYobHAudW5pZm9ybXMudUNvbG9yLCAxLjAsIDAuMCwgMC4wLCAxLjApXG4gICAgZ2wudW5pZm9ybTJmKGxwLnVuaWZvcm1zLnVTY3JlZW5TaXplLCBjYW52YXMuY2xpZW50V2lkdGgsIGNhbnZhcy5jbGllbnRIZWlnaHQpXG4gICAgZ2wudW5pZm9ybU1hdHJpeDRmdihscC51bmlmb3Jtcy51VmlldywgZmFsc2UsIHdvcmxkLmNhbWVyYS52aWV3KVxuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYobHAudW5pZm9ybXMudVByb2plY3Rpb24sIGZhbHNlLCB3b3JsZC5jYW1lcmEucHJvamVjdGlvbilcbiAgICBnbC51bmlmb3JtMWYobHAudW5pZm9ybXMudVNpemUsIDEuMClcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIDMsIGxwLmF0dHJpYnV0ZXMuYVBvc2l0aW9uLCBscC5idWZmZXJzLmFQb3NpdGlvbiwgcG9zaXRpb25zKVxuICAgIGdsLmRyYXdBcnJheXMoZ2wuUE9JTlRTLCAwLCBwb3NpdGlvbnMubGVuZ3RoIC8gMylcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSkgXG4gIH1cbn1cblxuYXN5bmMucGFyYWxsZWwoe1xuICB2ZXJ0ZXg6ICAgcGFydGlhbChsb2FkU2hhZGVyLCBcIi9zaGFkZXJzLzAxdi5nbHNsXCIpLFxuICBmcmFnbWVudDogcGFydGlhbChsb2FkU2hhZGVyLCBcIi9zaGFkZXJzLzAxZi5nbHNsXCIpXG59LCBmdW5jdGlvbiAoZXJyLCBzaGFkZXJzKSB7XG4gIHZhciBmb3YgICAgICAgICAgICAgPSAuNSAqIE1hdGguUElcbiAgdmFyIGFzcGVjdCAgICAgICAgICA9IGNhbnZhcy5jbGllbnRXaWR0aCAvIGNhbnZhcy5jbGllbnRIZWlnaHRcbiAgdmFyIHBhcnRpY2xlUHJvZ3JhbSA9IExvYWRlZFByb2dyYW0oZ2wsIHNoYWRlcnMudmVydGV4LCBzaGFkZXJzLmZyYWdtZW50KVxuICB2YXIgd29ybGQgICAgICAgICAgID0ge1xuICAgIGNsb2NrOiAgICBDbG9jayhwZXJmb3JtYW5jZS5ub3coKSksXG4gICAgY2FtZXJhOiAgIENhbWVyYSgwLCAwLCAzLCBmb3YsIGFzcGVjdCwgMSwgMTApLFxuICAgIGdyYXBoOiAgICBHcmFwaCgpLFxuICAgIHByb2dyYW1zOiB7XG4gICAgICBwYXJ0aWNsZTogcGFydGljbGVQcm9ncmFtXG4gICAgfVxuICB9XG5cbiAgd2luZG93LndvcmxkID0gd29ybGRcbiAgd2luZG93LmdsID0gZ2xcblxuICB2YXIgc3Bhd25BdCA9IGZ1bmN0aW9uIChzcGVlZCwgeCwgeSwgZHgsIGR5KSB7XG4gICAgdmFyIGUgPSBFbWl0dGVyKDEwMDAsIDEwLCBzcGVlZCwgLjEsIHgsIHksIDAsIGR4LCBkeSwgMCkgIFxuXG4gICAgYXR0YWNoQnlJZCh3b3JsZC5ncmFwaCwgd29ybGQuZ3JhcGgucm9vdE5vZGVJZCwgZSlcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IDUwOyArK2opIHtcbiAgICAgIGF0dGFjaEJ5SWQod29ybGQuZ3JhcGgsIGUuaWQsIFBhcnRpY2xlKDEwMDAsIDAsIDAsIDApKVxuICAgIH1cbiAgfVxuXG4gIHZhciBidWlsZEVtaXR0ZXIgPSBmdW5jdGlvbiAodHJhbnNGbikge1xuICAgIHZhciBjb3VudCAgPSA4XG4gICAgdmFyIHNwcmVhZCA9IDJcbiAgICB2YXIgZGlmZiAgID0gc3ByZWFkIC8gY291bnRcbiAgICB2YXIgZVxuXG4gICAgZm9yICh2YXIgaSA9IC0xICogY291bnQ7IGkgPCAxICogY291bnQ7IGkrPS4xICogY291bnQpIHtcbiAgICAgIHNwYXduQXQoLjAwNCwgdHJhbnNGbihpKSAqIGRpZmYsIGkgLyBjb3VudCwgMSwgMClcbiAgICB9XG4gIH1cbiAgYnVpbGRFbWl0dGVyKE1hdGguc2luKVxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKHdvcmxkKSwgMjUpXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShtYWtlQW5pbWF0ZShnbCwgd29ybGQpKVxufSlcbiIsInZhciBtYXQ0ICAgICA9IHJlcXVpcmUoXCJnbC1tYXQ0XCIpXG52YXIgdmVjMyAgICAgPSByZXF1aXJlKFwiLi92ZWMzXCIpXG52YXIgVmVjMyAgICAgPSB2ZWMzLlZlYzNcbnZhciByb3RTcGVlZCA9IE1hdGguUEkgLyAxODAwXG52YXIgY2FtZXJhICAgPSB7fVxuXG5cbnZhciBDYW1lcmEgPSBmdW5jdGlvbiAoeCwgeSwgeiwgZm92LCBhc3BlY3QsIG5lYXIsIGZhcikge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2FtZXJhKSkgcmV0dXJuIG5ldyBDYW1lcmEoeCwgeSwgeiwgZm92LCBhc3BlY3QsIG5lYXIsIGZhcilcblxuICB0aGlzLnBvc2l0aW9uICAgPSBWZWMzKHgsIHkgLHopXG4gIHRoaXMuZm92ICAgICAgICA9IGZvdlxuICB0aGlzLm5lYXIgICAgICAgPSBuZWFyXG4gIHRoaXMuZmFyICAgICAgICA9IGZhclxuICB0aGlzLmFzcGVjdCAgICAgPSBhc3BlY3RcbiAgdGhpcy5wcm9qZWN0aW9uID0gbWF0NC5wZXJzcGVjdGl2ZShtYXQ0LmNyZWF0ZSgpLCBmb3YsIGFzcGVjdCwgbmVhciwgZmFyKVxuXG4gIHRoaXMuZXllICAgICAgICA9IFZlYzMoeCwgeSwgeilcbiAgdGhpcy5sb29rQXQgICAgID0gVmVjMygwLCAwLCAwKVxuICB0aGlzLnVwICAgICAgICAgPSBWZWMzKDAsIDEsIDApXG4gIHRoaXMudmlldyAgICAgICA9IG1hdDQubG9va0F0KG1hdDQuY3JlYXRlKCksIHRoaXMuZXllLCB0aGlzLmxvb2tBdCwgdGhpcy51cClcbn1cblxudmFyIHVwZGF0ZUNhbWVyYSA9IGZ1bmN0aW9uICh3b3JsZCwgY2FtZXJhKSB7XG4gIHZhciBkVCAgID0gd29ybGQuY2xvY2suZFRcbiAgdmFyIHZpZXcgPSB3b3JsZC5jYW1lcmEudmlld1xuXG4gIG1hdDQucm90YXRlWSh2aWV3LCB2aWV3LCByb3RTcGVlZCAqIGRUKVxufVxuXG5cbmNhbWVyYS5DYW1lcmEgICAgICAgPSBDYW1lcmFcbmNhbWVyYS51cGRhdGVDYW1lcmEgPSB1cGRhdGVDYW1lcmFcbm1vZHVsZS5leHBvcnRzID0gY2FtZXJhXG4iLCJ2YXIgY2xvY2sgPSB7fVxuXG52YXIgQ2xvY2sgPSBmdW5jdGlvbiAobm93KSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDbG9jaykpIHJldHVybiBuZXcgQ2xvY2sobm93KVxuICB0aGlzLm9sZFRpbWUgPSBub3dcbiAgdGhpcy5uZXdUaW1lID0gbm93XG4gIHRoaXMuZFQgICAgICA9IHRoaXMubmV3VGltZSAtIHRoaXMub2xkVGltZVxufVxuXG52YXIgdXBkYXRlQ2xvY2sgPSBmdW5jdGlvbiAoY2xvY2ssIG5ld1RpbWUpIHtcbiAgY2xvY2sub2xkVGltZSA9IGNsb2NrLm5ld1RpbWVcbiAgY2xvY2submV3VGltZSA9IG5ld1RpbWVcbiAgY2xvY2suZFQgICAgICA9IGNsb2NrLm5ld1RpbWUgLSBjbG9jay5vbGRUaW1lXG59XG5cbmNsb2NrLkNsb2NrICAgICAgID0gQ2xvY2tcbmNsb2NrLnVwZGF0ZUNsb2NrID0gdXBkYXRlQ2xvY2tcblxubW9kdWxlLmV4cG9ydHMgPSBjbG9ja1xuIiwidmFyIHV1aWQgICAgICA9IHJlcXVpcmUoXCJub2RlLXV1aWRcIilcbnZhciBwcm9kYXNoICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIHJhbmRvbSAgICA9IHJlcXVpcmUoXCIuL3JhbmRvbVwiKVxudmFyIHZlYzMgICAgICA9IHJlcXVpcmUoXCIuL3ZlYzNcIilcbnZhciBWZWMzICAgICAgPSB2ZWMzLlZlYzNcbnZhciBmaW5kICAgICAgPSBwcm9kYXNoLmFycmF5LmZpbmRcbnZhciBjdXJyeSAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5jdXJyeVxudmFyIHJhbmRCb3VuZCA9IHJhbmRvbS5yYW5kQm91bmRcbnZhciBlbWl0dGVycyAgPSB7fVxuXG52YXIgUGFydGljbGUgPSBmdW5jdGlvbiAobGlmZXNwYW4sIHB4LCBweSwgcHopIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogICAgICAgICAgIHV1aWQudjQoKSxcbiAgICBwb3NpdGlvbjogICAgIFZlYzMocHgsIHB5LCBweiksXG4gICAgdmVsb2NpdHk6ICAgICBWZWMzKDAsIDAsIDApLFxuICAgIGFjY2VsZXJhdGlvbjogVmVjMygwLCAtMC4wMDAwMDE1LCAwKSxcbiAgICAvL2FjY2VsZXJhdGlvbjogVmVjMygwLCAwLCAwKSxcbiAgICByZW5kZXJhYmxlOiAgIHRydWUsXG4gICAgc2l6ZTogICAgICAgICA0LjAsXG4gICAgdGltZVRvRGllOiAgICAwLFxuICAgIGxpZmVzcGFuOiAgICAgbGlmZXNwYW4sXG4gICAgbGl2aW5nOiAgICAgICBmYWxzZVxuICB9XG59XG5cbnZhciBFbWl0dGVyID0gZnVuY3Rpb24gKGxpZmVzcGFuLCByYXRlLCBzcGVlZCwgc3ByZWFkLCBweCwgcHksIHB6LCBkeCwgZHksIGR6KSB7XG4gIHJldHVybiB7XG4gICAgaWQ6ICAgICAgICAgICB1dWlkLnY0KCksXG4gICAgZW1pdHRlcjogICAgICB0cnVlLFxuICAgIHJhdGU6ICAgICAgICAgcmF0ZSwgXG4gICAgc3BlZWQ6ICAgICAgICBzcGVlZCxcbiAgICBzcHJlYWQ6ICAgICAgIHNwcmVhZCxcbiAgICBuZXh0RmlyZVRpbWU6IDAsXG4gICAgcG9zaXRpb246ICAgICBWZWMzKHB4LCBweSwgcHopLFxuICAgIHZlbG9jaXR5OiAgICAgVmVjMygwLCAwLCAwKSxcbiAgICBhY2NlbGVyYXRpb246IFZlYzMoMCwgMCwgMCksXG4gICAgZGlyZWN0aW9uOiAgICBWZWMzKGR4LCBkeSwgZHopLFxuICAgIHJlbmRlcmFibGU6ICAgZmFsc2UsXG4gICAgbGl2aW5nOiAgICAgICB0cnVlXG4gIH1cbn1cblxuXG52YXIgc2NhbGVBbmRTcHJlYWQgPSBmdW5jdGlvbiAoc2NhbGUsIHNwcmVhZCwgdmFsKSB7XG4gIHJldHVybiBzY2FsZSAqICh2YWwgKyByYW5kQm91bmQoLTEgKiBzcHJlYWQsIHNwcmVhZCkpXG59XG5cbnZhciBmaW5kRmlyc3REZWFkID0gZnVuY3Rpb24gKGdyYXBoLCBjaGlsZElkcykge1xuICB2YXIgZm91bmRcbiAgdmFyIGNoaWxkTm9kZVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRJZHMubGVuZ3RoOyArK2kpIHtcbiAgICBjaGlsZE5vZGUgPSBncmFwaC5ub2Rlc1tjaGlsZElkc1tpXV1cbiAgICBmb3VuZCA9IGNoaWxkTm9kZS5saXZpbmcgPyBmb3VuZCA6IGNoaWxkTm9kZVxuICB9XG4gIHJldHVybiBmb3VuZFxufVxuXG52YXIgdXBkYXRlRW1pdHRlciA9IGZ1bmN0aW9uICh3b3JsZCwgZSkge1xuICB2YXIgdGltZSA9IHdvcmxkLmNsb2NrLm5ld1RpbWVcbiAgdmFyIHBhcnRpY2xlIFxuXG4gIGlmICghZS5lbWl0dGVyKSByZXR1cm5cbiAgaWYgKCFlLmxpdmluZykgIHJldHVyblxuICBpZiAodGltZSA+IGUubmV4dEZpcmVUaW1lKSB7XG4gICAgcGFydGljbGUgICAgICAgICAgICAgPSBmaW5kRmlyc3REZWFkKHdvcmxkLmdyYXBoLCBlLmNoaWxkSWRzKVxuICAgIHBhcnRpY2xlLnRpbWVUb0RpZSAgID0gdGltZSArIHBhcnRpY2xlLmxpZmVzcGFuXG4gICAgcGFydGljbGUubGl2aW5nICAgICAgPSB0cnVlXG4gICAgcGFydGljbGUucG9zaXRpb25bMF0gPSBlLnBvc2l0aW9uWzBdXG4gICAgcGFydGljbGUucG9zaXRpb25bMV0gPSBlLnBvc2l0aW9uWzFdXG4gICAgcGFydGljbGUucG9zaXRpb25bMl0gPSBlLnBvc2l0aW9uWzJdXG4gICAgcGFydGljbGUudmVsb2NpdHlbMF0gPSBzY2FsZUFuZFNwcmVhZChlLnNwZWVkLCBlLnNwcmVhZCwgZS5kaXJlY3Rpb25bMF0pXG4gICAgcGFydGljbGUudmVsb2NpdHlbMV0gPSBzY2FsZUFuZFNwcmVhZChlLnNwZWVkLCBlLnNwcmVhZCwgZS5kaXJlY3Rpb25bMV0pXG4gICAgcGFydGljbGUudmVsb2NpdHlbMl0gPSBzY2FsZUFuZFNwcmVhZChlLnNwZWVkLCBlLnNwcmVhZCwgZS5kaXJlY3Rpb25bMl0pXG4gICAgZS5uZXh0RmlyZVRpbWUgKz0gZS5yYXRlXG4gIH1cbn1cblxuZW1pdHRlcnMuUGFydGljbGUgICAgICA9IFBhcnRpY2xlXG5lbWl0dGVycy5FbWl0dGVyICAgICAgID0gRW1pdHRlclxuZW1pdHRlcnMudXBkYXRlRW1pdHRlciA9IHVwZGF0ZUVtaXR0ZXJcbm1vZHVsZS5leHBvcnRzICAgICAgICAgPSBlbWl0dGVyc1xuIiwidmFyIHV0aWxzID0ge31cblxudmFyIGNsZWFyQ29udGV4dCA9IGZ1bmN0aW9uIChnbCkge1xuICBnbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMClcbiAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcbn1cblxudmFyIHVwZGF0ZUJ1ZmZlciA9IGZ1bmN0aW9uIChnbCwgY2h1bmtTaXplLCBhdHRyaWJ1dGUsIGJ1ZmZlciwgZGF0YSkge1xuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShhdHRyaWJ1dGUpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoYXR0cmlidXRlLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG4vL2dpdmVuIHNyYyBhbmQgdHlwZSwgY29tcGlsZSBhbmQgcmV0dXJuIHNoYWRlclxuZnVuY3Rpb24gY29tcGlsZSAoZ2wsIHNoYWRlclR5cGUsIHNyYykge1xuICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpXG5cbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcbiAgcmV0dXJuIHNoYWRlclxufVxuXG4vL2xpbmsgeW91ciBwcm9ncmFtIHcvIG9wZW5nbFxuZnVuY3Rpb24gbGluayAoZ2wsIHZzLCBmcykge1xuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKVxuXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cykgXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcykgXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXG4gIHJldHVybiBwcm9ncmFtXG59XG5cbi8qXG4gKiBXZSB3YW50IHRvIGNyZWF0ZSBhIHdyYXBwZXIgZm9yIGEgbG9hZGVkIGdsIHByb2dyYW1cbiAqIHRoYXQgaW5jbHVkZXMgcG9pbnRlcnMgdG8gYWxsIHRoZSB1bmlmb3JtcyBhbmQgYXR0cmlidXRlc1xuICogZGVmaW5lZCBmb3IgdGhpcyBwcm9ncmFtLiAgVGhpcyBtYWtlcyBpdCBtb3JlIGNvbnZlbmllbnRcbiAqIHRvIGNoYW5nZSB0aGVzZSB2YWx1ZXNcbiAqL1xudmFyIExvYWRlZFByb2dyYW0gPSBmdW5jdGlvbiAoZ2wsIHZTcmMsIGZTcmMpIHtcbiAgdmFyIHZzICAgICAgICAgICAgPSBjb21waWxlKGdsLCBnbC5WRVJURVhfU0hBREVSLCB2U3JjKVxuICB2YXIgZnMgICAgICAgICAgICA9IGNvbXBpbGUoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgZlNyYylcbiAgdmFyIHByb2dyYW0gICAgICAgPSBsaW5rKGdsLCB2cywgZnMpXG4gIHZhciBudW1BdHRyaWJ1dGVzID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUylcbiAgdmFyIG51bVVuaWZvcm1zICAgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9VTklGT1JNUylcbiAgdmFyIGxwID0ge1xuICAgIHZlcnRleDoge1xuICAgICAgc3JjOiAgICB2U3JjLFxuICAgICAgc2hhZGVyOiB2cyBcbiAgICB9LFxuICAgIGZyYWdtZW50OiB7XG4gICAgICBzcmM6ICAgIGZTcmMsXG4gICAgICBzaGFkZXI6IGZzIFxuICAgIH0sXG4gICAgcHJvZ3JhbTogICAgcHJvZ3JhbSxcbiAgICB1bmlmb3JtczogICB7fSwgXG4gICAgYXR0cmlidXRlczoge30sXG4gICAgYnVmZmVyczogICAge31cbiAgfVxuICB2YXIgYU5hbWVcbiAgdmFyIHVOYW1lXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1BdHRyaWJ1dGVzOyArK2kpIHtcbiAgICBhTmFtZSAgICAgICAgICAgICAgICA9IGdsLmdldEFjdGl2ZUF0dHJpYihwcm9ncmFtLCBpKS5uYW1lXG4gICAgbHAuYXR0cmlidXRlc1thTmFtZV0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBhTmFtZSlcbiAgICBscC5idWZmZXJzW2FOYW1lXSAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIH1cblxuICBmb3IgKHZhciBqID0gMDsgaiA8IG51bVVuaWZvcm1zOyArK2opIHtcbiAgICB1TmFtZSAgICAgICAgICAgICAgPSBnbC5nZXRBY3RpdmVVbmlmb3JtKHByb2dyYW0sIGopLm5hbWVcbiAgICBscC51bmlmb3Jtc1t1TmFtZV0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgdU5hbWUpXG4gIH1cblxuICByZXR1cm4gbHAgXG59XG5cbnV0aWxzLmNsZWFyQ29udGV4dCAgPSBjbGVhckNvbnRleHRcbnV0aWxzLnVwZGF0ZUJ1ZmZlciAgPSB1cGRhdGVCdWZmZXJcbnV0aWxzLkxvYWRlZFByb2dyYW0gPSBMb2FkZWRQcm9ncmFtXG5tb2R1bGUuZXhwb3J0cyAgICAgID0gdXRpbHNcbiIsInZhciBwcm9kYXNoICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIHV1aWQgICAgICA9IHJlcXVpcmUoXCJub2RlLXV1aWRcIilcbnZhciB0cmFuc2R1Y2UgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLnRyYW5zZHVjZVxudmFyIGZpbHRlcmluZyA9IHByb2Rhc2gudHJhbnNkdWNlcnMuZmlsdGVyaW5nXG52YXIgY29ucyAgICAgID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5jb25zXG52YXIgZXh0ZW5kICAgID0gcHJvZGFzaC5vYmplY3QuZXh0ZW5kXG52YXIgY3VycnkgICAgID0gcHJvZGFzaC5mdW5jdGlvbnMuY3VycnlcbnZhciByZW1vdmUgICAgPSBwcm9kYXNoLmFycmF5LnJlbW92ZVxudmFyIGdyYXBoICAgICA9IHt9XG5cbnZhciBOb2RlID0gZnVuY3Rpb24gKGhhc2gpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIE5vZGUpKSByZXR1cm4gbmV3IE5vZGUoaGFzaCkgXG5cbiAgZXh0ZW5kKHRoaXMsIGhhc2gpXG4gIHRoaXMuaWQgICAgICAgPSB0aGlzLmlkIHx8IHV1aWQudjQoKVxuICB0aGlzLnBhcmVudElkID0gdGhpcy5wYXJlbnRJZCB8fCBudWxsXG4gIHRoaXMuY2hpbGRJZHMgPSB0aGlzLmNoaWxkSWRzIHx8IFtdXG59XG5cbnZhciBHcmFwaCA9IGZ1bmN0aW9uIChyb290Tm9kZSkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgR3JhcGgpKSByZXR1cm4gbmV3IEdyYXBoXG4gIHZhciByb290Tm9kZSA9IHJvb3ROb2RlIHx8IE5vZGUoeyBpZDogdXVpZC52NCgpIH0pXG5cbiAgdGhpcy5ub2RlcyAgICAgICAgICAgICAgPSB7fVxuICB0aGlzLnJvb3ROb2RlSWQgICAgICAgICA9IHJvb3ROb2RlLmlkXG4gIHRoaXMubm9kZXNbcm9vdE5vZGUuaWRdID0gcm9vdE5vZGVcbn1cblxuLy91c2VkIGludGVybmFsbHkgYnkgZ3JhcGguX19yZWR1Y2UgdG8gc3VwcG9ydCBpdGVyYXRpb25cbnZhciBub2RlUmVkdWNlID0gZnVuY3Rpb24gKHJlZEZuLCBub2RlSWQsIGFjY3VtLCBncmFwaCkge1xuICB2YXIgbm9kZSA9IGdyYXBoLm5vZGVzW25vZGVJZF1cblxuICBhY2N1bSA9IHJlZEZuKGFjY3VtLCBub2RlKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZElkcy5sZW5ndGg7ICsraSkge1xuICAgIGFjY3VtID0gbm9kZVJlZHVjZShyZWRGbiwgbm9kZS5jaGlsZElkc1tpXSwgYWNjdW0sIGdyYXBoKSAgIFxuICB9XG4gIHJldHVybiBhY2N1bVxufVxuXG4vL0dyYXBoIC0+IFN0cmluZyAtPiBOb2RlIC0+IFZvaWRcbnZhciBhdHRhY2hCeUlkID0gY3VycnkoZnVuY3Rpb24gKGdyYXBoLCBwYXJlbnRJZCwgbm9kZSkge1xuICBpZighZ3JhcGgubm9kZXNbcGFyZW50SWRdKSB0aHJvdyBuZXcgRXJyb3IocGFyZW50SWQgKyBcIiBub3QgZm91bmQgaW4gZ3JhcGhcIilcbiAgdmFyIG5vZGUgPSBub2RlIGluc3RhbmNlb2YgTm9kZSA/IG5vZGUgOiBOb2RlKG5vZGUpXG5cbiAgZ3JhcGgubm9kZXNbbm9kZS5pZF0gICAgICAgICAgPSBub2RlXG4gIGdyYXBoLm5vZGVzW25vZGUuaWRdLnBhcmVudElkID0gcGFyZW50SWRcbiAgZ3JhcGgubm9kZXNbcGFyZW50SWRdLmNoaWxkSWRzLnB1c2gobm9kZS5pZClcbn0pXG5cbkdyYXBoLnByb3RvdHlwZS5fX3JlZHVjZSA9IGZ1bmN0aW9uIChyZWRGbiwgYWNjdW0sIGdyYXBoKSB7XG4gIHJldHVybiBub2RlUmVkdWNlKHJlZEZuLCBncmFwaC5yb290Tm9kZUlkLCBhY2N1bSwgZ3JhcGgpXG59XG5cbkdyYXBoLnByb3RvdHlwZS5fX2VtcHR5ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IEdyYXBoIH1cblxuZ3JhcGguTm9kZSAgICAgICA9IE5vZGVcbmdyYXBoLkdyYXBoICAgICAgPSBHcmFwaFxuZ3JhcGguYXR0YWNoQnlJZCA9IGF0dGFjaEJ5SWRcbm1vZHVsZS5leHBvcnRzICAgPSBncmFwaFxuIiwidmFyIGZucyAgICAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciBjdXJyeSAgICA9IGZucy5mdW5jdGlvbnMuY3VycnlcbnZhciBsaWZldGltZSA9IHt9XG5cbmxpZmV0aW1lLmtpbGxUaGVPbGQgPSBmdW5jdGlvbiAod29ybGQsIGUpIHtcbiAgdmFyIHRpbWUgPSB3b3JsZC5jbG9jay5uZXdUaW1lXG5cbiAgaWYgKCFlLmxpZmVzcGFuKSAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICBpZiAoZS5saXZpbmcgJiYgdGltZSA+PSBlLnRpbWVUb0RpZSkgZS5saXZpbmcgPSBmYWxzZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpZmV0aW1lXG4iLCJ2YXIgbG9hZGVycyAgPSB7fVxuXG5sb2FkZXJzLmxvYWRTaGFkZXIgPSBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuXG4gIHhoci5yZXNwb25zZVR5cGUgPSBcInN0cmluZ1wiXG4gIHhoci5vbmxvYWQgICAgICAgPSBmdW5jdGlvbiAoKSB7IGNiKG51bGwsIHhoci5yZXNwb25zZSkgfVxuICB4aHIub25lcnJvciAgICAgID0gZnVuY3Rpb24gKCkgeyBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKSB9XG4gIHhoci5vcGVuKFwiR0VUXCIsIHBhdGgsIHRydWUpXG4gIHhoci5zZW5kKG51bGwpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbG9hZGVyc1xuIiwidmFyIGZucyAgICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIGN1cnJ5ICAgPSBmbnMuZnVuY3Rpb25zLmN1cnJ5XG52YXIgcGh5c2ljcyA9IHt9XG5cbnZhciBoYXNQaHlzaWNzID0gZnVuY3Rpb24gKG5vZGUpIHsgXG4gIHJldHVybiAhIW5vZGUucG9zaXRpb24gJiYgISFub2RlLnZlbG9jaXR5ICYmICEhbm9kZS5hY2NlbGVyYXRpb24gXG59XG5waHlzaWNzLnVwZGF0ZVBvc2l0aW9uID0gZnVuY3Rpb24gKGRULCBlKSB7XG4gIGUucG9zaXRpb25bMF0gPSBlLnBvc2l0aW9uWzBdICsgZFQgKiBlLnZlbG9jaXR5WzBdXG4gIGUucG9zaXRpb25bMV0gPSBlLnBvc2l0aW9uWzFdICsgZFQgKiBlLnZlbG9jaXR5WzFdXG4gIGUucG9zaXRpb25bMl0gPSBlLnBvc2l0aW9uWzJdICsgZFQgKiBlLnZlbG9jaXR5WzJdXG4gIHJldHVybiBlXG59XG5cbnBoeXNpY3MudXBkYXRlVmVsb2NpdHkgPSBmdW5jdGlvbiAoZFQsIGUpIHtcbiAgZS52ZWxvY2l0eVswXSA9IGUudmVsb2NpdHlbMF0gKyBkVCAqIGUuYWNjZWxlcmF0aW9uWzBdXG4gIGUudmVsb2NpdHlbMV0gPSBlLnZlbG9jaXR5WzFdICsgZFQgKiBlLmFjY2VsZXJhdGlvblsxXVxuICBlLnZlbG9jaXR5WzJdID0gZS52ZWxvY2l0eVsyXSArIGRUICogZS5hY2NlbGVyYXRpb25bMl1cbiAgcmV0dXJuIGVcbn1cblxucGh5c2ljcy51cGRhdGVQaHlzaWNzID0gZnVuY3Rpb24gKHdvcmxkLCBlKSB7XG4gIGlmICghaGFzUGh5c2ljcyhlKSkgcmV0dXJuXG4gIGlmICghZS5saXZpbmcpICAgICAgcmV0dXJuXG4gIHBoeXNpY3MudXBkYXRlVmVsb2NpdHkod29ybGQuY2xvY2suZFQsIGUpXG4gIHBoeXNpY3MudXBkYXRlUG9zaXRpb24od29ybGQuY2xvY2suZFQsIGUpXG4gIHJldHVybiBlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGh5c2ljc1xuIiwidmFyIHJhbmRvbSA9IHt9XG5cbnJhbmRvbS5yYW5kQm91bmQgPSBmdW5jdGlvbiAobWluLCBtYXgpIHtcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJhbmRvbVxuIiwidmFyIHZlYzMgPSB7fVxuXG52ZWMzLlZlYzMgPSBmdW5jdGlvbiAoeCwgeSwgeikge1xuICB2YXIgb3V0ID0gbmV3IEZsb2F0MzJBcnJheSgzKVxuXG4gIG91dFswXSA9IHhcbiAgb3V0WzFdID0geVxuICBvdXRbMl0gPSB6XG5cbiAgcmV0dXJuIG91dFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzNcbiJdfQ==
