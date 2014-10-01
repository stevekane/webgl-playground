var fns      = require("prodash")
var curry    = fns.functions.curry
var lifetime = {}

lifetime.killTheOld = function (time, graph, e) {
  if (e.living && time >= e.timeToDie) {
    e.living = false
  }
}

module.exports = lifetime
