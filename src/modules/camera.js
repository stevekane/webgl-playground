var mat4     = require("gl-mat4")
var vec3     = require("./vec3")
var Vec3     = vec3.Vec3
var rotSpeed = Math.PI / 3000
var camera   = {}


var Camera = function (x, y, z, fov, aspect, near, far) {
  if (!(this instanceof Camera)) return new Camera(x, y, z, fov, aspect, near, far)

  this.position   = Vec3(x, y ,z)
  this.fov        = fov
  this.near       = near
  this.far        = far
  this.aspect     = aspect
  this.projection = mat4.perspective(mat4.create(), fov, aspect, near, far)

  this.eye        = Vec3(x, y, z)
  this.lookAt     = Vec3(0, 0, 0)
  this.up         = Vec3(0, 1, 0)
  this.view       = mat4.lookAt(mat4.create(), this.eye, this.lookAt, this.up)
}

var updateCamera = function (world, camera) {
  var dT   = world.clock.dT
  var view = world.camera.view

  mat4.rotateY(view, view, rotSpeed * dT)
}


camera.Camera       = Camera
camera.updateCamera = updateCamera
module.exports = camera
