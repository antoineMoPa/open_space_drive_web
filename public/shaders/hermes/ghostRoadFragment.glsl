


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
    vec4 roadColor = vec4(0.1);

    col.rgb += roadColor.rgb;
    float x = vUV.x - 1.0;
    col.rg += 0.4 * (1.0 - clamp((abs(x - 0.05) - 0.005)/0.003, 0.0, 1.0));
    col.rg += 0.4 * (1.0 - clamp((abs(x - 0.95) - 0.005)/0.003, 0.0, 1.0));

    col.rgb *= 1.0 - 0.4 * fakeAO;

    col.r += clamp(0.02 * cos(vPosition.x * 0.02), 0.0, 1.0);
    col.b += clamp(0.02 * cos(vPosition.z * 0.02), 0.0, 1.0);

    col.rgb *= 1.5;
    col.a = 0.3;

    gl_FragColor = col;
}
