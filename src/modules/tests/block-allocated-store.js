var test     = require("tape")
var mod      = require("../block-allocated-store")
var Box      = mod.Box
var MemBlock = mod.MemBlock
var allocate = mod.allocate

var mb = new MemBlock
var b1 = new Box("ted", 1,2,3)
var b2 = new Box("steve", 2,3,4)
var b3 = new Box("brian", 5,5,5)

allocate(mb, b1)
