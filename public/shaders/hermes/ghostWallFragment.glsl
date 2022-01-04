


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

    float fakeAO = pow(length(mod(vUV, 1.0) - vec2(0.5)), 2.0) +
        pow(1.4 * length(mod(vUV, 1.0) - vec2(0.5)), 10.0);;
    vec4 wallColor = vec4(0.3);

    col.rgb += wallColor.rgb;

    col.rgb *= 1.0 - 0.4 * fakeAO;

    col.rgb *= 1.5;
    col.a = 0.3;

    gl_FragColor = col;
}
