'use strict';

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
  node[key] = {
    index:  initialLength,
    length: finalLength - initialLength
  }  
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
  var maxSize = 10000
  var indices 
  var lengths

  this.fetch  = options.fetch
  this.where  = options.where  || []
  this.count  = options.count  || null
  this.domain = options.domain || null
  this.result = {
    count:   0,
    indices: {},
    lengths: {} 
  }

  for (var i = 0; i < options.fetch.length; ++i) {
    indices = new Uint32Array(maxSize)
    lengths = new Uint32Array(maxSize)
    indices.len = 0
    lengths.len = 0
    this.result.indices[options.fetch[i]] = indices
    this.result.lengths[options.fetch[i]] = lengths
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
  var indices
  var lengths

  query.result.count = 0

  //reset the results
  for (var i = 0; i < query.fetch.length; ++i) {
    tableName = query.fetch[i]
    query.result.indices[tableName].len = 0
    query.result.lengths[tableName].len = 0
  }

  for (var j = 0; j < query.domain.length; ++j) {
    node = es.nodes[query.domain[j]]

    if (query.count && (query.result.count >= query.count)) break
    if (has(node, query.fetch) && where(es, node, query.where)) {
      query.result.count++
      for (var k = 0; k < query.fetch.length; ++k) {
        tableName = query.fetch[k]
        indices   = query.result.indices[tableName]
        lengths   = query.result.lengths[tableName]
        indices[indices.len++] = node[tableName].index
        lengths[lengths.len++] = node[tableName].length
      }
    }
  }
  return query
}

function runUnboundedQuery (es, query) {
  var tableName
  var node
  var indices
  var lengths

  query.result.count = 0

  //reset the results
  for (var i = 0; i < query.fetch.length; ++i) {
    tableName = query.fetch[i]
    query.result.indices[tableName].len = 0
    query.result.lengths[tableName].len = 0
  }

  for (var j = 0; j < es.nodes.length; ++j) {
    node = es.nodes[j]

    if (query.count && (query.result.count >= query.count)) break
    if (has(node, query.fetch) && where(es, node, query.where)) {
      query.result.count++
      for (var k = 0; k < query.fetch.length; ++k) {
        tableName = query.fetch[k]
        indices   = query.result.indices[tableName]
        lengths   = query.result.lengths[tableName]
        indices[indices.len++] = node[tableName].index
        lengths[lengths.len++] = node[tableName].length
      }
    }
  }
  return query
}

/* Current idea is to optimize the store's behavior for pooling
 * by performing atomic updates based on the "isActive" property
 * which indicates whether an object is waiting in a pool or currently
 * in the game scene.  
 *
 * The idea here is to eat some cost when changing
 * and entitie's "aliveness" but then be able to improve the performance
 * of systems which can continue operating on a query that has been
 * atomically updated by the store to reflect the change in isActive.
 *
 * What this means in practice is that we wish to have the store support
 * functions called "makeActive" and "makeInactive" which accept a store
 * instance and an entity id.
 *
 * The object's flag will be updated for the "isActive" property AND
 * all stored queries will be manually updated to either add or remove 
 * this object from their list as necessary.  This is done by running each
 * queries "has" and "where" clauses over the entity to determine if it
 * is a member of that query's results.
 *
 * If the member is found to satisfy the query, it is removed from the results
 * on "makeInactive" and added to the results on "makeActive"
 *
 * This is a specific optimization that COULD be applied to any possible
 * change in values within the system.  However, for many values this would just
 * result in a ton of overhead on all operations while not affecting the
 * queries.  Thus, we start with this specific optimization as this is a very
 * common case reflecting our need/desire to use pooling and pre-allocation.
 *
 *
 * We would like to update the store object on every loop.  This update will
 * flush a list of objects that whose active status has changed and will perform
 * atomic update operations on all activeQueries.
 *
 * updateStore()
 * runSystems()...
 */

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
