precision highp float;

uniform vec4 uColor;
uniform vec4 uLights[8];

varying vec4 position;

float calcIntensity (vec4 light) {
  float d = distance(position, light);

  return 1.0 / (d * d + 1.0);
}

void main () {
  float i = 0.0;

  for (int j = 0; j < 2; j++) {
    i += calcIntensity(uLights[j]);
  }

  gl_FragColor = vec4(uColor.x * i, uColor.y * i, uColor.z * i, uColor.w);
}
