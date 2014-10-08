var vec3 = {}

var Vec3 = function (x, y, z) {
  var out = new Float32Array(3)

  out[0] = x
  out[1] = y
  out[2] = z
  return out
}

var setVec3 = function (x, y, z, vec) {
  vec[0] = x
  vec[1] = y
  vec[2] = z
  return vec
}

var cloneVec3 = function (vec) {
  return Vec3(vec[0], vec[1], vec[2])
}

vec3.Vec3      = Vec3
vec3.setVec3   = setVec3
vec3.cloneVec3 = cloneVec3
module.exports = vec3
