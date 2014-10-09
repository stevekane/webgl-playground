var scene = {}

/* Scene is a particular environment for the game.  It is composed of
 * A list of Systems
 * a Graph of entities
 * a List of GL programs
 */

var Scene = function (graph, updateSystems, renderSystems) {
  if (!(this instanceof Scene)) return new Scene(graph, updateSystems, renderSystems)

  this.updateSystems = updateSystems
  this.renderSystems = renderSystems
  this.graph         = graph 
}

var renderScene = function (scene) {
  for (var i = 0; i < scene.renderSystems.length; ++i) {
    scene.renderSystems[i](scene.graph)
  }   
}

var updateScene = function (engine, scene) {
  for (var i = 0; i < scene.renderSystems.length; ++i) {
    scene.updateSystems[i](engine, scene, scene.graph)
  }   
}

scene.Scene       = Scene
scene.renderScene = renderScene
scene.updateScene = updateScene
module.exports    = scene
