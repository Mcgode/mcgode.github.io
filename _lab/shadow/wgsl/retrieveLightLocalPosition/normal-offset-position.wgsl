// @param normalOffset 0 10.0 0.7 0.1 Normal offset (texels)
fn retrieveLightLocalPosition(
    lightMatrix: mat4x4<f32>,
    worldPos: vec3<f32>,
    worldNormal: vec3<f32>,
    lightDirection: vec3<f32>,
    worldTexelSize: f32,
    normalOffset: f32
) -> vec3<f32> {
    // Push the receiver out along its normal, further as the surface turns away from the light.
    let cosTheta = dot(worldNormal, lightDirection);
    let sinTheta = sqrt(saturate(1.0 - cosTheta * cosTheta));
    let offsetPos = worldPos + worldNormal * (normalOffset * worldTexelSize * sinTheta);

    let pos: vec4<f32> = lightMatrix * vec4<f32>(offsetPos, 1.0);
    return pos.xyz / pos.w;
}
