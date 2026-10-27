fn retrieveLightLocalPosition(
    lightMatrix: mat4x4<f32>,
    worldPos: vec3<f32>
) -> vec3<f32> {
    let pos: vec4<f32> = lightMatrix * vec4<f32>(worldPos, 1.0);
    return pos.xyz / pos.w;
}
