var es = {}

function cons (list, el) {
  list.push(el)
  return list
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

function addComponent (es, eid, key, val) {
  var append    = es.appendFunctions[key]   || cons 
  var transform = es.toTableTransforms[key] || passThrough
  var nodeIndex = es.nodes[eid]
  var initialLength
  var finalLength

  es.tables[key] = es.tables[key] || []
  initialLength  = es.tables[key].length
  es.tables[key] = append(es.tables[key], transform(val))
  finalLength    = es.tables[key].length
  nodeIndex[key] = {
    index:  initialLength,
    length: finalLength - initialLength
  }  
}

function addEntity (es, e) {
  var tableKeys = Object.keys(e)
  var eid       = es.nodes.length
  var i         = tableKeys.length
   
  es.nodes.push({})
  while (i--) addComponent(es, eid, tableKeys[i], e[tableKeys[i]])
  return eid
}

function addEntities (es, entities) {
  var i = entities.length

  while (i--) addEntity(es, entities[i])
}

function query (es, queryFn, tableName) {
  var nodeCount = es.nodes.length
  var result    = {
    indices: [],
    lengths: [] 
  }
  var node

  for (var i = 0; i < nodeCount; ++i) {
    node = es.nodes[i]
    if (queryFn(node)) {
      result.indices.push(node[tableName].index)
      result.lengths.push(node[tableName].length)
    }
  } 
  return result
}

/* A Query is allocated up front and then mutated to contain its latest
 * result by calling runQuery and supplying a target Entity Store.  The
 * result is stored on the query object so that all data is pre-allocated
 * wherever possible avoiding unneeded garbage collection.  
 *
 * It is also possible that we will build Query Pools for queries that
 * need to be run dynamically as part of "tight loops".  This may be needed
 * for querying a set of objects and then running queries on their children
 * or parents
 */
function Query (options) {
  if (!options.fetch || !options.where) throw new Error("Bad Query!")

  this.fetch  = options.fetch
  this.where  = options.where
  this.count  = options.count || null
  this.among  = options.range || null
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

function runBoundedQuery (es, query) {
  var tableName
  var node

  query.result.count = 0

  for (var i = 0; i < query.among.length; ++i) {
    node = es.nodes[query.among[i]]
    if (query.count && query.result.count >= query.count) break
    if (query.where(node)) {
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
    if (query.where(node)) {
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
  if (query.among) return runBoundedQuery(es, query)
  else             return runUnboundedQuery(es, query)
}

function queryMany (es, queryFn, tableNames) {
  var tableCount = tableNames.length
  var nodeCount  = es.nodes.length
  var result     = {
    indices: {},
    lengths: {} 
  }
  var tableName
  var node

  for (var i = 0; i < tableCount; ++i) {
    result.indices[tableNames[i]] = [] 
    result.lengths[tableNames[i]] = [] 
  }

  for (var j = 0; j < nodeCount; ++j) {
    node = es.nodes[j]
    if (queryFn(node)) {
      for (var k = 0; k < tableCount; ++k) {
        tableName = tableNames[k]
        result.indices[tableName].push(node[tableName].index)
        result.lengths[tableName].push(node[tableName].length)
      }
    }
  }
  return result
}

es.EntityStore  = EntityStore
es.addEntity    = addEntity
es.addEntities  = addEntities
es.addComponent = addComponent
es.query        = query
es.queryMany    = queryMany
es.runQuery     = runQuery
es.Query        = Query
module.exports  = es
