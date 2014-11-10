var util     = require("util")
var inherits = util.inherits

/* What is a struct?
 *
 * A struct is a chunk of data that is laid out in memory in a near-linear
 * fashion and is intended to be accessed together.  The goal of this module
 * is to allow Javascript developers to lay out arbitrary data on top of 
 * Array Buffers.  Perhaps we will leverage some or all of the DataView
 * construct to read and update data in the buffer.  
 *
 * Structs will support "string", "int", "float", "struct", and "array"
 * methods (for convenience, may dissolve if better solution becomes
 * obvious).  When you call these methods, you are adding to the internal
 * structs data values.
 *
 */

var ASCII_BYTE_SIZE   = 1
var FLOAT32_BYTE_SIZE = 4
var INT32_BYTE_SIZE   = 4

function Field (name, type, byteLength, offset) {
  this.name       = name
  this.type       = type
  this.byteLength = byteLength
  this.offset     = offset
}

function StructField (name, type, byteLength, offset) {
  Field.call(this)
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
  this.fields[name] = childStruct.fields
}

/* Extends instance of browser-provided DataView object but also 
 * provides utility functions for performing string-based lookup
 * and for setting and getting string properties stored in the 
 * underlying ArrayBuffer
 */
function DataViewPlus (struct) {
  var dvPlus = DataView(new ArrayBuffer(struct.byteLength))      

  dvPlus.struct = struct

  dvPlus.lookup = function (path) {
    if (struct.fields[path]) return struct.fields[path].offset
    else                     throw new Error("invalid path " + path)
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
