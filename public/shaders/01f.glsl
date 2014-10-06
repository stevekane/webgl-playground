precision highp float;

uniform vec4 uColor;
uniform vec3 uLights[3];

varying vec4 vPosition;

float calcIntensity (vec3 pos, vec3 light) {
  float d = distance(pos, light);

  return 1.0 / (d * d + 1.0);
}

void main () {
  float i  = 0.0;
  vec3 pos = vec3(vPosition);

  for (int j = 0; j < 3; j++) {
    i += calcIntensity(pos, uLights[j]);
  }

  gl_FragColor = vec4(uColor.x * i, uColor.y * i, uColor.z * i, uColor.w);
}
