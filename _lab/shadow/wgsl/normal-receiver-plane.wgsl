// @param constantBias 0 0.2 0.03 0.002 Constant bias
// @param slopeBiasFactor 0 1.0 0.15 0.01 Slope bias factor
// @param maxBias 0 100.0 30.0 1.0 Bias max value
fn shadowVisibility(
    shadowMap: texture_depth_2d,
    shadowSampler: sampler_comparison,
    shadowResolution: vec2<f32>,
    shadowCoord: vec3<f32>,
    shadowNormal: vec3<f32>,
    normalDotLight: f32,
    constantBias: f32,
    slopeBiasFactor: f32,
    maxBias: f32,
    biasFactor: f32
) -> f32 {
    // Outside the light's frustum there is no information: treat it as lit.
    if (any(shadowCoord.xy < vec2<f32>(0.0)) || any(shadowCoord.xy > vec2<f32>(1.0)) || shadowCoord.z > 1.0) {
        return 1.0;
    }

    // Keep the slope finite at grazing angles, where shadowNormal.z tends to 0.
    let denom = select(select(-1e-3, 1e-3, shadowNormal.z >= 0), shadowNormal.z, abs(shadowNormal.z) > 1e-3);
    let dz_dUV = -shadowNormal.xy / denom;

    let distanceToCenterUv = (fract(shadowCoord.xy * shadowResolution) - 0.5) / shadowResolution;

    var bias = dot(dz_dUV, distanceToCenterUv);

    let cosTheta = normalDotLight;
    let tanTheta = sqrt(1 - cosTheta * cosTheta) / cosTheta;
    bias += min(maxBias, constantBias + slopeBiasFactor * tanTheta) * biasFactor;

    // 1.0 where the receiver is closer to the light than the stored occluder, else 0.0.
    return textureSampleCompareLevel(shadowMap, shadowSampler, shadowCoord.xy, shadowCoord.z - bias);
}
