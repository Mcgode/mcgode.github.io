import { wgslFn } from 'three/tsl';
import { loadSource, parseParamPragmas } from '../core/source.js';

/**
 * Splits WGSL source into its top-level `fn` declarations (comments and nesting are respected).
 * Text before the first `fn` is dropped.
 *
 * Limitation: three.js' `wgslFn` wraps single functions, so module-scope `const` / `struct` declarations are
 * not supported. Declare constants inside the function that uses them.
 */
export function splitWgslFunctions( source ) {

    const starts = [];
    let depth = 0;

    for ( let i = 0; i < source.length; i ++ ) {

        const c = source[ i ];

        if ( c === '/' && source[ i + 1 ] === '/' ) { i = source.indexOf( '\n', i ); if ( i < 0 ) break; continue; }
        if ( c === '/' && source[ i + 1 ] === '*' ) { i = source.indexOf( '*/', i ); if ( i < 0 ) break; i ++; continue; }

        if ( c === '{' ) depth ++;
        else if ( c === '}' ) depth --;
        else if ( depth === 0 && c === 'f' && source.startsWith( 'fn', i ) && /\s/.test( source[ i + 2 ] ?? '' ) && ! /\w/.test( source[ i - 1 ] ?? ' ' ) )
            starts.push( i );

    }

    return starts.map( ( start, k ) => source.slice( start, starts[ k + 1 ] ?? source.length ).trim() );

}

/**
 * Turns WGSL source into a callable TSL function node. The *last* function in the file is the entry point;
 * the functions above it are helpers that it (and later helpers) can call.
 *
 * @param {string} source
 */
export function wgslFromSource( source ) {

    const functions = splitWgslFunctions( source );
    if ( functions.length === 0 ) throw new Error( 'No WGSL function found in source.' );

    const includes = [];
    let entry = null;

    for ( const code of functions ) {

        entry = wgslFn( code, [ ...includes ] );
        includes.push( entry );

    }

    return entry;

}

/**
 * Loads a `.wgsl` file (the same one the article displays) and returns
 * `{ fn, schema }`: the callable function node and the `@param` controls declared in its header.
 */
export async function loadWgslFunction( url ) {

    const { source, schema } = await loadSource( url );
    return { fn: wgslFromSource( source ), schema };

}

/**
 * Same as `loadWgslFunction`, for source text that is already at hand, e.g. a `.wgsl` file imported into the bundle
 * (the build loads `.wgsl` imports as text). Saves a request, and needs no URL.
 */
export function wgslFunctionFromText( text ) {

    const { source, schema } = parseParamPragmas( text );
    return { fn: wgslFromSource( source ), schema };

}
