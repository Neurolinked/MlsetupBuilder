varying vec2 vUv;
varying vec2 newUV;
uniform float tiles;
uniform vec2 offset;

void main() {
    vUv = uv;
    newUV = vec2(tiles) * (uv + offset);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}