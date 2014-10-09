(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var prodash = {
  functions:   require("./src/functions"),
  transducers: require("./src/transducers"),
  array:       require("./src/array"),
  object:      require("./src/object")
}

module.exports = prodash

},{"./src/array":2,"./src/functions":3,"./src/object":4,"./src/transducers":5}],2:[function(require,module,exports){
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

var range = function (min, max) {
  var ar = []

  for (var i = min; i <= max; ++i) {
    ar.push(i) 
  }
  return ar
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
array.range   = range

module.exports = array

},{"./functions":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
var fns    = require("./functions")
var curry  = fns.curry
var object = {}

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

//TODO: SEems to exhibit very poor performance in tight loop?
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

},{"./functions":3}],5:[function(require,module,exports){
var fns        = require("./functions")
var curry      = fns.curry
var compose    = fns.compose
var instanceOf = fns.instanceOf
var trans      = {}

var redNoop = function (acc, x) { return x }

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

var mapping = function (transFn) {
  return function (stepFn) {
    return function (acc, x) {
      return stepFn(acc, transFn(x))
    }
  }
}

var plucking = function (propName) {
  return function (stepFn) {
    return mapping(function (x) { return x[propName] })(stepFn)
  }
}

var filtering = function (predFn) {
  return function (stepFn) {
    return function (acc, x) {
      return predFn(x) ? stepFn(acc, x) : acc 
    }
  }
}

var checking = function (prop, val) {
  return function (stepFn) {
    return filtering(function (x) { return x[prop] === val })(stepFn)
  }
}

//THIS WILL MUTATE THE STRUCTURE PROVIDED TO IT DIRECTLY
var mutating = function (mutFn) {
  return function (stepFn) {
    return function (acc, x) {
      mutFn(x)
      return stepFn(acc, x)
    }
  }
}

var cat = function (fn) {
  return function (acc, x) {
    return reduce(fn, acc, x) 
  }
}

var map = curry(function (fn, col) {
  return reduce(mapping(fn)(cons), empty(col), col)
})

var mapcatting = function (transFn) {
  return function (stepFn) {
    return compose([cat, mapping(transFn)])(stepFn)
  }
}

var filter = curry(function (predFn, col) {
  return reduce(filtering(predFn)(cons), empty(col), col)
})

var mutate = curry(function (transFn, col) {
  return reduce(transFn(redNoop), undefined, col)
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

},{"./functions":3}],6:[function(require,module,exports){
var prodash          = require("prodash")
var async            = require("async")
var graph            = require("../modules/graph")
var loaders          = require("../modules/loaders")
var utils            = require("../modules/gl-utils")
var random           = require("../modules/random")
var physics          = require("../modules/physics")
var lifetime         = require("../modules/lifetime")
var emitters         = require("../modules/emitters")
var clock            = require("../modules/clock")
var camera           = require("../modules/camera")
var light            = require("../modules/light")
var vec3             = require("../modules/vec3")
var Graph            = graph.Graph
var attachToRoot     = graph.attachToRoot
var attachToNode     = graph.attachToNode
var attachManyToNode = graph.attachManyToNode
var compose          = prodash.functions.compose
var partial          = prodash.functions.partial
var into             = prodash.transducers.into
var transduce        = prodash.transducers.transduce
var cons             = prodash.transducers.cons
var sequence         = prodash.transducers.sequence
var filtering        = prodash.transducers.filtering
var checking         = prodash.transducers.checking
var plucking         = prodash.transducers.plucking
var cat              = prodash.transducers.cat
var ParticleGroup    = emitters.ParticleGroup
var Emitter          = emitters.Emitter
var updateEmitter    = emitters.updateEmitter
var loadShader       = loaders.loadShader
var updateBuffer     = utils.updateBuffer
var clearContext     = utils.clearContext
var LoadedProgram    = utils.LoadedProgram
var randBound        = random.randBound
var updatePhysics    = physics.updatePhysics
var killTheOld       = lifetime.killTheOld
var Clock            = clock.Clock
var updateClock      = clock.updateClock
var Camera           = camera.Camera
var updateCamera     = camera.updateCamera
var PointLight       = light.PointLight
var setVec3          = vec3.setVec3
var canvas           = document.getElementById("playground")

var isEmitter   = checking("emitter", true)
var isParticle  = checking("particle", true)
var isLight     = checking("light", true)
var isLiving    = checking("living", true)
var hasLifespan = filtering(function (e) { 
  return e.lifespan !== undefined
})
var hasPhysics  = filtering(function (e) {
  return !!e.position && !!e.velocity && !!e.acceleration
})
var getLivingParticles = compose([isLiving, isParticle])
var getLivingLights    = compose([isLiving, isLight])
var flattenPositions   = sequence(compose([isLiving, plucking("position"), cat]))
var flattenSizes       = sequence(compose([isLiving, plucking("size"), cat]))

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
  return function update () {
    updateClock(world.clock, performance.now())
    updateCamera(world, world.camera)
    updateEntities(killTheOld, world)
    updateEntities(updatePhysics, world)
    updateEntities(updateEmitter, world)
  }
}

function buildLightData (world) {
  var lights    = world.groups.lights
  var lightData = {
    positions:   new Float32Array(lights.length * 3),
    colors:      new Float32Array(lights.length * 3),
    intensities: new Float32Array(lights.length)
  }
  var light
  
  for (var i = 0; i < lights.length; ++i) {
    light = lights[i]
    lightData.positions[i*3]   = light.position[0]
    lightData.positions[i*3+1] = light.position[1]
    lightData.positions[i*3+2] = light.position[2]
    lightData.colors[i*3]      = light.rgb[0]
    lightData.colors[i*3+1]    = light.rgb[1]
    lightData.colors[i*3+2]    = light.rgb[2]
    lightData.intensities[i]   = light.intensity
  }
  return lightData
}

function renderParticles (world, lightData) {
  var gl        = world.gl
  var view      = world.view
  var lp        = world.programs.particle
  var particles = world.groups.particles
  var positions = new Float32Array(flattenPositions(particles))

  gl.useProgram(lp.program)
  gl.uniform3fv(lp.uniforms["uLightPositions[0]"], lightData.positions)
  gl.uniform3fv(lp.uniforms["uLightColors[0]"], lightData.colors)
  gl.uniform1fv(lp.uniforms["uLightIntensities[0]"], lightData.intensities)
  gl.uniform4f(lp.uniforms.uColor, 0.0, 0.0, 0.0, 1.0)
  gl.uniform2f(lp.uniforms.uScreenSize, view.clientWidth, view.clientHeight)
  gl.uniformMatrix4fv(lp.uniforms.uView, false, world.camera.view)
  gl.uniformMatrix4fv(lp.uniforms.uProjection, false, world.camera.projection)
  gl.uniform1f(lp.uniforms.uSize, 1.0)
  updateBuffer(gl, 3, lp.attributes.aPosition, lp.buffers.aPosition, positions)
  gl.drawArrays(gl.POINTS, 0, positions.length / 3)
}

function makeRender (gl, world) {
  return function render () {
    var lightData = buildLightData(world)

    clearContext(gl)
    renderParticles(world, lightData)
    requestAnimationFrame(render) 
  }
}

async.parallel({
  vertex:   partial(loadShader, "/shaders/01v.glsl"),
  fragment: partial(loadShader, "/shaders/01f.glsl")
}, function (err, shaders) {
  var gl              = canvas.getContext("webgl")
  var particleProgram = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var aspect          = canvas.clientWidth / canvas.clientHeight
  var fov             = Math.PI / 2
  var world           = {
    gl:       gl,
    view:     canvas,
    clock:    Clock(performance.now()),
    camera:   Camera(0, 0, 2, fov, aspect, 1, 10),
    graph:    Graph(),
    systems:  {
      emitters:  updateEmitter,
      lifespans: killTheOld,
      physics:   updatePhysics
    },
    groups:   {
      emitters:  [],
      lifespans: [],
      physics:   [],
      lights:    [],
      particles: []
    },
    programs: {
      particle: particleProgram
    }
  }
  var l1   = PointLight(0, 0, 0)
  var l2   = PointLight(0, .25, 0)
  var l3   = PointLight(0, .5, 0)
  var e1   = Emitter(1000, 10, .002, .1, 0, 0, 0, 0, 1, randBound(-0.2, 0.2))  
  var e1ps = ParticleGroup(50, 1000)

  setVec3(1.0, 0.0, 0.0, l1.rgb)
  setVec3(0.0, 1.0, 0.0, l2.rgb)
  setVec3(0.0, 0.0, 1.0, l3.rgb)
  attachToRoot(world.graph, l1)
  attachToRoot(world.graph, l2)
  attachToRoot(world.graph, l3)
  attachToRoot(world.graph, e1)
  attachManyToNode(world.graph, e1, e1ps)
  into(world.groups.lights, isLight, world.graph)
  into(world.groups.emitters, isEmitter, world.graph)
  into(world.groups.particles, isParticle, world.graph)
  into(world.groups.lifespans, hasLifespan, world.graph)
  into(world.groups.physics, hasPhysics, world.graph)
  window.world = world

  setInterval(makeUpdate(world), 25)
  requestAnimationFrame(makeRender(gl, world))
})

},{"../modules/camera":7,"../modules/clock":8,"../modules/emitters":9,"../modules/gl-utils":10,"../modules/graph":11,"../modules/lifetime":12,"../modules/light":13,"../modules/loaders":14,"../modules/physics":15,"../modules/random":16,"../modules/vec3":17,"async":"async","prodash":1}],7:[function(require,module,exports){
var mat4     = require("gl-mat4")
var vec3     = require("./vec3")
var Vec3     = vec3.Vec3
var rotSpeed = Math.PI / 3000
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

},{"./vec3":17,"gl-mat4":"gl-mat4"}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
var uuid      = require("node-uuid")
var prodash   = require("prodash")
var random    = require("./random")
var vec3      = require("./vec3")
var Vec3      = vec3.Vec3
var find      = prodash.array.find
var curry     = prodash.functions.curry
var randBound = random.randBound
var emitters  = {}

var Particle = function (lifespan) {
  return {
    id:           uuid.v4(),
    particle:     true,
    position:     Vec3(0, 0, 0),
    velocity:     Vec3(0, 0, 0),
    acceleration: Vec3(0, -0.0000018, 0),
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

var ParticleGroup = function (count, lifespan) {
  var particles = []

  for (var i = 0; i < count; ++i) {
    particles.push(Particle(lifespan))
  }    
  return particles
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
emitters.ParticleGroup = ParticleGroup
emitters.Emitter       = Emitter
emitters.updateEmitter = updateEmitter
module.exports         = emitters

},{"./random":16,"./vec3":17,"node-uuid":"node-uuid","prodash":1}],10:[function(require,module,exports){
var utils = {}

var clearContext = function (gl) {
  gl.clearColor(0.0, 0.0, 0.0, 0.0)
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

},{}],11:[function(require,module,exports){
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
  if (!(this instanceof Graph)) return new Graph(rootNode)
  var rootNode = rootNode || Node({ id: uuid.v4() })

  this.nodes              = {}
  this.rootNodeId         = rootNode.id
  this.nodes[rootNode.id] = rootNode
}

//used internally by graph.__reduce to support iteration
var nodeReduce = function (redFn, nodeId, accum, graph) {
  var node = graph.nodes[nodeId]

  redFn(accum, node)
  for (var i = 0; i < node.childIds.length; ++i) {
    nodeReduce(redFn, node.childIds[i], accum, graph)   
  }
  return accum
}

//Graph -> String -> Node -> Void
var attachById = curry(function (graph, parentId, node) {
  if (!graph.nodes[parentId]) throw new Error(parentId + " not found in graph")
  var node = node instanceof Node ? node : Node(node)

  graph.nodes[node.id]          = node
  graph.nodes[node.id].parentId = parentId
  graph.nodes[parentId].childIds.push(node.id)
})

var attachToNode = curry(function (graph, parentNode, node) {
  attachById(graph, parentNode.id, node)
})

var attachToRoot = curry(function (graph, node) {
  attachById(graph, graph.rootNodeId, node)
})

var attachManyToNode = curry(function (graph, parentNode, nodes) {
  for (var i = 0; i < nodes.length; ++i) {
    attachById(graph, parentNode.id, nodes[i]) 
  }
})

var attachManyToRoot = curry(function (graph, nodes) {
  for (var i = 0; i < nodes.length; ++i) {
    attachById(graph, graph.rootNodeId, nodes[i])
  }
})

Graph.prototype.__reduce = function (redFn, accum, graph) {
  return nodeReduce(redFn, graph.rootNodeId, accum, graph)
}

Graph.prototype.__empty = function () { return new Graph }

graph.Node             = Node
graph.Graph            = Graph
graph.attachById       = attachById
graph.attachToNode     = attachToNode
graph.attachToRoot     = attachToRoot
graph.attachManyToNode = attachManyToNode
graph.attachManyToRoot = attachManyToRoot
module.exports         = graph

},{"node-uuid":"node-uuid","prodash":1}],12:[function(require,module,exports){
var fns      = require("prodash")
var curry    = fns.functions.curry
var lifetime = {}

lifetime.killTheOld = function (world, e) {
  var time = world.clock.newTime

  if (!e.lifespan)                     return
  if (e.living && time >= e.timeToDie) e.living = false
}

module.exports = lifetime

},{"prodash":1}],13:[function(require,module,exports){
var uuid  = require("node-uuid")
var vec3  = require('./vec3')
var Vec3  = vec3.Vec3
var light = {}

var PointLight = function (x, y, z) {
  if (!(this instanceof PointLight)) return new PointLight(x, y, z)

  this.id            = uuid.v4()
  this.light         = true
  this.position      = Vec3(x, y, z)
  this.velocity      = Vec3(0, 0, 0)
  this.acceleration  = Vec3(0, 0, 0)
  this.rotation      = Vec3(0, 0, 0)
  this.rgb           = Vec3(1, 1, 1)
  this.intensity     = 1.0
  this.living        = true
}

light.PointLight = PointLight
module.exports = light

},{"./vec3":17,"node-uuid":"node-uuid"}],14:[function(require,module,exports){
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

},{"prodash":1}],16:[function(require,module,exports){
var random = {}

random.randBound = function (min, max) {
  return Math.random() * (max - min) + min
}

module.exports = random

},{}],17:[function(require,module,exports){
var vec3 = {}

var Vec3 = function (x, y, z) {
  var out = new Float32Array(3)

  out[0] = x
  out[1] = y
  out[2] = z
  return out
}

var setVec3 = function (x, y, z, vec) {
  vec[0] = x
  vec[1] = y
  vec[2] = z
  return vec
}

var cloneVec3 = function (vec) {
  return Vec3(vec[0], vec[1], vec[2])
}

vec3.Vec3      = Vec3
vec3.setVec3   = setVec3
vec3.cloneVec3 = cloneVec3
module.exports = vec3

},{}]},{},[6])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvcHJvZGFzaC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvc3JjL2FycmF5LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvZnVuY3Rpb25zLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvb2JqZWN0LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvdHJhbnNkdWNlcnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9leGFtcGxlcy8wMS1CYXNpYy1TZXR1cC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvY2FtZXJhLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9jbG9jay5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvZW1pdHRlcnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2dsLXV0aWxzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9ncmFwaC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbGlmZXRpbWUuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2xpZ2h0LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9sb2FkZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9waHlzaWNzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9yYW5kb20uanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3ZlYzMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgcHJvZGFzaCA9IHtcbiAgZnVuY3Rpb25zOiAgIHJlcXVpcmUoXCIuL3NyYy9mdW5jdGlvbnNcIiksXG4gIHRyYW5zZHVjZXJzOiByZXF1aXJlKFwiLi9zcmMvdHJhbnNkdWNlcnNcIiksXG4gIGFycmF5OiAgICAgICByZXF1aXJlKFwiLi9zcmMvYXJyYXlcIiksXG4gIG9iamVjdDogICAgICByZXF1aXJlKFwiLi9zcmMvb2JqZWN0XCIpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcHJvZGFzaFxuIiwidmFyIGZucyAgICAgICAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgY3VycnkgICAgICAgPSBmbnMuY3VycnlcbnZhciBkZW1ldGhvZGl6ZSA9IGZucy5kZW1ldGhvZGl6ZVxudmFyIGFycmF5ICAgICAgID0ge31cblxudmFyIGZpbmQgPSBjdXJyeShmdW5jdGlvbiAocHJlZEZuLCBhcikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKHByZWRGbihhcltpXSkpIHJldHVybiBhcltpXSBcbiAgfVxuICByZXR1cm4gbnVsbFxufSlcblxudmFyIGZvckVhY2ggPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgYXIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhci5sZW5ndGg7ICsraSkge1xuICAgIGFyW2ldID0gdHJhbnNGbihhcltpXSkgXG4gIH1cbn0pXG5cbnZhciByZXZlcnNlID0gZnVuY3Rpb24gKGxpc3QpIHtcbiAgdmFyIGJhY2t3YXJkcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBiYWNrd2FyZHNbaV0gPSBsaXN0W2xlbi0xLWldXG4gIH1cbiAgcmV0dXJuIGJhY2t3YXJkc1xufVxuXG52YXIgY29uY2F0ID0gZGVtZXRob2RpemUoQXJyYXkucHJvdG90eXBlLCBcImNvbmNhdFwiKVxuXG52YXIgZmxhdHRlbiA9IGZ1bmN0aW9uIChhcnJheU9mQXJyYXlzKSB7XG4gIHZhciBmbGF0dGVuZWQgPSBbXVxuICB2YXIgc3ViYXJyYXlcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5T2ZBcnJheXMubGVuZ3RoOyArK2kpIHtcbiAgICBzdWJhcnJheSA9IGFycmF5T2ZBcnJheXNbaV1cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IHN1YmFycmF5Lmxlbmd0aDsgKytqKSB7XG4gICAgICBmbGF0dGVuZWQucHVzaChzdWJhcnJheVtqXSkgXG4gICAgfVxuICB9XG4gIHJldHVybiBmbGF0dGVuZWRcbn1cblxudmFyIHB1c2ggPSBmdW5jdGlvbiAoYXJyYXksIGVsKSB7XG4gIGFycmF5LnB1c2goZWwpXG4gIHJldHVybiBhcnJheVxufVxuXG52YXIgdW5zaGlmdCA9IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgYXJyYXkudW5zaGlmdChlbClcbiAgcmV0dXJuIGFycmF5XG59XG5cbnZhciBzbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kLCBhcnJheSkge1xuICByZXR1cm4gYXJyYXkuc2xpY2Uoc3RhcnQsIGVuZClcbn1cblxudmFyIHJlbW92ZSA9IGZ1bmN0aW9uIChmbiwgYXJyYXkpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7ICsraSkge1xuICAgIGlmIChmbihhcnJheVtpXSkpIHtcbiAgICAgIGFycmF5LnNwbGljZShpLCAxKVxuICAgIH1cbiAgfVxuICByZXR1cm4gYXJyYXlcbn1cblxudmFyIHJhbmdlID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gIHZhciBhciA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IG1pbjsgaSA8PSBtYXg7ICsraSkge1xuICAgIGFyLnB1c2goaSkgXG4gIH1cbiAgcmV0dXJuIGFyXG59XG5cbmFycmF5LmZpbmQgICAgPSBmaW5kXG5hcnJheS5mb3JFYWNoID0gZm9yRWFjaFxuYXJyYXkucmV2ZXJzZSA9IHJldmVyc2VcbmFycmF5LmNvbmNhdCAgPSBjb25jYXRcbmFycmF5LmZsYXR0ZW4gPSBmbGF0dGVuXG5hcnJheS5zbGljZSAgID0gc2xpY2VcbmFycmF5LnB1c2ggICAgPSBwdXNoXG5hcnJheS51bnNoaWZ0ID0gdW5zaGlmdFxuYXJyYXkucmVtb3ZlICA9IHJlbW92ZVxuYXJyYXkucmFuZ2UgICA9IHJhbmdlXG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlcbiIsInZhciBmbnMgPSB7fVxuXG52YXIgZGVtZXRob2RpemUgPSBmdW5jdGlvbiAob2JqLCBmbk5hbWUpIHtcbiAgcmV0dXJuIEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsLmJpbmQob2JqW2ZuTmFtZV0pIFxufVxuXG52YXIgaW5zdGFuY2VPZiA9IGZ1bmN0aW9uIChjb25zdHJ1Y3RvciwgY29sKSB7IFxuICByZXR1cm4gY29sIGluc3RhbmNlb2YgY29uc3RydWN0b3Jcbn1cblxudmFyIGFwcGx5ID0gZnVuY3Rpb24gKGZuLCBhcmdzTGlzdCkgeyBcbiAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3NMaXN0KSBcbn1cblxudmFyIGNhbGwgPSBmdW5jdGlvbiAoZm4pIHsgXG4gIHZhciBhcmdzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAxOyArK2kpIHtcbiAgICBhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXSBcbiAgfVxuICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJncykgXG59XG5cbnZhciBjb21wb3NlID0gZnVuY3Rpb24gKGZucykge1xuICByZXR1cm4gZnVuY3Rpb24gY29tcG9zZWQgKHZhbCkge1xuICAgIGZvciAodmFyIGkgPSBmbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHZhbCA9IGZuc1tpXSh2YWwpXG4gICAgfVxuICAgIHJldHVybiB2YWxcbiAgfVxufVxuXG52YXIgZmxpcCA9IGZ1bmN0aW9uIChmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBiYWNrd2FyZHMgPSBbXVxuXG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgYmFja3dhcmRzW2ldID0gYXJndW1lbnRzW2xlbi0xLWldXG4gICAgfVxuICAgIHJldHVybiBhcHBseShmbiwgYmFja3dhcmRzKVxuICB9XG59XG5cbnZhciBwYXJ0aWFsID0gZnVuY3Rpb24gKGZuKSB7XG4gIHZhciBhcmdzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGggLSAxOyArK2kpIHtcbiAgICBhcmdzW2ldID0gYXJndW1lbnRzW2kgKyAxXSBcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaiA9IDAsIHN0YXJ0aW5nSW5kZXggPSBhcmdzLmxlbmd0aDsgaiA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraikge1xuICAgICAgYXJnc1tqICsgc3RhcnRpbmdJbmRleF0gPSBhcmd1bWVudHNbal0gXG4gICAgfVxuXG4gICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpXG4gIH1cbn1cblxuLy91dGlsaXR5IGZ1bmN0aW9uIHVzZWQgaW4gY3VycnkgZGVmXG52YXIgaW5uZXJDdXJyeSA9IGZ1bmN0aW9uIChmbiwgYXJncykge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBzdGFydGluZ0luZGV4ID0gYXJncy5sZW5ndGg7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGFyZ3NbaSArIHN0YXJ0aW5nSW5kZXhdID0gYXJndW1lbnRzW2ldIFxuICAgIH1cblxuICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgfTtcbn07XG5cbi8vYXJpdHkgYXJndW1lbnQgaXMgdXNlZCBtb3N0IG9mdGVuIGludGVybmFsbHlcbnZhciBjdXJyeSA9IGZ1bmN0aW9uIChmbiwgYXJpdHkpIHtcbiAgdmFyIGZuQXJpdHkgPSBhcml0eSB8fCBmbi5sZW5ndGhcblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtaXNzaW5nQXJnc0NvdW50ID0gZm5Bcml0eSAtIGFyZ3VtZW50cy5sZW5ndGhcbiAgICB2YXIgbm90RW5vdWdoQXJncyAgICA9IG1pc3NpbmdBcmdzQ291bnQgPiAwXG4gICAgdmFyIGFyZ3MgICAgICAgICAgICAgPSBbXVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaV0gXG4gICAgfVxuXG4gICAgaWYgKG5vdEVub3VnaEFyZ3MpIHJldHVybiBjdXJyeShpbm5lckN1cnJ5KGZuLCBhcmdzKSwgbWlzc2luZ0FyZ3NDb3VudClcbiAgICBlbHNlICAgICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpXG4gIH1cbn1cblxuZm5zLmRlbWV0aG9kaXplID0gZGVtZXRob2RpemVcbmZucy5pbnN0YW5jZU9mICA9IGluc3RhbmNlT2ZcbmZucy5mbGlwICAgICAgICA9IGZsaXBcbmZucy5jb21wb3NlICAgICA9IGNvbXBvc2VcbmZucy5wYXJ0aWFsICAgICA9IHBhcnRpYWxcbmZucy5jdXJyeSAgICAgICA9IGN1cnJ5XG5mbnMuY2FsbCAgICAgICAgPSBjYWxsXG5mbnMuYXBwbHkgICAgICAgPSBhcHBseVxubW9kdWxlLmV4cG9ydHMgID0gZm5zXG4iLCJ2YXIgZm5zICAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgY3VycnkgID0gZm5zLmN1cnJ5XG52YXIgb2JqZWN0ID0ge31cblxudmFyIGV4dGVuZCA9IGN1cnJ5KGZ1bmN0aW9uIChob3N0LCBvYmopIHtcbiAgdmFyIGtzID0gT2JqZWN0LmtleXMob2JqKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga3MubGVuZ3RoOyArK2kpIHtcbiAgICBob3N0W2tzW2ldXSA9IG9ialtrc1tpXV1cbiAgfVxuICByZXR1cm4gaG9zdFxufSlcblxudmFyIGhhc0tleSA9IGN1cnJ5KGZ1bmN0aW9uIChrZXksIGUpIHtcbiAgcmV0dXJuIGVba2V5XSAhPT0gdW5kZWZpbmVkXG59KVxuXG4vL1RPRE86IFNFZW1zIHRvIGV4aGliaXQgdmVyeSBwb29yIHBlcmZvcm1hbmNlIGluIHRpZ2h0IGxvb3A/XG52YXIgaGFzS2V5cyA9IGN1cnJ5KGZ1bmN0aW9uIChrZXlzLCBlKSB7XG4gIHZhciByZXMgPSB0cnVlXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgKytpKSB7XG4gICAgcmVzID0gcmVzICYmIGVba2V5c1tpXV0gIT09IHVuZGVmaW5lZFxuICB9XG4gIHJldHVybiByZXNcbn0pXG5cbm9iamVjdC5oYXNLZXkgID0gaGFzS2V5XG5vYmplY3QuaGFzS2V5cyA9IGhhc0tleXNcbm9iamVjdC5leHRlbmQgID0gZXh0ZW5kXG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0XG4iLCJ2YXIgZm5zICAgICAgICA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxudmFyIGN1cnJ5ICAgICAgPSBmbnMuY3VycnlcbnZhciBjb21wb3NlICAgID0gZm5zLmNvbXBvc2VcbnZhciBpbnN0YW5jZU9mID0gZm5zLmluc3RhbmNlT2ZcbnZhciB0cmFucyAgICAgID0ge31cblxudmFyIHJlZE5vb3AgPSBmdW5jdGlvbiAoYWNjLCB4KSB7IHJldHVybiB4IH1cblxudmFyIHJlZHVjZUFycmF5ID0gZnVuY3Rpb24gKGZuLCBhY2N1bSwgYXJyKSB7XG4gIHZhciBpbmRleCA9IC0xXG4gIHZhciBsZW4gICA9IGFyci5sZW5ndGhcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbikge1xuICAgIGFjY3VtID0gZm4oYWNjdW0sIGFycltpbmRleF0pXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59XG5cbnZhciByZWR1Y2VPYmplY3QgPSBmdW5jdGlvbiAoZm4sIGFjY3VtLCBvYmopIHtcbiAgdmFyIGluZGV4ID0gLTFcbiAgdmFyIGtzICAgID0gT2JqZWN0LmtleXMob2JqKVxuICB2YXIgbGVuICAgPSBrcy5sZW5ndGhcbiAgdmFyIGtleVxuICB2YXIga3ZcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbikge1xuICAgIGtleSAgICAgPSBrc1tpbmRleF1cbiAgICBrdiAgICAgID0ge31cbiAgICBrdltrZXldID0gb2JqW2tleV1cbiAgICBhY2N1bSAgID0gZm4oYWNjdW0sIGt2KVxuICB9XG4gIHJldHVybiBhY2N1bVxufVxuXG52YXIgY29uc0FycmF5ID0gZnVuY3Rpb24gKGFycmF5LCBlbCkge1xuICBhcnJheS5wdXNoKGVsKVxuICByZXR1cm4gYXJyYXlcbn1cblxudmFyIGNvbnNPYmplY3QgPSBmdW5jdGlvbiAoaG9zdCwgb2JqKSB7XG4gIHZhciBrcyA9IE9iamVjdC5rZXlzKG9iailcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtzLmxlbmd0aDsgKytpKSB7XG4gICAgaG9zdFtrc1tpXV0gPSBvYmpba3NbaV1dXG4gIH1cbiAgcmV0dXJuIGhvc3Rcbn1cblxudmFyIHJlZHVjZSA9IGN1cnJ5KGZ1bmN0aW9uIChmbiwgYWNjdW0sIGNvbCkge1xuICBpZiAgICAgIChpbnN0YW5jZU9mKEFycmF5LCBjb2wpKSAgICAgICAgcmV0dXJuIHJlZHVjZUFycmF5KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKEZsb2F0MzJBcnJheSwgY29sKSkgcmV0dXJuIHJlZHVjZUFycmF5KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKFVpbnQzMkFycmF5LCBjb2wpKSAgcmV0dXJuIHJlZHVjZUFycmF5KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChjb2wuX19yZWR1Y2UgIT09IHVuZGVmaW5lZCkgICAgcmV0dXJuIGNvbC5fX3JlZHVjZShmbiwgYWNjdW0sIGNvbClcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihPYmplY3QsIGNvbCkpICAgICAgIHJldHVybiByZWR1Y2VPYmplY3QoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIGNvbGxlY3Rpb24gdHlwZVwiKVxufSlcblxudmFyIGNvbnMgPSBjdXJyeShmdW5jdGlvbiAoY29sLCBlbCkge1xuICBpZiAgICAgIChpbnN0YW5jZU9mKEFycmF5LCBjb2wpKSAgIHJldHVybiBjb25zQXJyYXkoY29sLCBlbClcbiAgZWxzZSBpZiAoY29sLl9fY29ucyAhPT0gdW5kZWZpbmVkKSByZXR1cm4gY29sLl9fY29ucyhjb2wsIGVsKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKE9iamVjdCwgY29sKSkgIHJldHVybiBjb25zT2JqZWN0KGNvbCwgZWwpXG4gIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBjb2xsZWN0aW9uIHR5cGVcIilcbn0pXG5cbnZhciBlbXB0eSA9IGZ1bmN0aW9uIChjb2wpIHtcbiAgaWYgICAgICAoaW5zdGFuY2VPZihBcnJheSwgY29sKSkgICAgICAgIHJldHVybiBbXVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKEZsb2F0MzJBcnJheSwgY29sKSkgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXlcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihVaW50MzJBcnJheSwgY29sKSkgIHJldHVybiBuZXcgVWludDMyQXJyYXlcbiAgZWxzZSBpZiAoY29sLl9fZW1wdHkgIT09IHVuZGVmaW5lZCkgICAgIHJldHVybiBjb2wuX19lbXB0eSgpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoT2JqZWN0LCBjb2wpKSAgICAgICByZXR1cm4ge31cbiAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gY29sbGVjdGlvbiB0eXBlXCIpXG59XG5cbnZhciBtYXBwaW5nID0gZnVuY3Rpb24gKHRyYW5zRm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChzdGVwRm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgICAgcmV0dXJuIHN0ZXBGbihhY2MsIHRyYW5zRm4oeCkpXG4gICAgfVxuICB9XG59XG5cbnZhciBwbHVja2luZyA9IGZ1bmN0aW9uIChwcm9wTmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHN0ZXBGbikge1xuICAgIHJldHVybiBtYXBwaW5nKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4W3Byb3BOYW1lXSB9KShzdGVwRm4pXG4gIH1cbn1cblxudmFyIGZpbHRlcmluZyA9IGZ1bmN0aW9uIChwcmVkRm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChzdGVwRm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgICAgcmV0dXJuIHByZWRGbih4KSA/IHN0ZXBGbihhY2MsIHgpIDogYWNjIFxuICAgIH1cbiAgfVxufVxuXG52YXIgY2hlY2tpbmcgPSBmdW5jdGlvbiAocHJvcCwgdmFsKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoc3RlcEZuKSB7XG4gICAgcmV0dXJuIGZpbHRlcmluZyhmdW5jdGlvbiAoeCkgeyByZXR1cm4geFtwcm9wXSA9PT0gdmFsIH0pKHN0ZXBGbilcbiAgfVxufVxuXG4vL1RISVMgV0lMTCBNVVRBVEUgVEhFIFNUUlVDVFVSRSBQUk9WSURFRCBUTyBJVCBESVJFQ1RMWVxudmFyIG11dGF0aW5nID0gZnVuY3Rpb24gKG11dEZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoc3RlcEZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICAgIG11dEZuKHgpXG4gICAgICByZXR1cm4gc3RlcEZuKGFjYywgeClcbiAgICB9XG4gIH1cbn1cblxudmFyIGNhdCA9IGZ1bmN0aW9uIChmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgIHJldHVybiByZWR1Y2UoZm4sIGFjYywgeCkgXG4gIH1cbn1cblxudmFyIG1hcCA9IGN1cnJ5KGZ1bmN0aW9uIChmbiwgY29sKSB7XG4gIHJldHVybiByZWR1Y2UobWFwcGluZyhmbikoY29ucyksIGVtcHR5KGNvbCksIGNvbClcbn0pXG5cbnZhciBtYXBjYXR0aW5nID0gZnVuY3Rpb24gKHRyYW5zRm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChzdGVwRm4pIHtcbiAgICByZXR1cm4gY29tcG9zZShbY2F0LCBtYXBwaW5nKHRyYW5zRm4pXSkoc3RlcEZuKVxuICB9XG59XG5cbnZhciBmaWx0ZXIgPSBjdXJyeShmdW5jdGlvbiAocHJlZEZuLCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZShmaWx0ZXJpbmcocHJlZEZuKShjb25zKSwgZW1wdHkoY29sKSwgY29sKVxufSlcblxudmFyIG11dGF0ZSA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZSh0cmFuc0ZuKHJlZE5vb3ApLCB1bmRlZmluZWQsIGNvbClcbn0pXG5cbnZhciB0cmFuc2R1Y2UgPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgc3RlcEZuLCBpbml0LCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZSh0cmFuc0ZuKHN0ZXBGbiksIGluaXQsIGNvbClcbn0pXG5cbnZhciBzZXF1ZW5jZSA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZSh0cmFuc0ZuKGNvbnMpLCBlbXB0eShjb2wpLCBjb2wpXG59KVxuXG52YXIgaW50byA9IGN1cnJ5KGZ1bmN0aW9uICh0bywgdHJhbnNGbiwgZnJvbSkge1xuICByZXR1cm4gdHJhbnNkdWNlKHRyYW5zRm4sIGNvbnMsIHRvLCBmcm9tKVxufSlcblxudHJhbnMucmVkdWNlICAgICA9IHJlZHVjZVxudHJhbnMuY29ucyAgICAgICA9IGNvbnNcbnRyYW5zLmVtcHR5ICAgICAgPSBlbXB0eVxudHJhbnMubWFwcGluZyAgICA9IG1hcHBpbmdcbnRyYW5zLnBsdWNraW5nICAgPSBwbHVja2luZ1xudHJhbnMuY2F0ICAgICAgICA9IGNhdFxudHJhbnMuZmlsdGVyaW5nICA9IGZpbHRlcmluZ1xudHJhbnMuY2hlY2tpbmcgICA9IGNoZWNraW5nXG50cmFucy5tYXAgICAgICAgID0gbWFwXG50cmFucy5tYXBjYXR0aW5nID0gbWFwY2F0dGluZ1xudHJhbnMubXV0YXRpbmcgICA9IG11dGF0aW5nXG50cmFucy5tdXRhdGUgICAgID0gbXV0YXRlXG50cmFucy5maWx0ZXIgICAgID0gZmlsdGVyXG50cmFucy50cmFuc2R1Y2UgID0gdHJhbnNkdWNlXG50cmFucy5zZXF1ZW5jZSAgID0gc2VxdWVuY2VcbnRyYW5zLmludG8gICAgICAgPSBpbnRvXG5tb2R1bGUuZXhwb3J0cyAgID0gdHJhbnNcbiIsInZhciBwcm9kYXNoICAgICAgICAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciBhc3luYyAgICAgICAgICAgID0gcmVxdWlyZShcImFzeW5jXCIpXG52YXIgZ3JhcGggICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2dyYXBoXCIpXG52YXIgbG9hZGVycyAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2xvYWRlcnNcIilcbnZhciB1dGlscyAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvZ2wtdXRpbHNcIilcbnZhciByYW5kb20gICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvcmFuZG9tXCIpXG52YXIgcGh5c2ljcyAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL3BoeXNpY3NcIilcbnZhciBsaWZldGltZSAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbGlmZXRpbWVcIilcbnZhciBlbWl0dGVycyAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvZW1pdHRlcnNcIilcbnZhciBjbG9jayAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvY2xvY2tcIilcbnZhciBjYW1lcmEgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvY2FtZXJhXCIpXG52YXIgbGlnaHQgICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2xpZ2h0XCIpXG52YXIgdmVjMyAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL3ZlYzNcIilcbnZhciBHcmFwaCAgICAgICAgICAgID0gZ3JhcGguR3JhcGhcbnZhciBhdHRhY2hUb1Jvb3QgICAgID0gZ3JhcGguYXR0YWNoVG9Sb290XG52YXIgYXR0YWNoVG9Ob2RlICAgICA9IGdyYXBoLmF0dGFjaFRvTm9kZVxudmFyIGF0dGFjaE1hbnlUb05vZGUgPSBncmFwaC5hdHRhY2hNYW55VG9Ob2RlXG52YXIgY29tcG9zZSAgICAgICAgICA9IHByb2Rhc2guZnVuY3Rpb25zLmNvbXBvc2VcbnZhciBwYXJ0aWFsICAgICAgICAgID0gcHJvZGFzaC5mdW5jdGlvbnMucGFydGlhbFxudmFyIGludG8gICAgICAgICAgICAgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLmludG9cbnZhciB0cmFuc2R1Y2UgICAgICAgID0gcHJvZGFzaC50cmFuc2R1Y2Vycy50cmFuc2R1Y2VcbnZhciBjb25zICAgICAgICAgICAgID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5jb25zXG52YXIgc2VxdWVuY2UgICAgICAgICA9IHByb2Rhc2gudHJhbnNkdWNlcnMuc2VxdWVuY2VcbnZhciBmaWx0ZXJpbmcgICAgICAgID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5maWx0ZXJpbmdcbnZhciBjaGVja2luZyAgICAgICAgID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5jaGVja2luZ1xudmFyIHBsdWNraW5nICAgICAgICAgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLnBsdWNraW5nXG52YXIgY2F0ICAgICAgICAgICAgICA9IHByb2Rhc2gudHJhbnNkdWNlcnMuY2F0XG52YXIgUGFydGljbGVHcm91cCAgICA9IGVtaXR0ZXJzLlBhcnRpY2xlR3JvdXBcbnZhciBFbWl0dGVyICAgICAgICAgID0gZW1pdHRlcnMuRW1pdHRlclxudmFyIHVwZGF0ZUVtaXR0ZXIgICAgPSBlbWl0dGVycy51cGRhdGVFbWl0dGVyXG52YXIgbG9hZFNoYWRlciAgICAgICA9IGxvYWRlcnMubG9hZFNoYWRlclxudmFyIHVwZGF0ZUJ1ZmZlciAgICAgPSB1dGlscy51cGRhdGVCdWZmZXJcbnZhciBjbGVhckNvbnRleHQgICAgID0gdXRpbHMuY2xlYXJDb250ZXh0XG52YXIgTG9hZGVkUHJvZ3JhbSAgICA9IHV0aWxzLkxvYWRlZFByb2dyYW1cbnZhciByYW5kQm91bmQgICAgICAgID0gcmFuZG9tLnJhbmRCb3VuZFxudmFyIHVwZGF0ZVBoeXNpY3MgICAgPSBwaHlzaWNzLnVwZGF0ZVBoeXNpY3NcbnZhciBraWxsVGhlT2xkICAgICAgID0gbGlmZXRpbWUua2lsbFRoZU9sZFxudmFyIENsb2NrICAgICAgICAgICAgPSBjbG9jay5DbG9ja1xudmFyIHVwZGF0ZUNsb2NrICAgICAgPSBjbG9jay51cGRhdGVDbG9ja1xudmFyIENhbWVyYSAgICAgICAgICAgPSBjYW1lcmEuQ2FtZXJhXG52YXIgdXBkYXRlQ2FtZXJhICAgICA9IGNhbWVyYS51cGRhdGVDYW1lcmFcbnZhciBQb2ludExpZ2h0ICAgICAgID0gbGlnaHQuUG9pbnRMaWdodFxudmFyIHNldFZlYzMgICAgICAgICAgPSB2ZWMzLnNldFZlYzNcbnZhciBjYW52YXMgICAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwbGF5Z3JvdW5kXCIpXG5cbnZhciBpc0VtaXR0ZXIgICA9IGNoZWNraW5nKFwiZW1pdHRlclwiLCB0cnVlKVxudmFyIGlzUGFydGljbGUgID0gY2hlY2tpbmcoXCJwYXJ0aWNsZVwiLCB0cnVlKVxudmFyIGlzTGlnaHQgICAgID0gY2hlY2tpbmcoXCJsaWdodFwiLCB0cnVlKVxudmFyIGlzTGl2aW5nICAgID0gY2hlY2tpbmcoXCJsaXZpbmdcIiwgdHJ1ZSlcbnZhciBoYXNMaWZlc3BhbiA9IGZpbHRlcmluZyhmdW5jdGlvbiAoZSkgeyBcbiAgcmV0dXJuIGUubGlmZXNwYW4gIT09IHVuZGVmaW5lZFxufSlcbnZhciBoYXNQaHlzaWNzICA9IGZpbHRlcmluZyhmdW5jdGlvbiAoZSkge1xuICByZXR1cm4gISFlLnBvc2l0aW9uICYmICEhZS52ZWxvY2l0eSAmJiAhIWUuYWNjZWxlcmF0aW9uXG59KVxudmFyIGdldExpdmluZ1BhcnRpY2xlcyA9IGNvbXBvc2UoW2lzTGl2aW5nLCBpc1BhcnRpY2xlXSlcbnZhciBnZXRMaXZpbmdMaWdodHMgICAgPSBjb21wb3NlKFtpc0xpdmluZywgaXNMaWdodF0pXG52YXIgZmxhdHRlblBvc2l0aW9ucyAgID0gc2VxdWVuY2UoY29tcG9zZShbaXNMaXZpbmcsIHBsdWNraW5nKFwicG9zaXRpb25cIiksIGNhdF0pKVxudmFyIGZsYXR0ZW5TaXplcyAgICAgICA9IHNlcXVlbmNlKGNvbXBvc2UoW2lzTGl2aW5nLCBwbHVja2luZyhcInNpemVcIiksIGNhdF0pKVxuXG4vLyhXb3JsZCAtPiBOb2RlKSAtPiBTdHJpbmcgLT4gV29ybGQgLT4gVm9pZFxudmFyIGZvckVhY2hOb2RlID0gZnVuY3Rpb24gKGZuLCBub2RlSWQsIHdvcmxkKSB7XG4gIHZhciBub2RlID0gd29ybGQuZ3JhcGgubm9kZXNbbm9kZUlkXVxuXG4gIGZuKHdvcmxkLCBub2RlKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRJZHMubGVuZ3RoOyArK2kpIHtcbiAgICBmb3JFYWNoTm9kZShmbiwgbm9kZS5jaGlsZElkc1tpXSwgd29ybGQpXG4gIH1cbn1cblxuLy8oV29ybGQgLT4gTm9kZSkgLT4gV29ybGQgLT4gVm9pZFxudmFyIHVwZGF0ZUVudGl0aWVzID0gZnVuY3Rpb24gKGZuLCB3b3JsZCkge1xuICBmb3JFYWNoTm9kZShmbiwgd29ybGQuZ3JhcGgucm9vdE5vZGVJZCwgd29ybGQpXG59XG5cbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKHdvcmxkKSB7XG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xuICAgIHVwZGF0ZUNsb2NrKHdvcmxkLmNsb2NrLCBwZXJmb3JtYW5jZS5ub3coKSlcbiAgICB1cGRhdGVDYW1lcmEod29ybGQsIHdvcmxkLmNhbWVyYSlcbiAgICB1cGRhdGVFbnRpdGllcyhraWxsVGhlT2xkLCB3b3JsZClcbiAgICB1cGRhdGVFbnRpdGllcyh1cGRhdGVQaHlzaWNzLCB3b3JsZClcbiAgICB1cGRhdGVFbnRpdGllcyh1cGRhdGVFbWl0dGVyLCB3b3JsZClcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZExpZ2h0RGF0YSAod29ybGQpIHtcbiAgdmFyIGxpZ2h0cyAgICA9IHdvcmxkLmdyb3Vwcy5saWdodHNcbiAgdmFyIGxpZ2h0RGF0YSA9IHtcbiAgICBwb3NpdGlvbnM6ICAgbmV3IEZsb2F0MzJBcnJheShsaWdodHMubGVuZ3RoICogMyksXG4gICAgY29sb3JzOiAgICAgIG5ldyBGbG9hdDMyQXJyYXkobGlnaHRzLmxlbmd0aCAqIDMpLFxuICAgIGludGVuc2l0aWVzOiBuZXcgRmxvYXQzMkFycmF5KGxpZ2h0cy5sZW5ndGgpXG4gIH1cbiAgdmFyIGxpZ2h0XG4gIFxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxpZ2h0cy5sZW5ndGg7ICsraSkge1xuICAgIGxpZ2h0ID0gbGlnaHRzW2ldXG4gICAgbGlnaHREYXRhLnBvc2l0aW9uc1tpKjNdICAgPSBsaWdodC5wb3NpdGlvblswXVxuICAgIGxpZ2h0RGF0YS5wb3NpdGlvbnNbaSozKzFdID0gbGlnaHQucG9zaXRpb25bMV1cbiAgICBsaWdodERhdGEucG9zaXRpb25zW2kqMysyXSA9IGxpZ2h0LnBvc2l0aW9uWzJdXG4gICAgbGlnaHREYXRhLmNvbG9yc1tpKjNdICAgICAgPSBsaWdodC5yZ2JbMF1cbiAgICBsaWdodERhdGEuY29sb3JzW2kqMysxXSAgICA9IGxpZ2h0LnJnYlsxXVxuICAgIGxpZ2h0RGF0YS5jb2xvcnNbaSozKzJdICAgID0gbGlnaHQucmdiWzJdXG4gICAgbGlnaHREYXRhLmludGVuc2l0aWVzW2ldICAgPSBsaWdodC5pbnRlbnNpdHlcbiAgfVxuICByZXR1cm4gbGlnaHREYXRhXG59XG5cbmZ1bmN0aW9uIHJlbmRlclBhcnRpY2xlcyAod29ybGQsIGxpZ2h0RGF0YSkge1xuICB2YXIgZ2wgICAgICAgID0gd29ybGQuZ2xcbiAgdmFyIHZpZXcgICAgICA9IHdvcmxkLnZpZXdcbiAgdmFyIGxwICAgICAgICA9IHdvcmxkLnByb2dyYW1zLnBhcnRpY2xlXG4gIHZhciBwYXJ0aWNsZXMgPSB3b3JsZC5ncm91cHMucGFydGljbGVzXG4gIHZhciBwb3NpdGlvbnMgPSBuZXcgRmxvYXQzMkFycmF5KGZsYXR0ZW5Qb3NpdGlvbnMocGFydGljbGVzKSlcblxuICBnbC51c2VQcm9ncmFtKGxwLnByb2dyYW0pXG4gIGdsLnVuaWZvcm0zZnYobHAudW5pZm9ybXNbXCJ1TGlnaHRQb3NpdGlvbnNbMF1cIl0sIGxpZ2h0RGF0YS5wb3NpdGlvbnMpXG4gIGdsLnVuaWZvcm0zZnYobHAudW5pZm9ybXNbXCJ1TGlnaHRDb2xvcnNbMF1cIl0sIGxpZ2h0RGF0YS5jb2xvcnMpXG4gIGdsLnVuaWZvcm0xZnYobHAudW5pZm9ybXNbXCJ1TGlnaHRJbnRlbnNpdGllc1swXVwiXSwgbGlnaHREYXRhLmludGVuc2l0aWVzKVxuICBnbC51bmlmb3JtNGYobHAudW5pZm9ybXMudUNvbG9yLCAwLjAsIDAuMCwgMC4wLCAxLjApXG4gIGdsLnVuaWZvcm0yZihscC51bmlmb3Jtcy51U2NyZWVuU2l6ZSwgdmlldy5jbGllbnRXaWR0aCwgdmlldy5jbGllbnRIZWlnaHQpXG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYobHAudW5pZm9ybXMudVZpZXcsIGZhbHNlLCB3b3JsZC5jYW1lcmEudmlldylcbiAgZ2wudW5pZm9ybU1hdHJpeDRmdihscC51bmlmb3Jtcy51UHJvamVjdGlvbiwgZmFsc2UsIHdvcmxkLmNhbWVyYS5wcm9qZWN0aW9uKVxuICBnbC51bmlmb3JtMWYobHAudW5pZm9ybXMudVNpemUsIDEuMClcbiAgdXBkYXRlQnVmZmVyKGdsLCAzLCBscC5hdHRyaWJ1dGVzLmFQb3NpdGlvbiwgbHAuYnVmZmVycy5hUG9zaXRpb24sIHBvc2l0aW9ucylcbiAgZ2wuZHJhd0FycmF5cyhnbC5QT0lOVFMsIDAsIHBvc2l0aW9ucy5sZW5ndGggLyAzKVxufVxuXG5mdW5jdGlvbiBtYWtlUmVuZGVyIChnbCwgd29ybGQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgdmFyIGxpZ2h0RGF0YSA9IGJ1aWxkTGlnaHREYXRhKHdvcmxkKVxuXG4gICAgY2xlYXJDb250ZXh0KGdsKVxuICAgIHJlbmRlclBhcnRpY2xlcyh3b3JsZCwgbGlnaHREYXRhKVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpIFxuICB9XG59XG5cbmFzeW5jLnBhcmFsbGVsKHtcbiAgdmVydGV4OiAgIHBhcnRpYWwobG9hZFNoYWRlciwgXCIvc2hhZGVycy8wMXYuZ2xzbFwiKSxcbiAgZnJhZ21lbnQ6IHBhcnRpYWwobG9hZFNoYWRlciwgXCIvc2hhZGVycy8wMWYuZ2xzbFwiKVxufSwgZnVuY3Rpb24gKGVyciwgc2hhZGVycykge1xuICB2YXIgZ2wgICAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKVxuICB2YXIgcGFydGljbGVQcm9ncmFtID0gTG9hZGVkUHJvZ3JhbShnbCwgc2hhZGVycy52ZXJ0ZXgsIHNoYWRlcnMuZnJhZ21lbnQpXG4gIHZhciBhc3BlY3QgICAgICAgICAgPSBjYW52YXMuY2xpZW50V2lkdGggLyBjYW52YXMuY2xpZW50SGVpZ2h0XG4gIHZhciBmb3YgICAgICAgICAgICAgPSBNYXRoLlBJIC8gMlxuICB2YXIgd29ybGQgICAgICAgICAgID0ge1xuICAgIGdsOiAgICAgICBnbCxcbiAgICB2aWV3OiAgICAgY2FudmFzLFxuICAgIGNsb2NrOiAgICBDbG9jayhwZXJmb3JtYW5jZS5ub3coKSksXG4gICAgY2FtZXJhOiAgIENhbWVyYSgwLCAwLCAyLCBmb3YsIGFzcGVjdCwgMSwgMTApLFxuICAgIGdyYXBoOiAgICBHcmFwaCgpLFxuICAgIHN5c3RlbXM6ICB7XG4gICAgICBlbWl0dGVyczogIHVwZGF0ZUVtaXR0ZXIsXG4gICAgICBsaWZlc3BhbnM6IGtpbGxUaGVPbGQsXG4gICAgICBwaHlzaWNzOiAgIHVwZGF0ZVBoeXNpY3NcbiAgICB9LFxuICAgIGdyb3VwczogICB7XG4gICAgICBlbWl0dGVyczogIFtdLFxuICAgICAgbGlmZXNwYW5zOiBbXSxcbiAgICAgIHBoeXNpY3M6ICAgW10sXG4gICAgICBsaWdodHM6ICAgIFtdLFxuICAgICAgcGFydGljbGVzOiBbXVxuICAgIH0sXG4gICAgcHJvZ3JhbXM6IHtcbiAgICAgIHBhcnRpY2xlOiBwYXJ0aWNsZVByb2dyYW1cbiAgICB9XG4gIH1cbiAgdmFyIGwxICAgPSBQb2ludExpZ2h0KDAsIDAsIDApXG4gIHZhciBsMiAgID0gUG9pbnRMaWdodCgwLCAuMjUsIDApXG4gIHZhciBsMyAgID0gUG9pbnRMaWdodCgwLCAuNSwgMClcbiAgdmFyIGUxICAgPSBFbWl0dGVyKDEwMDAsIDEwLCAuMDAyLCAuMSwgMCwgMCwgMCwgMCwgMSwgcmFuZEJvdW5kKC0wLjIsIDAuMikpICBcbiAgdmFyIGUxcHMgPSBQYXJ0aWNsZUdyb3VwKDUwLCAxMDAwKVxuXG4gIHNldFZlYzMoMS4wLCAwLjAsIDAuMCwgbDEucmdiKVxuICBzZXRWZWMzKDAuMCwgMS4wLCAwLjAsIGwyLnJnYilcbiAgc2V0VmVjMygwLjAsIDAuMCwgMS4wLCBsMy5yZ2IpXG4gIGF0dGFjaFRvUm9vdCh3b3JsZC5ncmFwaCwgbDEpXG4gIGF0dGFjaFRvUm9vdCh3b3JsZC5ncmFwaCwgbDIpXG4gIGF0dGFjaFRvUm9vdCh3b3JsZC5ncmFwaCwgbDMpXG4gIGF0dGFjaFRvUm9vdCh3b3JsZC5ncmFwaCwgZTEpXG4gIGF0dGFjaE1hbnlUb05vZGUod29ybGQuZ3JhcGgsIGUxLCBlMXBzKVxuICBpbnRvKHdvcmxkLmdyb3Vwcy5saWdodHMsIGlzTGlnaHQsIHdvcmxkLmdyYXBoKVxuICBpbnRvKHdvcmxkLmdyb3Vwcy5lbWl0dGVycywgaXNFbWl0dGVyLCB3b3JsZC5ncmFwaClcbiAgaW50byh3b3JsZC5ncm91cHMucGFydGljbGVzLCBpc1BhcnRpY2xlLCB3b3JsZC5ncmFwaClcbiAgaW50byh3b3JsZC5ncm91cHMubGlmZXNwYW5zLCBoYXNMaWZlc3Bhbiwgd29ybGQuZ3JhcGgpXG4gIGludG8od29ybGQuZ3JvdXBzLnBoeXNpY3MsIGhhc1BoeXNpY3MsIHdvcmxkLmdyYXBoKVxuICB3aW5kb3cud29ybGQgPSB3b3JsZFxuXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUod29ybGQpLCAyNSlcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VSZW5kZXIoZ2wsIHdvcmxkKSlcbn0pXG4iLCJ2YXIgbWF0NCAgICAgPSByZXF1aXJlKFwiZ2wtbWF0NFwiKVxudmFyIHZlYzMgICAgID0gcmVxdWlyZShcIi4vdmVjM1wiKVxudmFyIFZlYzMgICAgID0gdmVjMy5WZWMzXG52YXIgcm90U3BlZWQgPSBNYXRoLlBJIC8gMzAwMFxudmFyIGNhbWVyYSAgID0ge31cblxuXG52YXIgQ2FtZXJhID0gZnVuY3Rpb24gKHgsIHksIHosIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENhbWVyYSkpIHJldHVybiBuZXcgQ2FtZXJhKHgsIHksIHosIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpXG5cbiAgdGhpcy5wb3NpdGlvbiAgID0gVmVjMyh4LCB5ICx6KVxuICB0aGlzLmZvdiAgICAgICAgPSBmb3ZcbiAgdGhpcy5uZWFyICAgICAgID0gbmVhclxuICB0aGlzLmZhciAgICAgICAgPSBmYXJcbiAgdGhpcy5hc3BlY3QgICAgID0gYXNwZWN0XG4gIHRoaXMucHJvamVjdGlvbiA9IG1hdDQucGVyc3BlY3RpdmUobWF0NC5jcmVhdGUoKSwgZm92LCBhc3BlY3QsIG5lYXIsIGZhcilcblxuICB0aGlzLmV5ZSAgICAgICAgPSBWZWMzKHgsIHksIHopXG4gIHRoaXMubG9va0F0ICAgICA9IFZlYzMoMCwgMCwgMClcbiAgdGhpcy51cCAgICAgICAgID0gVmVjMygwLCAxLCAwKVxuICB0aGlzLnZpZXcgICAgICAgPSBtYXQ0Lmxvb2tBdChtYXQ0LmNyZWF0ZSgpLCB0aGlzLmV5ZSwgdGhpcy5sb29rQXQsIHRoaXMudXApXG59XG5cbnZhciB1cGRhdGVDYW1lcmEgPSBmdW5jdGlvbiAod29ybGQsIGNhbWVyYSkge1xuICB2YXIgZFQgICA9IHdvcmxkLmNsb2NrLmRUXG4gIHZhciB2aWV3ID0gd29ybGQuY2FtZXJhLnZpZXdcblxuICBtYXQ0LnJvdGF0ZVkodmlldywgdmlldywgcm90U3BlZWQgKiBkVClcbn1cblxuXG5jYW1lcmEuQ2FtZXJhICAgICAgID0gQ2FtZXJhXG5jYW1lcmEudXBkYXRlQ2FtZXJhID0gdXBkYXRlQ2FtZXJhXG5tb2R1bGUuZXhwb3J0cyA9IGNhbWVyYVxuIiwidmFyIGNsb2NrID0ge31cblxudmFyIENsb2NrID0gZnVuY3Rpb24gKG5vdykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2xvY2spKSByZXR1cm4gbmV3IENsb2NrKG5vdylcbiAgdGhpcy5vbGRUaW1lID0gbm93XG4gIHRoaXMubmV3VGltZSA9IG5vd1xuICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcbn1cblxudmFyIHVwZGF0ZUNsb2NrID0gZnVuY3Rpb24gKGNsb2NrLCBuZXdUaW1lKSB7XG4gIGNsb2NrLm9sZFRpbWUgPSBjbG9jay5uZXdUaW1lXG4gIGNsb2NrLm5ld1RpbWUgPSBuZXdUaW1lXG4gIGNsb2NrLmRUICAgICAgPSBjbG9jay5uZXdUaW1lIC0gY2xvY2sub2xkVGltZVxufVxuXG5jbG9jay5DbG9jayAgICAgICA9IENsb2NrXG5jbG9jay51cGRhdGVDbG9jayA9IHVwZGF0ZUNsb2NrXG5cbm1vZHVsZS5leHBvcnRzID0gY2xvY2tcbiIsInZhciB1dWlkICAgICAgPSByZXF1aXJlKFwibm9kZS11dWlkXCIpXG52YXIgcHJvZGFzaCAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciByYW5kb20gICAgPSByZXF1aXJlKFwiLi9yYW5kb21cIilcbnZhciB2ZWMzICAgICAgPSByZXF1aXJlKFwiLi92ZWMzXCIpXG52YXIgVmVjMyAgICAgID0gdmVjMy5WZWMzXG52YXIgZmluZCAgICAgID0gcHJvZGFzaC5hcnJheS5maW5kXG52YXIgY3VycnkgICAgID0gcHJvZGFzaC5mdW5jdGlvbnMuY3VycnlcbnZhciByYW5kQm91bmQgPSByYW5kb20ucmFuZEJvdW5kXG52YXIgZW1pdHRlcnMgID0ge31cblxudmFyIFBhcnRpY2xlID0gZnVuY3Rpb24gKGxpZmVzcGFuKSB7XG4gIHJldHVybiB7XG4gICAgaWQ6ICAgICAgICAgICB1dWlkLnY0KCksXG4gICAgcGFydGljbGU6ICAgICB0cnVlLFxuICAgIHBvc2l0aW9uOiAgICAgVmVjMygwLCAwLCAwKSxcbiAgICB2ZWxvY2l0eTogICAgIFZlYzMoMCwgMCwgMCksXG4gICAgYWNjZWxlcmF0aW9uOiBWZWMzKDAsIC0wLjAwMDAwMTgsIDApLFxuICAgIHJlbmRlcmFibGU6ICAgdHJ1ZSxcbiAgICBzaXplOiAgICAgICAgIDQuMCxcbiAgICB0aW1lVG9EaWU6ICAgIDAsXG4gICAgbGlmZXNwYW46ICAgICBsaWZlc3BhbixcbiAgICBsaXZpbmc6ICAgICAgIGZhbHNlXG4gIH1cbn1cblxudmFyIEVtaXR0ZXIgPSBmdW5jdGlvbiAobGlmZXNwYW4sIHJhdGUsIHNwZWVkLCBzcHJlYWQsIHB4LCBweSwgcHosIGR4LCBkeSwgZHopIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogICAgICAgICAgIHV1aWQudjQoKSxcbiAgICBlbWl0dGVyOiAgICAgIHRydWUsXG4gICAgcmF0ZTogICAgICAgICByYXRlLCBcbiAgICBzcGVlZDogICAgICAgIHNwZWVkLFxuICAgIHNwcmVhZDogICAgICAgc3ByZWFkLFxuICAgIG5leHRGaXJlVGltZTogMCxcbiAgICBwb3NpdGlvbjogICAgIFZlYzMocHgsIHB5LCBweiksXG4gICAgdmVsb2NpdHk6ICAgICBWZWMzKDAsIDAsIDApLFxuICAgIGFjY2VsZXJhdGlvbjogVmVjMygwLCAwLCAwKSxcbiAgICBkaXJlY3Rpb246ICAgIFZlYzMoZHgsIGR5LCBkeiksXG4gICAgcmVuZGVyYWJsZTogICBmYWxzZSxcbiAgICBsaXZpbmc6ICAgICAgIHRydWVcbiAgfVxufVxuXG52YXIgUGFydGljbGVHcm91cCA9IGZ1bmN0aW9uIChjb3VudCwgbGlmZXNwYW4pIHtcbiAgdmFyIHBhcnRpY2xlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgcGFydGljbGVzLnB1c2goUGFydGljbGUobGlmZXNwYW4pKVxuICB9ICAgIFxuICByZXR1cm4gcGFydGljbGVzXG59XG5cbnZhciBzY2FsZUFuZFNwcmVhZCA9IGZ1bmN0aW9uIChzY2FsZSwgc3ByZWFkLCB2YWwpIHtcbiAgcmV0dXJuIHNjYWxlICogKHZhbCArIHJhbmRCb3VuZCgtMSAqIHNwcmVhZCwgc3ByZWFkKSlcbn1cblxudmFyIGZpbmRGaXJzdERlYWQgPSBmdW5jdGlvbiAoZ3JhcGgsIGNoaWxkSWRzKSB7XG4gIHZhciBjaGlsZE5vZGVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgY2hpbGROb2RlID0gZ3JhcGgubm9kZXNbY2hpbGRJZHNbaV1dXG4gICAgaWYgKCFjaGlsZE5vZGUubGl2aW5nKSByZXR1cm4gY2hpbGROb2RlXG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG52YXIgdXBkYXRlRW1pdHRlciA9IGZ1bmN0aW9uICh3b3JsZCwgZSkge1xuICB2YXIgdGltZSA9IHdvcmxkLmNsb2NrLm5ld1RpbWVcbiAgdmFyIHBhcnRpY2xlIFxuXG4gIGlmICghZS5saXZpbmcpICByZXR1cm5cbiAgaWYgKHRpbWUgPiBlLm5leHRGaXJlVGltZSkge1xuICAgIHBhcnRpY2xlICAgICAgICAgICAgID0gZmluZEZpcnN0RGVhZCh3b3JsZC5ncmFwaCwgZS5jaGlsZElkcylcbiAgICBwYXJ0aWNsZS50aW1lVG9EaWUgICA9IHRpbWUgKyBwYXJ0aWNsZS5saWZlc3BhblxuICAgIHBhcnRpY2xlLmxpdmluZyAgICAgID0gdHJ1ZVxuICAgIHBhcnRpY2xlLnBvc2l0aW9uWzBdID0gZS5wb3NpdGlvblswXVxuICAgIHBhcnRpY2xlLnBvc2l0aW9uWzFdID0gZS5wb3NpdGlvblsxXVxuICAgIHBhcnRpY2xlLnBvc2l0aW9uWzJdID0gZS5wb3NpdGlvblsyXVxuICAgIHBhcnRpY2xlLnZlbG9jaXR5WzBdID0gc2NhbGVBbmRTcHJlYWQoZS5zcGVlZCwgZS5zcHJlYWQsIGUuZGlyZWN0aW9uWzBdKVxuICAgIHBhcnRpY2xlLnZlbG9jaXR5WzFdID0gc2NhbGVBbmRTcHJlYWQoZS5zcGVlZCwgZS5zcHJlYWQsIGUuZGlyZWN0aW9uWzFdKVxuICAgIHBhcnRpY2xlLnZlbG9jaXR5WzJdID0gc2NhbGVBbmRTcHJlYWQoZS5zcGVlZCwgZS5zcHJlYWQsIGUuZGlyZWN0aW9uWzJdKVxuICAgIGUubmV4dEZpcmVUaW1lICs9IGUucmF0ZVxuICB9XG59XG5cbmVtaXR0ZXJzLlBhcnRpY2xlICAgICAgPSBQYXJ0aWNsZVxuZW1pdHRlcnMuUGFydGljbGVHcm91cCA9IFBhcnRpY2xlR3JvdXBcbmVtaXR0ZXJzLkVtaXR0ZXIgICAgICAgPSBFbWl0dGVyXG5lbWl0dGVycy51cGRhdGVFbWl0dGVyID0gdXBkYXRlRW1pdHRlclxubW9kdWxlLmV4cG9ydHMgICAgICAgICA9IGVtaXR0ZXJzXG4iLCJ2YXIgdXRpbHMgPSB7fVxuXG52YXIgY2xlYXJDb250ZXh0ID0gZnVuY3Rpb24gKGdsKSB7XG4gIGdsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMC4wKVxuICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxufVxuXG52YXIgdXBkYXRlQnVmZmVyID0gZnVuY3Rpb24gKGdsLCBjaHVua1NpemUsIGF0dHJpYnV0ZSwgYnVmZmVyLCBkYXRhKSB7XG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGF0dHJpYnV0ZSlcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihhdHRyaWJ1dGUsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxuICByZXR1cm4gYnVmZmVyXG59XG5cbi8vZ2l2ZW4gc3JjIGFuZCB0eXBlLCBjb21waWxlIGFuZCByZXR1cm4gc2hhZGVyXG5mdW5jdGlvbiBjb21waWxlIChnbCwgc2hhZGVyVHlwZSwgc3JjKSB7XG4gIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoc2hhZGVyVHlwZSlcblxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxuICByZXR1cm4gc2hhZGVyXG59XG5cbi8vbGluayB5b3VyIHByb2dyYW0gdy8gb3BlbmdsXG5mdW5jdGlvbiBsaW5rIChnbCwgdnMsIGZzKSB7XG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpXG5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKSBcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKSBcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcbiAgcmV0dXJuIHByb2dyYW1cbn1cblxuLypcbiAqIFdlIHdhbnQgdG8gY3JlYXRlIGEgd3JhcHBlciBmb3IgYSBsb2FkZWQgZ2wgcHJvZ3JhbVxuICogdGhhdCBpbmNsdWRlcyBwb2ludGVycyB0byBhbGwgdGhlIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzXG4gKiBkZWZpbmVkIGZvciB0aGlzIHByb2dyYW0uICBUaGlzIG1ha2VzIGl0IG1vcmUgY29udmVuaWVudFxuICogdG8gY2hhbmdlIHRoZXNlIHZhbHVlc1xuICovXG52YXIgTG9hZGVkUHJvZ3JhbSA9IGZ1bmN0aW9uIChnbCwgdlNyYywgZlNyYykge1xuICB2YXIgdnMgICAgICAgICAgICA9IGNvbXBpbGUoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIHZhciBmcyAgICAgICAgICAgID0gY29tcGlsZShnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICB2YXIgcHJvZ3JhbSAgICAgICA9IGxpbmsoZ2wsIHZzLCBmcylcbiAgdmFyIG51bUF0dHJpYnV0ZXMgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKVxuICB2YXIgbnVtVW5pZm9ybXMgICA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKVxuICB2YXIgbHAgPSB7XG4gICAgdmVydGV4OiB7XG4gICAgICBzcmM6ICAgIHZTcmMsXG4gICAgICBzaGFkZXI6IHZzIFxuICAgIH0sXG4gICAgZnJhZ21lbnQ6IHtcbiAgICAgIHNyYzogICAgZlNyYyxcbiAgICAgIHNoYWRlcjogZnMgXG4gICAgfSxcbiAgICBwcm9ncmFtOiAgICBwcm9ncmFtLFxuICAgIHVuaWZvcm1zOiAgIHt9LCBcbiAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICBidWZmZXJzOiAgICB7fVxuICB9XG4gIHZhciBhTmFtZVxuICB2YXIgdU5hbWVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bUF0dHJpYnV0ZXM7ICsraSkge1xuICAgIGFOYW1lICAgICAgICAgICAgICAgID0gZ2wuZ2V0QWN0aXZlQXR0cmliKHByb2dyYW0sIGkpLm5hbWVcbiAgICBscC5hdHRyaWJ1dGVzW2FOYW1lXSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIGFOYW1lKVxuICAgIGxwLmJ1ZmZlcnNbYU5hbWVdICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgfVxuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgbnVtVW5pZm9ybXM7ICsraikge1xuICAgIHVOYW1lICAgICAgICAgICAgICA9IGdsLmdldEFjdGl2ZVVuaWZvcm0ocHJvZ3JhbSwgaikubmFtZVxuICAgIGxwLnVuaWZvcm1zW3VOYW1lXSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCB1TmFtZSlcbiAgfVxuXG4gIHJldHVybiBscCBcbn1cblxudXRpbHMuY2xlYXJDb250ZXh0ICA9IGNsZWFyQ29udGV4dFxudXRpbHMudXBkYXRlQnVmZmVyICA9IHVwZGF0ZUJ1ZmZlclxudXRpbHMuTG9hZGVkUHJvZ3JhbSA9IExvYWRlZFByb2dyYW1cbm1vZHVsZS5leHBvcnRzICAgICAgPSB1dGlsc1xuIiwidmFyIHByb2Rhc2ggICA9IHJlcXVpcmUoXCJwcm9kYXNoXCIpXG52YXIgdXVpZCAgICAgID0gcmVxdWlyZShcIm5vZGUtdXVpZFwiKVxudmFyIHRyYW5zZHVjZSA9IHByb2Rhc2gudHJhbnNkdWNlcnMudHJhbnNkdWNlXG52YXIgZmlsdGVyaW5nID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5maWx0ZXJpbmdcbnZhciBjb25zICAgICAgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLmNvbnNcbnZhciBleHRlbmQgICAgPSBwcm9kYXNoLm9iamVjdC5leHRlbmRcbnZhciBjdXJyeSAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5jdXJyeVxudmFyIHJlbW92ZSAgICA9IHByb2Rhc2guYXJyYXkucmVtb3ZlXG52YXIgZ3JhcGggICAgID0ge31cblxudmFyIE5vZGUgPSBmdW5jdGlvbiAoaGFzaCkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTm9kZSkpIHJldHVybiBuZXcgTm9kZShoYXNoKSBcblxuICBleHRlbmQodGhpcywgaGFzaClcbiAgdGhpcy5pZCAgICAgICA9IHRoaXMuaWQgfHwgdXVpZC52NCgpXG4gIHRoaXMucGFyZW50SWQgPSB0aGlzLnBhcmVudElkIHx8IG51bGxcbiAgdGhpcy5jaGlsZElkcyA9IHRoaXMuY2hpbGRJZHMgfHwgW11cbn1cblxudmFyIEdyYXBoID0gZnVuY3Rpb24gKHJvb3ROb2RlKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBHcmFwaCkpIHJldHVybiBuZXcgR3JhcGgocm9vdE5vZGUpXG4gIHZhciByb290Tm9kZSA9IHJvb3ROb2RlIHx8IE5vZGUoeyBpZDogdXVpZC52NCgpIH0pXG5cbiAgdGhpcy5ub2RlcyAgICAgICAgICAgICAgPSB7fVxuICB0aGlzLnJvb3ROb2RlSWQgICAgICAgICA9IHJvb3ROb2RlLmlkXG4gIHRoaXMubm9kZXNbcm9vdE5vZGUuaWRdID0gcm9vdE5vZGVcbn1cblxuLy91c2VkIGludGVybmFsbHkgYnkgZ3JhcGguX19yZWR1Y2UgdG8gc3VwcG9ydCBpdGVyYXRpb25cbnZhciBub2RlUmVkdWNlID0gZnVuY3Rpb24gKHJlZEZuLCBub2RlSWQsIGFjY3VtLCBncmFwaCkge1xuICB2YXIgbm9kZSA9IGdyYXBoLm5vZGVzW25vZGVJZF1cblxuICByZWRGbihhY2N1bSwgbm9kZSlcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgbm9kZVJlZHVjZShyZWRGbiwgbm9kZS5jaGlsZElkc1tpXSwgYWNjdW0sIGdyYXBoKSAgIFxuICB9XG4gIHJldHVybiBhY2N1bVxufVxuXG4vL0dyYXBoIC0+IFN0cmluZyAtPiBOb2RlIC0+IFZvaWRcbnZhciBhdHRhY2hCeUlkID0gY3VycnkoZnVuY3Rpb24gKGdyYXBoLCBwYXJlbnRJZCwgbm9kZSkge1xuICBpZiAoIWdyYXBoLm5vZGVzW3BhcmVudElkXSkgdGhyb3cgbmV3IEVycm9yKHBhcmVudElkICsgXCIgbm90IGZvdW5kIGluIGdyYXBoXCIpXG4gIHZhciBub2RlID0gbm9kZSBpbnN0YW5jZW9mIE5vZGUgPyBub2RlIDogTm9kZShub2RlKVxuXG4gIGdyYXBoLm5vZGVzW25vZGUuaWRdICAgICAgICAgID0gbm9kZVxuICBncmFwaC5ub2Rlc1tub2RlLmlkXS5wYXJlbnRJZCA9IHBhcmVudElkXG4gIGdyYXBoLm5vZGVzW3BhcmVudElkXS5jaGlsZElkcy5wdXNoKG5vZGUuaWQpXG59KVxuXG52YXIgYXR0YWNoVG9Ob2RlID0gY3VycnkoZnVuY3Rpb24gKGdyYXBoLCBwYXJlbnROb2RlLCBub2RlKSB7XG4gIGF0dGFjaEJ5SWQoZ3JhcGgsIHBhcmVudE5vZGUuaWQsIG5vZGUpXG59KVxuXG52YXIgYXR0YWNoVG9Sb290ID0gY3VycnkoZnVuY3Rpb24gKGdyYXBoLCBub2RlKSB7XG4gIGF0dGFjaEJ5SWQoZ3JhcGgsIGdyYXBoLnJvb3ROb2RlSWQsIG5vZGUpXG59KVxuXG52YXIgYXR0YWNoTWFueVRvTm9kZSA9IGN1cnJ5KGZ1bmN0aW9uIChncmFwaCwgcGFyZW50Tm9kZSwgbm9kZXMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSkge1xuICAgIGF0dGFjaEJ5SWQoZ3JhcGgsIHBhcmVudE5vZGUuaWQsIG5vZGVzW2ldKSBcbiAgfVxufSlcblxudmFyIGF0dGFjaE1hbnlUb1Jvb3QgPSBjdXJyeShmdW5jdGlvbiAoZ3JhcGgsIG5vZGVzKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kpIHtcbiAgICBhdHRhY2hCeUlkKGdyYXBoLCBncmFwaC5yb290Tm9kZUlkLCBub2Rlc1tpXSlcbiAgfVxufSlcblxuR3JhcGgucHJvdG90eXBlLl9fcmVkdWNlID0gZnVuY3Rpb24gKHJlZEZuLCBhY2N1bSwgZ3JhcGgpIHtcbiAgcmV0dXJuIG5vZGVSZWR1Y2UocmVkRm4sIGdyYXBoLnJvb3ROb2RlSWQsIGFjY3VtLCBncmFwaClcbn1cblxuR3JhcGgucHJvdG90eXBlLl9fZW1wdHkgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgR3JhcGggfVxuXG5ncmFwaC5Ob2RlICAgICAgICAgICAgID0gTm9kZVxuZ3JhcGguR3JhcGggICAgICAgICAgICA9IEdyYXBoXG5ncmFwaC5hdHRhY2hCeUlkICAgICAgID0gYXR0YWNoQnlJZFxuZ3JhcGguYXR0YWNoVG9Ob2RlICAgICA9IGF0dGFjaFRvTm9kZVxuZ3JhcGguYXR0YWNoVG9Sb290ICAgICA9IGF0dGFjaFRvUm9vdFxuZ3JhcGguYXR0YWNoTWFueVRvTm9kZSA9IGF0dGFjaE1hbnlUb05vZGVcbmdyYXBoLmF0dGFjaE1hbnlUb1Jvb3QgPSBhdHRhY2hNYW55VG9Sb290XG5tb2R1bGUuZXhwb3J0cyAgICAgICAgID0gZ3JhcGhcbiIsInZhciBmbnMgICAgICA9IHJlcXVpcmUoXCJwcm9kYXNoXCIpXG52YXIgY3VycnkgICAgPSBmbnMuZnVuY3Rpb25zLmN1cnJ5XG52YXIgbGlmZXRpbWUgPSB7fVxuXG5saWZldGltZS5raWxsVGhlT2xkID0gZnVuY3Rpb24gKHdvcmxkLCBlKSB7XG4gIHZhciB0aW1lID0gd29ybGQuY2xvY2submV3VGltZVxuXG4gIGlmICghZS5saWZlc3BhbikgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgaWYgKGUubGl2aW5nICYmIHRpbWUgPj0gZS50aW1lVG9EaWUpIGUubGl2aW5nID0gZmFsc2Vcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsaWZldGltZVxuIiwidmFyIHV1aWQgID0gcmVxdWlyZShcIm5vZGUtdXVpZFwiKVxudmFyIHZlYzMgID0gcmVxdWlyZSgnLi92ZWMzJylcbnZhciBWZWMzICA9IHZlYzMuVmVjM1xudmFyIGxpZ2h0ID0ge31cblxudmFyIFBvaW50TGlnaHQgPSBmdW5jdGlvbiAoeCwgeSwgeikge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUG9pbnRMaWdodCkpIHJldHVybiBuZXcgUG9pbnRMaWdodCh4LCB5LCB6KVxuXG4gIHRoaXMuaWQgICAgICAgICAgICA9IHV1aWQudjQoKVxuICB0aGlzLmxpZ2h0ICAgICAgICAgPSB0cnVlXG4gIHRoaXMucG9zaXRpb24gICAgICA9IFZlYzMoeCwgeSwgeilcbiAgdGhpcy52ZWxvY2l0eSAgICAgID0gVmVjMygwLCAwLCAwKVxuICB0aGlzLmFjY2VsZXJhdGlvbiAgPSBWZWMzKDAsIDAsIDApXG4gIHRoaXMucm90YXRpb24gICAgICA9IFZlYzMoMCwgMCwgMClcbiAgdGhpcy5yZ2IgICAgICAgICAgID0gVmVjMygxLCAxLCAxKVxuICB0aGlzLmludGVuc2l0eSAgICAgPSAxLjBcbiAgdGhpcy5saXZpbmcgICAgICAgID0gdHJ1ZVxufVxuXG5saWdodC5Qb2ludExpZ2h0ID0gUG9pbnRMaWdodFxubW9kdWxlLmV4cG9ydHMgPSBsaWdodFxuIiwidmFyIGxvYWRlcnMgID0ge31cblxubG9hZGVycy5sb2FkU2hhZGVyID0gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3RcblxuICB4aHIucmVzcG9uc2VUeXBlID0gXCJzdHJpbmdcIlxuICB4aHIub25sb2FkICAgICAgID0gZnVuY3Rpb24gKCkgeyBjYihudWxsLCB4aHIucmVzcG9uc2UpIH1cbiAgeGhyLm9uZXJyb3IgICAgICA9IGZ1bmN0aW9uICgpIHsgY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSkgfVxuICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICB4aHIuc2VuZChudWxsKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWRlcnNcbiIsInZhciBmbnMgICAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciBjdXJyeSAgID0gZm5zLmZ1bmN0aW9ucy5jdXJyeVxudmFyIHBoeXNpY3MgPSB7fVxuXG52YXIgaGFzUGh5c2ljcyA9IGZ1bmN0aW9uIChub2RlKSB7IFxuICByZXR1cm4gISFub2RlLnBvc2l0aW9uICYmICEhbm9kZS52ZWxvY2l0eSAmJiAhIW5vZGUuYWNjZWxlcmF0aW9uIFxufVxucGh5c2ljcy51cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uIChkVCwgZSkge1xuICBlLnBvc2l0aW9uWzBdID0gZS5wb3NpdGlvblswXSArIGRUICogZS52ZWxvY2l0eVswXVxuICBlLnBvc2l0aW9uWzFdID0gZS5wb3NpdGlvblsxXSArIGRUICogZS52ZWxvY2l0eVsxXVxuICBlLnBvc2l0aW9uWzJdID0gZS5wb3NpdGlvblsyXSArIGRUICogZS52ZWxvY2l0eVsyXVxuICByZXR1cm4gZVxufVxuXG5waHlzaWNzLnVwZGF0ZVZlbG9jaXR5ID0gZnVuY3Rpb24gKGRULCBlKSB7XG4gIGUudmVsb2NpdHlbMF0gPSBlLnZlbG9jaXR5WzBdICsgZFQgKiBlLmFjY2VsZXJhdGlvblswXVxuICBlLnZlbG9jaXR5WzFdID0gZS52ZWxvY2l0eVsxXSArIGRUICogZS5hY2NlbGVyYXRpb25bMV1cbiAgZS52ZWxvY2l0eVsyXSA9IGUudmVsb2NpdHlbMl0gKyBkVCAqIGUuYWNjZWxlcmF0aW9uWzJdXG4gIHJldHVybiBlXG59XG5cbnBoeXNpY3MudXBkYXRlUGh5c2ljcyA9IGZ1bmN0aW9uICh3b3JsZCwgZSkge1xuICBpZiAoIWhhc1BoeXNpY3MoZSkpIHJldHVyblxuICBpZiAoIWUubGl2aW5nKSAgICAgIHJldHVyblxuICBwaHlzaWNzLnVwZGF0ZVZlbG9jaXR5KHdvcmxkLmNsb2NrLmRULCBlKVxuICBwaHlzaWNzLnVwZGF0ZVBvc2l0aW9uKHdvcmxkLmNsb2NrLmRULCBlKVxuICByZXR1cm4gZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBoeXNpY3NcbiIsInZhciByYW5kb20gPSB7fVxuXG5yYW5kb20ucmFuZEJvdW5kID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByYW5kb21cbiIsInZhciB2ZWMzID0ge31cblxudmFyIFZlYzMgPSBmdW5jdGlvbiAoeCwgeSwgeikge1xuICB2YXIgb3V0ID0gbmV3IEZsb2F0MzJBcnJheSgzKVxuXG4gIG91dFswXSA9IHhcbiAgb3V0WzFdID0geVxuICBvdXRbMl0gPSB6XG4gIHJldHVybiBvdXRcbn1cblxudmFyIHNldFZlYzMgPSBmdW5jdGlvbiAoeCwgeSwgeiwgdmVjKSB7XG4gIHZlY1swXSA9IHhcbiAgdmVjWzFdID0geVxuICB2ZWNbMl0gPSB6XG4gIHJldHVybiB2ZWNcbn1cblxudmFyIGNsb25lVmVjMyA9IGZ1bmN0aW9uICh2ZWMpIHtcbiAgcmV0dXJuIFZlYzModmVjWzBdLCB2ZWNbMV0sIHZlY1syXSlcbn1cblxudmVjMy5WZWMzICAgICAgPSBWZWMzXG52ZWMzLnNldFZlYzMgICA9IHNldFZlYzNcbnZlYzMuY2xvbmVWZWMzID0gY2xvbmVWZWMzXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzNcbiJdfQ==
