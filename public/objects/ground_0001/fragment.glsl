precision highp float;

uniform mat4 worldViewProjection;
uniform vec3 cameraPosition;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vec4 col = vec4(0.0);

    int i = int(vPosition.x * 20.0) + 4390;
    int j = int(vPosition.z * 20.0) + 34000;
    float tiling = ((i ^ j) % (j / i) < 1) ? 1.0: 0.0;
    col.r = tiling * 0.4;
    col.b = tiling * 0.8;

    col.a = 1.0;

    gl_FragColor = col;
}
