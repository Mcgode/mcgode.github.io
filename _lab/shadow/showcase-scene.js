import { Group, Mesh, Vector3, BoxGeometry, SphereGeometry, PlaneGeometry, CylinderGeometry } from 'three/webgpu';

/**
 * The scene used by the shadow demos: a ground plane plus shapes chosen to expose typical artifacts
 * (tall caster, floating sphere, thin plate on a pole, a slanted slab for grazing angles).
 * Everything is procedural, so there is nothing to download.
 *
 * @param {( color: number, name: string ) => import('three/webgpu').Material} materialFor
 * @returns {{ group: Group, center: Vector3, radius: number }}
 */
export function buildShowcaseScene( materialFor ) {

    const group = new Group();

    const add = ( name, geometry, color, position, rotation = [ 0, 0, 0 ] ) => {

        const mesh = new Mesh( geometry, materialFor( color, name ) );
        mesh.name = name;
        mesh.position.set( ...position );
        mesh.rotation.set( ...rotation );
        group.add( mesh );
        return mesh;

    };

    add( 'ground', new PlaneGeometry( 40, 40 ), 0xd8d4cc, [ 0, 0, 0 ], [ - Math.PI / 2, 0, 0 ] );
    add( 'tower', new BoxGeometry( 1.2, 4, 1.2 ), 0xc9694f, [ - 3, 2, - 2 ] );
    add( 'block', new BoxGeometry( 2, 1, 2 ), 0x4f86c9, [ 2.5, 0.5, 1 ] );
    add( 'sphere', new SphereGeometry( 1, 48, 24 ), 0x6bb36b, [ 0, 2.2, - 4 ] );
    add( 'pole', new CylinderGeometry( 0.08, 0.08, 2.5 ), 0x888888, [ 5, 1.25, - 3 ] );
    add( 'plate', new BoxGeometry( 3, 0.06, 3 ), 0xe0b94a, [ 5, 2.55, - 3 ] );
    add( 'slab', new BoxGeometry( 3, 0.3, 3 ), 0xa56bc9, [ - 4.5, 0.6, 3.5 ], [ 0, 0.4, 0.35 ] );

    // `center` / `radius` describe a sphere around everything interesting, for fitting the light frustum.
    return { group, center: new Vector3( 0, 1.5, 0 ), radius: 14 };

}
