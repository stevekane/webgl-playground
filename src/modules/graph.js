var prodash = require("prodash")
var curry   = prodash.functions.curry
var remove  = prodash.array.remove
var graph   = {}

var Graph = function () {
  if (!(this instanceof Graph)) return new Graph
  this.nodes       = {}
  this.rootNodeIds = []
}

//used internally by graph.__reduce to support iteration
var nodeReduce = function (redFn, nodeId, accum, graph) {
  var node = graph.nodes[nodeId]

  accum = redFn(accum, node)

  for (var i = 0; i < node.childIds.length; ++i) {
    accum = nodeReduce(redFn, node.childIds[i], accum, graph)   
  }
  return accum
}

Graph.prototype.__reduce = function (redFn, accum, graph) {
  var rootNodeIds = graph.rootNodeIds

  for (var i = 0, len = graph.rootNodeIds.length; i < len; ++i) {
    accum = nodeReduce(redFn, graph.rootNodeIds[i], accum, graph)
  }
  return accum
}

Graph.prototype.__empty = function () { return new Graph }

//TODO: implement
Graph.prototype.__cons = function (graph, node) {
  return graph
}

var Node = function (hash) {
  if (!(this instanceof Node)) return new Node(hash) 
  this.id       = hash.id
  this.value    = hash
  this.parentId = null
  this.childIds = []
}

//Graph -> Object -> Graph
var attachRootNode = function (graph, obj) {
  var node = Node(obj)

  graph.nodes[node.id] = node
  graph.rootNodeIds.push(node.id)  
  return graph
}

//Graph -> Node -> Node -> Graph
var attachChildNode = function (graph, parentId, obj) {
  var node = Node(obj)

  graph.nodes[node.id]          = node
  graph.nodes[node.id].parentId = parentId
  graph.nodes[parentId].childIds.push(node.id)
  return graph
}

graph.Graph           = Graph
graph.attachRootNode  = attachRootNode
graph.attachChildNode = attachChildNode

module.exports = graph
