var test            = require("tape")
var mod             = require("../graph")
var Node            = mod.Node
var Graph           = mod.Graph
var attachRootNode  = mod.attachRootNode
var attachChildNode = mod.attachChildNode

test("Graph", function (t) {
  var g = Graph()

  t.plan(2)
  t.same(g.nodes, {})
  t.same(g.rootNodeIds, [])
})

test("Node", function (t) {
  var n = Node({id: 1})

  t.plan(3)
  t.same(n.parentId, null)
  t.same(n.childIds, [])
  t.same(n.id, 1)
})

test('addRootNode', function (t) {
  var g = Graph()
  var n = Node({id: 1})

  attachRootNode(g, n)
  t.plan(2)
  t.same(g.nodes[1].id, 1)
  t.same(g.rootNodeIds, [1])
})

test("attachChildNode", function (t) {
  var g  = Graph()
  var n1 = Node({id: 1})
  var n2 = Node({id: 2})

  attachRootNode(g, n1)
  attachChildNode(g, n1.id, n2)
  t.plan(1)
  t.same(g.nodes[1].childIds[0], 2)
})

test('Graph.__reduce', function (t) {
  var g  = Graph()
  var n1 = Node({id: 1, name: "Steve"})
  var n2 = Node({id: 2, name: "Juanita"})
  var n3 = Node({id: 3, name: "Tommy"})
  var n4 = Node({id: 4, name: "Murdoch"})
  var redFn = function (names, node) {
    names.push(node.name) 
    return names
  }
  var names = []

  attachRootNode(g, n1)
  attachChildNode(g, n1.id, n2)
  attachChildNode(g, n1.id, n3)
  attachChildNode(g, n2.id, n4)
  names = g.__reduce(redFn, [], g)
  t.plan(1)
  t.same(["Steve", "Juanita", "Murdoch", "Tommy"], names)
})
