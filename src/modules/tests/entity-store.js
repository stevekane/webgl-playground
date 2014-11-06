var test           = require("tape")
var mod            = require("../entity-store")
var EntityStore    = mod.EntityStore
var addEntity      = mod.addEntity
var addEntities    = mod.addEntities
var Query          = mod.Query
var runQuery       = mod.runQuery
var queryActive    = mod.queryActive

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
  this.isActive = true
}

test('EntityStore has nodes and components', function (t) {
  var es = new EntityStore

  t.plan(2)
  t.same({}, es.tables)
  t.same([], es.nodes)
})

test('addEntity appends the entity to the nodes array', function (t) {
  var es = new EntityStore
  var b  = new Box(1,1,1,5,5,5)

  addEntity(es, b)
  t.plan(5)
  t.same(es.nodes.length, 1)
  t.true(es.nodes[0].physics !== undefined)
  t.true(es.nodes[0].size    !== undefined)
  t.same(es.tables.physics.length, 1)
  t.same(es.tables.size.length, 1)
})

test('addEntity with transform function does correct stuff', function (t) {
  var es       = new EntityStore
  var b1       = new Box(1,1,1,5,5,5)
  var b2       = new Box(2,2,2,5,5,5)
  var expected = new Float32Array([1,1,1,0,0,0,2,2,2,0,0,0])

  es.toTableTransforms.physics = function (e) {
    var farray = new Float32Array(6) 

    farray[0] = e.position.x
    farray[1] = e.position.y
    farray[2] = e.position.z
    farray[3] = e.velocity.x
    farray[4] = e.velocity.y
    farray[5] = e.velocity.z
    return farray
  }
  es.appendFunctions.physics = function (far, p) {
    var newFar = new Float32Array(far.length + p.length)  

    newFar.set(far, 0)
    newFar.set(p, far.length)
    return newFar
  }

  addEntity(es, b1)
  addEntity(es, b2)
  t.plan(1)
  t.same(expected, es.tables.physics)
})

test('Query constructor works as expected', function (t) {
  var es = new EntityStore
  var b1 = new Box(1,1,1,5,5,5)
  var b2 = new Box(2,2,2,5,5,5)
  var r1 = { name: "Brett Sanders", isActive: true }
  var r2 = { name: "Todd Powderstone", isActive: false }
  var q1 = new Query({
    fetch:  ['physics'],
    count:  2,
    domain: [1,2]
  })
  var q2 = new Query({
    fetch: ['name'],
    where: ['isActive', function (p) { return !!p }]
  })
  var q3 = new Query({
    fetch: ['physics', 'size'],
    where: ['physics', function (p) { return p.position.x > 1 }]
  })

  addEntities(es, [b1, b2, r1, r2])
  runQuery(es, q1)
  runQuery(es, q2)
  runQuery(es, q3)
  t.plan(1)
  t.same(q1.result.count, 1)
  t.same(q2.result.count, 1)
  t.same(q3.result.count, 1)
})

test('queryActive returns only results where isActive is true', function (t) {
  var es = new EntityStore
  var b1 = new Box(1,1,1,5,5,5)
  var b2 = new Box(2,2,2,5,5,5)
  var r1 = { name: "Brett Sanders",    isActive: true }
  var r2 = { name: "Todd Powderstone", isActive: false }
  var q1 = new Query({
    fetch:  ['physics'],
  })
  var q2 = new Query({
    fetch:  ['name'],
  })

  addEntities(es, [b1, b2, r1, r2])
  queryActive(es, q1)
  queryActive(es, q2)
  t.plan(2)
  t.same(q1.result.count, 2)
  t.same(q2.result.count, 1)
})
