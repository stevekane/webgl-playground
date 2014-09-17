var utils = {}

utils.initBuffer = function (gl, data, chunkSize, attribute) {
  var buffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  gl.vertexAttribPointer(attribute, chunkSize, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(attribute)
  return buffer
}

module.exports = utils
