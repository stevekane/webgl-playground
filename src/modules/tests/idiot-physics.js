var test              = require("tape")
var mod               = require("../../src/modules/idiot-physics")
var checkAll          = mod.checkAll
var resolveCollisions = mod.resolveCollisions
var System            = mod.System

test("System should accept broadphase and nearphase in constructor", function (t) {
  var nearphase  = function (pairs, ents) {}
  var broadphase = function (pairs, ents) {}
  var s          = new System(nearphase, broadphase)

  t.plan(2)
  t.same(nearphase, s.nearphase)
  t.same(broadphase, s.broadphase)
})

test("System uses default algorithms if none provided", function (t) {
  var s = new System()

  t.plan(2)
  t.same(checkAll, s.nearphase)
  t.same(resolveCollisions, s.broadphase)
})
