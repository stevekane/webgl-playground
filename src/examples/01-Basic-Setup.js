var prodash           = require("prodash")
var async             = require("async")
var fps               = require("fps")
var types             = require("../modules/types")
var loaders           = require("../modules/loaders")
var utils             = require("../modules/gl-utils")
var random            = require("../modules/random")
var physics           = require("../modules/physics")
var lifetime          = require("../modules/lifetime")
var emitters          = require("../modules/emitters")
var rendering         = require("../modules/rendering")
var filtering         = prodash.transducers.filtering
var mapping           = prodash.transducers.mapping
var curry             = prodash.functions.curry
var compose           = prodash.functions.compose
var partial           = prodash.functions.partial
var reduceG           = prodash.graph.reduce
var reduceA           = prodash.array.reduce
var consA             = prodash.array.cons
var forEachA          = prodash.array.forEach
var Node              = prodash.graph.Node
var LoadedProgram     = types.LoadedProgram
var Particle          = types.Particle
var Emitter           = types.Emitter
var loadShader        = loaders.loadShader
var updateBuffer      = utils.updateBuffer
var clearContext      = utils.clearContext
var randBound         = random.randBound
var updatePhysics     = physics.updatePhysics
var updateEmitter     = emitters.updateEmitter
var killTheOld        = lifetime.killTheOld
var walkAndDo         = rendering.walkAndDo
var ticker            = fps({every: 16})
var canvas            = document.getElementById("playground")
var stats             = document.getElementById("stats")
var gl                = canvas.getContext("webgl")
var shaders           = {
  vertex:   "/shaders/01v.glsl",
  fragment: "/shaders/01f.glsl"
}

//TODO: should be a utility function in prodash.object
var has = curry(function (props, e) {
  var res = true

  for (var i = 0; i < props.length; ++i) {
    res = res && e.hasOwnProperty(props[i])
  }
  return res
})

//TODO: should be a utility fuction in prodash.array
var flatten = function (listOfLists) {
  var res = [] 

  for (var i = 0; i < listOfLists.length; ++i) {
    for (var j = 0; j < listOfLists[i].length; ++j) {
      res.push(listOfLists[i][j])
    } 
  }
  return res
}

var hasLifeSpan = filtering(has(["lifespan"]))
var isEmitter   = filtering(has(["emitter"]))
var hasPhysics  = filtering(has(["position", "velocity", "acceleration"]))
var groupGraphBy = function (predFn, graph) {
  return reduceG(predFn(consA), [], graph)
}

function makeUpdate (groups) {
  var oldTime = performance.now()
  var newTime = oldTime
  var dT

  return function update () {
    oldTime = newTime
    newTime = performance.now()
    dT      = newTime - oldTime

    //TODO: optimize by creating functions in makeUpdate
    forEachA(function (e) { updateEmitter(newTime, e) }, groups.emitters)
    forEachA(function (e) { killTheOld(newTime, e) }, groups.lifespans)
    forEachA(function (e) { updatePhysics(dT, e) }, groups.physics)
  }
}

//TODO: wtf steven wtf...
var getLivingPositions = reduceA(compose([
  filtering(function (e) { return !!e.living }),
  mapping(function (e) { return [e.position[0], e.position[1]] })
])(consA), []) 

//TODO: This should be groups.renderable and not physics probably
function makeAnimate (gl, lp, groups) {
  return function animate () {
    var positions = new Float32Array(flatten(getLivingPositions(groups.physics)))

    ticker.tick()
    clearContext(gl)
    updateBuffer(gl, 2, lp.attributes.aPosition, lp.buffers.aPosition, positions)
    gl.drawArrays(gl.POINTS, 0, positions.length / 2)
    requestAnimationFrame(animate) 
  }
}

//TODO: There probably should be a renderable group for animate frame iteration
function cacheGroups (sceneGraph) {
  return {
    lifespans: groupGraphBy(hasLifeSpan, sceneGraph),
    emitters:  groupGraphBy(isEmitter, sceneGraph),
    physics:   groupGraphBy(hasPhysics, sceneGraph)
  }  
}

//setup fps monitoring
ticker.on("data", function (framerate) {
  stats.innerHTML = "fps: " + String(framerate | 0)
})

async.parallel({
  vertex:   partial(loadShader, "/shaders/01v.glsl"),
  fragment: partial(loadShader, "/shaders/01f.glsl")
}, function (err, shaders) {
  var lp           = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var sceneGraph   = Node({}, [
      Emitter(100, 2000, 10, .0009, .4, 0, 0, 1, 0)
  ])
  var groups       = cacheGroups(sceneGraph)
  var positions    = flatten(getLivingPositions(groups.physics))

  window.positions = positions
  window.graph     = sceneGraph
  window.groups    = groups
  gl.useProgram(lp.program)
  gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
  requestAnimationFrame(makeAnimate(gl, lp, groups))
  setInterval(makeUpdate(groups), 25)
})
