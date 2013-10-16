attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

uniform vec3 lightPosition;

uniform vec3 uAmbientColor;

uniform vec3 uLightingDirection;
uniform vec3 uDirectionalColor;

varying vec2 vTextureCoord;
varying vec2 vReflectiveTextureCoord;
//varying vec3 vLightWeighting;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
    vPosition = (uMVMatrix * vec4(aVertexPosition, 1.0)).xyz;
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    vec3 transformedNormal = uNMatrix * aVertexNormal;
    vNormal = transformedNormal;
    vTextureCoord = aTextureCoord;
    vReflectiveTextureCoord = vec2(0.5, 0.5) + vec2(transformedNormal[0]*.5, transformedNormal[1]*.5);
            
}