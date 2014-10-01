var prodash           = require("prodash")
var async             = require("async")
var fps               = require("fps")
var mat4              = require("gl-mat4")
var ticker            = fps({every: 10})
var graph             = require("../modules/graph")
var types             = require("../modules/types")
var loaders           = require("../modules/loaders")
var utils             = require("../modules/gl-utils")
var random            = require("../modules/random")
var physics           = require("../modules/physics")
var lifetime          = require("../modules/lifetime")
var emitters          = require("../modules/emitters")
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
  world.times.oldTime = performance.now()
  world.times.newTime = world.times.oldTime

  return function update () {
    world.times.oldTime = world.times.newTime
    world.times.newTime = performance.now()
    world.times.dT      = world.times.newTime - world.times.oldTime

    updateEntities(killTheOld, world)
    updateEntities(updatePhysics, world)
    updateEntities(updateEmitter, world)
  }
}

function makeAnimate (gl, world) {
  var rawPositions = []
  var rawSize      = []
  var buildBuffers  = function (world, node) {
    if (node.living && node.renderable) {
      rawPositions.push(node.position[0]) 
      rawPositions.push(node.position[1]) 
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
    updateBuffer(gl, 2, lp.attributes.aPosition, lp.buffers.aPosition, positions)
    updateBuffer(gl, 1, lp.attributes.aSize, lp.buffers.aSize, sizes)
    gl.drawArrays(gl.POINTS, 0, positions.length / 2)
    requestAnimationFrame(animate) 
  }
}

async.parallel({
  vertex:   partial(loadShader, "/shaders/01v.glsl"),
  fragment: partial(loadShader, "/shaders/01f.glsl")
}, function (err, shaders) {
  var particleProgram = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var world           = {
    times: {
      dT:      0,
      newTime: 0,
      oldTime: 0
    },
    programs: {
      particle: particleProgram
    },
    camera: {
    
    },
    graph: Graph()
  }
  var e1 = Emitter(2000, 10, .0008, .4, -1, 1, 1, -1)
  var e2 = Emitter(2000, 10, .0008, .4, 1, 1, -1, -1)
  var e3 = Emitter(2000, 10, .0008, .4, -1, -1, 1, 1)
  var e4 = Emitter(2000, 10, .0008, .4, 1, -1, -1, 1)

  attachById(world.graph, world.graph.rootNodeId, e1)
  attachById(world.graph, world.graph.rootNodeId, e2)
  attachById(world.graph, world.graph.rootNodeId, e3)
  attachById(world.graph, world.graph.rootNodeId, e4)
  for (var i = 0; i < 300; ++i) {
    attachById(world.graph, e1.id, Particle(1000, 0, 0))
    attachById(world.graph, e2.id, Particle(1000, 0, 0))
    attachById(world.graph, e3.id, Particle(1000, 0, 0))
    attachById(world.graph, e4.id, Particle(1000, 0, 0))
  }
  setInterval(makeUpdate(world), 25)
  requestAnimationFrame(makeAnimate(gl, world))
})
