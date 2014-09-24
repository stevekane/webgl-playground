var prodash = require("prodash")
var uuid    = require("node-uuid")
var Node    = prodash.graph.Node
var vec2    = require("../modules/vec2")
var Vec2    = vec2.Vec2
var types   = {}

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
    vertex: {
      src:    vSrc,
      shader: vs 
    },
    fragment: {
      src:    fSrc,
      shader: fs 
    },
    program:    program,
    uniforms:   {}, 
    attributes: {},
    buffers:    {}
  }
  var aName
  var uName

  for (var i = 0; i < numAttributes; ++i) {
    aName                = gl.getActiveAttrib(program, i).name
    lp.attributes[aName] = gl.getAttribLocation(program, aName)
    lp.buffers[aName]    = gl.createBuffer()
  }

  for (var j = 0; j < numUniforms; ++j) {
    uName              = gl.getActiveUniform(program, j).name
    lp.uniforms[uName] = gl.getUniformLocation(program, uName)
  }

  return lp 
}

types.Particle = function (lifespan, px, py, vx, vy, ax, ay) {
  return Node({
    id:           uuid.v4(),
    position:     Vec2(px, py),
    velocity:     Vec2(vx, vy),
    acceleration: Vec2(ax, ay),
    renderable:   true,
    timeToDie:    0,
    lifespan:     lifespan,
    living:       false
  }) 
}

types.Emitter = function (count, lifespan, rate, speed, spread, px, py, dx, dy) {
  var particles = []

  for (var i = 0; i < count; ++i) {
    particles.push(types.Particle(lifespan, px, py, 0, 0, 0, -0.0000009))
  }

  return Node({
    id:           uuid.v4(),
    emitter:      true,
    rate:         rate, 
    speed:        speed,
    spread:       spread,
    nextFireTime: 0,
    position:     Vec2(px, py),
    velocity:     Vec2(0, 0),
    acceleration: Vec2(0, 0),
    direction:    Vec2(dx, dy),
    renderable:   false,
    living:       true
  }, particles)
}

module.exports = types
