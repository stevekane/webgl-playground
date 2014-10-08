let {transducers, functions}                         = require("prodash")
let {Graph, attachToRoot, attachToNode}              = require("./src/modules/graph")
let {PointLight}                                     = require("./src/modules/light")
let {compose}                                        = functions
let {transduce, into, checking, plucking, cat, cons} = transducers

let g           = Graph()
let l1          = PointLight(1,2,3)
let l2          = PointLight(4,3,2)
let l3          = PointLight(1,2,4)
let n           = {type: "notlight"}
let lights      = []
let positions   = []
let colors      = []
let intensities = []

let isLight = checking("light", true)
let flatten = (propName) => compose([plucking(propName), cat])
let over    = (arr, redFn, col) => {
  arr.length = 0
  return into(arr, redFn, col)
}

attachToRoot(g, l1)
attachToRoot(g, l2)
attachToNode(g, l1, l3)
attachToNode(g, l3, n)
over(lights, isLight, g)
over(positions, flatten("position"), lights)
over(colors, flatten("rgb"), lights)
over(intensities, plucking("intensity"), lights)

console.log(positions)
console.log(colors)
console.log(intensities)
