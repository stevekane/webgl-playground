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

  var buildEmitter = function (transFn) {
    var count  = 16
    var spread = 2
    var diff   = spread / count
    var e

    for (var i = -1 * count; i < 1 * count; i+=.05 * count) {
      spawnAt(.004, transFn(i) * diff, i / count, 1, i / count)
    }
  }
  buildEmitter(Math.sin)
  setInterval(makeUpdate(world), 25)
  requestAnimationFrame(makeRender(gl, world))
})
