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
  object:      require("./src/object"),
  graph:       require("./src/graph")
}

module.exports = prodash

},{"./src/array":5,"./src/functions":6,"./src/graph":7,"./src/object":8,"./src/transducers":9}],5:[function(require,module,exports){
var transducers = require("./transducers")
var fns         = require("./functions")
var mapping     = transducers.mapping
var filtering   = transducers.filtering
var curry       = fns.curry
var array       = {}

var cons = function (ar, x) {
  ar.push(x)
  return ar
}

var reduce = curry(function (fn, accum, ar) {  
  for (var i = 0; i < ar.length; ++i) {
    accum = fn(accum, ar[i]) 
  }
  return accum
})

var map = curry(function (fn, ar) {
  return reduce(mapping(fn, cons), [], ar)
})

var filter = curry(function (predFn, ar) {
  return reduce(filtering(predFn, cons), [], ar)
})

var find = curry(function (predFn, ar) {
  for (var i = 0; i < ar.length; ++i) {
    if (predFn(ar[i])) return ar[i] 
  }
  return null
})

//TODO: add tests!
var forEach = curry(function (transFn, ar) {
  for (var i = 0; i < ar.length; ++i) {
    transFn(ar[i]) 
  }
})

array.cons    = cons
array.reduce  = reduce
array.map     = map
array.filter  = filter
array.find    = find
array.forEach = forEach

module.exports = array

},{"./functions":6,"./transducers":9}],6:[function(require,module,exports){
var fns = {}

var demethodize = function (obj, fnName) {
  return Function.prototype.call.bind(obj[fnName]) 
}

var reverse = function (list) {
  var backwards = []

  for (var i = 0; i < list.length; ++i) {
    backwards.unshift(list[i]) 
  }

  return backwards
}

//don't export?  just used in definitions
var badSlice = demethodize(Array.prototype, "slice")

var toArray = function (args) { return badSlice(args, 0) }

var allButFirst = function (args) { return badSlice(args, 1) }

var concat = demethodize(Array.prototype, "concat")

var apply = function (fn, argsList) { return fn.apply(this, argsList) }

var call = function (fn) { return fn.apply(this, allButFirst(arguments)) }

var bind = function (fn, obj) { return fn.bind(obj, allButFirst(arguments)) }

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
    return apply(fn, reverse(badSlice(arguments)))
  }
}

var slice = flip(badSlice)

var partial = function (fn) {
  var args = slice(1, arguments)

  return function partialed () {
    var innerArgs = toArray(arguments)
    var allArgs   = concat(args, innerArgs)

    return apply(fn, allArgs)
  }
}

//utility function used in curry def
var innerCurry = function (fn) {
  var args = allButFirst(arguments);

  return function () {
    var innerArgs = toArray(arguments);

    return apply(fn, concat(args, innerArgs));
  };
};

var curry = function curry (fn) {
  var fnArity = fn.length

  return function curried () {
    var notEnoughArgs    = arguments.length < fnArity
    var missingArgsCount = fnArity - arguments.length
    var stillMissingArgs = missingArgsCount > 0
    var args             = concat([fn], toArray(arguments))
    var result

    if (notEnoughArgs && stillMissingArgs) {
      result = curry(apply(innerCurry, args), missingArgsCount)
    } else if (notEnoughArgs) {
      result = apply(innerCurry, args)
    } else {
      result = apply(fn, slice(arguments)) 
    }
    return result
  }
}

