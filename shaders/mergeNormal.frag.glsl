varying vec2 newUV;
varying vec2 vUv;
uniform sampler2D globalnormal;
uniform sampler2D detailnormal;
uniform float globalnormalScale;
uniform float detailnormalScale;

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

void main() {

    //vec3 GN = texture2D(globalnormal, vUv).xyz;
    //GN.rg *= globalnormalScale;
    //GN = reconstruct_normal(GN.rg);
    //GN = GN * .5 + .5;

    //vec3 DN = texture2D(detailnormal, newUV).xyz;
    //vec3 recalcDN = reconstruct_normal(DN.rg)
    //DN = DN * .5 + .5;
    //DN.rg *= detailnormalScale;
    //DN = reconstruct_normal(DN.rg);
    //expand the normal map
    vec3 GN = texture2D(globalnormal,vUv).xyz * 2.0 -1.0;
    GN.xy *= globalnormalScale;
    vec3 DN = texture2D(detailnormal,vUv).xyz *2.0 -1.0;
    DN.xy *= detailnormalScale;

    vec3 normal = normalize(vec3(GN.xy + DN.xy , GN.z));
    gl_FragColor = vec4(normal*0.5 + 0.5,1.0);
}