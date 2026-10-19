import { Vector2, Vector3, Color, Mesh, PlaneGeometry, MeshBasicNodeMaterial, DoubleSide } from 'three/webgpu';
import { uniform, vec3, vec4, float, int, ivec2, uv, positionGeometry, textureLoad, select, floor, fract } from 'three/tsl';
import { DirectionalShadowPass } from '../shadow/directional-shadow-pass.js';
import { wgslFunctionFromText } from '../shadow/wgsl-loader.js';
import { createShadowedMaterial } from '../shadow/shadowed-material.js';
import { createLitMaterial } from '../shadow/lit-material.js';
import { buildShowcaseScene, SHOWCASE_RADIUS } from '../shadow/showcase-scene.js';
import { OrthographicFrustumHelper } from '../shadow/orthographic-frustum-helper.js';
import { DirectionalLightGizmo } from '../shadow/directional-light-gizmo.js';
import { LIGHT_PARAMS, lightDirectionFromParams } from '../shadow/light-controls.js';
import { resolutionParam } from '../shadow/resolution-control.js';
import hardShadowSource from '../shadow/wgsl/00-hard.wgsl';

const MIN_EXTENT = 0.5; // Smallest allowed frustum width, height and depth, in world units.

// The defaults reproduce the fit used by the other demos: a box around the scene's bounding sphere.
const frustumParam = ( label, value, min, max ) => ( { label, min, max, value, step: 0.5 } );
const FRUSTUM_PARAMS = {
    left: frustumParam( 'Left', - SHOWCASE_RADIUS, - 30, 30 ),
    right: frustumParam( 'Right', SHOWCASE_RADIUS, - 30, 30 ),
    bottom: frustumParam( 'Bottom', - SHOWCASE_RADIUS, - 30, 30 ),
    top: frustumParam( 'Top', SHOWCASE_RADIUS, - 30, 30 ),
    near: { label: 'Near', min: 0.1, max: 40, value: 0.1, step: 0.1 },
    far: { label: 'Far', min: 1, max: 60, value: SHOWCASE_RADIUS * 2 + 0.2, step: 0.1 },
};

const viewParam = ( value ) => ( {
    label: 'View',
    value,
    options: [
        { value: 'final', label: 'Final scene' },
        { value: 'map', label: 'Shadow map' },
    ],
} );

// Texels nothing was rendered into: still the cleared depth (1). Distinct from the page background around the image.
const EMPTY_TEXEL_COLOR = 0xcfd6df;

/**
 * The shadow map as an image: a square quad, drawn in clip space so that it does not depend on the camera.
 * Each pixel shows the raw depth stored in the texel under it, black at the near plane and white at the far plane.
 * Faint contour lines every world unit of depth make the steps between surfaces easier to read.
 */
function createShadowMapQuad( pass ) {

    const scale = uniform( new Vector2( 1, 1 ) );
    /** Far - near, in world units: converts the stored depth back to a distance from the near plane. */
    const depthRange = uniform( 1 );

    const size = float( pass.resolutionNode );
    const coord = uv();
    // Texture v points down, quad uv points up.
    const x = floor( coord.x.mul( size ) ).min( size.sub( 1 ) );
    const y = floor( float( 1 ).sub( coord.y ).mul( size ) ).min( size.sub( 1 ) );

    const depth = textureLoad( pass.depthTexture, ivec2( int( x ), int( y ) ) ).x;
    const contour = select( fract( depth.mul( depthRange ) ).lessThan( 0.07 ), float( 0.8 ), float( 1 ) );
    const color = select( depth.lessThan( 0.99999 ), vec3( depth ).mul( contour ), vec3( uniform( new Color( EMPTY_TEXEL_COLOR ) ) ) );

    const material = new MeshBasicNodeMaterial();
    material.vertexNode = vec4( positionGeometry.xy.mul( 2 ).mul( scale ), 0, 1 );
    material.colorNode = vec4( color, 1 );
    material.side = DoubleSide;
    material.depthTest = false;
    material.depthWrite = false;

    const mesh = new Mesh( new PlaneGeometry( 1, 1 ), material );
    mesh.name = 'shadow-map';
    mesh.frustumCulled = false; // Positioned in clip space by the vertex shader.
    mesh.visible = false;

    /** Keeps the image square (it fills the viewport's shorter side), and sets the contour spacing. */
    const update = ( aspect, camera ) => {

        scale.value.set( Math.min( 1, 1 / aspect ), Math.min( 1, aspect ) );
        depthRange.value = camera.far - camera.near;

    };

    return { mesh, update };

}

