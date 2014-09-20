var physics = {}

physics.updatePosition = function (dT, e) {
  e.position[0] = e.position[0] + dT * e.velocity[0]
  e.position[1] = e.position[1] + dT * e.velocity[1]
  return e
}

physics.updateVelocity = function (dT, e) {
  e.velocity[0] = e.velocity[0] + dT * e.acceleration[0]
  e.velocity[1] = e.velocity[1] + dT * e.acceleration[1]
  return e
}

physics.updatePhysics = function (dT, e) {
  physics.updateVelocity(dT, e)
  physics.updatePosition(dT, e)
  return e
}

module.exports = physics
