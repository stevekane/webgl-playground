var test   = require("tape")
var Struct = require("../struct")

function compareFloat (target, val) {
  return Number(target.toFixed(2)) === val
}

test("Struct constructor", function (t) {
  var Stat   = new Struct
  var Person = new Struct
  var person

  Stat.float32("rbi", 0)
  Stat.float32("eta", 0)

  Person.int32("age")
  Person.float32("weight")
  Person.string("name", 20)
  Person.struct("stats", Stat)

  person = Person.allocate()

  t.plan(5)
  t.true(person.struct.fields.age)
  t.true(person.struct.fields.weight)
  t.true(person.struct.fields.name)
  t.true(person.struct.fields.stats)
  t.same(person.struct.byteLength, 36)
})

test("An allocated struct has an index lookup function", function (t) {
  var person
  var age
  var weight
  var name
  var zipcode
  var id1
  var id2
  var randFloat1
  var randFloat2

  var Address = new Struct()
    .int32("number")
    .string("street", 32)
    .string("city", 32)
    .string("state", 32)
    .int32("zipcode")
    .float32Array("randomFloats", 8)

  var Person = new Struct()
    .int32("age")
    .float32("weight")
    .string("name", 20)
    .struct("address", Address)
    .int32Array("friend_ids", 10)

  person = Person.allocate()

  //The api I would like:
  //setUint32("age", 45, person)
  //setFloat32("weight", 32.45, person)
  //setAscii("name", "burrito johnson", person)
  //setUint32("address.zipcode", 61821, person)
  //setUint32("friend_ids[0]", 1, person)
  //setUint32("friend_ids[3]", 100, person)
  //setFloat32("address.randomFloats[0]", 100.76, person)
  //setFloat32("address.randomFloats[4]", 200.11, person)
  //age        = getUint32("age", person)
  //weight     = getFloat32("weight", person)
  //name       = getAscii("name", person)
  //zipcode    = getUint32("address.zipcode", person)
  //id1        = getUint32("friend_ids[0]", person)
  //id2        = getUint32("friend_ids[3]", person)
  //randFloat1 = getFloat32("address.randomFloats[0]", person)
  //randFloat2 = getFloat32("address.randomFloats[4]", person)

  //The api I have...
  person.setUint32(person.lookup("age"), 45)
  person.setFloat32(person.lookup("weight"), 32.45)
  person.setAscii(person.lookup("name"), "burrito johnson")
  person.setUint32(person.lookup("address.zipcode"), 61821)
  person.setUint32(person.lookup("friend_ids.0"), 1)
  person.setUint32(person.lookup("friend_ids.3"), 100)
  person.setFloat32(person.lookup("address.randomFloats.0"), 100.76)
  person.setFloat32(person.lookup("address.randomFloats.4"), 200.11)

  age        = person.getUint32(person.lookup("age"))
  weight     = person.getFloat32(person.lookup("weight"))
  name       = person.getAscii(person.lookup("name"))
  zipcode    = person.getUint32(person.lookup("address.zipcode"))
  id1        = person.getUint32(person.lookup("friend_ids.0"))
  id2        = person.getUint32(person.lookup("friend_ids.3"))
  randFloat1 = person.getFloat32(person.lookup("address.randomFloats.0"))
  randFloat2 = person.getFloat32(person.lookup("address.randomFloats.4"))

  t.plan(10)
  t.same(age, 45)
  t.true(compareFloat(weight, 32.45))
  t.same(name, "burrito johnson")
  t.same(zipcode, 61821)
  t.same(id1, 1)
  t.same(id2, 100)
  t.true(compareFloat(randFloat1, 100.76))
  t.true(compareFloat(randFloat2, 200.11))
  t.throws(function () {
    person.lookup("pook")
  })
  t.throws(function () {
    person.lookup("not.there") 
  })
})

test("non trivial looping operation simulation", function (t) {
  var Vec3 = new Struct()
    .float32("x")
    .float32("y")
    .float32("z")
  var Physics = new Struct()
    .struct("position", Vec3)
    .struct("velocity", Vec3)
    .struct("acceleration", Vec3)
  var PhysicsBodies = new Struct()
    .structArray("bodies", Physics, 3)
  var physicsBodies = PhysicsBodies.allocate()

  var ptrPrime = physicsBodies.lookup("bodies.0.position.x")
  var PhysLen  = Physics.byteLength

  //Pointer-y way to get refs to all x positions and update them
  for (var i = 0; i < 3; ++i) {
    physicsBodies.setFloat32(ptrPrime + PhysLen * i, 38.5) 
  }

  t.plan(1)
  t.true(true)

  console.log(physicsBodies.getFloat32(physicsBodies.lookup("bodies.0.position.x")))
  console.log(physicsBodies.getFloat32(physicsBodies.lookup("bodies.1.position.x")))
  console.log(physicsBodies.getFloat32(physicsBodies.lookup("bodies.2.position.x")))
})
