var uuid      = require("node-uuid")
var prodash   = require("prodash")
var random    = require("./random")
var vec3      = require("./vec3")
var Vec3      = vec3.Vec3
var find      = prodash.array.find
var curry     = prodash.functions.curry
var randBound = random.randBound
var emitters  = {}

var Particle = function (lifespan, px, py, pz) {
  return {
    id:           uuid.v4(),
    position:     Vec3(px, py, pz),
    velocity:     Vec3(0, 0, 0),
    acceleration: Vec3(0, -0.0000015, 0),
    //acceleration: Vec3(0, 0, 0),
    renderable:   true,
    size:         4.0,
    timeToDie:    0,
    lifespan:     lifespan,
    living:       false
  }
}

var Emitter = function (lifespan, rate, speed, spread, px, py, pz, dx, dy, dz) {
  return {
    id:           uuid.v4(),
    emitter:      true,
    rate:         rate, 
    speed:        speed,
    spread:       spread,
    nextFireTime: 0,
    position:     Vec3(px, py, pz),
    velocity:     Vec3(0, 0, 0),
    acceleration: Vec3(0, 0, 0),
    direction:    Vec3(dx, dy, dz),
    renderable:   false,
    living:       true
  }
}


var scaleAndSpread = function (scale, spread, val) {
  return scale * (val + randBound(-1 * spread, spread))
}

var findFirstDead = function (graph, childIds) {
  var childNode

  for (var i = 0; i < childIds.length; ++i) {
    childNode = graph.nodes[childIds[i]]
    if (!childNode.living) return childNode
  }
  return undefined
}

var updateEmitter = function (world, e) {
  var time = world.clock.newTime
  var particle 

  if (!e.emitter) return
  if (!e.living)  return
  if (time > e.nextFireTime) {
    particle             = findFirstDead(world.graph, e.childIds)
    particle.timeToDie   = time + particle.lifespan
    particle.living      = true
    particle.position[0] = e.position[0]
    particle.position[1] = e.position[1]
    particle.position[2] = e.position[2]
    particle.velocity[0] = scaleAndSpread(e.speed, e.spread, e.direction[0])
    particle.velocity[1] = scaleAndSpread(e.speed, e.spread, e.direction[1])
    particle.velocity[2] = scaleAndSpread(e.speed, e.spread, e.direction[2])
    e.nextFireTime += e.rate
  }
}

emitters.Particle      = Particle
emitters.Emitter       = Emitter
emitters.updateEmitter = updateEmitter
module.exports         = emitters
