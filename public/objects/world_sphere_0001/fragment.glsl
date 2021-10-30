precision highp float;

uniform mat4 worldViewProjection;
uniform vec3 cameraPosition;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vec4 col = vec4(0.0);

    // neon night mode:
    // col.r = 0.3;
    // col.b += 0.1 + 0.1 * cos(vPosition.x / 10.0);
    // col.b = 0.3 + vPosition.y / 30.0;
    // col.a = 1.0;

    // day mode
    col.r = 0.1;
    float skyr = 1.0 / pow(abs(vPosition.y), 0.4) / 1.0 + 0.2;
    float skyg = 1.0 / pow(abs(vPosition.y), 0.3) / 1.0 + 0.0;
    float skyb = 1.0 / pow(abs(vPosition.y), 0.4) / 1.0 + 0.2;
    col.r = 0.01 * skyr;
    col.g = 0.2 * skyg;
    col.b = 0.8 * skyb;
    col.a = 1.0;

    gl_FragColor = col;
}
