var fns      = require("prodash")
var curry    = fns.functions.curry
var lifetime = {}

lifetime.killTheOld = function (world, e) {
  var time = world.times.newTime

  if (!e.lifespan) return
  if (e.living && time >= e.timeToDie) {
    e.living = false
  }
}

module.exports = lifetime
