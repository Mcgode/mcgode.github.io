import { vec3, max, dot, normalWorld, positionWorld, texture, samplerComparison } from 'three/tsl';
import { createLitMaterial } from './lit-material.js';

/**
 * Creates a lit material that receives shadows from a `DirectionalShadowPass`.
 *
 * The visibility function is user-supplied WGSL with the following contract:
 *
 *     fn shadowVisibility(
 *         shadowMap: texture_depth_2d, shadowSampler: sampler_comparison,
 *         shadowCoord: vec3<f32>,   // xy: shadow map uv, z: receiver depth in the light's 0..1 range
 *         texelSize: f32,           // size of one shadow map texel, in uv units
 *         normalDotLight: f32,      // optional: cosine of the angle between surface normal and light, 0 at grazing angles
 *         ... any extra inputs, bound by name from `inputs` ...
 *     ) -> f32                      // 1 = fully lit, 0 = fully shadowed
 *
 * Everything around that function (projecting into light space, N.L shading) is boilerplate that does not
 * change between article steps, so it lives here, not in the listings. The shading itself is `createLitMaterial`.
 *
 * @param {object} options
 * @param {DirectionalShadowPass} options.pass
 * @param {any} options.visibility A node created by `loadWgslFunction`.
 * @param {any} options.projection A node created by `wgslFunctionFromText`, with the following contract:
 *
 *     fn retrieveLightLocalPosition(
 *         lightMatrix: mat4x4<f32>,    // world space -> shadow coordinates (NDC-to-uv transform included)
 *         worldPos: vec3<f32>,
 *         worldNormal: vec3<f32>,      // optional: unit surface normal
 *         lightDirection: vec3<f32>,   // optional: unit vector from the surface towards the light
 *         worldTexelSize: f32,         // optional: size of one shadow map texel, in world units
 *         ... any extra inputs, bound by name from `inputs` ...
 *     ) -> vec3<f32>                   // shadowCoord, as expected by `shadowVisibility`
 *
 * @param {Record<string, any>} [options.inputs] Extra TSL nodes for the functions' extra inputs, by name.
 * @param {number|string} [options.color=0xffffff]
 * @param {number} [options.ambient=0.25]
 */
export function createShadowedMaterial( { pass, visibility, projection, inputs = {}, color = 0xffffff, ambient = 0.25 } ) {

    const worldNormal = normalWorld.normalize();

    // Where the receiver lands in the shadow map: xy is the uv, z the depth. The function is swappable, so that
    // article steps can change how the receiver is projected (e.g. normal offset bias).
    const shadowCoord = projection( {
        ...inputs,
        lightMatrix: pass.lightMatrix,
        worldPos: positionWorld,
        worldNormal,
        lightDirection: pass.lightDirection,
        worldTexelSize: pass.worldTexelSize,
    } );

    const shadowMap = texture( pass.depthTexture );
    // The same N.L the shading uses; functions that do not declare `normalDotLight` simply ignore it.
    const normalDotLight = max( dot( worldNormal, pass.lightDirection ), 0 );

    const biasFactor = pass.worldTexelSize.div( pass.worldFrustumDepth );

    const shadowNormal = pass.lightNormalMatrix.mul( worldNormal );

    const visibilityNode = visibility( {
        ...inputs,
        shadowMap,
        shadowSampler: samplerComparison( shadowMap ),
        shadowCoord,
        biasFactor,
        normalDotLight,
        shadowNormal,
        shadowResolution: pass.resolutionNode,
    } );

    return createLitMaterial( { lightDirection: pass.lightDirection, color, ambient, visibility: visibilityNode } );

}
