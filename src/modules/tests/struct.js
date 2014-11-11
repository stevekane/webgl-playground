var test   = require("tape")
var Struct = require("../struct")

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
  var Person  = new Struct
  var Address = new Struct
  var person
  var age
  var weight
  var name
  var zipcode

  Address.int32("number", 8)
  Address.string("street", 32)
  Address.string("city", 32)
  Address.string("state", 32)
  Address.int32("zipcode", 8)

  Person.int32("age")
  Person.float32("weight")
  Person.string("name", 20)
  Person.struct("address", Address)

  person = Person.allocate()

  t.plan(6)
  person.setUint32(person.lookup("age"), 45)
  person.setFloat32(person.lookup("weight"), 32.45)
  person.setAscii(person.lookup("name"), "burrito johnson")
  person.setUint32(person.lookup("address.zipcode"), 61821)

  age     = person.getUint32(person.lookup("age"))
  weight  = person.getFloat32(person.lookup("weight"))
  name    = person.getAscii(person.lookup("name"))
  zipcode = person.getUint32(person.lookup("address.zipcode"))

  t.same(age, 45)
  t.same(Number(weight.toFixed(2)), 32.45)
  t.same(name, "burrito johnson")
  t.same(zipcode, 61821)
  t.throws(function () {
    person.lookup("pook")
  })
  t.throws(function () {
    person.lookup("not.there") 
  })
})
