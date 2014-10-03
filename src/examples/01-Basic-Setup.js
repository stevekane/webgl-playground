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
var canvas            = document.getElementById("playground")
var stats             = document.getElementById("stats")
var gl                = canvas.getContext("webgl")
var shaders           = {
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
    camera:   Camera(0, 0, 4, fov, aspect, 1, 10),
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

  //L
  spawnAt(.001, -1, -1, 1, 0)
  spawnAt(.002, -1, -1, 0, 1)

  //T
  spawnAt(.001, 0, 1, -1, 0)
  spawnAt(.001, 0, 1, 1, 0)
  spawnAt(.002, 0, 1, 0, -1)

  //N
  spawnAt(.002, 1, -1, 0, 1)
  spawnAt(.002, 1, 1, .6, -1)
  spawnAt(.002, 2, -1, 0, 1)

  var buildEmitter = function (transFn) {
    var count  = 8
    var spread = 2
    var diff   = spread / count
    var e

    for (var i = -1 * count; i < 1 * count; i+=.1 * count) {
      e  = Emitter(2000, 10, .004, .4, transFn(i) * diff,  i / count, 0, 1, 0, 1)  
      attachById(world.graph, world.graph.rootNodeId, e)
      for (var j = 0; j < 50; ++j) {
        attachById(world.graph, e.id, Particle(1000, 0, 0, 0))
      }
    }
  }
  //buildEmitter(Math.sin)
  setInterval(makeUpdate(world), 25)
  requestAnimationFrame(makeAnimate(gl, world))
})
