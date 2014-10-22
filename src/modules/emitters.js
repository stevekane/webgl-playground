var uuid      = require("node-uuid")
var prodash   = require("prodash")
var random    = require("./random")
var vec3      = require("./vec3")
var Vec3      = vec3.Vec3
var find      = prodash.array.find
var curry     = prodash.functions.curry
var randBound = random.randBound
var emitters  = {}

var Particle = function (lifespan) {
  return {
    id:           uuid.v4(),
    particle:     true,
    position:     Vec3(0, 0, 0),
    velocity:     Vec3(0, 0, 0),
    acceleration: Vec3(0, -0.0000018, 0),
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

var ParticleGroup = function (count, lifespan) {
  var particles = []

  for (var i = 0; i < count; ++i) {
    particles.push(Particle(lifespan))
  }    
  return particles
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


/* Depends on: 
 *   living      -> Boolean
 *   position    -> Vec3
 *   velocity    -> Vec3
 *   direction   -> Vec3
 *   spread      -> Num
 *   speed       -> Num
 *   allChildIds -> [id]
 *   childParticles.lifespan -> Num
 */
var updateEmitter = function (world, e) {
  var time = world.clock.newTime
  var particle 

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
emitters.ParticleGroup = ParticleGroup
emitters.Emitter       = Emitter
emitters.updateEmitter = updateEmitter
module.exports         = emitters
