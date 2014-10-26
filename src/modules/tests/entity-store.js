var test           = require("tape")
var mod            = require("../entity-store")
var EntityStore    = mod.EntityStore
var addEntity      = mod.addEntity
var addEntities    = mod.addEntities
var Query          = mod.Query
var runQuery       = mod.runQuery
var query          = mod.query
var queryMany      = mod.queryMany
var optimizeTables = mod.optimizeTables

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

test('query returns expected lookup information', function (t) {
  var es = new EntityStore
  var b1 = new Box(1,1,1,5,5,5)
  var b2 = new Box(2,2,2,5,5,5)
  var r  = { name: "Brett Sanders" }
  var fn = function (e) { return !!e.physics }
  var q

  addEntities(es, [b1, b2, r])
  q = query(es, fn, "physics")
  t.plan(2)
  t.same(q.indices, [0,1])
  t.same(q.lengths, [1,1])
})

test('queryMany returns expected lookup indicies', function (t) {
  var es = new EntityStore
  var b1 = new Box(1,1,1,5,5,5)
  var b2 = new Box(2,2,2,5,5,5)
  var r  = { name: "Brett Sanders" }
  var fn = function (e) { return !!e.physics && !!e.size }
  var q

  addEntities(es, [b1, b2, r])
  q = queryMany(es, fn, ["physics", "size"])
  t.plan(4)
  t.same(q.indices.physics, [0,1])
  t.same(q.lengths.physics, [1,1])
  t.same(q.indices.size, [0,1])
  t.same(q.lengths.size, [1,1])
})

test('queryChildren returns correct indices', function (t) {
  var es = new EntityStore
  var b1 = new Box(1,1,1,5,5,5)
  var b2 = new Box(2,2,2,5,5,5)
  var r1 = { name: "Brett Sanders" }
  var r2 = { name: "Todd Powderstone", parentId: 1 }
  var fn = function (e) { return !!e.physics && !!e.size }
  var q

  addEntities(es, [b1, b2, r1, r2])
  t.plan(1)
  t.true(true)
})

test('Query constructor works as expected', function (t) {
  var es = new EntityStore
  var b1 = new Box(1,1,1,5,5,5)
  var b2 = new Box(2,2,2,5,5,5)
  var r1 = { name: "Brett Sanders" }
  var r2 = { name: "Todd Powderstone" }
  var q  = new Query({
    fetch: ['physics'],
    where: function (e) { return !!e.physics },
    count: 2,
    range: [1,2]  
  })

  t.plan(1)
  t.true(true)
  addEntities(es, [b1, b2, r1, r2])
  runQuery(es, q)
  console.log(q)
})
