var root       = document.getElementById("playground")
var canvas     = document.createElement("canvas")
var gl         = canvas.getContext("webgl")
var bgColor    = new Float32Array([0,0,0,0])
var log        = console.log.bind(console)
var logShader  = function (gl, shader) { log(gl.getShaderInfoLog(shader)) }
var logProgram = function (gl, program) { log(gl.getProgramInfoLog(program)) }

//fetch file by name and call "nodeback"
function loadXhr (type, path, cb) {
  var xhr     = new XMLHttpRequest

  xhr.responseType = type
  xhr.onload       = function () { cb(null, xhr.response) }
  xhr.onerror      = function () { cb(new Error("Could not load " + path)) }
  xhr.open("GET", path, true)
  xhr.send(null)
}

//clear the webgl context
function clearContext (gl, v4Color) {
  gl.clearColor(v4Color[0], v4Color[1], v4Color[2], v4Color[3])
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

function animate (gl) {
  clearContext(gl, bgColor)
  gl.drawArrays(gl.POINTS, 0, 1)
  requestAnimationFrame(function () { animate(gl) }) 
}

/*
 * We want to create a wrapper for a loaded gl program
 * that includes pointers to all the uniforms and attributes
 * defined for this program.  This makes it more convenient
 * to change these values
 */
function LoadedProgram (gl, vSrc, fSrc, vs, fs, program) {
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

  for (var i in numAttributes) {
    aName = gl.getActiveAttrib(program, i).name

    lp.attributes[aName] = gl.getAttribLocation(program, aName);
  }

  for (var j in numUniforms) {
    uName = gl.getActiveUniform(program, j).name

    lp.uniforms[uName] = gl.getUniformLocation(program, uName);
  }
    
  return lp 
}

loadXhr("string", "/shaders/01v.glsl", function (errV, vSrc) {
  loadXhr("string", "/shaders/01f.glsl", function (errF, fSrc) {
    var vs      = compile(gl, gl.VERTEX_SHADER, vSrc)
    var fs      = compile(gl, gl.FRAGMENT_SHADER, fSrc)
    var program = link(gl, vs, fs)
    var aPosition
    var uFragColor
    var lp

    gl.useProgram(program)

    lp = LoadedProgram(gl, vSrc, fSrc, vs, fs, program)
    log(lp)
    //aPosition  = gl.getAttribLocation(program, 'aPosition')
    //uFragColor = gl.getUniformLocation(program, 'uFragColor')
    //gl.vertexAttrib2f(aPosition, 0.0, 0.0)
    //gl.uniform4f(uFragColor, 1.0, 0.0, 0.0, 0.0)

    //animate(gl)
  })
})

canvas.id = "board"
root.appendChild(canvas)
