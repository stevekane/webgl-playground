precision highp float;

uniform vec4 uColor;
uniform vec3 uLightPositions[3];
uniform vec3 uLightColors[3];
uniform float uLightIntensities[3];

varying vec4 vPosition;

float calcIntensity (vec3 pos, float intensity, vec3 light) {
  float d = distance(pos, light);

  return intensity / (d * d + 1.0);
}

void main () {
  float i    = 0.0;
  vec3 pos   = vec3(vPosition);
  vec4 color = uColor;

  for (int j = 0; j < 3; j++) {
    i        = calcIntensity(pos, uLightIntensities[j], uLightPositions[j]);
    color.x += i * uLightColors[j].x;
    color.y += i * uLightColors[j].y;
    color.z += i * uLightColors[j].z;
  }

  gl_FragColor = color;
}
