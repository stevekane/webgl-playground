var B = require('benchmark')

var count = 100000
var ar    = []
var obj   = {}

for (var i = 0; i < count; ++i) {
  ar.push({val: 0})
  obj[i] = {val: 0}
}

var s = new B.Suite

function iterObjKeys () {
  var keys = Object.keys(obj)

  for (var i = 0; i < keys.length; ++i) {
    obj[keys[i]].val++ 
  }
}

function iterObjForIn () {
  for (key in obj) {
    obj[key].val++ 
  }
}

function iterArray () {
  for (var j = 0; j < ar.length; ++j) {
    ar[j].val++ 
  }
}

s.add("iter obj keys", iterObjKeys)
s.add("iter obj for-in", iterObjForIn)
s.add("iter array", iterArray)

s.on("cycle", function (e) {
  console.log(String(e.target))
})

s.run()
