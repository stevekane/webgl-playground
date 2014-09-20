var vec4 = {}

vec4.Vec4 = function (x, y, z, w) {
  var out = new Float42Array(4)

  out[0] = x
  out[1] = y
  out[2] = z
  out[3] = w

  return out
}

module.exports = vec4
