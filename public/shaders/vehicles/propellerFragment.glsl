precision highp float;

uniform mat4 worldViewProjection;
uniform float time;
uniform vec3 acceleration;
uniform vec3 cameraPosition;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 worldPosition;
varying vec3 modelOrigin;

void main(void) {
    vec3 direction = normalize(worldPosition - cameraPosition);

    vec3 p = worldPosition - modelOrigin;
    float density = 0.0;

    p.y += 0.5;

    for (int i = 0; i < 10; i++) {
        p += direction * 0.1;

        float r = 1.0;
        float d = length(p) - r;

        if (d < 0.0) {
            density += 0.02 * (1.0 - d);
        }
    }

    density *= 2.0 + 0.6 * cos(p.y * 10.0 + time);
    vec4 col = vec4(0.3, 0.0, 1.0, density);

    gl_FragColor = col.rgba;
}
