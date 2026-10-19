fn shadowVisibility(
    shadowMap: texture_depth_2d,
    shadowSampler: sampler_comparison,
    shadowCoord: vec3<f32>,
    texelSize: f32
) -> f32 {
    // Outside the light's frustum there is no information: treat it as lit.
    if (any(shadowCoord.xy < vec2<f32>(0.0)) || any(shadowCoord.xy > vec2<f32>(1.0)) || shadowCoord.z > 1.0) {
        return 1.0;
    }

    // 1.0 where the receiver is closer to the light than the stored occluder, else 0.0.
    return textureSampleCompareLevel(shadowMap, shadowSampler, shadowCoord.xy, shadowCoord.z);
}
