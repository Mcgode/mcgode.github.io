import { Vector3, FrontSide, BackSide, DoubleSide } from 'three/webgpu';
import { DirectionalShadowPass } from '../shadow/directional-shadow-pass.js';
import { loadWgslFunction } from '../shadow/wgsl-loader.js';
import { createShadowedMaterial } from '../shadow/shadowed-material.js';
import { buildShowcaseScene } from '../shadow/showcase-scene.js';
import { TexelDebugView } from '../shadow/texel-debug-view.js';
import { LIGHT_PARAMS, lightDirectionFromParams } from '../shadow/light-controls.js';
import { resolutionParam } from '../shadow/resolution-control.js';

const SIDES = { front: FrontSide, back: BackSide, double: DoubleSide };

const VIEW_OPTIONS = [
    { value: 'result', label: 'Result' },
    { value: 'texels', label: 'Shadow texels only' },
    { value: 'both', label: 'Result + shadow texels' },
];

// Hardware depth bias, applied by the rasterizer while the shadow map is drawn (see DirectionalShadowPass.setPolygonOffset).
// Both are in texels, so that a value looks the same at any shadow map resolution.
const HARDWARE_BIAS_PARAMS = {
    slopeScale: { label: 'Slope scale', min: 0, max: 10, value: 1, step: 0.1 },
    depthBias: { label: 'Constant bias (texels)', min: 0, max: 10, value: 0.3, step: 0.1 },
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
 *   hardwareBias  boolean            add sliders for the rasterizer's depth bias, applied when the map is drawn (default false)
 *   view        'result' | 'texels' | 'both'  initial view; also the fixed view when `viewControl` is off (default 'result')
 *   viewControl  boolean              show the view selector: result / shadow texels (default true)
 */
export default async function shadowStep( viewport, { codeUrl, options } ) {

    if ( ! codeUrl ) throw new Error( 'shadow-step needs a `code` file.' );

    const {
        filter = 'nearest', resolution = 2048, side = 'front', view = 'result',
        lightControls = true, resolutionControl = true, viewControl = true, hardwareBias = false,
    } = options;

    if ( ! VIEW_OPTIONS.some( ( option ) => option.value === view ) ) {

        throw new Error( `Unknown view "${ view }". Expected one of: ${ VIEW_OPTIONS.map( ( option ) => option.value ).join( ', ' ) }.` );

    }

    const { fn: visibility, schema } = await loadWgslFunction( codeUrl );
    const { values, uniforms } = viewport.setParams( {
        ...( lightControls ? LIGHT_PARAMS : {} ),
        ...( resolutionControl ? { mapResolution: resolutionParam( resolution ) } : {} ),
        ...( hardwareBias ? HARDWARE_BIAS_PARAMS : {} ),
        ...( viewControl ? { viewMode: { label: 'View', value: view, options: VIEW_OPTIONS } } : {} ),
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

        lightDirectionFromParams( values, direction );

        if ( resolutionControl ) pass.setResolution( 2 ** values.mapResolution );

        // The depth pass renders everything visible: it must see the scene, and not the debug squares.
        group.visible = true;
        texelView.mesh.visible = false;

        pass.fit( { direction, center, radius } );
        // #region hardware-bias
        if ( hardwareBias ) {

            pass.setPolygonOffset( {
                factor: values.slopeScale,
                // The constant bias is scaled by the depth change across one texel, as a fraction of the frustum depth
                // range.
                // We also scale by the step size to keep bias similar between formats
                units: values.depthBias
                    * pass.worldTexelSize.value
                    / pass.worldFrustumDepth.value
                    / pass.depthStep,
            } );

        }
        // #endregion
        pass.render( vp.renderer, vp.scene );

        // View modes: the shaded result, the texel squares alone, or the squares drawn over the geometry.
        const mode = viewControl ? values.viewMode : view;
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
