var test              = require("tape")
var r                 = require("./rendering")
var vec2              = require("./vec2")
var Vec2              = vec2.Vec2
var flattenSceneGraph = r.flattenSceneGraph
var walkAndDo         = r.walkAndDo

test("returns the correct flat positions array", function (t) {
  var root = {
    living:   true,
    position: Vec2(1, 2), 
    children: [
      {
        living:   true,
        position: Vec2(3,4),
      },
      {
        living:   false,
        position: Vec2(5,6),
        children: [
          {
            living:   true,
            position: Vec2(7, 8)
          } 
        ]
      },
    ]
  }

  var positions = flattenSceneGraph(root)

  t.plan(7)
  t.same(positions.length, 6, "positions array is correct length")
  t.same(positions[0], 1)
  t.same(positions[1], 2)
  t.same(positions[2], 3)
  t.same(positions[3], 4)
  t.same(positions[4], 7)
  t.same(positions[5], 8)
})

test("walkAndDo traverses the scenegraph and applies function", function (t) {
  var incrementXPosition = function (node) { node.position[0]++ }
  var tree = {
    living:   true,
    position: Vec2(1, 2), 
    children: [
      {
        living:   true,
        position: Vec2(3,4),
      },
      {
        living:   false,
        position: Vec2(5,6),
        children: [
          {
            living:   true,
            position: Vec2(7, 8)
          } 
        ]
      },
    ]
  }
  walkAndDo(incrementXPosition, tree)

  t.plan(4)
  t.same(tree.position[0], 2)
  t.same(tree.children[0].position[0], 4)
  t.same(tree.children[1].position[0], 6)
  t.same(tree.children[1].children[0].position[0], 8)
})