/**
 * Explains the light camera: its orthographic frustum can be edited, and the demo switches between the lit scene
 * (with the frustum drawn as a wireframe box, and a gizmo for the light) and the shadow map the light camera renders.
 *
 * Options (JSON in the include):
 *   view        'final' | 'map'  initial view                                          (default 'final')
 *   resolution  number           initial shadow map size, power of 2                   (default 1024)
 *   shadows     boolean          shade the final scene with the shadow map. Off for now: the scene is lit without
 *                                shadows, and the shadow map is only used for the "Shadow map" view  (default false)
 */
export default function lightCamera( viewport, { options } ) {

    const { view = 'final', resolution = 1024, shadows = false } = options;

    const shadowLookup = shadows ? wgslFunctionFromText( hardShadowSource ) : null;
    const { values, uniforms } = viewport.setParams( {
        viewMode: viewParam( view ),
        ...LIGHT_PARAMS,
        ...FRUSTUM_PARAMS,
        mapResolution: resolutionParam( resolution ),
        ...( shadowLookup?.schema ?? {} ),
    } );

    const pass = new DirectionalShadowPass( { resolution: 2 ** values.mapResolution } );

    const { group, center } = buildShowcaseScene( ( color ) => shadows
        ? createShadowedMaterial( { pass, visibility: shadowLookup.fn, inputs: uniforms, color } )
        : createLitMaterial( { lightDirection: pass.lightDirection, color } ) );
    viewport.scene.add( group );

    const frustumHelper = new OrthographicFrustumHelper();
    viewport.scene.add( frustumHelper );

    const lightGizmo = new DirectionalLightGizmo( { length: 8, radius: 0.8, spread: 2.5 } );
    viewport.scene.add( lightGizmo );

    const mapQuad = createShadowMapQuad( pass );
    viewport.scene.add( mapQuad.mesh );

    // The whole frustum is large: start further back than the other demos so that it fits in view. Looking from the
    // side of the default light direction, so that the light gizmo's arrow is not foreshortened.
    viewport.camera.position.set( 36, 20, - 17 );
    viewport.controls.update();

    const direction = new Vector3();
    const travel = new Vector3();
    viewport.beforeRender( ( vp ) => {

        lightDirectionFromParams( values, direction );
        pass.setResolution( 2 ** values.mapResolution );

        // Keep the frustum valid however the sliders are set.
        const left = values.left, bottom = values.bottom, near = values.near;
        pass.setFrustum( {
            direction, center,
            distance: SHOWCASE_RADIUS + 0.1,
            left, right: Math.max( values.right, left + MIN_EXTENT ),
            bottom, top: Math.max( values.top, bottom + MIN_EXTENT ),
            near, far: Math.max( values.far, near + MIN_EXTENT ),
        } );

        const showMap = values.viewMode === 'map';

        // Rendering the shadow map is only worth it to display it, or to shade the final scene with it.
        if ( showMap || shadows ) {

            // The depth pass renders everything visible: it must only see the scene.
            group.visible = true;
            frustumHelper.visible = false;
            lightGizmo.visible = false;
            mapQuad.mesh.visible = false;

            pass.render( vp.renderer, vp.scene );

        }

        group.visible = ! showMap;
        frustumHelper.visible = ! showMap;
        lightGizmo.visible = ! showMap;
        mapQuad.mesh.visible = showMap;

        if ( showMap ) {

            mapQuad.update( vp.camera.aspect, pass.camera );

        } else {

            frustumHelper.update( pass.camera );
            // The gizmo sits on the light camera, and points the way the light travels.
            lightGizmo.update( pass.camera.position, travel.copy( direction ).negate() );

        }

    } );

}
