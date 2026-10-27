// @param constantBias 0 1.0 0.1 0.01 Constant bias
fn shadowVisibility(
    shadowMap: texture_depth_2d,
    shadowSampler: sampler_comparison,
    shadowResolution: vec2<f32>,
    shadowCoord: vec3<f32>,
    constantBias: f32,
    biasFactor: f32
) -> f32 {
    // Retrieve the screen-space derivatives before possible control flow divergence
    let dz_dXY = vec2<f32>(dpdx(shadowCoord.z), dpdy(shadowCoord.z));
    let dU_dXY = vec2<f32>(dpdx(shadowCoord.x), dpdy(shadowCoord.x));
    let dV_dXY = vec2<f32>(dpdx(shadowCoord.y), dpdy(shadowCoord.y));

    // Outside the light's frustum there is no information: treat it as lit.
    if (any(shadowCoord.xy < vec2<f32>(0.0)) || any(shadowCoord.xy > vec2<f32>(1.0)) || shadowCoord.z > 1.0) {
        return 1.0;
    }

    let det = dU_dXY.x * dV_dXY.y - dU_dXY.y * dV_dXY.x;

    var dz_dUV = vec2<f32>(0.0, 0.0);
    if (det != 0.0) {
        dz_dUV.x = dot(dz_dXY, vec2<f32>(dV_dXY.y, -dV_dXY.x)) / det;
        dz_dUV.y = dot(dz_dXY, vec2<f32>(-dU_dXY.y, dU_dXY.x)) / det;
    }

    let distanceToCenterUv = (fract(shadowCoord.xy * shadowResolution) - 0.5) / shadowResolution;

    var bias = dot(dz_dUV, distanceToCenterUv);

    bias += constantBias * biasFactor;

    // 1.0 where the receiver is closer to the light than the stored occluder, else 0.0.
    return textureSampleCompareLevel(shadowMap, shadowSampler, shadowCoord.xy, shadowCoord.z - bias);
}
