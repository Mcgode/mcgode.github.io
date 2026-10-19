import {
    OrthographicCamera, RenderTarget, DepthTexture, Matrix4, Vector3, MeshBasicNodeMaterial,
    LessEqualCompare, NearestFilter, LinearFilter, FrontSide,
} from 'three/webgpu';
import { uniform } from 'three/tsl';

const _dir = new Vector3();

/**
 * Renders a scene's depth from a directional light into a depth texture, and exposes what a receiver
 * material needs to look it up: the world -> light clip matrix, the texel size, and the light direction.
 *
 * Deliberately knows nothing about *how* the map is filtered; that is the job of the WGSL functions.
 */
export class DirectionalShadowPass {

    /**
     * @param {object} [options]
     * @param {number} [options.resolution=2048]
     * @param {'nearest'|'linear'} [options.filter='nearest'] 'linear' enables the hardware 2x2 PCF of comparison samplers.
     * @param {number} [options.side=FrontSide] Which faces are rasterised into the map.
     * @param {{ factor: number, units: number }|null} [options.polygonOffset] Hardware slope-scaled depth bias.
     */
    constructor( { resolution = 2048, filter = 'nearest', side = FrontSide, polygonOffset = null } = {} ) {

        this.resolution = resolution;

        this.depthTexture = new DepthTexture( resolution, resolution );
        this.depthTexture.compareFunction = LessEqualCompare;
        this.depthTexture.minFilter = this.depthTexture.magFilter = filter === 'linear' ? LinearFilter : NearestFilter;

        this.target = new RenderTarget( resolution, resolution, { depthBuffer: true, depthTexture: this.depthTexture } );

        this.camera = new OrthographicCamera( - 1, 1, 1, - 1, 0.1, 100 );

        this.depthMaterial = new MeshBasicNodeMaterial();
        this.depthMaterial.colorWrite = false;
        this.depthMaterial.side = side;
        if ( polygonOffset !== null ) {

            this.depthMaterial.polygonOffset = true;
            this.depthMaterial.polygonOffsetFactor = polygonOffset.factor;
            this.depthMaterial.polygonOffsetUnits = polygonOffset.units;

        }

        // Uniforms read by receiver materials.
        /** World space -> light clip space. */
        this.matrix = uniform( new Matrix4() );
        /** Size of one shadow map texel, in uv units. */
        this.texelSize = uniform( 1 / resolution );
        /** Unit vector pointing from the surface towards the light. */
        this.lightDirection = uniform( new Vector3( 0, 1, 0 ) );

    }

    /**
     * Fits the light's orthographic frustum around a sphere.
     * @param {object} fit
     * @param {Vector3} fit.direction Unit vector pointing from the scene towards the light.
     * @param {Vector3} fit.center Center of the region to cover.
     * @param {number} fit.radius Radius of the region to cover.
     */
    fit( { direction, center, radius } ) {

        _dir.copy( direction ).normalize();
        this.lightDirection.value.copy( _dir );

        const cam = this.camera;
        cam.left = - radius; cam.right = radius;
        cam.top = radius; cam.bottom = - radius;
        cam.near = 0.1;
        cam.far = radius * 2 + 0.2;

        cam.position.copy( center ).addScaledVector( _dir, radius + 0.1 );
        // Avoid a degenerate lookAt when the light is straight overhead.
        cam.up.set( 0, Math.abs( _dir.y ) > 0.999 ? 0 : 1, Math.abs( _dir.y ) > 0.999 ? 1 : 0 );
        cam.lookAt( center );
        cam.updateMatrixWorld();

    }

    /** Renders the depth pass and refreshes the matrix uniform. */
    render( renderer, scene ) {

        const cam = this.camera;
        cam.coordinateSystem = renderer.coordinateSystem; // WebGPU depth range is 0..1
        cam.updateProjectionMatrix();

        const previousTarget = renderer.getRenderTarget();
        const previousOverride = scene.overrideMaterial;

        scene.overrideMaterial = this.depthMaterial;
        renderer.setRenderTarget( this.target );
        renderer.render( scene, cam );
        renderer.setRenderTarget( previousTarget );
        scene.overrideMaterial = previousOverride;

        this.matrix.value.multiplyMatrices( cam.projectionMatrix, cam.matrixWorldInverse );

    }

    dispose() {

        this.target.dispose();
        this.depthTexture.dispose();
        this.depthMaterial.dispose();

    }

}
