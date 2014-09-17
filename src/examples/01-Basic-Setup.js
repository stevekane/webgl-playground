var async         = require("async")
var types         = require("../modules/types")
var loaders       = require("../modules/loaders")
var utils         = require("../modules/gl-utils")
var LoadedProgram = types.LoadedProgram
var loadShader    = loaders.loadShader
var initBuffer    = utils.initBuffer
var canvas        = document.getElementById("playground")
var gl            = canvas.getContext("webgl")
var shaders       = {
  vertex:   "/shaders/01v.glsl",
  fragment: "/shaders/01f.glsl"
}

//clear the webgl context
function clearContext (gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
}

function makeAnimate (gl, count) {
  return function animate () {
    clearContext(gl)
    gl.drawArrays(gl.POINTS, 0, count)
    requestAnimationFrame(animate) 
  }
}

async.parallel({
  vertex:   function (cb) { loadShader("/shaders/01v.glsl", cb) },
  fragment: function (cb) { loadShader("/shaders/01f.glsl", cb) }
}, function (err, shaders) {
  var lp        = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var positions = new Float32Array([
    -1.0, -1.0,
    -1.0,  1.0, 
     1.0, -1.0,
     1.0,  1.0,
     0.0,  0.0
  ])
  var count     = positions.length / 2
  
  gl.useProgram(lp.program)
  gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
  initBuffer(gl, positions, 2, lp.attributes.aPosition)
  requestAnimationFrame(makeAnimate(gl, count))
})
