var prodash          = require("prodash")
var async            = require("async")
var graph            = require("../modules/graph")
var loaders          = require("../modules/loaders")
var utils            = require("../modules/gl-utils")
var random           = require("../modules/random")
var physics          = require("../modules/physics")
var lifetime         = require("../modules/lifetime")
var emitters         = require("../modules/emitters")
var clock            = require("../modules/clock")
var camera           = require("../modules/camera")
var light            = require("../modules/light")
var vec3             = require("../modules/vec3")
var renderParticles  = require("../modules/render-particles")
var Graph            = graph.Graph
var attachToRoot     = graph.attachToRoot
var attachToNode     = graph.attachToNode
var attachManyToNode = graph.attachManyToNode
var compose          = prodash.functions.compose
var partial          = prodash.functions.partial
var into             = prodash.transducers.into
var transduce        = prodash.transducers.transduce
var cons             = prodash.transducers.cons
var sequence         = prodash.transducers.sequence
var filtering        = prodash.transducers.filtering
var checking         = prodash.transducers.checking
var plucking         = prodash.transducers.plucking
var cat              = prodash.transducers.cat
var ParticleGroup    = emitters.ParticleGroup
var Emitter          = emitters.Emitter
var updateEmitter    = emitters.updateEmitter
var loadShader       = loaders.loadShader
var clearContext     = utils.clearContext
var LoadedProgram    = utils.LoadedProgram
var randBound        = random.randBound
var updatePhysics    = physics.updatePhysics
var killTheOld       = lifetime.killTheOld
var Clock            = clock.Clock
var updateClock      = clock.updateClock
var Camera           = camera.Camera
var updateCamera     = camera.updateCamera
var PointLight       = light.PointLight
var setVec3          = vec3.setVec3
var canvas           = document.getElementById("playground")

var isEmitter   = checking("emitter", true)
var isParticle  = checking("particle", true)
var isLight     = checking("light", true)
var isLiving    = checking("living", true)
var hasLifespan = filtering(function (e) { 
  return e.lifespan !== undefined
})
var hasPhysics  = filtering(function (e) {
  return !!e.position && !!e.velocity && !!e.acceleration
})
var getLivingParticles = compose([isLiving, isParticle])
var getLivingLights    = compose([isLiving, isLight])
var flattenPositions   = sequence(compose([isLiving, plucking("position"), cat]))
var flattenSizes       = sequence(compose([isLiving, plucking("size"), cat]))

//(Scene -> Node) -> String -> Scene -> Void
var forEachNode = function (fn, nodeId, scene) {
  var node = scene.graph.nodes[nodeId]

  fn(scene, node)
  for (var i = 0; i < node.childIds.length; ++i) {
    forEachNode(fn, node.childIds[i], scene)
  }
}

//(Scene -> Node) -> Scene -> Void
var updateEntities = function (fn, scene) {
  forEachNode(fn, scene.graph.rootNodeId, scene)
}

//TODO: Should alter the updateEntities calls to be run system calls
//that leverage the defined systems in our scene and also the groups
//associated w/ them
function makeUpdate (scene) {
  return function update () {
    updateClock(scene.clock, performance.now())
    updateCamera(scene, scene.camera)
    updateEntities(killTheOld, scene)
    updateEntities(updatePhysics, scene)
    updateEntities(updateEmitter, scene)
  }
}

function buildLightData (scene) {
  var lights    = scene.groups.lights
  var lightData = {
    positions:   new Float32Array(lights.length * 3),
    colors:      new Float32Array(lights.length * 3),
    intensities: new Float32Array(lights.length)
  }
  var light
  
  for (var i = 0; i < lights.length; ++i) {
    light = lights[i]
    lightData.positions[i*3]   = light.position[0]
    lightData.positions[i*3+1] = light.position[1]
    lightData.positions[i*3+2] = light.position[2]
    lightData.colors[i*3]      = light.rgb[0]
    lightData.colors[i*3+1]    = light.rgb[1]
    lightData.colors[i*3+2]    = light.rgb[2]
    lightData.intensities[i]   = light.intensity
  }
  return lightData
}

function makeRender (gl, scene) {
  return function render () {
    var lightData = buildLightData(scene)

    clearContext(gl)
    renderParticles(scene)
    requestAnimationFrame(render) 
  }
}

async.parallel({
  vertex:   partial(loadShader, "/shaders/01v.glsl"),
  fragment: partial(loadShader, "/shaders/01f.glsl")
}, function (err, shaders) {
  var gl              = canvas.getContext("webgl")
  var particleProgram = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var aspect          = gl.canvas.clientWidth / gl.canvas.clientHeight
  var fov             = Math.PI / 2
  var scene           = {
    gl:       gl,
    clock:    Clock(performance.now()),
    camera:   Camera(0, 0, 2, fov, aspect, 1, 10),
    graph:    Graph(),
    systems:  {
      emitters:  updateEmitter,
      lifespans: killTheOld,
      physics:   updatePhysics
    },
    groups:   {
      emitters:  [],
      lifespans: [],
      physics:   [],
      lights:    [],
      particles: []
    },
    programs: {
      particle: particleProgram
    },
    lightData: []
  }
  var l1   = PointLight(0, 0, 0)
  var l2   = PointLight(0, .25, 0)
  var l3   = PointLight(0, .5, 0)
  var e1   = Emitter(1000, 10, .002, .1, 0, 0, 0, 0, 1, randBound(-0.2, 0.2))  
  var e1ps = ParticleGroup(50, 1000)

  setVec3(1.0, 0.0, 0.0, l1.rgb)
  setVec3(0.0, 1.0, 0.0, l2.rgb)
  setVec3(0.0, 0.0, 1.0, l3.rgb)
  attachToRoot(scene.graph, l1)
  attachToRoot(scene.graph, l2)
  attachToRoot(scene.graph, l3)
  attachToRoot(scene.graph, e1)
  attachManyToNode(scene.graph, e1, e1ps)
  into(scene.groups.lights, isLight, scene.graph)
  into(scene.groups.emitters, isEmitter, scene.graph)
  into(scene.groups.particles, isParticle, scene.graph)
  into(scene.groups.lifespans, hasLifespan, scene.graph)
  into(scene.groups.physics, hasPhysics, scene.graph)
  scene.lightData = buildLightData(scene)

  window.scene = scene

  setInterval(makeUpdate(scene), 25)
  requestAnimationFrame(makeRender(gl, scene))
})
