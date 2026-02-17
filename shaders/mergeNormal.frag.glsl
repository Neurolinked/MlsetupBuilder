varying vec2 newUV;
varying vec2 vUv;
uniform sampler2D globalnormal;
uniform sampler2D detailnormal;
uniform float globalnormalScale;
uniform float detailnormalScale;

uniform sampler2D layerMask1;
uniform sampler2D mBlend1;
uniform float mBlendContrast1;

vec3 reconstruct_normal(vec2 rg_channels) {
    // Decompress the red and green channels from the [0, 1] texture range 
    // to the view-space [-1, 1] range.
    vec2 normal_xy = rg_channels * 2.0 - 1.0 ;

    // Calculate the blue channel (Z component) using the Pythagorean theorem.
    // The vector is normalized, so x^2 + y^2 + z^2 = 1.
    float normal_z = sqrt(1.0 - dot(normal_xy, normal_xy));

    // Combine the channels to form the final normal vector.
    return vec3(normal_xy, normal_z);
}

vec3 mBlendContrastExecute(vec3 texA,vec3 texB,float contrast){
    // linear burn formula per wikipedia
    vec3 linearburn = texA + texB -1.0f;
    // use mbcontrast to lerp between mlmask and linearburn
    vec3 blend = mix(linearburn, texA, contrast);
    // this is how contrast is generated
    vec3 result = blend * (1.0f / contrast);
    return result;
}

void main() {
    //expand the normal map
    vec3 GN = texture2D(globalnormal,vUv).xyz * 2.0 - 1.0;
    GN.xy *= globalnormalScale;
    vec3 DN = texture2D(detailnormal,newUV).xyz *2.0 - 1.0;
    DN.xy *= detailnormalScale;

    vec3 normal = normalize(vec3(GN.xy + DN.xy , GN.z));
    gl_FragColor = vec4(normal*0.5 + 0.5,1.0);
}