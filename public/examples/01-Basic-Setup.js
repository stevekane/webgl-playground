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
var prodash           = require("prodash")
var async             = require("async")
var fps               = require("fps")
var mat4              = require("gl-mat4")
var graph             = require("../modules/graph")
var types             = require("../modules/types")
var loaders           = require("../modules/loaders")
var utils             = require("../modules/gl-utils")
var random            = require("../modules/random")
var physics           = require("../modules/physics")
var lifetime          = require("../modules/lifetime")
var emitters          = require("../modules/emitters")
var clock             = require("../modules/clock")
var camera            = require("../modules/camera")
var Graph             = graph.Graph
var attachById        = graph.attachById
var partial           = prodash.functions.partial
var LoadedProgram     = types.LoadedProgram
var Particle          = types.Particle
var Emitter           = types.Emitter
var loadShader        = loaders.loadShader
var updateBuffer      = utils.updateBuffer
var clearContext      = utils.clearContext
var randBound         = random.randBound
var updatePhysics     = physics.updatePhysics
var updateEmitter     = emitters.updateEmitter
var killTheOld        = lifetime.killTheOld
var Clock             = clock.Clock
var updateClock       = clock.updateClock
var Camera            = camera.Camera
var updateCamera      = camera.updateCamera
var ticker            = fps({every: 100})
var canvas            = document.getElementById("playground")
var stats             = document.getElementById("stats")
var gl                = canvas.getContext("webgl")
var shaders           = {
  vertex:   "/shaders/01v.glsl",
  fragment: "/shaders/01f.glsl"
}

