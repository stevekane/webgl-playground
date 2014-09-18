var async         = require("async")
var fps           = require("fps")
var types         = require("../modules/types")
var loaders       = require("../modules/loaders")
var utils         = require("../modules/gl-utils")
var random        = require("../modules/random")
var LoadedProgram = types.LoadedProgram
var loadShader    = loaders.loadShader
var updateBuffer  = utils.updateBuffer
var clearContext  = utils.clearContext
var randBound     = random.randBound
var ticker        = fps({every: 100})
var canvas        = document.getElementById("playground")
var stats         = document.getElementById("stats")
var gl            = canvas.getContext("webgl")
var shaders       = {
  vertex:   "/shaders/01v.glsl",
  fragment: "/shaders/01f.glsl"
}

function updatePhysics (entities) {
  for (var i = 0, len = entities.length; i < len ;i++) {
    entities[i] = randBound(-1.0, 1.0)
  }
}

function makeUpdate (entities) {
  return function update () {
    updatePhysics(entities) 
  }
}

function makeAnimate (gl, lp, buffers, positions) {
  return function animate () {
    ticker.tick()
    clearContext(gl)
    updateBuffer(gl, 2, lp.attributes.aPosition, buffers.aPosition, positions)
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
  var lp        = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var positions = new Float32Array(10000)
  var buffers   = {
    aPosition: gl.createBuffer()
  }

  for (var i = 0, len = positions.length; i < len ; ++i) {
    positions[i] = randBound(-1.0, 1.0) 
  }
  
  gl.useProgram(lp.program)
  gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
  gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)

  //drawing
  requestAnimationFrame(makeAnimate(gl, lp, buffers, positions))

  setInterval(makeUpdate(positions), 25)
})
