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
var curry             = prodash.functions.curry
var compose           = prodash.functions.compose
var partial           = prodash.functions.partial
var hasKey            = prodash.object.hasKey
var hasKeys           = prodash.object.hasKeys
var cons              = prodash.transducers.cons
var reduce            = prodash.transducers.reduce
var transduce         = prodash.transducers.transduce
var mutate            = prodash.transducers.mutate
var cat               = prodash.transducers.cat
var mapping           = prodash.transducers.mapping
var plucking          = prodash.transducers.plucking
var filtering         = prodash.transducers.filtering
var mutating          = prodash.transducers.mutating
var checking          = prodash.transducers.checking
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

var hasPhysics = function (node) { 
  return !!node.position && !!node.velocity && !!node.acceleration 
}

//TODO temporary def here
var forEachNode = function (fn, nodeId, graph) {
  var node = graph.nodes[nodeId]

  fn(graph, node)
  for (var i = 0; i < node.childIds.length; ++i) {
    forEachNode(fn, node.childIds[i], graph)
  }
}

var updateGraph = function (fn, graph) {
  forEachNode(fn, graph.rootNodeId, graph)
}

function makeUpdate (sceneGraph) {
  var oldTime = performance.now()
  var newTime = oldTime
  var dT

  return function update () {
    oldTime = newTime
    newTime = performance.now()
    dT      = newTime - oldTime
    var runLifetime = function (graph, node) {
      if (!node.living || !node.lifespan) return
      killTheOld(newTime, graph, node)
    }
    var runPhysics = function (graph, node) {
      if (!node.living || !hasPhysics(node)) return
      updatePhysics(dT, graph, node)
    }
    var runEmitters = function (graph, node) {
      if(!node.living || !node.emitter ) return
      updateEmitter(newTime, graph, node)
    }

    updateGraph(runLifetime, sceneGraph)
    updateGraph(runPhysics, sceneGraph)
    updateGraph(runEmitters, sceneGraph)
  }
}

function makeAnimate (gl, lp, sceneGraph) {
  var rawPositions = []
  var rawSize      = []
  var buildBuffers  = function (graph, node) {
    if (node.living && node.renderable) {
      rawPositions.push(node.position[0]) 
      rawPositions.push(node.position[1]) 
      rawSizes.push(node.size) 
    }
  }
  var positions 
  var sizes

  return function animate () {
    rawPositions = []
    rawSizes     = []
    updateGraph(buildBuffers, sceneGraph)
    positions = new Float32Array(rawPositions)
    sizes     = new Float32Array(rawSizes)

    ticker.tick()
    clearContext(gl)
    gl.useProgram(lp.program)
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
  var lp         = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var sceneGraph = Graph()
  var e1         = Emitter(2000, 10, .0008, .4, -1, 1, 1, -1)
  var e2         = Emitter(2000, 10, .0008, .4, 1, 1, -1, -1)
  var e3         = Emitter(2000, 10, .0008, .4, -1, -1, 1, 1)
  var e4         = Emitter(2000, 10, .0008, .4, 1, -1, -1, 1)

  attachById(sceneGraph, sceneGraph.rootNodeId, e1)
  attachById(sceneGraph, sceneGraph.rootNodeId, e2)
  attachById(sceneGraph, sceneGraph.rootNodeId, e3)
  attachById(sceneGraph, sceneGraph.rootNodeId, e4)
  for (var i = 0; i < 300; ++i) {
    attachById(sceneGraph, e1.id, Particle(1000, 0, 0))
    attachById(sceneGraph, e2.id, Particle(1000, 0, 0))
    attachById(sceneGraph, e3.id, Particle(1000, 0, 0))
    attachById(sceneGraph, e4.id, Particle(1000, 0, 0))
  }
  setInterval(makeUpdate(sceneGraph), 25)
  requestAnimationFrame(makeAnimate(gl, lp, sceneGraph))
})
