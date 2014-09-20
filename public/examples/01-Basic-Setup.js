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
var async             = require("async")
var mat3              = require("gl-mat3")
var mat4              = require("gl-mat4")
var fps               = require("fps")
var vec2              = require("../modules/vec2")
var vec3              = require("../modules/vec3")
var vec4              = require("../modules/vec4")
var types             = require("../modules/types")
var loaders           = require("../modules/loaders")
var utils             = require("../modules/gl-utils")
var random            = require("../modules/random")
var physics           = require("../modules/physics")
var lifetime          = require("../modules/lifetime")
var emitters          = require("../modules/emitters")
var rendering         = require("../modules/rendering")
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
var flattenSceneGraph = rendering.flattenSceneGraph
var walkAndDo         = rendering.walkAndDo
var ticker            = fps({every: 100})
var canvas            = document.getElementById("playground")
var stats             = document.getElementById("stats")
var gl                = canvas.getContext("webgl")
var shaders           = {
  vertex:   "/shaders/01v.glsl",
  fragment: "/shaders/01f.glsl"
}

function makeUpdate (sceneGraph) {
  var oldTime = performance.now()
  var newTime = oldTime
  var dT

  return function update () {
    oldTime = newTime
    newTime = performance.now()
    dT      = newTime - oldTime

    //TODO: optimize this instead of looping 3 seperate times...
    
    walkAndDo(function (e) { updateEmitter(newTime, e) }, sceneGraph)
    walkAndDo(function (e) { killTheOld(newTime, e) }, sceneGraph)
    walkAndDo(function (e) { updatePhysics(dT, e) }, sceneGraph)
  }
}

function makeAnimate (gl, lp, sceneGraph) {
  return function animate () {
    var positions = flattenSceneGraph(sceneGraph)

    ticker.tick()
    clearContext(gl)
    updateBuffer(gl, 2, lp.attributes.aPosition, lp.buffers.aPosition, positions)
    gl.drawArrays(gl.POINTS, 0, positions.length / 2)
    requestAnimationFrame(animate) 
  }
}

//setup fps monitoring
ticker.on("data", function (framerate) {
  stats.innerHTML = "fps: " + String(framerate | 0)
})

async.parallel({
  vertex:   function (cb) { loadShader("/shaders/01v.glsl", cb) },
  fragment: function (cb) { loadShader("/shaders/01f.glsl", cb) }
}, function (err, shaders) {
  var lp           = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var sceneGraph   = Emitter(300, 2000, 10, .0009, .4, 0, 0, 0, 1) 

  gl.useProgram(lp.program)
  gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
  requestAnimationFrame(makeAnimate(gl, lp, sceneGraph))
  setInterval(makeUpdate(sceneGraph), 25)
})

},{"../modules/emitters":5,"../modules/gl-utils":6,"../modules/lifetime":7,"../modules/loaders":8,"../modules/physics":9,"../modules/random":10,"../modules/rendering":11,"../modules/types":12,"../modules/vec2":13,"../modules/vec3":14,"../modules/vec4":15,"async":"async","fps":2,"gl-mat3":"gl-mat3","gl-mat4":"gl-mat4"}],5:[function(require,module,exports){
var _         = require("lodash")
var random    = require("./random")
var find      = _.find
var randBound = random.randBound
var emitters  = {}

/*
  check if it is time to fire a particle, if so, they find
  a particle and giev it a velocity in the direction of the emitter
  and a time to die
  N.B. The velocity is affected by both the speed and the spread
*/
emitters.updateEmitter = function (time, e) {
  var particle 

  if (!e.emitter) return
  if (time > e.nextFireTime) {
    particle             = find(e.children, {"living": false})
    particle.timeToDie   = time + particle.lifespan
    particle.living      = true
    particle.position[0] = e.position[0]
    particle.position[1] = e.position[1]
    particle.velocity[0] = e.speed * (e.direction[0] + randBound(-1 * e.spread, e.spread))
    particle.velocity[1] = e.speed * (e.direction[1] + randBound(-1 * e.spread, e.spread))
    //particle.velocity[0] = e.speed * (e.direction[0])
    //particle.velocity[1] = e.speed * (e.direction[1])

    e.nextFireTime += e.rate
  }
}

module.exports = emitters

},{"./random":10,"lodash":"lodash"}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
var lifetime = {}

lifetime.killTheOld = function (time, e) {
  if (e.living && time >= e.timeToDie) e.living = false
}

module.exports = lifetime

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
var random = {}

random.randBound = function (min, max) {
  return Math.random() * (max - min) + min
}

module.exports = random

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
var uuid  = require("node-uuid")
var vec2  = require("../modules/vec2")
var Vec2  = vec2.Vec2
var types = {}

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
  return {
    id:           uuid.v4(),
    position:     Vec2(px, py),
    velocity:     Vec2(vx, vy),
    acceleration: Vec2(ax, ay),
    renderable:   true,
    timeToDie:    0,
    lifespan:     lifespan,
    living:       false
  }   
}

