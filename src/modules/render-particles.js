var prodash   = require("prodash")
var compose   = prodash.functions.compose
var checking  = prodash.transducers.checking
var plucking  = prodash.transducers.plucking
var cat       = prorash.transducers.cat
var cons      = prodash.transducers.cons
var transduce = prodash.transducers.transduce

var flattenPositions = compose([
  checking("living", true), 
  plucking("position"), 
  cat
])

var buildPositions = function (graph) {
  return new Float32Array(transduce(flattenPositions, cons, [], graph))
}

function renderParticles (engine, scene, graph) {
  var gl        = scene.videoCtx
  var view      = scene.videoCtx.canvas
  var lp        = scene.programs.particle
  var particles = scene.groups.particles
  var lightData = scene.lightData
  var positions = buildPositions(graph)

  gl.useProgram(lp.program)
  gl.uniform3fv(lp.uniforms["uLightPositions[0]"], lightData.positions)
  gl.uniform3fv(lp.uniforms["uLightColors[0]"], lightData.colors)
  gl.uniform1fv(lp.uniforms["uLightIntensities[0]"], lightData.intensities)
  gl.uniform4f(lp.uniforms.uColor, 0.0, 0.0, 0.0, 1.0)
  gl.uniform2f(lp.uniforms.uScreenSize, view.clientWidth, view.clientHeight)
  gl.uniformMatrix4fv(lp.uniforms.uView, false, world.camera.view)
  gl.uniformMatrix4fv(lp.uniforms.uProjection, false, world.camera.projection)
  gl.uniform1f(lp.uniforms.uSize, 1.0)
  updateBuffer(gl, 3, lp.attributes.aPosition, lp.buffers.aPosition, positions)
  gl.drawArrays(gl.POINTS, 0, positions.length / 3)
}

module.exports = renderParticles
