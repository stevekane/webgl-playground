var lifetime = {}

lifetime.killTheOld = function (time, e) {
  if (e.living && time >= e.timeToDie) e.living = false
}

module.exports = lifetime
