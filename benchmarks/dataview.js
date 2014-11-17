var B = require("benchmark")
var s = new B.Suite

/*
 * Compare performance of updating a value based on current value
 * for DataView and Array.  Perform the comparison for both Integers
 * and Floats
 */

var INT32_BYTE_SIZE   = 4
var FLOAT32_BYTE_SIZE = 4

//setup
var count = 10000000
var dvf   = new DataView(new ArrayBuffer(count * FLOAT32_BYTE_SIZE))
var dvi   = new DataView(new ArrayBuffer(count * INT32_BYTE_SIZE))
var taf   = new Float32Array(count)
var tai   = new Int32Array(count)
var arf   = new Array(count)
var ari   = new Array(count)
var i     = -1

while (++i < count) {
  dvf.setFloat32(i * FLOAT32_BYTE_SIZE, 20.343)
  dvi.setInt32(i * INT32_BYTE_SIZE, 20)
  taf[i] = 20.343
  tai[i] = 20
  arf[i] = 20.343
  ari[i] = 20
}

function arFloat () {
  var i = -1 

  while (++i < count) {
    arf[i] += 1.0
  }
}

function taFloat () {
  var i = -1 

  while (++i < count) {
    taf[i] += 1.0
  }
}

function dvFloat () {
  var i = -1 
  var f = 0
  var l = 0

  while (++i < count) {
    l = i * FLOAT32_BYTE_SIZE
    f = dvf.getFloat32(l)
    dvf.setFloat32(l, f += 1.0)
  }
}

function arInt () {
  var i = -1 

  while (++i < count) {
    ari[i] += 1
  }
}

function taInt () {
  var i = -1 

  while (++i < count) {
    tai[i] += 1 
  }
}

function dvInt () {
  var i = -1 
  var f = 0
  var l = 0

  while (++i < count) {
    l = i * INT32_BYTE_SIZE
    f = dvi.getInt32(l)
    dvi.setInt32(l, f += 1)
  }
}

s.add("arFloat", arFloat)
s.add("taFloat", taFloat)
s.add("dvFloat", dvFloat)
s.add("arInt", arInt)
s.add("taInt", taInt)
s.add("dvInt", dvInt)

s.on("cycle", function (event) {
  console.log(String(event.target))
})

arFloat()
taFloat()
dvFloat()
arInt()
taInt()
dvInt()

var lastIndex = count - 1
console.log(dvf.getFloat32(lastIndex * FLOAT32_BYTE_SIZE))
console.log(taf[lastIndex])
console.log(arf[lastIndex])
console.log(dvi.getInt32(lastIndex * INT32_BYTE_SIZE))
console.log(tai[lastIndex])
console.log(ari[lastIndex])

s.run()
