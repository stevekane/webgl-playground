var B   = require("benchmark")
var now = require("performance-now")
var s   = new B.Suite

function Blob () {
  this.physics = {
    position:     {x: 1, y: 2, z: 3},
    velocity:     {x: .01, y: .02, z: .03},  
    acceleration: {x: .0001, y: .0002, z: .0003}  
  }
  this.collision = {
    x: 4, 
    y: 4, 
    z: 4
  }
  this.renderable   = true
  this.emitter      = {
    timeToDie: 0,
    lifespan:  1000,
  }
  this.isLiving = true
  this.sprite   = 1
  this.animation = {
    sheetIndex:    1,
    animIndex:     1,
    currentFrame:  2,
    nextFrameTime: 0.2,
    shouldLoop:    true 
  }
}

var count        = 1000000
var blobs        = []
var physics      = []
var flatPhysics  = new Float32Array(count * 9)
var flatIsLiving = new Uint8Array(count)
var indices      = []
var fIndices     = new Uint8Array(count)
var blob 

//set a cursor property sort of like length on fIndices to keep track
//of the max value we should iterate to
fIndices.cursor = 0

for (var i = 0; i < count; ++i) {
  blob = new Blob

  if (i % 4 === 0) blob.isLiving = false

  //create array of whole blobs
  blobs.push(blob)

  //create array of physics objects 
  physics.push(blob.physics)

  //store physics props in totally flat float array
  flatPhysics[i*9]   = blob.physics.position.x
  flatPhysics[i*9+1] = blob.physics.position.y
  flatPhysics[i*9+2] = blob.physics.position.z
  flatPhysics[i*9+3] = blob.physics.velocity.x
  flatPhysics[i*9+4] = blob.physics.velocity.y
  flatPhysics[i*9+5] = blob.physics.velocity.z
  flatPhysics[i*9+6] = blob.physics.acceleration.x
  flatPhysics[i*9+7] = blob.physics.acceleration.y
  flatPhysics[i*9+8] = blob.physics.acceleration.z

  flatIsLiving[i] = blob.isLiving

  //select some indices to actually do work on
  if (i % 2 === 0) {
    indices.push(i)
    fIndices[fIndices.cursor++] = i
  }
}

function iterateBlobs () {
  var len = indices.length
  var blob, i

  for (i = 0; i < len; ++i) {
    blob = blobs[indices[i]]

    if (!blob.isLiving) continue
    blob.physics.position.x += blob.physics.velocity.x += blob.physics.acceleration.x 
    blob.physics.position.y += blob.physics.velocity.y += blob.physics.acceleration.y
    blob.physics.position.z += blob.physics.velocity.z += blob.physics.acceleration.z
  }
}

function iteratePhysics () {
  var len = indices.length
  var phys, i, j

  for (i = 0; i < len; ++i) {
    j    = indices[i]
    phys = physics[j]

    if (!flatIsLiving[j]) continue
    phys.position.x += phys.velocity.x += phys.acceleration.x
    phys.position.y += phys.velocity.y += phys.acceleration.y
    phys.position.z += phys.velocity.z += phys.acceleration.z
  }
}

function iterateFlatPhysics () {
  var len = indices.length
  var i, j, k

  for (i = 0; i < len; ++i) {
    j = indices[i]
    k = j * 9
    
    if (!flatIsLiving[j]) continue
    flatPhysics[k]   += flatPhysics[k+3] =+ flatPhysics[k+6] 
    flatPhysics[k+1] += flatPhysics[k+4] =+ flatPhysics[k+7]
    flatPhysics[k+2] += flatPhysics[k+5] =+ flatPhysics[k+8]
  }
}

function iterateUintIndices () {
  var len = fIndices.cursor
  var i, j, k

  for (i = 0; i < len; ++i) {
    j = fIndices[i]
    k = j * 9
    
    if (!flatIsLiving[j]) continue
    flatPhysics[k]   += flatPhysics[k+3] =+ flatPhysics[k+6] 
    flatPhysics[k+1] += flatPhysics[k+4] =+ flatPhysics[k+7]
    flatPhysics[k+2] += flatPhysics[k+5] =+ flatPhysics[k+8]
  }
}

function doAllUint () {
  var len = fIndices.cursor
  var i, j, k

  for (i = 0; i < len; ++i) {
    j = fIndices[i]
    k = j * 9
    
    flatPhysics[k]   += flatPhysics[k+3] =+ flatPhysics[k+6] 
    flatPhysics[k+1] += flatPhysics[k+4] =+ flatPhysics[k+7]
    flatPhysics[k+2] += flatPhysics[k+5] =+ flatPhysics[k+8]
  }
}

function doAll2x () {
  var len = fIndices.cursor
  var i, j1, j2, k1, k2

  for (i = 0; i < len; i+=2) {
    j1 = fIndices[i]
    j2 = fIndices[i+1]
    k1 = j1 * 9
    k2 = j2 * 9
    
    flatPhysics[k1]   += flatPhysics[k1+3] += flatPhysics[k1+6] 
    flatPhysics[k1+1] += flatPhysics[k1+4] += flatPhysics[k1+7]
    flatPhysics[k1+2] += flatPhysics[k1+5] += flatPhysics[k1+8]

    flatPhysics[k2]   += flatPhysics[k2+3] += flatPhysics[k2+6] 
    flatPhysics[k2+1] += flatPhysics[k2+4] += flatPhysics[k2+7]
    flatPhysics[k2+2] += flatPhysics[k2+5] += flatPhysics[k2+8]
  }
}

s.add("whole blob iteration", iterateBlobs)
s.add("physics indices", iteratePhysics)
s.add("flat physics", iterateFlatPhysics)
s.add("uint indices", iterateUintIndices)
s.add("do all", doAllUint)
s.add("do all 2x", doAll2x)

s.on("cycle", function (e) {
  console.log(String(e.target))
})

function wrap (fn) {
  var start = now()
  fn()
  console.log(now() - start + " ms")
}

s.run()
wrap(iterateBlobs)
wrap(iteratePhysics)
wrap(iterateFlatPhysics)
wrap(iterateUintIndices)
wrap(doAllUint)
wrap(doAll2x)
