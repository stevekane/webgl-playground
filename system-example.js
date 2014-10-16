let uuid                             = require("node-uuid")
let {transducers, functions, object} = require("prodash")
let {instanceOf}                     = functions
let {hasKeys, hasKey}                = object
let {reduce, cons}                   = transducers

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

function addCollision (doesCollide, obj) {
  obj.doesCollide = doesCollide
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

function addSize (w, h, d, obj) {
  obj.size = new Float32Array([w, h, d])
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

function Box (x, y, z, w, h, d) {
  if (!(this instanceof Box)) return new Box(x, y, z, w, h, d)

  makeEntity(this)
  addPosition(x, y, z, this)
  addVelocity(0.1, 0.1, 0.5, this)
  addSize(w, h, d, this)
  addColor(1.0, 0.0, 0.0, 1.0, this)
  addCollision(true, this)
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

//seems obvious to do this point-free but having bugs... investigate
function flatcat (host, ar) {
  return reduce(cons, host, ar) 
}

function isArrayLike (ar) {
  return instanceOf(Array, ar) ||
         instanceOf(Float32Array, ar) ||
         instanceOf(Uint32Array, ar)
}

//used internally by FlatGraph
function ArrayPointer (index, length) {
  if (!(this instanceof ArrayPointer)) return new ArrayPointer(index, length)

  this.index  = index
  this.length = length
}

/*
use internally by FlatGraph
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
  let posIndeces    = indexPointers.position.indeces
  let velIndeces    = indexPointers.velocity.indeces
  let count         = indexPointers.position.indeces.length
  let positions     = flatGraph.components.position
  let velocities    = flatGraph.components.velocity

  this.run = (dT) => {
    for (var i = 0; i < count; ++i) {
      positions[posIndeces[i]]   += (velocities[velIndeces[i]] * dT)
      positions[posIndeces[i]+1] += (velocities[velIndeces[i]+1] * dT)
      positions[posIndeces[i]+2] += (velocities[velIndeces[i]+2] * dT)
    }
  }
}

//simple AABB in 3d space
function overlaps (p1x, p1y, p1z, s1x, s1y, s1z, p2x, p2y, p2z, s2x, s2y, s2z) {
  //lower bounds
  let lb1x = p1x - s1x
  let lb1y = p1y - s1y
  let lb1z = p1z - s1z
  let lb2x = p2x - s2x
  let lb2y = p2y - s2y
  let lb2z = p2z - s2z
  //upper bounds
  let ub1x = p1x + s1x
  let ub1y = p1y + s1y
  let ub1z = p1z + s1z
  let ub2x = p2x + s2x
  let ub2y = p2y + s2y
  let ub2z = p2z + s2z

  return ((lb2x <= ub1x && ub1x <= ub2x) || (lb1x <= ub2x && ub2x <= ub1x)) &&
         ((lb2y <= ub1y && ub1y <= ub2y) || (lb1y <= ub2y && ub2y <= ub1y)) &&
         ((lb2z <= ub1z && ub1z <= ub2z) || (lb1z <= ub2z && ub2z <= ub1z))
}

function handleCollision (id1, id2) {
  console.log(id1 + " has collided with " + id2)
}

/*
TODO: doesCollide is technically a boolean which COULD be false....would still get picked up here...
probably indicates that the getIndexPointersWith should be more powerful/flexible for writing
rules

TODO: at the moment, collisions with self are recorded.  probably can skip as minor optimization
would need to adjust the size of the pairs array accordingly

This is a VERY naive AABB collision system which simply calls a function with the ids
of the two colliding objects anytime a collision is detected.  This is crappy but proves
that collision is possible and not insane with the flatgraph structure

The OUTPUT of this system is a little tricky to understand.  An array is pre-allocated and is
of fixed maximum size.  This maximum size is computed by taking the total number of colliders,
and squaring it then multiplying by two.  This is because [1,2] and [2,1] will both be recorded
even though they are "the same collision".  

As a collision is detected, the index for the id of each collider is added to the pairs array
as a flat tuple.  

for example, if the array is initially 
let pairs     = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] 
let pairCount = 0
and we detect a collision between the object at
idIndex == 1 and idIndex == 2 
then we want the following changes to be the result
pairs     === [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0]
pairCount === 1

*/
function CollisionSystem (flatGraph) {
  let indexPointers = getIndexPointersWith(["id", "position", "size", "doesCollide"], flatGraph)
  let posIndeces    = indexPointers.position.indeces
  let sizeIndeces   = indexPointers.size.indeces
  let idIndeces     = indexPointers.id.indeces
  let count         = indexPointers.position.indeces.length
  let positions     = flatGraph.components.position
  let sizes         = flatGraph.components.size
  let ids           = flatGraph.components.id

  let pairs         = new Uint32Array(count * count * 2) 
  let pairCount     = 0

  let p1x, p1y, p1z
  let p2x, p2y, p2z
  let s1x, s1y, s1z
  let s2x, s2y, s2z
  let id1, id2

  this.run = (dT) => {
    pairCount = 0

    //build collisions
    for (var i = 0; i < count; ++i) {
      for (var j = 0; j < count; ++j) {
        id1  = ids[idIndeces[i]]
        id2  = ids[idIndeces[j]]
        p1x  = positions[posIndeces[i]]
        p1y  = positions[posIndeces[i]+1]
        p1z  = positions[posIndeces[i]+2]
        p2x  = positions[posIndeces[j]]
        p2y  = positions[posIndeces[j]+1]
        p2z  = positions[posIndeces[j]+2]
        s1x = sizes[sizeIndeces[i]] 
        s1y = sizes[sizeIndeces[i]+1] 
        s1z = sizes[sizeIndeces[i]+2]
        s2x = sizes[sizeIndeces[j]] 
        s2y = sizes[sizeIndeces[j]+1] 
        s2z = sizes[sizeIndeces[j]+2]
        if (overlaps(p1x, p1y, p1z, s1x, s1y, s1z, p2x, p2y, p2z, s2x, s2y, s2z)) {
          if (id1 !== id2) {
            pairs[pairCount*2]   = idIndeces[i]  
            pairs[pairCount*2+1] = idIndeces[j]  
            pairCount++
          }
        }
      }
    }
    
    //handle collisions
    console.log(pairs.subarray(0, pairCount * 2))
  }
}

let g  = Graph()
let p1 = Point()
let p2 = Point()
let p3 = Point()
let l1 = Light()
let l2 = Light()
let b1 = Box(5, 5, 5, 10, 10, 10)
let b2 = Box(0, 0, 0, 3, 3, 3)
let b3 = Box(11, 11, 11, 4, 4, 6)

attachToRoot(g, p1)
attachToRoot(g, p2)
attachToRoot(g, l1)
attachToRoot(g, l2)
attachToRoot(g, b1)
attachToRoot(g, b2)
attachToRoot(g, b3)
attachToNode(g, p1, p3)

let fg              = FlatGraph(g)
var physicsSystem   = new PhysicsSystem(fg)
var collisionSystem = new CollisionSystem(fg)

for (var m = 0; m < 1; ++m) {
  physicsSystem.run(.1)
  collisionSystem.run(.1)
}
