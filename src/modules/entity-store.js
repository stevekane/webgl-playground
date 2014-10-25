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

/* Assign component to entity inside the entity store.
 * Check if table for this component exists, if not create it
 * Check if a transform fn is defined for this key
 * Check if an append function is defined for this key
 * If needed, transform the data using the located transform fn
 * and then append the structure onto the table.  
 * Record the starting index in the appropriate node index
 * Record the change in table size as the length in the node index
 */
function addComponent (es, eid, key, val) {
  var append    = es.appendFunctions[key]   || cons 
  var transform = es.toTableTransforms[key] || passThrough
  var nodeIndex = es.nodes[eid]
  var initialLength
  var finalLength

  if (!es.tables[key]) es.tables[key] = []
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
   
  es.nodes.push({})
  for (var i = 0; i < tableKeys.length; ++i) {
    addComponent(es, eid, tableKeys[i], e[tableKeys[i]])
  }
  return eid
}

es.EntityStore    = EntityStore
es.addEntity      = addEntity
es.addComponent   = addComponent
module.exports    = es
