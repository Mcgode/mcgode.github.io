// @param constantBias 0 10.0 0.1 0.1 Constant bias
// @param slopeBiasFactor 0 10.0 0.8 0.1 Slope bias factor
// @param maxBias 0 100.0 30.0 1.0 Bias max value
fn shadowVisibility(
    shadowMap: texture_depth_2d,
    shadowSampler: sampler_comparison,
    shadowCoord: vec3<f32>,
    biasFactor: f32,
    normalDotLight: f32,
    constantBias: f32,
    slopeBiasFactor: f32,
    maxBias: f32
) -> f32 {
    // Outside the light's frustum there is no information: treat it as lit.
    if (any(shadowCoord.xy < vec2<f32>(0.0)) || any(shadowCoord.xy > vec2<f32>(1.0)) || shadowCoord.z > 1.0) {
        return 1.0;
    }

    // The bias follows the slope, but is capped so that grazing surfaces do not detach their shadow (Peter panning).
    let cosTheta = normalDotLight;
    let tanTheta = sqrt(1 - cosTheta * cosTheta) / cosTheta;
    let bias = min(maxBias, constantBias + tanTheta * slopeBiasFactor);

    // 1.0 where the receiver is closer to the light than the stored occluder, else 0.0.
    return textureSampleCompareLevel(shadowMap, shadowSampler, shadowCoord.xy, shadowCoord.z - bias * biasFactor);
}
