let uuid                                     = require("node-uuid")
let {transducers, functions, object}         = require("prodash")
let {compose, instanceOf}                    = functions
let {hasKeys, hasKey}                        = object
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

function addColor (r, g, b, a, obj) {
  obj.color = new Float32Array([r, g, b, a])
}

function addDirection (dx, dy, dz, obj) {
  obj.direction = new Float32Array([dx, dy, dz])
}

function addIntensity (i, obj) {
  obj.intensity = i
}

function Point () {
  if (!(this instanceof Point)) return new Point
  
  makeEntity(this)
  addPosition(1, 1, 1, this)
  addVelocity(0.0, .01, .04, this)
  addLiving(true, this)
}

function Light () {
  if (!(this instanceof Light)) return new Light

  makeEntity(this)
  addPosition(1, 1, 1, this)
  addVelocity(0.1, 0.1, 0.5, this)
  addColor(1.0, 0.0, 0.0, 1.0, this)
  addDirection(1.0, 1.0, 1.0, this)
  addIntensity(0.6, this)
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

function isArrayLike (ar) {
  return instanceOf(Array, ar) ||
         instanceOf(Float32Array, ar) ||
         instanceOf(Uint32Array, ar)
}

//N.B. used internally by FlatGraph
function ArrayPointer (index, length) {
  if (!(this instanceof ArrayPointer)) return new ArrayPointer(index, val)

  this.index  = index
  this.length = length
}

/*
N.B. internally used by FlatGraph
create components array if not already defined
create node ledger if not already defined
assign index for this node ledger to the current length of the array (the next index)
define the range of indeces (defaults to 1 for non-array values)
*/
function appendComponent (fg, componentName, node) {
  let val = node[componentName]

  fg.components[componentName] = fg.components[componentName] || []
  fg.nodes[node.id]            = fg.nodes[node.id] || {}

  if (isArrayLike(val)) {
    fg.nodes[node.id][componentName] = new ArrayPointer(fg.components[componentName].length, val.length)
    flatcat(fg.components[componentName], val) 
  } else {
    fg.nodes[node.id][componentName] = new ArrayPointer(fg.components[componentName].length, 1)
    fg.components[componentName].push(val) 
  }
}

//N.B. internally used by FlatGraph
function updateFlatGraph (fg, node) {
  let keys = Object.keys(node)

  for (var i = 0; i < keys.length; ++i) {
    appendComponent(fg, keys[i], node)
  }
  return fg
}

function FlatGraph (graph) {
  if (!(this instanceof FlatGraph)) return new FlatGraph(graph)

  this.nodes      = {}
  this.components = {}
  reduce(updateFlatGraph, this, graph)
}

//given a set of conditions, return the indexes that satisfy the condition for each field
function getIndexPointersWith (fields, flatGraph) {
  let nodeIds       = Object.keys(flatGraph.nodes)
  let indexPointers = {}
  let node    

  for (var j = 0; j < fields.length; ++j) {
    indexPointers[fields[j]] = {
      indeces: [],
      lengths: [] 
    }
  }

  for (var i = 0; i < nodeIds.length; ++i) {
    node = flatGraph.nodes[nodeIds[i]]
    if (hasKeys(fields, node)) {
      for (var k = 0; k < fields.length; ++k) {
        indexPointers[fields[k]].indeces.push(node[fields[k]].index)
        indexPointers[fields[k]].lengths.push(node[fields[k]].length)
      }  
    }
  }
  return indexPointers
}

//Experimental OOP-style System Constructor.  Computes indeces during construction
function PhysicsSystem (flatGraph) {
  let indexPointers = getIndexPointersWith(["position", "velocity"], flatGraph)

  this.posIndeces    = indexPointers.position.indeces
  this.velIndeces    = indexPointers.velocity.indeces
  this.count         = indexPointers.position.indeces.length
  this.positions     = flatGraph.components.position
  this.velocities    = flatGraph.components.velocity
  this.run           = (dT) => {
    for (var i = 0; i < this.count; ++i) {
      this.positions[this.posIndeces[i]]   += (this.velocities[this.velIndeces[i]] * dT)
      this.positions[this.posIndeces[i]+1] += (this.velocities[this.velIndeces[i]+1] * dT)
      this.positions[this.posIndeces[i]+2] += (this.velocities[this.velIndeces[i]+2] * dT)
    }
  }
}

let g  = Graph()
let p1 = Point()
let p2 = Point()
let p3 = Point()
let l1 = Light()
let l2 = Light()

attachToRoot(g, p1)
//attachToRoot(g, p2)
//attachToRoot(g, l1)
//attachToRoot(g, l2)
//attachToNode(g, p1, p3)

let fg            = FlatGraph(g)
var physicsSystem = new PhysicsSystem(fg)
var i             = 0

for (var m = 0; m < 10; ++m) {
  physicsSystem.run(.1)
  console.log(fg.components.position)
}
