precision highp float;

attribute vec4 aPosition;
uniform float uSize;
uniform vec2 uScreenSize;
uniform vec4 uColor;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec4 position;

//dark stackexchange knowledge for particle size
float calculateSize () {
  vec4 eyePos    = uView * aPosition;
  vec4 projVoxel = uProjection * vec4(uSize, uSize, eyePos.z, eyePos.w);
  vec2 projSize  = uScreenSize * projVoxel.xy / projVoxel.w;
  float size     = .004 * (projSize.x + projSize.y);

  return size;
}

void main () {
  gl_PointSize = calculateSize();
  gl_Position  = uProjection * uView * aPosition;

  //pass position to the fragment shader
  position = aPosition;
}
