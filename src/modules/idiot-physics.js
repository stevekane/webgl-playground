var collision     = require("./collision") 
var overlapAABB3d = collision.overlapAABB3d
var physics       = {}

function checkAll (pairs, ents) {
  var entityCount = ents.length

  var p1x, p1y, p1z
  var p2x, p2y, p2z
  var s1x, s1y, s1z
  var s2x, s2y, s2z
  var id1, id2
  var e1, e2

  pairs.length = 0

  for (var i = 0; i < entityCount; ++i) {
    for (var j = 0; j < entityCount; ++j) {
      e1  = ents[i]
      id1 = e1.id
      p1x = e1.position[0]
      p1y = e1.position[1]
      p1z = e1.position[2]
      s1x = e1.size[0]
      s1y = e1.size[1]
      s1z = e1.size[2]

      e2  = ents[j]
      id2 = e2.id
      p2x = e2.position[0]
      p2y = e2.position[1]
      p2z = e2.position[2]
      s2x = e2.size[0]
      s2y = e2.size[1]
      s2z = e2.size[2]
      if (id1 === id2) continue
      if (overlapAABB3d(p1x,p1y,p1z,s1x,s1y,s1z,p2x,p2y,p2z,s2x,s2y,s2z)) {
        pairs.push(id1)
        pairs.push(id2)
      }
    }
  }
    
  return pairs
}

function resolveCollisions (pairs, ents) {

}

function System (nearphase, broadphase) {
  this.pairs      = []
  this.nearphase  = nearphase || checkAll
  this.broadphase = broadphase || resolveCollisions

  this.run = function () {
  
  }
}

physics.System            = System
physics.checkAll          = checkAll
physics.resolveCollisions = resolveCollisions
module.exports            = physics
