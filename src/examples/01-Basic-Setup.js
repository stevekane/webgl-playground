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
var getLivingPositions = mapcatA(compose([isLiving, getPosition]))


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
