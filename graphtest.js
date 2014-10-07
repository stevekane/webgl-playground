var prodash      = require("prodash")
var graph        = require("./src/modules/graph")
var Graph        = graph.Graph
var Node         = graph.Node
var attachById   = graph.attachById
var attachToRoot = graph.attachToRoot
var attachToNode = graph.attachToNode
var compose      = prodash.functions.compose
var transduce    = prodash.transducers.transduce
var filtering    = prodash.transducers.filtering
var checking     = prodash.transducers.checking
var plucking     = prodash.transducers.plucking
var mapping      = prodash.transducers.mapping
var cat          = prodash.transducers.cat
var cons         = prodash.transducers.cons

var g  = Graph(Node({id: 1}))
var l1 = Node({light: true, position: new Float32Array([1,2,3])})
var l2 = Node({light: true, position: new Float32Array([4,3,2])})
var l3 = Node({light: true, position: new Float32Array([1,2,4])})

var cloneVec3 = function (x) { 
  return new Float32Array([x[0], x[1], x[2]]) 
}
var getLights             = checking("light", true)
var getPositions          = plucking("position")
var cloning               = mapping(cloneVec3)
var flattenLightPositions = compose([
  getLights,
  getPositions,
  cloning,
  cat
])

var buildLightsList     = transduce(getLights, cons, [])
var buildLightPositions = transduce(flattenLightPositions, cons, [])

attachToRoot(g, l1)
attachToRoot(g, l2)
attachToNode(g, l1, l3)
//console.log(JSON.stringify(g, null, 2))
console.log(buildLightPositions(g))
