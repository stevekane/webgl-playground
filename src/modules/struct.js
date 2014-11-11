var util     = require("util")
var inherits = util.inherits

var ASCII_BYTE_SIZE   = 1
var FLOAT32_BYTE_SIZE = 4
var INT32_BYTE_SIZE   = 4

function Field (name, type, byteLength, offset) {
  this.name       = name
  this.type       = type
  this.byteLength = byteLength
  this.offset     = offset
}

function StructField (name, type, childStruct, offset) {
  this.name       = name
  this.type       = type
  this.byteLength = childStruct.byteLength
  this.offset     = offset
  this.fields     = childStruct.fields
}

function Struct () {
  this.fields     = {}
  this.byteLength = 0
}

Struct.prototype.int32 = function (name) {
  var offset = this.byteLength
  
  this.byteLength   += 4
  this.fields[name] = new Field(name, "Int32", INT32_BYTE_SIZE, offset)
}

Struct.prototype.float32 = function (name) {
  var offset = this.byteLength
  
  this.byteLength   += 4
  this.fields[name] = new Field(name, "Float32", FLOAT32_BYTE_SIZE, offset)
}

Struct.prototype.string = function (name, maxCharSize) {
  var byteLength = maxCharSize * ASCII_BYTE_SIZE
  var offset     = this.byteLength

  this.byteLength   += byteLength
  this.fields[name] = new Field(name, "String", byteLength, offset)
}

Struct.prototype.struct = function (name, childStruct) {
  var offset = this.byteLength

  this.byteLength   += childStruct.byteLength 
  this.fields[name] = new StructField(name, "Struct", childStruct, offset)
}

//TODO: this smells fishy here....  probably should not be at module level
//allocate once and re-use
var tokens = ["", "", "", "", "", "", "", "", "", "", ""]

function parsePath (path) {
  var pathLength = path.length
  var tokenCount = tokens.length
  var tokenIndex = 0
  var i          = -1
  var j          = -1
  var character

  while (++i < tokenCount) {
    tokens[i] = ""
  }

  while (++j < pathLength) {
    character = path[j]
    if (character !== ".") tokens[tokenIndex] += character
    else                   tokenIndex += 1
  }
  return tokens
}

function DataViewPlus (struct) {
  var dvPlus = DataView(new ArrayBuffer(struct.byteLength))      

  dvPlus.struct = struct

  dvPlus.lookup = function (path) {
    var parts       = parsePath(path)
    var fields      = struct.fields
    var totalOffset = 0
    var partCount   = 0
    var i           = -1
    var j           = -1
    var field

    console.log(parts)

    while (parts[++i]) {
      partCount += 1 
    }

    while (++j < partCount) {
      field        = fields[parts[j]] 
      totalOffset += field.offset
      if (field.type === "Struct") fields = field.fields
    } 
    return totalOffset
  }

  dvPlus.setAscii = function (byteOffset, str) {
    var len = str.length
    var i   = -1

    this.setInt8(byteOffset, str.length)
    while (++i < len) {
      this.setInt8(byteOffset + 1 + i, str.charCodeAt(i))
    }
  }

  dvPlus.getAscii = function (byteOffset) {
    var str = ""
    var len = this.getInt8(byteOffset)
    var i   = -1 

    while (++i < len) {
      str += String.fromCharCode(this.getInt8(byteOffset + 1 + i))
    }
    return str
  }
  return dvPlus
}

Struct.prototype.allocate = function () {
  return DataViewPlus(this)
}

module.exports  = Struct
