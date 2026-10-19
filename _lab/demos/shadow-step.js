import { Vector3, FrontSide, BackSide, DoubleSide } from 'three/webgpu';
import { DirectionalShadowPass } from '../shadow/directional-shadow-pass.js';
import { loadWgslFunction } from '../shadow/wgsl-loader.js';
import { createShadowedMaterial } from '../shadow/shadowed-material.js';
import { buildShowcaseScene } from '../shadow/showcase-scene.js';
import { TexelDebugView } from '../shadow/texel-debug-view.js';

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

const VIEW_PARAM = {
    label: 'View',
    value: 'result',
    options: [
        { value: 'result', label: 'Result' },
        { value: 'texels', label: 'Shadow texels only' },
        { value: 'both', label: 'Result + shadow texels' },
    ],
};

const TEXEL_VIEWS_TOO_BIG = `The texel views draw one square per texel and are limited to ${ TexelDebugView.MAX_RESOLUTION } × ` +
    `${ TexelDebugView.MAX_RESOLUTION }. Lower the shadow map resolution to use them.`;

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
 *   viewControl  boolean              show the view selector: result / shadow texels (default true)
 */
export default async function shadowStep( viewport, { codeUrl, options } ) {

    if ( ! codeUrl ) throw new Error( 'shadow-step needs a `code` file.' );

    const {
        filter = 'nearest', resolution = 2048, side = 'front',
        lightControls = true, resolutionControl = true, viewControl = true,
    } = options;

    const { fn: visibility, schema } = await loadWgslFunction( codeUrl );
    const { values, uniforms } = viewport.setParams( {
        ...( lightControls ? LIGHT_PARAMS : {} ),
        ...( resolutionControl ? { mapResolution: resolutionParam( resolution ) } : {} ),
        ...( viewControl ? { viewMode: VIEW_PARAM } : {} ),
        ...schema,
    } );

    const initialResolution = resolutionControl ? 2 ** values.mapResolution : resolution;
    const pass = new DirectionalShadowPass( { resolution: initialResolution, filter, side: SIDES[ side ] ?? FrontSide } );

    const { group, center, radius } = buildShowcaseScene( ( color ) =>
        createShadowedMaterial( { pass, visibility, inputs: uniforms, color } ) );
    viewport.scene.add( group );

    const texelView = new TexelDebugView( pass );
    viewport.scene.add( texelView.mesh );
    let status = '';

    const direction = new Vector3();
    viewport.beforeRender( ( vp ) => {

        const az = ( values.azimuth ?? LIGHT_PARAMS.azimuth.value ) * Math.PI / 180;
        const el = ( values.elevation ?? LIGHT_PARAMS.elevation.value ) * Math.PI / 180;
        direction.set( Math.cos( el ) * Math.sin( az ), Math.sin( el ), Math.cos( el ) * Math.cos( az ) );

        if ( resolutionControl ) pass.setResolution( 2 ** values.mapResolution );

        // The depth pass renders everything visible: it must see the scene, and not the debug squares.
        group.visible = true;
        texelView.mesh.visible = false;

        pass.fit( { direction, center, radius } );
        pass.render( vp.renderer, vp.scene );

        // View modes: the shaded result, the texel squares alone, or the squares drawn over the geometry.
        const mode = viewControl ? values.viewMode : 'result';
        const wantsTexels = mode !== 'result';
        const showTexels = wantsTexels && texelView.supported;

        // Too big to draw as squares: keep showing the result, and say why.
        const message = wantsTexels && ! showTexels ? TEXEL_VIEWS_TOO_BIG : '';
        if ( message !== status ) vp.setStatus( status = message );

        if ( showTexels ) texelView.update();
        texelView.mesh.visible = showTexels;
        group.visible = ! ( showTexels && mode === 'texels' );

    } );

}
