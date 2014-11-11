var ASCII_BYTE_SIZE   = 1
var FLOAT32_BYTE_SIZE = 4
var INT32_BYTE_SIZE   = 4

function Field (name, type, byteLength, offset) {
  this.name       = name
  this.type       = type
  this.byteLength = byteLength
  this.offset     = offset
}

function StructField (name, childStruct, offset) {
  this.name       = name
  this.type       = "Struct"
  this.byteLength = childStruct.byteLength
  this.offset     = offset
  this.fields     = childStruct.fields
}

function ArrayField (name, elementField, count, offset) {
  this.name         = name
  this.type         = "Array"
  this.byteLength   = count * elementField.byteLength
  this.offset       = offset
  this.elementField = elementField
}

function Struct () {
  this.fields     = {}
  this.byteLength = 0
}

Struct.prototype.int32 = function (name) {
  var offset = this.byteLength
  
  this.byteLength   += INT32_BYTE_SIZE
  this.fields[name] = new Field(name, "Int32", INT32_BYTE_SIZE, offset)
  return this
}

Struct.prototype.float32 = function (name) {
  var offset = this.byteLength
  
  this.byteLength   += FLOAT32_BYTE_SIZE
  this.fields[name] = new Field(name, "Float32", FLOAT32_BYTE_SIZE, offset)
  return this
}

Struct.prototype.string = function (name, maxCharSize) {
  var byteLength = maxCharSize * ASCII_BYTE_SIZE
  var offset     = this.byteLength

  this.byteLength   += byteLength
  this.fields[name] = new Field(name, "String", byteLength, offset)
  return this
}

Struct.prototype.struct = function (name, childStruct) {
  var offset = this.byteLength

  this.byteLength   += childStruct.byteLength 
  this.fields[name] = new StructField(name, childStruct, offset)
  return this
}

Struct.prototype.int32Array = function (name, count) {
  var offset       = this.byteLength
  var elementField = new Field(name, "Int32", INT32_BYTE_SIZE, offset)

  this.byteLength   += count * INT32_BYTE_SIZE
  this.fields[name] = new ArrayField(name, elementField, count, offset)
  return this
}

Struct.prototype.float32Array = function (name, count) {
  var offset       = this.byteLength
  var elementField = new Field(name, "Float32", FLOAT32_BYTE_SIZE, offset)

  this.byteLength   += count * FLOAT32_BYTE_SIZE 
  this.fields[name] = new ArrayField(name, elementField, count, offset)
  return this
}

Struct.prototype.stringArray = function (name, maxCharSize, count) {
  var offset            = this.byteLength
  var elementByteLength = maxCharSize * ASCII_BYTE_SIZE
  var elementField      = new Field(name, "String", elementByteLength, offset)

  this.byteLength   += count * elementByteLength
  this.fields[name] = new ArrayField(name, elementField, count, offset)
  return this
}

//allocate once and re-use in parsePath calls
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
    var key
    var field

    while (parts[++i]) {
      partCount += 1 
    }

    while (++j < partCount) {
      key   = parts[j]
      field = fields[key] 

      if (field.type === "Array")  {
        key         = parts[++j]
        totalOffset += field.offset + field.elementField.byteLength * key

        if (field.elementField.type === "Struct") {
          fields = field.elementField.fields
        }
      } else if (field.type === "Struct") {
        fields = field.fields
      } else {
        totalOffset += field.offset
      }
    } 
    return totalOffset
  }

  dvPlus.setAscii = function (byteOffset, str) {
    var len = str.length
    var i   = -1

    dvPlus.setInt8(byteOffset, str.length)
    while (++i < len) {
      dvPlus.setInt8(byteOffset + 1 + i, str.charCodeAt(i))
    }
  }

  dvPlus.getAscii = function (byteOffset) {
    var str = ""
    var len = dvPlus.getInt8(byteOffset)
    var i   = -1 

    while (++i < len) {
      str += String.fromCharCode(dvPlus.getInt8(byteOffset + 1 + i))
    }
    return str
  }
  return dvPlus
}

Struct.prototype.allocate = function () {
  return DataViewPlus(this)
}

module.exports  = Struct
