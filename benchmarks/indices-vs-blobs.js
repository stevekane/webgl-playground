'use strict';

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

var dT             = .01
var count          = 64000
var blobs          = []
var physics        = []
var flatPhysics    = new Float32Array(count * 9)
var flatIsLiving   = new Uint32Array(count)
var indices        = []
var fIndices       = new Uint32Array(count)
var fLivingIndices = new Uint32Array(count)
var blob 

//set a cursor property sort of like length on an array
fIndices.cursor = 0
fLivingIndices.cursor = 0

for (var i = 0; i < count; ++i) {
  blob = new Blob

  if (i % 3 === 0) blob.isLiving = false

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
    if (blob.isLiving) fLivingIndices[fLivingIndices.cursor++] = i
  }
}

function iterateFlatPhysics () {
  var len       = indices.length
  var dTSquared = dT * dT
  var i, j, k

  for (i = 0; i < len; ++i) {
    j = indices[i]
    k = j * 9
    
    if (!flatIsLiving[j]) continue
    flatPhysics[k]   += (flatPhysics[k+3] * dT)
    flatPhysics[k+1] += (flatPhysics[k+4] * dT)
    flatPhysics[k+2] += (flatPhysics[k+5] * dT)

    flatPhysics[k+3] += (flatPhysics[k+6] * dTSquared)
    flatPhysics[k+4] += (flatPhysics[k+7] * dTSquared)
    flatPhysics[k+5] += (flatPhysics[k+8] * dTSquared)
  }
}

//here we check the isLiving status and exit early if not alive
function iterateUintIndices () {
  var len = fIndices.cursor
  var dTSquared = dT * dT
  var i, j, k

  for (i = 0; i < len; ++i) {
    j = fIndices[i]
    k = j * 9
    
    if (!flatIsLiving[j]) continue
    flatPhysics[k]   += (flatPhysics[k+3] * dT)
    flatPhysics[k+1] += (flatPhysics[k+4] * dT)
    flatPhysics[k+2] += (flatPhysics[k+5] * dT)

    flatPhysics[k+3] += (flatPhysics[k+6] * dTSquared)
    flatPhysics[k+4] += (flatPhysics[k+7] * dTSquared)
    flatPhysics[k+5] += (flatPhysics[k+8] * dTSquared)
  }
}

//here we update only living objects
function iterateLiving () {
  var len = fLivingIndices.cursor
  var dTSquared = dT * dT
  var i, j, k

  for (i = 0; i < len; ++i) {
    j = fLivingIndices[i]
    k = j * 9
    
    flatPhysics[k]   += (flatPhysics[k+3] * dT)
    flatPhysics[k+1] += (flatPhysics[k+4] * dT)
    flatPhysics[k+2] += (flatPhysics[k+5] * dT)

    flatPhysics[k+3] += (flatPhysics[k+6] * dTSquared)
    flatPhysics[k+4] += (flatPhysics[k+7] * dTSquared)
    flatPhysics[k+5] += (flatPhysics[k+8] * dTSquared)
  }
}

s.add("flat physics", iterateFlatPhysics)
s.add("uint indices", iterateUintIndices)
s.add("only living", iterateLiving)

s.on("cycle", function (e) {
  console.log(String(e.target))
})

function wrap (fn) {
  var start = now()
  fn()
  console.log(fn.name)
  console.log(now() - start + " ms")
}

s.run()
wrap(iterateFlatPhysics)
wrap(iterateUintIndices)
wrap(iterateLiving)
