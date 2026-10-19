import { Vector3 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { createLitMaterial } from '../shadow/lit-material.js';
import { buildShowcaseScene } from '../shadow/showcase-scene.js';
import { LIGHT_PARAMS, lightDirectionFromParams } from '../shadow/light-controls.js';

/**
 * The showcase scene lit by a directional light, with no shadows at all: the starting point of the shadow articles.
 * Same shading as the shadow demos, minus the shadow lookup, and no depth pass.
 *
 * Options (JSON in the include):
 *   lightControls  boolean  show azimuth/elevation sliders  (default true)
 */
export default function unshadowed( viewport, { options } ) {

    const { lightControls = true } = options;

    const { values } = viewport.setParams( lightControls ? LIGHT_PARAMS : {} );

    const lightDirection = uniform( new Vector3( 0, 1, 0 ) );

    const { group } = buildShowcaseScene( ( color ) => createLitMaterial( { lightDirection, color } ) );
    viewport.scene.add( group );

    viewport.beforeRender( () => {

        lightDirectionFromParams( values, lightDirection.value );

    } );

}
