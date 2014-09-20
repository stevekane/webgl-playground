var rendering = {}


//I want to crawl the tree structure returning the total number
//of renderable objects
//
//Then, crawl the tree structure to buildup the TypedArray

function flatPush (host, ar) {
  for (var i = 0; i < ar.length; ++i) {
    host.push(ar[i]) 
  }
  return host
}

function extractRenderingData (host, node) {
  if (!!node.living ) {
    flatPush(host, node.position)
    //flatPush(host, node.color)
    //flatPush(host, node.size)
  }

  if (node.children) {
    for (var i = 0; i < node.children.length; ++i) {
      extractRenderingData(host, node.children[i]) 
    }
  }
  return host
}

/*
 * Recusively traverse the scenegraph (a 1-n tree) and
 * return a flat list of position vectors.  
* */
rendering.flattenSceneGraph = function (rootNode) {
  return new Float32Array(extractRenderingData([], rootNode))
}

//TODO: This isnt really explicitly a rendering concern..  perhaps move?
rendering.walkAndDo = function walkAndDo (fn, node) {
  fn(node)

  if (node.children) {
    for (var i = 0; i < node.children.length; ++i) {
      walkAndDo(fn, node.children[i])
    }
  }
  return node
}

module.exports = rendering
