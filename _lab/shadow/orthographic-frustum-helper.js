import { LineSegments, BufferGeometry, Float32BufferAttribute, LineBasicNodeMaterial, Vector3 } from 'three/webgpu';

const NEAR_COLOR = [ 0.0, 0.45, 0.1 ];
const FAR_COLOR = [ 0.75, 0.05, 0.05 ];
const SIDE_COLOR = [ 0.8, 0.4, 0.0 ];

const _corner = new Vector3();

/**
 * Wireframe box of an orthographic camera's frustum: the near rectangle in green, the far one in red, and the
 * four edges joining them in orange. Call `update( camera )` after the camera's frustum or placement changed.
 *
 * Lines are one pixel wide in WebGPU, whatever the material says.
 */
export class OrthographicFrustumHelper extends LineSegments {

    constructor() {

        const geometry = new BufferGeometry();
        geometry.setAttribute( 'position', new Float32BufferAttribute( new Float32Array( 24 * 3 ), 3 ) );

        // 12 edges, 2 vertices each. Colors never change: the near loop, then the far loop, then the sides.
        const colors = [];
        for ( let i = 0; i < 8; i ++ ) colors.push( ...NEAR_COLOR );
        for ( let i = 0; i < 8; i ++ ) colors.push( ...FAR_COLOR );
        for ( let i = 0; i < 8; i ++ ) colors.push( ...SIDE_COLOR );
        geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

        const material = new LineBasicNodeMaterial();
        material.vertexColors = true;

        super( geometry, material );

        this.name = 'orthographic-frustum';
        this.frustumCulled = false; // The geometry is rewritten in world space on every update.

    }

    /** @param {import('three/webgpu').OrthographicCamera} camera */
    update( camera ) {

        camera.updateMatrixWorld();

        // The camera looks down its own -Z axis.
        const { left, right, bottom, top, near, far } = camera;
        const corner = ( x, y, depth ) => _corner.set( x, y, - depth ).applyMatrix4( camera.matrixWorld ).toArray();

        const nearCorners = [ corner( left, bottom, near ), corner( right, bottom, near ), corner( right, top, near ), corner( left, top, near ) ];
        const farCorners = [ corner( left, bottom, far ), corner( right, bottom, far ), corner( right, top, far ), corner( left, top, far ) ];

        const vertices = [];
        for ( let i = 0; i < 4; i ++ ) vertices.push( nearCorners[ i ], nearCorners[ ( i + 1 ) % 4 ] );
        for ( let i = 0; i < 4; i ++ ) vertices.push( farCorners[ i ], farCorners[ ( i + 1 ) % 4 ] );
        for ( let i = 0; i < 4; i ++ ) vertices.push( nearCorners[ i ], farCorners[ i ] );

        const position = this.geometry.getAttribute( 'position' );
        position.array.set( vertices.flat() );
        position.needsUpdate = true;

    }

    dispose() {

        this.geometry.dispose();
        this.material.dispose();

    }

}
