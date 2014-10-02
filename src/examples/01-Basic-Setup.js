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
