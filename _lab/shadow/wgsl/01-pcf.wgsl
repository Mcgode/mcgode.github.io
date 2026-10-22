// @param bias 0 0.02 0.002 0.0001 Depth bias
// @param radius 0 6 1 1 Kernel radius (texels)
fn shadowVisibility(
    shadowMap: texture_depth_2d,
    shadowSampler: sampler_comparison,
    shadowCoord: vec3<f32>,
    texelSize: f32,
    bias: f32,
    radius: i32
) -> f32 {
    // Outside the light's frustum there is no information: treat it as lit.
    if (any(shadowCoord.xy < vec2<f32>(0.0)) || any(shadowCoord.xy > vec2<f32>(1.0)) || shadowCoord.z > 1.0) {
        return 1.0;
    }

    // Average the comparison result over a square kernel.
    let receiverDepth = shadowCoord.z - bias;
    var lit = 0.0;
    for (var y = -radius; y <= radius; y++) {
        for (var x = -radius; x <= radius; x++) {
            let offset = vec2<f32>(f32(x), f32(y)) * texelSize;
            lit += textureSampleCompareLevel(shadowMap, shadowSampler, shadowCoord.xy + offset, receiverDepth);
        }
    }
    let width = f32(2 * radius + 1);
    return lit / (width * width);
}
