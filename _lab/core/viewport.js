import { WebGPURenderer, Scene, PerspectiveCamera, Color } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getSharedDevice } from './gpu.js';
import { buildParamsPanel } from './params.js';

/**
 * An interactive 3D viewport bound to a `.lab-viewport` element (see _includes/lab-viewport.liquid).
 *
 * Rendering is on demand: a frame is drawn only after `invalidate()` (camera moves, parameter changes,
 * resizes), and never while the viewport is off-screen. A page full of viewports therefore costs nothing
 * at rest. Demos that animate call `setContinuous( true )`.
 */
export class Viewport {

    /** @param {HTMLElement} root The `.lab-viewport` element. */
    static async create( root ) {

        const canvas = root.querySelector( 'canvas' );
        const device = await getSharedDevice();

        const renderer = new WebGPURenderer( { canvas, device, antialias: true } );
        await renderer.init();

        return new Viewport( root, canvas, renderer );

    }

    #hooks = [];
    #dirty = true;
    #visible = false;
    #continuous = false;
    #raf = 0;
    #observers = [];

    constructor( root, canvas, renderer ) {

        this.root = root;
        this.canvas = canvas;
        this.renderer = renderer;
        this.stage = root.querySelector( '.lab-stage' );

        this.scene = new Scene();
        this.scene.background = new Color( 0xe9edf2 );

        this.camera = new PerspectiveCamera( 45, 1, 0.1, 300 );
        this.camera.position.set( 9, 7, 11 );

        this.controls = new OrbitControls( this.camera, canvas );
        this.controls.target.set( 0, 1, 0 );
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
        this.controls.update();
        this.controls.addEventListener( 'change', () => this.invalidate() );

        // Wheel zoom would hijack page scrolling, so it only works once the viewport has been clicked.
        this.controls.enableZoom = false;
        canvas.tabIndex = 0;
        canvas.addEventListener( 'pointerdown', () => { this.controls.enableZoom = true; } );
        canvas.addEventListener( 'blur', () => { this.controls.enableZoom = false; } );

        const resize = new ResizeObserver( () => this.#resize() );
        resize.observe( this.stage );

        const visibility = new IntersectionObserver( ( entries ) => {

            this.#visible = entries[ entries.length - 1 ].isIntersecting;
            if ( this.#visible ) this.invalidate();

        } );
        visibility.observe( this.stage );

        this.#observers.push( resize, visibility );
        this.#resize();

    }

    /**
     * Registers a callback run right before each frame, e.g. to render a shadow map.
     * @param {( viewport: Viewport ) => void} fn
     */
    beforeRender( fn ) {

        this.#hooks.push( fn );

    }

    /** Builds the control panel; see `buildParamsPanel`. */
    setParams( schema ) {

        return buildParamsPanel( this.root.querySelector( '.lab-params' ), schema, () => this.invalidate() );

    }

    setStatus( text ) {

        const el = this.root.querySelector( '.lab-status' );
        if ( ! el ) return;
        el.textContent = text ?? '';
        el.hidden = ! text;

    }

    setContinuous( value ) {

        this.#continuous = value;
        if ( value ) this.invalidate();

    }

    /** Requests a redraw on the next animation frame (if the viewport is visible). */
    invalidate() {

        this.#dirty = true;
        if ( this.#visible && this.#raf === 0 ) this.#raf = requestAnimationFrame( this.#frame );

    }

    #frame = () => {

        this.#raf = 0;
        if ( ! this.#visible || ! this.#dirty ) return;
        this.#dirty = false;

        try {

            for ( const hook of this.#hooks ) hook( this );
            this.renderer.render( this.scene, this.camera );

        } catch ( e ) {

            console.error( e );
            this.setStatus( `Rendering failed: ${ e.message }` );
            return;

        }

        if ( this.#continuous ) this.invalidate();

    };

    #resize() {

        const { clientWidth: w, clientHeight: h } = this.stage;
        if ( w === 0 || h === 0 ) return;

        this.renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
        this.renderer.setSize( w, h, false );
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.invalidate();

    }

    dispose() {

        cancelAnimationFrame( this.#raf );
        this.#observers.forEach( ( o ) => o.disconnect() );
        this.controls.dispose();
        this.renderer.dispose();

    }

}
