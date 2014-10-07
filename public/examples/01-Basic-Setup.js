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

},{"./functions":3}],5:[function(require,module,exports){
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

},{"./functions":3}],6:[function(require,module,exports){
var prodash       = require("prodash")
var async         = require("async")
var graph         = require("../modules/graph")
var loaders       = require("../modules/loaders")
var utils         = require("../modules/gl-utils")
var random        = require("../modules/random")
var physics       = require("../modules/physics")
var lifetime      = require("../modules/lifetime")
var emitters      = require("../modules/emitters")
var clock         = require("../modules/clock")
var camera        = require("../modules/camera")
var light         = require("../modules/light")
var vec3          = require("../modules/vec3")
var Graph         = graph.Graph
var attachById    = graph.attachById
var partial       = prodash.functions.partial
var transduce     = prodash.transducers.transduce
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
var PointLight    = light.PointLight
var setVec3       = vec3.setVec3
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
  return function update () {
    updateClock(world.clock, performance.now())
    updateCamera(world, world.camera)
    updateEntities(killTheOld, world)
    updateEntities(updatePhysics, world)
    updateEntities(updateEmitter, world)
  }
}

function makeRender (gl, world) {
  var lp               = world.programs.particle
  var rawPositions     = []
  var lightColors      = []
  var lightPositions   = []
  var lightIntensities = []
  var buildBuffers = function (world, node) {
    if (node.living && node.renderable) {
      rawPositions.push(node.position[0]) 
      rawPositions.push(node.position[1]) 
      rawPositions.push(node.position[2]) 
    }
    if (!!node.light) {
      lightPositions.push(node.position[0])
      lightPositions.push(node.position[1])
      lightPositions.push(node.position[2])
      lightColors.push(node.rgb[0])
      lightColors.push(node.rgb[1])
      lightColors.push(node.rgb[2])
      lightIntensities.push(node.intensity)
    }
  }
  var positions 
  var lC
  var lP
  var lI

  return function render () {
    rawPositions     = []
    lightColors      = []
    lightPositions   = []
    lightIntensities = []
    updateEntities(buildBuffers, world)
    positions = new Float32Array(rawPositions)
    lC        = new Float32Array(lightColors)
    lP        = new Float32Array(lightPositions)
    lI        = new Float32Array(lightIntensities)

    window.lP = lP
    window.lC = lC
    window.lI = lI
    clearContext(gl)
    gl.useProgram(world.programs.particle.program)
    gl.uniform3fv(lp.uniforms["uLightPositions[0]"], lP)
    gl.uniform3fv(lp.uniforms["uLightColors[0]"], lC)
    gl.uniform1fv(lp.uniforms["uLightIntensities[0]"], lI)
    gl.uniform4f(lp.uniforms.uColor, 0.0, 0.0, 0.0, 1.0)
    gl.uniform2f(lp.uniforms.uScreenSize, canvas.clientWidth, canvas.clientHeight)
    gl.uniformMatrix4fv(lp.uniforms.uView, false, world.camera.view)
    gl.uniformMatrix4fv(lp.uniforms.uProjection, false, world.camera.projection)
    gl.uniform1f(lp.uniforms.uSize, 1.0)
    updateBuffer(gl, 3, lp.attributes.aPosition, lp.buffers.aPosition, positions)
    gl.drawArrays(gl.POINTS, 0, positions.length / 3)
    requestAnimationFrame(render) 
  }
}

async.parallel({
  vertex:   partial(loadShader, "/shaders/01v.glsl"),
  fragment: partial(loadShader, "/shaders/01f.glsl")
}, function (err, shaders) {
  var fov             = Math.PI / 2
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
  var l1 = PointLight(1, 0, 0)
  var l2 = PointLight(0, 1, 0)
  var l3 = PointLight(0, 0, 1)

  setVec3(1.0, 0.0, 0.0, l1.rgb)
  setVec3(0.0, 1.0, 0.0, l2.rgb)
  setVec3(0.0, 0.0, 1.0, l3.rgb)
  attachById(world.graph, world.graph.rootNodeId, l1)
  attachById(world.graph, world.graph.rootNodeId, l2)
  attachById(world.graph, world.graph.rootNodeId, l3)

  var spawnAt = function (speed, x, y, dx, dy) {
    var e = Emitter(1000, 10, speed, .1, x, y, 0, dx, dy, randBound(-0.2, 0.2))  

    attachById(world.graph, world.graph.rootNodeId, e)
    for (var j = 0; j < 50; ++j) {
      attachById(world.graph, e.id, Particle(1000, 0, 0, 0))
    }
  }

  var buildEmitters = function (transFn) {
    var count  = 16
    var spread = 2
    var diff   = spread / count
    var e

    for (var i = -1 * count; i < 1 * count; i+=.02 * count) {
      spawnAt(.004, transFn(i) * diff, i / count, 1, i / count)
    }
  }
  buildEmitters(Math.sin)
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

var Particle = function (lifespan, px, py, pz) {
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
  this.velocity      = Vec3(0, 0 ,0)
  this.accelerations = Vec3(0, 0 ,0)
  this.rotations     = Vec3(0, 0, 0)
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

vec3.Vec3      = Vec3
vec3.setVec3   = setVec3
module.exports = vec3

},{}]},{},[6])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvcHJvZGFzaC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL3Byb2Rhc2gvc3JjL2FycmF5LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvZnVuY3Rpb25zLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvb2JqZWN0LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9ub2RlX21vZHVsZXMvcHJvZGFzaC9zcmMvdHJhbnNkdWNlcnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9leGFtcGxlcy8wMS1CYXNpYy1TZXR1cC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvY2FtZXJhLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9jbG9jay5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvZW1pdHRlcnMuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2dsLXV0aWxzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9ncmFwaC5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbGlmZXRpbWUuanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL2xpZ2h0LmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9sb2FkZXJzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9waHlzaWNzLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9yYW5kb20uanMiLCIvVXNlcnMvc3RldmVua2FuZS93ZWJnbC1wbGF5Z3JvdW5kLmpzL3NyYy9tb2R1bGVzL3ZlYzMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBwcm9kYXNoID0ge1xuICBmdW5jdGlvbnM6ICAgcmVxdWlyZShcIi4vc3JjL2Z1bmN0aW9uc1wiKSxcbiAgdHJhbnNkdWNlcnM6IHJlcXVpcmUoXCIuL3NyYy90cmFuc2R1Y2Vyc1wiKSxcbiAgYXJyYXk6ICAgICAgIHJlcXVpcmUoXCIuL3NyYy9hcnJheVwiKSxcbiAgb2JqZWN0OiAgICAgIHJlcXVpcmUoXCIuL3NyYy9vYmplY3RcIilcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwcm9kYXNoXG4iLCJ2YXIgZm5zICAgICAgICAgPSByZXF1aXJlKFwiLi9mdW5jdGlvbnNcIilcbnZhciBjdXJyeSAgICAgICA9IGZucy5jdXJyeVxudmFyIGRlbWV0aG9kaXplID0gZm5zLmRlbWV0aG9kaXplXG52YXIgYXJyYXkgICAgICAgPSB7fVxuXG52YXIgZmluZCA9IGN1cnJ5KGZ1bmN0aW9uIChwcmVkRm4sIGFyKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAocHJlZEZuKGFyW2ldKSkgcmV0dXJuIGFyW2ldIFxuICB9XG4gIHJldHVybiBudWxsXG59KVxuXG52YXIgZm9yRWFjaCA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBhcikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyLmxlbmd0aDsgKytpKSB7XG4gICAgYXJbaV0gPSB0cmFuc0ZuKGFyW2ldKSBcbiAgfVxufSlcblxudmFyIHJldmVyc2UgPSBmdW5jdGlvbiAobGlzdCkge1xuICB2YXIgYmFja3dhcmRzID0gW11cblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGlzdC5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGJhY2t3YXJkc1tpXSA9IGxpc3RbbGVuLTEtaV1cbiAgfVxuICByZXR1cm4gYmFja3dhcmRzXG59XG5cbnZhciBjb25jYXQgPSBkZW1ldGhvZGl6ZShBcnJheS5wcm90b3R5cGUsIFwiY29uY2F0XCIpXG5cbnZhciBmbGF0dGVuID0gZnVuY3Rpb24gKGFycmF5T2ZBcnJheXMpIHtcbiAgdmFyIGZsYXR0ZW5lZCA9IFtdXG4gIHZhciBzdWJhcnJheVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlPZkFycmF5cy5sZW5ndGg7ICsraSkge1xuICAgIHN1YmFycmF5ID0gYXJyYXlPZkFycmF5c1tpXVxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgc3ViYXJyYXkubGVuZ3RoOyArK2opIHtcbiAgICAgIGZsYXR0ZW5lZC5wdXNoKHN1YmFycmF5W2pdKSBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZsYXR0ZW5lZFxufVxuXG52YXIgcHVzaCA9IGZ1bmN0aW9uIChhcnJheSwgZWwpIHtcbiAgYXJyYXkucHVzaChlbClcbiAgcmV0dXJuIGFycmF5XG59XG5cbnZhciB1bnNoaWZ0ID0gZnVuY3Rpb24gKGFycmF5LCBlbCkge1xuICBhcnJheS51bnNoaWZ0KGVsKVxuICByZXR1cm4gYXJyYXlcbn1cblxudmFyIHNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIGFycmF5KSB7XG4gIHJldHVybiBhcnJheS5zbGljZShzdGFydCwgZW5kKVxufVxuXG52YXIgcmVtb3ZlID0gZnVuY3Rpb24gKGZuLCBhcnJheSkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKGZuKGFycmF5W2ldKSkge1xuICAgICAgYXJyYXkuc3BsaWNlKGksIDEpXG4gICAgfVxuICB9XG4gIHJldHVybiBhcnJheVxufVxuXG5hcnJheS5maW5kICAgID0gZmluZFxuYXJyYXkuZm9yRWFjaCA9IGZvckVhY2hcbmFycmF5LnJldmVyc2UgPSByZXZlcnNlXG5hcnJheS5jb25jYXQgID0gY29uY2F0XG5hcnJheS5mbGF0dGVuID0gZmxhdHRlblxuYXJyYXkuc2xpY2UgICA9IHNsaWNlXG5hcnJheS5wdXNoICAgID0gcHVzaFxuYXJyYXkudW5zaGlmdCA9IHVuc2hpZnRcbmFycmF5LnJlbW92ZSAgPSByZW1vdmVcblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheVxuIiwidmFyIGZucyA9IHt9XG5cbnZhciBkZW1ldGhvZGl6ZSA9IGZ1bmN0aW9uIChvYmosIGZuTmFtZSkge1xuICByZXR1cm4gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGwuYmluZChvYmpbZm5OYW1lXSkgXG59XG5cbnZhciBpbnN0YW5jZU9mID0gZnVuY3Rpb24gKGNvbnN0cnVjdG9yLCBjb2wpIHsgXG4gIHJldHVybiBjb2wgaW5zdGFuY2VvZiBjb25zdHJ1Y3RvclxufVxuXG52YXIgYXBwbHkgPSBmdW5jdGlvbiAoZm4sIGFyZ3NMaXN0KSB7IFxuICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJnc0xpc3QpIFxufVxuXG52YXIgY2FsbCA9IGZ1bmN0aW9uIChmbikgeyBcbiAgdmFyIGFyZ3MgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aCAtIDE7ICsraSkge1xuICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdIFxuICB9XG4gIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKSBcbn1cblxudmFyIGNvbXBvc2UgPSBmdW5jdGlvbiAoZm5zKSB7XG4gIHJldHVybiBmdW5jdGlvbiBjb21wb3NlZCAodmFsKSB7XG4gICAgZm9yICh2YXIgaSA9IGZucy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdmFsID0gZm5zW2ldKHZhbClcbiAgICB9XG4gICAgcmV0dXJuIHZhbFxuICB9XG59XG5cbnZhciBmbGlwID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJhY2t3YXJkcyA9IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBiYWNrd2FyZHNbaV0gPSBhcmd1bWVudHNbbGVuLTEtaV1cbiAgICB9XG4gICAgcmV0dXJuIGFwcGx5KGZuLCBiYWNrd2FyZHMpXG4gIH1cbn1cblxudmFyIHBhcnRpYWwgPSBmdW5jdGlvbiAoZm4pIHtcbiAgdmFyIGFyZ3MgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aCAtIDE7ICsraSkge1xuICAgIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDFdIFxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBqID0gMCwgc3RhcnRpbmdJbmRleCA9IGFyZ3MubGVuZ3RoOyBqIDwgYXJndW1lbnRzLmxlbmd0aDsgKytqKSB7XG4gICAgICBhcmdzW2ogKyBzdGFydGluZ0luZGV4XSA9IGFyZ3VtZW50c1tqXSBcbiAgICB9XG5cbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncylcbiAgfVxufVxuXG4vL3V0aWxpdHkgZnVuY3Rpb24gdXNlZCBpbiBjdXJyeSBkZWZcbnZhciBpbm5lckN1cnJ5ID0gZnVuY3Rpb24gKGZuLCBhcmdzKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHN0YXJ0aW5nSW5kZXggPSBhcmdzLmxlbmd0aDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgYXJnc1tpICsgc3RhcnRpbmdJbmRleF0gPSBhcmd1bWVudHNbaV0gXG4gICAgfVxuXG4gICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICB9O1xufTtcblxuLy9hcml0eSBhcmd1bWVudCBpcyB1c2VkIG1vc3Qgb2Z0ZW4gaW50ZXJuYWxseVxudmFyIGN1cnJ5ID0gZnVuY3Rpb24gKGZuLCBhcml0eSkge1xuICB2YXIgZm5Bcml0eSA9IGFyaXR5IHx8IGZuLmxlbmd0aFxuXG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG1pc3NpbmdBcmdzQ291bnQgPSBmbkFyaXR5IC0gYXJndW1lbnRzLmxlbmd0aFxuICAgIHZhciBub3RFbm91Z2hBcmdzICAgID0gbWlzc2luZ0FyZ3NDb3VudCA+IDBcbiAgICB2YXIgYXJncyAgICAgICAgICAgICA9IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgYXJnc1tpXSA9IGFyZ3VtZW50c1tpXSBcbiAgICB9XG5cbiAgICBpZiAobm90RW5vdWdoQXJncykgcmV0dXJuIGN1cnJ5KGlubmVyQ3VycnkoZm4sIGFyZ3MpLCBtaXNzaW5nQXJnc0NvdW50KVxuICAgIGVsc2UgICAgICAgICAgICAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJncylcbiAgfVxufVxuXG5mbnMuZGVtZXRob2RpemUgPSBkZW1ldGhvZGl6ZVxuZm5zLmluc3RhbmNlT2YgID0gaW5zdGFuY2VPZlxuZm5zLmZsaXAgICAgICAgID0gZmxpcFxuZm5zLmNvbXBvc2UgICAgID0gY29tcG9zZVxuZm5zLnBhcnRpYWwgICAgID0gcGFydGlhbFxuZm5zLmN1cnJ5ICAgICAgID0gY3VycnlcbmZucy5jYWxsICAgICAgICA9IGNhbGxcbmZucy5hcHBseSAgICAgICA9IGFwcGx5XG5tb2R1bGUuZXhwb3J0cyAgPSBmbnNcbiIsInZhciBmbnMgICAgICAgICA9IHJlcXVpcmUoXCIuL2Z1bmN0aW9uc1wiKVxudmFyIGN1cnJ5ICAgICAgID0gZm5zLmN1cnJ5XG52YXIgb2JqZWN0ICAgICAgPSB7fVxuXG52YXIgZXh0ZW5kID0gY3VycnkoZnVuY3Rpb24gKGhvc3QsIG9iaikge1xuICB2YXIga3MgPSBPYmplY3Qua2V5cyhvYmopXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBrcy5sZW5ndGg7ICsraSkge1xuICAgIGhvc3Rba3NbaV1dID0gb2JqW2tzW2ldXVxuICB9XG4gIHJldHVybiBob3N0XG59KVxuXG52YXIgaGFzS2V5ID0gY3VycnkoZnVuY3Rpb24gKGtleSwgZSkge1xuICByZXR1cm4gZVtrZXldICE9PSB1bmRlZmluZWRcbn0pXG5cbnZhciBoYXNLZXlzID0gY3VycnkoZnVuY3Rpb24gKGtleXMsIGUpIHtcbiAgdmFyIHJlcyA9IHRydWVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyArK2kpIHtcbiAgICByZXMgPSByZXMgJiYgZVtrZXlzW2ldXSAhPT0gdW5kZWZpbmVkXG4gIH1cbiAgcmV0dXJuIHJlc1xufSlcblxub2JqZWN0Lmhhc0tleSAgPSBoYXNLZXlcbm9iamVjdC5oYXNLZXlzID0gaGFzS2V5c1xub2JqZWN0LmV4dGVuZCAgPSBleHRlbmRcblxubW9kdWxlLmV4cG9ydHMgPSBvYmplY3RcbiIsInZhciBmbnMgICAgICAgID0gcmVxdWlyZShcIi4vZnVuY3Rpb25zXCIpXG52YXIgY3VycnkgICAgICA9IGZucy5jdXJyeVxudmFyIGNvbXBvc2UgICAgPSBmbnMuY29tcG9zZVxudmFyIGluc3RhbmNlT2YgPSBmbnMuaW5zdGFuY2VPZlxudmFyIHRyYW5zICAgICAgPSB7fVxuXG52YXIgcmVkSWRlbnRpdHkgPSBmdW5jdGlvbiAoYWNjLCB4KSB7IHJldHVybiB4IH1cblxudmFyIHJlZHVjZUFycmF5ID0gZnVuY3Rpb24gKGZuLCBhY2N1bSwgYXJyKSB7XG4gIHZhciBpbmRleCA9IC0xXG4gIHZhciBsZW4gICA9IGFyci5sZW5ndGhcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbikge1xuICAgIGFjY3VtID0gZm4oYWNjdW0sIGFycltpbmRleF0pXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59XG5cbnZhciByZWR1Y2VPYmplY3QgPSBmdW5jdGlvbiAoZm4sIGFjY3VtLCBvYmopIHtcbiAgdmFyIGluZGV4ID0gLTFcbiAgdmFyIGtzICAgID0gT2JqZWN0LmtleXMob2JqKVxuICB2YXIgbGVuICAgPSBrcy5sZW5ndGhcbiAgdmFyIGtleVxuICB2YXIga3ZcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbikge1xuICAgIGtleSAgICAgPSBrc1tpbmRleF1cbiAgICBrdiAgICAgID0ge31cbiAgICBrdltrZXldID0gb2JqW2tleV1cbiAgICBhY2N1bSAgID0gZm4oYWNjdW0sIGt2KVxuICB9XG4gIHJldHVybiBhY2N1bVxufVxuXG52YXIgY29uc0FycmF5ID0gZnVuY3Rpb24gKGFycmF5LCBlbCkge1xuICBhcnJheS5wdXNoKGVsKVxuICByZXR1cm4gYXJyYXlcbn1cblxudmFyIGNvbnNPYmplY3QgPSBmdW5jdGlvbiAoaG9zdCwgb2JqKSB7XG4gIHZhciBrcyA9IE9iamVjdC5rZXlzKG9iailcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGtzLmxlbmd0aDsgKytpKSB7XG4gICAgaG9zdFtrc1tpXV0gPSBvYmpba3NbaV1dXG4gIH1cbiAgcmV0dXJuIGhvc3Rcbn1cblxudmFyIHJlZHVjZSA9IGN1cnJ5KGZ1bmN0aW9uIChmbiwgYWNjdW0sIGNvbCkge1xuICBpZiAgICAgIChpbnN0YW5jZU9mKEFycmF5LCBjb2wpKSAgICAgICAgcmV0dXJuIHJlZHVjZUFycmF5KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKEZsb2F0MzJBcnJheSwgY29sKSkgcmV0dXJuIHJlZHVjZUFycmF5KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKFVpbnQzMkFycmF5LCBjb2wpKSAgcmV0dXJuIHJlZHVjZUFycmF5KGZuLCBhY2N1bSwgY29sKVxuICBlbHNlIGlmIChjb2wuX19yZWR1Y2UgIT09IHVuZGVmaW5lZCkgICAgcmV0dXJuIGNvbC5fX3JlZHVjZShmbiwgYWNjdW0sIGNvbClcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihPYmplY3QsIGNvbCkpICAgICAgIHJldHVybiByZWR1Y2VPYmplY3QoZm4sIGFjY3VtLCBjb2wpXG4gIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIGNvbGxlY3Rpb24gdHlwZVwiKVxufSlcblxudmFyIGNvbnMgPSBjdXJyeShmdW5jdGlvbiAoY29sLCBlbCkge1xuICBpZiAgICAgIChpbnN0YW5jZU9mKEFycmF5LCBjb2wpKSAgIHJldHVybiBjb25zQXJyYXkoY29sLCBlbClcbiAgZWxzZSBpZiAoY29sLl9fY29ucyAhPT0gdW5kZWZpbmVkKSByZXR1cm4gY29sLl9fY29ucyhjb2wsIGVsKVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKE9iamVjdCwgY29sKSkgIHJldHVybiBjb25zT2JqZWN0KGNvbCwgZWwpXG4gIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5rbm93biBjb2xsZWN0aW9uIHR5cGVcIilcbn0pXG5cbnZhciBlbXB0eSA9IGZ1bmN0aW9uIChjb2wpIHtcbiAgaWYgICAgICAoaW5zdGFuY2VPZihBcnJheSwgY29sKSkgICAgICAgIHJldHVybiBbXVxuICBlbHNlIGlmIChpbnN0YW5jZU9mKEZsb2F0MzJBcnJheSwgY29sKSkgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXlcbiAgZWxzZSBpZiAoaW5zdGFuY2VPZihVaW50MzJBcnJheSwgY29sKSkgIHJldHVybiBuZXcgVWludDMyQXJyYXlcbiAgZWxzZSBpZiAoY29sLl9fZW1wdHkgIT09IHVuZGVmaW5lZCkgICAgIHJldHVybiBjb2wuX19lbXB0eSgpXG4gIGVsc2UgaWYgKGluc3RhbmNlT2YoT2JqZWN0LCBjb2wpKSAgICAgICByZXR1cm4ge31cbiAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVua25vd24gY29sbGVjdGlvbiB0eXBlXCIpXG59XG5cbnZhciBtYXBwaW5nID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIHN0ZXBGbikge1xuICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgIHJldHVybiBzdGVwRm4oYWNjLCB0cmFuc0ZuKHgpKVxuICB9XG59KVxuXG52YXIgcGx1Y2tpbmcgPSBjdXJyeShmdW5jdGlvbiAocHJvcE5hbWUsIHN0ZXBGbikge1xuICByZXR1cm4gbWFwcGluZyhmdW5jdGlvbiAoeCkgeyByZXR1cm4geFtwcm9wTmFtZV0gfSwgc3RlcEZuKVxufSlcblxudmFyIGZpbHRlcmluZyA9IGN1cnJ5KGZ1bmN0aW9uIChwcmVkRm4sIHN0ZXBGbikge1xuICByZXR1cm4gZnVuY3Rpb24gKGFjYywgeCkge1xuICAgIHJldHVybiBwcmVkRm4oeCkgPyBzdGVwRm4oYWNjLCB4KSA6IGFjYyBcbiAgfVxufSlcblxudmFyIGNoZWNraW5nID0gY3VycnkoZnVuY3Rpb24gKHByb3AsIHZhbCwgc3RlcEZuKSB7XG4gIHJldHVybiBmaWx0ZXJpbmcoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHhbcHJvcF0gPT09IHZhbCB9LCBzdGVwRm4pXG59KVxuXG4vL1RISVMgV0lMTCBNVVRBVEUgVEhFIFNUUlVDVFVSRSBQUk9WSURFRCBUTyBJVCBESVJFQ1RMWVxudmFyIG11dGF0aW5nID0gY3VycnkoZnVuY3Rpb24gKG11dEZuLCBzdGVwRm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICBtdXRGbih4KVxuICAgIHJldHVybiBzdGVwRm4oYWNjLCB4KVxuICB9XG59KVxuXG52YXIgY2F0ID0gZnVuY3Rpb24gKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgcmV0dXJuIHJlZHVjZShmbiwgYWNjLCB4KSBcbiAgfVxufVxuXG52YXIgbWFwID0gY3VycnkoZnVuY3Rpb24gKGZuLCBjb2wpIHtcbiAgcmV0dXJuIHJlZHVjZShtYXBwaW5nKGZuLCBjb25zKSwgZW1wdHkoY29sKSwgY29sKVxufSlcblxudmFyIG1hcGNhdHRpbmcgPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgc3RlcEZuKSB7XG4gIHJldHVybiBjb21wb3NlKFtjYXQsIG1hcHBpbmcodHJhbnNGbildKShzdGVwRm4pXG59KVxuXG52YXIgZmlsdGVyID0gY3VycnkoZnVuY3Rpb24gKHByZWRGbiwgY29sKSB7XG4gIHJldHVybiByZWR1Y2UoZmlsdGVyaW5nKHByZWRGbiwgY29ucyksIGVtcHR5KGNvbCksIGNvbClcbn0pXG5cbnZhciBtdXRhdGUgPSBjdXJyeShmdW5jdGlvbiAodHJhbnNGbiwgY29sKSB7XG4gIHJldHVybiByZWR1Y2UodHJhbnNGbihyZWRJZGVudGl0eSksIHVuZGVmaW5lZCwgY29sKVxufSlcblxudmFyIHRyYW5zZHVjZSA9IGN1cnJ5KGZ1bmN0aW9uICh0cmFuc0ZuLCBzdGVwRm4sIGluaXQsIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKHRyYW5zRm4oc3RlcEZuKSwgaW5pdCwgY29sKVxufSlcblxudmFyIHNlcXVlbmNlID0gY3VycnkoZnVuY3Rpb24gKHRyYW5zRm4sIGNvbCkge1xuICByZXR1cm4gcmVkdWNlKHRyYW5zRm4oY29ucyksIGVtcHR5KGNvbCksIGNvbClcbn0pXG5cbnZhciBpbnRvID0gY3VycnkoZnVuY3Rpb24gKHRvLCB0cmFuc0ZuLCBmcm9tKSB7XG4gIHJldHVybiB0cmFuc2R1Y2UodHJhbnNGbiwgY29ucywgdG8sIGZyb20pXG59KVxuXG50cmFucy5yZWR1Y2UgICAgID0gcmVkdWNlXG50cmFucy5jb25zICAgICAgID0gY29uc1xudHJhbnMuZW1wdHkgICAgICA9IGVtcHR5XG50cmFucy5tYXBwaW5nICAgID0gbWFwcGluZ1xudHJhbnMucGx1Y2tpbmcgICA9IHBsdWNraW5nXG50cmFucy5jYXQgICAgICAgID0gY2F0XG50cmFucy5maWx0ZXJpbmcgID0gZmlsdGVyaW5nXG50cmFucy5jaGVja2luZyAgID0gY2hlY2tpbmdcbnRyYW5zLm1hcCAgICAgICAgPSBtYXBcbnRyYW5zLm1hcGNhdHRpbmcgPSBtYXBjYXR0aW5nXG50cmFucy5tdXRhdGluZyAgID0gbXV0YXRpbmdcbnRyYW5zLm11dGF0ZSAgICAgPSBtdXRhdGVcbnRyYW5zLmZpbHRlciAgICAgPSBmaWx0ZXJcbnRyYW5zLnRyYW5zZHVjZSAgPSB0cmFuc2R1Y2VcbnRyYW5zLnNlcXVlbmNlICAgPSBzZXF1ZW5jZVxudHJhbnMuaW50byAgICAgICA9IGludG9cbm1vZHVsZS5leHBvcnRzICAgPSB0cmFuc1xuIiwidmFyIHByb2Rhc2ggICAgICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIGFzeW5jICAgICAgICAgPSByZXF1aXJlKFwiYXN5bmNcIilcbnZhciBncmFwaCAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvZ3JhcGhcIilcbnZhciBsb2FkZXJzICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbG9hZGVyc1wiKVxudmFyIHV0aWxzICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9nbC11dGlsc1wiKVxudmFyIHJhbmRvbSAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9yYW5kb21cIilcbnZhciBwaHlzaWNzICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvcGh5c2ljc1wiKVxudmFyIGxpZmV0aW1lICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9saWZldGltZVwiKVxudmFyIGVtaXR0ZXJzICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9lbWl0dGVyc1wiKVxudmFyIGNsb2NrICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9jbG9ja1wiKVxudmFyIGNhbWVyYSAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9jYW1lcmFcIilcbnZhciBsaWdodCAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvbGlnaHRcIilcbnZhciB2ZWMzICAgICAgICAgID0gcmVxdWlyZShcIi4uL21vZHVsZXMvdmVjM1wiKVxudmFyIEdyYXBoICAgICAgICAgPSBncmFwaC5HcmFwaFxudmFyIGF0dGFjaEJ5SWQgICAgPSBncmFwaC5hdHRhY2hCeUlkXG52YXIgcGFydGlhbCAgICAgICA9IHByb2Rhc2guZnVuY3Rpb25zLnBhcnRpYWxcbnZhciB0cmFuc2R1Y2UgICAgID0gcHJvZGFzaC50cmFuc2R1Y2Vycy50cmFuc2R1Y2VcbnZhciBQYXJ0aWNsZSAgICAgID0gZW1pdHRlcnMuUGFydGljbGVcbnZhciBFbWl0dGVyICAgICAgID0gZW1pdHRlcnMuRW1pdHRlclxudmFyIHVwZGF0ZUVtaXR0ZXIgPSBlbWl0dGVycy51cGRhdGVFbWl0dGVyXG52YXIgbG9hZFNoYWRlciAgICA9IGxvYWRlcnMubG9hZFNoYWRlclxudmFyIHVwZGF0ZUJ1ZmZlciAgPSB1dGlscy51cGRhdGVCdWZmZXJcbnZhciBjbGVhckNvbnRleHQgID0gdXRpbHMuY2xlYXJDb250ZXh0XG52YXIgTG9hZGVkUHJvZ3JhbSA9IHV0aWxzLkxvYWRlZFByb2dyYW1cbnZhciByYW5kQm91bmQgICAgID0gcmFuZG9tLnJhbmRCb3VuZFxudmFyIHVwZGF0ZVBoeXNpY3MgPSBwaHlzaWNzLnVwZGF0ZVBoeXNpY3NcbnZhciBraWxsVGhlT2xkICAgID0gbGlmZXRpbWUua2lsbFRoZU9sZFxudmFyIENsb2NrICAgICAgICAgPSBjbG9jay5DbG9ja1xudmFyIHVwZGF0ZUNsb2NrICAgPSBjbG9jay51cGRhdGVDbG9ja1xudmFyIENhbWVyYSAgICAgICAgPSBjYW1lcmEuQ2FtZXJhXG52YXIgdXBkYXRlQ2FtZXJhICA9IGNhbWVyYS51cGRhdGVDYW1lcmFcbnZhciBQb2ludExpZ2h0ICAgID0gbGlnaHQuUG9pbnRMaWdodFxudmFyIHNldFZlYzMgICAgICAgPSB2ZWMzLnNldFZlYzNcbnZhciBjYW52YXMgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwbGF5Z3JvdW5kXCIpXG52YXIgc3RhdHMgICAgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhdHNcIilcbnZhciBnbCAgICAgICAgICAgID0gY2FudmFzLmdldENvbnRleHQoXCJ3ZWJnbFwiKVxudmFyIHNoYWRlcnMgICAgICAgPSB7XG4gIHZlcnRleDogICBcIi9zaGFkZXJzLzAxdi5nbHNsXCIsXG4gIGZyYWdtZW50OiBcIi9zaGFkZXJzLzAxZi5nbHNsXCJcbn1cblxuLy8oV29ybGQgLT4gTm9kZSkgLT4gU3RyaW5nIC0+IFdvcmxkIC0+IFZvaWRcbnZhciBmb3JFYWNoTm9kZSA9IGZ1bmN0aW9uIChmbiwgbm9kZUlkLCB3b3JsZCkge1xuICB2YXIgbm9kZSA9IHdvcmxkLmdyYXBoLm5vZGVzW25vZGVJZF1cblxuICBmbih3b3JsZCwgbm9kZSlcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgZm9yRWFjaE5vZGUoZm4sIG5vZGUuY2hpbGRJZHNbaV0sIHdvcmxkKVxuICB9XG59XG5cblxuXG4vLyhXb3JsZCAtPiBOb2RlKSAtPiBXb3JsZCAtPiBWb2lkXG52YXIgdXBkYXRlRW50aXRpZXMgPSBmdW5jdGlvbiAoZm4sIHdvcmxkKSB7XG4gIGZvckVhY2hOb2RlKGZuLCB3b3JsZC5ncmFwaC5yb290Tm9kZUlkLCB3b3JsZClcbn1cblxuZnVuY3Rpb24gbWFrZVVwZGF0ZSAod29ybGQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHVwZGF0ZSAoKSB7XG4gICAgdXBkYXRlQ2xvY2sod29ybGQuY2xvY2ssIHBlcmZvcm1hbmNlLm5vdygpKVxuICAgIHVwZGF0ZUNhbWVyYSh3b3JsZCwgd29ybGQuY2FtZXJhKVxuICAgIHVwZGF0ZUVudGl0aWVzKGtpbGxUaGVPbGQsIHdvcmxkKVxuICAgIHVwZGF0ZUVudGl0aWVzKHVwZGF0ZVBoeXNpY3MsIHdvcmxkKVxuICAgIHVwZGF0ZUVudGl0aWVzKHVwZGF0ZUVtaXR0ZXIsIHdvcmxkKVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VSZW5kZXIgKGdsLCB3b3JsZCkge1xuICB2YXIgbHAgICAgICAgICAgICAgICA9IHdvcmxkLnByb2dyYW1zLnBhcnRpY2xlXG4gIHZhciByYXdQb3NpdGlvbnMgICAgID0gW11cbiAgdmFyIGxpZ2h0Q29sb3JzICAgICAgPSBbXVxuICB2YXIgbGlnaHRQb3NpdGlvbnMgICA9IFtdXG4gIHZhciBsaWdodEludGVuc2l0aWVzID0gW11cbiAgdmFyIGJ1aWxkQnVmZmVycyA9IGZ1bmN0aW9uICh3b3JsZCwgbm9kZSkge1xuICAgIGlmIChub2RlLmxpdmluZyAmJiBub2RlLnJlbmRlcmFibGUpIHtcbiAgICAgIHJhd1Bvc2l0aW9ucy5wdXNoKG5vZGUucG9zaXRpb25bMF0pIFxuICAgICAgcmF3UG9zaXRpb25zLnB1c2gobm9kZS5wb3NpdGlvblsxXSkgXG4gICAgICByYXdQb3NpdGlvbnMucHVzaChub2RlLnBvc2l0aW9uWzJdKSBcbiAgICB9XG4gICAgaWYgKCEhbm9kZS5saWdodCkge1xuICAgICAgbGlnaHRQb3NpdGlvbnMucHVzaChub2RlLnBvc2l0aW9uWzBdKVxuICAgICAgbGlnaHRQb3NpdGlvbnMucHVzaChub2RlLnBvc2l0aW9uWzFdKVxuICAgICAgbGlnaHRQb3NpdGlvbnMucHVzaChub2RlLnBvc2l0aW9uWzJdKVxuICAgICAgbGlnaHRDb2xvcnMucHVzaChub2RlLnJnYlswXSlcbiAgICAgIGxpZ2h0Q29sb3JzLnB1c2gobm9kZS5yZ2JbMV0pXG4gICAgICBsaWdodENvbG9ycy5wdXNoKG5vZGUucmdiWzJdKVxuICAgICAgbGlnaHRJbnRlbnNpdGllcy5wdXNoKG5vZGUuaW50ZW5zaXR5KVxuICAgIH1cbiAgfVxuICB2YXIgcG9zaXRpb25zIFxuICB2YXIgbENcbiAgdmFyIGxQXG4gIHZhciBsSVxuXG4gIHJldHVybiBmdW5jdGlvbiByZW5kZXIgKCkge1xuICAgIHJhd1Bvc2l0aW9ucyAgICAgPSBbXVxuICAgIGxpZ2h0Q29sb3JzICAgICAgPSBbXVxuICAgIGxpZ2h0UG9zaXRpb25zICAgPSBbXVxuICAgIGxpZ2h0SW50ZW5zaXRpZXMgPSBbXVxuICAgIHVwZGF0ZUVudGl0aWVzKGJ1aWxkQnVmZmVycywgd29ybGQpXG4gICAgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShyYXdQb3NpdGlvbnMpXG4gICAgbEMgICAgICAgID0gbmV3IEZsb2F0MzJBcnJheShsaWdodENvbG9ycylcbiAgICBsUCAgICAgICAgPSBuZXcgRmxvYXQzMkFycmF5KGxpZ2h0UG9zaXRpb25zKVxuICAgIGxJICAgICAgICA9IG5ldyBGbG9hdDMyQXJyYXkobGlnaHRJbnRlbnNpdGllcylcblxuICAgIHdpbmRvdy5sUCA9IGxQXG4gICAgd2luZG93LmxDID0gbENcbiAgICB3aW5kb3cubEkgPSBsSVxuICAgIGNsZWFyQ29udGV4dChnbClcbiAgICBnbC51c2VQcm9ncmFtKHdvcmxkLnByb2dyYW1zLnBhcnRpY2xlLnByb2dyYW0pXG4gICAgZ2wudW5pZm9ybTNmdihscC51bmlmb3Jtc1tcInVMaWdodFBvc2l0aW9uc1swXVwiXSwgbFApXG4gICAgZ2wudW5pZm9ybTNmdihscC51bmlmb3Jtc1tcInVMaWdodENvbG9yc1swXVwiXSwgbEMpXG4gICAgZ2wudW5pZm9ybTFmdihscC51bmlmb3Jtc1tcInVMaWdodEludGVuc2l0aWVzWzBdXCJdLCBsSSlcbiAgICBnbC51bmlmb3JtNGYobHAudW5pZm9ybXMudUNvbG9yLCAwLjAsIDAuMCwgMC4wLCAxLjApXG4gICAgZ2wudW5pZm9ybTJmKGxwLnVuaWZvcm1zLnVTY3JlZW5TaXplLCBjYW52YXMuY2xpZW50V2lkdGgsIGNhbnZhcy5jbGllbnRIZWlnaHQpXG4gICAgZ2wudW5pZm9ybU1hdHJpeDRmdihscC51bmlmb3Jtcy51VmlldywgZmFsc2UsIHdvcmxkLmNhbWVyYS52aWV3KVxuICAgIGdsLnVuaWZvcm1NYXRyaXg0ZnYobHAudW5pZm9ybXMudVByb2plY3Rpb24sIGZhbHNlLCB3b3JsZC5jYW1lcmEucHJvamVjdGlvbilcbiAgICBnbC51bmlmb3JtMWYobHAudW5pZm9ybXMudVNpemUsIDEuMClcbiAgICB1cGRhdGVCdWZmZXIoZ2wsIDMsIGxwLmF0dHJpYnV0ZXMuYVBvc2l0aW9uLCBscC5idWZmZXJzLmFQb3NpdGlvbiwgcG9zaXRpb25zKVxuICAgIGdsLmRyYXdBcnJheXMoZ2wuUE9JTlRTLCAwLCBwb3NpdGlvbnMubGVuZ3RoIC8gMylcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKSBcbiAgfVxufVxuXG5hc3luYy5wYXJhbGxlbCh7XG4gIHZlcnRleDogICBwYXJ0aWFsKGxvYWRTaGFkZXIsIFwiL3NoYWRlcnMvMDF2Lmdsc2xcIiksXG4gIGZyYWdtZW50OiBwYXJ0aWFsKGxvYWRTaGFkZXIsIFwiL3NoYWRlcnMvMDFmLmdsc2xcIilcbn0sIGZ1bmN0aW9uIChlcnIsIHNoYWRlcnMpIHtcbiAgdmFyIGZvdiAgICAgICAgICAgICA9IE1hdGguUEkgLyAyXG4gIHZhciBhc3BlY3QgICAgICAgICAgPSBjYW52YXMuY2xpZW50V2lkdGggLyBjYW52YXMuY2xpZW50SGVpZ2h0XG4gIHZhciBwYXJ0aWNsZVByb2dyYW0gPSBMb2FkZWRQcm9ncmFtKGdsLCBzaGFkZXJzLnZlcnRleCwgc2hhZGVycy5mcmFnbWVudClcbiAgdmFyIHdvcmxkICAgICAgICAgICA9IHtcbiAgICBjbG9jazogICAgQ2xvY2socGVyZm9ybWFuY2Uubm93KCkpLFxuICAgIGNhbWVyYTogICBDYW1lcmEoMCwgMCwgMiwgZm92LCBhc3BlY3QsIDEsIDEwKSxcbiAgICBncmFwaDogICAgR3JhcGgoKSxcbiAgICBwcm9ncmFtczoge1xuICAgICAgcGFydGljbGU6IHBhcnRpY2xlUHJvZ3JhbVxuICAgIH1cbiAgfVxuICB2YXIgbDEgPSBQb2ludExpZ2h0KDEsIDAsIDApXG4gIHZhciBsMiA9IFBvaW50TGlnaHQoMCwgMSwgMClcbiAgdmFyIGwzID0gUG9pbnRMaWdodCgwLCAwLCAxKVxuXG4gIHNldFZlYzMoMS4wLCAwLjAsIDAuMCwgbDEucmdiKVxuICBzZXRWZWMzKDAuMCwgMS4wLCAwLjAsIGwyLnJnYilcbiAgc2V0VmVjMygwLjAsIDAuMCwgMS4wLCBsMy5yZ2IpXG4gIGF0dGFjaEJ5SWQod29ybGQuZ3JhcGgsIHdvcmxkLmdyYXBoLnJvb3ROb2RlSWQsIGwxKVxuICBhdHRhY2hCeUlkKHdvcmxkLmdyYXBoLCB3b3JsZC5ncmFwaC5yb290Tm9kZUlkLCBsMilcbiAgYXR0YWNoQnlJZCh3b3JsZC5ncmFwaCwgd29ybGQuZ3JhcGgucm9vdE5vZGVJZCwgbDMpXG5cbiAgdmFyIHNwYXduQXQgPSBmdW5jdGlvbiAoc3BlZWQsIHgsIHksIGR4LCBkeSkge1xuICAgIHZhciBlID0gRW1pdHRlcigxMDAwLCAxMCwgc3BlZWQsIC4xLCB4LCB5LCAwLCBkeCwgZHksIHJhbmRCb3VuZCgtMC4yLCAwLjIpKSAgXG5cbiAgICBhdHRhY2hCeUlkKHdvcmxkLmdyYXBoLCB3b3JsZC5ncmFwaC5yb290Tm9kZUlkLCBlKVxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgNTA7ICsraikge1xuICAgICAgYXR0YWNoQnlJZCh3b3JsZC5ncmFwaCwgZS5pZCwgUGFydGljbGUoMTAwMCwgMCwgMCwgMCkpXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1aWxkRW1pdHRlcnMgPSBmdW5jdGlvbiAodHJhbnNGbikge1xuICAgIHZhciBjb3VudCAgPSAxNlxuICAgIHZhciBzcHJlYWQgPSAyXG4gICAgdmFyIGRpZmYgICA9IHNwcmVhZCAvIGNvdW50XG4gICAgdmFyIGVcblxuICAgIGZvciAodmFyIGkgPSAtMSAqIGNvdW50OyBpIDwgMSAqIGNvdW50OyBpKz0uMDIgKiBjb3VudCkge1xuICAgICAgc3Bhd25BdCguMDA0LCB0cmFuc0ZuKGkpICogZGlmZiwgaSAvIGNvdW50LCAxLCBpIC8gY291bnQpXG4gICAgfVxuICB9XG4gIGJ1aWxkRW1pdHRlcnMoTWF0aC5zaW4pXG4gIHNldEludGVydmFsKG1ha2VVcGRhdGUod29ybGQpLCAyNSlcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VSZW5kZXIoZ2wsIHdvcmxkKSlcbn0pXG4iLCJ2YXIgbWF0NCAgICAgPSByZXF1aXJlKFwiZ2wtbWF0NFwiKVxudmFyIHZlYzMgICAgID0gcmVxdWlyZShcIi4vdmVjM1wiKVxudmFyIFZlYzMgICAgID0gdmVjMy5WZWMzXG52YXIgcm90U3BlZWQgPSBNYXRoLlBJIC8gMzAwMFxudmFyIGNhbWVyYSAgID0ge31cblxuXG52YXIgQ2FtZXJhID0gZnVuY3Rpb24gKHgsIHksIHosIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENhbWVyYSkpIHJldHVybiBuZXcgQ2FtZXJhKHgsIHksIHosIGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpXG5cbiAgdGhpcy5wb3NpdGlvbiAgID0gVmVjMyh4LCB5ICx6KVxuICB0aGlzLmZvdiAgICAgICAgPSBmb3ZcbiAgdGhpcy5uZWFyICAgICAgID0gbmVhclxuICB0aGlzLmZhciAgICAgICAgPSBmYXJcbiAgdGhpcy5hc3BlY3QgICAgID0gYXNwZWN0XG4gIHRoaXMucHJvamVjdGlvbiA9IG1hdDQucGVyc3BlY3RpdmUobWF0NC5jcmVhdGUoKSwgZm92LCBhc3BlY3QsIG5lYXIsIGZhcilcblxuICB0aGlzLmV5ZSAgICAgICAgPSBWZWMzKHgsIHksIHopXG4gIHRoaXMubG9va0F0ICAgICA9IFZlYzMoMCwgMCwgMClcbiAgdGhpcy51cCAgICAgICAgID0gVmVjMygwLCAxLCAwKVxuICB0aGlzLnZpZXcgICAgICAgPSBtYXQ0Lmxvb2tBdChtYXQ0LmNyZWF0ZSgpLCB0aGlzLmV5ZSwgdGhpcy5sb29rQXQsIHRoaXMudXApXG59XG5cbnZhciB1cGRhdGVDYW1lcmEgPSBmdW5jdGlvbiAod29ybGQsIGNhbWVyYSkge1xuICB2YXIgZFQgICA9IHdvcmxkLmNsb2NrLmRUXG4gIHZhciB2aWV3ID0gd29ybGQuY2FtZXJhLnZpZXdcblxuICBtYXQ0LnJvdGF0ZVkodmlldywgdmlldywgcm90U3BlZWQgKiBkVClcbn1cblxuXG5jYW1lcmEuQ2FtZXJhICAgICAgID0gQ2FtZXJhXG5jYW1lcmEudXBkYXRlQ2FtZXJhID0gdXBkYXRlQ2FtZXJhXG5tb2R1bGUuZXhwb3J0cyA9IGNhbWVyYVxuIiwidmFyIGNsb2NrID0ge31cblxudmFyIENsb2NrID0gZnVuY3Rpb24gKG5vdykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQ2xvY2spKSByZXR1cm4gbmV3IENsb2NrKG5vdylcbiAgdGhpcy5vbGRUaW1lID0gbm93XG4gIHRoaXMubmV3VGltZSA9IG5vd1xuICB0aGlzLmRUICAgICAgPSB0aGlzLm5ld1RpbWUgLSB0aGlzLm9sZFRpbWVcbn1cblxudmFyIHVwZGF0ZUNsb2NrID0gZnVuY3Rpb24gKGNsb2NrLCBuZXdUaW1lKSB7XG4gIGNsb2NrLm9sZFRpbWUgPSBjbG9jay5uZXdUaW1lXG4gIGNsb2NrLm5ld1RpbWUgPSBuZXdUaW1lXG4gIGNsb2NrLmRUICAgICAgPSBjbG9jay5uZXdUaW1lIC0gY2xvY2sub2xkVGltZVxufVxuXG5jbG9jay5DbG9jayAgICAgICA9IENsb2NrXG5jbG9jay51cGRhdGVDbG9jayA9IHVwZGF0ZUNsb2NrXG5cbm1vZHVsZS5leHBvcnRzID0gY2xvY2tcbiIsInZhciB1dWlkICAgICAgPSByZXF1aXJlKFwibm9kZS11dWlkXCIpXG52YXIgcHJvZGFzaCAgID0gcmVxdWlyZShcInByb2Rhc2hcIilcbnZhciByYW5kb20gICAgPSByZXF1aXJlKFwiLi9yYW5kb21cIilcbnZhciB2ZWMzICAgICAgPSByZXF1aXJlKFwiLi92ZWMzXCIpXG52YXIgVmVjMyAgICAgID0gdmVjMy5WZWMzXG52YXIgZmluZCAgICAgID0gcHJvZGFzaC5hcnJheS5maW5kXG52YXIgY3VycnkgICAgID0gcHJvZGFzaC5mdW5jdGlvbnMuY3VycnlcbnZhciByYW5kQm91bmQgPSByYW5kb20ucmFuZEJvdW5kXG52YXIgZW1pdHRlcnMgID0ge31cblxudmFyIFBhcnRpY2xlID0gZnVuY3Rpb24gKGxpZmVzcGFuLCBweCwgcHksIHB6KSB7XG4gIHJldHVybiB7XG4gICAgaWQ6ICAgICAgICAgICB1dWlkLnY0KCksXG4gICAgcG9zaXRpb246ICAgICBWZWMzKHB4LCBweSwgcHopLFxuICAgIHZlbG9jaXR5OiAgICAgVmVjMygwLCAwLCAwKSxcbiAgICBhY2NlbGVyYXRpb246IFZlYzMoMCwgLTAuMDAwMDAxNSwgMCksXG4gICAgcmVuZGVyYWJsZTogICB0cnVlLFxuICAgIHNpemU6ICAgICAgICAgNC4wLFxuICAgIHRpbWVUb0RpZTogICAgMCxcbiAgICBsaWZlc3BhbjogICAgIGxpZmVzcGFuLFxuICAgIGxpdmluZzogICAgICAgZmFsc2VcbiAgfVxufVxuXG52YXIgRW1pdHRlciA9IGZ1bmN0aW9uIChsaWZlc3BhbiwgcmF0ZSwgc3BlZWQsIHNwcmVhZCwgcHgsIHB5LCBweiwgZHgsIGR5LCBkeikge1xuICByZXR1cm4ge1xuICAgIGlkOiAgICAgICAgICAgdXVpZC52NCgpLFxuICAgIGVtaXR0ZXI6ICAgICAgdHJ1ZSxcbiAgICByYXRlOiAgICAgICAgIHJhdGUsIFxuICAgIHNwZWVkOiAgICAgICAgc3BlZWQsXG4gICAgc3ByZWFkOiAgICAgICBzcHJlYWQsXG4gICAgbmV4dEZpcmVUaW1lOiAwLFxuICAgIHBvc2l0aW9uOiAgICAgVmVjMyhweCwgcHksIHB6KSxcbiAgICB2ZWxvY2l0eTogICAgIFZlYzMoMCwgMCwgMCksXG4gICAgYWNjZWxlcmF0aW9uOiBWZWMzKDAsIDAsIDApLFxuICAgIGRpcmVjdGlvbjogICAgVmVjMyhkeCwgZHksIGR6KSxcbiAgICByZW5kZXJhYmxlOiAgIGZhbHNlLFxuICAgIGxpdmluZzogICAgICAgdHJ1ZVxuICB9XG59XG5cblxudmFyIHNjYWxlQW5kU3ByZWFkID0gZnVuY3Rpb24gKHNjYWxlLCBzcHJlYWQsIHZhbCkge1xuICByZXR1cm4gc2NhbGUgKiAodmFsICsgcmFuZEJvdW5kKC0xICogc3ByZWFkLCBzcHJlYWQpKVxufVxuXG52YXIgZmluZEZpcnN0RGVhZCA9IGZ1bmN0aW9uIChncmFwaCwgY2hpbGRJZHMpIHtcbiAgdmFyIGNoaWxkTm9kZVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRJZHMubGVuZ3RoOyArK2kpIHtcbiAgICBjaGlsZE5vZGUgPSBncmFwaC5ub2Rlc1tjaGlsZElkc1tpXV1cbiAgICBpZiAoIWNoaWxkTm9kZS5saXZpbmcpIHJldHVybiBjaGlsZE5vZGVcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkXG59XG5cbnZhciB1cGRhdGVFbWl0dGVyID0gZnVuY3Rpb24gKHdvcmxkLCBlKSB7XG4gIHZhciB0aW1lID0gd29ybGQuY2xvY2submV3VGltZVxuICB2YXIgcGFydGljbGUgXG5cbiAgaWYgKCFlLmVtaXR0ZXIpIHJldHVyblxuICBpZiAoIWUubGl2aW5nKSAgcmV0dXJuXG4gIGlmICh0aW1lID4gZS5uZXh0RmlyZVRpbWUpIHtcbiAgICBwYXJ0aWNsZSAgICAgICAgICAgICA9IGZpbmRGaXJzdERlYWQod29ybGQuZ3JhcGgsIGUuY2hpbGRJZHMpXG4gICAgcGFydGljbGUudGltZVRvRGllICAgPSB0aW1lICsgcGFydGljbGUubGlmZXNwYW5cbiAgICBwYXJ0aWNsZS5saXZpbmcgICAgICA9IHRydWVcbiAgICBwYXJ0aWNsZS5wb3NpdGlvblswXSA9IGUucG9zaXRpb25bMF1cbiAgICBwYXJ0aWNsZS5wb3NpdGlvblsxXSA9IGUucG9zaXRpb25bMV1cbiAgICBwYXJ0aWNsZS5wb3NpdGlvblsyXSA9IGUucG9zaXRpb25bMl1cbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVswXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblswXSlcbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVsxXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblsxXSlcbiAgICBwYXJ0aWNsZS52ZWxvY2l0eVsyXSA9IHNjYWxlQW5kU3ByZWFkKGUuc3BlZWQsIGUuc3ByZWFkLCBlLmRpcmVjdGlvblsyXSlcbiAgICBlLm5leHRGaXJlVGltZSArPSBlLnJhdGVcbiAgfVxufVxuXG5lbWl0dGVycy5QYXJ0aWNsZSAgICAgID0gUGFydGljbGVcbmVtaXR0ZXJzLkVtaXR0ZXIgICAgICAgPSBFbWl0dGVyXG5lbWl0dGVycy51cGRhdGVFbWl0dGVyID0gdXBkYXRlRW1pdHRlclxubW9kdWxlLmV4cG9ydHMgICAgICAgICA9IGVtaXR0ZXJzXG4iLCJ2YXIgdXRpbHMgPSB7fVxuXG52YXIgY2xlYXJDb250ZXh0ID0gZnVuY3Rpb24gKGdsKSB7XG4gIGdsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMC4wKVxuICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKVxufVxuXG52YXIgdXBkYXRlQnVmZmVyID0gZnVuY3Rpb24gKGdsLCBjaHVua1NpemUsIGF0dHJpYnV0ZSwgYnVmZmVyLCBkYXRhKSB7XG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpXG4gIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBkYXRhLCBnbC5EWU5BTUlDX0RSQVcpXG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGF0dHJpYnV0ZSlcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihhdHRyaWJ1dGUsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxuICByZXR1cm4gYnVmZmVyXG59XG5cbi8vZ2l2ZW4gc3JjIGFuZCB0eXBlLCBjb21waWxlIGFuZCByZXR1cm4gc2hhZGVyXG5mdW5jdGlvbiBjb21waWxlIChnbCwgc2hhZGVyVHlwZSwgc3JjKSB7XG4gIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoc2hhZGVyVHlwZSlcblxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxuICByZXR1cm4gc2hhZGVyXG59XG5cbi8vbGluayB5b3VyIHByb2dyYW0gdy8gb3BlbmdsXG5mdW5jdGlvbiBsaW5rIChnbCwgdnMsIGZzKSB7XG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpXG5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKSBcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKSBcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcbiAgcmV0dXJuIHByb2dyYW1cbn1cblxuLypcbiAqIFdlIHdhbnQgdG8gY3JlYXRlIGEgd3JhcHBlciBmb3IgYSBsb2FkZWQgZ2wgcHJvZ3JhbVxuICogdGhhdCBpbmNsdWRlcyBwb2ludGVycyB0byBhbGwgdGhlIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzXG4gKiBkZWZpbmVkIGZvciB0aGlzIHByb2dyYW0uICBUaGlzIG1ha2VzIGl0IG1vcmUgY29udmVuaWVudFxuICogdG8gY2hhbmdlIHRoZXNlIHZhbHVlc1xuICovXG52YXIgTG9hZGVkUHJvZ3JhbSA9IGZ1bmN0aW9uIChnbCwgdlNyYywgZlNyYykge1xuICB2YXIgdnMgICAgICAgICAgICA9IGNvbXBpbGUoZ2wsIGdsLlZFUlRFWF9TSEFERVIsIHZTcmMpXG4gIHZhciBmcyAgICAgICAgICAgID0gY29tcGlsZShnbCwgZ2wuRlJBR01FTlRfU0hBREVSLCBmU3JjKVxuICB2YXIgcHJvZ3JhbSAgICAgICA9IGxpbmsoZ2wsIHZzLCBmcylcbiAgdmFyIG51bUF0dHJpYnV0ZXMgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9BVFRSSUJVVEVTKVxuICB2YXIgbnVtVW5pZm9ybXMgICA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKVxuICB2YXIgbHAgPSB7XG4gICAgdmVydGV4OiB7XG4gICAgICBzcmM6ICAgIHZTcmMsXG4gICAgICBzaGFkZXI6IHZzIFxuICAgIH0sXG4gICAgZnJhZ21lbnQ6IHtcbiAgICAgIHNyYzogICAgZlNyYyxcbiAgICAgIHNoYWRlcjogZnMgXG4gICAgfSxcbiAgICBwcm9ncmFtOiAgICBwcm9ncmFtLFxuICAgIHVuaWZvcm1zOiAgIHt9LCBcbiAgICBhdHRyaWJ1dGVzOiB7fSxcbiAgICBidWZmZXJzOiAgICB7fVxuICB9XG4gIHZhciBhTmFtZVxuICB2YXIgdU5hbWVcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG51bUF0dHJpYnV0ZXM7ICsraSkge1xuICAgIGFOYW1lICAgICAgICAgICAgICAgID0gZ2wuZ2V0QWN0aXZlQXR0cmliKHByb2dyYW0sIGkpLm5hbWVcbiAgICBscC5hdHRyaWJ1dGVzW2FOYW1lXSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIGFOYW1lKVxuICAgIGxwLmJ1ZmZlcnNbYU5hbWVdICAgID0gZ2wuY3JlYXRlQnVmZmVyKClcbiAgfVxuXG4gIGZvciAodmFyIGogPSAwOyBqIDwgbnVtVW5pZm9ybXM7ICsraikge1xuICAgIHVOYW1lICAgICAgICAgICAgICA9IGdsLmdldEFjdGl2ZVVuaWZvcm0ocHJvZ3JhbSwgaikubmFtZVxuICAgIGxwLnVuaWZvcm1zW3VOYW1lXSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCB1TmFtZSlcbiAgfVxuXG4gIHJldHVybiBscCBcbn1cblxudXRpbHMuY2xlYXJDb250ZXh0ICA9IGNsZWFyQ29udGV4dFxudXRpbHMudXBkYXRlQnVmZmVyICA9IHVwZGF0ZUJ1ZmZlclxudXRpbHMuTG9hZGVkUHJvZ3JhbSA9IExvYWRlZFByb2dyYW1cbm1vZHVsZS5leHBvcnRzICAgICAgPSB1dGlsc1xuIiwidmFyIHByb2Rhc2ggICA9IHJlcXVpcmUoXCJwcm9kYXNoXCIpXG52YXIgdXVpZCAgICAgID0gcmVxdWlyZShcIm5vZGUtdXVpZFwiKVxudmFyIHRyYW5zZHVjZSA9IHByb2Rhc2gudHJhbnNkdWNlcnMudHJhbnNkdWNlXG52YXIgZmlsdGVyaW5nID0gcHJvZGFzaC50cmFuc2R1Y2Vycy5maWx0ZXJpbmdcbnZhciBjb25zICAgICAgPSBwcm9kYXNoLnRyYW5zZHVjZXJzLmNvbnNcbnZhciBleHRlbmQgICAgPSBwcm9kYXNoLm9iamVjdC5leHRlbmRcbnZhciBjdXJyeSAgICAgPSBwcm9kYXNoLmZ1bmN0aW9ucy5jdXJyeVxudmFyIHJlbW92ZSAgICA9IHByb2Rhc2guYXJyYXkucmVtb3ZlXG52YXIgZ3JhcGggICAgID0ge31cblxudmFyIE5vZGUgPSBmdW5jdGlvbiAoaGFzaCkge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTm9kZSkpIHJldHVybiBuZXcgTm9kZShoYXNoKSBcblxuICBleHRlbmQodGhpcywgaGFzaClcbiAgdGhpcy5pZCAgICAgICA9IHRoaXMuaWQgfHwgdXVpZC52NCgpXG4gIHRoaXMucGFyZW50SWQgPSB0aGlzLnBhcmVudElkIHx8IG51bGxcbiAgdGhpcy5jaGlsZElkcyA9IHRoaXMuY2hpbGRJZHMgfHwgW11cbn1cblxudmFyIEdyYXBoID0gZnVuY3Rpb24gKHJvb3ROb2RlKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBHcmFwaCkpIHJldHVybiBuZXcgR3JhcGhcbiAgdmFyIHJvb3ROb2RlID0gcm9vdE5vZGUgfHwgTm9kZSh7IGlkOiB1dWlkLnY0KCkgfSlcblxuICB0aGlzLm5vZGVzICAgICAgICAgICAgICA9IHt9XG4gIHRoaXMucm9vdE5vZGVJZCAgICAgICAgID0gcm9vdE5vZGUuaWRcbiAgdGhpcy5ub2Rlc1tyb290Tm9kZS5pZF0gPSByb290Tm9kZVxufVxuXG4vL3VzZWQgaW50ZXJuYWxseSBieSBncmFwaC5fX3JlZHVjZSB0byBzdXBwb3J0IGl0ZXJhdGlvblxudmFyIG5vZGVSZWR1Y2UgPSBmdW5jdGlvbiAocmVkRm4sIG5vZGVJZCwgYWNjdW0sIGdyYXBoKSB7XG4gIHZhciBub2RlID0gZ3JhcGgubm9kZXNbbm9kZUlkXVxuXG4gIGFjY3VtID0gcmVkRm4oYWNjdW0sIG5vZGUpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2RlLmNoaWxkSWRzLmxlbmd0aDsgKytpKSB7XG4gICAgYWNjdW0gPSBub2RlUmVkdWNlKHJlZEZuLCBub2RlLmNoaWxkSWRzW2ldLCBhY2N1bSwgZ3JhcGgpICAgXG4gIH1cbiAgcmV0dXJuIGFjY3VtXG59XG5cbi8vR3JhcGggLT4gU3RyaW5nIC0+IE5vZGUgLT4gVm9pZFxudmFyIGF0dGFjaEJ5SWQgPSBjdXJyeShmdW5jdGlvbiAoZ3JhcGgsIHBhcmVudElkLCBub2RlKSB7XG4gIGlmKCFncmFwaC5ub2Rlc1twYXJlbnRJZF0pIHRocm93IG5ldyBFcnJvcihwYXJlbnRJZCArIFwiIG5vdCBmb3VuZCBpbiBncmFwaFwiKVxuICB2YXIgbm9kZSA9IG5vZGUgaW5zdGFuY2VvZiBOb2RlID8gbm9kZSA6IE5vZGUobm9kZSlcblxuICBncmFwaC5ub2Rlc1tub2RlLmlkXSAgICAgICAgICA9IG5vZGVcbiAgZ3JhcGgubm9kZXNbbm9kZS5pZF0ucGFyZW50SWQgPSBwYXJlbnRJZFxuICBncmFwaC5ub2Rlc1twYXJlbnRJZF0uY2hpbGRJZHMucHVzaChub2RlLmlkKVxufSlcblxuR3JhcGgucHJvdG90eXBlLl9fcmVkdWNlID0gZnVuY3Rpb24gKHJlZEZuLCBhY2N1bSwgZ3JhcGgpIHtcbiAgcmV0dXJuIG5vZGVSZWR1Y2UocmVkRm4sIGdyYXBoLnJvb3ROb2RlSWQsIGFjY3VtLCBncmFwaClcbn1cblxuR3JhcGgucHJvdG90eXBlLl9fZW1wdHkgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgR3JhcGggfVxuXG5ncmFwaC5Ob2RlICAgICAgID0gTm9kZVxuZ3JhcGguR3JhcGggICAgICA9IEdyYXBoXG5ncmFwaC5hdHRhY2hCeUlkID0gYXR0YWNoQnlJZFxubW9kdWxlLmV4cG9ydHMgICA9IGdyYXBoXG4iLCJ2YXIgZm5zICAgICAgPSByZXF1aXJlKFwicHJvZGFzaFwiKVxudmFyIGN1cnJ5ICAgID0gZm5zLmZ1bmN0aW9ucy5jdXJyeVxudmFyIGxpZmV0aW1lID0ge31cblxubGlmZXRpbWUua2lsbFRoZU9sZCA9IGZ1bmN0aW9uICh3b3JsZCwgZSkge1xuICB2YXIgdGltZSA9IHdvcmxkLmNsb2NrLm5ld1RpbWVcblxuICBpZiAoIWUubGlmZXNwYW4pICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gIGlmIChlLmxpdmluZyAmJiB0aW1lID49IGUudGltZVRvRGllKSBlLmxpdmluZyA9IGZhbHNlXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGlmZXRpbWVcbiIsInZhciB1dWlkICA9IHJlcXVpcmUoXCJub2RlLXV1aWRcIilcbnZhciB2ZWMzICA9IHJlcXVpcmUoJy4vdmVjMycpXG52YXIgVmVjMyAgPSB2ZWMzLlZlYzNcbnZhciBsaWdodCA9IHt9XG5cbnZhciBQb2ludExpZ2h0ID0gZnVuY3Rpb24gKHgsIHksIHopIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFBvaW50TGlnaHQpKSByZXR1cm4gbmV3IFBvaW50TGlnaHQoeCwgeSwgeilcblxuICB0aGlzLmlkICAgICAgICAgICAgPSB1dWlkLnY0KClcbiAgdGhpcy5saWdodCAgICAgICAgID0gdHJ1ZVxuICB0aGlzLnBvc2l0aW9uICAgICAgPSBWZWMzKHgsIHksIHopXG4gIHRoaXMudmVsb2NpdHkgICAgICA9IFZlYzMoMCwgMCAsMClcbiAgdGhpcy5hY2NlbGVyYXRpb25zID0gVmVjMygwLCAwICwwKVxuICB0aGlzLnJvdGF0aW9ucyAgICAgPSBWZWMzKDAsIDAsIDApXG4gIHRoaXMucmdiICAgICAgICAgICA9IFZlYzMoMSwgMSwgMSlcbiAgdGhpcy5pbnRlbnNpdHkgICAgID0gMS4wXG4gIHRoaXMubGl2aW5nICAgICAgICA9IHRydWVcbn1cblxubGlnaHQuUG9pbnRMaWdodCA9IFBvaW50TGlnaHRcbm1vZHVsZS5leHBvcnRzID0gbGlnaHRcbiIsInZhciBsb2FkZXJzICA9IHt9XG5cbmxvYWRlcnMubG9hZFNoYWRlciA9IGZ1bmN0aW9uIChwYXRoLCBjYikge1xuICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0XG5cbiAgeGhyLnJlc3BvbnNlVHlwZSA9IFwic3RyaW5nXCJcbiAgeGhyLm9ubG9hZCAgICAgICA9IGZ1bmN0aW9uICgpIHsgY2IobnVsbCwgeGhyLnJlc3BvbnNlKSB9XG4gIHhoci5vbmVycm9yICAgICAgPSBmdW5jdGlvbiAoKSB7IGNiKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBsb2FkIFwiICsgcGF0aCkpIH1cbiAgeGhyLm9wZW4oXCJHRVRcIiwgcGF0aCwgdHJ1ZSlcbiAgeGhyLnNlbmQobnVsbClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBsb2FkZXJzXG4iLCJ2YXIgZm5zICAgICA9IHJlcXVpcmUoXCJwcm9kYXNoXCIpXG52YXIgY3VycnkgICA9IGZucy5mdW5jdGlvbnMuY3VycnlcbnZhciBwaHlzaWNzID0ge31cblxudmFyIGhhc1BoeXNpY3MgPSBmdW5jdGlvbiAobm9kZSkgeyBcbiAgcmV0dXJuICEhbm9kZS5wb3NpdGlvbiAmJiAhIW5vZGUudmVsb2NpdHkgJiYgISFub2RlLmFjY2VsZXJhdGlvbiBcbn1cbnBoeXNpY3MudXBkYXRlUG9zaXRpb24gPSBmdW5jdGlvbiAoZFQsIGUpIHtcbiAgZS5wb3NpdGlvblswXSA9IGUucG9zaXRpb25bMF0gKyBkVCAqIGUudmVsb2NpdHlbMF1cbiAgZS5wb3NpdGlvblsxXSA9IGUucG9zaXRpb25bMV0gKyBkVCAqIGUudmVsb2NpdHlbMV1cbiAgZS5wb3NpdGlvblsyXSA9IGUucG9zaXRpb25bMl0gKyBkVCAqIGUudmVsb2NpdHlbMl1cbiAgcmV0dXJuIGVcbn1cblxucGh5c2ljcy51cGRhdGVWZWxvY2l0eSA9IGZ1bmN0aW9uIChkVCwgZSkge1xuICBlLnZlbG9jaXR5WzBdID0gZS52ZWxvY2l0eVswXSArIGRUICogZS5hY2NlbGVyYXRpb25bMF1cbiAgZS52ZWxvY2l0eVsxXSA9IGUudmVsb2NpdHlbMV0gKyBkVCAqIGUuYWNjZWxlcmF0aW9uWzFdXG4gIGUudmVsb2NpdHlbMl0gPSBlLnZlbG9jaXR5WzJdICsgZFQgKiBlLmFjY2VsZXJhdGlvblsyXVxuICByZXR1cm4gZVxufVxuXG5waHlzaWNzLnVwZGF0ZVBoeXNpY3MgPSBmdW5jdGlvbiAod29ybGQsIGUpIHtcbiAgaWYgKCFoYXNQaHlzaWNzKGUpKSByZXR1cm5cbiAgaWYgKCFlLmxpdmluZykgICAgICByZXR1cm5cbiAgcGh5c2ljcy51cGRhdGVWZWxvY2l0eSh3b3JsZC5jbG9jay5kVCwgZSlcbiAgcGh5c2ljcy51cGRhdGVQb3NpdGlvbih3b3JsZC5jbG9jay5kVCwgZSlcbiAgcmV0dXJuIGVcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwaHlzaWNzXG4iLCJ2YXIgcmFuZG9tID0ge31cblxucmFuZG9tLnJhbmRCb3VuZCA9IGZ1bmN0aW9uIChtaW4sIG1heCkge1xuICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluXG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFuZG9tXG4iLCJ2YXIgdmVjMyA9IHt9XG5cbnZhciBWZWMzID0gZnVuY3Rpb24gKHgsIHksIHopIHtcbiAgdmFyIG91dCA9IG5ldyBGbG9hdDMyQXJyYXkoMylcblxuICBvdXRbMF0gPSB4XG4gIG91dFsxXSA9IHlcbiAgb3V0WzJdID0gelxuICByZXR1cm4gb3V0XG59XG5cbnZhciBzZXRWZWMzID0gZnVuY3Rpb24gKHgsIHksIHosIHZlYykge1xuICB2ZWNbMF0gPSB4XG4gIHZlY1sxXSA9IHlcbiAgdmVjWzJdID0gelxuICByZXR1cm4gdmVjXG59XG5cbnZlYzMuVmVjMyAgICAgID0gVmVjM1xudmVjMy5zZXRWZWMzICAgPSBzZXRWZWMzXG5tb2R1bGUuZXhwb3J0cyA9IHZlYzNcbiJdfQ==
