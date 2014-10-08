var prodash      = require("prodash")
var graph        = require("./src/modules/graph")
var light        = require("./src/modules/light")
var Graph        = graph.Graph
var attachToRoot = graph.attachToRoot
var attachToNode = graph.attachToNode
var PointLight   = light.PointLight
var compose      = prodash.functions.compose
var transduce    = prodash.transducers.transduce
var checking     = prodash.transducers.checking
var plucking     = prodash.transducers.plucking
var cat          = prodash.transducers.cat
var cons         = prodash.transducers.cons

var g           = Graph()
var l1          = PointLight(1,2,3)
var l2          = PointLight(4,3,2)
var l3          = PointLight(1,2,4)
var n           = {type: "notlight"}
var lights      = []
var positions   = []
var colors      = []
var intensities = []

var isLight = checking("light", true)
var flatten = function (propName) { 
  return compose([plucking(propName), cat])
}

attachToRoot(g, l1)
attachToRoot(g, l2)
attachToNode(g, l1, l3)
attachToNode(g, l3, n)

lights      = transduce(isLight, cons, [], g)
positions   = transduce(flatten("position"), cons, [], lights)
colors      = transduce(flatten("rgb"), cons, [], lights)
intensities = transduce(plucking("intensity"), cons, [], lights)
console.log(positions)
console.log(colors)
console.log(intensities)
