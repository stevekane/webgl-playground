var bas = {}

var maxCount = 1000

function Box (name, x, y, z) {
  this.position = {
    x: x,
    y: y, 
    z: z 
  }
  this.isLiving = true
  this.name     = name
}

function MemBlock () {
  this.nodes  = []
  this.memory = [
    new Float32Array(maxCount * 3),
    new Uint8Array(maxCount),
    new Array(maxCount)
  ]
  this.keyIndexMap = {
    position: 0,
    isLiving: 1,
    name:     2
  }
}

function allocate (mem, obj) {
  var keys = Object.keys(obj) 
  var node = {}

  for (var i = 0; i < keys.length; ++i) {
      
  }
}

bas.Box        = Box
bas.MemBlock   = MemBlock
bas.allocate   = allocate
module.exports = bas
