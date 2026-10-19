import { MeshBasicNodeMaterial, Color } from 'three/webgpu';
import { vec4, float, max, dot, mix, normalWorld, uniform } from 'three/tsl';

/**
 * Directional light shading shared by every demo: ambient + N.L, scaled by a visibility term.
 * With the default visibility of 1 this is the unshadowed scene; shadow demos pass their shadow lookup instead.
 *
 * @param {object} options
 * @param {any} options.lightDirection TSL vec3 node: unit vector pointing from the surface towards the light.
 * @param {number|string} [options.color=0xffffff]
 * @param {number} [options.ambient=0.25]
 * @param {any} [options.visibility] TSL float node: 1 = fully lit, 0 = fully shadowed.
 */
export function createLitMaterial( { lightDirection, color = 0xffffff, ambient = 0.25, visibility = float( 1 ) } ) {

    const albedo = uniform( new Color( color ) );
    const nDotL = max( dot( normalWorld.normalize(), lightDirection ), 0 );
    const lit = mix( float( ambient ), float( 1 ), nDotL.mul( visibility ) );

    const material = new MeshBasicNodeMaterial();
    material.colorNode = vec4( albedo.mul( lit ), 1 );
    return material;

}
