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
var compose     = fns.compose
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

var flatten = function (listOfLists) {
  var res = [] 

  for (var i = 0; i < listOfLists.length; ++i) {
    for (var j = 0; j < listOfLists[i].length; ++j) {
      res.push(listOfLists[i][j])
    } 
  }
  return res
}

var map = curry(function (fn, ar) {
  return reduce(mapping(fn, cons), [], ar)
})

var filter = curry(function (predFn, ar) {
  return reduce(filtering(predFn, cons), [], ar)
})

var mapcat = curry(function (fn, ar) {
  return compose([flatten, map(fn)])(ar)
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
array.flatten = flatten
array.mapcat  = mapcat

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
var array       = require("./array")
var consA       = array.cons
var curry       = fns.curry
var g           = {}

var Node = function (hash, nodes) {
  hash.children = nodes || []
  return hash
}

var cons = function (node, childNode) {
  node.children.push(childNode)
  return node
}

var reduce = curry(function reduce (fn, accum, node) {
  accum = fn(accum, node)

  for (var i = 0; i < node.children.length; ++i) {
    reduce(fn, accum, node.children[i]) 
  }
  return accum
})

var forEach = curry(function (fn, node) {
  fn(node)  

  for (var i = 0; i < node.children.length; ++i) {
    forEach(fn, node.children[i])
  }
  return node
})

/*
 * Iterate over all nodes in the tree pushing them onto an array
 * Note.  This is simply a special case of the reduce function
 * where all outputs are pushed onto an array
 */
var flatten = function (redFn, graph) {
  return reduce(redFn(consA), [], graph)
}

g.Node       = Node
g.cons       = cons
g.reduce     = reduce
g.forEach    = forEach
g.flatten    = flatten

module.exports = g

},{"./array":5,"./functions":6}],8:[function(require,module,exports){
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

var has = curry(function (props, e) {
  var res = true

  for (var i = 0; i < props.length; ++i) {
    res = res && e.hasOwnProperty(props[i])
  }
  return res
})

object.keys   = keys
object.cons   = cons
object.map    = map
object.reduce = reduce
object.filter = filter
object.has    = has

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
var filtering         = prodash.transducers.filtering
var mapping           = prodash.transducers.mapping
var curry             = prodash.functions.curry
var compose           = prodash.functions.compose
var partial           = prodash.functions.partial
var reduceG           = prodash.graph.reduce
var reduceA           = prodash.array.reduce
var consA             = prodash.array.cons
var forEachA          = prodash.array.forEach
var flattenA          = prodash.array.flatten
var filterA           = prodash.array.filter
var mapA              = prodash.array.map
var mapcatA           = prodash.array.mapcat
var has               = prodash.object.has
var Node              = prodash.graph.Node
var flattenG          = prodash.graph.flatten
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
var ticker            = fps({every: 16})
var canvas            = document.getElementById("playground")
var stats             = document.getElementById("stats")
var gl                = canvas.getContext("webgl")
var shaders           = {
  vertex:   "/shaders/01v.glsl",
  fragment: "/shaders/01f.glsl"
}

var hasLifeSpan        = filtering(has(["lifespan"]))
var isEmitter          = filtering(function (n) { return !!n.emitter })
var hasPhysics         = filtering(has(["position", "velocity", "acceleration"]))
var isLiving           = filtering(function (n) { return !!n.living })
var getPosition        = mapping(function (n) { return n.position })
var getLivingPositions = mapcatA(compose([getPosition, isLiving]))


function makeUpdate (groups) {
  var oldTime = performance.now()
  var newTime = oldTime
  var dT

  return function update () {
    oldTime = newTime
    newTime = performance.now()
    dT      = newTime - oldTime

    //TODO: optimize by creating functions in makeUpdate
    forEachA(partial(updateEmitter, newTime), groups.emitters)
    forEachA(partial(killTheOld, newTime), groups.lifespans)
    forEachA(partial(updatePhysics, dT), groups.physics)
  }
}

//TODO: This should be groups.renderable and not physics probably
function makeAnimate (gl, lp, groups) {
  return function animate () {
    var positions = new Float32Array(getLivingPositions(groups.physics))

    window.positions = positions
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
    lifespans: flattenG(hasLifeSpan, sceneGraph),
    emitters:  flattenG(isEmitter, sceneGraph),
    physics:   flattenG(hasPhysics, sceneGraph)
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
      Emitter(100, 1000, 1000, .0009, .4, 0, 0, 1, 0)
  ])
  var groups       = cacheGroups(sceneGraph)

  window.graph     = sceneGraph
  window.groups    = groups
  gl.useProgram(lp.program)
  gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
  requestAnimationFrame(makeAnimate(gl, lp, groups))
  setInterval(makeUpdate(groups), 25)
})

},{"../modules/emitters":11,"../modules/gl-utils":12,"../modules/lifetime":13,"../modules/loaders":14,"../modules/physics":15,"../modules/random":16,"../modules/types":17,"async":"async","fps":2,"prodash":4}],11:[function(require,module,exports){
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

},{"../modules/vec2":18,"node-uuid":"node-uuid","prodash":4}],18:[function(require,module,exports){
var vec2 = {}

vec2.Vec2 = function (x, y) {
  var out = new Float32Array(2)

  out[0] = x
  out[1] = y

  return out
}

module.exports = vec2

},{}]},{},[10])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvaW5kZXguanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9wcm9kYXNoLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvYXJyYXkuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9mdW5jdGlvbnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9wcm9kYXNoL3NyYy9ncmFwaC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvc3JjL29iamVjdC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvc3JjL3RyYW5zZHVjZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvZXhhbXBsZXMvMDEtQmFzaWMtU2V0dXAuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2VtaXR0ZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9nbC11dGlscy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbGlmZXRpbWUuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2xvYWRlcnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3BoeXNpY3MuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3JhbmRvbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvdHlwZXMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3ZlYzIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyXG4gICwgaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gZnBzXG5cbi8vIFRyeSB1c2UgcGVyZm9ybWFuY2Uubm93KCksIG90aGVyd2lzZSB0cnlcbi8vICtuZXcgRGF0ZS5cbnZhciBub3cgPSAoXG4gIChmdW5jdGlvbigpeyByZXR1cm4gdGhpcyB9KCkpLnBlcmZvcm1hbmNlICYmXG4gICdmdW5jdGlvbicgPT09IHR5cGVvZiBwZXJmb3JtYW5jZS5ub3dcbikgPyBmdW5jdGlvbigpIHsgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpIH1cbiAgOiBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHsgcmV0dXJuICtuZXcgRGF0ZSB9XG5cbmZ1bmN0aW9uIGZwcyhvcHRzKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBmcHMpKSByZXR1cm4gbmV3IGZwcyhvcHRzKVxuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKVxuXG4gIG9wdHMgPSBvcHRzIHx8IHt9XG4gIHRoaXMubGFzdCA9IG5vdygpXG4gIHRoaXMucmF0ZSA9IDBcbiAgdGhpcy50aW1lID0gMFxuICB0aGlzLmRlY2F5ID0gb3B0cy5kZWNheSB8fCAxXG4gIHRoaXMuZXZlcnkgPSBvcHRzLmV2ZXJ5IHx8IDFcbiAgdGhpcy50aWNrcyA9IDBcbn1cbmluaGVyaXRzKGZwcywgRXZlbnRFbWl0dGVyKVxuXG5mcHMucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHRpbWUgPSBub3coKVxuICAgICwgZGlmZiA9IHRpbWUgLSB0aGlzLmxhc3RcbiAgICAsIGZwcyA9IGRpZmZcblxuICB0aGlzLnRpY2tzICs9IDFcbiAgdGhpcy5sYXN0ID0gdGltZVxuICB0aGlzLnRpbWUgKz0gKGZwcyAtIHRoaXMudGltZSkgKiB0aGlzLmRlY2F5XG4gIHRoaXMucmF0ZSA9IDEwMDAgLyB0aGlzLnRpbWVcbiAgaWYgKCEodGhpcy50aWNrcyAlIHRoaXMuZXZlcnkpKSB0aGlzLmVtaXQoJ2RhdGEnLCB0aGlzLnJhdGUpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gaW5oZXJpdHNcblxuZnVuY3Rpb24gaW5oZXJpdHMgKGMsIHAsIHByb3RvKSB7XG4gIHByb3RvID0gcHJvdG8gfHwge31cbiAgdmFyIGUgPSB7fVxuICA7W2MucHJvdG90eXBlLCBwcm90b10uZm9yRWFjaChmdW5jdGlvbiAocykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHMpLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgIGVba10gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHMsIGspXG4gICAgfSlcbiAgfSlcbiAgYy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHAucHJvdG90eXBlLCBlKVxuICBjLnN1cGVyID0gcFxufVxuXG4vL2Z1bmN0aW9uIENoaWxkICgpIHtcbi8vICBDaGlsZC5zdXBlci5jYWxsKHRoaXMpXG4vLyAgY29uc29sZS5lcnJvcihbdGhpc1xuLy8gICAgICAgICAgICAgICAgLHRoaXMuY29uc3RydWN0b3Jcbi8vICAgICAgICAgICAgICAgICx0aGlzLmNvbnN0cnVjdG9yID09PSBDaGlsZFxuLy8gICAgICAgICAgICAgICAgLHRoaXMuY29uc3RydWN0b3Iuc3VwZXIgPT09IFBhcmVudFxuLy8gICAgICAgICAgICAgICAgLE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSA9PT0gQ2hpbGQucHJvdG90eXBlXG4vLyAgICAgICAgICAgICAgICAsT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSlcbi8vICAgICAgICAgICAgICAgICA9PT0gUGFyZW50LnByb3RvdHlwZVxuLy8gICAgICAgICAgICAgICAgLHRoaXMgaW5zdGFuY2VvZiBDaGlsZFxuLy8gICAgICAgICAgICAgICAgLHRoaXMgaW5zdGFuY2VvZiBQYXJlbnRdKVxuLy99XG4vL2Z1bmN0aW9uIFBhcmVudCAoKSB7fVxuLy9pbmhlcml0cyhDaGlsZCwgUGFyZW50KVxuLy9uZXcgQ2hpbGRcbiIsInZhciBwcm9kYXNoID0ge1xuICBmdW5jdGlvbnM6ICAgcmVxdWlyZShcIi4vc3JjL2Z1bmN0aW9uc1wiKSxcbiAgdHJhbnNkdWNlcnM6IHJlcXVpcmUoXCIuL3NyYy90cmFuc2R1Y2Vyc1wiKSxcbiAgYXJyYXk6ICAgICAgIHJlcXVpcmUoXCIuL3NyYy9hcnJheVwiKSxcbiAgb2JqZWN0OiAgICAgIHJlcXVpcmUoXCIuL3NyYy9vYmplY3RcIiksXG4gIGdyYXBoOiAgICAgICByZXF1aXJlKFwiLi9zcmMvZ3JhcGhcIilcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwcm9kYXNoXG4iLCJ2YXIgdHJhbnNkdWNlcnMgPSByZXF1aXJlKFwiLi90cmFuc2R1Y2Vyc1wiKVxudmFyIGZucyAgICAgICAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgbWFwcGluZyAgICAgPSB0cmFuc2R1Y2Vycy5tYXBwaW5nXG52YXIgZmlsdGVyaW5nICAgPSB0cmFuc2R1Y2Vycy5maWx0ZXJpbmdcbnZhciBjdXJyeSAgICAgICA9IGZucy5jdXJyeVxudmFyIGNvbXBvc2UgICAgID0gZm5zLmNvbXBvc2VcbnZhciBhcnJheSAgICAgICA9IHt9XG5cbnZhciBjb25zID0gZnVuY3Rpb24gKGFyLCB4KSB7XG4gIGFyLnB1c2goeClcbiAgcmV0dXJuIGFyXG59XG5cbnZhciByZWR1Y2UgPSBjdXJyeShmdW5jdGlvbiAoZm4sIGFjY3VtLCBhcikgeyAgXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXIubGVuZ3RoOyArK2kpIHtcbiAgICBhY2N1bSA9IGZuKGFjY3VtLCBhcltpXSkgXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59KVxuXG52YXIgZmxhdHRlbiA9IGZ1bmN0aW9uIChsaXN0T2ZMaXN0cykge1xuICB2YXIgcmVzID0gW10gXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0T2ZMaXN0cy5sZW5ndGg7ICsraSkge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGlzdE9mTGlzdHNbaV0ubGVuZ3RoOyArK2opIHtcbiAgICAgIHJlcy5wdXNoKGxpc3RPZkxpc3RzW2ldW2pdKVxuICAgIH0gXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG52YXIgbWFwID0gY3VycnkoZnVuY3Rpb24gKGZuLCBhcikge1xuICByZXR1cm4gcmVkdWNlKG1hcHBpbmcoZm4sIGNvbnMpLCBbXSwgYXIpXG59KVxuXG52YXIgZmlsdGVyID0gY3VycnkoZnVuY3Rpb24gKHByZWRGbiwgYXIpIHtcbiAgcmV0dXJuIHJlZHVjZShmaWx0ZXJpbmcocHJlZEZuLCBjb25zKSwgW10sIGFyKVxufSlcblxudmFyIG1hcGNhdCA9IGN1cnJ5KGZ1bmN0aW9uIChmbiwgYXIpIHtcbiAgcmV0dXJuIGNvbXBvc2UoW2ZsYXR0ZW4sIG1hcChmbildKShhcilcbn0pXG5cbnZhciBmaW5kID0gY3VycnkoZnVuY3Rpb24gKHByZWRGbiwgYXIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhci5sZW5ndGg7ICsraSkge1xuICAgIGlmIChwcmVkRm4oYXJbaV0pKSByZXR1cm4gYXJbaV0gXG4gIH1cbiAgcmV0dXJuIG51bGxcbn0pXG5cbi8vVE9ETzogYWRkIHRlc3RzIVxudmFyIGZvckVhY2ggPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgYXIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhci5sZW5ndGg7ICsraSkge1xuICAgIHRyYW5zRm4oYXJbaV0pIFxuICB9XG59KVxuXG5hcnJheS5jb25zICAgID0gY29uc1xuYXJyYXkucmVkdWNlICA9IHJlZHVjZVxuYXJyYXkubWFwICAgICA9IG1hcFxuYXJyYXkuZmlsdGVyICA9IGZpbHRlclxuYXJyYXkuZmluZCAgICA9IGZpbmRcbmFycmF5LmZvckVhY2ggPSBmb3JFYWNoXG5hcnJheS5mbGF0dGVuID0gZmxhdHRlblxuYXJyYXkubWFwY2F0ICA9IG1hcGNhdFxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5XG4iLCJ2YXIgZm5zID0ge31cblxudmFyIGRlbWV0aG9kaXplID0gZnVuY3Rpb24gKG9iaiwgZm5OYW1lKSB7XG4gIHJldHVybiBGdW5jdGlvbi5wcm90b3R5cGUuY2FsbC5iaW5kKG9ialtmbk5hbWVdKSBcbn1cblxudmFyIHJldmVyc2UgPSBmdW5jdGlvbiAobGlzdCkge1xuICB2YXIgYmFja3dhcmRzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICBiYWNrd2FyZHMudW5zaGlmdChsaXN0W2ldKSBcbiAgfVxuXG4gIHJldHVybiBiYWNrd2FyZHNcbn1cblxuLy9kb24ndCBleHBvcnQ/ICBqdXN0IHVzZWQgaW4gZGVmaW5pdGlvbnNcbnZhciBiYWRTbGljZSA9IGRlbWV0aG9kaXplKEFycmF5LnByb3RvdHlwZSwgXCJzbGljZVwiKVxuXG52YXIgdG9BcnJheSA9IGZ1bmN0aW9uIChhcmdzKSB7IHJldHVybiBiYWRTbGljZShhcmdzLCAwKSB9XG5cbnZhciBhbGxCdXRGaXJzdCA9IGZ1bmN0aW9uIChhcmdzKSB7IHJldHVybiBiYWRTbGljZShhcmdzLCAxKSB9XG5cbnZhciBjb25jYXQgPSBkZW1ldGhvZGl6ZShBcnJheS5wcm90b3R5cGUsIFwiY29uY2F0XCIpXG5cbnZhciBhcHBseSA9IGZ1bmN0aW9uIChmbiwgYXJnc0xpc3QpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3NMaXN0KSB9XG5cbnZhciBjYWxsID0gZnVuY3Rpb24gKGZuKSB7IHJldHVybiBmbi5hcHBseSh0aGlzLCBhbGxCdXRGaXJzdChhcmd1bWVudHMpKSB9XG5cbnZhciBiaW5kID0gZnVuY3Rpb24gKGZuLCBvYmopIHsgcmV0dXJuIGZuLmJpbmQob2JqLCBhbGxCdXRGaXJzdChhcmd1bWVudHMpKSB9XG5cbnZhciBjb21wb3NlID0gZnVuY3Rpb24gKGZucykge1xuICByZXR1cm4gZnVuY3Rpb24gY29tcG9zZWQgKHZhbCkge1xuICAgIGZvciAodmFyIGkgPSBmbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHZhbCA9IGZuc1tpXSh2YWwpXG4gICAgfVxuICAgIHJldHVybiB2YWxcbiAgfVxufVxuXG52YXIgZmxpcCA9IGZ1bmN0aW9uIChmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhcHBseShmbiwgcmV2ZXJzZShiYWRTbGljZShhcmd1bWVudHMpKSlcbiAgfVxufVxuXG52YXIgc2xpY2UgPSBmbGlwKGJhZFNsaWNlKVxuXG52YXIgcGFydGlhbCA9IGZ1bmN0aW9uIChmbikge1xuICB2YXIgYXJncyA9IHNsaWNlKDEsIGFyZ3VtZW50cylcblxuICByZXR1cm4gZnVuY3Rpb24gcGFydGlhbGVkICgpIHtcbiAgICB2YXIgaW5uZXJBcmdzID0gdG9BcnJheShhcmd1bWVudHMpXG4gICAgdmFyIGFsbEFyZ3MgICA9IGNvbmNhdChhcmdzLCBpbm5lckFyZ3MpXG5cbiAgICByZXR1cm4gYXBwbHkoZm4sIGFsbEFyZ3MpXG4gIH1cbn1cblxuLy91dGlsaXR5IGZ1bmN0aW9uIHVzZWQgaW4gY3VycnkgZGVmXG52YXIgaW5uZXJDdXJyeSA9IGZ1bmN0aW9uIChmbikge1xuICB2YXIgYXJncyA9IGFsbEJ1dEZpcnN0KGFyZ3VtZW50cyk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5uZXJBcmdzID0gdG9BcnJheShhcmd1bWVudHMpO1xuXG4gICAgcmV0dXJuIGFwcGx5KGZuLCBjb25jYXQoYXJncywgaW5uZXJBcmdzKSk7XG4gIH07XG59O1xuXG52YXIgY3VycnkgPSBmdW5jdGlvbiBjdXJyeSAoZm4pIHtcbiAgdmFyIGZuQXJpdHkgPSBmbi5sZW5ndGhcblxuICByZXR1cm4gZnVuY3Rpb24gY3VycmllZCAoKSB7XG4gICAgdmFyIG5vdEVub3VnaEFyZ3MgICAgPSBhcmd1bWVudHMubGVuZ3RoIDwgZm5Bcml0eVxuICAgIHZhciBtaXNzaW5nQXJnc0NvdW50ID0gZm5Bcml0eSAtIGFyZ3VtZW50cy5sZW5ndGhcbiAgICB2YXIgc3RpbGxNaXNzaW5nQXJncyA9IG1pc3NpbmdBcmdzQ291bnQgPiAwXG4gICAgdmFyIGFyZ3MgICAgICAgICAgICAgPSBjb25jYXQoW2ZuXSwgdG9BcnJheShhcmd1bWVudHMpKVxuICAgIHZhciByZXN1bHRcblxuICAgIGlmIChub3RFbm91Z2hBcmdzICYmIHN0aWxsTWlzc2luZ0FyZ3MpIHtcbiAgICAgIHJlc3VsdCA9IGN1cnJ5KGFwcGx5KGlubmVyQ3VycnksIGFyZ3MpLCBtaXNzaW5nQXJnc0NvdW50KVxuICAgIH0gZWxzZSBpZiAobm90RW5vdWdoQXJncykge1xuICAgICAgcmVzdWx0ID0gYXBwbHkoaW5uZXJDdXJyeSwgYXJncylcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gYXBwbHkoZm4sIHNsaWNlKGFyZ3VtZW50cykpIFxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuZm5zLmRlbWV0aG9kaXplID0gZGVtZXRob2RpemVcbmZucy5yZXZlcnNlICAgICA9IHJldmVyc2VcbmZucy5zbGljZSAgICAgICA9IHNsaWNlXG5mbnMuY29uY2F0ICAgICAgPSBjb25jYXRcbmZucy5mbGlwICAgICAgICA9IGZsaXBcbmZucy5jb21wb3NlICAgICA9IGNvbXBvc2VcbmZucy5wYXJ0aWFsICAgICA9IHBhcnRpYWxcbmZucy5jdXJyeSAgICAgICA9IGN1cnJ5XG5mbnMuYmluZCAgICAgICAgPSBiaW5kXG5mbnMuY2FsbCAgICAgICAgPSBjYWxsXG5mbnMuYXBwbHkgICAgICAgPSBhcHBseVxubW9kdWxlLmV4cG9ydHMgID0gZm5zXG4iLCJ2YXIgZm5zICAgICAgICAgPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcbnZhciBhcnJheSAgICAgICA9IHJlcXVpcmUoXCIuL2FycmF5XCIpXG52YXIgY29uc0EgICAgICAgPSBhcnJheS5jb25zXG52YXIgY3VycnkgICAgICAgPSBmbnMuY3VycnlcbnZhciBnICAgICAgICAgICA9IHt9XG5cbnZhciBOb2RlID0gZnVuY3Rpb24gKGhhc2gsIG5vZGVzKSB7XG4gIGhhc2guY2hpbGRyZW4gPSBub2RlcyB8fCBbXVxuICByZXR1cm4gaGFzaFxufVxuXG52YXIgY29ucyA9IGZ1bmN0aW9uIChub2RlLCBjaGlsZE5vZGUpIHtcbiAgbm9kZS5jaGlsZHJlbi5wdXNoKGNoaWxkTm9kZSlcbiAgcmV0dXJuIG5vZGVcbn1cblxudmFyIHJlZHVjZSA9IGN1cnJ5KGZ1bmN0aW9uIHJlZHVjZSAoZm4sIGFjY3VtLCBub2RlKSB7XG4gIGFjY3VtID0gZm4oYWNjdW0sIG5vZGUpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgcmVkdWNlKGZuLCBhY2N1bSwgbm9kZS5jaGlsZHJlbltpXSkgXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59KVxuXG52YXIgZm9yRWFjaCA9IGN1cnJ5KGZ1bmN0aW9uIChmbiwgbm9kZSkge1xuICBmbihub2RlKSAgXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgZm9yRWFjaChmbiwgbm9kZS5jaGlsZHJlbltpXSlcbiAgfVxuICByZXR1cm4gbm9kZVxufSlcblxuLypcbiAqIEl0ZXJhdGUgb3ZlciBhbGwgbm9kZXMgaW4gdGhlIHRyZWUgcHVzaGluZyB0aGVtIG9udG8gYW4gYXJyYXlcbiAqIE5vdGUuICBUaGlzIGlzIHNpbXBseSBhIHNwZWNpYWwgY2FzZSBvZiB0aGUgcmVkdWNlIGZ1bmN0aW9uXG4gKiB3aGVyZSBhbGwgb3V0cHV0cyBhcmUgcHVzaGVkIG9udG8gYW4gYXJyYXlcbiAqL1xudmFyIGZsYXR0ZW4gPSBmdW5jdGlvbiAocmVkRm4sIGdyYXBoKSB7XG4gIHJldHVybiByZWR1Y2UocmVkRm4oY29uc0EpLCBbXSwgZ3JhcGgpXG59XG5cbmcuTm9kZSAgICAgICA9IE5vZGVcbmcuY29ucyAgICAgICA9IGNvbnNcbmcucmVkdWNlICAgICA9IHJlZHVjZVxuZy5mb3JFYWNoICAgID0gZm9yRWFjaFxuZy5mbGF0dGVuICAgID0gZmxhdHRlblxuXG5tb2R1bGUuZXhwb3J0cyA9IGdcbiIsInZhciBmbnMgICAgICAgICA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxudmFyIHRyYW5zZHVjZXJzID0gcmVxdWlyZShcIi4vdHJhbnNkdWNlcnNcIilcbnZhciBtYXBwaW5nICAgICA9IHRyYW5zZHVjZXJzLm1hcHBpbmdcbnZhciBmaWx0ZXJpbmcgICA9IHRyYW5zZHVjZXJzLmZpbHRlcmluZ1xudmFyIGN1cnJ5ICAgICAgID0gZm5zLmN1cnJ5XG52YXIgb2JqZWN0ICAgICAgPSB7fVxuXG52YXIga2V5cyA9IE9iamVjdC5rZXlzXG5cbnZhciBjb25zID0gZnVuY3Rpb24gKGhvc3QsIG9iaikge1xuICB2YXIgaW5kZXggPSAtMVxuICB2YXIga3MgICAgPSBrZXlzKG9iailcbiAgdmFyIGxlbiAgID0ga3MubGVuZ3RoXG4gIHZhciBrZXlcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbikge1xuICAgIGtleSAgICAgICA9IGtzW2luZGV4XVxuICAgIGhvc3Rba2V5XSA9IG9ialtrZXldXG4gIH1cbiAgcmV0dXJuIGhvc3Rcbn1cblxudmFyIHJlZHVjZSA9IGZ1bmN0aW9uIChmbiwgYWNjdW0sIG9iaikge1xuICB2YXIgaW5kZXggPSAtMVxuICB2YXIga3MgICAgPSBrZXlzKG9iailcbiAgdmFyIGxlbiAgID0ga3MubGVuZ3RoXG4gIHZhciBrZXlcbiAgdmFyIGt2XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW4pIHtcbiAgICBrZXkgICAgID0ga3NbaW5kZXhdXG4gICAga3YgICAgICA9IHt9XG4gICAga3Zba2V5XSA9IG9ialtrZXldXG4gICAgYWNjdW0gICA9IGZuKGFjY3VtLCBrdilcbiAgfVxuICByZXR1cm4gYWNjdW1cbn1cblxudmFyIG1hcCA9IGN1cnJ5KGZ1bmN0aW9uIChmbiwgb2JqKSB7XG4gIHJldHVybiByZWR1Y2UobWFwcGluZyhmbiwgY29ucyksIHt9LCBvYmopXG59KVxuXG52YXIgZmlsdGVyID0gY3VycnkoZnVuY3Rpb24gKHByZWRGbiwgb2JqKSB7XG4gIHJldHVybiByZWR1Y2UoZmlsdGVyaW5nKHByZWRGbiwgY29ucyksIHt9LCBvYmopXG59KVxuXG52YXIgaGFzID0gY3VycnkoZnVuY3Rpb24gKHByb3BzLCBlKSB7XG4gIHZhciByZXMgPSB0cnVlXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7ICsraSkge1xuICAgIHJlcyA9IHJlcyAmJiBlLmhhc093blByb3BlcnR5KHByb3BzW2ldKVxuICB9XG4gIHJldHVybiByZXNcbn0pXG5cbm9iamVjdC5rZXlzICAgPSBrZXlzXG5vYmplY3QuY29ucyAgID0gY29uc1xub2JqZWN0Lm1hcCAgICA9IG1hcFxub2JqZWN0LnJlZHVjZSA9IHJlZHVjZVxub2JqZWN0LmZpbHRlciA9IGZpbHRlclxub2JqZWN0LmhhcyAgICA9IGhhc1xuXG5tb2R1bGUuZXhwb3J0cyA9IG9iamVjdFxuIiwidmFyIGZucyAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgY3VycnkgPSBmbnMuY3VycnlcbnZhciB0cmFucyA9IHt9XG5cbnZhciBtYXBwaW5nID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIHN0ZXBGbikge1xuICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgIHJldHVybiBzdGVwRm4oYWNjLCB0cmFuc0ZuKHgpKVxuICB9XG59KVxuXG52YXIgZmlsdGVyaW5nID0gY3VycnkoZnVuY3Rpb24gKHByZWRGbiwgc3RlcEZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgcmV0dXJuIHByZWRGbih4KSA/IHN0ZXBGbihhY2MsIHgpIDogYWNjIFxuICB9XG59KVxuXG50cmFucy5tYXBwaW5nICAgPSBtYXBwaW5nXG50cmFucy5maWx0ZXJpbmcgPSBmaWx0ZXJpbmdcblxubW9kdWxlLmV4cG9ydHMgPSB0cmFuc1xuIiwidmFyIHByb2Rhc2ggICAgICAgICAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciBhc3luYyAgICAgICAgICAgICA9IHJlcXVpcmUoXCJhc3luY1wiKVxudmFyIGZwcyAgICAgICAgICAgICAgID0gcmVxdWlyZShcImZwc1wiKVxudmFyIHR5cGVzICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvdHlwZXNcIilcbnZhciBsb2FkZXJzICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2xvYWRlcnNcIilcbnZhciB1dGlscyAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2dsLXV0aWxzXCIpXG52YXIgcmFuZG9tICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9yYW5kb21cIilcbnZhciBwaHlzaWNzICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL3BoeXNpY3NcIilcbnZhciBsaWZldGltZSAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2xpZmV0aW1lXCIpXG52YXIgZW1pdHRlcnMgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9lbWl0dGVyc1wiKVxudmFyIGZpbHRlcmluZyAgICAgICAgID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5maWx0ZXJpbmdcbnZhciBtYXBwaW5nICAgICAgICAgICA9IHByb2Rhc2gudHJhbnNkdWNlcnMubWFwcGluZ1xudmFyIGN1cnJ5ICAgICAgICAgICAgID0gcHJvZGFzaC5mdW5jdGlvbnMuY3VycnlcbnZhciBjb21wb3NlICAgICAgICAgICA9IHByb2Rhc2guZnVuY3Rpb25zLmNvbXBvc2VcbnZhciBwYXJ0aWFsICAgICAgICAgICA9IHByb2Rhc2guZnVuY3Rpb25zLnBhcnRpYWxcbnZhciByZWR1Y2VHICAgICAgICAgICA9IHByb2Rhc2guZ3JhcGgucmVkdWNlXG52YXIgcmVkdWNlQSAgICAgICAgICAgPSBwcm9kYXNoLmFycmF5LnJlZHVjZVxudmFyIGNvbnNBICAgICAgICAgICAgID0gcHJvZGFzaC5hcnJheS5jb25zXG52YXIgZm9yRWFjaEEgICAgICAgICAgPSBwcm9kYXNoLmFycmF5LmZvckVhY2hcbnZhciBmbGF0dGVuQSAgICAgICAgICA9IHByb2Rhc2guYXJyYXkuZmxhdHRlblxudmFyIGZpbHRlckEgICAgICAgICAgID0gcHJvZGFzaC5hcnJheS5maWx0ZXJcbnZhciBtYXBBICAgICAgICAgICAgICA9IHByb2Rhc2guYXJyYXkubWFwXG52YXIgbWFwY2F0QSAgICAgICAgICAgPSBwcm9kYXNoLmFycmF5Lm1hcGNhdFxudmFyIGhhcyAgICAgICAgICAgICAgID0gcHJvZGFzaC5vYmplY3QuaGFzXG52YXIgTm9kZSAgICAgICAgICAgICAgPSBwcm9kYXNoLmdyYXBoLk5vZGVcbnZhciBmbGF0dGVuRyAgICAgICAgICA9IHByb2Rhc2guZ3JhcGguZmxhdHRlblxudmFyIExvYWRlZFByb2dyYW0gICAgID0gdHlwZXMuTG9hZGVkUHJvZ3JhbVxudmFyIFBhcnRpY2xlICAgICAgICAgID0gdHlwZXMuUGFydGljbGVcbnZhciBFbWl0dGVyICAgICAgICAgICA9IHR5cGVzLkVtaXR0ZXJcbnZhciBsb2FkU2hhZGVyICAgICAgICA9IGxvYWRlcnMubG9hZFNoYWRlclxudmFyIHVwZGF0ZUJ1ZmZlciAgICAgID0gdXRpbHMudXBkYXRlQnVmZmVyXG52YXIgY2xlYXJDb250ZXh0ICAgICAgPSB1dGlscy5jbGVhckNvbnRleHRcbnZhciByYW5kQm91bmQgICAgICAgICA9IHJhbmRvbS5yYW5kQm91bmRcbnZhciB1cGRhdGVQaHlzaWNzICAgICA9IHBoeXNpY3MudXBkYXRlUGh5c2ljc1xudmFyIHVwZGF0ZUVtaXR0ZXIgICAgID0gZW1pdHRlcnMudXBkYXRlRW1pdHRlclxudmFyIGtpbGxUaGVPbGQgICAgICAgID0gbGlmZXRpbWUua2lsbFRoZU9sZFxudmFyIHRpY2tlciAgICAgICAgICAgID0gZnBzKHtldmVyeTogMTZ9KVxudmFyIGNhbnZhcyAgICAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwbGF5Z3JvdW5kXCIpXG52YXIgc3RhdHMgICAgICAgICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInN0YXRzXCIpXG52YXIgZ2wgICAgICAgICAgICAgICAgPSBjYW52YXMuZ2V0Q29udGV4dChcIndlYmdsXCIpXG52YXIgc2hhZGVycyAgICAgICAgICAgPSB7XG4gIHZlcnRleDogICBcIi9zaGFkZXJzLzAxdi5nbHNsXCIsXG4gIGZyYWdtZW50OiBcIi9zaGFkZXJzLzAxZi5nbHNsXCJcbn1cblxudmFyIGhhc0xpZmVTcGFuICAgICAgICA9IGZpbHRlcmluZyhoYXMoW1wibGlmZXNwYW5cIl0pKVxudmFyIGlzRW1pdHRlciAgICAgICAgICA9IGZpbHRlcmluZyhmdW5jdGlvbiAobikgeyByZXR1cm4gISFuLmVtaXR0ZXIgfSlcbnZhciBoYXNQaHlzaWNzICAgICAgICAgPSBmaWx0ZXJpbmcoaGFzKFtcInBvc2l0aW9uXCIsIFwidmVsb2NpdHlcIiwgXCJhY2NlbGVyYXRpb25cIl0pKVxudmFyIGlzTGl2aW5nICAgICAgICAgICA9IGZpbHRlcmluZyhmdW5jdGlvbiAobikgeyByZXR1cm4gISFuLmxpdmluZyB9KVxudmFyIGdldFBvc2l0aW9uICAgICAgICA9IG1hcHBpbmcoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIG4ucG9zaXRpb24gfSlcbnZhciBnZXRMaXZpbmdQb3NpdGlvbnMgPSBtYXBjYXRBKGNvbXBvc2UoW2dldFBvc2l0aW9uLCBpc0xpdmluZ10pKVxuXG5cbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKGdyb3Vwcykge1xuICB2YXIgb2xkVGltZSA9IHBlcmZvcm1hbmNlLm5vdygpXG4gIHZhciBuZXdUaW1lID0gb2xkVGltZVxuICB2YXIgZFRcblxuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlICgpIHtcbiAgICBvbGRUaW1lID0gbmV3VGltZVxuICAgIG5ld1RpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxuICAgIGRUICAgICAgPSBuZXdUaW1lIC0gb2xkVGltZVxuXG4gICAgLy9UT0RPOiBvcHRpbWl6ZSBieSBjcmVhdGluZyBmdW5jdGlvbnMgaW4gbWFrZVVwZGF0ZVxuICAgIGZvckVhY2hBKHBhcnRpYWwodXBkYXRlRW1pdHRlciwgbmV3VGltZSksIGdyb3Vwcy5lbWl0dGVycylcbiAgICBmb3JFYWNoQShwYXJ0aWFsKGtpbGxUaGVPbGQsIG5ld1RpbWUpLCBncm91cHMubGlmZXNwYW5zKVxuICAgIGZvckVhY2hBKHBhcnRpYWwodXBkYXRlUGh5c2ljcywgZFQpLCBncm91cHMucGh5c2ljcylcbiAgfVxufVxuXG4vL1RPRE86IFRoaXMgc2hvdWxkIGJlIGdyb3Vwcy5yZW5kZXJhYmxlIGFuZCBub3QgcGh5c2ljcyBwcm9iYWJseVxuZnVuY3Rpb24gbWFrZUFuaW1hdGUgKGdsLCBscCwgZ3JvdXBzKSB7XG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcbiAgICB2YXIgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShnZXRMaXZpbmdQb3NpdGlvbnMoZ3JvdXBzLnBoeXNpY3MpKVxuXG4gICAgd2luZG93LnBvc2l0aW9ucyA9IHBvc2l0aW9uc1xuICAgIHRpY2tlci50aWNrKClcbiAgICBjbGVhckNvbnRleHQoZ2wpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCAyLCBscC5hdHRyaWJ1dGVzLmFQb3NpdGlvbiwgbHAuYnVmZmVycy5hUG9zaXRpb24sIHBvc2l0aW9ucylcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlBPSU5UUywgMCwgcG9zaXRpb25zLmxlbmd0aCAvIDIpXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpIFxuICB9XG59XG5cbi8vVE9ETzogVGhlcmUgcHJvYmFibHkgc2hvdWxkIGJlIGEgcmVuZGVyYWJsZSBncm91cCBmb3IgYW5pbWF0ZSBmcmFtZSBpdGVyYXRpb25cbmZ1bmN0aW9uIGNhY2hlR3JvdXBzIChzY2VuZUdyYXBoKSB7XG4gIHJldHVybiB7XG4gICAgbGlmZXNwYW5zOiBmbGF0dGVuRyhoYXNMaWZlU3Bhbiwgc2NlbmVHcmFwaCksXG4gICAgZW1pdHRlcnM6ICBmbGF0dGVuRyhpc0VtaXR0ZXIsIHNjZW5lR3JhcGgpLFxuICAgIHBoeXNpY3M6ICAgZmxhdHRlbkcoaGFzUGh5c2ljcywgc2NlbmVHcmFwaClcbiAgfSAgXG59XG5cbi8vc2V0dXAgZnBzIG1vbml0b3JpbmdcbnRpY2tlci5vbihcImRhdGFcIiwgZnVuY3Rpb24gKGZyYW1lcmF0ZSkge1xuICBzdGF0cy5pbm5lckhUTUwgPSBcImZwczogXCIgKyBTdHJpbmcoZnJhbWVyYXRlIHwgMClcbn0pXG5cbmFzeW5jLnBhcmFsbGVsKHtcbiAgdmVydGV4OiAgIHBhcnRpYWwobG9hZFNoYWRlciwgXCIvc2hhZGVycy8wMXYuZ2xzbFwiKSxcbiAgZnJhZ21lbnQ6IHBhcnRpYWwobG9hZFNoYWRlciwgXCIvc2hhZGVycy8wMWYuZ2xzbFwiKVxufSwgZnVuY3Rpb24gKGVyciwgc2hhZGVycykge1xuICB2YXIgbHAgICAgICAgICAgID0gTG9hZGVkUHJvZ3JhbShnbCwgc2hhZGVycy52ZXJ0ZXgsIHNoYWRlcnMuZnJhZ21lbnQpXG4gIHZhciBzY2VuZUdyYXBoICAgPSBOb2RlKHt9LCBbXG4gICAgICBFbWl0dGVyKDEwMCwgMTAwMCwgMTAwMCwgLjAwMDksIC40LCAwLCAwLCAxLCAwKVxuICBdKVxuICB2YXIgZ3JvdXBzICAgICAgID0gY2FjaGVHcm91cHMoc2NlbmVHcmFwaClcblxuICB3aW5kb3cuZ3JhcGggICAgID0gc2NlbmVHcmFwaFxuICB3aW5kb3cuZ3JvdXBzICAgID0gZ3JvdXBzXG4gIGdsLnVzZVByb2dyYW0obHAucHJvZ3JhbSlcbiAgZ2wudW5pZm9ybTRmKGxwLnVuaWZvcm1zLnVDb2xvciwgMS4wLCAwLjAsIDAuMCwgMS4wKVxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUobWFrZUFuaW1hdGUoZ2wsIGxwLCBncm91cHMpKVxuICBzZXRJbnRlcnZhbChtYWtlVXBkYXRlKGdyb3VwcyksIDI1KVxufSlcbiIsInZhciBwcm9kYXNoICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIHJhbmRvbSAgICA9IHJlcXVpcmUoXCIuL3JhbmRvbVwiKVxudmFyIGZpbmQgICAgICA9IHByb2Rhc2guYXJyYXkuZmluZFxudmFyIHJhbmRCb3VuZCA9IHJhbmRvbS5yYW5kQm91bmRcbnZhciBlbWl0dGVycyAgPSB7fVxuXG52YXIgc2NhbGVBbmRTcHJlYWQgPSBmdW5jdGlvbiAoc2NhbGUsIHNwcmVhZCwgdmFsKSB7XG4gIHJldHVybiBzY2FsZSAqICh2YWwgKyByYW5kQm91bmQoLTEgKiBzcHJlYWQsIHNwcmVhZCkpXG59XG5cbnZhciBmaW5kRmlyc3REZWFkID0gZmluZChmdW5jdGlvbiAoZSkgeyByZXR1cm4gIWUubGl2aW5nIH0pXG5cbi8qXG4gIGNoZWNrIGlmIGl0IGlzIHRpbWUgdG8gZmlyZSBhIHBhcnRpY2xlLCBpZiBzbywgdGhleSBmaW5kXG4gIGEgcGFydGljbGUgYW5kIGdpdmUgaXQgYSB2ZWxvY2l0eSBpbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSBlbWl0dGVyXG4gIGFuZCBhIHRpbWUgdG8gZGllXG4gIE4uQi4gVGhlIHZlbG9jaXR5IGlzIGFmZmVjdGVkIGJ5IGJvdGggdGhlIHNwZWVkIGFuZCB0aGUgc3ByZWFkXG4qL1xuZW1pdHRlcnMudXBkYXRlRW1pdHRlciA9IGZ1bmN0aW9uICh0aW1lLCBlKSB7XG4gIHZhciBwYXJ0aWNsZSBcblxuICBpZiAodGltZSA+IGUubmV4dEZpcmVUaW1lKSB7XG4gICAgcGFydGljbGUgICAgICAgICAgICAgPSBmaW5kRmlyc3REZWFkKGUuY2hpbGRyZW4pXG4gICAgcGFydGljbGUudGltZVRvRGllICAgPSB0aW1lICsgcGFydGljbGUubGlmZXNwYW5cbiAgICBwYXJ0aWNsZS5saXZpbmcgICAgICA9IHRydWVcbiAgICBwYXJ0aWNsZS5wb3NpdGlvblswXSA9IGUucG9zaXRpb25bMF1cbiAgICBwYXJ0aWNsZS5wb3NpdGlvblsxXSA9IGUucG9zaXRpb25bMV1cbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVswXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblswXSlcbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVsxXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblsxXSlcbiAgICBlLm5leHRGaXJlVGltZSArPSBlLnJhdGVcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVtaXR0ZXJzXG4iLCJ2YXIgdXRpbHMgPSB7fVxuXG51dGlscy5jbGVhckNvbnRleHQgPSBmdW5jdGlvbiAoZ2wpIHtcbiAgZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApXG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXG59XG5cbnV0aWxzLnVwZGF0ZUJ1ZmZlciA9IGZ1bmN0aW9uIChnbCwgY2h1bmtTaXplLCBhdHRyaWJ1dGUsIGJ1ZmZlciwgZGF0YSkge1xuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgYnVmZmVyKVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgZGF0YSwgZ2wuRFlOQU1JQ19EUkFXKVxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShhdHRyaWJ1dGUpXG4gIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoYXR0cmlidXRlLCBjaHVua1NpemUsIGdsLkZMT0FULCBmYWxzZSwgMCwgMClcbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHV0aWxzXG4iLCJ2YXIgbGlmZXRpbWUgPSB7fVxuXG5saWZldGltZS5raWxsVGhlT2xkID0gZnVuY3Rpb24gKHRpbWUsIGUpIHtcbiAgaWYgKGUubGl2aW5nICYmIHRpbWUgPj0gZS50aW1lVG9EaWUpIGUubGl2aW5nID0gZmFsc2Vcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsaWZldGltZVxuIiwidmFyIGxvYWRlcnMgID0ge31cblxubG9hZGVycy5sb2FkU2hhZGVyID0gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3RcblxuICB4aHIucmVzcG9uc2VUeXBlID0gXCJzdHJpbmdcIlxuICB4aHIub25sb2FkICAgICAgID0gZnVuY3Rpb24gKCkgeyBjYihudWxsLCB4aHIucmVzcG9uc2UpIH1cbiAgeGhyLm9uZXJyb3IgICAgICA9IGZ1bmN0aW9uICgpIHsgY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSkgfVxuICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICB4aHIuc2VuZChudWxsKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWRlcnNcbiIsInZhciBwaHlzaWNzID0ge31cblxucGh5c2ljcy51cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uIChkVCwgZSkge1xuICBlLnBvc2l0aW9uWzBdID0gZS5wb3NpdGlvblswXSArIGRUICogZS52ZWxvY2l0eVswXVxuICBlLnBvc2l0aW9uWzFdID0gZS5wb3NpdGlvblsxXSArIGRUICogZS52ZWxvY2l0eVsxXVxuICByZXR1cm4gZVxufVxuXG5waHlzaWNzLnVwZGF0ZVZlbG9jaXR5ID0gZnVuY3Rpb24gKGRULCBlKSB7XG4gIGUudmVsb2NpdHlbMF0gPSBlLnZlbG9jaXR5WzBdICsgZFQgKiBlLmFjY2VsZXJhdGlvblswXVxuICBlLnZlbG9jaXR5WzFdID0gZS52ZWxvY2l0eVsxXSArIGRUICogZS5hY2NlbGVyYXRpb25bMV1cbiAgcmV0dXJuIGVcbn1cblxucGh5c2ljcy51cGRhdGVQaHlzaWNzID0gZnVuY3Rpb24gKGRULCBlKSB7XG4gIHBoeXNpY3MudXBkYXRlVmVsb2NpdHkoZFQsIGUpXG4gIHBoeXNpY3MudXBkYXRlUG9zaXRpb24oZFQsIGUpXG4gIHJldHVybiBlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGh5c2ljc1xuIiwidmFyIHJhbmRvbSA9IHt9XG5cbnJhbmRvbS5yYW5kQm91bmQgPSBmdW5jdGlvbiAobWluLCBtYXgpIHtcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJhbmRvbVxuIiwidmFyIHByb2Rhc2ggPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIHV1aWQgICAgPSByZXF1aXJlKFwibm9kZS11dWlkXCIpXG52YXIgTm9kZSAgICA9IHByb2Rhc2guZ3JhcGguTm9kZVxudmFyIHZlYzIgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy92ZWMyXCIpXG52YXIgVmVjMiAgICA9IHZlYzIuVmVjMlxudmFyIHR5cGVzICAgPSB7fVxuXG4vL2dpdmVuIHNyYyBhbmQgdHlwZSwgY29tcGlsZSBhbmQgcmV0dXJuIHNoYWRlclxuZnVuY3Rpb24gY29tcGlsZSAoZ2wsIHNoYWRlclR5cGUsIHNyYykge1xuICB2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHNoYWRlclR5cGUpXG5cbiAgZ2wuc2hhZGVyU291cmNlKHNoYWRlciwgc3JjKVxuICBnbC5jb21waWxlU2hhZGVyKHNoYWRlcilcbiAgcmV0dXJuIHNoYWRlclxufVxuXG4vL2xpbmsgeW91ciBwcm9ncmFtIHcvIG9wZW5nbFxuZnVuY3Rpb24gbGluayAoZ2wsIHZzLCBmcykge1xuICB2YXIgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKVxuXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2cykgXG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmcykgXG4gIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pXG4gIHJldHVybiBwcm9ncmFtXG59XG5cbi8qXG4gKiBXZSB3YW50IHRvIGNyZWF0ZSBhIHdyYXBwZXIgZm9yIGEgbG9hZGVkIGdsIHByb2dyYW1cbiAqIHRoYXQgaW5jbHVkZXMgcG9pbnRlcnMgdG8gYWxsIHRoZSB1bmlmb3JtcyBhbmQgYXR0cmlidXRlc1xuICogZGVmaW5lZCBmb3IgdGhpcyBwcm9ncmFtLiAgVGhpcyBtYWtlcyBpdCBtb3JlIGNvbnZlbmllbnRcbiAqIHRvIGNoYW5nZSB0aGVzZSB2YWx1ZXNcbiAqL1xudHlwZXMuTG9hZGVkUHJvZ3JhbSA9IGZ1bmN0aW9uIChnbCwgdlNyYywgZlNyYykge1xuICB2YXIgdnMgICAgICAgICAgICA9IGNvbXBpbGUoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIHZhciBmcyAgICAgICAgICAgID0gY29tcGlsZShnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICB2YXIgcHJvZ3JhbSAgICAgICA9IGxpbmsoZ2wsIHZzLCBmcylcbiAgdmFyIG51bUF0dHJpYnV0ZXMgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKVxuICB2YXIgbnVtVW5pZm9ybXMgICA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKVxuICB2YXIgbHAgPSB7XG4gICAgdmVydGV4OiB7XG4gICAgICBzcmM6ICAgIHZTcmMsXG4gICAgICBzaGFkZXI6IHZzIFxuICAgIH0sXG4gICAgZnJhZ21lbnQ6IHtcbiAgICAgIHNyYzogICAgZlNyYyxcbiAgICAgIHNoYWRlcjogZnMgXG4gICAgfSxcbiAgICBwcm9ncmFtOiAgICBwcm9ncmFtLFxuICAgIHVuaWZvcm1zOiAgIHt9LCBcbiAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICBidWZmZXJzOiAgICB7fVxuICB9XG4gIHZhciBhTmFtZVxuICB2YXIgdU5hbWVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bUF0dHJpYnV0ZXM7ICsraSkge1xuICAgIGFOYW1lICAgICAgICAgICAgICAgID0gZ2wuZ2V0QWN0aXZlQXR0cmliKHByb2dyYW0sIGkpLm5hbWVcbiAgICBscC5hdHRyaWJ1dGVzW2FOYW1lXSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIGFOYW1lKVxuICAgIGxwLmJ1ZmZlcnNbYU5hbWVdICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgfVxuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgbnVtVW5pZm9ybXM7ICsraikge1xuICAgIHVOYW1lICAgICAgICAgICAgICA9IGdsLmdldEFjdGl2ZVVuaWZvcm0ocHJvZ3JhbSwgaikubmFtZVxuICAgIGxwLnVuaWZvcm1zW3VOYW1lXSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCB1TmFtZSlcbiAgfVxuXG4gIHJldHVybiBscCBcbn1cblxudHlwZXMuUGFydGljbGUgPSBmdW5jdGlvbiAobGlmZXNwYW4sIHB4LCBweSwgdngsIHZ5LCBheCwgYXkpIHtcbiAgcmV0dXJuIE5vZGUoe1xuICAgIGlkOiAgICAgICAgICAgdXVpZC52NCgpLFxuICAgIHBvc2l0aW9uOiAgICAgVmVjMihweCwgcHkpLFxuICAgIHZlbG9jaXR5OiAgICAgVmVjMih2eCwgdnkpLFxuICAgIGFjY2VsZXJhdGlvbjogVmVjMihheCwgYXkpLFxuICAgIHJlbmRlcmFibGU6ICAgdHJ1ZSxcbiAgICB0aW1lVG9EaWU6ICAgIDAsXG4gICAgbGlmZXNwYW46ICAgICBsaWZlc3BhbixcbiAgICBsaXZpbmc6ICAgICAgIGZhbHNlXG4gIH0pIFxufVxuXG50eXBlcy5FbWl0dGVyID0gZnVuY3Rpb24gKGNvdW50LCBsaWZlc3BhbiwgcmF0ZSwgc3BlZWQsIHNwcmVhZCwgcHgsIHB5LCBkeCwgZHkpIHtcbiAgdmFyIHBhcnRpY2xlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgcGFydGljbGVzLnB1c2godHlwZXMuUGFydGljbGUobGlmZXNwYW4sIHB4LCBweSwgMCwgMCwgMCwgLTAuMDAwMDAwOSkpXG4gIH1cblxuICByZXR1cm4gTm9kZSh7XG4gICAgaWQ6ICAgICAgICAgICB1dWlkLnY0KCksXG4gICAgZW1pdHRlcjogICAgICB0cnVlLFxuICAgIHJhdGU6ICAgICAgICAgcmF0ZSwgXG4gICAgc3BlZWQ6ICAgICAgICBzcGVlZCxcbiAgICBzcHJlYWQ6ICAgICAgIHNwcmVhZCxcbiAgICBuZXh0RmlyZVRpbWU6IDAsXG4gICAgcG9zaXRpb246ICAgICBWZWMyKHB4LCBweSksXG4gICAgdmVsb2NpdHk6ICAgICBWZWMyKDAsIDApLFxuICAgIGFjY2VsZXJhdGlvbjogVmVjMigwLCAwKSxcbiAgICBkaXJlY3Rpb246ICAgIFZlYzIoZHgsIGR5KSxcbiAgICByZW5kZXJhYmxlOiAgIGZhbHNlLFxuICAgIGxpdmluZzogICAgICAgdHJ1ZVxuICB9LCBwYXJ0aWNsZXMpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gdHlwZXNcbiIsInZhciB2ZWMyID0ge31cblxudmVjMi5WZWMyID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgdmFyIG91dCA9IG5ldyBGbG9hdDMyQXJyYXkoMilcblxuICBvdXRbMF0gPSB4XG4gIG91dFsxXSA9IHlcblxuICByZXR1cm4gb3V0XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdmVjMlxuIl19
