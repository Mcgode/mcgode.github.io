// Entry point, loaded on pages with `lab: true`.
// Every `.lab-viewport` element gets its code listing right away and its 3D demo when it nears the screen.
//
// A demo is a module in demos/ whose default export is `( viewport, context ) => void | Promise<void>`, with
//   context = { codeUrl, options, element }
//
// This file is the only eagerly loaded code (a few KB). three.js, the viewport and the demos are separate
// chunks, fetched only once a viewport is about to be seen on a browser that supports WebGPU.

import { mountCodeView } from './core/code-view.js';

const NOT_AVAILABLE = 'This demo needs WebGPU, which your browser does not provide (yet). ' +
    'Recent versions of Chrome, Edge, Safari and Firefox support it.';

async function mountDemo( el ) {

    const status = ( text ) => {

        const node = el.querySelector( '.lab-status' );
        if ( node ) { node.textContent = text; node.hidden = ! text; }

    };

    if ( ! navigator.gpu ) return status( NOT_AVAILABLE );

    try {

        const name = el.dataset.demo;
        if ( ! /^[\w-]+$/.test( name ) ) throw new Error( `Invalid demo name "${ name }"` );

        status( 'Loading…' );

        // The bundler turns this template into one lazy chunk per file in demos/.
        const [ { default: demo }, { Viewport } ] = await Promise.all( [
            import( `./demos/${ name }.js` ),
            import( './core/viewport.js' ),
        ] );

        const viewport = await Viewport.create( el );

        await demo( viewport, {
            codeUrl: el.dataset.code,
            options: el.dataset.options ? JSON.parse( el.dataset.options ) : {},
            element: el,
        } );

        viewport.setStatus( '' );
        viewport.invalidate();

    } catch ( e ) {

        console.error( e );
        status( `Could not start this demo: ${ e.message }` );

    }

}

const elements = [ ...document.querySelectorAll( '.lab-viewport' ) ];

for ( const el of elements ) {

    const codeContainer = el.querySelector( '.lab-code' );

    if ( el.dataset.code && codeContainer ) {

        mountCodeView( codeContainer, {
            url: el.dataset.code,
            prevUrl: el.dataset.prev,
            title: el.dataset.title,
        } ).catch( ( e ) => console.error( e ) );

    }

}

const lazy = new IntersectionObserver( ( entries ) => {

    for ( const entry of entries ) {

        if ( ! entry.isIntersecting ) continue;
        lazy.unobserve( entry.target );
        mountDemo( entry.target );

    }

}, { rootMargin: '300px' } );

elements.forEach( ( el ) => lazy.observe( el ) );
