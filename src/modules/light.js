var uuid  = require("node-uuid")
var vec3  = require('./vec3')
var Vec3  = vec3.Vec3
var light = {}

var PointLight = function (x, y, z) {
  if (!(this instanceof PointLight)) return new PointLight(x, y, z)

  this.id            = uuid.v4()
  this.light         = true
  this.position      = Vec3(x, y, z)
  this.velocity      = Vec3(0, 0 ,0)
  this.acceleration  = Vec3(0, 0 ,0)
  this.rotation      = Vec3(0, 0, 0)
  this.rgb           = Vec3(1, 1, 1)
  this.intensity     = 1.0
  this.living        = true
}

light.PointLight = PointLight
module.exports = light
