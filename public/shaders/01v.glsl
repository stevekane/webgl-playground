precision highp float;

attribute vec4 aPosition;
uniform vec4 uColor;

varying vec4 vColor;

void main () {
  float size = 5.0;

  gl_Position  = aPosition;
  gl_PointSize = size;
  vColor       = uColor;
}
