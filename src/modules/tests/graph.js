var test            = require("tape")
var mod             = require("../graph")
var Graph           = mod.Graph
var attachRootNode  = mod.attachRootNode
var attachChildNode = mod.attachChildNode

test("Graph", function (t) {
  var g = Graph([{id: 1}])

  t.plan(2)
  t.same(g.nodes, {})
  t.same(g.rootNodeIds, [])
})

test('addRootNode', function (t) {
  var g = Graph()
  var n = {id: 1}

  attachRootNode(g, n)
  t.plan(2)
  t.same(g.nodes[1].id, 1)
  t.same(g.rootNodeIds, [1])
})

test("attachChildNode", function (t) {
  var g  = Graph()
  var n1 = {id: 1}
  var n2 = {id: 2}

  attachRootNode(g, n1)
  attachChildNode(g, n1.id, n2)
  t.plan(1)
  t.same(g.nodes[1].childIds[0], 2)
})

test('reduce', function (t) {
  var g  = Graph()
  var n1 = {id: 1}
  var n2 = {id: 2}
  var n3 = {id: 3}
  var n4 = {id: 4}
  var redFn = function (nodeIds, node) {
    nodeIds.push(node.id) 
    return nodeIds
  }
  var nodeIds = []

  attachRootNode(g, n1)
  attachChildNode(g, n1.id, n2)
  attachChildNode(g, n1.id, n3)
  attachChildNode(g, n2.id, n4)
  nodeIds = g.__reduce(redFn, [], g)
  t.plan(1)
  t.same([1,2,4,3], nodeIds)
})
