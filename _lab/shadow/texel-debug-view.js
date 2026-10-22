import { Mesh, PlaneGeometry, MeshBasicNodeMaterial, DoubleSide } from 'three/webgpu';
import { int, ivec2, vec3, vec4, float, instanceIndex, positionLocal, textureLoad, select, mix } from 'three/tsl';

/**
 * Debug view of a `DirectionalShadowPass`: every shadow map texel is drawn as a solid square, placed in the
 * world where the texel's stored depth says the occluder surface is. The squares face the light and tile
 * exactly, so what you see is the scene as the light sees it, at the shadow map's resolution.
 *
 * One instance per texel, with no per-instance data: the vertex shader derives the texel from `instanceIndex`
 * and fetches its depth straight from the shadow map. Texels that hold no geometry are collapsed.
 *
 * Draw cost grows with the square of the resolution, hence `MAX_RESOLUTION`.
 */
export class TexelDebugView {

    /** Above this size the view would draw too many squares to stay interactive. */
    static MAX_RESOLUTION = 1024;

    /**
     * @param {import('./directional-shadow-pass.js').DirectionalShadowPass} pass
     */
    constructor( pass ) {

        this.pass = pass;

        const size = pass.resolutionNode;
        const index = int( instanceIndex );
        const x = index.mod( size );
        const y = index.div( size );

        const depth = textureLoad( pass.depthTexture, ivec2( x, y ) ).x;

        // Texel center in light NDC. Texture v points down, NDC y points up.
        const u = float( x ).add( 0.5 ).div( float( size ) );
        const v = float( y ).add( 0.5 ).div( float( size ) );
        const ndc = vec3( u.mul( 2 ).sub( 1 ), float( 1 ).sub( v.mul( 2 ) ), depth );

        const center = pass.inverseMatrix.mul( vec4( ndc, 1 ) ).xyz;

        // Texels nothing was rendered into still hold the cleared depth (1): collapse their square.
        const squareSize = select( depth.lessThan( 0.99999 ), pass.worldTexelSize, 0 );
        const corner = pass.lightRight.mul( positionLocal.x.mul( squareSize ) )
            .add( pass.lightUp.mul( positionLocal.y.mul( squareSize ) ) );

        // Neighbouring texels alternate in tone, so that the grid reads; nearer to the light is brighter.
        const checker = float( x.add( y ).mod( 2 ) );
        const tone = mix( vec3( 0.16, 0.42, 0.82 ), vec3( 0.42, 0.68, 0.98 ), checker );
        const color = tone.mul( mix( 1, 0.55, depth ) );

        const material = new MeshBasicNodeMaterial();
        material.side = DoubleSide;
        material.positionNode = center.add( corner );
        material.colorNode = vec4( color.toVarying(), 1 );

        this.mesh = new Mesh( new PlaneGeometry( 1, 1 ), material );
        this.mesh.name = 'shadow-texels';
        this.mesh.frustumCulled = false; // The geometry is a unit quad; the vertex shader moves it.
        this.mesh.visible = false;

    }

    /** Whether the pass is small enough to be drawn this way. */
    get supported() {

        return this.pass.resolution <= TexelDebugView.MAX_RESOLUTION;

    }

    /** Draws one instance per texel of the pass's current resolution. */
    update() {

        this.mesh.count = this.pass.resolution * this.pass.resolution;

    }

    dispose() {

        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

    }

}
