precision highp float;

uniform mat4 worldViewProjection;
uniform float time;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vec4 color = vec4(0.0);

    float acceleration = 0.3;  // todo un hardcode
    float fire = acceleration * 0.3;

    fire += acceleration * cos(vPosition.x * 3.0 + time * 1.0);
    fire += acceleration * cos(vPosition.y * 2.0 + time * 2.0);
    fire += acceleration * cos(vPosition.z * 5.0 + time * 3.0);
    fire *= 2.0;
    const vec4 fireColor = vec4(0.4, 0.2, 0.4,0.8);
    color += fire * fireColor;

    gl_FragColor = color.rgba;
}