types.Emitter = function (count, lifespan, rate, speed, spread, px, py, dx, dy) {
  var particles = []

  for (var i = 0; i < count; ++i) {
    particles.push(types.Particle(lifespan, px, py, 0, 0, 0, -0.0000009))
  }

  return {
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
    living:       true,
    children:     particles
  } 
}

module.exports = types

},{"../modules/vec2":13,"node-uuid":"node-uuid"}],13:[function(require,module,exports){
var vec2 = {}

vec2.Vec2 = function (x, y) {
  var out = new Float32Array(2)

  out[0] = x
  out[1] = y

  return out
}

module.exports = vec2

},{}],14:[function(require,module,exports){
var vec3 = {}

vec3.Vec3 = function (x, y, z) {
  var out = new Float32Array(3)

  out[0] = x
  out[1] = y
  out[2] = z

  return out
}

module.exports = vec3

},{}],15:[function(require,module,exports){
var vec4 = {}

vec4.Vec4 = function (x, y, z, w) {
  var out = new Float42Array(4)

  out[0] = x
  out[1] = y
  out[2] = z
  out[3] = w

  return out
}

module.exports = vec4

},{}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvaW5kZXguanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL25vZGVfbW9kdWxlcy9mcHMvbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvZXhhbXBsZXMvMDEtQmFzaWMtU2V0dXAuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2VtaXR0ZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9nbC11dGlscy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbGlmZXRpbWUuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2xvYWRlcnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3BoeXNpY3MuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3JhbmRvbS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvcmVuZGVyaW5nLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy90eXBlcy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvdmVjMi5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvdmVjMy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvdmVjNC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfVxuICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyXG4gICwgaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpXG5cbm1vZHVsZS5leHBvcnRzID0gZnBzXG5cbi8vIFRyeSB1c2UgcGVyZm9ybWFuY2Uubm93KCksIG90aGVyd2lzZSB0cnlcbi8vICtuZXcgRGF0ZS5cbnZhciBub3cgPSAoXG4gIChmdW5jdGlvbigpeyByZXR1cm4gdGhpcyB9KCkpLnBlcmZvcm1hbmNlICYmXG4gICdmdW5jdGlvbicgPT09IHR5cGVvZiBwZXJmb3JtYW5jZS5ub3dcbikgPyBmdW5jdGlvbigpIHsgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpIH1cbiAgOiBEYXRlLm5vdyB8fCBmdW5jdGlvbigpIHsgcmV0dXJuICtuZXcgRGF0ZSB9XG5cbmZ1bmN0aW9uIGZwcyhvcHRzKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBmcHMpKSByZXR1cm4gbmV3IGZwcyhvcHRzKVxuICBFdmVudEVtaXR0ZXIuY2FsbCh0aGlzKVxuXG4gIG9wdHMgPSBvcHRzIHx8IHt9XG4gIHRoaXMubGFzdCA9IG5vdygpXG4gIHRoaXMucmF0ZSA9IDBcbiAgdGhpcy50aW1lID0gMFxuICB0aGlzLmRlY2F5ID0gb3B0cy5kZWNheSB8fCAxXG4gIHRoaXMuZXZlcnkgPSBvcHRzLmV2ZXJ5IHx8IDFcbiAgdGhpcy50aWNrcyA9IDBcbn1cbmluaGVyaXRzKGZwcywgRXZlbnRFbWl0dGVyKVxuXG5mcHMucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHRpbWUgPSBub3coKVxuICAgICwgZGlmZiA9IHRpbWUgLSB0aGlzLmxhc3RcbiAgICAsIGZwcyA9IGRpZmZcblxuICB0aGlzLnRpY2tzICs9IDFcbiAgdGhpcy5sYXN0ID0gdGltZVxuICB0aGlzLnRpbWUgKz0gKGZwcyAtIHRoaXMudGltZSkgKiB0aGlzLmRlY2F5XG4gIHRoaXMucmF0ZSA9IDEwMDAgLyB0aGlzLnRpbWVcbiAgaWYgKCEodGhpcy50aWNrcyAlIHRoaXMuZXZlcnkpKSB0aGlzLmVtaXQoJ2RhdGEnLCB0aGlzLnJhdGUpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gaW5oZXJpdHNcblxuZnVuY3Rpb24gaW5oZXJpdHMgKGMsIHAsIHByb3RvKSB7XG4gIHByb3RvID0gcHJvdG8gfHwge31cbiAgdmFyIGUgPSB7fVxuICA7W2MucHJvdG90eXBlLCBwcm90b10uZm9yRWFjaChmdW5jdGlvbiAocykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHMpLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgIGVba10gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHMsIGspXG4gICAgfSlcbiAgfSlcbiAgYy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHAucHJvdG90eXBlLCBlKVxuICBjLnN1cGVyID0gcFxufVxuXG4vL2Z1bmN0aW9uIENoaWxkICgpIHtcbi8vICBDaGlsZC5zdXBlci5jYWxsKHRoaXMpXG4vLyAgY29uc29sZS5lcnJvcihbdGhpc1xuLy8gICAgICAgICAgICAgICAgLHRoaXMuY29uc3RydWN0b3Jcbi8vICAgICAgICAgICAgICAgICx0aGlzLmNvbnN0cnVjdG9yID09PSBDaGlsZFxuLy8gICAgICAgICAgICAgICAgLHRoaXMuY29uc3RydWN0b3Iuc3VwZXIgPT09IFBhcmVudFxuLy8gICAgICAgICAgICAgICAgLE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSA9PT0gQ2hpbGQucHJvdG90eXBlXG4vLyAgICAgICAgICAgICAgICAsT2JqZWN0LmdldFByb3RvdHlwZU9mKE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSlcbi8vICAgICAgICAgICAgICAgICA9PT0gUGFyZW50LnByb3RvdHlwZVxuLy8gICAgICAgICAgICAgICAgLHRoaXMgaW5zdGFuY2VvZiBDaGlsZFxuLy8gICAgICAgICAgICAgICAgLHRoaXMgaW5zdGFuY2VvZiBQYXJlbnRdKVxuLy99XG4vL2Z1bmN0aW9uIFBhcmVudCAoKSB7fVxuLy9pbmhlcml0cyhDaGlsZCwgUGFyZW50KVxuLy9uZXcgQ2hpbGRcbiIsInZhciBhc3luYyAgICAgICAgICAgICA9IHJlcXVpcmUoXCJhc3luY1wiKVxudmFyIG1hdDMgICAgICAgICAgICAgID0gcmVxdWlyZShcImdsLW1hdDNcIilcbnZhciBtYXQ0ICAgICAgICAgICAgICA9IHJlcXVpcmUoXCJnbC1tYXQ0XCIpXG52YXIgZnBzICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiZnBzXCIpXG52YXIgdmVjMiAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy92ZWMyXCIpXG52YXIgdmVjMyAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy92ZWMzXCIpXG52YXIgdmVjNCAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy92ZWM0XCIpXG52YXIgdHlwZXMgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy90eXBlc1wiKVxudmFyIGxvYWRlcnMgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbG9hZGVyc1wiKVxudmFyIHV0aWxzICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvZ2wtdXRpbHNcIilcbnZhciByYW5kb20gICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL3JhbmRvbVwiKVxudmFyIHBoeXNpY3MgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvcGh5c2ljc1wiKVxudmFyIGxpZmV0aW1lICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbGlmZXRpbWVcIilcbnZhciBlbWl0dGVycyAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2VtaXR0ZXJzXCIpXG52YXIgcmVuZGVyaW5nICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9yZW5kZXJpbmdcIilcbnZhciBMb2FkZWRQcm9ncmFtICAgICA9IHR5cGVzLkxvYWRlZFByb2dyYW1cbnZhciBQYXJ0aWNsZSAgICAgICAgICA9IHR5cGVzLlBhcnRpY2xlXG52YXIgRW1pdHRlciAgICAgICAgICAgPSB0eXBlcy5FbWl0dGVyXG52YXIgbG9hZFNoYWRlciAgICAgICAgPSBsb2FkZXJzLmxvYWRTaGFkZXJcbnZhciB1cGRhdGVCdWZmZXIgICAgICA9IHV0aWxzLnVwZGF0ZUJ1ZmZlclxudmFyIGNsZWFyQ29udGV4dCAgICAgID0gdXRpbHMuY2xlYXJDb250ZXh0XG52YXIgcmFuZEJvdW5kICAgICAgICAgPSByYW5kb20ucmFuZEJvdW5kXG52YXIgdXBkYXRlUGh5c2ljcyAgICAgPSBwaHlzaWNzLnVwZGF0ZVBoeXNpY3NcbnZhciB1cGRhdGVFbWl0dGVyICAgICA9IGVtaXR0ZXJzLnVwZGF0ZUVtaXR0ZXJcbnZhciBraWxsVGhlT2xkICAgICAgICA9IGxpZmV0aW1lLmtpbGxUaGVPbGRcbnZhciBmbGF0dGVuU2NlbmVHcmFwaCA9IHJlbmRlcmluZy5mbGF0dGVuU2NlbmVHcmFwaFxudmFyIHdhbGtBbmREbyAgICAgICAgID0gcmVuZGVyaW5nLndhbGtBbmREb1xudmFyIHRpY2tlciAgICAgICAgICAgID0gZnBzKHtldmVyeTogMTAwfSlcbnZhciBjYW52YXMgICAgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGxheWdyb3VuZFwiKVxudmFyIHN0YXRzICAgICAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0c1wiKVxudmFyIGdsICAgICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKVxudmFyIHNoYWRlcnMgICAgICAgICAgID0ge1xuICB2ZXJ0ZXg6ICAgXCIvc2hhZGVycy8wMXYuZ2xzbFwiLFxuICBmcmFnbWVudDogXCIvc2hhZGVycy8wMWYuZ2xzbFwiXG59XG5cbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKHNjZW5lR3JhcGgpIHtcbiAgdmFyIG9sZFRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKVxuICB2YXIgbmV3VGltZSA9IG9sZFRpbWVcbiAgdmFyIGRUXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XG4gICAgb2xkVGltZSA9IG5ld1RpbWVcbiAgICBuZXdUaW1lID0gcGVyZm9ybWFuY2Uubm93KClcbiAgICBkVCAgICAgID0gbmV3VGltZSAtIG9sZFRpbWVcblxuICAgIC8vVE9ETzogb3B0aW1pemUgdGhpcyBpbnN0ZWFkIG9mIGxvb3BpbmcgMyBzZXBlcmF0ZSB0aW1lcy4uLlxuICAgIFxuICAgIHdhbGtBbmREbyhmdW5jdGlvbiAoZSkgeyB1cGRhdGVFbWl0dGVyKG5ld1RpbWUsIGUpIH0sIHNjZW5lR3JhcGgpXG4gICAgd2Fsa0FuZERvKGZ1bmN0aW9uIChlKSB7IGtpbGxUaGVPbGQobmV3VGltZSwgZSkgfSwgc2NlbmVHcmFwaClcbiAgICB3YWxrQW5kRG8oZnVuY3Rpb24gKGUpIHsgdXBkYXRlUGh5c2ljcyhkVCwgZSkgfSwgc2NlbmVHcmFwaClcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlQW5pbWF0ZSAoZ2wsIGxwLCBzY2VuZUdyYXBoKSB7XG4gIHJldHVybiBmdW5jdGlvbiBhbmltYXRlICgpIHtcbiAgICB2YXIgcG9zaXRpb25zID0gZmxhdHRlblNjZW5lR3JhcGgoc2NlbmVHcmFwaClcblxuICAgIHRpY2tlci50aWNrKClcbiAgICBjbGVhckNvbnRleHQoZ2wpXG4gICAgdXBkYXRlQnVmZmVyKGdsLCAyLCBscC5hdHRyaWJ1dGVzLmFQb3NpdGlvbiwgbHAuYnVmZmVycy5hUG9zaXRpb24sIHBvc2l0aW9ucylcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlBPSU5UUywgMCwgcG9zaXRpb25zLmxlbmd0aCAvIDIpXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpIFxuICB9XG59XG5cbi8vc2V0dXAgZnBzIG1vbml0b3JpbmdcbnRpY2tlci5vbihcImRhdGFcIiwgZnVuY3Rpb24gKGZyYW1lcmF0ZSkge1xuICBzdGF0cy5pbm5lckhUTUwgPSBcImZwczogXCIgKyBTdHJpbmcoZnJhbWVyYXRlIHwgMClcbn0pXG5cbmFzeW5jLnBhcmFsbGVsKHtcbiAgdmVydGV4OiAgIGZ1bmN0aW9uIChjYikgeyBsb2FkU2hhZGVyKFwiL3NoYWRlcnMvMDF2Lmdsc2xcIiwgY2IpIH0sXG4gIGZyYWdtZW50OiBmdW5jdGlvbiAoY2IpIHsgbG9hZFNoYWRlcihcIi9zaGFkZXJzLzAxZi5nbHNsXCIsIGNiKSB9XG59LCBmdW5jdGlvbiAoZXJyLCBzaGFkZXJzKSB7XG4gIHZhciBscCAgICAgICAgICAgPSBMb2FkZWRQcm9ncmFtKGdsLCBzaGFkZXJzLnZlcnRleCwgc2hhZGVycy5mcmFnbWVudClcbiAgdmFyIHNjZW5lR3JhcGggICA9IEVtaXR0ZXIoMzAwLCAyMDAwLCAxMCwgLjAwMDksIC40LCAwLCAwLCAwLCAxKSBcblxuICBnbC51c2VQcm9ncmFtKGxwLnByb2dyYW0pXG4gIGdsLnVuaWZvcm00ZihscC51bmlmb3Jtcy51Q29sb3IsIDEuMCwgMC4wLCAwLjAsIDEuMClcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VBbmltYXRlKGdsLCBscCwgc2NlbmVHcmFwaCkpXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUoc2NlbmVHcmFwaCksIDI1KVxufSlcbiIsInZhciBfICAgICAgICAgPSByZXF1aXJlKFwibG9kYXNoXCIpXG52YXIgcmFuZG9tICAgID0gcmVxdWlyZShcIi4vcmFuZG9tXCIpXG52YXIgZmluZCAgICAgID0gXy5maW5kXG52YXIgcmFuZEJvdW5kID0gcmFuZG9tLnJhbmRCb3VuZFxudmFyIGVtaXR0ZXJzICA9IHt9XG5cbi8qXG4gIGNoZWNrIGlmIGl0IGlzIHRpbWUgdG8gZmlyZSBhIHBhcnRpY2xlLCBpZiBzbywgdGhleSBmaW5kXG4gIGEgcGFydGljbGUgYW5kIGdpZXYgaXQgYSB2ZWxvY2l0eSBpbiB0aGUgZGlyZWN0aW9uIG9mIHRoZSBlbWl0dGVyXG4gIGFuZCBhIHRpbWUgdG8gZGllXG4gIE4uQi4gVGhlIHZlbG9jaXR5IGlzIGFmZmVjdGVkIGJ5IGJvdGggdGhlIHNwZWVkIGFuZCB0aGUgc3ByZWFkXG4qL1xuZW1pdHRlcnMudXBkYXRlRW1pdHRlciA9IGZ1bmN0aW9uICh0aW1lLCBlKSB7XG4gIHZhciBwYXJ0aWNsZSBcblxuICBpZiAoIWUuZW1pdHRlcikgcmV0dXJuXG4gIGlmICh0aW1lID4gZS5uZXh0RmlyZVRpbWUpIHtcbiAgICBwYXJ0aWNsZSAgICAgICAgICAgICA9IGZpbmQoZS5jaGlsZHJlbiwge1wibGl2aW5nXCI6IGZhbHNlfSlcbiAgICBwYXJ0aWNsZS50aW1lVG9EaWUgICA9IHRpbWUgKyBwYXJ0aWNsZS5saWZlc3BhblxuICAgIHBhcnRpY2xlLmxpdmluZyAgICAgID0gdHJ1ZVxuICAgIHBhcnRpY2xlLnBvc2l0aW9uWzBdID0gZS5wb3NpdGlvblswXVxuICAgIHBhcnRpY2xlLnBvc2l0aW9uWzFdID0gZS5wb3NpdGlvblsxXVxuICAgIHBhcnRpY2xlLnZlbG9jaXR5WzBdID0gZS5zcGVlZCAqIChlLmRpcmVjdGlvblswXSArIHJhbmRCb3VuZCgtMSAqIGUuc3ByZWFkLCBlLnNwcmVhZCkpXG4gICAgcGFydGljbGUudmVsb2NpdHlbMV0gPSBlLnNwZWVkICogKGUuZGlyZWN0aW9uWzFdICsgcmFuZEJvdW5kKC0xICogZS5zcHJlYWQsIGUuc3ByZWFkKSlcbiAgICAvL3BhcnRpY2xlLnZlbG9jaXR5WzBdID0gZS5zcGVlZCAqIChlLmRpcmVjdGlvblswXSlcbiAgICAvL3BhcnRpY2xlLnZlbG9jaXR5WzFdID0gZS5zcGVlZCAqIChlLmRpcmVjdGlvblsxXSlcblxuICAgIGUubmV4dEZpcmVUaW1lICs9IGUucmF0ZVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZW1pdHRlcnNcbiIsInZhciB1dGlscyA9IHt9XG5cbnV0aWxzLmNsZWFyQ29udGV4dCA9IGZ1bmN0aW9uIChnbCkge1xuICBnbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMClcbiAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVClcbn1cblxudXRpbHMudXBkYXRlQnVmZmVyID0gZnVuY3Rpb24gKGdsLCBjaHVua1NpemUsIGF0dHJpYnV0ZSwgYnVmZmVyLCBkYXRhKSB7XG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGF0dHJpYnV0ZSlcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihhdHRyaWJ1dGUsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxuICByZXR1cm4gYnVmZmVyXG59XG5cbm1vZHVsZS5leHBvcnRzID0gdXRpbHNcbiIsInZhciBsaWZldGltZSA9IHt9XG5cbmxpZmV0aW1lLmtpbGxUaGVPbGQgPSBmdW5jdGlvbiAodGltZSwgZSkge1xuICBpZiAoZS5saXZpbmcgJiYgdGltZSA+PSBlLnRpbWVUb0RpZSkgZS5saXZpbmcgPSBmYWxzZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpZmV0aW1lXG4iLCJ2YXIgbG9hZGVycyAgPSB7fVxuXG5sb2FkZXJzLmxvYWRTaGFkZXIgPSBmdW5jdGlvbiAocGF0aCwgY2IpIHtcbiAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdFxuXG4gIHhoci5yZXNwb25zZVR5cGUgPSBcInN0cmluZ1wiXG4gIHhoci5vbmxvYWQgICAgICAgPSBmdW5jdGlvbiAoKSB7IGNiKG51bGwsIHhoci5yZXNwb25zZSkgfVxuICB4aHIub25lcnJvciAgICAgID0gZnVuY3Rpb24gKCkgeyBjYihuZXcgRXJyb3IoXCJDb3VsZCBub3QgbG9hZCBcIiArIHBhdGgpKSB9XG4gIHhoci5vcGVuKFwiR0VUXCIsIHBhdGgsIHRydWUpXG4gIHhoci5zZW5kKG51bGwpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbG9hZGVyc1xuIiwidmFyIHBoeXNpY3MgPSB7fVxuXG5waHlzaWNzLnVwZGF0ZVBvc2l0aW9uID0gZnVuY3Rpb24gKGRULCBlKSB7XG4gIGUucG9zaXRpb25bMF0gPSBlLnBvc2l0aW9uWzBdICsgZFQgKiBlLnZlbG9jaXR5WzBdXG4gIGUucG9zaXRpb25bMV0gPSBlLnBvc2l0aW9uWzFdICsgZFQgKiBlLnZlbG9jaXR5WzFdXG4gIHJldHVybiBlXG59XG5cbnBoeXNpY3MudXBkYXRlVmVsb2NpdHkgPSBmdW5jdGlvbiAoZFQsIGUpIHtcbiAgZS52ZWxvY2l0eVswXSA9IGUudmVsb2NpdHlbMF0gKyBkVCAqIGUuYWNjZWxlcmF0aW9uWzBdXG4gIGUudmVsb2NpdHlbMV0gPSBlLnZlbG9jaXR5WzFdICsgZFQgKiBlLmFjY2VsZXJhdGlvblsxXVxuICByZXR1cm4gZVxufVxuXG5waHlzaWNzLnVwZGF0ZVBoeXNpY3MgPSBmdW5jdGlvbiAoZFQsIGUpIHtcbiAgcGh5c2ljcy51cGRhdGVWZWxvY2l0eShkVCwgZSlcbiAgcGh5c2ljcy51cGRhdGVQb3NpdGlvbihkVCwgZSlcbiAgcmV0dXJuIGVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwaHlzaWNzXG4iLCJ2YXIgcmFuZG9tID0ge31cblxucmFuZG9tLnJhbmRCb3VuZCA9IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFuZG9tXG4iLCJ2YXIgcmVuZGVyaW5nID0ge31cblxuXG4vL0kgd2FudCB0byBjcmF3bCB0aGUgdHJlZSBzdHJ1Y3R1cmUgcmV0dXJuaW5nIHRoZSB0b3RhbCBudW1iZXJcbi8vb2YgcmVuZGVyYWJsZSBvYmplY3RzXG4vL1xuLy9UaGVuLCBjcmF3bCB0aGUgdHJlZSBzdHJ1Y3R1cmUgdG8gYnVpbGR1cCB0aGUgVHlwZWRBcnJheVxuXG5mdW5jdGlvbiBmbGF0UHVzaCAoaG9zdCwgYXIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhci5sZW5ndGg7ICsraSkge1xuICAgIGhvc3QucHVzaChhcltpXSkgXG4gIH1cbiAgcmV0dXJuIGhvc3Rcbn1cblxuZnVuY3Rpb24gZXh0cmFjdFJlbmRlcmluZ0RhdGEgKGhvc3QsIG5vZGUpIHtcbiAgaWYgKCEhbm9kZS5saXZpbmcgKSB7XG4gICAgZmxhdFB1c2goaG9zdCwgbm9kZS5wb3NpdGlvbilcbiAgICAvL2ZsYXRQdXNoKGhvc3QsIG5vZGUuY29sb3IpXG4gICAgLy9mbGF0UHVzaChob3N0LCBub2RlLnNpemUpXG4gIH1cblxuICBpZiAobm9kZS5jaGlsZHJlbikge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZS5jaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgZXh0cmFjdFJlbmRlcmluZ0RhdGEoaG9zdCwgbm9kZS5jaGlsZHJlbltpXSkgXG4gICAgfVxuICB9XG4gIHJldHVybiBob3N0XG59XG5cbi8qXG4gKiBSZWN1c2l2ZWx5IHRyYXZlcnNlIHRoZSBzY2VuZWdyYXBoIChhIDEtbiB0cmVlKSBhbmRcbiAqIHJldHVybiBhIGZsYXQgbGlzdCBvZiBwb3NpdGlvbiB2ZWN0b3JzLiAgXG4qICovXG5yZW5kZXJpbmcuZmxhdHRlblNjZW5lR3JhcGggPSBmdW5jdGlvbiAocm9vdE5vZGUpIHtcbiAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoZXh0cmFjdFJlbmRlcmluZ0RhdGEoW10sIHJvb3ROb2RlKSlcbn1cblxuLy9UT0RPOiBUaGlzIGlzbnQgcmVhbGx5IGV4cGxpY2l0bHkgYSByZW5kZXJpbmcgY29uY2Vybi4uICBwZXJoYXBzIG1vdmU/XG5yZW5kZXJpbmcud2Fsa0FuZERvID0gZnVuY3Rpb24gd2Fsa0FuZERvIChmbiwgbm9kZSkge1xuICBmbihub2RlKVxuXG4gIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICB3YWxrQW5kRG8oZm4sIG5vZGUuY2hpbGRyZW5baV0pXG4gICAgfVxuICB9XG4gIHJldHVybiBub2RlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVuZGVyaW5nXG4iLCJ2YXIgdXVpZCAgPSByZXF1aXJlKFwibm9kZS11dWlkXCIpXG52YXIgdmVjMiAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy92ZWMyXCIpXG52YXIgVmVjMiAgPSB2ZWMyLlZlYzJcbnZhciB0eXBlcyA9IHt9XG5cbi8vZ2l2ZW4gc3JjIGFuZCB0eXBlLCBjb21waWxlIGFuZCByZXR1cm4gc2hhZGVyXG5mdW5jdGlvbiBjb21waWxlIChnbCwgc2hhZGVyVHlwZSwgc3JjKSB7XG4gIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoc2hhZGVyVHlwZSlcblxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxuICByZXR1cm4gc2hhZGVyXG59XG5cbi8vbGluayB5b3VyIHByb2dyYW0gdy8gb3BlbmdsXG5mdW5jdGlvbiBsaW5rIChnbCwgdnMsIGZzKSB7XG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpXG5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKSBcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKSBcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcbiAgcmV0dXJuIHByb2dyYW1cbn1cblxuLypcbiAqIFdlIHdhbnQgdG8gY3JlYXRlIGEgd3JhcHBlciBmb3IgYSBsb2FkZWQgZ2wgcHJvZ3JhbVxuICogdGhhdCBpbmNsdWRlcyBwb2ludGVycyB0byBhbGwgdGhlIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzXG4gKiBkZWZpbmVkIGZvciB0aGlzIHByb2dyYW0uICBUaGlzIG1ha2VzIGl0IG1vcmUgY29udmVuaWVudFxuICogdG8gY2hhbmdlIHRoZXNlIHZhbHVlc1xuICovXG50eXBlcy5Mb2FkZWRQcm9ncmFtID0gZnVuY3Rpb24gKGdsLCB2U3JjLCBmU3JjKSB7XG4gIHZhciB2cyAgICAgICAgICAgID0gY29tcGlsZShnbCwgZ2wuVkVSVEVYX1NIQURFUiwgdlNyYylcbiAgdmFyIGZzICAgICAgICAgICAgPSBjb21waWxlKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIGZTcmMpXG4gIHZhciBwcm9ncmFtICAgICAgID0gbGluayhnbCwgdnMsIGZzKVxuICB2YXIgbnVtQXR0cmlidXRlcyA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX0FUVFJJQlVURVMpXG4gIHZhciBudW1Vbmlmb3JtcyAgID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpXG4gIHZhciBscCA9IHtcbiAgICB2ZXJ0ZXg6IHtcbiAgICAgIHNyYzogICAgdlNyYyxcbiAgICAgIHNoYWRlcjogdnMgXG4gICAgfSxcbiAgICBmcmFnbWVudDoge1xuICAgICAgc3JjOiAgICBmU3JjLFxuICAgICAgc2hhZGVyOiBmcyBcbiAgICB9LFxuICAgIHByb2dyYW06ICAgIHByb2dyYW0sXG4gICAgdW5pZm9ybXM6ICAge30sIFxuICAgIGF0dHJpYnV0ZXM6IHt9LFxuICAgIGJ1ZmZlcnM6ICAgIHt9XG4gIH1cbiAgdmFyIGFOYW1lXG4gIHZhciB1TmFtZVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtQXR0cmlidXRlczsgKytpKSB7XG4gICAgYU5hbWUgICAgICAgICAgICAgICAgPSBnbC5nZXRBY3RpdmVBdHRyaWIocHJvZ3JhbSwgaSkubmFtZVxuICAgIGxwLmF0dHJpYnV0ZXNbYU5hbWVdID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgYU5hbWUpXG4gICAgbHAuYnVmZmVyc1thTmFtZV0gICAgPSBnbC5jcmVhdGVCdWZmZXIoKVxuICB9XG5cbiAgZm9yICh2YXIgaiA9IDA7IGogPCBudW1Vbmlmb3JtczsgKytqKSB7XG4gICAgdU5hbWUgICAgICAgICAgICAgID0gZ2wuZ2V0QWN0aXZlVW5pZm9ybShwcm9ncmFtLCBqKS5uYW1lXG4gICAgbHAudW5pZm9ybXNbdU5hbWVdID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sIHVOYW1lKVxuICB9XG5cbiAgcmV0dXJuIGxwIFxufVxuXG50eXBlcy5QYXJ0aWNsZSA9IGZ1bmN0aW9uIChsaWZlc3BhbiwgcHgsIHB5LCB2eCwgdnksIGF4LCBheSkge1xuICByZXR1cm4ge1xuICAgIGlkOiAgICAgICAgICAgdXVpZC52NCgpLFxuICAgIHBvc2l0aW9uOiAgICAgVmVjMihweCwgcHkpLFxuICAgIHZlbG9jaXR5OiAgICAgVmVjMih2eCwgdnkpLFxuICAgIGFjY2VsZXJhdGlvbjogVmVjMihheCwgYXkpLFxuICAgIHJlbmRlcmFibGU6ICAgdHJ1ZSxcbiAgICB0aW1lVG9EaWU6ICAgIDAsXG4gICAgbGlmZXNwYW46ICAgICBsaWZlc3BhbixcbiAgICBsaXZpbmc6ICAgICAgIGZhbHNlXG4gIH0gICBcbn1cblxudHlwZXMuRW1pdHRlciA9IGZ1bmN0aW9uIChjb3VudCwgbGlmZXNwYW4sIHJhdGUsIHNwZWVkLCBzcHJlYWQsIHB4LCBweSwgZHgsIGR5KSB7XG4gIHZhciBwYXJ0aWNsZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7ICsraSkge1xuICAgIHBhcnRpY2xlcy5wdXNoKHR5cGVzLlBhcnRpY2xlKGxpZmVzcGFuLCBweCwgcHksIDAsIDAsIDAsIC0wLjAwMDAwMDkpKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBpZDogICAgICAgICAgIHV1aWQudjQoKSxcbiAgICBlbWl0dGVyOiAgICAgIHRydWUsXG4gICAgcmF0ZTogICAgICAgICByYXRlLCBcbiAgICBzcGVlZDogICAgICAgIHNwZWVkLFxuICAgIHNwcmVhZDogICAgICAgc3ByZWFkLFxuICAgIG5leHRGaXJlVGltZTogMCxcbiAgICBwb3NpdGlvbjogICAgIFZlYzIocHgsIHB5KSxcbiAgICB2ZWxvY2l0eTogICAgIFZlYzIoMCwgMCksXG4gICAgYWNjZWxlcmF0aW9uOiBWZWMyKDAsIDApLFxuICAgIGRpcmVjdGlvbjogICAgVmVjMihkeCwgZHkpLFxuICAgIHJlbmRlcmFibGU6ICAgZmFsc2UsXG4gICAgbGl2aW5nOiAgICAgICB0cnVlLFxuICAgIGNoaWxkcmVuOiAgICAgcGFydGljbGVzXG4gIH0gXG59XG5cbm1vZHVsZS5leHBvcnRzID0gdHlwZXNcbiIsInZhciB2ZWMyID0ge31cblxudmVjMi5WZWMyID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgdmFyIG91dCA9IG5ldyBGbG9hdDMyQXJyYXkoMilcblxuICBvdXRbMF0gPSB4XG4gIG91dFsxXSA9IHlcblxuICByZXR1cm4gb3V0XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdmVjMlxuIiwidmFyIHZlYzMgPSB7fVxuXG52ZWMzLlZlYzMgPSBmdW5jdGlvbiAoeCwgeSwgeikge1xuICB2YXIgb3V0ID0gbmV3IEZsb2F0MzJBcnJheSgzKVxuXG4gIG91dFswXSA9IHhcbiAgb3V0WzFdID0geVxuICBvdXRbMl0gPSB6XG5cbiAgcmV0dXJuIG91dFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzNcbiIsInZhciB2ZWM0ID0ge31cblxudmVjNC5WZWM0ID0gZnVuY3Rpb24gKHgsIHksIHosIHcpIHtcbiAgdmFyIG91dCA9IG5ldyBGbG9hdDQyQXJyYXkoNClcblxuICBvdXRbMF0gPSB4XG4gIG91dFsxXSA9IHlcbiAgb3V0WzJdID0gelxuICBvdXRbM10gPSB3XG5cbiAgcmV0dXJuIG91dFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzRcbiJdfQ==
