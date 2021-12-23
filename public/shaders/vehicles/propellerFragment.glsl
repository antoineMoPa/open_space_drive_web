precision highp float;

uniform mat4 worldViewProjection;
uniform float time;
uniform float speed;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vec4 color = vec4(0.0);

    float speedMultiplier = 0.2 + speed * 0.0001;
    float fire = speedMultiplier;

    fire += speedMultiplier * cos(vPosition.y * 3.0 + time * 1.0);
    fire += speedMultiplier * cos(vPosition.y * 2.0 + time * 1.3);
    fire += speedMultiplier * cos(vPosition.y * 4.0 + time * 1.6);
    fire += speedMultiplier * cos(vPosition.y * 13.0 + time * 1.7);
    fire = clamp(fire, 0.0, 1.0);
    fire *= 1.0-pow(1.5 * length(vUV - vec2(0.5)), 2.0);
    fire *= 2.0;
    fire *= speedMultiplier;
    const vec4 fireColor = vec4(0.8, 0.2, 0.8,0.8);
    color += fireColor;
    color.a = clamp(fire, 0.0, 1.0);

    gl_FragColor = color.rgba;
}
