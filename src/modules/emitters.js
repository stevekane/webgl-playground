var _         = require("lodash")
var random    = require("./random")
var find      = _.find
var randBound = random.randBound
var emitters  = {}

/*
  check if it is time to fire a particle, if so, they find
  a particle and giev it a velocity in the direction of the emitter
  and a time to die
  N.B. The velocity is affected by both the speed and the spread
*/
emitters.updateEmitter = function (time, e) {
  var particle 

  if (!e.emitter) return
  if (time > e.nextFireTime) {
    particle             = find(e.children, {"living": false})
    particle.timeToDie   = time + particle.lifespan
    particle.living      = true
    particle.position[0] = e.position[0]
    particle.position[1] = e.position[1]
    particle.velocity[0] = e.speed * (e.direction[0] + randBound(-1 * e.spread, e.spread))
    particle.velocity[1] = e.speed * (e.direction[1] + randBound(-1 * e.spread, e.spread))
    e.nextFireTime += e.rate
  }
}

module.exports = emitters
