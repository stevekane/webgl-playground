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
var renderParticles  = require("../modules/render-particles")
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

//(Scene -> Node) -> String -> Scene -> Void
var forEachNode = function (fn, nodeId, scene) {
  var node = scene.graph.nodes[nodeId]

  fn(scene, node)
  for (var i = 0; i < node.childIds.length; ++i) {
    forEachNode(fn, node.childIds[i], scene)
  }
}

//(Scene -> Node) -> Scene -> Void
var updateEntities = function (fn, scene) {
  forEachNode(fn, scene.graph.rootNodeId, scene)
}

//TODO: Should alter the updateEntities calls to be run system calls
//that leverage the defined systems in our scene and also the groups
//associated w/ them
function makeUpdate (scene) {
  return function update () {
    updateClock(scene.clock, performance.now())
    updateCamera(scene, scene.camera)
    updateEntities(killTheOld, scene)
    updateEntities(updatePhysics, scene)
    updateEntities(updateEmitter, scene)
  }
}

function buildLightData (lights) {
  var lightData = {
    positions:   new Float32Array(lights.length * 3),
    colors:      new Float32Array(lights.length * 3),
    intensities: new Float32Array(lights.length)
  }
  
  for (var i = 0; i < lights.length; ++i) {
    lightData.positions.set(lights[i].position, i*3)
    lightData.colors.set(lights[i].rgb, i*3)
    lightData.intensities[i] = lights[i].intensity
  }
  return lightData
}

function makeRender (gl, scene) {
  return function render () {
    var lightData = buildLightData(scene)

    clearContext(gl)
    renderParticles(scene)
    requestAnimationFrame(render) 
  }
}

