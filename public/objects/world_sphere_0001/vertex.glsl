precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 worldViewProjection;

// Varying
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vPosition;


void main(void) {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    vPosition = position;
    vNormal = normal;
    vUV = uv;
}
