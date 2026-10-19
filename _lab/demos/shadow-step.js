import { Vector3, FrontSide, BackSide, DoubleSide } from 'three/webgpu';
import { DirectionalShadowPass } from '../shadow/directional-shadow-pass.js';
import { loadWgslFunction } from '../shadow/wgsl-loader.js';
import { createShadowedMaterial } from '../shadow/shadowed-material.js';
import { buildShowcaseScene } from '../shadow/showcase-scene.js';

const SIDES = { front: FrontSide, back: BackSide, double: DoubleSide };

const LIGHT_PARAMS = {
    azimuth: { label: 'Light azimuth (°)', min: 0, max: 360, value: 35, step: 1, int: true },
    elevation: { label: 'Light elevation (°)', min: 5, max: 90, value: 45, step: 1, int: true },
};

const MIN_EXPONENT = 6;  //   64 x 64
const MAX_EXPONENT = 12; // 4096 x 4096

// Resolution is chosen as an exponent so that the slider only visits powers of two.
const resolutionParam = ( resolution ) => ( {
    label: 'Shadow map resolution',
    min: MIN_EXPONENT, max: MAX_EXPONENT, step: 1, int: true,
    value: Math.min( MAX_EXPONENT, Math.max( MIN_EXPONENT, Math.round( Math.log2( resolution ) ) ) ),
    format: ( exponent ) => `${ 2 ** exponent }`,
} );

/**
 * Generic "one WGSL visibility function, one lit scene" demo. Every step of the shadow articles that only
 * swaps the shadow lookup uses this module unchanged; the step *is* the .wgsl file.
 *
 * Options (JSON in the include):
 *   filter      'nearest' | 'linear'  depth texture filtering             (default 'nearest')
 *   resolution  number                initial shadow map size, a power of two (default 2048)
 *   side        'front'|'back'|'double'  faces rendered into the map     (default 'front')
 *   lightControls  boolean            show azimuth/elevation sliders      (default true)
 *   resolutionControl  boolean        show the shadow map resolution slider (default true)
 */
export default async function shadowStep( viewport, { codeUrl, options } ) {

    if ( ! codeUrl ) throw new Error( 'shadow-step needs a `code` file.' );

    const {
        filter = 'nearest', resolution = 2048, side = 'front', lightControls = true, resolutionControl = true,
    } = options;

    const { fn: visibility, schema } = await loadWgslFunction( codeUrl );
    const { values, uniforms } = viewport.setParams( {
        ...( lightControls ? LIGHT_PARAMS : {} ),
        ...( resolutionControl ? { mapResolution: resolutionParam( resolution ) } : {} ),
        ...schema,
    } );

    const initialResolution = resolutionControl ? 2 ** values.mapResolution : resolution;
    const pass = new DirectionalShadowPass( { resolution: initialResolution, filter, side: SIDES[ side ] ?? FrontSide } );

    const { group, center, radius } = buildShowcaseScene( ( color ) =>
        createShadowedMaterial( { pass, visibility, inputs: uniforms, color } ) );
    viewport.scene.add( group );

    const direction = new Vector3();
    viewport.beforeRender( ( vp ) => {

        const az = ( values.azimuth ?? LIGHT_PARAMS.azimuth.value ) * Math.PI / 180;
        const el = ( values.elevation ?? LIGHT_PARAMS.elevation.value ) * Math.PI / 180;
        direction.set( Math.cos( el ) * Math.sin( az ), Math.sin( el ), Math.cos( el ) * Math.cos( az ) );

        if ( resolutionControl ) pass.setResolution( 2 ** values.mapResolution );

        pass.fit( { direction, center, radius } );
        pass.render( vp.renderer, vp.scene );

    } );

}
