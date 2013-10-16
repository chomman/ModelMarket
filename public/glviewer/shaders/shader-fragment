precision mediump float;

varying vec2 vTextureCoord;
varying vec2 vReflectiveTextureCoord;
varying vec3 vPosition;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform sampler2D uSampler2;

uniform vec3 lightPosition;

uniform vec3 uAmbientColor;


void main(void) {
    vec3 defaultLight = vec3(.8,.8,.8);
    vec3 lightIntensity;
    vec4 roughTextureColor = texture2D(uSampler2, vec2(vTextureCoord.s, vTextureCoord.t));
    vec4 reflectTextureColor = texture2D(uSampler, vec2(vReflectiveTextureCoord.s, vReflectiveTextureCoord.t));
    vec3 textureTotals = roughTextureColor.rgb*1.5 * reflectTextureColor.rgb*1.5;

    vec3 eyeDirection = normalize(-vPosition);
    
    vec3 lightDirectionWithRespectToVertex = -normalize(vPosition - lightPosition);
    vec3 reflectionDirection = reflect(-lightDirectionWithRespectToVertex, vNormal);

    float directionalLightWeighting = max(dot(vNormal, lightDirectionWithRespectToVertex), 0.0);

    float specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 25.0);

    lightIntensity = uAmbientColor + defaultLight * directionalLightWeighting + defaultLight * 3.0 * specularLightWeighting;
    //gl_FragColor = vec4(textureTotals * vLightWeighting + vec3(0.6,0.6,0.6) * specularLightWeighting, roughTextureColor.a);
    gl_FragColor = vec4(textureTotals * lightIntensity, roughTextureColor.a);
}