var B = require("benchmark")

/*
 * The goal here is to explore the performance tradeoffs when iterating
 * over objects to perform an update.  In particular, we want to know what
 * overhead is associated with the following factors:
 *
 * 1) Size of object
 * 2) Regularity of object's "types"
 * 3) 
 *
 *
 *
 */

function SmallObject () {
  this.x  = 1
  this.y  = 2
  this.z  = 3
  this.dx = .1
  this.dy = .1
  this.dz = .1
}

function SmallObjectNested () {
  this.position = {
    x: 1,
    y: 2,
    z: 3 
  }
  this.velocity = {
    x: .1,
    y: .1,
    z: .1 
  }
}

function SmallNestedArrayObject () {
  this.position = new Float32Array([1,2,3])
  this.velocity = new Float32Array([.1,.1,.1])
}

var count = 100000
var sos   = []
var sons  = []
var sonas = []
var fta   = new Float32Array(count * 6)
var ita   = new Uint32Array(count * 6)
var ijsa  = []
var fjsa  = []
var poss  = new Float32Array(count * 3)
var vels  = new Float32Array(count * 3)

for (var i = 0; i < count; ++i) {
  sos.push(new SmallObject)
  sons.push(new SmallObjectNested)
  sonas.push(new SmallNestedArrayObject)
  fta.set([1, 2, 3, 0.1, 0.1, 0.1], i*6)
  ita.set([1, 2, 3, 1, 1, 1], i*6)
  
  poss.set([1, 2, 3], i*3) 
  vels.set([0.1, 0.1, 0.1], i*3) 
  
  //push group of ints
  ijsa.push(1)
  ijsa.push(2)
  ijsa.push(3)
  ijsa.push(1)
  ijsa.push(1)
  ijsa.push(1)

  //push group of floats
  fjsa.push(1.0)
  fjsa.push(2.0)
  fjsa.push(3.0)
  fjsa.push(0.1)
  fjsa.push(0.1)
  fjsa.push(0.1)
}

var suite = new B.Suite

suite.add("small objects", function () {
  var obj

  for (var j = 0; j < sos.length; ++j) {
    obj    = sos[j]
    obj.x += obj.dx
    obj.y += obj.dy
    obj.z += obj.dz
  }
})

suite.add("small nested objects", function () {
  var obj

  for (var j = 0; j < sons.length; ++j) {
    obj             = sons[j]
    obj.position.x += obj.velocity.x
    obj.position.y += obj.velocity.y
    obj.position.z += obj.velocity.z
  }
})

suite.add("small nested array object", function () {
  var obj

  for (var j = 0; j < sonas.length; ++j) {
    obj              = sonas[j] 
    obj.position[0] += obj.velocity[0]
    obj.position[1] += obj.velocity[1]
    obj.position[2] += obj.velocity[2]
  }
})

suite.add("flat floats array", function () {
  for (var j = 0; j < fta.length; j+=6) {
    fta[j]   += fta[j+3]
    fta[j+1] += fta[j+4]
    fta[j+2] += fta[j+5]
  }
})

suite.add("separate flat float arrays", function () {
  for (var j = 0; j < poss.length; j+=3) {
    poss[j]   += vels[j]  
    poss[j+1] += vels[j+1]  
    poss[j+2] += vels[j+2]  
  }
})

suite.add("flat ints array", function () {
  for (var j = 0; j < ita.length; j+=6) {
    ita[j]   += ita[j+3]
    ita[j+1] += ita[j+4]
    ita[j+2] += ita[j+5]
  }
})

suite.add("flat jsarray ints", function () {
  for (var j = 0; j < ijsa.length; j+=6) {
    ijsa[j]   += ijsa[j+3]
    ijsa[j+1] += ijsa[j+4]
    ijsa[j+2] += ijsa[j+5]
  }
})

suite.add("flat jsarray floats", function () {
  for (var j = 0; j < fjsa.length; j+=6) {
    fjsa[j]   += fjsa[j+3]
    fjsa[j+1] += fjsa[j+4]
    fjsa[j+2] += fjsa[j+5]
  }
})

suite.on("cycle", function (e) {
  console.log(String(e.target))
})

suite.on("complete", function () {
  console.log(this.filter("fastest").pluck("name"))
})

suite.run()
