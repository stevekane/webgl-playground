precision highp float;

attribute vec4 aPosition;
attribute float aSize;
uniform vec4 uColor;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec4 vColor;

void main () {
  gl_Position  = uProjection * uView * aPosition;
  gl_PointSize = aSize;
  vColor       = uColor;
}
