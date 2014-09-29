var test            = require("tape")
var mod             = require("../graph")
var Node            = mod.Node
var Graph           = mod.Graph
var attachById      = mod.attachById

test("Graph", function (t) {
  var g      = Graph()
  var rootId = g.rootNodeId

  t.plan(1)
  t.true(!!g.nodes[rootId])
})

test("Node", function (t) {
  var n = Node({id: 1})

  t.plan(3)
  t.same(n.parentId, null)
  t.same(n.childIds, [])
  t.same(n.id, 1)
})

test('attachById', function (t) {
  var g  = Graph()
  var n1 = Node({id: 1})
  var n2 = Node({id: 2})

  attachById(g, g.rootNodeId, n1)
  attachById(g, n1.id, n2)
  t.plan(4)
  t.same(g.nodes[1].id, 1)
  t.same(g.nodes[2].id, 2)
  t.same(g.nodes[1].parentId, g.rootNodeId)
  t.same(g.nodes[2].parentId, n1.id)
})

test('Graph.__reduce', function (t) {
  var g      = Graph()
  var rootId = g.rootNodeId
  var n1     = Node({id: 1, name: "Steve"})
  var n2     = Node({id: 2, name: "Juanita"})
  var n3     = Node({id: 3, name: "Tommy"})
  var n4     = Node({id: 4, name: "Murdoch"})
  var redFn = function (names, node) {
    if (node.name) names.push(node.name) 
    return names
  }
  var names = []

  attachById(g, rootId, n1)
  attachById(g, n1.id, n2)
  attachById(g, n1.id, n3)
  attachById(g, n2.id, n4)
  names = g.__reduce(redFn, [], g)
  t.plan(1)
  t.same(["Steve", "Juanita", "Murdoch", "Tommy"], names)
})
