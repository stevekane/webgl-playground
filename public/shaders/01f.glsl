precision highp float;

uniform vec4 uColor;
//uLights is two sequential vec3s in a row.  First is position, second is RGB
uniform vec3 uLights[6];

varying vec4 vPosition;

float calcIntensity (vec3 pos, vec3 light) {
  float d = distance(pos, light);

  return 1.0 / (d * d + 1.0);
}

void main () {
  float i    = 0.0;
  vec3 pos   = vec3(vPosition);
  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);

  for (int j = 0; j < 6; j+=2) {
    i = calcIntensity(pos, uLights[j]);
    color.x += i * uLights[j+1].x;
    color.y += i * uLights[j+1].y;
    color.z += i * uLights[j+1].z;
  }

  gl_FragColor = color;
}
