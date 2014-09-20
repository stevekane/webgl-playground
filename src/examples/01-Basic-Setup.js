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