fns.demethodize = demethodize
fns.reverse     = reverse
fns.slice       = slice
fns.concat      = concat
fns.flip        = flip
fns.compose     = compose
fns.partial     = partial
fns.curry       = curry
fns.bind        = bind
fns.call        = call
fns.apply       = apply
module.exports  = fns

},{}],7:[function(require,module,exports){
var fns         = require("./functions")
var curry       = fns.curry
var g           = {}

var Node = function (hash, nodes) {
  return {
    value:    hash,
    children: nodes || [] 
  }
}

var cons = function (node, childNode) {
  node.children.push(childNode)
  return node
}

var reduce = curry(function reduce (fn, accum, node) {
  accum = fn(accum, node.value)

  for (var i = 0; i < node.children.length; ++i) {
    reduce(fn, accum, node.children[i]) 
  }
  return accum
})

var forEach = curry(function (fn, node) {
  fn(node.value)  

  for (var i = 0; i < node.children.length; ++i) {
    forEach(fn, node.children[i])
  }
  return node
})

g.Node    = Node
g.cons    = cons
g.reduce  = reduce
g.forEach = forEach

module.exports = g

},{"./functions":6}],8:[function(require,module,exports){
var fns         = require("./functions")
var transducers = require("./transducers")
var mapping     = transducers.mapping
var filtering   = transducers.filtering
var curry       = fns.curry
var object      = {}

var keys = Object.keys

var cons = function (host, obj) {
  var index = -1
  var ks    = keys(obj)
  var len   = ks.length
  var key

  while (++index < len) {
    key       = ks[index]
    host[key] = obj[key]
  }
  return host
}

var reduce = function (fn, accum, obj) {
  var index = -1
  var ks    = keys(obj)
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

var map = curry(function (fn, obj) {
  return reduce(mapping(fn, cons), {}, obj)
})

var filter = curry(function (predFn, obj) {
  return reduce(filtering(predFn, cons), {}, obj)
})

object.keys   = keys
object.cons   = cons
object.map    = map
object.reduce = reduce
object.filter = filter

module.exports = object

},{"./functions":6,"./transducers":9}],9:[function(require,module,exports){
var fns   = require("./functions")
var curry = fns.curry
var trans = {}

var mapping = curry(function (transFn, stepFn) {
  return function (acc, x) {
    return stepFn(acc, transFn(x))
  }
})

var filtering = curry(function (predFn, stepFn) {
  return function (acc, x) {
    return predFn(x) ? stepFn(acc, x) : acc 
  }
})

trans.mapping   = mapping
trans.filtering = filtering

module.exports = trans

},{"./functions":6}],10:[function(require,module,exports){
var prodash           = require("prodash")
var async             = require("async")
var fps               = require("fps")
var types             = require("../modules/types")
var loaders           = require("../modules/loaders")
var utils             = require("../modules/gl-utils")
var random            = require("../modules/random")
var physics           = require("../modules/physics")
var lifetime          = require("../modules/lifetime")
var emitters          = require("../modules/emitters")
var rendering         = require("../modules/rendering")
var filtering         = prodash.transducers.filtering
var mapping           = prodash.transducers.mapping
var curry             = prodash.functions.curry
var compose           = prodash.functions.compose
var partial           = prodash.functions.partial
var reduceG           = prodash.graph.reduce
var reduceA           = prodash.array.reduce
var consA             = prodash.array.cons
var forEachA          = prodash.array.forEach
var Node              = prodash.graph.Node
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
var walkAndDo         = rendering.walkAndDo
var ticker            = fps({every: 16})
var canvas            = document.getElementById("playground")
var stats             = document.getElementById("stats")
var gl                = canvas.getContext("webgl")
var shaders           = {
  vertex:   "/shaders/01v.glsl",
  fragment: "/shaders/01f.glsl"
}

//TODO: should be a utility function in prodash.object
var has = curry(function (props, e) {
  var res = true

  for (var i = 0; i < props.length; ++i) {
    res = res && e.hasOwnProperty(props[i])
  }
  return res
})

//TODO: should be a utility fuction in prodash.array
var flatten = function (listOfLists) {
  var res = [] 

  for (var i = 0; i < listOfLists.length; ++i) {
    for (var j = 0; j < listOfLists[i].length; ++j) {
      res.push(listOfLists[i][j])
    } 
  }
  return res
}

var hasLifeSpan = filtering(has(["lifespan"]))
var isEmitter   = filtering(has(["emitter"]))
var hasPhysics  = filtering(has(["position", "velocity", "acceleration"]))
var groupGraphBy = function (predFn, graph) {
  return reduceG(predFn(consA), [], graph)
}

function makeUpdate (groups) {
  var oldTime = performance.now()
  var newTime = oldTime
  var dT

  return function update () {
    oldTime = newTime
    newTime = performance.now()
    dT      = newTime - oldTime

    //TODO: optimize by creating functions in makeUpdate
    forEachA(function (e) { updateEmitter(newTime, e) }, groups.emitters)
    forEachA(function (e) { killTheOld(newTime, e) }, groups.lifespans)
    forEachA(function (e) { updatePhysics(dT, e) }, groups.physics)
  }
}

var getLivingPositions = reduceA(compose([
  filtering(function (e) { return !!e.living }),
  mapping(function (e) { return [e.position[0], e.position[1]] })
])(consA), []) 

//TODO: This should be groups.renderable and not physics probably
function makeAnimate (gl, lp, groups) {
  return function animate () {
    var positions = new Float32Array(flatten(getLivingPositions(groups.physics)))

    ticker.tick()
    clearContext(gl)
    updateBuffer(gl, 2, lp.attributes.aPosition, lp.buffers.aPosition, positions)
    gl.drawArrays(gl.POINTS, 0, positions.length / 2)
    requestAnimationFrame(animate) 
  }
}

//TODO: There probably should be a renderable group for animate frame iteration
function cacheGroups (sceneGraph) {
  return {
    lifespans: groupGraphBy(hasLifeSpan, sceneGraph),
    emitters:  groupGraphBy(isEmitter, sceneGraph),
    physics:   groupGraphBy(hasPhysics, sceneGraph)
  }  
}

//setup fps monitoring
ticker.on("data", function (framerate) {
  stats.innerHTML = "fps: " + String(framerate | 0)
})

async.parallel({
  vertex:   partial(loadShader, "/shaders/01v.glsl"),
  fragment: partial(loadShader, "/shaders/01f.glsl")
}, function (err, shaders) {
  var lp           = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var sceneGraph   = Node({}, [
      Emitter(100, 2000, 10, .0009, .4, 0, 0, 1, 0)
  ])
  var groups       = cacheGroups(sceneGraph)
  var positions    = flatten(getLivingPositions(groups.physics))

  window.positions = positions
  window.graph     = sceneGraph
  window.groups    = groups
  gl.useProgram(lp.program)
  gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
  requestAnimationFrame(makeAnimate(gl, lp, groups))
  setInterval(makeUpdate(groups), 25)
})

},{"../modules/emitters":11,"../modules/gl-utils":12,"../modules/lifetime":13,"../modules/loaders":14,"../modules/physics":15,"../modules/random":16,"../modules/rendering":17,"../modules/types":18,"async":"async","fps":2,"prodash":4}],11:[function(require,module,exports){
var prodash   = require("prodash")
var random    = require("./random")
var find      = prodash.array.find
var randBound = random.randBound
var emitters  = {}

var scaleAndSpread = function (scale, spread, val) {
  return scale * (val + randBound(-1 * spread, spread))
}

var findFirstDead = find(function (e) { return !e.living })

/*
  check if it is time to fire a particle, if so, they find
  a particle and give it a velocity in the direction of the emitter
  and a time to die
  N.B. The velocity is affected by both the speed and the spread
*/
emitters.updateEmitter = function (time, e) {
  var particle 

  if (!e.emitter) return
  if (time > e.nextFireTime) {
    particle             = findFirstDead(e.children)
    particle.timeToDie   = time + particle.lifespan
    particle.living      = true
    particle.position[0] = e.position[0]
    particle.position[1] = e.position[1]
    particle.velocity[0] = scaleAndSpread(e.speed, e.spread, e.direction[0])
    particle.velocity[1] = scaleAndSpread(e.speed, e.spread, e.direction[1])
    e.nextFireTime += e.rate
  }
}

module.exports = emitters

},{"./random":16,"prodash":4}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
var lifetime = {}

lifetime.killTheOld = function (time, e) {
  if (e.living && time >= e.timeToDie) e.living = false
}

module.exports = lifetime

},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
var physics = {}

physics.updatePosition = function (dT, e) {
  e.position[0] = e.position[0] + dT * e.velocity[0]
  e.position[1] = e.position[1] + dT * e.velocity[1]
  return e
}

physics.updateVelocity = function (dT, e) {
  e.velocity[0] = e.velocity[0] + dT * e.acceleration[0]
  e.velocity[1] = e.velocity[1] + dT * e.acceleration[1]
  return e
}

physics.updatePhysics = function (dT, e) {
  if (e.velocity === undefined) return
  physics.updateVelocity(dT, e)
  physics.updatePosition(dT, e)
  return e
}

module.exports = physics

},{}],16:[function(require,module,exports){
var random = {}

random.randBound = function (min, max) {
  return Math.random() * (max - min) + min
}

module.exports = random

},{}],17:[function(require,module,exports){
var rendering = {}


//I want to crawl the tree structure returning the total number
//of renderable objects
//
//Then, crawl the tree structure to buildup the TypedArray

function flatPush (host, ar) {
  for (var i = 0; i < ar.length; ++i) {
    host.push(ar[i]) 
  }
  return host
}

function extractRenderingData (host, node) {
  if (!!node.living ) {
    flatPush(host, node.position)
    //flatPush(host, node.color)
    //flatPush(host, node.size)
  }

  if (node.children) {
    for (var i = 0; i < node.children.length; ++i) {
      extractRenderingData(host, node.children[i]) 
    }
  }
  return host
}

/*
 * Recusively traverse the scenegraph (a 1-n tree) and
 * return a flat list of position vectors.  
* */
rendering.flattenSceneGraph = function (rootNode) {
  return new Float32Array(extractRenderingData([], rootNode))
}

//TODO: This isnt really explicitly a rendering concern..  perhaps move?
rendering.walkAndDo = function walkAndDo (fn, node) {
  fn(node)

  if (node.children) {
    for (var i = 0; i < node.children.length; ++i) {
      walkAndDo(fn, node.children[i])
    }
  }
  return node
}

module.exports = rendering

},{}],18:[function(require,module,exports){
var prodash = require("prodash")
var uuid    = require("node-uuid")
var Node    = prodash.graph.Node
var vec2    = require("../modules/vec2")
var Vec2    = vec2.Vec2
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

types.Particle = function (lifespan, px, py, vx, vy, ax, ay) {
  return Node({
    id:           uuid.v4(),
    position:     Vec2(px, py),
    velocity:     Vec2(vx, vy),
    acceleration: Vec2(ax, ay),
    renderable:   true,
    timeToDie:    0,
    lifespan:     lifespan,
    living:       false
  }) 
}

types.Emitter = function (count, lifespan, rate, speed, spread, px, py, dx, dy) {
  var particles = []

  for (var i = 0; i < count; ++i) {
    particles.push(types.Particle(lifespan, px, py, 0, 0, 0, -0.0000009))
  }

  return Node({
    id:           uuid.v4(),
    emitter:      true,
    rate:         rate, 
    speed:        speed,
    spread:       spread,
    nextFireTime: 0,
    position:     Vec2(px, py),
    velocity:     Vec2(0, 0),
    acceleration: Vec2(0, 0),
    direction:    Vec2(dx, dy),
    renderable:   false,
    living:       true
  }, particles)
}

module.exports = types

},{"../modules/vec2":19,"node-uuid":"node-uuid","prodash":4}],19:[function(require,module,exports){
var vec2 = {}

vec2.Vec2 = function (x, y) {
  var out = new Float32Array(2)

  out[0] = x
  out[1] = y

  return out
}

module.exports = vec2

},{}]},{},[10])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvaW5kZXguanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9wcm9kYXNoLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvYXJyYXkuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9ncmFwaC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvc3JjL29iamVjdC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvc3JjL3RyYW5zZHVjZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvZXhhbXBsZXMvMDEtQmFzaWMtU2V0dXAuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2VtaXR0ZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9nbC11dGlscy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbGlmZXRpbWUuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2xvYWRlcnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3BoeXNpY3MuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3JhbmRvbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvcmVuZGVyaW5nLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy90eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvdmVjMi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlclxuICAsIGluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZwc1xuXG4vLyBUcnkgdXNlIHBlcmZvcm1hbmNlLm5vdygpLCBvdGhlcndpc2UgdHJ5XG4vLyArbmV3IERhdGUuXG52YXIgbm93ID0gKFxuICAoZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXMgfSgpKS5wZXJmb3JtYW5jZSAmJlxuICAnZnVuY3Rpb24nID09PSB0eXBlb2YgcGVyZm9ybWFuY2Uubm93XG4pID8gZnVuY3Rpb24oKSB7IHJldHVybiBwZXJmb3JtYW5jZS5ub3coKSB9XG4gIDogRGF0ZS5ub3cgfHwgZnVuY3Rpb24oKSB7IHJldHVybiArbmV3IERhdGUgfVxuXG5mdW5jdGlvbiBmcHMob3B0cykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgZnBzKSkgcmV0dXJuIG5ldyBmcHMob3B0cylcbiAgRXZlbnRFbWl0dGVyLmNhbGwodGhpcylcblxuICBvcHRzID0gb3B0cyB8fCB7fVxuICB0aGlzLmxhc3QgPSBub3coKVxuICB0aGlzLnJhdGUgPSAwXG4gIHRoaXMudGltZSA9IDBcbiAgdGhpcy5kZWNheSA9IG9wdHMuZGVjYXkgfHwgMVxuICB0aGlzLmV2ZXJ5ID0gb3B0cy5ldmVyeSB8fCAxXG4gIHRoaXMudGlja3MgPSAwXG59XG5pbmhlcml0cyhmcHMsIEV2ZW50RW1pdHRlcilcblxuZnBzLnByb3RvdHlwZS50aWNrID0gZnVuY3Rpb24oKSB7XG4gIHZhciB0aW1lID0gbm93KClcbiAgICAsIGRpZmYgPSB0aW1lIC0gdGhpcy5sYXN0XG4gICAgLCBmcHMgPSBkaWZmXG5cbiAgdGhpcy50aWNrcyArPSAxXG4gIHRoaXMubGFzdCA9IHRpbWVcbiAgdGhpcy50aW1lICs9IChmcHMgLSB0aGlzLnRpbWUpICogdGhpcy5kZWNheVxuICB0aGlzLnJhdGUgPSAxMDAwIC8gdGhpcy50aW1lXG4gIGlmICghKHRoaXMudGlja3MgJSB0aGlzLmV2ZXJ5KSkgdGhpcy5lbWl0KCdkYXRhJywgdGhpcy5yYXRlKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGluaGVyaXRzXG5cbmZ1bmN0aW9uIGluaGVyaXRzIChjLCBwLCBwcm90bykge1xuICBwcm90byA9IHByb3RvIHx8IHt9XG4gIHZhciBlID0ge31cbiAgO1tjLnByb3RvdHlwZSwgcHJvdG9dLmZvckVhY2goZnVuY3Rpb24gKHMpIHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhzKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICBlW2tdID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihzLCBrKVxuICAgIH0pXG4gIH0pXG4gIGMucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwLnByb3RvdHlwZSwgZSlcbiAgYy5zdXBlciA9IHBcbn1cblxuLy9mdW5jdGlvbiBDaGlsZCAoKSB7XG4vLyAgQ2hpbGQuc3VwZXIuY2FsbCh0aGlzKVxuLy8gIGNvbnNvbGUuZXJyb3IoW3RoaXNcbi8vICAgICAgICAgICAgICAgICx0aGlzLmNvbnN0cnVjdG9yXG4vLyAgICAgICAgICAgICAgICAsdGhpcy5jb25zdHJ1Y3RvciA9PT0gQ2hpbGRcbi8vICAgICAgICAgICAgICAgICx0aGlzLmNvbnN0cnVjdG9yLnN1cGVyID09PSBQYXJlbnRcbi8vICAgICAgICAgICAgICAgICxPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykgPT09IENoaWxkLnByb3RvdHlwZVxuLy8gICAgICAgICAgICAgICAgLE9iamVjdC5nZXRQcm90b3R5cGVPZihPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykpXG4vLyAgICAgICAgICAgICAgICAgPT09IFBhcmVudC5wcm90b3R5cGVcbi8vICAgICAgICAgICAgICAgICx0aGlzIGluc3RhbmNlb2YgQ2hpbGRcbi8vICAgICAgICAgICAgICAgICx0aGlzIGluc3RhbmNlb2YgUGFyZW50XSlcbi8vfVxuLy9mdW5jdGlvbiBQYXJlbnQgKCkge31cbi8vaW5oZXJpdHMoQ2hpbGQsIFBhcmVudClcbi8vbmV3IENoaWxkXG4iLCJ2YXIgcHJvZGFzaCA9IHtcbiAgZnVuY3Rpb25zOiAgIHJlcXVpcmUoXCIuL3NyYy9mdW5jdGlvbnNcIiksXG4gIHRyYW5zZHVjZXJzOiByZXF1aXJlKFwiLi9zcmMvdHJhbnNkdWNlcnNcIiksXG4gIGFycmF5OiAgICAgICByZXF1aXJlKFwiLi9zcmMvYXJyYXlcIiksXG4gIG9iamVjdDogICAgICByZXF1aXJlKFwiLi9zcmMvb2JqZWN0XCIpLFxuICBncmFwaDogICAgICAgcmVxdWlyZShcIi4vc3JjL2dyYXBoXCIpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcHJvZGFzaFxuIiwidmFyIHRyYW5zZHVjZXJzID0gcmVxdWlyZShcIi4vdHJhbnNkdWNlcnNcIilcbnZhciBmbnMgICAgICAgICA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxudmFyIG1hcHBpbmcgICAgID0gdHJhbnNkdWNlcnMubWFwcGluZ1xudmFyIGZpbHRlcmluZyAgID0gdHJhbnNkdWNlcnMuZmlsdGVyaW5nXG52YXIgY3VycnkgICAgICAgPSBmbnMuY3VycnlcbnZhciBhcnJheSAgICAgICA9IHt9XG5cbnZhciBjb25zID0gZnVuY3Rpb24gKGFyLCB4KSB7XG4gIGFyLnB1c2goeClcbiAgcmV0dXJuIGFyXG59XG5cbnZhciByZWR1Y2UgPSBjdXJyeShmdW5jdGlvbiAoZm4sIGFjY3VtLCBhcikgeyAgXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXIubGVuZ3RoOyArK2kpIHtcbiAgICBhY2N1bSA9IGZuKGFjY3VtLCBhcltpXSkgXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59KVxuXG52YXIgbWFwID0gY3VycnkoZnVuY3Rpb24gKGZuLCBhcikge1xuICByZXR1cm4gcmVkdWNlKG1hcHBpbmcoZm4sIGNvbnMpLCBbXSwgYXIpXG59KVxuXG52YXIgZmlsdGVyID0gY3VycnkoZnVuY3Rpb24gKHByZWRGbiwgYXIpIHtcbiAgcmV0dXJuIHJlZHVjZShmaWx0ZXJpbmcocHJlZEZuLCBjb25zKSwgW10sIGFyKVxufSlcblxudmFyIGZpbmQgPSBjdXJyeShmdW5jdGlvbiAocHJlZEZuLCBhcikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKHByZWRGbihhcltpXSkpIHJldHVybiBhcltpXSBcbiAgfVxuICByZXR1cm4gbnVsbFxufSlcblxuLy9UT0RPOiBhZGQgdGVzdHMhXG52YXIgZm9yRWFjaCA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBhcikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyLmxlbmd0aDsgKytpKSB7XG4gICAgdHJhbnNGbihhcltpXSkgXG4gIH1cbn0pXG5cbmFycmF5LmNvbnMgICAgPSBjb25zXG5hcnJheS5yZWR1Y2UgID0gcmVkdWNlXG5hcnJheS5tYXAgICAgID0gbWFwXG5hcnJheS5maWx0ZXIgID0gZmlsdGVyXG5hcnJheS5maW5kICAgID0gZmluZFxuYXJyYXkuZm9yRWFjaCA9IGZvckVhY2hcblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheVxuIiwidmFyIGZucyA9IHt9XG5cbnZhciBkZW1ldGhvZGl6ZSA9IGZ1bmN0aW9uIChvYmosIGZuTmFtZSkge1xuICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGwuYmluZChvYmpbZm5OYW1lXSkgXG59XG5cbnZhciByZXZlcnNlID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgdmFyIGJhY2t3YXJkcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgYmFja3dhcmRzLnVuc2hpZnQobGlzdFtpXSkgXG4gIH1cblxuICByZXR1cm4gYmFja3dhcmRzXG59XG5cbi8vZG9uJ3QgZXhwb3J0PyAganVzdCB1c2VkIGluIGRlZmluaXRpb25zXG52YXIgYmFkU2xpY2UgPSBkZW1ldGhvZGl6ZShBcnJheS5wcm90b3R5cGUsIFwic2xpY2VcIilcblxudmFyIHRvQXJyYXkgPSBmdW5jdGlvbiAoYXJncykgeyByZXR1cm4gYmFkU2xpY2UoYXJncywgMCkgfVxuXG52YXIgYWxsQnV0Rmlyc3QgPSBmdW5jdGlvbiAoYXJncykgeyByZXR1cm4gYmFkU2xpY2UoYXJncywgMSkgfVxuXG52YXIgY29uY2F0ID0gZGVtZXRob2RpemUoQXJyYXkucHJvdG90eXBlLCBcImNvbmNhdFwiKVxuXG52YXIgYXBwbHkgPSBmdW5jdGlvbiAoZm4sIGFyZ3NMaXN0KSB7IHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzTGlzdCkgfVxuXG52YXIgY2FsbCA9IGZ1bmN0aW9uIChmbikgeyByZXR1cm4gZm4uYXBwbHkodGhpcywgYWxsQnV0Rmlyc3QoYXJndW1lbnRzKSkgfVxuXG52YXIgYmluZCA9IGZ1bmN0aW9uIChmbiwgb2JqKSB7IHJldHVybiBmbi5iaW5kKG9iaiwgYWxsQnV0Rmlyc3QoYXJndW1lbnRzKSkgfVxuXG52YXIgY29tcG9zZSA9IGZ1bmN0aW9uIChmbnMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGNvbXBvc2VkICh2YWwpIHtcbiAgICBmb3IgKHZhciBpID0gZm5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB2YWwgPSBmbnNbaV0odmFsKVxuICAgIH1cbiAgICByZXR1cm4gdmFsXG4gIH1cbn1cblxudmFyIGZsaXAgPSBmdW5jdGlvbiAoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYXBwbHkoZm4sIHJldmVyc2UoYmFkU2xpY2UoYXJndW1lbnRzKSkpXG4gIH1cbn1cblxudmFyIHNsaWNlID0gZmxpcChiYWRTbGljZSlcblxudmFyIHBhcnRpYWwgPSBmdW5jdGlvbiAoZm4pIHtcbiAgdmFyIGFyZ3MgPSBzbGljZSgxLCBhcmd1bWVudHMpXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHBhcnRpYWxlZCAoKSB7XG4gICAgdmFyIGlubmVyQXJncyA9IHRvQXJyYXkoYXJndW1lbnRzKVxuICAgIHZhciBhbGxBcmdzICAgPSBjb25jYXQoYXJncywgaW5uZXJBcmdzKVxuXG4gICAgcmV0dXJuIGFwcGx5KGZuLCBhbGxBcmdzKVxuICB9XG59XG5cbi8vdXRpbGl0eSBmdW5jdGlvbiB1c2VkIGluIGN1cnJ5IGRlZlxudmFyIGlubmVyQ3VycnkgPSBmdW5jdGlvbiAoZm4pIHtcbiAgdmFyIGFyZ3MgPSBhbGxCdXRGaXJzdChhcmd1bWVudHMpO1xuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlubmVyQXJncyA9IHRvQXJyYXkoYXJndW1lbnRzKTtcblxuICAgIHJldHVybiBhcHBseShmbiwgY29uY2F0KGFyZ3MsIGlubmVyQXJncykpO1xuICB9O1xufTtcblxudmFyIGN1cnJ5ID0gZnVuY3Rpb24gY3VycnkgKGZuKSB7XG4gIHZhciBmbkFyaXR5ID0gZm4ubGVuZ3RoXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIGN1cnJpZWQgKCkge1xuICAgIHZhciBub3RFbm91Z2hBcmdzICAgID0gYXJndW1lbnRzLmxlbmd0aCA8IGZuQXJpdHlcbiAgICB2YXIgbWlzc2luZ0FyZ3NDb3VudCA9IGZuQXJpdHkgLSBhcmd1bWVudHMubGVuZ3RoXG4gICAgdmFyIHN0aWxsTWlzc2luZ0FyZ3MgPSBtaXNzaW5nQXJnc0NvdW50ID4gMFxuICAgIHZhciBhcmdzICAgICAgICAgICAgID0gY29uY2F0KFtmbl0sIHRvQXJyYXkoYXJndW1lbnRzKSlcbiAgICB2YXIgcmVzdWx0XG5cbiAgICBpZiAobm90RW5vdWdoQXJncyAmJiBzdGlsbE1pc3NpbmdBcmdzKSB7XG4gICAgICByZXN1bHQgPSBjdXJyeShhcHBseShpbm5lckN1cnJ5LCBhcmdzKSwgbWlzc2luZ0FyZ3NDb3VudClcbiAgICB9IGVsc2UgaWYgKG5vdEVub3VnaEFyZ3MpIHtcbiAgICAgIHJlc3VsdCA9IGFwcGx5KGlubmVyQ3VycnksIGFyZ3MpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCA9IGFwcGx5KGZuLCBzbGljZShhcmd1bWVudHMpKSBcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbmZucy5kZW1ldGhvZGl6ZSA9IGRlbWV0aG9kaXplXG5mbnMucmV2ZXJzZSAgICAgPSByZXZlcnNlXG5mbnMuc2xpY2UgICAgICAgPSBzbGljZVxuZm5zLmNvbmNhdCAgICAgID0gY29uY2F0XG5mbnMuZmxpcCAgICAgICAgPSBmbGlwXG5mbnMuY29tcG9zZSAgICAgPSBjb21wb3NlXG5mbnMucGFydGlhbCAgICAgPSBwYXJ0aWFsXG5mbnMuY3VycnkgICAgICAgPSBjdXJyeVxuZm5zLmJpbmQgICAgICAgID0gYmluZFxuZm5zLmNhbGwgICAgICAgID0gY2FsbFxuZm5zLmFwcGx5ICAgICAgID0gYXBwbHlcbm1vZHVsZS5leHBvcnRzICA9IGZuc1xuIiwidmFyIGZucyAgICAgICAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgY3VycnkgICAgICAgPSBmbnMuY3VycnlcbnZhciBnICAgICAgICAgICA9IHt9XG5cbnZhciBOb2RlID0gZnVuY3Rpb24gKGhhc2gsIG5vZGVzKSB7XG4gIHJldHVybiB7XG4gICAgdmFsdWU6ICAgIGhhc2gsXG4gICAgY2hpbGRyZW46IG5vZGVzIHx8IFtdIFxuICB9XG59XG5cbnZhciBjb25zID0gZnVuY3Rpb24gKG5vZGUsIGNoaWxkTm9kZSkge1xuICBub2RlLmNoaWxkcmVuLnB1c2goY2hpbGROb2RlKVxuICByZXR1cm4gbm9kZVxufVxuXG52YXIgcmVkdWNlID0gY3VycnkoZnVuY3Rpb24gcmVkdWNlIChmbiwgYWNjdW0sIG5vZGUpIHtcbiAgYWNjdW0gPSBmbihhY2N1bSwgbm9kZS52YWx1ZSlcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICByZWR1Y2UoZm4sIGFjY3VtLCBub2RlLmNoaWxkcmVuW2ldKSBcbiAgfVxuICByZXR1cm4gYWNjdW1cbn0pXG5cbnZhciBmb3JFYWNoID0gY3VycnkoZnVuY3Rpb24gKGZuLCBub2RlKSB7XG4gIGZuKG5vZGUudmFsdWUpICBcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICBmb3JFYWNoKGZuLCBub2RlLmNoaWxkcmVuW2ldKVxuICB9XG4gIHJldHVybiBub2RlXG59KVxuXG5nLk5vZGUgICAgPSBOb2RlXG5nLmNvbnMgICAgPSBjb25zXG5nLnJlZHVjZSAgPSByZWR1Y2VcbmcuZm9yRWFjaCA9IGZvckVhY2hcblxubW9kdWxlLmV4cG9ydHMgPSBnXG4iLCJ2YXIgZm5zICAgICAgICAgPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcbnZhciB0cmFuc2R1Y2VycyA9IHJlcXVpcmUoXCIuL3RyYW5zZHVjZXJzXCIpXG52YXIgbWFwcGluZyAgICAgPSB0cmFuc2R1Y2Vycy5tYXBwaW5nXG52YXIgZmlsdGVyaW5nICAgPSB0cmFuc2R1Y2Vycy5maWx0ZXJpbmdcbnZhciBjdXJyeSAgICAgICA9IGZucy5jdXJyeVxudmFyIG9iamVjdCAgICAgID0ge31cblxudmFyIGtleXMgPSBPYmplY3Qua2V5c1xuXG52YXIgY29ucyA9IGZ1bmN0aW9uIChob3N0LCBvYmopIHtcbiAgdmFyIGluZGV4ID0gLTFcbiAgdmFyIGtzICAgID0ga2V5cyhvYmopXG4gIHZhciBsZW4gICA9IGtzLmxlbmd0aFxuICB2YXIga2V5XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW4pIHtcbiAgICBrZXkgICAgICAgPSBrc1tpbmRleF1cbiAgICBob3N0W2tleV0gPSBvYmpba2V5XVxuICB9XG4gIHJldHVybiBob3N0XG59XG5cbnZhciByZWR1Y2UgPSBmdW5jdGlvbiAoZm4sIGFjY3VtLCBvYmopIHtcbiAgdmFyIGluZGV4ID0gLTFcbiAgdmFyIGtzICAgID0ga2V5cyhvYmopXG4gIHZhciBsZW4gICA9IGtzLmxlbmd0aFxuICB2YXIga2V5XG4gIHZhciBrdlxuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuKSB7XG4gICAga2V5ICAgICA9IGtzW2luZGV4XVxuICAgIGt2ICAgICAgPSB7fVxuICAgIGt2W2tleV0gPSBvYmpba2V5XVxuICAgIGFjY3VtICAgPSBmbihhY2N1bSwga3YpXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59XG5cbnZhciBtYXAgPSBjdXJyeShmdW5jdGlvbiAoZm4sIG9iaikge1xuICByZXR1cm4gcmVkdWNlKG1hcHBpbmcoZm4sIGNvbnMpLCB7fSwgb2JqKVxufSlcblxudmFyIGZpbHRlciA9IGN1cnJ5KGZ1bmN0aW9uIChwcmVkRm4sIG9iaikge1xuICByZXR1cm4gcmVkdWNlKGZpbHRlcmluZyhwcmVkRm4sIGNvbnMpLCB7fSwgb2JqKVxufSlcblxub2JqZWN0LmtleXMgICA9IGtleXNcbm9iamVjdC5jb25zICAgPSBjb25zXG5vYmplY3QubWFwICAgID0gbWFwXG5vYmplY3QucmVkdWNlID0gcmVkdWNlXG5vYmplY3QuZmlsdGVyID0gZmlsdGVyXG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0XG4iLCJ2YXIgZm5zICAgPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcbnZhciBjdXJyeSA9IGZucy5jdXJyeVxudmFyIHRyYW5zID0ge31cblxudmFyIG1hcHBpbmcgPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgc3RlcEZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgcmV0dXJuIHN0ZXBGbihhY2MsIHRyYW5zRm4oeCkpXG4gIH1cbn0pXG5cbnZhciBmaWx0ZXJpbmcgPSBjdXJyeShmdW5jdGlvbiAocHJlZEZuLCBzdGVwRm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICByZXR1cm4gcHJlZEZuKHgpID8gc3RlcEZuKGFjYywgeCkgOiBhY2MgXG4gIH1cbn0pXG5cbnRyYW5zLm1hcHBpbmcgICA9IG1hcHBpbmdcbnRyYW5zLmZpbHRlcmluZyA9IGZpbHRlcmluZ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRyYW5zXG4iLCJ2YXIgcHJvZGFzaCAgICAgICAgICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIGFzeW5jICAgICAgICAgICAgID0gcmVxdWlyZShcImFzeW5jXCIpXG52YXIgZnBzICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiZnBzXCIpXG52YXIgdHlwZXMgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy90eXBlc1wiKVxudmFyIGxvYWRlcnMgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbG9hZGVyc1wiKVxudmFyIHV0aWxzICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvZ2wtdXRpbHNcIilcbnZhciByYW5kb20gICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL3JhbmRvbVwiKVxudmFyIHBoeXNpY3MgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvcGh5c2ljc1wiKVxudmFyIGxpZmV0aW1lICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbGlmZXRpbWVcIilcbnZhciBlbWl0dGVycyAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2VtaXR0ZXJzXCIpXG52YXIgcmVuZGVyaW5nICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9yZW5kZXJpbmdcIilcbnZhciBmaWx0ZXJpbmcgICAgICAgICA9IHByb2Rhc2gudHJhbnNkdWNlcnMuZmlsdGVyaW5nXG52YXIgbWFwcGluZyAgICAgICAgICAgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLm1hcHBpbmdcbnZhciBjdXJyeSAgICAgICAgICAgICA9IHByb2Rhc2guZnVuY3Rpb25zLmN1cnJ5XG52YXIgY29tcG9zZSAgICAgICAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5jb21wb3NlXG52YXIgcGFydGlhbCAgICAgICAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5wYXJ0aWFsXG52YXIgcmVkdWNlRyAgICAgICAgICAgPSBwcm9kYXNoLmdyYXBoLnJlZHVjZVxudmFyIHJlZHVjZUEgICAgICAgICAgID0gcHJvZGFzaC5hcnJheS5yZWR1Y2VcbnZhciBjb25zQSAgICAgICAgICAgICA9IHByb2Rhc2guYXJyYXkuY29uc1xudmFyIGZvckVhY2hBICAgICAgICAgID0gcHJvZGFzaC5hcnJheS5mb3JFYWNoXG52YXIgTm9kZSAgICAgICAgICAgICAgPSBwcm9kYXNoLmdyYXBoLk5vZGVcbnZhciBMb2FkZWRQcm9ncmFtICAgICA9IHR5cGVzLkxvYWRlZFByb2dyYW1cbnZhciBQYXJ0aWNsZSAgICAgICAgICA9IHR5cGVzLlBhcnRpY2xlXG52YXIgRW1pdHRlciAgICAgICAgICAgPSB0eXBlcy5FbWl0dGVyXG52YXIgbG9hZFNoYWRlciAgICAgICAgPSBsb2FkZXJzLmxvYWRTaGFkZXJcbnZhciB1cGRhdGVCdWZmZXIgICAgICA9IHV0aWxzLnVwZGF0ZUJ1ZmZlclxudmFyIGNsZWFyQ29udGV4dCAgICAgID0gdXRpbHMuY2xlYXJDb250ZXh0XG52YXIgcmFuZEJvdW5kICAgICAgICAgPSByYW5kb20ucmFuZEJvdW5kXG52YXIgdXBkYXRlUGh5c2ljcyAgICAgPSBwaHlzaWNzLnVwZGF0ZVBoeXNpY3NcbnZhciB1cGRhdGVFbWl0dGVyICAgICA9IGVtaXR0ZXJzLnVwZGF0ZUVtaXR0ZXJcbnZhciBraWxsVGhlT2xkICAgICAgICA9IGxpZmV0aW1lLmtpbGxUaGVPbGRcbnZhciB3YWxrQW5kRG8gICAgICAgICA9IHJlbmRlcmluZy53YWxrQW5kRG9cbnZhciB0aWNrZXIgICAgICAgICAgICA9IGZwcyh7ZXZlcnk6IDE2fSlcbnZhciBjYW52YXMgICAgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGxheWdyb3VuZFwiKVxudmFyIHN0YXRzICAgICAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0c1wiKVxudmFyIGdsICAgICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKVxudmFyIHNoYWRlcnMgICAgICAgICAgID0ge1xuICB2ZXJ0ZXg6ICAgXCIvc2hhZGVycy8wMXYuZ2xzbFwiLFxuICBmcmFnbWVudDogXCIvc2hhZGVycy8wMWYuZ2xzbFwiXG59XG5cbi8vVE9ETzogc2hvdWxkIGJlIGEgdXRpbGl0eSBmdW5jdGlvbiBpbiBwcm9kYXNoLm9iamVjdFxudmFyIGhhcyA9IGN1cnJ5KGZ1bmN0aW9uIChwcm9wcywgZSkge1xuICB2YXIgcmVzID0gdHJ1ZVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyArK2kpIHtcbiAgICByZXMgPSByZXMgJiYgZS5oYXNPd25Qcm9wZXJ0eShwcm9wc1tpXSlcbiAgfVxuICByZXR1cm4gcmVzXG59KVxuXG4vL1RPRE86IHNob3VsZCBiZSBhIHV0aWxpdHkgZnVjdGlvbiBpbiBwcm9kYXNoLmFycmF5XG52YXIgZmxhdHRlbiA9IGZ1bmN0aW9uIChsaXN0T2ZMaXN0cykge1xuICB2YXIgcmVzID0gW10gXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0T2ZMaXN0cy5sZW5ndGg7ICsraSkge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGlzdE9mTGlzdHNbaV0ubGVuZ3RoOyArK2opIHtcbiAgICAgIHJlcy5wdXNoKGxpc3RPZkxpc3RzW2ldW2pdKVxuICAgIH0gXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG52YXIgaGFzTGlmZVNwYW4gPSBmaWx0ZXJpbmcoaGFzKFtcImxpZmVzcGFuXCJdKSlcbnZhciBpc0VtaXR0ZXIgICA9IGZpbHRlcmluZyhoYXMoW1wiZW1pdHRlclwiXSkpXG52YXIgaGFzUGh5c2ljcyAgPSBmaWx0ZXJpbmcoaGFzKFtcInBvc2l0aW9uXCIsIFwidmVsb2NpdHlcIiwgXCJhY2NlbGVyYXRpb25cIl0pKVxudmFyIGdyb3VwR3JhcGhCeSA9IGZ1bmN0aW9uIChwcmVkRm4sIGdyYXBoKSB7XG4gIHJldHVybiByZWR1Y2VHKHByZWRGbihjb25zQSksIFtdLCBncmFwaClcbn1cblxuZnVuY3Rpb24gbWFrZVVwZGF0ZSAoZ3JvdXBzKSB7XG4gIHZhciBvbGRUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcbiAgdmFyIG5ld1RpbWUgPSBvbGRUaW1lXG4gIHZhciBkVFxuXG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xuICAgIG9sZFRpbWUgPSBuZXdUaW1lXG4gICAgbmV3VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgZFQgICAgICA9IG5ld1RpbWUgLSBvbGRUaW1lXG5cbiAgICAvL1RPRE86IG9wdGltaXplIGJ5IGNyZWF0aW5nIGZ1bmN0aW9ucyBpbiBtYWtlVXBkYXRlXG4gICAgZm9yRWFjaEEoZnVuY3Rpb24gKGUpIHsgdXBkYXRlRW1pdHRlcihuZXdUaW1lLCBlKSB9LCBncm91cHMuZW1pdHRlcnMpXG4gICAgZm9yRWFjaEEoZnVuY3Rpb24gKGUpIHsga2lsbFRoZU9sZChuZXdUaW1lLCBlKSB9LCBncm91cHMubGlmZXNwYW5zKVxuICAgIGZvckVhY2hBKGZ1bmN0aW9uIChlKSB7IHVwZGF0ZVBoeXNpY3MoZFQsIGUpIH0sIGdyb3Vwcy5waHlzaWNzKVxuICB9XG59XG5cbnZhciBnZXRMaXZpbmdQb3NpdGlvbnMgPSByZWR1Y2VBKGNvbXBvc2UoW1xuICBmaWx0ZXJpbmcoZnVuY3Rpb24gKGUpIHsgcmV0dXJuICEhZS5saXZpbmcgfSksXG4gIG1hcHBpbmcoZnVuY3Rpb24gKGUpIHsgcmV0dXJuIFtlLnBvc2l0aW9uWzBdLCBlLnBvc2l0aW9uWzFdXSB9KVxuXSkoY29uc0EpLCBbXSkgXG5cbi8vVE9ETzogVGhpcyBzaG91bGQgYmUgZ3JvdXBzLnJlbmRlcmFibGUgYW5kIG5vdCBwaHlzaWNzIHByb2JhYmx5XG5mdW5jdGlvbiBtYWtlQW5pbWF0ZSAoZ2wsIGxwLCBncm91cHMpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xuICAgIHZhciBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KGZsYXR0ZW4oZ2V0TGl2aW5nUG9zaXRpb25zKGdyb3Vwcy5waHlzaWNzKSkpXG5cbiAgICB0aWNrZXIudGljaygpXG4gICAgY2xlYXJDb250ZXh0KGdsKVxuICAgIHVwZGF0ZUJ1ZmZlcihnbCwgMiwgbHAuYXR0cmlidXRlcy5hUG9zaXRpb24sIGxwLmJ1ZmZlcnMuYVBvc2l0aW9uLCBwb3NpdGlvbnMpXG4gICAgZ2wuZHJhd0FycmF5cyhnbC5QT0lOVFMsIDAsIHBvc2l0aW9ucy5sZW5ndGggLyAyKVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKSBcbiAgfVxufVxuXG4vL1RPRE86IFRoZXJlIHByb2JhYmx5IHNob3VsZCBiZSBhIHJlbmRlcmFibGUgZ3JvdXAgZm9yIGFuaW1hdGUgZnJhbWUgaXRlcmF0aW9uXG5mdW5jdGlvbiBjYWNoZUdyb3VwcyAoc2NlbmVHcmFwaCkge1xuICByZXR1cm4ge1xuICAgIGxpZmVzcGFuczogZ3JvdXBHcmFwaEJ5KGhhc0xpZmVTcGFuLCBzY2VuZUdyYXBoKSxcbiAgICBlbWl0dGVyczogIGdyb3VwR3JhcGhCeShpc0VtaXR0ZXIsIHNjZW5lR3JhcGgpLFxuICAgIHBoeXNpY3M6ICAgZ3JvdXBHcmFwaEJ5KGhhc1BoeXNpY3MsIHNjZW5lR3JhcGgpXG4gIH0gIFxufVxuXG4vL3NldHVwIGZwcyBtb25pdG9yaW5nXG50aWNrZXIub24oXCJkYXRhXCIsIGZ1bmN0aW9uIChmcmFtZXJhdGUpIHtcbiAgc3RhdHMuaW5uZXJIVE1MID0gXCJmcHM6IFwiICsgU3RyaW5nKGZyYW1lcmF0ZSB8IDApXG59KVxuXG5hc3luYy5wYXJhbGxlbCh7XG4gIHZlcnRleDogICBwYXJ0aWFsKGxvYWRTaGFkZXIsIFwiL3NoYWRlcnMvMDF2Lmdsc2xcIiksXG4gIGZyYWdtZW50OiBwYXJ0aWFsKGxvYWRTaGFkZXIsIFwiL3NoYWRlcnMvMDFmLmdsc2xcIilcbn0sIGZ1bmN0aW9uIChlcnIsIHNoYWRlcnMpIHtcbiAgdmFyIGxwICAgICAgICAgICA9IExvYWRlZFByb2dyYW0oZ2wsIHNoYWRlcnMudmVydGV4LCBzaGFkZXJzLmZyYWdtZW50KVxuICB2YXIgc2NlbmVHcmFwaCAgID0gTm9kZSh7fSwgW1xuICAgICAgRW1pdHRlcigxMDAsIDIwMDAsIDEwLCAuMDAwOSwgLjQsIDAsIDAsIDEsIDApXG4gIF0pXG4gIHZhciBncm91cHMgICAgICAgPSBjYWNoZUdyb3VwcyhzY2VuZUdyYXBoKVxuICB2YXIgcG9zaXRpb25zICAgID0gZmxhdHRlbihnZXRMaXZpbmdQb3NpdGlvbnMoZ3JvdXBzLnBoeXNpY3MpKVxuXG4gIHdpbmRvdy5wb3NpdGlvbnMgPSBwb3NpdGlvbnNcbiAgd2luZG93LmdyYXBoICAgICA9IHNjZW5lR3JhcGhcbiAgd2luZG93Lmdyb3VwcyAgICA9IGdyb3Vwc1xuICBnbC51c2VQcm9ncmFtKGxwLnByb2dyYW0pXG4gIGdsLnVuaWZvcm00ZihscC51bmlmb3Jtcy51Q29sb3IsIDEuMCwgMC4wLCAwLjAsIDEuMClcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VBbmltYXRlKGdsLCBscCwgZ3JvdXBzKSlcbiAgc2V0SW50ZXJ2YWwobWFrZVVwZGF0ZShncm91cHMpLCAyNSlcbn0pXG4iLCJ2YXIgcHJvZGFzaCAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciByYW5kb20gICAgPSByZXF1aXJlKFwiLi9yYW5kb21cIilcbnZhciBmaW5kICAgICAgPSBwcm9kYXNoLmFycmF5LmZpbmRcbnZhciByYW5kQm91bmQgPSByYW5kb20ucmFuZEJvdW5kXG52YXIgZW1pdHRlcnMgID0ge31cblxudmFyIHNjYWxlQW5kU3ByZWFkID0gZnVuY3Rpb24gKHNjYWxlLCBzcHJlYWQsIHZhbCkge1xuICByZXR1cm4gc2NhbGUgKiAodmFsICsgcmFuZEJvdW5kKC0xICogc3ByZWFkLCBzcHJlYWQpKVxufVxuXG52YXIgZmluZEZpcnN0RGVhZCA9IGZpbmQoZnVuY3Rpb24gKGUpIHsgcmV0dXJuICFlLmxpdmluZyB9KVxuXG4vKlxuICBjaGVjayBpZiBpdCBpcyB0aW1lIHRvIGZpcmUgYSBwYXJ0aWNsZSwgaWYgc28sIHRoZXkgZmluZFxuICBhIHBhcnRpY2xlIGFuZCBnaXZlIGl0IGEgdmVsb2NpdHkgaW4gdGhlIGRpcmVjdGlvbiBvZiB0aGUgZW1pdHRlclxuICBhbmQgYSB0aW1lIHRvIGRpZVxuICBOLkIuIFRoZSB2ZWxvY2l0eSBpcyBhZmZlY3RlZCBieSBib3RoIHRoZSBzcGVlZCBhbmQgdGhlIHNwcmVhZFxuKi9cbmVtaXR0ZXJzLnVwZGF0ZUVtaXR0ZXIgPSBmdW5jdGlvbiAodGltZSwgZSkge1xuICB2YXIgcGFydGljbGUgXG5cbiAgaWYgKCFlLmVtaXR0ZXIpIHJldHVyblxuICBpZiAodGltZSA+IGUubmV4dEZpcmVUaW1lKSB7XG4gICAgcGFydGljbGUgICAgICAgICAgICAgPSBmaW5kRmlyc3REZWFkKGUuY2hpbGRyZW4pXG4gICAgcGFydGljbGUudGltZVRvRGllICAgPSB0aW1lICsgcGFydGljbGUubGlmZXNwYW5cbiAgICBwYXJ0aWNsZS5saXZpbmcgICAgICA9IHRydWVcbiAgICBwYXJ0aWNsZS5wb3NpdGlvblswXSA9IGUucG9zaXRpb25bMF1cbiAgICBwYXJ0aWNsZS5wb3NpdGlvblsxXSA9IGUucG9zaXRpb25bMV1cbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVswXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblswXSlcbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVsxXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblsxXSlcbiAgICBlLm5leHRGaXJlVGltZSArPSBlLnJhdGVcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVtaXR0ZXJzXG4iLCJ2YXIgdXRpbHMgPSB7fVxuXG51dGlscy5jbGVhckNvbnRleHQgPSBmdW5jdGlvbiAoZ2wpIHtcbiAgZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApXG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXG59XG5cbnV0aWxzLnVwZGF0ZUJ1ZmZlciA9IGZ1bmN0aW9uIChnbCwgY2h1bmtTaXplLCBhdHRyaWJ1dGUsIGJ1ZmZlciwgZGF0YSkge1xuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShhdHRyaWJ1dGUpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoYXR0cmlidXRlLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzXG4iLCJ2YXIgbGlmZXRpbWUgPSB7fVxuXG5saWZldGltZS5raWxsVGhlT2xkID0gZnVuY3Rpb24gKHRpbWUsIGUpIHtcbiAgaWYgKGUubGl2aW5nICYmIHRpbWUgPj0gZS50aW1lVG9EaWUpIGUubGl2aW5nID0gZmFsc2Vcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsaWZldGltZVxuIiwidmFyIGxvYWRlcnMgID0ge31cblxubG9hZGVycy5sb2FkU2hhZGVyID0gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3RcblxuICB4aHIucmVzcG9uc2VUeXBlID0gXCJzdHJpbmdcIlxuICB4aHIub25sb2FkICAgICAgID0gZnVuY3Rpb24gKCkgeyBjYihudWxsLCB4aHIucmVzcG9uc2UpIH1cbiAgeGhyLm9uZXJyb3IgICAgICA9IGZ1bmN0aW9uICgpIHsgY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSkgfVxuICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICB4aHIuc2VuZChudWxsKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWRlcnNcbiIsInZhciBwaHlzaWNzID0ge31cblxucGh5c2ljcy51cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uIChkVCwgZSkge1xuICBlLnBvc2l0aW9uWzBdID0gZS5wb3NpdGlvblswXSArIGRUICogZS52ZWxvY2l0eVswXVxuICBlLnBvc2l0aW9uWzFdID0gZS5wb3NpdGlvblsxXSArIGRUICogZS52ZWxvY2l0eVsxXVxuICByZXR1cm4gZVxufVxuXG5waHlzaWNzLnVwZGF0ZVZlbG9jaXR5ID0gZnVuY3Rpb24gKGRULCBlKSB7XG4gIGUudmVsb2NpdHlbMF0gPSBlLnZlbG9jaXR5WzBdICsgZFQgKiBlLmFjY2VsZXJhdGlvblswXVxuICBlLnZlbG9jaXR5WzFdID0gZS52ZWxvY2l0eVsxXSArIGRUICogZS5hY2NlbGVyYXRpb25bMV1cbiAgcmV0dXJuIGVcbn1cblxucGh5c2ljcy51cGRhdGVQaHlzaWNzID0gZnVuY3Rpb24gKGRULCBlKSB7XG4gIGlmIChlLnZlbG9jaXR5ID09PSB1bmRlZmluZWQpIHJldHVyblxuICBwaHlzaWNzLnVwZGF0ZVZlbG9jaXR5KGRULCBlKVxuICBwaHlzaWNzLnVwZGF0ZVBvc2l0aW9uKGRULCBlKVxuICByZXR1cm4gZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBoeXNpY3NcbiIsInZhciByYW5kb20gPSB7fVxuXG5yYW5kb20ucmFuZEJvdW5kID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByYW5kb21cbiIsInZhciByZW5kZXJpbmcgPSB7fVxuXG5cbi8vSSB3YW50IHRvIGNyYXdsIHRoZSB0cmVlIHN0cnVjdHVyZSByZXR1cm5pbmcgdGhlIHRvdGFsIG51bWJlclxuLy9vZiByZW5kZXJhYmxlIG9iamVjdHNcbi8vXG4vL1RoZW4sIGNyYXdsIHRoZSB0cmVlIHN0cnVjdHVyZSB0byBidWlsZHVwIHRoZSBUeXBlZEFycmF5XG5cbmZ1bmN0aW9uIGZsYXRQdXNoIChob3N0LCBhcikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyLmxlbmd0aDsgKytpKSB7XG4gICAgaG9zdC5wdXNoKGFyW2ldKSBcbiAgfVxuICByZXR1cm4gaG9zdFxufVxuXG5mdW5jdGlvbiBleHRyYWN0UmVuZGVyaW5nRGF0YSAoaG9zdCwgbm9kZSkge1xuICBpZiAoISFub2RlLmxpdmluZyApIHtcbiAgICBmbGF0UHVzaChob3N0LCBub2RlLnBvc2l0aW9uKVxuICAgIC8vZmxhdFB1c2goaG9zdCwgbm9kZS5jb2xvcilcbiAgICAvL2ZsYXRQdXNoKGhvc3QsIG5vZGUuc2l6ZSlcbiAgfVxuXG4gIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICBleHRyYWN0UmVuZGVyaW5nRGF0YShob3N0LCBub2RlLmNoaWxkcmVuW2ldKSBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGhvc3Rcbn1cblxuLypcbiAqIFJlY3VzaXZlbHkgdHJhdmVyc2UgdGhlIHNjZW5lZ3JhcGggKGEgMS1uIHRyZWUpIGFuZFxuICogcmV0dXJuIGEgZmxhdCBsaXN0IG9mIHBvc2l0aW9uIHZlY3RvcnMuICBcbiogKi9cbnJlbmRlcmluZy5mbGF0dGVuU2NlbmVHcmFwaCA9IGZ1bmN0aW9uIChyb290Tm9kZSkge1xuICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShleHRyYWN0UmVuZGVyaW5nRGF0YShbXSwgcm9vdE5vZGUpKVxufVxuXG4vL1RPRE86IFRoaXMgaXNudCByZWFsbHkgZXhwbGljaXRseSBhIHJlbmRlcmluZyBjb25jZXJuLi4gIHBlcmhhcHMgbW92ZT9cbnJlbmRlcmluZy53YWxrQW5kRG8gPSBmdW5jdGlvbiB3YWxrQW5kRG8gKGZuLCBub2RlKSB7XG4gIGZuKG5vZGUpXG5cbiAgaWYgKG5vZGUuY2hpbGRyZW4pIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgIHdhbGtBbmREbyhmbiwgbm9kZS5jaGlsZHJlbltpXSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5vZGVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZW5kZXJpbmdcbiIsInZhciBwcm9kYXNoID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciB1dWlkICAgID0gcmVxdWlyZShcIm5vZGUtdXVpZFwiKVxudmFyIE5vZGUgICAgPSBwcm9kYXNoLmdyYXBoLk5vZGVcbnZhciB2ZWMyICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvdmVjMlwiKVxudmFyIFZlYzIgICAgPSB2ZWMyLlZlYzJcbnZhciB0eXBlcyAgID0ge31cblxuLy9naXZlbiBzcmMgYW5kIHR5cGUsIGNvbXBpbGUgYW5kIHJldHVybiBzaGFkZXJcbmZ1bmN0aW9uIGNvbXBpbGUgKGdsLCBzaGFkZXJUeXBlLCBzcmMpIHtcbiAgdmFyIHNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihzaGFkZXJUeXBlKVxuXG4gIGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNyYylcbiAgZ2wuY29tcGlsZVNoYWRlcihzaGFkZXIpXG4gIHJldHVybiBzaGFkZXJcbn1cblxuLy9saW5rIHlvdXIgcHJvZ3JhbSB3LyBvcGVuZ2xcbmZ1bmN0aW9uIGxpbmsgKGdsLCB2cywgZnMpIHtcbiAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKClcblxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgdnMpIFxuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnMpIFxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKVxuICByZXR1cm4gcHJvZ3JhbVxufVxuXG4vKlxuICogV2Ugd2FudCB0byBjcmVhdGUgYSB3cmFwcGVyIGZvciBhIGxvYWRlZCBnbCBwcm9ncmFtXG4gKiB0aGF0IGluY2x1ZGVzIHBvaW50ZXJzIHRvIGFsbCB0aGUgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZXNcbiAqIGRlZmluZWQgZm9yIHRoaXMgcHJvZ3JhbS4gIFRoaXMgbWFrZXMgaXQgbW9yZSBjb252ZW5pZW50XG4gKiB0byBjaGFuZ2UgdGhlc2UgdmFsdWVzXG4gKi9cbnR5cGVzLkxvYWRlZFByb2dyYW0gPSBmdW5jdGlvbiAoZ2wsIHZTcmMsIGZTcmMpIHtcbiAgdmFyIHZzICAgICAgICAgICAgPSBjb21waWxlKGdsLCBnbC5WRVJURVhfU0hBREVSLCB2U3JjKVxuICB2YXIgZnMgICAgICAgICAgICA9IGNvbXBpbGUoZ2wsIGdsLkZSQUdNRU5UX1NIQURFUiwgZlNyYylcbiAgdmFyIHByb2dyYW0gICAgICAgPSBsaW5rKGdsLCB2cywgZnMpXG4gIHZhciBudW1BdHRyaWJ1dGVzID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUylcbiAgdmFyIG51bVVuaWZvcm1zICAgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9VTklGT1JNUylcbiAgdmFyIGxwID0ge1xuICAgIHZlcnRleDoge1xuICAgICAgc3JjOiAgICB2U3JjLFxuICAgICAgc2hhZGVyOiB2cyBcbiAgICB9LFxuICAgIGZyYWdtZW50OiB7XG4gICAgICBzcmM6ICAgIGZTcmMsXG4gICAgICBzaGFkZXI6IGZzIFxuICAgIH0sXG4gICAgcHJvZ3JhbTogICAgcHJvZ3JhbSxcbiAgICB1bmlmb3JtczogICB7fSwgXG4gICAgYXR0cmlidXRlczoge30sXG4gICAgYnVmZmVyczogICAge31cbiAgfVxuICB2YXIgYU5hbWVcbiAgdmFyIHVOYW1lXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1BdHRyaWJ1dGVzOyArK2kpIHtcbiAgICBhTmFtZSAgICAgICAgICAgICAgICA9IGdsLmdldEFjdGl2ZUF0dHJpYihwcm9ncmFtLCBpKS5uYW1lXG4gICAgbHAuYXR0cmlidXRlc1thTmFtZV0gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBhTmFtZSlcbiAgICBscC5idWZmZXJzW2FOYW1lXSAgICA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG4gIH1cblxuICBmb3IgKHZhciBqID0gMDsgaiA8IG51bVVuaWZvcm1zOyArK2opIHtcbiAgICB1TmFtZSAgICAgICAgICAgICAgPSBnbC5nZXRBY3RpdmVVbmlmb3JtKHByb2dyYW0sIGopLm5hbWVcbiAgICBscC51bmlmb3Jtc1t1TmFtZV0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgdU5hbWUpXG4gIH1cblxuICByZXR1cm4gbHAgXG59XG5cbnR5cGVzLlBhcnRpY2xlID0gZnVuY3Rpb24gKGxpZmVzcGFuLCBweCwgcHksIHZ4LCB2eSwgYXgsIGF5KSB7XG4gIHJldHVybiBOb2RlKHtcbiAgICBpZDogICAgICAgICAgIHV1aWQudjQoKSxcbiAgICBwb3NpdGlvbjogICAgIFZlYzIocHgsIHB5KSxcbiAgICB2ZWxvY2l0eTogICAgIFZlYzIodngsIHZ5KSxcbiAgICBhY2NlbGVyYXRpb246IFZlYzIoYXgsIGF5KSxcbiAgICByZW5kZXJhYmxlOiAgIHRydWUsXG4gICAgdGltZVRvRGllOiAgICAwLFxuICAgIGxpZmVzcGFuOiAgICAgbGlmZXNwYW4sXG4gICAgbGl2aW5nOiAgICAgICBmYWxzZVxuICB9KSBcbn1cblxudHlwZXMuRW1pdHRlciA9IGZ1bmN0aW9uIChjb3VudCwgbGlmZXNwYW4sIHJhdGUsIHNwZWVkLCBzcHJlYWQsIHB4LCBweSwgZHgsIGR5KSB7XG4gIHZhciBwYXJ0aWNsZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgIHBhcnRpY2xlcy5wdXNoKHR5cGVzLlBhcnRpY2xlKGxpZmVzcGFuLCBweCwgcHksIDAsIDAsIDAsIC0wLjAwMDAwMDkpKVxuICB9XG5cbiAgcmV0dXJuIE5vZGUoe1xuICAgIGlkOiAgICAgICAgICAgdXVpZC52NCgpLFxuICAgIGVtaXR0ZXI6ICAgICAgdHJ1ZSxcbiAgICByYXRlOiAgICAgICAgIHJhdGUsIFxuICAgIHNwZWVkOiAgICAgICAgc3BlZWQsXG4gICAgc3ByZWFkOiAgICAgICBzcHJlYWQsXG4gICAgbmV4dEZpcmVUaW1lOiAwLFxuICAgIHBvc2l0aW9uOiAgICAgVmVjMihweCwgcHkpLFxuICAgIHZlbG9jaXR5OiAgICAgVmVjMigwLCAwKSxcbiAgICBhY2NlbGVyYXRpb246IFZlYzIoMCwgMCksXG4gICAgZGlyZWN0aW9uOiAgICBWZWMyKGR4LCBkeSksXG4gICAgcmVuZGVyYWJsZTogICBmYWxzZSxcbiAgICBsaXZpbmc6ICAgICAgIHRydWVcbiAgfSwgcGFydGljbGVzKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHR5cGVzXG4iLCJ2YXIgdmVjMiA9IHt9XG5cbnZlYzIuVmVjMiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gIHZhciBvdXQgPSBuZXcgRmxvYXQzMkFycmF5KDIpXG5cbiAgb3V0WzBdID0geFxuICBvdXRbMV0gPSB5XG5cbiAgcmV0dXJuIG91dFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzJcbiJdfQ==
