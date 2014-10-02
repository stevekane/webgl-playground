var vec3   = require("./vec3")
var Vec3   = vec3.Vec3
var camera = {}

var Camera = function (x, y, z) {
  //TODO: be sure to pass through the arguments whatever they may be!
  if (!(this instanceof Camera)) return new Camera(x, y, z)
  this.position = Vec3(x, y ,z)
}

camera.Camera  = Camera
module.exports = camera
