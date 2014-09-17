(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var async         = require("async")
var types         = require("../modules/types")
var loaders       = require("../modules/loaders")
var utils         = require("../modules/gl-utils")
var LoadedProgram = types.LoadedProgram
var loadShader    = loaders.loadShader
var initBuffer    = utils.initBuffer
var canvas        = document.getElementById("playground")
var gl            = canvas.getContext("webgl")
var shaders       = {
  vertex:   "/shaders/01v.glsl",
  fragment: "/shaders/01f.glsl"
}

//clear the webgl context
function clearContext (gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
}

function makeAnimate (gl, count) {
  return function animate () {
    clearContext(gl)
    gl.drawArrays(gl.POINTS, 0, count)
    requestAnimationFrame(animate) 
  }
}

async.parallel({
  vertex:   function (cb) { loadShader("/shaders/01v.glsl", cb) },
  fragment: function (cb) { loadShader("/shaders/01f.glsl", cb) }
}, function (err, shaders) {
  var lp        = LoadedProgram(gl, shaders.vertex, shaders.fragment)
  var positions = new Float32Array([
    -1.0, -1.0,
    -1.0,  1.0, 
     1.0, -1.0,
     1.0,  1.0,
     0.0,  0.0
  ])
  var count     = positions.length / 2
  
  gl.useProgram(lp.program)
  gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
  initBuffer(gl, positions, 2, lp.attributes.aPosition)
  requestAnimationFrame(makeAnimate(gl, count))
})

},{"../modules/gl-utils":2,"../modules/loaders":3,"../modules/types":4,"async":"async"}],2:[function(require,module,exports){
var utils = {}

utils.initBuffer = function (gl, data, chunkSize, attribute) {
  var buffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  gl.vertexAttribPointer(attribute, chunkSize, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(attribute)
  return buffer
}

module.exports = utils

},{}],3:[function(require,module,exports){
var loaders  = {}

loaders.loadShader = function (path, cb) {
  var xhr = new XMLHttpRequest

  xhr.responseType = "string"
  xhr.onload       = function () { cb(null, xhr.response) }
  xhr.onerror      = function () { cb(new Error("Could not load " + path)) }
  xhr.open("GET", path, true)
  xhr.send(null)
}

module.exports = loaders

},{}],4:[function(require,module,exports){
var types = {}

//given src and type, compile and return shader
function compile (gl, shaderType, src) {
  var shader = gl.createShader(shaderType)

  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  return shader
}

//link your program w/ opengl
function link (gl, vs, fs) {
  var program = gl.createProgram()

  gl.attachShader(program, vs) 
  gl.attachShader(program, fs) 
  gl.linkProgram(program)
  return program
}

/*
 * We want to create a wrapper for a loaded gl program
 * that includes pointers to all the uniforms and attributes
 * defined for this program.  This makes it more convenient
 * to change these values
 */
types.LoadedProgram = function (gl, vSrc, fSrc) {
  var vs            = compile(gl, gl.VERTEX_SHADER, vSrc)
  var fs            = compile(gl, gl.FRAGMENT_SHADER, fSrc)
  var program       = link(gl, vs, fs)
  var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
  var numUniforms   = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
  var lp = {
    vertex:     {
      src:    vSrc,
      shader: vs 
    },
    fragment:   {
      src:    fSrc,
      shader: fs 
    },
    program:    program,
    uniforms:   {}, 
    attributes: {}
  }
  var aName
  var uName

  for (var i = 0; i < numAttributes; ++i) {
    aName                = gl.getActiveAttrib(program, i).name
    lp.attributes[aName] = gl.getAttribLocation(program, aName)
  }

  for (var j = 0; j < numUniforms; ++j) {
    uName              = gl.getActiveUniform(program, j).name
    lp.uniforms[uName] = gl.getUniformLocation(program, uName)
  }

  return lp 
}

module.exports = types

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL2V4YW1wbGVzLzAxLUJhc2ljLVNldHVwLmpzIiwiL1VzZXJzL3N0ZXZlbmthbmUvd2ViZ2wtcGxheWdyb3VuZC5qcy9zcmMvbW9kdWxlcy9nbC11dGlscy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvbG9hZGVycy5qcyIsIi9Vc2Vycy9zdGV2ZW5rYW5lL3dlYmdsLXBsYXlncm91bmQuanMvc3JjL21vZHVsZXMvdHlwZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgYXN5bmMgICAgICAgICA9IHJlcXVpcmUoXCJhc3luY1wiKVxudmFyIHR5cGVzICAgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy90eXBlc1wiKVxudmFyIGxvYWRlcnMgICAgICAgPSByZXF1aXJlKFwiLi4vbW9kdWxlcy9sb2FkZXJzXCIpXG52YXIgdXRpbHMgICAgICAgICA9IHJlcXVpcmUoXCIuLi9tb2R1bGVzL2dsLXV0aWxzXCIpXG52YXIgTG9hZGVkUHJvZ3JhbSA9IHR5cGVzLkxvYWRlZFByb2dyYW1cbnZhciBsb2FkU2hhZGVyICAgID0gbG9hZGVycy5sb2FkU2hhZGVyXG52YXIgaW5pdEJ1ZmZlciAgICA9IHV0aWxzLmluaXRCdWZmZXJcbnZhciBjYW52YXMgICAgICAgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwbGF5Z3JvdW5kXCIpXG52YXIgZ2wgICAgICAgICAgICA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ2xcIilcbnZhciBzaGFkZXJzICAgICAgID0ge1xuICB2ZXJ0ZXg6ICAgXCIvc2hhZGVycy8wMXYuZ2xzbFwiLFxuICBmcmFnbWVudDogXCIvc2hhZGVycy8wMWYuZ2xzbFwiXG59XG5cbi8vY2xlYXIgdGhlIHdlYmdsIGNvbnRleHRcbmZ1bmN0aW9uIGNsZWFyQ29udGV4dCAoZ2wpIHtcbiAgZ2wuY2xlYXJDb2xvcigwLjAsIDAuMCwgMC4wLCAxLjApXG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpXG59XG5cbmZ1bmN0aW9uIG1ha2VBbmltYXRlIChnbCwgY291bnQpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuaW1hdGUgKCkge1xuICAgIGNsZWFyQ29udGV4dChnbClcbiAgICBnbC5kcmF3QXJyYXlzKGdsLlBPSU5UUywgMCwgY291bnQpXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpIFxuICB9XG59XG5cbmFzeW5jLnBhcmFsbGVsKHtcbiAgdmVydGV4OiAgIGZ1bmN0aW9uIChjYikgeyBsb2FkU2hhZGVyKFwiL3NoYWRlcnMvMDF2Lmdsc2xcIiwgY2IpIH0sXG4gIGZyYWdtZW50OiBmdW5jdGlvbiAoY2IpIHsgbG9hZFNoYWRlcihcIi9zaGFkZXJzLzAxZi5nbHNsXCIsIGNiKSB9XG59LCBmdW5jdGlvbiAoZXJyLCBzaGFkZXJzKSB7XG4gIHZhciBscCAgICAgICAgPSBMb2FkZWRQcm9ncmFtKGdsLCBzaGFkZXJzLnZlcnRleCwgc2hhZGVycy5mcmFnbWVudClcbiAgdmFyIHBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgIC0xLjAsIC0xLjAsXG4gICAgLTEuMCwgIDEuMCwgXG4gICAgIDEuMCwgLTEuMCxcbiAgICAgMS4wLCAgMS4wLFxuICAgICAwLjAsICAwLjBcbiAgXSlcbiAgdmFyIGNvdW50ICAgICA9IHBvc2l0aW9ucy5sZW5ndGggLyAyXG4gIFxuICBnbC51c2VQcm9ncmFtKGxwLnByb2dyYW0pXG4gIGdsLnVuaWZvcm00ZihscC51bmlmb3Jtcy51Q29sb3IsIDEuMCwgMC4wLCAwLjAsIDEuMClcbiAgaW5pdEJ1ZmZlcihnbCwgcG9zaXRpb25zLCAyLCBscC5hdHRyaWJ1dGVzLmFQb3NpdGlvbilcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1ha2VBbmltYXRlKGdsLCBjb3VudCkpXG59KVxuIiwidmFyIHV0aWxzID0ge31cblxudXRpbHMuaW5pdEJ1ZmZlciA9IGZ1bmN0aW9uIChnbCwgZGF0YSwgY2h1bmtTaXplLCBhdHRyaWJ1dGUpIHtcbiAgdmFyIGJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpXG5cbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIGJ1ZmZlcilcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIGRhdGEsIGdsLkRZTkFNSUNfRFJBVylcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihhdHRyaWJ1dGUsIGNodW5rU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKVxuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShhdHRyaWJ1dGUpXG4gIHJldHVybiBidWZmZXJcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB1dGlsc1xuIiwidmFyIGxvYWRlcnMgID0ge31cblxubG9hZGVycy5sb2FkU2hhZGVyID0gZnVuY3Rpb24gKHBhdGgsIGNiKSB7XG4gIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3RcblxuICB4aHIucmVzcG9uc2VUeXBlID0gXCJzdHJpbmdcIlxuICB4aHIub25sb2FkICAgICAgID0gZnVuY3Rpb24gKCkgeyBjYihudWxsLCB4aHIucmVzcG9uc2UpIH1cbiAgeGhyLm9uZXJyb3IgICAgICA9IGZ1bmN0aW9uICgpIHsgY2IobmV3IEVycm9yKFwiQ291bGQgbm90IGxvYWQgXCIgKyBwYXRoKSkgfVxuICB4aHIub3BlbihcIkdFVFwiLCBwYXRoLCB0cnVlKVxuICB4aHIuc2VuZChudWxsKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxvYWRlcnNcbiIsInZhciB0eXBlcyA9IHt9XG5cbi8vZ2l2ZW4gc3JjIGFuZCB0eXBlLCBjb21waWxlIGFuZCByZXR1cm4gc2hhZGVyXG5mdW5jdGlvbiBjb21waWxlIChnbCwgc2hhZGVyVHlwZSwgc3JjKSB7XG4gIHZhciBzaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoc2hhZGVyVHlwZSlcblxuICBnbC5zaGFkZXJTb3VyY2Uoc2hhZGVyLCBzcmMpXG4gIGdsLmNvbXBpbGVTaGFkZXIoc2hhZGVyKVxuICByZXR1cm4gc2hhZGVyXG59XG5cbi8vbGluayB5b3VyIHByb2dyYW0gdy8gb3BlbmdsXG5mdW5jdGlvbiBsaW5rIChnbCwgdnMsIGZzKSB7XG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpXG5cbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZzKSBcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIGZzKSBcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSlcbiAgcmV0dXJuIHByb2dyYW1cbn1cblxuLypcbiAqIFdlIHdhbnQgdG8gY3JlYXRlIGEgd3JhcHBlciBmb3IgYSBsb2FkZWQgZ2wgcHJvZ3JhbVxuICogdGhhdCBpbmNsdWRlcyBwb2ludGVycyB0byBhbGwgdGhlIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzXG4gKiBkZWZpbmVkIGZvciB0aGlzIHByb2dyYW0uICBUaGlzIG1ha2VzIGl0IG1vcmUgY29udmVuaWVudFxuICogdG8gY2hhbmdlIHRoZXNlIHZhbHVlc1xuICovXG50eXBlcy5Mb2FkZWRQcm9ncmFtID0gZnVuY3Rpb24gKGdsLCB2U3JjLCBmU3JjKSB7XG4gIHZhciB2cyAgICAgICAgICAgID0gY29tcGlsZShnbCwgZ2wuVkVSVEVYX1NIQURFUiwgdlNyYylcbiAgdmFyIGZzICAgICAgICAgICAgPSBjb21waWxlKGdsLCBnbC5GUkFHTUVOVF9TSEFERVIsIGZTcmMpXG4gIHZhciBwcm9ncmFtICAgICAgID0gbGluayhnbCwgdnMsIGZzKVxuICB2YXIgbnVtQXR0cmlidXRlcyA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuQUNUSVZFX0FUVFJJQlVURVMpXG4gIHZhciBudW1Vbmlmb3JtcyAgID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5BQ1RJVkVfVU5JRk9STVMpXG4gIHZhciBscCA9IHtcbiAgICB2ZXJ0ZXg6ICAgICB7XG4gICAgICBzcmM6ICAgIHZTcmMsXG4gICAgICBzaGFkZXI6IHZzIFxuICAgIH0sXG4gICAgZnJhZ21lbnQ6ICAge1xuICAgICAgc3JjOiAgICBmU3JjLFxuICAgICAgc2hhZGVyOiBmcyBcbiAgICB9LFxuICAgIHByb2dyYW06ICAgIHByb2dyYW0sXG4gICAgdW5pZm9ybXM6ICAge30sIFxuICAgIGF0dHJpYnV0ZXM6IHt9XG4gIH1cbiAgdmFyIGFOYW1lXG4gIHZhciB1TmFtZVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtQXR0cmlidXRlczsgKytpKSB7XG4gICAgYU5hbWUgICAgICAgICAgICAgICAgPSBnbC5nZXRBY3RpdmVBdHRyaWIocHJvZ3JhbSwgaSkubmFtZVxuICAgIGxwLmF0dHJpYnV0ZXNbYU5hbWVdID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgYU5hbWUpXG4gIH1cblxuICBmb3IgKHZhciBqID0gMDsgaiA8IG51bVVuaWZvcm1zOyArK2opIHtcbiAgICB1TmFtZSAgICAgICAgICAgICAgPSBnbC5nZXRBY3RpdmVVbmlmb3JtKHByb2dyYW0sIGopLm5hbWVcbiAgICBscC51bmlmb3Jtc1t1TmFtZV0gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgdU5hbWUpXG4gIH1cblxuICByZXR1cm4gbHAgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gdHlwZXNcbiJdfQ==
