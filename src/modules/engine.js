var scene       = require("scene")
var clock       = require("clock")
var updateScene = scene.updateScene
var renderScene = scene.renderScene
var updateClock = clock.updateClock
var engine      = {}

/* Engine is a very high-level object that tracks the time
 * Contains scene definitions (for now, these are constructors)
 * An active scene (this is an instantiated scene), 
 * Clock instance
 * Cache instance
 */

function makeUpdate (engine) {
  return function update () {
    updateClock(engine.clock, performance.now()) 
    updateScene(engine, engine.activeScene)
  }
}

function makeRender (engine) {
  return function render () {
    renderScene(engine.activeScene)
    requestAnimationFrame(render)
  }
}

var Engine = function (Scenes, activeScene, clock, cache) {
  if (!(this instanceof Engine)) {
    return new Engine(Scenes, activeScene, clock)
  }
  this.clock          = clock
  this.Scenes         = Scenes
  this.activeScene    = activeScene
  this.cache          = cache
  this.updateInterval = null
  this.renderInterval = null
}

var startEngine = function (engine) {
  engine.updateInterval = setInterval(makeUpdate(engine), 25)
  engine.renderInterval = requestAnimationFrame(makeRender(engine))
}

var stopEngine = function (engine) {
  clearInterval(engine.updateInterval)
  cancelAnimationFrame(engine.renderInterval) 
}

engine.Engine      = Engine
engine.startEngine = startEngine
engine.stopEngine  = stopEngine
module.exports     = engine