async.parallel({
  vertex:   partial(loadShader, "/shaders/01v.glsl"),
  fragment: partial(loadShader, "/shaders/01f.glsl")
}, function (err, shaders) {
  var gl              = canvas.getContext("webgl")
  var particleProgram = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var aspect          = gl.canvas.clientWidth / gl.canvas.clientHeight
  var fov             = Math.PI / 2
  var scene           = {
    gl:       gl,
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
    },
    lightData: []
  }
  var l1   = PointLight(0, 0, 0)
  var l2   = PointLight(0, .25, 0)
  var l3   = PointLight(0, .5, 0)
  var e1   = Emitter(1000, 10, .002, .1, 0, 0, 0, 0, 1, randBound(-0.2, 0.2))  
  var e1ps = ParticleGroup(50, 1000)

  setVec3(1.0, 0.0, 0.0, l1.rgb)
  setVec3(0.0, 1.0, 0.0, l2.rgb)
  setVec3(0.0, 0.0, 1.0, l3.rgb)
  attachToRoot(scene.graph, l1)
  attachToRoot(scene.graph, l2)
  attachToRoot(scene.graph, l3)
  attachToRoot(scene.graph, e1)
  attachManyToNode(scene.graph, e1, e1ps)
  into(scene.groups.lights, isLight, scene.graph)
  into(scene.groups.emitters, isEmitter, scene.graph)
  into(scene.groups.particles, isParticle, scene.graph)
  into(scene.groups.lifespans, hasLifespan, scene.graph)
  into(scene.groups.physics, hasPhysics, scene.graph)
  scene.lightData = buildLightData(scene.groups.lights)

  window.scene = scene

  setInterval(makeUpdate(scene), 25)
  requestAnimationFrame(makeRender(gl, scene))
})

},{"../modules/camera":7,"../modules/clock":8,"../modules/emitters":9,"../modules/gl-utils":10,"../modules/graph":11,"../modules/lifetime":12,"../modules/light":13,"../modules/loaders":14,"../modules/physics":15,"../modules/random":16,"../modules/render-particles":17,"../modules/vec3":18,"async":"async","prodash":1}],7:[function(require,module,exports){
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

},{"./vec3":18,"gl-mat4":"gl-mat4"}],8:[function(require,module,exports){
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

},{"./random":16,"./vec3":18,"node-uuid":"node-uuid","prodash":1}],10:[function(require,module,exports){
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

},{"./vec3":18,"node-uuid":"node-uuid"}],14:[function(require,module,exports){
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
var utils        = require("./gl-utils")
var updateBuffer = utils.updateBuffer

//here we allocate once and iterate twice
function buildPositions (particles) {
  var livingCount = 0
  var out        

  for (var i = 0; i < particles.length; ++i) {
    if (!!particles[i].living) livingCount++  
  }

  out = new Float32Array(livingCount * 3)

  for (var j = 0, index = 0; j < particles.length; ++j) {
    if (!!particles[j].living) {
      out.set(particles[j].position, index)
      index += 3
    }
  }
  return out
}

function renderParticles (scene) {
  var gl        = scene.gl
  var view      = scene.gl.canvas
  var lp        = scene.programs.particle
  var particles = scene.groups.particles
  var lightData = scene.lightData
  var positions = buildPositions(particles)

  gl.useProgram(lp.program)
  gl.uniform3fv(lp.uniforms["uLightPositions[0]"], lightData.positions)
  gl.uniform3fv(lp.uniforms["uLightColors[0]"], lightData.colors)
  gl.uniform1fv(lp.uniforms["uLightIntensities[0]"], lightData.intensities)
  gl.uniform4f(lp.uniforms.uColor, 0.0, 0.0, 0.0, 1.0)
  gl.uniform2f(lp.uniforms.uScreenSize, view.clientWidth, view.clientHeight)
  gl.uniformMatrix4fv(lp.uniforms.uView, false, scene.camera.view)
  gl.uniformMatrix4fv(lp.uniforms.uProjection, false, scene.camera.projection)
  gl.uniform1f(lp.uniforms.uSize, 1.0)
  updateBuffer(gl, 3, lp.attributes.aPosition, lp.buffers.aPosition, positions)
  gl.drawArrays(gl.POINTS, 0, positions.length / 3)
}

module.exports = renderParticles

},{"./gl-utils":10}],18:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvcHJvZGFzaC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvc3JjL2FycmF5LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvZnVuY3Rpb25zLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvb2JqZWN0LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvdHJhbnNkdWNlcnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9leGFtcGxlcy8wMS1CYXNpYy1TZXR1cC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvY2FtZXJhLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9jbG9jay5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvZW1pdHRlcnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2dsLXV0aWxzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9ncmFwaC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbGlmZXRpbWUuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2xpZ2h0LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9sb2FkZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9waHlzaWNzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9yYW5kb20uanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3JlbmRlci1wYXJ0aWNsZXMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3ZlYzMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwcm9kYXNoID0ge1xuICBmdW5jdGlvbnM6ICAgcmVxdWlyZShcIi4vc3JjL2Z1bmN0aW9uc1wiKSxcbiAgdHJhbnNkdWNlcnM6IHJlcXVpcmUoXCIuL3NyYy90cmFuc2R1Y2Vyc1wiKSxcbiAgYXJyYXk6ICAgICAgIHJlcXVpcmUoXCIuL3NyYy9hcnJheVwiKSxcbiAgb2JqZWN0OiAgICAgIHJlcXVpcmUoXCIuL3NyYy9vYmplY3RcIilcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwcm9kYXNoXG4iLCJ2YXIgZm5zICAgICAgICAgPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcbnZhciBjdXJyeSAgICAgICA9IGZucy5jdXJyeVxudmFyIGRlbWV0aG9kaXplID0gZm5zLmRlbWV0aG9kaXplXG52YXIgYXJyYXkgICAgICAgPSB7fVxuXG52YXIgZmluZCA9IGN1cnJ5KGZ1bmN0aW9uIChwcmVkRm4sIGFyKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAocHJlZEZuKGFyW2ldKSkgcmV0dXJuIGFyW2ldIFxuICB9XG4gIHJldHVybiBudWxsXG59KVxuXG52YXIgZm9yRWFjaCA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBhcikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyLmxlbmd0aDsgKytpKSB7XG4gICAgYXJbaV0gPSB0cmFuc0ZuKGFyW2ldKSBcbiAgfVxufSlcblxudmFyIHJldmVyc2UgPSBmdW5jdGlvbiAobGlzdCkge1xuICB2YXIgYmFja3dhcmRzID0gW11cblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGlzdC5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGJhY2t3YXJkc1tpXSA9IGxpc3RbbGVuLTEtaV1cbiAgfVxuICByZXR1cm4gYmFja3dhcmRzXG59XG5cbnZhciBjb25jYXQgPSBkZW1ldGhvZGl6ZShBcnJheS5wcm90b3R5cGUsIFwiY29uY2F0XCIpXG5cbnZhciBmbGF0dGVuID0gZnVuY3Rpb24gKGFycmF5T2ZBcnJheXMpIHtcbiAgdmFyIGZsYXR0ZW5lZCA9IFtdXG4gIHZhciBzdWJhcnJheVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlPZkFycmF5cy5sZW5ndGg7ICsraSkge1xuICAgIHN1YmFycmF5ID0gYXJyYXlPZkFycmF5c1tpXVxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3ViYXJyYXkubGVuZ3RoOyArK2opIHtcbiAgICAgIGZsYXR0ZW5lZC5wdXNoKHN1YmFycmF5W2pdKSBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZsYXR0ZW5lZFxufVxuXG52YXIgcHVzaCA9IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgYXJyYXkucHVzaChlbClcbiAgcmV0dXJuIGFycmF5XG59XG5cbnZhciB1bnNoaWZ0ID0gZnVuY3Rpb24gKGFycmF5LCBlbCkge1xuICBhcnJheS51bnNoaWZ0KGVsKVxuICByZXR1cm4gYXJyYXlcbn1cblxudmFyIHNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIGFycmF5KSB7XG4gIHJldHVybiBhcnJheS5zbGljZShzdGFydCwgZW5kKVxufVxuXG52YXIgcmVtb3ZlID0gZnVuY3Rpb24gKGZuLCBhcnJheSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKGZuKGFycmF5W2ldKSkge1xuICAgICAgYXJyYXkuc3BsaWNlKGksIDEpXG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheVxufVxuXG52YXIgcmFuZ2UgPSBmdW5jdGlvbiAobWluLCBtYXgpIHtcbiAgdmFyIGFyID0gW11cblxuICBmb3IgKHZhciBpID0gbWluOyBpIDw9IG1heDsgKytpKSB7XG4gICAgYXIucHVzaChpKSBcbiAgfVxuICByZXR1cm4gYXJcbn1cblxuYXJyYXkuZmluZCAgICA9IGZpbmRcbmFycmF5LmZvckVhY2ggPSBmb3JFYWNoXG5hcnJheS5yZXZlcnNlID0gcmV2ZXJzZVxuYXJyYXkuY29uY2F0ICA9IGNvbmNhdFxuYXJyYXkuZmxhdHRlbiA9IGZsYXR0ZW5cbmFycmF5LnNsaWNlICAgPSBzbGljZVxuYXJyYXkucHVzaCAgICA9IHB1c2hcbmFycmF5LnVuc2hpZnQgPSB1bnNoaWZ0XG5hcnJheS5yZW1vdmUgID0gcmVtb3ZlXG5hcnJheS5yYW5nZSAgID0gcmFuZ2VcblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheVxuIiwidmFyIGZucyA9IHt9XG5cbnZhciBkZW1ldGhvZGl6ZSA9IGZ1bmN0aW9uIChvYmosIGZuTmFtZSkge1xuICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGwuYmluZChvYmpbZm5OYW1lXSkgXG59XG5cbnZhciBpbnN0YW5jZU9mID0gZnVuY3Rpb24gKGNvbnN0cnVjdG9yLCBjb2wpIHsgXG4gIHJldHVybiBjb2wgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvclxufVxuXG52YXIgYXBwbHkgPSBmdW5jdGlvbiAoZm4sIGFyZ3NMaXN0KSB7IFxuICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJnc0xpc3QpIFxufVxuXG52YXIgY2FsbCA9IGZ1bmN0aW9uIChmbikgeyBcbiAgdmFyIGFyZ3MgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aCAtIDE7ICsraSkge1xuICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdIFxuICB9XG4gIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKSBcbn1cblxudmFyIGNvbXBvc2UgPSBmdW5jdGlvbiAoZm5zKSB7XG4gIHJldHVybiBmdW5jdGlvbiBjb21wb3NlZCAodmFsKSB7XG4gICAgZm9yICh2YXIgaSA9IGZucy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdmFsID0gZm5zW2ldKHZhbClcbiAgICB9XG4gICAgcmV0dXJuIHZhbFxuICB9XG59XG5cbnZhciBmbGlwID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJhY2t3YXJkcyA9IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBiYWNrd2FyZHNbaV0gPSBhcmd1bWVudHNbbGVuLTEtaV1cbiAgICB9XG4gICAgcmV0dXJuIGFwcGx5KGZuLCBiYWNrd2FyZHMpXG4gIH1cbn1cblxudmFyIHBhcnRpYWwgPSBmdW5jdGlvbiAoZm4pIHtcbiAgdmFyIGFyZ3MgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aCAtIDE7ICsraSkge1xuICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdIFxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBqID0gMCwgc3RhcnRpbmdJbmRleCA9IGFyZ3MubGVuZ3RoOyBqIDwgYXJndW1lbnRzLmxlbmd0aDsgKytqKSB7XG4gICAgICBhcmdzW2ogKyBzdGFydGluZ0luZGV4XSA9IGFyZ3VtZW50c1tqXSBcbiAgICB9XG5cbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncylcbiAgfVxufVxuXG4vL3V0aWxpdHkgZnVuY3Rpb24gdXNlZCBpbiBjdXJyeSBkZWZcbnZhciBpbm5lckN1cnJ5ID0gZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHN0YXJ0aW5nSW5kZXggPSBhcmdzLmxlbmd0aDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgYXJnc1tpICsgc3RhcnRpbmdJbmRleF0gPSBhcmd1bWVudHNbaV0gXG4gICAgfVxuXG4gICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICB9O1xufTtcblxuLy9hcml0eSBhcmd1bWVudCBpcyB1c2VkIG1vc3Qgb2Z0ZW4gaW50ZXJuYWxseVxudmFyIGN1cnJ5ID0gZnVuY3Rpb24gKGZuLCBhcml0eSkge1xuICB2YXIgZm5Bcml0eSA9IGFyaXR5IHx8IGZuLmxlbmd0aFxuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1pc3NpbmdBcmdzQ291bnQgPSBmbkFyaXR5IC0gYXJndW1lbnRzLmxlbmd0aFxuICAgIHZhciBub3RFbm91Z2hBcmdzICAgID0gbWlzc2luZ0FyZ3NDb3VudCA+IDBcbiAgICB2YXIgYXJncyAgICAgICAgICAgICA9IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXSBcbiAgICB9XG5cbiAgICBpZiAobm90RW5vdWdoQXJncykgcmV0dXJuIGN1cnJ5KGlubmVyQ3VycnkoZm4sIGFyZ3MpLCBtaXNzaW5nQXJnc0NvdW50KVxuICAgIGVsc2UgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncylcbiAgfVxufVxuXG5mbnMuZGVtZXRob2RpemUgPSBkZW1ldGhvZGl6ZVxuZm5zLmluc3RhbmNlT2YgID0gaW5zdGFuY2VPZlxuZm5zLmZsaXAgICAgICAgID0gZmxpcFxuZm5zLmNvbXBvc2UgICAgID0gY29tcG9zZVxuZm5zLnBhcnRpYWwgICAgID0gcGFydGlhbFxuZm5zLmN1cnJ5ICAgICAgID0gY3VycnlcbmZucy5jYWxsICAgICAgICA9IGNhbGxcbmZucy5hcHBseSAgICAgICA9IGFwcGx5XG5tb2R1bGUuZXhwb3J0cyAgPSBmbnNcbiIsInZhciBmbnMgICAgPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcbnZhciBjdXJyeSAgPSBmbnMuY3VycnlcbnZhciBvYmplY3QgPSB7fVxuXG52YXIgZXh0ZW5kID0gY3VycnkoZnVuY3Rpb24gKGhvc3QsIG9iaikge1xuICB2YXIga3MgPSBPYmplY3Qua2V5cyhvYmopXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrcy5sZW5ndGg7ICsraSkge1xuICAgIGhvc3Rba3NbaV1dID0gb2JqW2tzW2ldXVxuICB9XG4gIHJldHVybiBob3N0XG59KVxuXG52YXIgaGFzS2V5ID0gY3VycnkoZnVuY3Rpb24gKGtleSwgZSkge1xuICByZXR1cm4gZVtrZXldICE9PSB1bmRlZmluZWRcbn0pXG5cbi8vVE9ETzogU0VlbXMgdG8gZXhoaWJpdCB2ZXJ5IHBvb3IgcGVyZm9ybWFuY2UgaW4gdGlnaHQgbG9vcD9cbnZhciBoYXNLZXlzID0gY3VycnkoZnVuY3Rpb24gKGtleXMsIGUpIHtcbiAgdmFyIHJlcyA9IHRydWVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICByZXMgPSByZXMgJiYgZVtrZXlzW2ldXSAhPT0gdW5kZWZpbmVkXG4gIH1cbiAgcmV0dXJuIHJlc1xufSlcblxub2JqZWN0Lmhhc0tleSAgPSBoYXNLZXlcbm9iamVjdC5oYXNLZXlzID0gaGFzS2V5c1xub2JqZWN0LmV4dGVuZCAgPSBleHRlbmRcblxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RcbiIsInZhciBmbnMgICAgICAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgY3VycnkgICAgICA9IGZucy5jdXJyeVxudmFyIGNvbXBvc2UgICAgPSBmbnMuY29tcG9zZVxudmFyIGluc3RhbmNlT2YgPSBmbnMuaW5zdGFuY2VPZlxudmFyIHRyYW5zICAgICAgPSB7fVxuXG52YXIgcmVkTm9vcCA9IGZ1bmN0aW9uIChhY2MsIHgpIHsgcmV0dXJuIHggfVxuXG52YXIgcmVkdWNlQXJyYXkgPSBmdW5jdGlvbiAoZm4sIGFjY3VtLCBhcnIpIHtcbiAgdmFyIGluZGV4ID0gLTFcbiAgdmFyIGxlbiAgID0gYXJyLmxlbmd0aFxuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuKSB7XG4gICAgYWNjdW0gPSBmbihhY2N1bSwgYXJyW2luZGV4XSlcbiAgfVxuICByZXR1cm4gYWNjdW1cbn1cblxudmFyIHJlZHVjZU9iamVjdCA9IGZ1bmN0aW9uIChmbiwgYWNjdW0sIG9iaikge1xuICB2YXIgaW5kZXggPSAtMVxuICB2YXIga3MgICAgPSBPYmplY3Qua2V5cyhvYmopXG4gIHZhciBsZW4gICA9IGtzLmxlbmd0aFxuICB2YXIga2V5XG4gIHZhciBrdlxuXG4gIHdoaWxlICgrK2luZGV4IDwgbGVuKSB7XG4gICAga2V5ICAgICA9IGtzW2luZGV4XVxuICAgIGt2ICAgICAgPSB7fVxuICAgIGt2W2tleV0gPSBvYmpba2V5XVxuICAgIGFjY3VtICAgPSBmbihhY2N1bSwga3YpXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59XG5cbnZhciBjb25zQXJyYXkgPSBmdW5jdGlvbiAoYXJyYXksIGVsKSB7XG4gIGFycmF5LnB1c2goZWwpXG4gIHJldHVybiBhcnJheVxufVxuXG52YXIgY29uc09iamVjdCA9IGZ1bmN0aW9uIChob3N0LCBvYmopIHtcbiAgdmFyIGtzID0gT2JqZWN0LmtleXMob2JqKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwga3MubGVuZ3RoOyArK2kpIHtcbiAgICBob3N0W2tzW2ldXSA9IG9ialtrc1tpXV1cbiAgfVxuICByZXR1cm4gaG9zdFxufVxuXG52YXIgcmVkdWNlID0gY3VycnkoZnVuY3Rpb24gKGZuLCBhY2N1bSwgY29sKSB7XG4gIGlmICAgICAgKGluc3RhbmNlT2YoQXJyYXksIGNvbCkpICAgICAgICByZXR1cm4gcmVkdWNlQXJyYXkoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoRmxvYXQzMkFycmF5LCBjb2wpKSByZXR1cm4gcmVkdWNlQXJyYXkoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoVWludDMyQXJyYXksIGNvbCkpICByZXR1cm4gcmVkdWNlQXJyYXkoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgaWYgKGNvbC5fX3JlZHVjZSAhPT0gdW5kZWZpbmVkKSAgICByZXR1cm4gY29sLl9fcmVkdWNlKGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKE9iamVjdCwgY29sKSkgICAgICAgcmV0dXJuIHJlZHVjZU9iamVjdChmbiwgYWNjdW0sIGNvbClcbiAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gY29sbGVjdGlvbiB0eXBlXCIpXG59KVxuXG52YXIgY29ucyA9IGN1cnJ5KGZ1bmN0aW9uIChjb2wsIGVsKSB7XG4gIGlmICAgICAgKGluc3RhbmNlT2YoQXJyYXksIGNvbCkpICAgcmV0dXJuIGNvbnNBcnJheShjb2wsIGVsKVxuICBlbHNlIGlmIChjb2wuX19jb25zICE9PSB1bmRlZmluZWQpIHJldHVybiBjb2wuX19jb25zKGNvbCwgZWwpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoT2JqZWN0LCBjb2wpKSAgcmV0dXJuIGNvbnNPYmplY3QoY29sLCBlbClcbiAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIGNvbGxlY3Rpb24gdHlwZVwiKVxufSlcblxudmFyIGVtcHR5ID0gZnVuY3Rpb24gKGNvbCkge1xuICBpZiAgICAgIChpbnN0YW5jZU9mKEFycmF5LCBjb2wpKSAgICAgICAgcmV0dXJuIFtdXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoRmxvYXQzMkFycmF5LCBjb2wpKSByZXR1cm4gbmV3IEZsb2F0MzJBcnJheVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKFVpbnQzMkFycmF5LCBjb2wpKSAgcmV0dXJuIG5ldyBVaW50MzJBcnJheVxuICBlbHNlIGlmIChjb2wuX19lbXB0eSAhPT0gdW5kZWZpbmVkKSAgICAgcmV0dXJuIGNvbC5fX2VtcHR5KClcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihPYmplY3QsIGNvbCkpICAgICAgIHJldHVybiB7fVxuICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBjb2xsZWN0aW9uIHR5cGVcIilcbn1cblxudmFyIG1hcHBpbmcgPSBmdW5jdGlvbiAodHJhbnNGbikge1xuICByZXR1cm4gZnVuY3Rpb24gKHN0ZXBGbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgICByZXR1cm4gc3RlcEZuKGFjYywgdHJhbnNGbih4KSlcbiAgICB9XG4gIH1cbn1cblxudmFyIHBsdWNraW5nID0gZnVuY3Rpb24gKHByb3BOYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoc3RlcEZuKSB7XG4gICAgcmV0dXJuIG1hcHBpbmcoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHhbcHJvcE5hbWVdIH0pKHN0ZXBGbilcbiAgfVxufVxuXG52YXIgZmlsdGVyaW5nID0gZnVuY3Rpb24gKHByZWRGbikge1xuICByZXR1cm4gZnVuY3Rpb24gKHN0ZXBGbikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgICByZXR1cm4gcHJlZEZuKHgpID8gc3RlcEZuKGFjYywgeCkgOiBhY2MgXG4gICAgfVxuICB9XG59XG5cbnZhciBjaGVja2luZyA9IGZ1bmN0aW9uIChwcm9wLCB2YWwpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChzdGVwRm4pIHtcbiAgICByZXR1cm4gZmlsdGVyaW5nKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4W3Byb3BdID09PSB2YWwgfSkoc3RlcEZuKVxuICB9XG59XG5cbi8vVEhJUyBXSUxMIE1VVEFURSBUSEUgU1RSVUNUVVJFIFBST1ZJREVEIFRPIElUIERJUkVDVExZXG52YXIgbXV0YXRpbmcgPSBmdW5jdGlvbiAobXV0Rm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChzdGVwRm4pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgICAgbXV0Rm4oeClcbiAgICAgIHJldHVybiBzdGVwRm4oYWNjLCB4KVxuICAgIH1cbiAgfVxufVxuXG52YXIgY2F0ID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgcmV0dXJuIHJlZHVjZShmbiwgYWNjLCB4KSBcbiAgfVxufVxuXG52YXIgbWFwID0gY3VycnkoZnVuY3Rpb24gKGZuLCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZShtYXBwaW5nKGZuKShjb25zKSwgZW1wdHkoY29sKSwgY29sKVxufSlcblxudmFyIG1hcGNhdHRpbmcgPSBmdW5jdGlvbiAodHJhbnNGbikge1xuICByZXR1cm4gZnVuY3Rpb24gKHN0ZXBGbikge1xuICAgIHJldHVybiBjb21wb3NlKFtjYXQsIG1hcHBpbmcodHJhbnNGbildKShzdGVwRm4pXG4gIH1cbn1cblxudmFyIGZpbHRlciA9IGN1cnJ5KGZ1bmN0aW9uIChwcmVkRm4sIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKGZpbHRlcmluZyhwcmVkRm4pKGNvbnMpLCBlbXB0eShjb2wpLCBjb2wpXG59KVxuXG52YXIgbXV0YXRlID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKHRyYW5zRm4ocmVkTm9vcCksIHVuZGVmaW5lZCwgY29sKVxufSlcblxudmFyIHRyYW5zZHVjZSA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBzdGVwRm4sIGluaXQsIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKHRyYW5zRm4oc3RlcEZuKSwgaW5pdCwgY29sKVxufSlcblxudmFyIHNlcXVlbmNlID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKHRyYW5zRm4oY29ucyksIGVtcHR5KGNvbCksIGNvbClcbn0pXG5cbnZhciBpbnRvID0gY3VycnkoZnVuY3Rpb24gKHRvLCB0cmFuc0ZuLCBmcm9tKSB7XG4gIHJldHVybiB0cmFuc2R1Y2UodHJhbnNGbiwgY29ucywgdG8sIGZyb20pXG59KVxuXG50cmFucy5yZWR1Y2UgICAgID0gcmVkdWNlXG50cmFucy5jb25zICAgICAgID0gY29uc1xudHJhbnMuZW1wdHkgICAgICA9IGVtcHR5XG50cmFucy5tYXBwaW5nICAgID0gbWFwcGluZ1xudHJhbnMucGx1Y2tpbmcgICA9IHBsdWNraW5nXG50cmFucy5jYXQgICAgICAgID0gY2F0XG50cmFucy5maWx0ZXJpbmcgID0gZmlsdGVyaW5nXG50cmFucy5jaGVja2luZyAgID0gY2hlY2tpbmdcbnRyYW5zLm1hcCAgICAgICAgPSBtYXBcbnRyYW5zLm1hcGNhdHRpbmcgPSBtYXBjYXR0aW5nXG50cmFucy5tdXRhdGluZyAgID0gbXV0YXRpbmdcbnRyYW5zLm11dGF0ZSAgICAgPSBtdXRhdGVcbnRyYW5zLmZpbHRlciAgICAgPSBmaWx0ZXJcbnRyYW5zLnRyYW5zZHVjZSAgPSB0cmFuc2R1Y2VcbnRyYW5zLnNlcXVlbmNlICAgPSBzZXF1ZW5jZVxudHJhbnMuaW50byAgICAgICA9IGludG9cbm1vZHVsZS5leHBvcnRzICAgPSB0cmFuc1xuIiwidmFyIHByb2Rhc2ggICAgICAgICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIGFzeW5jICAgICAgICAgICAgPSByZXF1aXJlKFwiYXN5bmNcIilcbnZhciBncmFwaCAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvZ3JhcGhcIilcbnZhciBsb2FkZXJzICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbG9hZGVyc1wiKVxudmFyIHV0aWxzICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9nbC11dGlsc1wiKVxudmFyIHJhbmRvbSAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9yYW5kb21cIilcbnZhciBwaHlzaWNzICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvcGh5c2ljc1wiKVxudmFyIGxpZmV0aW1lICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9saWZldGltZVwiKVxudmFyIGVtaXR0ZXJzICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9lbWl0dGVyc1wiKVxudmFyIGNsb2NrICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9jbG9ja1wiKVxudmFyIGNhbWVyYSAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9jYW1lcmFcIilcbnZhciBsaWdodCAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbGlnaHRcIilcbnZhciB2ZWMzICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvdmVjM1wiKVxudmFyIHJlbmRlclBhcnRpY2xlcyAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9yZW5kZXItcGFydGljbGVzXCIpXG52YXIgR3JhcGggICAgICAgICAgICA9IGdyYXBoLkdyYXBoXG52YXIgYXR0YWNoVG9Sb290ICAgICA9IGdyYXBoLmF0dGFjaFRvUm9vdFxudmFyIGF0dGFjaFRvTm9kZSAgICAgPSBncmFwaC5hdHRhY2hUb05vZGVcbnZhciBhdHRhY2hNYW55VG9Ob2RlID0gZ3JhcGguYXR0YWNoTWFueVRvTm9kZVxudmFyIGNvbXBvc2UgICAgICAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5jb21wb3NlXG52YXIgcGFydGlhbCAgICAgICAgICA9IHByb2Rhc2guZnVuY3Rpb25zLnBhcnRpYWxcbnZhciBpbnRvICAgICAgICAgICAgID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5pbnRvXG52YXIgdHJhbnNkdWNlICAgICAgICA9IHByb2Rhc2gudHJhbnNkdWNlcnMudHJhbnNkdWNlXG52YXIgY29ucyAgICAgICAgICAgICA9IHByb2Rhc2gudHJhbnNkdWNlcnMuY29uc1xudmFyIHNlcXVlbmNlICAgICAgICAgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLnNlcXVlbmNlXG52YXIgZmlsdGVyaW5nICAgICAgICA9IHByb2Rhc2gudHJhbnNkdWNlcnMuZmlsdGVyaW5nXG52YXIgY2hlY2tpbmcgICAgICAgICA9IHByb2Rhc2gudHJhbnNkdWNlcnMuY2hlY2tpbmdcbnZhciBwbHVja2luZyAgICAgICAgID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5wbHVja2luZ1xudmFyIGNhdCAgICAgICAgICAgICAgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLmNhdFxudmFyIFBhcnRpY2xlR3JvdXAgICAgPSBlbWl0dGVycy5QYXJ0aWNsZUdyb3VwXG52YXIgRW1pdHRlciAgICAgICAgICA9IGVtaXR0ZXJzLkVtaXR0ZXJcbnZhciB1cGRhdGVFbWl0dGVyICAgID0gZW1pdHRlcnMudXBkYXRlRW1pdHRlclxudmFyIGxvYWRTaGFkZXIgICAgICAgPSBsb2FkZXJzLmxvYWRTaGFkZXJcbnZhciBjbGVhckNvbnRleHQgICAgID0gdXRpbHMuY2xlYXJDb250ZXh0XG52YXIgTG9hZGVkUHJvZ3JhbSAgICA9IHV0aWxzLkxvYWRlZFByb2dyYW1cbnZhciByYW5kQm91bmQgICAgICAgID0gcmFuZG9tLnJhbmRCb3VuZFxudmFyIHVwZGF0ZVBoeXNpY3MgICAgPSBwaHlzaWNzLnVwZGF0ZVBoeXNpY3NcbnZhciBraWxsVGhlT2xkICAgICAgID0gbGlmZXRpbWUua2lsbFRoZU9sZFxudmFyIENsb2NrICAgICAgICAgICAgPSBjbG9jay5DbG9ja1xudmFyIHVwZGF0ZUNsb2NrICAgICAgPSBjbG9jay51cGRhdGVDbG9ja1xudmFyIENhbWVyYSAgICAgICAgICAgPSBjYW1lcmEuQ2FtZXJhXG52YXIgdXBkYXRlQ2FtZXJhICAgICA9IGNhbWVyYS51cGRhdGVDYW1lcmFcbnZhciBQb2ludExpZ2h0ICAgICAgID0gbGlnaHQuUG9pbnRMaWdodFxudmFyIHNldFZlYzMgICAgICAgICAgPSB2ZWMzLnNldFZlYzNcbnZhciBjYW52YXMgICAgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwbGF5Z3JvdW5kXCIpXG5cbnZhciBpc0VtaXR0ZXIgICA9IGNoZWNraW5nKFwiZW1pdHRlclwiLCB0cnVlKVxudmFyIGlzUGFydGljbGUgID0gY2hlY2tpbmcoXCJwYXJ0aWNsZVwiLCB0cnVlKVxudmFyIGlzTGlnaHQgICAgID0gY2hlY2tpbmcoXCJsaWdodFwiLCB0cnVlKVxudmFyIGlzTGl2aW5nICAgID0gY2hlY2tpbmcoXCJsaXZpbmdcIiwgdHJ1ZSlcbnZhciBoYXNMaWZlc3BhbiA9IGZpbHRlcmluZyhmdW5jdGlvbiAoZSkgeyBcbiAgcmV0dXJuIGUubGlmZXNwYW4gIT09IHVuZGVmaW5lZFxufSlcbnZhciBoYXNQaHlzaWNzICA9IGZpbHRlcmluZyhmdW5jdGlvbiAoZSkge1xuICByZXR1cm4gISFlLnBvc2l0aW9uICYmICEhZS52ZWxvY2l0eSAmJiAhIWUuYWNjZWxlcmF0aW9uXG59KVxudmFyIGdldExpdmluZ1BhcnRpY2xlcyA9IGNvbXBvc2UoW2lzTGl2aW5nLCBpc1BhcnRpY2xlXSlcbnZhciBnZXRMaXZpbmdMaWdodHMgICAgPSBjb21wb3NlKFtpc0xpdmluZywgaXNMaWdodF0pXG52YXIgZmxhdHRlblBvc2l0aW9ucyAgID0gc2VxdWVuY2UoY29tcG9zZShbaXNMaXZpbmcsIHBsdWNraW5nKFwicG9zaXRpb25cIiksIGNhdF0pKVxudmFyIGZsYXR0ZW5TaXplcyAgICAgICA9IHNlcXVlbmNlKGNvbXBvc2UoW2lzTGl2aW5nLCBwbHVja2luZyhcInNpemVcIiksIGNhdF0pKVxuXG4vLyhTY2VuZSAtPiBOb2RlKSAtPiBTdHJpbmcgLT4gU2NlbmUgLT4gVm9pZFxudmFyIGZvckVhY2hOb2RlID0gZnVuY3Rpb24gKGZuLCBub2RlSWQsIHNjZW5lKSB7XG4gIHZhciBub2RlID0gc2NlbmUuZ3JhcGgubm9kZXNbbm9kZUlkXVxuXG4gIGZuKHNjZW5lLCBub2RlKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGUuY2hpbGRJZHMubGVuZ3RoOyArK2kpIHtcbiAgICBmb3JFYWNoTm9kZShmbiwgbm9kZS5jaGlsZElkc1tpXSwgc2NlbmUpXG4gIH1cbn1cblxuLy8oU2NlbmUgLT4gTm9kZSkgLT4gU2NlbmUgLT4gVm9pZFxudmFyIHVwZGF0ZUVudGl0aWVzID0gZnVuY3Rpb24gKGZuLCBzY2VuZSkge1xuICBmb3JFYWNoTm9kZShmbiwgc2NlbmUuZ3JhcGgucm9vdE5vZGVJZCwgc2NlbmUpXG59XG5cbi8vVE9ETzogU2hvdWxkIGFsdGVyIHRoZSB1cGRhdGVFbnRpdGllcyBjYWxscyB0byBiZSBydW4gc3lzdGVtIGNhbGxzXG4vL3RoYXQgbGV2ZXJhZ2UgdGhlIGRlZmluZWQgc3lzdGVtcyBpbiBvdXIgc2NlbmUgYW5kIGFsc28gdGhlIGdyb3Vwc1xuLy9hc3NvY2lhdGVkIHcvIHRoZW1cbmZ1bmN0aW9uIG1ha2VVcGRhdGUgKHNjZW5lKSB7XG4gIHJldHVybiBmdW5jdGlvbiB1cGRhdGUgKCkge1xuICAgIHVwZGF0ZUNsb2NrKHNjZW5lLmNsb2NrLCBwZXJmb3JtYW5jZS5ub3coKSlcbiAgICB1cGRhdGVDYW1lcmEoc2NlbmUsIHNjZW5lLmNhbWVyYSlcbiAgICB1cGRhdGVFbnRpdGllcyhraWxsVGhlT2xkLCBzY2VuZSlcbiAgICB1cGRhdGVFbnRpdGllcyh1cGRhdGVQaHlzaWNzLCBzY2VuZSlcbiAgICB1cGRhdGVFbnRpdGllcyh1cGRhdGVFbWl0dGVyLCBzY2VuZSlcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZExpZ2h0RGF0YSAobGlnaHRzKSB7XG4gIHZhciBsaWdodERhdGEgPSB7XG4gICAgcG9zaXRpb25zOiAgIG5ldyBGbG9hdDMyQXJyYXkobGlnaHRzLmxlbmd0aCAqIDMpLFxuICAgIGNvbG9yczogICAgICBuZXcgRmxvYXQzMkFycmF5KGxpZ2h0cy5sZW5ndGggKiAzKSxcbiAgICBpbnRlbnNpdGllczogbmV3IEZsb2F0MzJBcnJheShsaWdodHMubGVuZ3RoKVxuICB9XG4gIFxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxpZ2h0cy5sZW5ndGg7ICsraSkge1xuICAgIGxpZ2h0RGF0YS5wb3NpdGlvbnMuc2V0KGxpZ2h0c1tpXS5wb3NpdGlvbiwgaSozKVxuICAgIGxpZ2h0RGF0YS5jb2xvcnMuc2V0KGxpZ2h0c1tpXS5yZ2IsIGkqMylcbiAgICBsaWdodERhdGEuaW50ZW5zaXRpZXNbaV0gPSBsaWdodHNbaV0uaW50ZW5zaXR5XG4gIH1cbiAgcmV0dXJuIGxpZ2h0RGF0YVxufVxuXG5mdW5jdGlvbiBtYWtlUmVuZGVyIChnbCwgc2NlbmUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHJlbmRlciAoKSB7XG4gICAgdmFyIGxpZ2h0RGF0YSA9IGJ1aWxkTGlnaHREYXRhKHNjZW5lKVxuXG4gICAgY2xlYXJDb250ZXh0KGdsKVxuICAgIHJlbmRlclBhcnRpY2xlcyhzY2VuZSlcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKSBcbiAgfVxufVxuXG5hc3luYy5wYXJhbGxlbCh7XG4gIHZlcnRleDogICBwYXJ0aWFsKGxvYWRTaGFkZXIsIFwiL3NoYWRlcnMvMDF2Lmdsc2xcIiksXG4gIGZyYWdtZW50OiBwYXJ0aWFsKGxvYWRTaGFkZXIsIFwiL3NoYWRlcnMvMDFmLmdsc2xcIilcbn0sIGZ1bmN0aW9uIChlcnIsIHNoYWRlcnMpIHtcbiAgdmFyIGdsICAgICAgICAgICAgICA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIilcbiAgdmFyIHBhcnRpY2xlUHJvZ3JhbSA9IExvYWRlZFByb2dyYW0oZ2wsIHNoYWRlcnMudmVydGV4LCBzaGFkZXJzLmZyYWdtZW50KVxuICB2YXIgYXNwZWN0ICAgICAgICAgID0gZ2wuY2FudmFzLmNsaWVudFdpZHRoIC8gZ2wuY2FudmFzLmNsaWVudEhlaWdodFxuICB2YXIgZm92ICAgICAgICAgICAgID0gTWF0aC5QSSAvIDJcbiAgdmFyIHNjZW5lICAgICAgICAgICA9IHtcbiAgICBnbDogICAgICAgZ2wsXG4gICAgY2xvY2s6ICAgIENsb2NrKHBlcmZvcm1hbmNlLm5vdygpKSxcbiAgICBjYW1lcmE6ICAgQ2FtZXJhKDAsIDAsIDIsIGZvdiwgYXNwZWN0LCAxLCAxMCksXG4gICAgZ3JhcGg6ICAgIEdyYXBoKCksXG4gICAgc3lzdGVtczogIHtcbiAgICAgIGVtaXR0ZXJzOiAgdXBkYXRlRW1pdHRlcixcbiAgICAgIGxpZmVzcGFuczoga2lsbFRoZU9sZCxcbiAgICAgIHBoeXNpY3M6ICAgdXBkYXRlUGh5c2ljc1xuICAgIH0sXG4gICAgZ3JvdXBzOiAgIHtcbiAgICAgIGVtaXR0ZXJzOiAgW10sXG4gICAgICBsaWZlc3BhbnM6IFtdLFxuICAgICAgcGh5c2ljczogICBbXSxcbiAgICAgIGxpZ2h0czogICAgW10sXG4gICAgICBwYXJ0aWNsZXM6IFtdXG4gICAgfSxcbiAgICBwcm9ncmFtczoge1xuICAgICAgcGFydGljbGU6IHBhcnRpY2xlUHJvZ3JhbVxuICAgIH0sXG4gICAgbGlnaHREYXRhOiBbXVxuICB9XG4gIHZhciBsMSAgID0gUG9pbnRMaWdodCgwLCAwLCAwKVxuICB2YXIgbDIgICA9IFBvaW50TGlnaHQoMCwgLjI1LCAwKVxuICB2YXIgbDMgICA9IFBvaW50TGlnaHQoMCwgLjUsIDApXG4gIHZhciBlMSAgID0gRW1pdHRlcigxMDAwLCAxMCwgLjAwMiwgLjEsIDAsIDAsIDAsIDAsIDEsIHJhbmRCb3VuZCgtMC4yLCAwLjIpKSAgXG4gIHZhciBlMXBzID0gUGFydGljbGVHcm91cCg1MCwgMTAwMClcblxuICBzZXRWZWMzKDEuMCwgMC4wLCAwLjAsIGwxLnJnYilcbiAgc2V0VmVjMygwLjAsIDEuMCwgMC4wLCBsMi5yZ2IpXG4gIHNldFZlYzMoMC4wLCAwLjAsIDEuMCwgbDMucmdiKVxuICBhdHRhY2hUb1Jvb3Qoc2NlbmUuZ3JhcGgsIGwxKVxuICBhdHRhY2hUb1Jvb3Qoc2NlbmUuZ3JhcGgsIGwyKVxuICBhdHRhY2hUb1Jvb3Qoc2NlbmUuZ3JhcGgsIGwzKVxuICBhdHRhY2hUb1Jvb3Qoc2NlbmUuZ3JhcGgsIGUxKVxuICBhdHRhY2hNYW55VG9Ob2RlKHNjZW5lLmdyYXBoLCBlMSwgZTFwcylcbiAgaW50byhzY2VuZS5ncm91cHMubGlnaHRzLCBpc0xpZ2h0LCBzY2VuZS5ncmFwaClcbiAgaW50byhzY2VuZS5ncm91cHMuZW1pdHRlcnMsIGlzRW1pdHRlciwgc2NlbmUuZ3JhcGgpXG4gIGludG8oc2NlbmUuZ3JvdXBzLnBhcnRpY2xlcywgaXNQYXJ0aWNsZSwgc2NlbmUuZ3JhcGgpXG4gIGludG8oc2NlbmUuZ3JvdXBzLmxpZmVzcGFucywgaGFzTGlmZXNwYW4sIHNjZW5lLmdyYXBoKVxuICBpbnRvKHNjZW5lLmdyb3Vwcy5waHlzaWNzLCBoYXNQaHlzaWNzLCBzY2VuZS5ncmFwaClcbiAgc2NlbmUubGlnaHREYXRhID0gYnVpbGRMaWdodERhdGEoc2NlbmUuZ3JvdXBzLmxpZ2h0cylcblxuICB3aW5kb3cuc2NlbmUgPSBzY2VuZVxuXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUoc2NlbmUpLCAyNSlcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VSZW5kZXIoZ2wsIHNjZW5lKSlcbn0pXG4iLCJ2YXIgbWF0NCAgICAgPSByZXF1aXJlKFwiZ2wtbWF0NFwiKVxudmFyIHZlYzMgICAgID0gcmVxdWlyZShcIi4vdmVjM1wiKVxudmFyIFZlYzMgICAgID0gdmVjMy5WZWMzXG52YXIgcm90U3BlZWQgPSBNYXRoLlBJIC8gMzAwMFxudmFyIGNhbWVyYSAgID0ge31cblxuXG52YXIgQ2FtZXJhID0gZnVuY3Rpb24gKHgsIHksIHosIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENhbWVyYSkpIHJldHVybiBuZXcgQ2FtZXJhKHgsIHksIHosIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpXG5cbiAgdGhpcy5wb3NpdGlvbiAgID0gVmVjMyh4LCB5ICx6KVxuICB0aGlzLmZvdiAgICAgICAgPSBmb3ZcbiAgdGhpcy5uZWFyICAgICAgID0gbmVhclxuICB0aGlzLmZhciAgICAgICAgPSBmYXJcbiAgdGhpcy5hc3BlY3QgICAgID0gYXNwZWN0XG4gIHRoaXMucHJvamVjdGlvbiA9IG1hdDQucGVyc3BlY3RpdmUobWF0NC5jcmVhdGUoKSwgZm92LCBhc3BlY3QsIG5lYXIsIGZhcilcblxuICB0aGlzLmV5ZSAgICAgICAgPSBWZWMzKHgsIHksIHopXG4gIHRoaXMubG9va0F0ICAgICA9IFZlYzMoMCwgMCwgMClcbiAgdGhpcy51cCAgICAgICAgID0gVmVjMygwLCAxLCAwKVxuICB0aGlzLnZpZXcgICAgICAgPSBtYXQ0Lmxvb2tBdChtYXQ0LmNyZWF0ZSgpLCB0aGlzLmV5ZSwgdGhpcy5sb29rQXQsIHRoaXMudXApXG59XG5cbnZhciB1cGRhdGVDYW1lcmEgPSBmdW5jdGlvbiAod29ybGQsIGNhbWVyYSkge1xuICB2YXIgZFQgICA9IHdvcmxkLmNsb2NrLmRUXG4gIHZhciB2aWV3ID0gd29ybGQuY2FtZXJhLnZpZXdcblxuICBtYXQ0LnJvdGF0ZVkodmlldywgdmlldywgcm90U3BlZWQgKiBkVClcbn1cblxuXG5jYW1lcmEuQ2FtZXJhICAgICAgID0gQ2FtZXJhXG5jYW1lcmEudXBkYXRlQ2FtZXJhID0gdXBkYXRlQ2FtZXJhXG5tb2R1bGUuZXhwb3J0cyA9IGNhbWVyYVxuIiwidmFyIGNsb2NrID0ge31cblxudmFyIENsb2NrID0gZnVuY3Rpb24gKG5vdykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2xvY2spKSByZXR1cm4gbmV3IENsb2NrKG5vdylcbiAgdGhpcy5vbGRUaW1lID0gbm93XG4gIHRoaXMubmV3VGltZSA9IG5vd1xuICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcbn1cblxudmFyIHVwZGF0ZUNsb2NrID0gZnVuY3Rpb24gKGNsb2NrLCBuZXdUaW1lKSB7XG4gIGNsb2NrLm9sZFRpbWUgPSBjbG9jay5uZXdUaW1lXG4gIGNsb2NrLm5ld1RpbWUgPSBuZXdUaW1lXG4gIGNsb2NrLmRUICAgICAgPSBjbG9jay5uZXdUaW1lIC0gY2xvY2sub2xkVGltZVxufVxuXG5jbG9jay5DbG9jayAgICAgICA9IENsb2NrXG5jbG9jay51cGRhdGVDbG9jayA9IHVwZGF0ZUNsb2NrXG5cbm1vZHVsZS5leHBvcnRzID0gY2xvY2tcbiIsInZhciB1dWlkICAgICAgPSByZXF1aXJlKFwibm9kZS11dWlkXCIpXG52YXIgcHJvZGFzaCAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciByYW5kb20gICAgPSByZXF1aXJlKFwiLi9yYW5kb21cIilcbnZhciB2ZWMzICAgICAgPSByZXF1aXJlKFwiLi92ZWMzXCIpXG52YXIgVmVjMyAgICAgID0gdmVjMy5WZWMzXG52YXIgZmluZCAgICAgID0gcHJvZGFzaC5hcnJheS5maW5kXG52YXIgY3VycnkgICAgID0gcHJvZGFzaC5mdW5jdGlvbnMuY3VycnlcbnZhciByYW5kQm91bmQgPSByYW5kb20ucmFuZEJvdW5kXG52YXIgZW1pdHRlcnMgID0ge31cblxudmFyIFBhcnRpY2xlID0gZnVuY3Rpb24gKGxpZmVzcGFuKSB7XG4gIHJldHVybiB7XG4gICAgaWQ6ICAgICAgICAgICB1dWlkLnY0KCksXG4gICAgcGFydGljbGU6ICAgICB0cnVlLFxuICAgIHBvc2l0aW9uOiAgICAgVmVjMygwLCAwLCAwKSxcbiAgICB2ZWxvY2l0eTogICAgIFZlYzMoMCwgMCwgMCksXG4gICAgYWNjZWxlcmF0aW9uOiBWZWMzKDAsIC0wLjAwMDAwMTgsIDApLFxuICAgIHJlbmRlcmFibGU6ICAgdHJ1ZSxcbiAgICBzaXplOiAgICAgICAgIDQuMCxcbiAgICB0aW1lVG9EaWU6ICAgIDAsXG4gICAgbGlmZXNwYW46ICAgICBsaWZlc3BhbixcbiAgICBsaXZpbmc6ICAgICAgIGZhbHNlXG4gIH1cbn1cblxudmFyIEVtaXR0ZXIgPSBmdW5jdGlvbiAobGlmZXNwYW4sIHJhdGUsIHNwZWVkLCBzcHJlYWQsIHB4LCBweSwgcHosIGR4LCBkeSwgZHopIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogICAgICAgICAgIHV1aWQudjQoKSxcbiAgICBlbWl0dGVyOiAgICAgIHRydWUsXG4gICAgcmF0ZTogICAgICAgICByYXRlLCBcbiAgICBzcGVlZDogICAgICAgIHNwZWVkLFxuICAgIHNwcmVhZDogICAgICAgc3ByZWFkLFxuICAgIG5leHRGaXJlVGltZTogMCxcbiAgICBwb3NpdGlvbjogICAgIFZlYzMocHgsIHB5LCBweiksXG4gICAgdmVsb2NpdHk6ICAgICBWZWMzKDAsIDAsIDApLFxuICAgIGFjY2VsZXJhdGlvbjogVmVjMygwLCAwLCAwKSxcbiAgICBkaXJlY3Rpb246ICAgIFZlYzMoZHgsIGR5LCBkeiksXG4gICAgcmVuZGVyYWJsZTogICBmYWxzZSxcbiAgICBsaXZpbmc6ICAgICAgIHRydWVcbiAgfVxufVxuXG52YXIgUGFydGljbGVHcm91cCA9IGZ1bmN0aW9uIChjb3VudCwgbGlmZXNwYW4pIHtcbiAgdmFyIHBhcnRpY2xlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgKytpKSB7XG4gICAgcGFydGljbGVzLnB1c2goUGFydGljbGUobGlmZXNwYW4pKVxuICB9ICAgIFxuICByZXR1cm4gcGFydGljbGVzXG59XG5cbnZhciBzY2FsZUFuZFNwcmVhZCA9IGZ1bmN0aW9uIChzY2FsZSwgc3ByZWFkLCB2YWwpIHtcbiAgcmV0dXJuIHNjYWxlICogKHZhbCArIHJhbmRCb3VuZCgtMSAqIHNwcmVhZCwgc3ByZWFkKSlcbn1cblxudmFyIGZpbmRGaXJzdERlYWQgPSBmdW5jdGlvbiAoZ3JhcGgsIGNoaWxkSWRzKSB7XG4gIHZhciBjaGlsZE5vZGVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgY2hpbGROb2RlID0gZ3JhcGgubm9kZXNbY2hpbGRJZHNbaV1dXG4gICAgaWYgKCFjaGlsZE5vZGUubGl2aW5nKSByZXR1cm4gY2hpbGROb2RlXG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZFxufVxuXG52YXIgdXBkYXRlRW1pdHRlciA9IGZ1bmN0aW9uICh3b3JsZCwgZSkge1xuICB2YXIgdGltZSA9IHdvcmxkLmNsb2NrLm5ld1RpbWVcbiAgdmFyIHBhcnRpY2xlIFxuXG4gIGlmICghZS5saXZpbmcpICByZXR1cm5cbiAgaWYgKHRpbWUgPiBlLm5leHRGaXJlVGltZSkge1xuICAgIHBhcnRpY2xlICAgICAgICAgICAgID0gZmluZEZpcnN0RGVhZCh3b3JsZC5ncmFwaCwgZS5jaGlsZElkcylcbiAgICBwYXJ0aWNsZS50aW1lVG9EaWUgICA9IHRpbWUgKyBwYXJ0aWNsZS5saWZlc3BhblxuICAgIHBhcnRpY2xlLmxpdmluZyAgICAgID0gdHJ1ZVxuICAgIHBhcnRpY2xlLnBvc2l0aW9uWzBdID0gZS5wb3NpdGlvblswXVxuICAgIHBhcnRpY2xlLnBvc2l0aW9uWzFdID0gZS5wb3NpdGlvblsxXVxuICAgIHBhcnRpY2xlLnBvc2l0aW9uWzJdID0gZS5wb3NpdGlvblsyXVxuICAgIHBhcnRpY2xlLnZlbG9jaXR5WzBdID0gc2NhbGVBbmRTcHJlYWQoZS5zcGVlZCwgZS5zcHJlYWQsIGUuZGlyZWN0aW9uWzBdKVxuICAgIHBhcnRpY2xlLnZlbG9jaXR5WzFdID0gc2NhbGVBbmRTcHJlYWQoZS5zcGVlZCwgZS5zcHJlYWQsIGUuZGlyZWN0aW9uWzFdKVxuICAgIHBhcnRpY2xlLnZlbG9jaXR5WzJdID0gc2NhbGVBbmRTcHJlYWQoZS5zcGVlZCwgZS5zcHJlYWQsIGUuZGlyZWN0aW9uWzJdKVxuICAgIGUubmV4dEZpcmVUaW1lICs9IGUucmF0ZVxuICB9XG59XG5cbmVtaXR0ZXJzLlBhcnRpY2xlICAgICAgPSBQYXJ0aWNsZVxuZW1pdHRlcnMuUGFydGljbGVHcm91cCA9IFBhcnRpY2xlR3JvdXBcbmVtaXR0ZXJzLkVtaXR0ZXIgICAgICAgPSBFbWl0dGVyXG5lbWl0dGVycy51cGRhdGVFbWl0dGVyID0gdXBkYXRlRW1pdHRlclxubW9kdWxlLmV4cG9ydHMgICAgICAgICA9IGVtaXR0ZXJzXG4iLCJ2YXIgdXRpbHMgPSB7fVxuXG52YXIgY2xlYXJDb250ZXh0ID0gZnVuY3Rpb24gKGdsKSB7XG4gIGdsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMC4wKVxuICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxufVxuXG52YXIgdXBkYXRlQnVmZmVyID0gZnVuY3Rpb24gKGdsLCBjaHVua1NpemUsIGF0dHJpYnV0ZSwgYnVmZmVyLCBkYXRhKSB7XG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGF0dHJpYnV0ZSlcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihhdHRyaWJ1dGUsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxuICByZXR1cm4gYnVmZmVyXG59XG5cbi8vZ2l2ZW4gc3JjIGFuZCB0eXBlLCBjb21waWxlIGFuZCByZXR1cm4gc2hhZGVyXG5mdW5jdGlvbiBjb21waWxlIChnbCwgc2hhZGVyVHlwZSwgc3JjKSB7XG4gIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoc2hhZGVyVHlwZSlcblxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxuICByZXR1cm4gc2hhZGVyXG59XG5cbi8vbGluayB5b3VyIHByb2dyYW0gdy8gb3BlbmdsXG5mdW5jdGlvbiBsaW5rIChnbCwgdnMsIGZzKSB7XG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpXG5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKSBcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKSBcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcbiAgcmV0dXJuIHByb2dyYW1cbn1cblxuLypcbiAqIFdlIHdhbnQgdG8gY3JlYXRlIGEgd3JhcHBlciBmb3IgYSBsb2FkZWQgZ2wgcHJvZ3JhbVxuICogdGhhdCBpbmNsdWRlcyBwb2ludGVycyB0byBhbGwgdGhlIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzXG4gKiBkZWZpbmVkIGZvciB0aGlzIHByb2dyYW0uICBUaGlzIG1ha2VzIGl0IG1vcmUgY29udmVuaWVudFxuICogdG8gY2hhbmdlIHRoZXNlIHZhbHVlc1xuICovXG52YXIgTG9hZGVkUHJvZ3JhbSA9IGZ1bmN0aW9uIChnbCwgdlNyYywgZlNyYykge1xuICB2YXIgdnMgICAgICAgICAgICA9IGNvbXBpbGUoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIHZhciBmcyAgICAgICAgICAgID0gY29tcGlsZShnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICB2YXIgcHJvZ3JhbSAgICAgICA9IGxpbmsoZ2wsIHZzLCBmcylcbiAgdmFyIG51bUF0dHJpYnV0ZXMgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKVxuICB2YXIgbnVtVW5pZm9ybXMgICA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKVxuICB2YXIgbHAgPSB7XG4gICAgdmVydGV4OiB7XG4gICAgICBzcmM6ICAgIHZTcmMsXG4gICAgICBzaGFkZXI6IHZzIFxuICAgIH0sXG4gICAgZnJhZ21lbnQ6IHtcbiAgICAgIHNyYzogICAgZlNyYyxcbiAgICAgIHNoYWRlcjogZnMgXG4gICAgfSxcbiAgICBwcm9ncmFtOiAgICBwcm9ncmFtLFxuICAgIHVuaWZvcm1zOiAgIHt9LCBcbiAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICBidWZmZXJzOiAgICB7fVxuICB9XG4gIHZhciBhTmFtZVxuICB2YXIgdU5hbWVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bUF0dHJpYnV0ZXM7ICsraSkge1xuICAgIGFOYW1lICAgICAgICAgICAgICAgID0gZ2wuZ2V0QWN0aXZlQXR0cmliKHByb2dyYW0sIGkpLm5hbWVcbiAgICBscC5hdHRyaWJ1dGVzW2FOYW1lXSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIGFOYW1lKVxuICAgIGxwLmJ1ZmZlcnNbYU5hbWVdICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgfVxuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgbnVtVW5pZm9ybXM7ICsraikge1xuICAgIHVOYW1lICAgICAgICAgICAgICA9IGdsLmdldEFjdGl2ZVVuaWZvcm0ocHJvZ3JhbSwgaikubmFtZVxuICAgIGxwLnVuaWZvcm1zW3VOYW1lXSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCB1TmFtZSlcbiAgfVxuXG4gIHJldHVybiBscCBcbn1cblxudXRpbHMuY2xlYXJDb250ZXh0ICA9IGNsZWFyQ29udGV4dFxudXRpbHMudXBkYXRlQnVmZmVyICA9IHVwZGF0ZUJ1ZmZlclxudXRpbHMuTG9hZGVkUHJvZ3JhbSA9IExvYWRlZFByb2dyYW1cbm1vZHVsZS5leHBvcnRzICAgICAgPSB1dGlsc1xuIiwidmFyIHByb2Rhc2ggICA9IHJlcXVpcmUoXCJwcm9kYXNoXCIpXG52YXIgdXVpZCAgICAgID0gcmVxdWlyZShcIm5vZGUtdXVpZFwiKVxudmFyIHRyYW5zZHVjZSA9IHByb2Rhc2gudHJhbnNkdWNlcnMudHJhbnNkdWNlXG52YXIgZmlsdGVyaW5nID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5maWx0ZXJpbmdcbnZhciBjb25zICAgICAgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLmNvbnNcbnZhciBleHRlbmQgICAgPSBwcm9kYXNoLm9iamVjdC5leHRlbmRcbnZhciBjdXJyeSAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5jdXJyeVxudmFyIHJlbW92ZSAgICA9IHByb2Rhc2guYXJyYXkucmVtb3ZlXG52YXIgZ3JhcGggICAgID0ge31cblxudmFyIE5vZGUgPSBmdW5jdGlvbiAoaGFzaCkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTm9kZSkpIHJldHVybiBuZXcgTm9kZShoYXNoKSBcblxuICBleHRlbmQodGhpcywgaGFzaClcbiAgdGhpcy5pZCAgICAgICA9IHRoaXMuaWQgfHwgdXVpZC52NCgpXG4gIHRoaXMucGFyZW50SWQgPSB0aGlzLnBhcmVudElkIHx8IG51bGxcbiAgdGhpcy5jaGlsZElkcyA9IHRoaXMuY2hpbGRJZHMgfHwgW11cbn1cblxudmFyIEdyYXBoID0gZnVuY3Rpb24gKHJvb3ROb2RlKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBHcmFwaCkpIHJldHVybiBuZXcgR3JhcGgocm9vdE5vZGUpXG4gIHZhciByb290Tm9kZSA9IHJvb3ROb2RlIHx8IE5vZGUoeyBpZDogdXVpZC52NCgpIH0pXG5cbiAgdGhpcy5ub2RlcyAgICAgICAgICAgICAgPSB7fVxuICB0aGlzLnJvb3ROb2RlSWQgICAgICAgICA9IHJvb3ROb2RlLmlkXG4gIHRoaXMubm9kZXNbcm9vdE5vZGUuaWRdID0gcm9vdE5vZGVcbn1cblxuLy91c2VkIGludGVybmFsbHkgYnkgZ3JhcGguX19yZWR1Y2UgdG8gc3VwcG9ydCBpdGVyYXRpb25cbnZhciBub2RlUmVkdWNlID0gZnVuY3Rpb24gKHJlZEZuLCBub2RlSWQsIGFjY3VtLCBncmFwaCkge1xuICB2YXIgbm9kZSA9IGdyYXBoLm5vZGVzW25vZGVJZF1cblxuICByZWRGbihhY2N1bSwgbm9kZSlcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgbm9kZVJlZHVjZShyZWRGbiwgbm9kZS5jaGlsZElkc1tpXSwgYWNjdW0sIGdyYXBoKSAgIFxuICB9XG4gIHJldHVybiBhY2N1bVxufVxuXG4vL0dyYXBoIC0+IFN0cmluZyAtPiBOb2RlIC0+IFZvaWRcbnZhciBhdHRhY2hCeUlkID0gY3VycnkoZnVuY3Rpb24gKGdyYXBoLCBwYXJlbnRJZCwgbm9kZSkge1xuICBpZiAoIWdyYXBoLm5vZGVzW3BhcmVudElkXSkgdGhyb3cgbmV3IEVycm9yKHBhcmVudElkICsgXCIgbm90IGZvdW5kIGluIGdyYXBoXCIpXG4gIHZhciBub2RlID0gbm9kZSBpbnN0YW5jZW9mIE5vZGUgPyBub2RlIDogTm9kZShub2RlKVxuXG4gIGdyYXBoLm5vZGVzW25vZGUuaWRdICAgICAgICAgID0gbm9kZVxuICBncmFwaC5ub2Rlc1tub2RlLmlkXS5wYXJlbnRJZCA9IHBhcmVudElkXG4gIGdyYXBoLm5vZGVzW3BhcmVudElkXS5jaGlsZElkcy5wdXNoKG5vZGUuaWQpXG59KVxuXG52YXIgYXR0YWNoVG9Ob2RlID0gY3VycnkoZnVuY3Rpb24gKGdyYXBoLCBwYXJlbnROb2RlLCBub2RlKSB7XG4gIGF0dGFjaEJ5SWQoZ3JhcGgsIHBhcmVudE5vZGUuaWQsIG5vZGUpXG59KVxuXG52YXIgYXR0YWNoVG9Sb290ID0gY3VycnkoZnVuY3Rpb24gKGdyYXBoLCBub2RlKSB7XG4gIGF0dGFjaEJ5SWQoZ3JhcGgsIGdyYXBoLnJvb3ROb2RlSWQsIG5vZGUpXG59KVxuXG52YXIgYXR0YWNoTWFueVRvTm9kZSA9IGN1cnJ5KGZ1bmN0aW9uIChncmFwaCwgcGFyZW50Tm9kZSwgbm9kZXMpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7ICsraSkge1xuICAgIGF0dGFjaEJ5SWQoZ3JhcGgsIHBhcmVudE5vZGUuaWQsIG5vZGVzW2ldKSBcbiAgfVxufSlcblxudmFyIGF0dGFjaE1hbnlUb1Jvb3QgPSBjdXJyeShmdW5jdGlvbiAoZ3JhcGgsIG5vZGVzKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyArK2kpIHtcbiAgICBhdHRhY2hCeUlkKGdyYXBoLCBncmFwaC5yb290Tm9kZUlkLCBub2Rlc1tpXSlcbiAgfVxufSlcblxuR3JhcGgucHJvdG90eXBlLl9fcmVkdWNlID0gZnVuY3Rpb24gKHJlZEZuLCBhY2N1bSwgZ3JhcGgpIHtcbiAgcmV0dXJuIG5vZGVSZWR1Y2UocmVkRm4sIGdyYXBoLnJvb3ROb2RlSWQsIGFjY3VtLCBncmFwaClcbn1cblxuR3JhcGgucHJvdG90eXBlLl9fZW1wdHkgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgR3JhcGggfVxuXG5ncmFwaC5Ob2RlICAgICAgICAgICAgID0gTm9kZVxuZ3JhcGguR3JhcGggICAgICAgICAgICA9IEdyYXBoXG5ncmFwaC5hdHRhY2hCeUlkICAgICAgID0gYXR0YWNoQnlJZFxuZ3JhcGguYXR0YWNoVG9Ob2RlICAgICA9IGF0dGFjaFRvTm9kZVxuZ3JhcGguYXR0YWNoVG9Sb290ICAgICA9IGF0dGFjaFRvUm9vdFxuZ3JhcGguYXR0YWNoTWFueVRvTm9kZSA9IGF0dGFjaE1hbnlUb05vZGVcbmdyYXBoLmF0dGFjaE1hbnlUb1Jvb3QgPSBhdHRhY2hNYW55VG9Sb290XG5tb2R1bGUuZXhwb3J0cyAgICAgICAgID0gZ3JhcGhcbiIsInZhciBmbnMgICAgICA9IHJlcXVpcmUoXCJwcm9kYXNoXCIpXG52YXIgY3VycnkgICAgPSBmbnMuZnVuY3Rpb25zLmN1cnJ5XG52YXIgbGlmZXRpbWUgPSB7fVxuXG5saWZldGltZS5raWxsVGhlT2xkID0gZnVuY3Rpb24gKHdvcmxkLCBlKSB7XG4gIHZhciB0aW1lID0gd29ybGQuY2xvY2submV3VGltZVxuXG4gIGlmICghZS5saWZlc3BhbikgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgaWYgKGUubGl2aW5nICYmIHRpbWUgPj0gZS50aW1lVG9EaWUpIGUubGl2aW5nID0gZmFsc2Vcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsaWZldGltZVxuIiwidmFyIHV1aWQgID0gcmVxdWlyZShcIm5vZGUtdXVpZFwiKVxudmFyIHZlYzMgID0gcmVxdWlyZSgnLi92ZWMzJylcbnZhciBWZWMzICA9IHZlYzMuVmVjM1xudmFyIGxpZ2h0ID0ge31cblxudmFyIFBvaW50TGlnaHQgPSBmdW5jdGlvbiAoeCwgeSwgeikge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUG9pbnRMaWdodCkpIHJldHVybiBuZXcgUG9pbnRMaWdodCh4LCB5LCB6KVxuXG4gIHRoaXMuaWQgICAgICAgICAgICA9IHV1aWQudjQoKVxuICB0aGlzLmxpZ2h0ICAgICAgICAgPSB0cnVlXG4gIHRoaXMucG9zaXRpb24gICAgICA9IFZlYzMoeCwgeSwgeilcbiAgdGhpcy52ZWxvY2l0eSAgICAgID0gVmVjMygwLCAwLCAwKVxuICB0aGlzLmFjY2VsZXJhdGlvbiAgPSBWZWMzKDAsIDAsIDApXG4gIHRoaXMucm90YXRpb24gICAgICA9IFZlYzMoMCwgMCwgMClcbiAgdGhpcy5yZ2IgICAgICAgICAgID0gVmVjMygxLCAxLCAxKVxuICB0aGlzLmludGVuc2l0eSAgICAgPSAxLjBcbiAgdGhpcy5saXZpbmcgICAgICAgID0gdHJ1ZVxufVxuXG5saWdodC5Qb2ludExpZ2h0ID0gUG9pbnRMaWdodFxubW9kdWxlLmV4cG9ydHMgPSBsaWdodFxuIiwidmFyIGxvYWRlcnMgID0ge31cblxubG9hZGVycy5sb2FkU2hhZGVyID0gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3RcblxuICB4aHIucmVzcG9uc2VUeXBlID0gXCJzdHJpbmdcIlxuICB4aHIub25sb2FkICAgICAgID0gZnVuY3Rpb24gKCkgeyBjYihudWxsLCB4aHIucmVzcG9uc2UpIH1cbiAgeGhyLm9uZXJyb3IgICAgICA9IGZ1bmN0aW9uICgpIHsgY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSkgfVxuICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICB4aHIuc2VuZChudWxsKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWRlcnNcbiIsInZhciBmbnMgICAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciBjdXJyeSAgID0gZm5zLmZ1bmN0aW9ucy5jdXJyeVxudmFyIHBoeXNpY3MgPSB7fVxuXG52YXIgaGFzUGh5c2ljcyA9IGZ1bmN0aW9uIChub2RlKSB7IFxuICByZXR1cm4gISFub2RlLnBvc2l0aW9uICYmICEhbm9kZS52ZWxvY2l0eSAmJiAhIW5vZGUuYWNjZWxlcmF0aW9uIFxufVxucGh5c2ljcy51cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uIChkVCwgZSkge1xuICBlLnBvc2l0aW9uWzBdID0gZS5wb3NpdGlvblswXSArIGRUICogZS52ZWxvY2l0eVswXVxuICBlLnBvc2l0aW9uWzFdID0gZS5wb3NpdGlvblsxXSArIGRUICogZS52ZWxvY2l0eVsxXVxuICBlLnBvc2l0aW9uWzJdID0gZS5wb3NpdGlvblsyXSArIGRUICogZS52ZWxvY2l0eVsyXVxuICByZXR1cm4gZVxufVxuXG5waHlzaWNzLnVwZGF0ZVZlbG9jaXR5ID0gZnVuY3Rpb24gKGRULCBlKSB7XG4gIGUudmVsb2NpdHlbMF0gPSBlLnZlbG9jaXR5WzBdICsgZFQgKiBlLmFjY2VsZXJhdGlvblswXVxuICBlLnZlbG9jaXR5WzFdID0gZS52ZWxvY2l0eVsxXSArIGRUICogZS5hY2NlbGVyYXRpb25bMV1cbiAgZS52ZWxvY2l0eVsyXSA9IGUudmVsb2NpdHlbMl0gKyBkVCAqIGUuYWNjZWxlcmF0aW9uWzJdXG4gIHJldHVybiBlXG59XG5cbnBoeXNpY3MudXBkYXRlUGh5c2ljcyA9IGZ1bmN0aW9uICh3b3JsZCwgZSkge1xuICBpZiAoIWhhc1BoeXNpY3MoZSkpIHJldHVyblxuICBpZiAoIWUubGl2aW5nKSAgICAgIHJldHVyblxuICBwaHlzaWNzLnVwZGF0ZVZlbG9jaXR5KHdvcmxkLmNsb2NrLmRULCBlKVxuICBwaHlzaWNzLnVwZGF0ZVBvc2l0aW9uKHdvcmxkLmNsb2NrLmRULCBlKVxuICByZXR1cm4gZVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBoeXNpY3NcbiIsInZhciByYW5kb20gPSB7fVxuXG5yYW5kb20ucmFuZEJvdW5kID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikgKyBtaW5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByYW5kb21cbiIsInZhciB1dGlscyAgICAgICAgPSByZXF1aXJlKFwiLi9nbC11dGlsc1wiKVxudmFyIHVwZGF0ZUJ1ZmZlciA9IHV0aWxzLnVwZGF0ZUJ1ZmZlclxuXG4vL2hlcmUgd2UgYWxsb2NhdGUgb25jZSBhbmQgaXRlcmF0ZSB0d2ljZVxuZnVuY3Rpb24gYnVpbGRQb3NpdGlvbnMgKHBhcnRpY2xlcykge1xuICB2YXIgbGl2aW5nQ291bnQgPSAwXG4gIHZhciBvdXQgICAgICAgIFxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGFydGljbGVzLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCEhcGFydGljbGVzW2ldLmxpdmluZykgbGl2aW5nQ291bnQrKyAgXG4gIH1cblxuICBvdXQgPSBuZXcgRmxvYXQzMkFycmF5KGxpdmluZ0NvdW50ICogMylcblxuICBmb3IgKHZhciBqID0gMCwgaW5kZXggPSAwOyBqIDwgcGFydGljbGVzLmxlbmd0aDsgKytqKSB7XG4gICAgaWYgKCEhcGFydGljbGVzW2pdLmxpdmluZykge1xuICAgICAgb3V0LnNldChwYXJ0aWNsZXNbal0ucG9zaXRpb24sIGluZGV4KVxuICAgICAgaW5kZXggKz0gM1xuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHJlbmRlclBhcnRpY2xlcyAoc2NlbmUpIHtcbiAgdmFyIGdsICAgICAgICA9IHNjZW5lLmdsXG4gIHZhciB2aWV3ICAgICAgPSBzY2VuZS5nbC5jYW52YXNcbiAgdmFyIGxwICAgICAgICA9IHNjZW5lLnByb2dyYW1zLnBhcnRpY2xlXG4gIHZhciBwYXJ0aWNsZXMgPSBzY2VuZS5ncm91cHMucGFydGljbGVzXG4gIHZhciBsaWdodERhdGEgPSBzY2VuZS5saWdodERhdGFcbiAgdmFyIHBvc2l0aW9ucyA9IGJ1aWxkUG9zaXRpb25zKHBhcnRpY2xlcylcblxuICBnbC51c2VQcm9ncmFtKGxwLnByb2dyYW0pXG4gIGdsLnVuaWZvcm0zZnYobHAudW5pZm9ybXNbXCJ1TGlnaHRQb3NpdGlvbnNbMF1cIl0sIGxpZ2h0RGF0YS5wb3NpdGlvbnMpXG4gIGdsLnVuaWZvcm0zZnYobHAudW5pZm9ybXNbXCJ1TGlnaHRDb2xvcnNbMF1cIl0sIGxpZ2h0RGF0YS5jb2xvcnMpXG4gIGdsLnVuaWZvcm0xZnYobHAudW5pZm9ybXNbXCJ1TGlnaHRJbnRlbnNpdGllc1swXVwiXSwgbGlnaHREYXRhLmludGVuc2l0aWVzKVxuICBnbC51bmlmb3JtNGYobHAudW5pZm9ybXMudUNvbG9yLCAwLjAsIDAuMCwgMC4wLCAxLjApXG4gIGdsLnVuaWZvcm0yZihscC51bmlmb3Jtcy51U2NyZWVuU2l6ZSwgdmlldy5jbGllbnRXaWR0aCwgdmlldy5jbGllbnRIZWlnaHQpXG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYobHAudW5pZm9ybXMudVZpZXcsIGZhbHNlLCBzY2VuZS5jYW1lcmEudmlldylcbiAgZ2wudW5pZm9ybU1hdHJpeDRmdihscC51bmlmb3Jtcy51UHJvamVjdGlvbiwgZmFsc2UsIHNjZW5lLmNhbWVyYS5wcm9qZWN0aW9uKVxuICBnbC51bmlmb3JtMWYobHAudW5pZm9ybXMudVNpemUsIDEuMClcbiAgdXBkYXRlQnVmZmVyKGdsLCAzLCBscC5hdHRyaWJ1dGVzLmFQb3NpdGlvbiwgbHAuYnVmZmVycy5hUG9zaXRpb24sIHBvc2l0aW9ucylcbiAgZ2wuZHJhd0FycmF5cyhnbC5QT0lOVFMsIDAsIHBvc2l0aW9ucy5sZW5ndGggLyAzKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlbmRlclBhcnRpY2xlc1xuIiwidmFyIHZlYzMgPSB7fVxuXG52YXIgVmVjMyA9IGZ1bmN0aW9uICh4LCB5LCB6KSB7XG4gIHZhciBvdXQgPSBuZXcgRmxvYXQzMkFycmF5KDMpXG5cbiAgb3V0WzBdID0geFxuICBvdXRbMV0gPSB5XG4gIG91dFsyXSA9IHpcbiAgcmV0dXJuIG91dFxufVxuXG52YXIgc2V0VmVjMyA9IGZ1bmN0aW9uICh4LCB5LCB6LCB2ZWMpIHtcbiAgdmVjWzBdID0geFxuICB2ZWNbMV0gPSB5XG4gIHZlY1syXSA9IHpcbiAgcmV0dXJuIHZlY1xufVxuXG52YXIgY2xvbmVWZWMzID0gZnVuY3Rpb24gKHZlYykge1xuICByZXR1cm4gVmVjMyh2ZWNbMF0sIHZlY1sxXSwgdmVjWzJdKVxufVxuXG52ZWMzLlZlYzMgICAgICA9IFZlYzNcbnZlYzMuc2V0VmVjMyAgID0gc2V0VmVjM1xudmVjMy5jbG9uZVZlYzMgPSBjbG9uZVZlYzNcbm1vZHVsZS5leHBvcnRzID0gdmVjM1xuIl19
