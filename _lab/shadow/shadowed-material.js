import { vec3, vec4, positionWorld, texture, samplerComparison } from 'three/tsl';
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
 *         ... any extra inputs, bound by name from `inputs` ...
 *     ) -> f32                      // 1 = fully lit, 0 = fully shadowed
 *
 * Everything around that function (projecting into light space, N.L shading) is boilerplate that does not
 * change between article steps, so it lives here, not in the listings. The shading itself is `createLitMaterial`.
 *
 * @param {object} options
 * @param {DirectionalShadowPass} options.pass
 * @param {any} options.visibility A node created by `loadWgslFunction`.
 * @param {Record<string, any>} [options.inputs] Extra TSL nodes for the function's extra inputs, by name.
 * @param {number|string} [options.color=0xffffff]
 * @param {number} [options.ambient=0.25]
 */
export function createShadowedMaterial( { pass, visibility, inputs = {}, color = 0xffffff, ambient = 0.25 } ) {

    const lightClip = pass.matrix.mul( vec4( positionWorld, 1 ) );
    const ndc = lightClip.xyz.div( lightClip.w );
    // NDC y points up, texture v points down.
    const shadowCoord = vec3( ndc.x.mul( 0.5 ).add( 0.5 ), ndc.y.mul( - 0.5 ).add( 0.5 ), ndc.z );

    const shadowMap = texture( pass.depthTexture );

    const visibilityNode = visibility( {
        ...inputs,
        shadowMap,
        shadowSampler: samplerComparison( shadowMap ),
        shadowCoord,
        texelSize: pass.texelSize,
    } );

    return createLitMaterial( { lightDirection: pass.lightDirection, color, ambient, visibility: visibilityNode } );

}
