import {
    Group, Mesh, LineSegments, BufferGeometry, Float32BufferAttribute, Vector3,
    SphereGeometry, CylinderGeometry, ConeGeometry, MeshBasicNodeMaterial, LineBasicNodeMaterial,
} from 'three/webgpu';

const UP = new Vector3( 0, 1, 0 );

/**
 * Gizmo for a directional light: a sun marker where the light is, a thick arrow showing the direction its light
 * travels in, and four thin parallel rays around it, to stress that the rays of a directional light are parallel.
 *
 * Built along +Y; `update()` positions and orients it.
 */
export class DirectionalLightGizmo extends Group {

    /**
     * @param {object} [options]
     * @param {number|string} [options.color=0xf5b301]
     * @param {number} [options.length=6] Length of the arrow and rays, from the sun's center.
     * @param {number} [options.radius=0.6] Radius of the sun marker.
     * @param {number} [options.spread=1.8] Distance of the parallel rays from the arrow.
     */
    constructor( { color = 0xf5b301, length = 6, radius = 0.6, spread = 1.8 } = {} ) {

        super();
        this.name = 'directional-light-gizmo';

        const material = new MeshBasicNodeMaterial( { color } );

        const sun = new Mesh( new SphereGeometry( radius, 24, 12 ), material );

        const headLength = 1.2;
        const shaftLength = length - headLength - radius;

        const shaft = new Mesh( new CylinderGeometry( 0.07, 0.07, shaftLength ), material );
        shaft.position.y = radius + shaftLength / 2;

        const head = new Mesh( new ConeGeometry( 0.28, headLength ), material );
        head.position.y = length - headLength / 2;

        // Thin rays parallel to the arrow.
        const vertices = [];
        for ( const [ x, z ] of [ [ 1, 1 ], [ - 1, 1 ], [ - 1, - 1 ], [ 1, - 1 ] ] ) {

            vertices.push( x * spread, 0, z * spread, x * spread, length - headLength, z * spread );

        }

        const rayGeometry = new BufferGeometry();
        rayGeometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        const rays = new LineSegments( rayGeometry, new LineBasicNodeMaterial( { color } ) );

        this.add( sun, shaft, head, rays );

    }

    /**
     * @param {Vector3} position Where the light is.
     * @param {Vector3} direction Unit vector pointing the way the light travels, i.e. away from the light.
     */
    update( position, direction ) {

        this.position.copy( position );
        this.quaternion.setFromUnitVectors( UP, direction );

    }

    dispose() {

        this.traverse( ( object ) => {

            object.geometry?.dispose();
            object.material?.dispose();

        } );

    }

}
