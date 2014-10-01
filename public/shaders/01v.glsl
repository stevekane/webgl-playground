precision highp float;

attribute vec4 aPosition;
attribute float aSize;
uniform vec4 uColor;

varying vec4 vColor;

void main () {
  gl_Position  = aPosition;
  gl_PointSize = aSize;
  vColor       = uColor;
}