ticker.on("data", function (val) {
  stats.innerHTML = val | 0
})

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
  var rawSize      = []
  var buildBuffers = function (world, node) {
    if (node.living && node.renderable) {
      rawPositions.push(node.position[0]) 
      rawPositions.push(node.position[1]) 
      rawPositions.push(node.position[2]) 
      rawSizes.push(node.size) 
    }
  }
  var positions 
  var sizes
  //temporary... should refactor
  var lp = world.programs.particle

  return function animate () {
    rawPositions = []
    rawSizes     = []
    updateEntities(buildBuffers, world)
    positions = new Float32Array(rawPositions)
    sizes     = new Float32Array(rawSizes)

    ticker.tick()
    clearContext(gl)
    gl.useProgram(world.programs.particle.program)
    gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
    gl.uniformMatrix4fv(lp.uniforms.uView, false, world.camera.view)
    gl.uniformMatrix4fv(lp.uniforms.uProjection, false, world.camera.projection)
    updateBuffer(gl, 3, lp.attributes.aPosition, lp.buffers.aPosition, positions)
    updateBuffer(gl, 1, lp.attributes.aSize, lp.buffers.aSize, sizes)
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
    camera:   Camera(0, 0, 2, fov, aspect, 1, 10),
    graph:    Graph(),
    programs: {
      particle: particleProgram
    }
  }

  window.world = world
  var buildEmitter = function (transFn) {
    var count  = 8
    var spread = 2
    var diff   = spread / count
    var e

    for (var i = -1 * count; i < 1 * count; i+=.01 * count) {
      e  = Emitter(2000, 10, .004, .4, transFn(i) * diff,  i / count, 0, 1, 0, 1)  
      attachById(world.graph, world.graph.rootNodeId, e)
      for (var j = 0; j < 50; ++j) {
        attachById(world.graph, e.id, Particle(1000, 0, 0, 0))
      }
    }
  }
  buildEmitter(Math.sin)
  setInterval(makeUpdate(world), 25)
  requestAnimationFrame(makeAnimate(gl, world))
})

},{"../modules/camera":10,"../modules/clock":11,"../modules/emitters":12,"../modules/gl-utils":13,"../modules/graph":14,"../modules/lifetime":15,"../modules/loaders":16,"../modules/physics":17,"../modules/random":18,"../modules/types":19,"async":"async","fps":2,"gl-mat4":"gl-mat4","prodash":4}],10:[function(require,module,exports){
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

},{"./vec3":21,"gl-mat4":"gl-mat4"}],11:[function(require,module,exports){
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
var prodash   = require("prodash")
var random    = require("./random")
var find      = prodash.array.find
var curry     = prodash.functions.curry
var randBound = random.randBound
var emitters  = {}

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

/*
  check if it is time to fire a particle, if so, they find
  a particle and give it a velocity in the direction of the emitter
  and a time to die
  N.B. The velocity is affected by both the speed and the spread
*/
emitters.updateEmitter = function (world, e) {
  var time = world.clock.newTime
  var particle 

  if (!e.emitter) return
  if (!e.living)  return
  if (time > e.nextFireTime) {
    particle             = findFirstDead(world.graph, e.childIds)
    particle.timeToDie   = time + particle.lifespan
    particle.living      = true
    particle.size        = randBound(1, 10) | 0
    particle.position[0] = e.position[0]
    particle.position[1] = e.position[1]
    particle.position[2] = e.position[2]
    particle.velocity[0] = scaleAndSpread(e.speed, e.spread, e.direction[0])
    particle.velocity[1] = scaleAndSpread(e.speed, e.spread, e.direction[1])
    particle.velocity[2] = scaleAndSpread(e.speed, e.spread, e.direction[2])
    e.nextFireTime += e.rate
  }
}

module.exports = emitters

},{"./random":18,"prodash":4}],13:[function(require,module,exports){
var utils = {}

utils.clearContext = function (gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
}

utils.updateBuffer = function (gl, chunkSize, attribute, buffer, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  gl.enableVertexAttribArray(attribute)
  gl.vertexAttribPointer(attribute, chunkSize, gl.FLOAT, false, 0, 0)
  return buffer
}

module.exports = utils

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
var prodash = require("prodash")
var uuid    = require("node-uuid")
var vec3    = require("../modules/vec3")
var vec2    = require("../modules/vec2")
var Vec2    = vec2.Vec2
var Vec3    = vec3.Vec3
var types   = {}

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
types.LoadedProgram = function (gl, vSrc, fSrc) {
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

types.Particle = function (lifespan, px, py, pz) {
  return {
    id:           uuid.v4(),
    position:     Vec3(px, py, pz),
    velocity:     Vec3(0, 0, 0),
    acceleration: Vec3(0, -0.0000015, 0),
    renderable:   true,
    size:         4.0,
    timeToDie:    0,
    lifespan:     lifespan,
    living:       false
  }
}

types.Emitter = function (lifespan, rate, speed, spread, px, py, pz, dx, dy, dz) {
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

module.exports = types

},{"../modules/vec2":20,"../modules/vec3":21,"node-uuid":"node-uuid","prodash":4}],20:[function(require,module,exports){
var vec2 = {}

vec2.Vec2 = function (x, y) {
  var out = new Float32Array(2)

  out[0] = x
  out[1] = y

  return out
}

module.exports = vec2

},{}],21:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvaW5kZXguanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9wcm9kYXNoLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvYXJyYXkuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9vYmplY3QuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy90cmFuc2R1Y2Vycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL2V4YW1wbGVzLzAxLUJhc2ljLVNldHVwLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9jYW1lcmEuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2Nsb2NrLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9lbWl0dGVycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvZ2wtdXRpbHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2dyYXBoLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9saWZldGltZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbG9hZGVycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvcGh5c2ljcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvcmFuZG9tLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy90eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvdmVjMi5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvdmVjMy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKS5FdmVudEVtaXR0ZXJcbiAgLCBpbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJylcblxubW9kdWxlLmV4cG9ydHMgPSBmcHNcblxuLy8gVHJ5IHVzZSBwZXJmb3JtYW5jZS5ub3coKSwgb3RoZXJ3aXNlIHRyeVxuLy8gK25ldyBEYXRlLlxudmFyIG5vdyA9IChcbiAgKGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzIH0oKSkucGVyZm9ybWFuY2UgJiZcbiAgJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIHBlcmZvcm1hbmNlLm5vd1xuKSA/IGZ1bmN0aW9uKCkgeyByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCkgfVxuICA6IERhdGUubm93IHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4gK25ldyBEYXRlIH1cblxuZnVuY3Rpb24gZnBzKG9wdHMpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIGZwcykpIHJldHVybiBuZXcgZnBzKG9wdHMpXG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpXG5cbiAgb3B0cyA9IG9wdHMgfHwge31cbiAgdGhpcy5sYXN0ID0gbm93KClcbiAgdGhpcy5yYXRlID0gMFxuICB0aGlzLnRpbWUgPSAwXG4gIHRoaXMuZGVjYXkgPSBvcHRzLmRlY2F5IHx8IDFcbiAgdGhpcy5ldmVyeSA9IG9wdHMuZXZlcnkgfHwgMVxuICB0aGlzLnRpY2tzID0gMFxufVxuaW5oZXJpdHMoZnBzLCBFdmVudEVtaXR0ZXIpXG5cbmZwcy5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdGltZSA9IG5vdygpXG4gICAgLCBkaWZmID0gdGltZSAtIHRoaXMubGFzdFxuICAgICwgZnBzID0gZGlmZlxuXG4gIHRoaXMudGlja3MgKz0gMVxuICB0aGlzLmxhc3QgPSB0aW1lXG4gIHRoaXMudGltZSArPSAoZnBzIC0gdGhpcy50aW1lKSAqIHRoaXMuZGVjYXlcbiAgdGhpcy5yYXRlID0gMTAwMCAvIHRoaXMudGltZVxuICBpZiAoISh0aGlzLnRpY2tzICUgdGhpcy5ldmVyeSkpIHRoaXMuZW1pdCgnZGF0YScsIHRoaXMucmF0ZSlcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBpbmhlcml0c1xuXG5mdW5jdGlvbiBpbmhlcml0cyAoYywgcCwgcHJvdG8pIHtcbiAgcHJvdG8gPSBwcm90byB8fCB7fVxuICB2YXIgZSA9IHt9XG4gIDtbYy5wcm90b3R5cGUsIHByb3RvXS5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocykuZm9yRWFjaChmdW5jdGlvbiAoaykge1xuICAgICAgZVtrXSA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocywgaylcbiAgICB9KVxuICB9KVxuICBjLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocC5wcm90b3R5cGUsIGUpXG4gIGMuc3VwZXIgPSBwXG59XG5cbi8vZnVuY3Rpb24gQ2hpbGQgKCkge1xuLy8gIENoaWxkLnN1cGVyLmNhbGwodGhpcylcbi8vICBjb25zb2xlLmVycm9yKFt0aGlzXG4vLyAgICAgICAgICAgICAgICAsdGhpcy5jb25zdHJ1Y3RvclxuLy8gICAgICAgICAgICAgICAgLHRoaXMuY29uc3RydWN0b3IgPT09IENoaWxkXG4vLyAgICAgICAgICAgICAgICAsdGhpcy5jb25zdHJ1Y3Rvci5zdXBlciA9PT0gUGFyZW50XG4vLyAgICAgICAgICAgICAgICAsT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpID09PSBDaGlsZC5wcm90b3R5cGVcbi8vICAgICAgICAgICAgICAgICxPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpKVxuLy8gICAgICAgICAgICAgICAgID09PSBQYXJlbnQucHJvdG90eXBlXG4vLyAgICAgICAgICAgICAgICAsdGhpcyBpbnN0YW5jZW9mIENoaWxkXG4vLyAgICAgICAgICAgICAgICAsdGhpcyBpbnN0YW5jZW9mIFBhcmVudF0pXG4vL31cbi8vZnVuY3Rpb24gUGFyZW50ICgpIHt9XG4vL2luaGVyaXRzKENoaWxkLCBQYXJlbnQpXG4vL25ldyBDaGlsZFxuIiwidmFyIHByb2Rhc2ggPSB7XG4gIGZ1bmN0aW9uczogICByZXF1aXJlKFwiLi9zcmMvZnVuY3Rpb25zXCIpLFxuICB0cmFuc2R1Y2VyczogcmVxdWlyZShcIi4vc3JjL3RyYW5zZHVjZXJzXCIpLFxuICBhcnJheTogICAgICAgcmVxdWlyZShcIi4vc3JjL2FycmF5XCIpLFxuICBvYmplY3Q6ICAgICAgcmVxdWlyZShcIi4vc3JjL29iamVjdFwiKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb2Rhc2hcbiIsInZhciBmbnMgICAgICAgICA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxudmFyIGN1cnJ5ICAgICAgID0gZm5zLmN1cnJ5XG52YXIgZGVtZXRob2RpemUgPSBmbnMuZGVtZXRob2RpemVcbnZhciBhcnJheSAgICAgICA9IHt9XG5cbnZhciBmaW5kID0gY3VycnkoZnVuY3Rpb24gKHByZWRGbiwgYXIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhci5sZW5ndGg7ICsraSkge1xuICAgIGlmIChwcmVkRm4oYXJbaV0pKSByZXR1cm4gYXJbaV0gXG4gIH1cbiAgcmV0dXJuIG51bGxcbn0pXG5cbnZhciBmb3JFYWNoID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIGFyKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXIubGVuZ3RoOyArK2kpIHtcbiAgICBhcltpXSA9IHRyYW5zRm4oYXJbaV0pIFxuICB9XG59KVxuXG52YXIgcmV2ZXJzZSA9IGZ1bmN0aW9uIChsaXN0KSB7XG4gIHZhciBiYWNrd2FyZHMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgYmFja3dhcmRzW2ldID0gbGlzdFtsZW4tMS1pXVxuICB9XG4gIHJldHVybiBiYWNrd2FyZHNcbn1cblxudmFyIGNvbmNhdCA9IGRlbWV0aG9kaXplKEFycmF5LnByb3RvdHlwZSwgXCJjb25jYXRcIilcblxudmFyIGZsYXR0ZW4gPSBmdW5jdGlvbiAoYXJyYXlPZkFycmF5cykge1xuICB2YXIgZmxhdHRlbmVkID0gW11cbiAgdmFyIHN1YmFycmF5XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheU9mQXJyYXlzLmxlbmd0aDsgKytpKSB7XG4gICAgc3ViYXJyYXkgPSBhcnJheU9mQXJyYXlzW2ldXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBzdWJhcnJheS5sZW5ndGg7ICsraikge1xuICAgICAgZmxhdHRlbmVkLnB1c2goc3ViYXJyYXlbal0pIFxuICAgIH1cbiAgfVxuICByZXR1cm4gZmxhdHRlbmVkXG59XG5cbnZhciBwdXNoID0gZnVuY3Rpb24gKGFycmF5LCBlbCkge1xuICBhcnJheS5wdXNoKGVsKVxuICByZXR1cm4gYXJyYXlcbn1cblxudmFyIHVuc2hpZnQgPSBmdW5jdGlvbiAoYXJyYXksIGVsKSB7XG4gIGFycmF5LnVuc2hpZnQoZWwpXG4gIHJldHVybiBhcnJheVxufVxuXG52YXIgc2xpY2UgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCwgYXJyYXkpIHtcbiAgcmV0dXJuIGFycmF5LnNsaWNlKHN0YXJ0LCBlbmQpXG59XG5cbnZhciByZW1vdmUgPSBmdW5jdGlvbiAoZm4sIGFycmF5KSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoZm4oYXJyYXlbaV0pKSB7XG4gICAgICBhcnJheS5zcGxpY2UoaSwgMSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFycmF5XG59XG5cbmFycmF5LmZpbmQgICAgPSBmaW5kXG5hcnJheS5mb3JFYWNoID0gZm9yRWFjaFxuYXJyYXkucmV2ZXJzZSA9IHJldmVyc2VcbmFycmF5LmNvbmNhdCAgPSBjb25jYXRcbmFycmF5LmZsYXR0ZW4gPSBmbGF0dGVuXG5hcnJheS5zbGljZSAgID0gc2xpY2VcbmFycmF5LnB1c2ggICAgPSBwdXNoXG5hcnJheS51bnNoaWZ0ID0gdW5zaGlmdFxuYXJyYXkucmVtb3ZlICA9IHJlbW92ZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5XG4iLCJ2YXIgZm5zID0ge31cblxudmFyIGRlbWV0aG9kaXplID0gZnVuY3Rpb24gKG9iaiwgZm5OYW1lKSB7XG4gIHJldHVybiBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbC5iaW5kKG9ialtmbk5hbWVdKSBcbn1cblxudmFyIGluc3RhbmNlT2YgPSBmdW5jdGlvbiAoY29uc3RydWN0b3IsIGNvbCkgeyBcbiAgcmV0dXJuIGNvbCBpbnN0YW5jZW9mIGNvbnN0cnVjdG9yXG59XG5cbnZhciBhcHBseSA9IGZ1bmN0aW9uIChmbiwgYXJnc0xpc3QpIHsgXG4gIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzTGlzdCkgXG59XG5cbnZhciBjYWxsID0gZnVuY3Rpb24gKGZuKSB7IFxuICB2YXIgYXJncyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoIC0gMTsgKytpKSB7XG4gICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpICsgMV0gXG4gIH1cbiAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3MpIFxufVxuXG52YXIgY29tcG9zZSA9IGZ1bmN0aW9uIChmbnMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGNvbXBvc2VkICh2YWwpIHtcbiAgICBmb3IgKHZhciBpID0gZm5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB2YWwgPSBmbnNbaV0odmFsKVxuICAgIH1cbiAgICByZXR1cm4gdmFsXG4gIH1cbn1cblxudmFyIGZsaXAgPSBmdW5jdGlvbiAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYmFja3dhcmRzID0gW11cblxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIGJhY2t3YXJkc1tpXSA9IGFyZ3VtZW50c1tsZW4tMS1pXVxuICAgIH1cbiAgICByZXR1cm4gYXBwbHkoZm4sIGJhY2t3YXJkcylcbiAgfVxufVxuXG52YXIgcGFydGlhbCA9IGZ1bmN0aW9uIChmbikge1xuICB2YXIgYXJncyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoIC0gMTsgKytpKSB7XG4gICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpICsgMV0gXG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGogPSAwLCBzdGFydGluZ0luZGV4ID0gYXJncy5sZW5ndGg7IGogPCBhcmd1bWVudHMubGVuZ3RoOyArK2opIHtcbiAgICAgIGFyZ3NbaiArIHN0YXJ0aW5nSW5kZXhdID0gYXJndW1lbnRzW2pdIFxuICAgIH1cblxuICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKVxuICB9XG59XG5cbi8vdXRpbGl0eSBmdW5jdGlvbiB1c2VkIGluIGN1cnJ5IGRlZlxudmFyIGlubmVyQ3VycnkgPSBmdW5jdGlvbiAoZm4sIGFyZ3MpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgc3RhcnRpbmdJbmRleCA9IGFyZ3MubGVuZ3RoOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICBhcmdzW2kgKyBzdGFydGluZ0luZGV4XSA9IGFyZ3VtZW50c1tpXSBcbiAgICB9XG5cbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gIH07XG59O1xuXG4vL2FyaXR5IGFyZ3VtZW50IGlzIHVzZWQgbW9zdCBvZnRlbiBpbnRlcm5hbGx5XG52YXIgY3VycnkgPSBmdW5jdGlvbiAoZm4sIGFyaXR5KSB7XG4gIHZhciBmbkFyaXR5ID0gYXJpdHkgfHwgZm4ubGVuZ3RoXG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbWlzc2luZ0FyZ3NDb3VudCA9IGZuQXJpdHkgLSBhcmd1bWVudHMubGVuZ3RoXG4gICAgdmFyIG5vdEVub3VnaEFyZ3MgICAgPSBtaXNzaW5nQXJnc0NvdW50ID4gMFxuICAgIHZhciBhcmdzICAgICAgICAgICAgID0gW11cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICBhcmdzW2ldID0gYXJndW1lbnRzW2ldIFxuICAgIH1cblxuICAgIGlmIChub3RFbm91Z2hBcmdzKSByZXR1cm4gY3VycnkoaW5uZXJDdXJyeShmbiwgYXJncyksIG1pc3NpbmdBcmdzQ291bnQpXG4gICAgZWxzZSAgICAgICAgICAgICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKVxuICB9XG59XG5cbmZucy5kZW1ldGhvZGl6ZSA9IGRlbWV0aG9kaXplXG5mbnMuaW5zdGFuY2VPZiAgPSBpbnN0YW5jZU9mXG5mbnMuZmxpcCAgICAgICAgPSBmbGlwXG5mbnMuY29tcG9zZSAgICAgPSBjb21wb3NlXG5mbnMucGFydGlhbCAgICAgPSBwYXJ0aWFsXG5mbnMuY3VycnkgICAgICAgPSBjdXJyeVxuZm5zLmNhbGwgICAgICAgID0gY2FsbFxuZm5zLmFwcGx5ICAgICAgID0gYXBwbHlcbm1vZHVsZS5leHBvcnRzICA9IGZuc1xuIiwidmFyIGZucyAgICAgICAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgY3VycnkgICAgICAgPSBmbnMuY3VycnlcbnZhciBvYmplY3QgICAgICA9IHt9XG5cbnZhciBleHRlbmQgPSBjdXJyeShmdW5jdGlvbiAoaG9zdCwgb2JqKSB7XG4gIHZhciBrcyA9IE9iamVjdC5rZXlzKG9iailcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtzLmxlbmd0aDsgKytpKSB7XG4gICAgaG9zdFtrc1tpXV0gPSBvYmpba3NbaV1dXG4gIH1cbiAgcmV0dXJuIGhvc3Rcbn0pXG5cbnZhciBoYXNLZXkgPSBjdXJyeShmdW5jdGlvbiAoa2V5LCBlKSB7XG4gIHJldHVybiBlW2tleV0gIT09IHVuZGVmaW5lZFxufSlcblxudmFyIGhhc0tleXMgPSBjdXJyeShmdW5jdGlvbiAoa2V5cywgZSkge1xuICB2YXIgcmVzID0gdHJ1ZVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7ICsraSkge1xuICAgIHJlcyA9IHJlcyAmJiBlW2tleXNbaV1dICE9PSB1bmRlZmluZWRcbiAgfVxuICByZXR1cm4gcmVzXG59KVxuXG5vYmplY3QuaGFzS2V5ICA9IGhhc0tleVxub2JqZWN0Lmhhc0tleXMgPSBoYXNLZXlzXG5vYmplY3QuZXh0ZW5kICA9IGV4dGVuZFxuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFxuIiwidmFyIGZucyAgICAgICAgPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcbnZhciBjdXJyeSAgICAgID0gZm5zLmN1cnJ5XG52YXIgY29tcG9zZSAgICA9IGZucy5jb21wb3NlXG52YXIgaW5zdGFuY2VPZiA9IGZucy5pbnN0YW5jZU9mXG52YXIgdHJhbnMgICAgICA9IHt9XG5cbnZhciByZWRJZGVudGl0eSA9IGZ1bmN0aW9uIChhY2MsIHgpIHsgcmV0dXJuIHggfVxuXG52YXIgcmVkdWNlQXJyYXkgPSBmdW5jdGlvbiAoZm4sIGFjY3VtLCBhcnIpIHtcbiAgdmFyIGluZGV4ID0gLTFcbiAgdmFyIGxlbiAgID0gYXJyLmxlbmd0aFxuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuKSB7XG4gICAgYWNjdW0gPSBmbihhY2N1bSwgYXJyW2luZGV4XSlcbiAgfVxuICByZXR1cm4gYWNjdW1cbn1cblxudmFyIHJlZHVjZU9iamVjdCA9IGZ1bmN0aW9uIChmbiwgYWNjdW0sIG9iaikge1xuICB2YXIgaW5kZXggPSAtMVxuICB2YXIga3MgICAgPSBPYmplY3Qua2V5cyhvYmopXG4gIHZhciBsZW4gICA9IGtzLmxlbmd0aFxuICB2YXIga2V5XG4gIHZhciBrdlxuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuKSB7XG4gICAga2V5ICAgICA9IGtzW2luZGV4XVxuICAgIGt2ICAgICAgPSB7fVxuICAgIGt2W2tleV0gPSBvYmpba2V5XVxuICAgIGFjY3VtICAgPSBmbihhY2N1bSwga3YpXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59XG5cbnZhciBjb25zQXJyYXkgPSBmdW5jdGlvbiAoYXJyYXksIGVsKSB7XG4gIGFycmF5LnB1c2goZWwpXG4gIHJldHVybiBhcnJheVxufVxuXG52YXIgY29uc09iamVjdCA9IGZ1bmN0aW9uIChob3N0LCBvYmopIHtcbiAgdmFyIGtzID0gT2JqZWN0LmtleXMob2JqKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga3MubGVuZ3RoOyArK2kpIHtcbiAgICBob3N0W2tzW2ldXSA9IG9ialtrc1tpXV1cbiAgfVxuICByZXR1cm4gaG9zdFxufVxuXG52YXIgcmVkdWNlID0gY3VycnkoZnVuY3Rpb24gKGZuLCBhY2N1bSwgY29sKSB7XG4gIGlmICAgICAgKGluc3RhbmNlT2YoQXJyYXksIGNvbCkpICAgICAgICByZXR1cm4gcmVkdWNlQXJyYXkoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoRmxvYXQzMkFycmF5LCBjb2wpKSByZXR1cm4gcmVkdWNlQXJyYXkoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoVWludDMyQXJyYXksIGNvbCkpICByZXR1cm4gcmVkdWNlQXJyYXkoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgaWYgKGNvbC5fX3JlZHVjZSAhPT0gdW5kZWZpbmVkKSAgICByZXR1cm4gY29sLl9fcmVkdWNlKGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKE9iamVjdCwgY29sKSkgICAgICAgcmV0dXJuIHJlZHVjZU9iamVjdChmbiwgYWNjdW0sIGNvbClcbiAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gY29sbGVjdGlvbiB0eXBlXCIpXG59KVxuXG52YXIgY29ucyA9IGN1cnJ5KGZ1bmN0aW9uIChjb2wsIGVsKSB7XG4gIGlmICAgICAgKGluc3RhbmNlT2YoQXJyYXksIGNvbCkpICAgcmV0dXJuIGNvbnNBcnJheShjb2wsIGVsKVxuICBlbHNlIGlmIChjb2wuX19jb25zICE9PSB1bmRlZmluZWQpIHJldHVybiBjb2wuX19jb25zKGNvbCwgZWwpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoT2JqZWN0LCBjb2wpKSAgcmV0dXJuIGNvbnNPYmplY3QoY29sLCBlbClcbiAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIGNvbGxlY3Rpb24gdHlwZVwiKVxufSlcblxudmFyIGVtcHR5ID0gZnVuY3Rpb24gKGNvbCkge1xuICBpZiAgICAgIChpbnN0YW5jZU9mKEFycmF5LCBjb2wpKSAgICAgICAgcmV0dXJuIFtdXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoRmxvYXQzMkFycmF5LCBjb2wpKSByZXR1cm4gbmV3IEZsb2F0MzJBcnJheVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKFVpbnQzMkFycmF5LCBjb2wpKSAgcmV0dXJuIG5ldyBVaW50MzJBcnJheVxuICBlbHNlIGlmIChjb2wuX19lbXB0eSAhPT0gdW5kZWZpbmVkKSAgICAgcmV0dXJuIGNvbC5fX2VtcHR5KClcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihPYmplY3QsIGNvbCkpICAgICAgIHJldHVybiB7fVxuICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBjb2xsZWN0aW9uIHR5cGVcIilcbn1cblxudmFyIG1hcHBpbmcgPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgc3RlcEZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgcmV0dXJuIHN0ZXBGbihhY2MsIHRyYW5zRm4oeCkpXG4gIH1cbn0pXG5cbnZhciBwbHVja2luZyA9IGN1cnJ5KGZ1bmN0aW9uIChwcm9wTmFtZSwgc3RlcEZuKSB7XG4gIHJldHVybiBtYXBwaW5nKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4W3Byb3BOYW1lXSB9LCBzdGVwRm4pXG59KVxuXG52YXIgZmlsdGVyaW5nID0gY3VycnkoZnVuY3Rpb24gKHByZWRGbiwgc3RlcEZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgcmV0dXJuIHByZWRGbih4KSA/IHN0ZXBGbihhY2MsIHgpIDogYWNjIFxuICB9XG59KVxuXG52YXIgY2hlY2tpbmcgPSBjdXJyeShmdW5jdGlvbiAocHJvcCwgdmFsLCBzdGVwRm4pIHtcbiAgcmV0dXJuIGZpbHRlcmluZyhmdW5jdGlvbiAoeCkgeyByZXR1cm4geFtwcm9wXSA9PT0gdmFsIH0sIHN0ZXBGbilcbn0pXG5cbi8vVEhJUyBXSUxMIE1VVEFURSBUSEUgU1RSVUNUVVJFIFBST1ZJREVEIFRPIElUIERJUkVDVExZXG52YXIgbXV0YXRpbmcgPSBjdXJyeShmdW5jdGlvbiAobXV0Rm4sIHN0ZXBGbikge1xuICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgIG11dEZuKHgpXG4gICAgcmV0dXJuIHN0ZXBGbihhY2MsIHgpXG4gIH1cbn0pXG5cbnZhciBjYXQgPSBmdW5jdGlvbiAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICByZXR1cm4gcmVkdWNlKGZuLCBhY2MsIHgpIFxuICB9XG59XG5cbnZhciBtYXAgPSBjdXJyeShmdW5jdGlvbiAoZm4sIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKG1hcHBpbmcoZm4sIGNvbnMpLCBlbXB0eShjb2wpLCBjb2wpXG59KVxuXG52YXIgbWFwY2F0dGluZyA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBzdGVwRm4pIHtcbiAgcmV0dXJuIGNvbXBvc2UoW2NhdCwgbWFwcGluZyh0cmFuc0ZuKV0pKHN0ZXBGbilcbn0pXG5cbnZhciBmaWx0ZXIgPSBjdXJyeShmdW5jdGlvbiAocHJlZEZuLCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZShmaWx0ZXJpbmcocHJlZEZuLCBjb25zKSwgZW1wdHkoY29sKSwgY29sKVxufSlcblxudmFyIG11dGF0ZSA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZSh0cmFuc0ZuKHJlZElkZW50aXR5KSwgdW5kZWZpbmVkLCBjb2wpXG59KVxuXG52YXIgdHJhbnNkdWNlID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIHN0ZXBGbiwgaW5pdCwgY29sKSB7XG4gIHJldHVybiByZWR1Y2UodHJhbnNGbihzdGVwRm4pLCBpbml0LCBjb2wpXG59KVxuXG52YXIgc2VxdWVuY2UgPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgY29sKSB7XG4gIHJldHVybiByZWR1Y2UodHJhbnNGbihjb25zKSwgZW1wdHkoY29sKSwgY29sKVxufSlcblxudmFyIGludG8gPSBjdXJyeShmdW5jdGlvbiAodG8sIHRyYW5zRm4sIGZyb20pIHtcbiAgcmV0dXJuIHRyYW5zZHVjZSh0cmFuc0ZuLCBjb25zLCB0bywgZnJvbSlcbn0pXG5cbnRyYW5zLnJlZHVjZSAgICAgPSByZWR1Y2VcbnRyYW5zLmNvbnMgICAgICAgPSBjb25zXG50cmFucy5lbXB0eSAgICAgID0gZW1wdHlcbnRyYW5zLm1hcHBpbmcgICAgPSBtYXBwaW5nXG50cmFucy5wbHVja2luZyAgID0gcGx1Y2tpbmdcbnRyYW5zLmNhdCAgICAgICAgPSBjYXRcbnRyYW5zLmZpbHRlcmluZyAgPSBmaWx0ZXJpbmdcbnRyYW5zLmNoZWNraW5nICAgPSBjaGVja2luZ1xudHJhbnMubWFwICAgICAgICA9IG1hcFxudHJhbnMubWFwY2F0dGluZyA9IG1hcGNhdHRpbmdcbnRyYW5zLm11dGF0aW5nICAgPSBtdXRhdGluZ1xudHJhbnMubXV0YXRlICAgICA9IG11dGF0ZVxudHJhbnMuZmlsdGVyICAgICA9IGZpbHRlclxudHJhbnMudHJhbnNkdWNlICA9IHRyYW5zZHVjZVxudHJhbnMuc2VxdWVuY2UgICA9IHNlcXVlbmNlXG50cmFucy5pbnRvICAgICAgID0gaW50b1xubW9kdWxlLmV4cG9ydHMgICA9IHRyYW5zXG4iLCJ2YXIgcHJvZGFzaCAgICAgICAgICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIGFzeW5jICAgICAgICAgICAgID0gcmVxdWlyZShcImFzeW5jXCIpXG52YXIgZnBzICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiZnBzXCIpXG52YXIgbWF0NCAgICAgICAgICAgICAgPSByZXF1aXJlKFwiZ2wtbWF0NFwiKVxudmFyIGdyYXBoICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvZ3JhcGhcIilcbnZhciB0eXBlcyAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL3R5cGVzXCIpXG52YXIgbG9hZGVycyAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9sb2FkZXJzXCIpXG52YXIgdXRpbHMgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9nbC11dGlsc1wiKVxudmFyIHJhbmRvbSAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvcmFuZG9tXCIpXG52YXIgcGh5c2ljcyAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9waHlzaWNzXCIpXG52YXIgbGlmZXRpbWUgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9saWZldGltZVwiKVxudmFyIGVtaXR0ZXJzICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvZW1pdHRlcnNcIilcbnZhciBjbG9jayAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2Nsb2NrXCIpXG52YXIgY2FtZXJhICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9jYW1lcmFcIilcbnZhciBHcmFwaCAgICAgICAgICAgICA9IGdyYXBoLkdyYXBoXG52YXIgYXR0YWNoQnlJZCAgICAgICAgPSBncmFwaC5hdHRhY2hCeUlkXG52YXIgcGFydGlhbCAgICAgICAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5wYXJ0aWFsXG52YXIgTG9hZGVkUHJvZ3JhbSAgICAgPSB0eXBlcy5Mb2FkZWRQcm9ncmFtXG52YXIgUGFydGljbGUgICAgICAgICAgPSB0eXBlcy5QYXJ0aWNsZVxudmFyIEVtaXR0ZXIgICAgICAgICAgID0gdHlwZXMuRW1pdHRlclxudmFyIGxvYWRTaGFkZXIgICAgICAgID0gbG9hZGVycy5sb2FkU2hhZGVyXG52YXIgdXBkYXRlQnVmZmVyICAgICAgPSB1dGlscy51cGRhdGVCdWZmZXJcbnZhciBjbGVhckNvbnRleHQgICAgICA9IHV0aWxzLmNsZWFyQ29udGV4dFxudmFyIHJhbmRCb3VuZCAgICAgICAgID0gcmFuZG9tLnJhbmRCb3VuZFxudmFyIHVwZGF0ZVBoeXNpY3MgICAgID0gcGh5c2ljcy51cGRhdGVQaHlzaWNzXG52YXIgdXBkYXRlRW1pdHRlciAgICAgPSBlbWl0dGVycy51cGRhdGVFbWl0dGVyXG52YXIga2lsbFRoZU9sZCAgICAgICAgPSBsaWZldGltZS5raWxsVGhlT2xkXG52YXIgQ2xvY2sgICAgICAgICAgICAgPSBjbG9jay5DbG9ja1xudmFyIHVwZGF0ZUNsb2NrICAgICAgID0gY2xvY2sudXBkYXRlQ2xvY2tcbnZhciBDYW1lcmEgICAgICAgICAgICA9IGNhbWVyYS5DYW1lcmFcbnZhciB1cGRhdGVDYW1lcmEgICAgICA9IGNhbWVyYS51cGRhdGVDYW1lcmFcbnZhciB0aWNrZXIgICAgICAgICAgICA9IGZwcyh7ZXZlcnk6IDEwMH0pXG52YXIgY2FudmFzICAgICAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBsYXlncm91bmRcIilcbnZhciBzdGF0cyAgICAgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhdHNcIilcbnZhciBnbCAgICAgICAgICAgICAgICA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIilcbnZhciBzaGFkZXJzICAgICAgICAgICA9IHtcbiAgdmVydGV4OiAgIFwiL3NoYWRlcnMvMDF2Lmdsc2xcIixcbiAgZnJhZ21lbnQ6IFwiL3NoYWRlcnMvMDFmLmdsc2xcIlxufVxuXG50aWNrZXIub24oXCJkYXRhXCIsIGZ1bmN0aW9uICh2YWwpIHtcbiAgc3RhdHMuaW5uZXJIVE1MID0gdmFsIHwgMFxufSlcblxuLy8oV29ybGQgLT4gTm9kZSkgLT4gU3RyaW5nIC0+IFdvcmxkIC0+IFZvaWRcbnZhciBmb3JFYWNoTm9kZSA9IGZ1bmN0aW9uIChmbiwgbm9kZUlkLCB3b3JsZCkge1xuICB2YXIgbm9kZSA9IHdvcmxkLmdyYXBoLm5vZGVzW25vZGVJZF1cblxuICBmbih3b3JsZCwgbm9kZSlcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgZm9yRWFjaE5vZGUoZm4sIG5vZGUuY2hpbGRJZHNbaV0sIHdvcmxkKVxuICB9XG59XG5cbi8vKFdvcmxkIC0+IE5vZGUpIC0+IFdvcmxkIC0+IFZvaWRcbnZhciB1cGRhdGVFbnRpdGllcyA9IGZ1bmN0aW9uIChmbiwgd29ybGQpIHtcbiAgZm9yRWFjaE5vZGUoZm4sIHdvcmxkLmdyYXBoLnJvb3ROb2RlSWQsIHdvcmxkKVxufVxuXG5mdW5jdGlvbiBtYWtlVXBkYXRlICh3b3JsZCkge1xuICB1cGRhdGVDbG9jayh3b3JsZC5jbG9jaywgcGVyZm9ybWFuY2Uubm93KCkpXG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xuICAgIHVwZGF0ZUNsb2NrKHdvcmxkLmNsb2NrLCBwZXJmb3JtYW5jZS5ub3coKSlcbiAgICB1cGRhdGVDYW1lcmEod29ybGQsIHdvcmxkLmNhbWVyYSlcbiAgICB1cGRhdGVFbnRpdGllcyhraWxsVGhlT2xkLCB3b3JsZClcbiAgICB1cGRhdGVFbnRpdGllcyh1cGRhdGVQaHlzaWNzLCB3b3JsZClcbiAgICB1cGRhdGVFbnRpdGllcyh1cGRhdGVFbWl0dGVyLCB3b3JsZClcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlQW5pbWF0ZSAoZ2wsIHdvcmxkKSB7XG4gIHZhciByYXdQb3NpdGlvbnMgPSBbXVxuICB2YXIgcmF3U2l6ZSAgICAgID0gW11cbiAgdmFyIGJ1aWxkQnVmZmVycyA9IGZ1bmN0aW9uICh3b3JsZCwgbm9kZSkge1xuICAgIGlmIChub2RlLmxpdmluZyAmJiBub2RlLnJlbmRlcmFibGUpIHtcbiAgICAgIHJhd1Bvc2l0aW9ucy5wdXNoKG5vZGUucG9zaXRpb25bMF0pIFxuICAgICAgcmF3UG9zaXRpb25zLnB1c2gobm9kZS5wb3NpdGlvblsxXSkgXG4gICAgICByYXdQb3NpdGlvbnMucHVzaChub2RlLnBvc2l0aW9uWzJdKSBcbiAgICAgIHJhd1NpemVzLnB1c2gobm9kZS5zaXplKSBcbiAgICB9XG4gIH1cbiAgdmFyIHBvc2l0aW9ucyBcbiAgdmFyIHNpemVzXG4gIC8vdGVtcG9yYXJ5Li4uIHNob3VsZCByZWZhY3RvclxuICB2YXIgbHAgPSB3b3JsZC5wcm9ncmFtcy5wYXJ0aWNsZVxuXG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcbiAgICByYXdQb3NpdGlvbnMgPSBbXVxuICAgIHJhd1NpemVzICAgICA9IFtdXG4gICAgdXBkYXRlRW50aXRpZXMoYnVpbGRCdWZmZXJzLCB3b3JsZClcbiAgICBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KHJhd1Bvc2l0aW9ucylcbiAgICBzaXplcyAgICAgPSBuZXcgRmxvYXQzMkFycmF5KHJhd1NpemVzKVxuXG4gICAgdGlja2VyLnRpY2soKVxuICAgIGNsZWFyQ29udGV4dChnbClcbiAgICBnbC51c2VQcm9ncmFtKHdvcmxkLnByb2dyYW1zLnBhcnRpY2xlLnByb2dyYW0pXG4gICAgZ2wudW5pZm9ybTRmKGxwLnVuaWZvcm1zLnVDb2xvciwgMS4wLCAwLjAsIDAuMCwgMS4wKVxuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYobHAudW5pZm9ybXMudVZpZXcsIGZhbHNlLCB3b3JsZC5jYW1lcmEudmlldylcbiAgICBnbC51bmlmb3JtTWF0cml4NGZ2KGxwLnVuaWZvcm1zLnVQcm9qZWN0aW9uLCBmYWxzZSwgd29ybGQuY2FtZXJhLnByb2plY3Rpb24pXG4gICAgdXBkYXRlQnVmZmVyKGdsLCAzLCBscC5hdHRyaWJ1dGVzLmFQb3NpdGlvbiwgbHAuYnVmZmVycy5hUG9zaXRpb24sIHBvc2l0aW9ucylcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIDEsIGxwLmF0dHJpYnV0ZXMuYVNpemUsIGxwLmJ1ZmZlcnMuYVNpemUsIHNpemVzKVxuICAgIGdsLmRyYXdBcnJheXMoZ2wuUE9JTlRTLCAwLCBwb3NpdGlvbnMubGVuZ3RoIC8gMylcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSkgXG4gIH1cbn1cblxuYXN5bmMucGFyYWxsZWwoe1xuICB2ZXJ0ZXg6ICAgcGFydGlhbChsb2FkU2hhZGVyLCBcIi9zaGFkZXJzLzAxdi5nbHNsXCIpLFxuICBmcmFnbWVudDogcGFydGlhbChsb2FkU2hhZGVyLCBcIi9zaGFkZXJzLzAxZi5nbHNsXCIpXG59LCBmdW5jdGlvbiAoZXJyLCBzaGFkZXJzKSB7XG4gIHZhciBmb3YgICAgICAgICAgICAgPSAuNSAqIE1hdGguUElcbiAgdmFyIGFzcGVjdCAgICAgICAgICA9IGNhbnZhcy5jbGllbnRXaWR0aCAvIGNhbnZhcy5jbGllbnRIZWlnaHRcbiAgdmFyIHBhcnRpY2xlUHJvZ3JhbSA9IExvYWRlZFByb2dyYW0oZ2wsIHNoYWRlcnMudmVydGV4LCBzaGFkZXJzLmZyYWdtZW50KVxuICB2YXIgd29ybGQgICAgICAgICAgID0ge1xuICAgIGNsb2NrOiAgICBDbG9jayhwZXJmb3JtYW5jZS5ub3coKSksXG4gICAgY2FtZXJhOiAgIENhbWVyYSgwLCAwLCAyLCBmb3YsIGFzcGVjdCwgMSwgMTApLFxuICAgIGdyYXBoOiAgICBHcmFwaCgpLFxuICAgIHByb2dyYW1zOiB7XG4gICAgICBwYXJ0aWNsZTogcGFydGljbGVQcm9ncmFtXG4gICAgfVxuICB9XG5cbiAgd2luZG93LndvcmxkID0gd29ybGRcbiAgdmFyIGJ1aWxkRW1pdHRlciA9IGZ1bmN0aW9uICh0cmFuc0ZuKSB7XG4gICAgdmFyIGNvdW50ICA9IDhcbiAgICB2YXIgc3ByZWFkID0gMlxuICAgIHZhciBkaWZmICAgPSBzcHJlYWQgLyBjb3VudFxuICAgIHZhciBlXG5cbiAgICBmb3IgKHZhciBpID0gLTEgKiBjb3VudDsgaSA8IDEgKiBjb3VudDsgaSs9LjAxICogY291bnQpIHtcbiAgICAgIGUgID0gRW1pdHRlcigyMDAwLCAxMCwgLjAwNCwgLjQsIHRyYW5zRm4oaSkgKiBkaWZmLCAgaSAvIGNvdW50LCAwLCAxLCAwLCAxKSAgXG4gICAgICBhdHRhY2hCeUlkKHdvcmxkLmdyYXBoLCB3b3JsZC5ncmFwaC5yb290Tm9kZUlkLCBlKVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCA1MDsgKytqKSB7XG4gICAgICAgIGF0dGFjaEJ5SWQod29ybGQuZ3JhcGgsIGUuaWQsIFBhcnRpY2xlKDEwMDAsIDAsIDAsIDApKVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBidWlsZEVtaXR0ZXIoTWF0aC5zaW4pXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUod29ybGQpLCAyNSlcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VBbmltYXRlKGdsLCB3b3JsZCkpXG59KVxuIiwidmFyIG1hdDQgICAgID0gcmVxdWlyZShcImdsLW1hdDRcIilcbnZhciB2ZWMzICAgICA9IHJlcXVpcmUoXCIuL3ZlYzNcIilcbnZhciBWZWMzICAgICA9IHZlYzMuVmVjM1xudmFyIHJvdFNwZWVkID0gTWF0aC5QSSAvIDE4MDBcbnZhciBjYW1lcmEgICA9IHt9XG5cblxudmFyIENhbWVyYSA9IGZ1bmN0aW9uICh4LCB5LCB6LCBmb3YsIGFzcGVjdCwgbmVhciwgZmFyKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDYW1lcmEpKSByZXR1cm4gbmV3IENhbWVyYSh4LCB5LCB6LCBmb3YsIGFzcGVjdCwgbmVhciwgZmFyKVxuXG4gIHRoaXMucG9zaXRpb24gICA9IFZlYzMoeCwgeSAseilcbiAgdGhpcy5mb3YgICAgICAgID0gZm92XG4gIHRoaXMubmVhciAgICAgICA9IG5lYXJcbiAgdGhpcy5mYXIgICAgICAgID0gZmFyXG4gIHRoaXMuYXNwZWN0ICAgICA9IGFzcGVjdFxuICB0aGlzLnByb2plY3Rpb24gPSBtYXQ0LnBlcnNwZWN0aXZlKG1hdDQuY3JlYXRlKCksIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpXG5cbiAgdGhpcy5leWUgICAgICAgID0gVmVjMyh4LCB5LCB6KVxuICB0aGlzLmxvb2tBdCAgICAgPSBWZWMzKDAsIDAsIDApXG4gIHRoaXMudXAgICAgICAgICA9IFZlYzMoMCwgMSwgMClcbiAgdGhpcy52aWV3ICAgICAgID0gbWF0NC5sb29rQXQobWF0NC5jcmVhdGUoKSwgdGhpcy5leWUsIHRoaXMubG9va0F0LCB0aGlzLnVwKVxufVxuXG52YXIgdXBkYXRlQ2FtZXJhID0gZnVuY3Rpb24gKHdvcmxkLCBjYW1lcmEpIHtcbiAgdmFyIGRUICAgPSB3b3JsZC5jbG9jay5kVFxuICB2YXIgdmlldyA9IHdvcmxkLmNhbWVyYS52aWV3XG5cbiAgbWF0NC5yb3RhdGVZKHZpZXcsIHZpZXcsIHJvdFNwZWVkICogZFQpXG59XG5cblxuY2FtZXJhLkNhbWVyYSAgICAgICA9IENhbWVyYVxuY2FtZXJhLnVwZGF0ZUNhbWVyYSA9IHVwZGF0ZUNhbWVyYVxubW9kdWxlLmV4cG9ydHMgPSBjYW1lcmFcbiIsInZhciBjbG9jayA9IHt9XG5cbnZhciBDbG9jayA9IGZ1bmN0aW9uIChub3cpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENsb2NrKSkgcmV0dXJuIG5ldyBDbG9jayhub3cpXG4gIHRoaXMub2xkVGltZSA9IG5vd1xuICB0aGlzLm5ld1RpbWUgPSBub3dcbiAgdGhpcy5kVCAgICAgID0gdGhpcy5uZXdUaW1lIC0gdGhpcy5vbGRUaW1lXG59XG5cbnZhciB1cGRhdGVDbG9jayA9IGZ1bmN0aW9uIChjbG9jaywgbmV3VGltZSkge1xuICBjbG9jay5vbGRUaW1lID0gY2xvY2submV3VGltZVxuICBjbG9jay5uZXdUaW1lID0gbmV3VGltZVxuICBjbG9jay5kVCAgICAgID0gY2xvY2submV3VGltZSAtIGNsb2NrLm9sZFRpbWVcbn1cblxuY2xvY2suQ2xvY2sgICAgICAgPSBDbG9ja1xuY2xvY2sudXBkYXRlQ2xvY2sgPSB1cGRhdGVDbG9ja1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb2NrXG4iLCJ2YXIgcHJvZGFzaCAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciByYW5kb20gICAgPSByZXF1aXJlKFwiLi9yYW5kb21cIilcbnZhciBmaW5kICAgICAgPSBwcm9kYXNoLmFycmF5LmZpbmRcbnZhciBjdXJyeSAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5jdXJyeVxudmFyIHJhbmRCb3VuZCA9IHJhbmRvbS5yYW5kQm91bmRcbnZhciBlbWl0dGVycyAgPSB7fVxuXG52YXIgc2NhbGVBbmRTcHJlYWQgPSBmdW5jdGlvbiAoc2NhbGUsIHNwcmVhZCwgdmFsKSB7XG4gIHJldHVybiBzY2FsZSAqICh2YWwgKyByYW5kQm91bmQoLTEgKiBzcHJlYWQsIHNwcmVhZCkpXG59XG5cbnZhciBmaW5kRmlyc3REZWFkID0gZnVuY3Rpb24gKGdyYXBoLCBjaGlsZElkcykge1xuICB2YXIgZm91bmRcbiAgdmFyIGNoaWxkTm9kZVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRJZHMubGVuZ3RoOyArK2kpIHtcbiAgICBjaGlsZE5vZGUgPSBncmFwaC5ub2Rlc1tjaGlsZElkc1tpXV1cbiAgICBmb3VuZCA9IGNoaWxkTm9kZS5saXZpbmcgPyBmb3VuZCA6IGNoaWxkTm9kZVxuICB9XG4gIHJldHVybiBmb3VuZFxufVxuXG4vKlxuICBjaGVjayBpZiBpdCBpcyB0aW1lIHRvIGZpcmUgYSBwYXJ0aWNsZSwgaWYgc28sIHRoZXkgZmluZFxuICBhIHBhcnRpY2xlIGFuZCBnaXZlIGl0IGEgdmVsb2NpdHkgaW4gdGhlIGRpcmVjdGlvbiBvZiB0aGUgZW1pdHRlclxuICBhbmQgYSB0aW1lIHRvIGRpZVxuICBOLkIuIFRoZSB2ZWxvY2l0eSBpcyBhZmZlY3RlZCBieSBib3RoIHRoZSBzcGVlZCBhbmQgdGhlIHNwcmVhZFxuKi9cbmVtaXR0ZXJzLnVwZGF0ZUVtaXR0ZXIgPSBmdW5jdGlvbiAod29ybGQsIGUpIHtcbiAgdmFyIHRpbWUgPSB3b3JsZC5jbG9jay5uZXdUaW1lXG4gIHZhciBwYXJ0aWNsZSBcblxuICBpZiAoIWUuZW1pdHRlcikgcmV0dXJuXG4gIGlmICghZS5saXZpbmcpICByZXR1cm5cbiAgaWYgKHRpbWUgPiBlLm5leHRGaXJlVGltZSkge1xuICAgIHBhcnRpY2xlICAgICAgICAgICAgID0gZmluZEZpcnN0RGVhZCh3b3JsZC5ncmFwaCwgZS5jaGlsZElkcylcbiAgICBwYXJ0aWNsZS50aW1lVG9EaWUgICA9IHRpbWUgKyBwYXJ0aWNsZS5saWZlc3BhblxuICAgIHBhcnRpY2xlLmxpdmluZyAgICAgID0gdHJ1ZVxuICAgIHBhcnRpY2xlLnNpemUgICAgICAgID0gcmFuZEJvdW5kKDEsIDEwKSB8IDBcbiAgICBwYXJ0aWNsZS5wb3NpdGlvblswXSA9IGUucG9zaXRpb25bMF1cbiAgICBwYXJ0aWNsZS5wb3NpdGlvblsxXSA9IGUucG9zaXRpb25bMV1cbiAgICBwYXJ0aWNsZS5wb3NpdGlvblsyXSA9IGUucG9zaXRpb25bMl1cbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVswXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblswXSlcbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVsxXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblsxXSlcbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVsyXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblsyXSlcbiAgICBlLm5leHRGaXJlVGltZSArPSBlLnJhdGVcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVtaXR0ZXJzXG4iLCJ2YXIgdXRpbHMgPSB7fVxuXG51dGlscy5jbGVhckNvbnRleHQgPSBmdW5jdGlvbiAoZ2wpIHtcbiAgZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApXG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXG59XG5cbnV0aWxzLnVwZGF0ZUJ1ZmZlciA9IGZ1bmN0aW9uIChnbCwgY2h1bmtTaXplLCBhdHRyaWJ1dGUsIGJ1ZmZlciwgZGF0YSkge1xuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShhdHRyaWJ1dGUpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoYXR0cmlidXRlLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzXG4iLCJ2YXIgcHJvZGFzaCAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciB1dWlkICAgICAgPSByZXF1aXJlKFwibm9kZS11dWlkXCIpXG52YXIgdHJhbnNkdWNlID0gcHJvZGFzaC50cmFuc2R1Y2Vycy50cmFuc2R1Y2VcbnZhciBmaWx0ZXJpbmcgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLmZpbHRlcmluZ1xudmFyIGNvbnMgICAgICA9IHByb2Rhc2gudHJhbnNkdWNlcnMuY29uc1xudmFyIGV4dGVuZCAgICA9IHByb2Rhc2gub2JqZWN0LmV4dGVuZFxudmFyIGN1cnJ5ICAgICA9IHByb2Rhc2guZnVuY3Rpb25zLmN1cnJ5XG52YXIgcmVtb3ZlICAgID0gcHJvZGFzaC5hcnJheS5yZW1vdmVcbnZhciBncmFwaCAgICAgPSB7fVxuXG52YXIgTm9kZSA9IGZ1bmN0aW9uIChoYXNoKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBOb2RlKSkgcmV0dXJuIG5ldyBOb2RlKGhhc2gpIFxuXG4gIGV4dGVuZCh0aGlzLCBoYXNoKVxuICB0aGlzLmlkICAgICAgID0gdGhpcy5pZCB8fCB1dWlkLnY0KClcbiAgdGhpcy5wYXJlbnRJZCA9IHRoaXMucGFyZW50SWQgfHwgbnVsbFxuICB0aGlzLmNoaWxkSWRzID0gdGhpcy5jaGlsZElkcyB8fCBbXVxufVxuXG52YXIgR3JhcGggPSBmdW5jdGlvbiAocm9vdE5vZGUpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEdyYXBoKSkgcmV0dXJuIG5ldyBHcmFwaFxuICB2YXIgcm9vdE5vZGUgPSByb290Tm9kZSB8fCBOb2RlKHsgaWQ6IHV1aWQudjQoKSB9KVxuXG4gIHRoaXMubm9kZXMgICAgICAgICAgICAgID0ge31cbiAgdGhpcy5yb290Tm9kZUlkICAgICAgICAgPSByb290Tm9kZS5pZFxuICB0aGlzLm5vZGVzW3Jvb3ROb2RlLmlkXSA9IHJvb3ROb2RlXG59XG5cbi8vdXNlZCBpbnRlcm5hbGx5IGJ5IGdyYXBoLl9fcmVkdWNlIHRvIHN1cHBvcnQgaXRlcmF0aW9uXG52YXIgbm9kZVJlZHVjZSA9IGZ1bmN0aW9uIChyZWRGbiwgbm9kZUlkLCBhY2N1bSwgZ3JhcGgpIHtcbiAgdmFyIG5vZGUgPSBncmFwaC5ub2Rlc1tub2RlSWRdXG5cbiAgYWNjdW0gPSByZWRGbihhY2N1bSwgbm9kZSlcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRJZHMubGVuZ3RoOyArK2kpIHtcbiAgICBhY2N1bSA9IG5vZGVSZWR1Y2UocmVkRm4sIG5vZGUuY2hpbGRJZHNbaV0sIGFjY3VtLCBncmFwaCkgICBcbiAgfVxuICByZXR1cm4gYWNjdW1cbn1cblxuLy9HcmFwaCAtPiBTdHJpbmcgLT4gTm9kZSAtPiBWb2lkXG52YXIgYXR0YWNoQnlJZCA9IGN1cnJ5KGZ1bmN0aW9uIChncmFwaCwgcGFyZW50SWQsIG5vZGUpIHtcbiAgaWYoIWdyYXBoLm5vZGVzW3BhcmVudElkXSkgdGhyb3cgbmV3IEVycm9yKHBhcmVudElkICsgXCIgbm90IGZvdW5kIGluIGdyYXBoXCIpXG4gIHZhciBub2RlID0gbm9kZSBpbnN0YW5jZW9mIE5vZGUgPyBub2RlIDogTm9kZShub2RlKVxuXG4gIGdyYXBoLm5vZGVzW25vZGUuaWRdICAgICAgICAgID0gbm9kZVxuICBncmFwaC5ub2Rlc1tub2RlLmlkXS5wYXJlbnRJZCA9IHBhcmVudElkXG4gIGdyYXBoLm5vZGVzW3BhcmVudElkXS5jaGlsZElkcy5wdXNoKG5vZGUuaWQpXG59KVxuXG5HcmFwaC5wcm90b3R5cGUuX19yZWR1Y2UgPSBmdW5jdGlvbiAocmVkRm4sIGFjY3VtLCBncmFwaCkge1xuICByZXR1cm4gbm9kZVJlZHVjZShyZWRGbiwgZ3JhcGgucm9vdE5vZGVJZCwgYWNjdW0sIGdyYXBoKVxufVxuXG5HcmFwaC5wcm90b3R5cGUuX19lbXB0eSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBHcmFwaCB9XG5cbmdyYXBoLk5vZGUgICAgICAgPSBOb2RlXG5ncmFwaC5HcmFwaCAgICAgID0gR3JhcGhcbmdyYXBoLmF0dGFjaEJ5SWQgPSBhdHRhY2hCeUlkXG5tb2R1bGUuZXhwb3J0cyAgID0gZ3JhcGhcbiIsInZhciBmbnMgICAgICA9IHJlcXVpcmUoXCJwcm9kYXNoXCIpXG52YXIgY3VycnkgICAgPSBmbnMuZnVuY3Rpb25zLmN1cnJ5XG52YXIgbGlmZXRpbWUgPSB7fVxuXG5saWZldGltZS5raWxsVGhlT2xkID0gZnVuY3Rpb24gKHdvcmxkLCBlKSB7XG4gIHZhciB0aW1lID0gd29ybGQuY2xvY2submV3VGltZVxuXG4gIGlmICghZS5saWZlc3BhbikgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgaWYgKGUubGl2aW5nICYmIHRpbWUgPj0gZS50aW1lVG9EaWUpIGUubGl2aW5nID0gZmFsc2Vcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsaWZldGltZVxuIiwidmFyIGxvYWRlcnMgID0ge31cblxubG9hZGVycy5sb2FkU2hhZGVyID0gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3RcblxuICB4aHIucmVzcG9uc2VUeXBlID0gXCJzdHJpbmdcIlxuICB4aHIub25sb2FkICAgICAgID0gZnVuY3Rpb24gKCkgeyBjYihudWxsLCB4aHIucmVzcG9uc2UpIH1cbiAgeGhyLm9uZXJyb3IgICAgICA9IGZ1bmN0aW9uICgpIHsgY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSkgfVxuICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICB4aHIuc2VuZChudWxsKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWRlcnNcbiIsInZhciBmbnMgICAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciBjdXJyeSAgID0gZm5zLmZ1bmN0aW9ucy5jdXJyeVxudmFyIHBoeXNpY3MgPSB7fVxuXG52YXIgaGFzUGh5c2ljcyA9IGZ1bmN0aW9uIChub2RlKSB7IFxuICByZXR1cm4gISFub2RlLnBvc2l0aW9uICYmICEhbm9kZS52ZWxvY2l0eSAmJiAhIW5vZGUuYWNjZWxlcmF0aW9uIFxufVxucGh5c2ljcy51cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uIChkVCwgZSkge1xuICBlLnBvc2l0aW9uWzBdID0gZS5wb3NpdGlvblswXSArIGRUICogZS52ZWxvY2l0eVswXVxuICBlLnBvc2l0aW9uWzFdID0gZS5wb3NpdGlvblsxXSArIGRUICogZS52ZWxvY2l0eVsxXVxuICBlLnBvc2l0aW9uWzJdID0gZS5wb3NpdGlvblsyXSArIGRUICogZS52ZWxvY2l0eVsyXVxuICByZXR1cm4gZVxufVxuXG5waHlzaWNzLnVwZGF0ZVZlbG9jaXR5ID0gZnVuY3Rpb24gKGRULCBlKSB7XG4gIGUudmVsb2NpdHlbMF0gPSBlLnZlbG9jaXR5WzBdICsgZFQgKiBlLmFjY2VsZXJhdGlvblswXVxuICBlLnZlbG9jaXR5WzFdID0gZS52ZWxvY2l0eVsxXSArIGRUICogZS5hY2NlbGVyYXRpb25bMV1cbiAgZS52ZWxvY2l0eVsyXSA9IGUudmVsb2NpdHlbMl0gKyBkVCAqIGUuYWNjZWxlcmF0aW9uWzJdXG4gIHJldHVybiBlXG59XG5cbnBoeXNpY3MudXBkYXRlUGh5c2ljcyA9IGZ1bmN0aW9uICh3b3JsZCwgZSkge1xuICBpZiAoIWhhc1BoeXNpY3MoZSkpIHJldHVyblxuICBpZiAoIWUubGl2aW5nKSAgICAgIHJldHVyblxuICBwaHlzaWNzLnVwZGF0ZVZlbG9jaXR5KHdvcmxkLmNsb2NrLmRULCBlKVxuICBwaHlzaWNzLnVwZGF0ZVBvc2l0aW9uKHdvcmxkLmNsb2NrLmRULCBlKVxuICByZXR1cm4gZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBoeXNpY3NcbiIsInZhciByYW5kb20gPSB7fVxuXG5yYW5kb20ucmFuZEJvdW5kID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByYW5kb21cbiIsInZhciBwcm9kYXNoID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciB1dWlkICAgID0gcmVxdWlyZShcIm5vZGUtdXVpZFwiKVxudmFyIHZlYzMgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy92ZWMzXCIpXG52YXIgdmVjMiAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL3ZlYzJcIilcbnZhciBWZWMyICAgID0gdmVjMi5WZWMyXG52YXIgVmVjMyAgICA9IHZlYzMuVmVjM1xudmFyIHR5cGVzICAgPSB7fVxuXG4vL2dpdmVuIHNyYyBhbmQgdHlwZSwgY29tcGlsZSBhbmQgcmV0dXJuIHNoYWRlclxuZnVuY3Rpb24gY29tcGlsZSAoZ2wsIHNoYWRlclR5cGUsIHNyYykge1xuICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpXG5cbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcbiAgcmV0dXJuIHNoYWRlclxufVxuXG4vL2xpbmsgeW91ciBwcm9ncmFtIHcvIG9wZW5nbFxuZnVuY3Rpb24gbGluayAoZ2wsIHZzLCBmcykge1xuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKVxuXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cykgXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcykgXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXG4gIHJldHVybiBwcm9ncmFtXG59XG5cbi8qXG4gKiBXZSB3YW50IHRvIGNyZWF0ZSBhIHdyYXBwZXIgZm9yIGEgbG9hZGVkIGdsIHByb2dyYW1cbiAqIHRoYXQgaW5jbHVkZXMgcG9pbnRlcnMgdG8gYWxsIHRoZSB1bmlmb3JtcyBhbmQgYXR0cmlidXRlc1xuICogZGVmaW5lZCBmb3IgdGhpcyBwcm9ncmFtLiAgVGhpcyBtYWtlcyBpdCBtb3JlIGNvbnZlbmllbnRcbiAqIHRvIGNoYW5nZSB0aGVzZSB2YWx1ZXNcbiAqL1xudHlwZXMuTG9hZGVkUHJvZ3JhbSA9IGZ1bmN0aW9uIChnbCwgdlNyYywgZlNyYykge1xuICB2YXIgdnMgICAgICAgICAgICA9IGNvbXBpbGUoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIHZhciBmcyAgICAgICAgICAgID0gY29tcGlsZShnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICB2YXIgcHJvZ3JhbSAgICAgICA9IGxpbmsoZ2wsIHZzLCBmcylcbiAgdmFyIG51bUF0dHJpYnV0ZXMgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKVxuICB2YXIgbnVtVW5pZm9ybXMgICA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKVxuICB2YXIgbHAgPSB7XG4gICAgdmVydGV4OiB7XG4gICAgICBzcmM6ICAgIHZTcmMsXG4gICAgICBzaGFkZXI6IHZzIFxuICAgIH0sXG4gICAgZnJhZ21lbnQ6IHtcbiAgICAgIHNyYzogICAgZlNyYyxcbiAgICAgIHNoYWRlcjogZnMgXG4gICAgfSxcbiAgICBwcm9ncmFtOiAgICBwcm9ncmFtLFxuICAgIHVuaWZvcm1zOiAgIHt9LCBcbiAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICBidWZmZXJzOiAgICB7fVxuICB9XG4gIHZhciBhTmFtZVxuICB2YXIgdU5hbWVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bUF0dHJpYnV0ZXM7ICsraSkge1xuICAgIGFOYW1lICAgICAgICAgICAgICAgID0gZ2wuZ2V0QWN0aXZlQXR0cmliKHByb2dyYW0sIGkpLm5hbWVcbiAgICBscC5hdHRyaWJ1dGVzW2FOYW1lXSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIGFOYW1lKVxuICAgIGxwLmJ1ZmZlcnNbYU5hbWVdICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgfVxuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgbnVtVW5pZm9ybXM7ICsraikge1xuICAgIHVOYW1lICAgICAgICAgICAgICA9IGdsLmdldEFjdGl2ZVVuaWZvcm0ocHJvZ3JhbSwgaikubmFtZVxuICAgIGxwLnVuaWZvcm1zW3VOYW1lXSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCB1TmFtZSlcbiAgfVxuXG4gIHJldHVybiBscCBcbn1cblxudHlwZXMuUGFydGljbGUgPSBmdW5jdGlvbiAobGlmZXNwYW4sIHB4LCBweSwgcHopIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogICAgICAgICAgIHV1aWQudjQoKSxcbiAgICBwb3NpdGlvbjogICAgIFZlYzMocHgsIHB5LCBweiksXG4gICAgdmVsb2NpdHk6ICAgICBWZWMzKDAsIDAsIDApLFxuICAgIGFjY2VsZXJhdGlvbjogVmVjMygwLCAtMC4wMDAwMDE1LCAwKSxcbiAgICByZW5kZXJhYmxlOiAgIHRydWUsXG4gICAgc2l6ZTogICAgICAgICA0LjAsXG4gICAgdGltZVRvRGllOiAgICAwLFxuICAgIGxpZmVzcGFuOiAgICAgbGlmZXNwYW4sXG4gICAgbGl2aW5nOiAgICAgICBmYWxzZVxuICB9XG59XG5cbnR5cGVzLkVtaXR0ZXIgPSBmdW5jdGlvbiAobGlmZXNwYW4sIHJhdGUsIHNwZWVkLCBzcHJlYWQsIHB4LCBweSwgcHosIGR4LCBkeSwgZHopIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogICAgICAgICAgIHV1aWQudjQoKSxcbiAgICBlbWl0dGVyOiAgICAgIHRydWUsXG4gICAgcmF0ZTogICAgICAgICByYXRlLCBcbiAgICBzcGVlZDogICAgICAgIHNwZWVkLFxuICAgIHNwcmVhZDogICAgICAgc3ByZWFkLFxuICAgIG5leHRGaXJlVGltZTogMCxcbiAgICBwb3NpdGlvbjogICAgIFZlYzMocHgsIHB5LCBweiksXG4gICAgdmVsb2NpdHk6ICAgICBWZWMzKDAsIDAsIDApLFxuICAgIGFjY2VsZXJhdGlvbjogVmVjMygwLCAwLCAwKSxcbiAgICBkaXJlY3Rpb246ICAgIFZlYzMoZHgsIGR5LCBkeiksXG4gICAgcmVuZGVyYWJsZTogICBmYWxzZSxcbiAgICBsaXZpbmc6ICAgICAgIHRydWVcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHR5cGVzXG4iLCJ2YXIgdmVjMiA9IHt9XG5cbnZlYzIuVmVjMiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gIHZhciBvdXQgPSBuZXcgRmxvYXQzMkFycmF5KDIpXG5cbiAgb3V0WzBdID0geFxuICBvdXRbMV0gPSB5XG5cbiAgcmV0dXJuIG91dFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzJcbiIsInZhciB2ZWMzID0ge31cblxudmVjMy5WZWMzID0gZnVuY3Rpb24gKHgsIHksIHopIHtcbiAgdmFyIG91dCA9IG5ldyBGbG9hdDMyQXJyYXkoMylcblxuICBvdXRbMF0gPSB4XG4gIG91dFsxXSA9IHlcbiAgb3V0WzJdID0gelxuXG4gIHJldHVybiBvdXRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB2ZWMzXG4iXX0=
