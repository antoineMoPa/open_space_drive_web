precision highp float;

uniform mat4 worldViewProjection;
uniform float time;
uniform vec3 acceleration;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vec4 color = vec4(0.0);

    float accelerationMultiplier = 0.8 + abs(acceleration.z) * 0.000001;
    float fire = accelerationMultiplier;

    vec4 fireColor = vec4(0.8, 0.2, 0.8,0.8);
    fire += accelerationMultiplier * cos(vPosition.y * 72.2 + time * 1.0);
    fire += accelerationMultiplier * cos(vPosition.x * 75.5 + time * 1.3);
    fire += accelerationMultiplier * cos(vPosition.y * 54.1 + time * 1.6);
    fire += accelerationMultiplier * cos(vPosition.y * 82.5 + time * 1.6);
    fire += accelerationMultiplier * cos(vPosition.z * 123.0 + time * 1.7);
    fire = clamp(fire, 0.0, 1.0);
    fire *= 1.0-pow(3.5 * length(vUV - vec2(0.5)), 2.0);
    fire *= 2.0;
    fire *= accelerationMultiplier;
    color += fireColor;
    color.a = clamp(fire, 0.0, 1.0);
    color.a *= vPosition.y > 0.0 ? 0.0: 1.0;

    gl_FragColor = color.rgba;
}
