var canvas = document.getElementById("playground")
var gl     = canvas.getContext("webgl")
var bgColor= new Float32Array([0,0,0,0])

//fetch file by name and call "nodeback"
function loadShader (path, cb) {
  var xhr = new XMLHttpRequest

  xhr.responseType = "string"
  xhr.onload       = function () { cb(null, xhr.response) }
  xhr.onerror      = function () { cb(new Error("Could not load " + path)) }
  xhr.open("GET", path, true)
  xhr.send(null)
}

//clear the webgl context
function clearContext (gl) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
}

//given src and type, compile and return shader
function compile (gl, shaderType, src) {
  var shader = gl.createShader(shaderType)

  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  return shader
}

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
function LoadedProgram (gl, vSrc, fSrc) {
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

function initBuffer (gl, data, chunkSize, attribute) {
  var buffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
  gl.vertexAttribPointer(attribute, chunkSize, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(attribute)
  return buffer
}

function makeAnimate (gl, count) {
  return function animate () {
    clearContext(gl)
    gl.drawArrays(gl.POINTS, 0, count)
    requestAnimationFrame(animate) 
  }
}

loadShader("/shaders/01v.glsl", function (errV, vSrc) {
  loadShader("/shaders/01f.glsl", function (errF, fSrc) {
    var lp         = LoadedProgram(gl, vSrc, fSrc)
    var positions  = new Float32Array([
      -1.0, -1.0,
      -1.0,  1.0, 
       1.0, -1.0,
       1.0,  1.0,
       0.0,  0.0
    ])
    var count      = positions.length / 2
    
    gl.useProgram(lp.program)
    initBuffer(gl, positions, 2, lp.attributes.aPosition)
    gl.uniform4f(lp.uniforms.uColor, 1.0, 0.0, 0.0, 1.0)
    requestAnimationFrame(makeAnimate(gl, count))
  })
})
