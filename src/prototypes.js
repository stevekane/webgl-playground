(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var es = {}

function cons (list, el) {
  list.push(el)
  return list
}

function slice (start, end, list) {
  if      (list.slice)    return list.slice(start, end)
  else if (list.subarray) return list.subarray(start, end)
}

function passThrough (val) {
  return val
}

function EntityStore () {
  this.nodes               = [] 
  this.tables              = {}
  this.toTableTransforms   = {}
  this.fromTableTransforms = {}
  this.appendFunctions     = {}
}

function addComponent (es, node, key, val) {
  var append    = es.appendFunctions[key]   || cons 
  var transform = es.toTableTransforms[key] || passThrough
  var initialLength
  var finalLength

  es.tables[key] = es.tables[key] || []
  initialLength  = es.tables[key].length
  es.tables[key] = append(es.tables[key], transform(val))
  finalLength    = es.tables[key].length
  //node[key] = {
  //  index:  initialLength,
  //  length: finalLength - initialLength
  //}  

  //experimentally add getters/setters for this object
  Object.defineProperty(key, {
    get: function () {
      return slice(tables[key], initialLength, finalLength)
    },
    set: function (val) {
           
    }
  })
}

function addEntity (es, e) {
  var tableKeys = Object.keys(e)
  var eid       = es.nodes.length
  var i         = tableKeys.length
  var node      = {}
   
  es.nodes.push(node)
  while (i--) addComponent(es, node, tableKeys[i], e[tableKeys[i]])
  return eid
}

function addEntities (es, entities) {
  var i = entities.length

  while (i--) addEntity(es, entities[i])
}

function Query (options) {
  if (!options.fetch) throw new Error("Bad Query!")

  this.fetch  = options.fetch
  this.where  = options.where || []
  this.count  = options.count || null
  this.domain = options.domain || null
  this.result = {
    count:   0,
    indices: {},
    lengths: {} 
  }

  for (var i = 0; i < options.fetch.length; ++i) {
    this.result.indices[options.fetch[i]] = []
    this.result.lengths[options.fetch[i]] = []
  }
}

function has (e, keys) {
  for (var i = 0; i < keys.length; ++i) {
    if (!e[keys[i]]) return false
  }
  return true
}

//Where clauses are flat arrays of tuples [propname, fn, propname, fn...]
function where (es, node, whereClauses) {
  var key
  var val
  var fn
  var index
  var count

  //escape early if no key defined.  else check the actual value(s)
  for (var i = 0; i < whereClauses.length; i+=2) {
    key = whereClauses[i]
    fn  = whereClauses[i+1]
    if (!node[key]) return false

    count = node[key].length
    index = node[key].index
    val   = count > 1 
      ? slice(index, index + count, es.tables[key][index])
      : es.tables[key][index]
    if (!fn(val)) return false
  }
  return true
}

function runBoundedQuery (es, query) {
  var tableName
  var node

  query.result.count = 0

  for (var i = 0; i < query.domain.length; ++i) {
    node = es.nodes[query.domain[i]]

    if (query.count && query.result.count >= query.count) break
    if (has(node, query.fetch) && where(es, node, query.where)) {
      for (var k = 0; k < query.fetch.length; ++k) {
        tableName = query.fetch[k]

        query.result.count++
        query.result.indices[tableName].push(node[tableName].index)
        query.result.lengths[tableName].push(node[tableName].length)
      }
    }
  }
  return query
}

function runUnboundedQuery (es, query) {
  var tableName
  var node

  query.result.count = 0

  for (var i = 0; i < es.nodes.length; ++i) {
    node = es.nodes[i]

    if (query.count && (query.result.count >= query.count)) break
    if (has(node, query.fetch) && where(es, node, query.where)) {
      for (var k = 0; k < query.fetch.length; ++k) {
        tableName = query.fetch[k]

        query.result.count++
        query.result.indices[tableName].push(node[tableName].index)
        query.result.lengths[tableName].push(node[tableName].length)
      }
    }
  }
  return query
}

function runQuery (es, query) {
  if (query.domain) return runBoundedQuery(es, query)
  else              return runUnboundedQuery(es, query)
}

es.EntityStore  = EntityStore
es.addEntity    = addEntity
es.addEntities  = addEntities
es.addComponent = addComponent
es.runQuery     = runQuery
es.Query        = Query
module.exports  = es

},{}],2:[function(require,module,exports){
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

},{"../modules/entity-store":1}]},{},[2])