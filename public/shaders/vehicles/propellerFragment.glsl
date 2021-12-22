


precision highp float;

uniform mat4 worldViewProjection;
uniform vec3 cameraPosition;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vec4 col = vec4(0.0);

    int i = int(vPosition.x * 2.0) + 4390;
    int j = int(vPosition.z * 2.0) + 34000;

    float fakeAO = pow(length(mod(vUV, 1.0) - vec2(0.5)), 4.0);
    vec4 roadColor = vec4(0.3);

    col.rgb = cos(cameraPosition);

    col.a = 1.0;

    gl_FragColor = col;
}
