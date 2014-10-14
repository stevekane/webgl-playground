let uuid                                     = require("node-uuid")
let {transducers, functions}                 = require("prodash")
let {compose, instanceOf}                    = functions
let {filtering, plucking, cat, reduce, cons} = transducers

let print = (c) => console.log(JSON.stringify(c, null, 2))

function makeEntity (obj={}) { 
  obj.id       = uuid.v4() 
  obj.parentId = ""
  obj.childIds = []
  return obj
}

function addPosition (x, y, z, obj) {
  obj.position = new Float32Array([x,y,z])
}

function addVelocity (vx, vy, vz, obj) {
  obj.velocity = new Float32Array([vx, vy, vz])
}

function addLiving (isLiving, obj) {
  obj.isLiving = isLiving
}

function Point () {
  if (!(this instanceof Point)) return new Point
  
  makeEntity(this)
  addPosition(1, 1, 1, this)
  addVelocity(.01, .01, .01, this)
  addLiving(true, this)
}


function Graph () {
  if (!(this instanceof Graph)) return new Graph

  let rootNode = makeEntity() 
  
  this.nodes              = {}
  this.rootNodeId         = rootNode.id
  this.nodes[rootNode.id] = rootNode
}

function nodeReduce (redFn, nodeId, accum, graph) {
  let node = graph.nodes[nodeId]

  redFn(accum, node)
  for (var i = 0; i < node.childIds.length; ++i) {
    nodeReduce(redFn, node.childIds[i], accum, graph)   
  }
  return accum
}

Graph.prototype.__reduce = function (redFn, accum, graph) {
  return nodeReduce(redFn, graph.rootNodeId, accum, graph)
}

Graph.prototype.__empty = function () { 
  return new Graph 
}

//Graph -> Id -> Node -> Graph
function attachById (graph, parentId, node) {
  graph.nodes[node.id]          = node
  graph.nodes[node.id].parentId = parentId
  graph.nodes[parentId].childIds.push(node.id)
  return graph
}

//Graph -> Node -> Graph
function attachToRoot (graph, node) {
  return attachById(graph, graph.rootNodeId, node) 
}

//Graph -> Node -> Node -> Graph
function attachToNode (graph, parentNode, node) {
  return attachById(graph, parentNode.id, node)
}

function flatcat (host, ar) {
  for (var i = 0; i < ar.length; ++i) {
    host.push(ar[i]) 
  }
  return host
}

/*
N.B. internally used by FlatGraph
create components array if not already defined
create node ledger if not already defined
assign index for this node ledger to the current length of the array (the next index)
*/
function appendComponent (fg, componentName, node) {
  let val            = node[componentName]

  fg.components[componentName]     = fg.components[componentName] || []
  fg.nodes[node.id]                = fg.nodes[node.id] || {}
  fg.nodes[node.id][componentName] = fg.components[componentName].length

  if      (instanceOf(Array, val))        flatcat(fg.components[componentName], val)
  else if (instanceOf(Float32Array, val)) flatcat(fg.components[componentName], val)
  else if (instanceOf(Uint32Array, val))  flatcat(fg.components[componentName], val)
  else                                    fg.components[componentName].push(val)
}

//N.B. internally used by FlatGraph
function updateFlatGraph (fg, node) {
  let keys = Object.keys(node)
  let key
  let componentIndex

  for (var i = 0; i < keys.length; ++i) {
    key            = keys[i]
    if (node[key] !== undefined) appendComponent(fg, key, node)
  }
  return fg
}

function FlatGraph (graph) {
  if (!(this instanceof FlatGraph)) return new FlatGraph(graph)

  this.nodes      = {}
  this.components = {}
  
  return reduce(updateFlatGraph, this, graph)
}

let g  = Graph()
let p1 = Point()
let p2 = Point()
let p3 = Point()

attachToRoot(g, p1)
attachToRoot(g, p2)
attachToNode(g, p1, p3)

let fg = FlatGraph(g)

print(fg)

//function updatePositions () {
//  let posI = 0
//  let velI = 0
//
//  for (var i = 0; i < count; ++i) {
//    posI               = posIndeces[i]
//    velI               = velIndeces[i]
//    positions[posI]   += velocities[velI]
//    positions[posI+1] += velocities[velI+1]
//    positions[posI+2] += velocities[velI+2]
//  }
//}
