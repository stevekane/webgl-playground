var utils        = require("./gl-utils")
var updateBuffer = utils.updateBuffer

//here we allocate both the JS array and Float32Array
//function buildPositions (particles) {
//  var out = []
//
//  for (var i = 0; i < particles.length; ++i) {
//    if (!!particles[i].living) {
//      out.push(particles[i].position[0]) 
//      out.push(particles[i].position[1]) 
//      out.push(particles[i].position[2]) 
//    }
//  }
//  return new Float32Array(out)
//}

//here we allocate once and iterate twice
function buildPositions (particles) {
  var livingCount = 0
  var out        

  for (var i = 0; i < particles.length; ++i) {
    if (!!particles[i].living) livingCount++  
  }

  out = new Float32Array(livingCount * 3)

  for (var j = 0, index = 0; j < particles.length; ++j) {
    if (!!particles[j].living) {
      out.set(particles[j].position, index)
      index += 3
    }
  }
  return out
}

function renderParticles (scene) {
  var gl        = scene.gl
  var view      = scene.gl.canvas
  var lp        = scene.programs.particle
  var particles = scene.groups.particles
  var lightData = scene.lightData
  var positions = buildPositions(particles)

  gl.useProgram(lp.program)
  gl.uniform3fv(lp.uniforms["uLightPositions[0]"], lightData.positions)
  gl.uniform3fv(lp.uniforms["uLightColors[0]"], lightData.colors)
  gl.uniform1fv(lp.uniforms["uLightIntensities[0]"], lightData.intensities)
  gl.uniform4f(lp.uniforms.uColor, 0.0, 0.0, 0.0, 1.0)
  gl.uniform2f(lp.uniforms.uScreenSize, view.clientWidth, view.clientHeight)
  gl.uniformMatrix4fv(lp.uniforms.uView, false, scene.camera.view)
  gl.uniformMatrix4fv(lp.uniforms.uProjection, false, scene.camera.projection)
  gl.uniform1f(lp.uniforms.uSize, 1.0)
  updateBuffer(gl, 3, lp.attributes.aPosition, lp.buffers.aPosition, positions)
  gl.drawArrays(gl.POINTS, 0, positions.length / 3)
}

module.exports = renderParticles
