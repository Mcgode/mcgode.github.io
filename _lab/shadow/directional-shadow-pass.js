import {
    OrthographicCamera, RenderTarget, DepthTexture, Matrix4, Vector3, MeshBasicNodeMaterial,
    LessEqualCompare, NearestFilter, LinearFilter, FrontSide, UnsignedShortType,
} from 'three/webgpu';
import { uniform } from 'three/tsl';

const _dir = new Vector3();
const _forward = new Vector3();

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

        // #region shadow-map-target
        this.depthTexture = new DepthTexture( resolution, resolution );
        this.depthTexture.compareFunction = LessEqualCompare;
        this.depthTexture.minFilter = this.depthTexture.magFilter = filter === 'linear' ? LinearFilter : NearestFilter;
        this.depthTexture.type = UnsignedShortType;
        /** Smallest step of the depth format (`depth16unorm`): what one unit of hardware constant bias is worth. */
        this.depthStep = 1 / 65535;

        this.target = new RenderTarget( resolution, resolution, { depthBuffer: true, depthTexture: this.depthTexture } );
        // #endregion

        this.camera = new OrthographicCamera( - 1, 1, 1, - 1, 0.1, 100 );

        this.depthMaterial = new MeshBasicNodeMaterial();
        this.depthMaterial.colorWrite = false;
        this.depthMaterial.side = side;
        if ( polygonOffset !== null ) this.setPolygonOffset( polygonOffset );

        // Uniforms read by receiver materials.
        /** World space -> light clip space. */
        this.matrix = uniform( new Matrix4() );
        /** Size of one shadow map texel, in uv units. */
        this.texelSize = uniform( 1 / resolution );
        /** Unit vector pointing from the surface towards the light. */
        this.lightDirection = uniform( new Vector3( 0, 1, 0 ) );

        // Uniforms for debug views, which rebuild world space positions from the stored depths.
        /** Shadow map size, in texels. */
        this.resolutionNode = uniform( resolution, 'int' );
        /** Light clip space -> world space. */
        this.inverseMatrix = uniform( new Matrix4() );
        /** The light camera's right and up axes, in world space. A texel is a square spanned by these. */
        this.lightRight = uniform( new Vector3( 1, 0, 0 ) );
        this.lightUp = uniform( new Vector3( 0, 1, 0 ) );
        /** Side length of one texel, in world units. */
        this.worldTexelSize = uniform( 1 );
        /** Far plane minus near plane, in world units. */
        this.worldFrustumDepth = uniform( 1 );
        /** Frustum width/height in world units **/
        this.worldFrustumSize = uniform( 1 );
        this.#updateWorldSizes();

    }

    /**
     * Resizes the shadow map in place. The depth texture object stays the same, so materials that already
     * sample it keep working.
     * @param {number} resolution
     */
    setResolution( resolution ) {

        if ( resolution === this.resolution ) return;

        this.resolution = resolution;
        this.target.setSize( resolution, resolution );
        this.texelSize.value = 1 / resolution;
        this.resolutionNode.value = resolution;
        this.#updateWorldSizes();

    }

    /** Texel size and depth range in world units: they follow the frustum and the resolution, not the render. */
    #updateWorldSizes() {

        const cam = this.camera;
        this.worldFrustumSize.value = cam.right - cam.left;
        this.worldTexelSize.value = this.worldFrustumSize.value / this.resolution;
        this.worldFrustumDepth.value = cam.far - cam.near;

    }

    /**
     * Sets the hardware depth bias applied while rendering the map: the rasterizer offsets each triangle's depth by
     * `factor * maxDepthSlope + units * r`, where `r` is the smallest depth step the depth format can resolve.
     * Can be called every frame; the pipeline is only rebuilt when a value changes.
     *
     * @param {{ factor: number, units: number }} offset `factor` is WebGPU's `depthBiasSlopeScale`, and `units` its
     * `depthBias` (an integer). Both 0 turns the bias off.
     */
    setPolygonOffset( { factor, units } ) {

        const material = this.depthMaterial;
        const roundedUnits = Math.round( units );
        const enabled = factor !== 0 || roundedUnits !== 0;

        if ( material.polygonOffset === enabled && material.polygonOffsetFactor === factor && material.polygonOffsetUnits === roundedUnits ) return;

        material.polygonOffset = enabled;
        material.polygonOffsetFactor = factor;
        material.polygonOffsetUnits = roundedUnits;

    }

    /**
     * Places the light camera and sets its orthographic frustum explicitly. The camera sits `distance` away from
     * `center`, towards the light, and looks at `center`. Bounds are in the camera's own space, in world units:
     * `near` and `far` are distances from the camera along its view direction.
     *
     * @param {object} frustum
     * @param {Vector3} frustum.direction Unit vector pointing from the scene towards the light.
     * @param {Vector3} frustum.center Point the light camera looks at.
     * @param {number} frustum.distance Distance from `center` to the light camera.
     * @param {number} frustum.left
     * @param {number} frustum.right
     * @param {number} frustum.bottom
     * @param {number} frustum.top
     * @param {number} frustum.near
     * @param {number} frustum.far
     */
    setFrustum( { direction, center, distance, left, right, bottom, top, near, far } ) {

        _dir.copy( direction ).normalize();
        this.lightDirection.value.copy( _dir );

        // #region frustum-fit
        const cam = this.camera;
        cam.left = left; cam.right = right;
        cam.top = top; cam.bottom = bottom;
        cam.near = near;
        cam.far = far;

        cam.position.copy( center ).addScaledVector( _dir, distance );
        // Avoid a degenerate lookAt when the light is straight overhead.
        cam.up.set( 0, Math.abs( _dir.y ) > 0.999 ? 0 : 1, Math.abs( _dir.y ) > 0.999 ? 1 : 0 );
        cam.lookAt( center );
        cam.updateMatrixWorld();
        // #endregion

        this.#updateWorldSizes();

    }

    // #region fit-frustum
    /**
     * Fits the light's orthographic frustum around a sphere.
     * @param {object} fit
     * @param {Vector3} fit.direction Unit vector pointing from the scene towards the light.
     * @param {Vector3} fit.center Center of the region to cover.
     * @param {number} fit.radius Radius of the region to cover.
     */
    fit( { direction, center, radius } ) {

        this.setFrustum( {
            direction, center,
            distance: radius + 0.1,
            left: - radius, right: radius, bottom: - radius, top: radius,
            near: 0.1, far: radius * 2 + 0.2,
        } );

    }
    // #endregion

    /** Renders the depth pass and refreshes the matrix uniform. */
    render( renderer, scene ) {

        const cam = this.camera;
        cam.coordinateSystem = renderer.coordinateSystem; // WebGPU depth range is 0..1
        cam.updateProjectionMatrix();

        // #region depth-pass
        const previousTarget = renderer.getRenderTarget();
        const previousOverride = scene.overrideMaterial;

        scene.overrideMaterial = this.depthMaterial;
        renderer.setRenderTarget( this.target );
        renderer.render( scene, cam );
        renderer.setRenderTarget( previousTarget );
        scene.overrideMaterial = previousOverride;
        // #endregion

        this.matrix.value.multiplyMatrices( cam.projectionMatrix, cam.matrixWorldInverse );

        this.inverseMatrix.value.copy( this.matrix.value ).invert();
        cam.matrixWorld.extractBasis( this.lightRight.value, this.lightUp.value, _forward );

    }

    dispose() {

        this.target.dispose();
        this.depthTexture.dispose();
        this.depthMaterial.dispose();

    }

}
