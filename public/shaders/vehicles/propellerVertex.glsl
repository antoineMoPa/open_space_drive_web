precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// Uniforms
uniform mat4 worldViewProjection;
uniform mat4 worldView;
uniform vec3 cameraPosition;

// Varying
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 modelOrigin;
varying vec3 worldPosition;

void main(void) {
    gl_Position = worldViewProjection * vec4(position, 1.0);
    worldPosition = (worldView * vec4(position, 1.0)).xyz;
    modelOrigin = (worldView * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vPosition = position;
    vNormal = normal;
    vUV = uv;
}
