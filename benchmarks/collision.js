var B             = require("benchmark")
var randBound     = require("../src/modules/random").randBound
var Vec3          = require("../src/modules/vec3").Vec3
var overlapAABB3d = require("../src/modules/collision").overlapAABB3d

function Ent (id) {
  this.id       = id
  this.position = Vec3(randBound(0, 1000), randBound(0, 1000), randBound(0, 1000))
  this.size     = Vec3(randBound(0, 100), randBound(0, 100), randBound(0, 100))
}

Ent.prototype.toString = function () {
  var positions = Array.prototype.join.call(this.position, ", ")
  var sizes     = Array.prototype.join.call(this.size, ", ")

  return "position: " + positions + " size: " + sizes
}

function checkAll (ents) {
  var count     = ents.length
  var pairs     = []
  var pairCount = 0
  var opCount   = 0 

  var p1x, p1y, p1z
  var p2x, p2y, p2z
  var s1x, s1y, s1z
  var s2x, s2y, s2z
  var id1, id2

  //build collisions
  for (var i = 0; i < count; ++i) {
    for (var j = 0; j < count; ++j) {
      opCount++
      id1 = ents[i].id
      p1x = ents[i].position[0]
      p1y = ents[i].position[1]
      p1z = ents[i].position[2]
      s1x = ents[i].size[0]
      s1y = ents[i].size[1]
      s1z = ents[i].size[2]

      id2 = ents[j].id
      p2x = ents[j].position[0]
      p2y = ents[j].position[1]
      p2z = ents[j].position[2]
      s2x = ents[j].size[0]
      s2y = ents[j].size[1]
      s2z = ents[j].size[2]
      if (overlapAABB3d(p1x, p1y, p1z, s1x, s1y, s1z, p2x, p2y, p2z, s2x, s2y, s2z)) {
        if (id1 !== id2) {
          pairs[pairCount*2]   = id1
          pairs[pairCount*2+1] = id2
          pairCount++
        }
      }
    }
  }
    
  return pairs
}

function checkQuadCubes (ents) {
  var quads = [[], [], [], [], [], [], [], []]
  var pairs = []
  var groupResult, ent, x, y, z, sx, sy, sz

  //bundle up ids by quadrants they intersect
  for (var i = 0; i < ents.length; ++i) {
    ent = ents[i]
    x   = ent.position[0]
    y   = ent.position[1]
    z   = ent.position[2]
    sx  = ent.size[0]
    sy  = ent.size[1]
    sz  = ent.size[2]
     
    if (overlapAABB3d(x,y,z,sx,sy,sz,250,750,750,250,250,250)) quads[0].push(ent)
    if (overlapAABB3d(x,y,z,sx,sy,sz,750,750,750,250,250,250)) quads[1].push(ent) 
    if (overlapAABB3d(x,y,z,sx,sy,sz,250,750,250,250,250,250)) quads[2].push(ent)
    if (overlapAABB3d(x,y,z,sx,sy,sz,750,750,250,250,250,250)) quads[3].push(ent)
    if (overlapAABB3d(x,y,z,sx,sy,sz,250,250,750,250,250,250)) quads[4].push(ent)
    if (overlapAABB3d(x,y,z,sx,sy,sz,750,250,750,250,250,250)) quads[5].push(ent)
    if (overlapAABB3d(x,y,z,sx,sy,sz,250,250,250,250,250,250)) quads[6].push(ent)
    if (overlapAABB3d(x,y,z,sx,sy,sz,750,250,250,250,250,250)) quads[7].push(ent)
  }

  //test each quad group
  for (var j = 0; j < quads.length; ++j) {
    pairs = pairs.concat(checkAll(quads[j]))
  }
  return pairs
}

var ents = []

for (var i = 0; i < 30; ++i) {
  ents.push(new Ent(i))
}

console.log(checkQuadCubes(ents))

var s = new B.Suite
//s.add("all", function () {
//  checkAll(ents)
//})
//s.add("quadCube", function () {
//  checkQuadCubes(ents)
//})
//s.on("cycle", function (e) {
//  console.log(String(e.target))
//})
//
//s.run()
