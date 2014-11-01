var es          = require("../modules/entity-store")
var EntityStore = window.EntityStore = es.EntityStore
var addEntity   = window.addEntity = es.addEntity
var addEntities = window.addEntities = es.addEntities
var Query       = window.Query = es.Query
var runQuery    = window.runQuery = es.runQuery

function Box (x, y, z, w, h, d) {
  this.physics = {
    position: {
      x: x,
      y: y,
      z: z
    },
    velocity: {
      x: 0,
      y: 0,
      z: 0 
    }
  }
  this.size = {
    x: w,
    y: h,
    z: d 
  }
}

var es = new EntityStore
var b1 = new Box(1,1,1,5,5,5)
var b2 = new Box(2,2,2,5,5,5)
var r1 = { name: "Brett Sanders", isLiving: true }
var r2 = { name: "Todd Powderstone", isLiving: false }
var q1 = new Query({
  fetch:  ['physics'],
  count:  2,
  domain: [1,2]
})
var q2 = new Query({
  fetch: ['name'],
  where: ['isLiving', function (p) { return !!p }]
})
var q3 = new Query({
  fetch: ['physics', 'size'],
  where: ['physics', function (p) { return p.position.x > 1 }]
})

function isArray (ar) {
  return ar.length !== undefined
}

function catTyped (constructor, ar, p) {
  var size    = p.length || 1
  var newAr   = new constructor(ar.length + size) 

  newAr.set(ar, 0)
  if (isArray(p)) newAr.set(p, ar.length)
  else            newAr[ar.length] = p
  return newAr
}

function catInt (ar, p) {
  return catTyped(Uint32Array, ar, p)
}

function catFloat (ar, p) {
  return catTyped(Float32Array, ar, p)
}

es.toTableTransforms.physics = function (physics) {
  var farray = new Float32Array(6) 

  farray[0] = physics.position.x
  farray[1] = physics.position.y
  farray[2] = physics.position.z
  farray[3] = physics.velocity.x
  farray[4] = physics.velocity.y
  farray[5] = physics.velocity.z
  return farray
}

es.appendFunctions.physics  = catFloat
es.appendFunctions.isLiving = catInt

addEntities(es, [b1,b2,r1,r2])

window.es = es
window.q1 = q1
window.q2 = q2
window.q3 = q3
