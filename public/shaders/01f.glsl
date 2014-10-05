precision highp float;

uniform vec4 uColor;
uniform float uLights[6];

varying vec4 vPosition;

float calcIntensity (vec3 pos, vec3 light) {
  float d = distance(pos, light);

  return 1.0 / (d * d + 1.0);
}

void main () {
  float i  = 0.0;
  //vec3 l1  = vec3(0.0, 1.0, 0.0);
  vec3 l2  = vec3(2.5, 0.0, 0.0);
  vec3 pos = vec3(vPosition);

  for (int j = 0; j < 1; j++) {
    //i += calcIntensity(pos, uLights);
    i += calcIntensity(pos, vec3(uLights[j], uLights[j+1], uLights[j+2]));
  }

  //i += calcIntensity(pos, l1);
  //i += calcIntensity(pos, l2);

  gl_FragColor = vec4(uColor.x * i, uColor.y * i, uColor.z * i, uColor.w);
}
