precision highp float;

attribute vec4 aPosition;
uniform float uSize;
uniform vec2 uScreenSize;
uniform vec4 uColor;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec4 vColor;

void main () {
  //dark stackexchange knowledge for particle size
  vec4 eyePos    = uView * aPosition;
  vec4 projVoxel = uProjection * vec4(uSize, uSize, eyePos.z, eyePos.w);
  vec2 projSize  = uScreenSize * projVoxel.xy / projVoxel.w;
  float size     = .02 * (projSize.x + projSize.y);
  gl_PointSize   = size;
  gl_Position    = uProjection * uView * aPosition;
  vColor         = vec4(uColor.x, uColor.y, uColor.z, size / uSize);
}
