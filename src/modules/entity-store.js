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
