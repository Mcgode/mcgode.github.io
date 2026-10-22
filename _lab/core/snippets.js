import { fetchText, parseParamPragmas } from './source.js';

/**
 * A code listing is described by a snippet spec. Where the code comes from:
 *
 *   src        path of a source file, relative to _lab/ (JS and WGSL files are published by the build)
 *   url        absolute URL of a file, as an alternative to `src`
 *   text       inline code, as an alternative to a file
 *   el         CSS selector of an element of the page whose text is the code: an inline "text file". Use
 *              `<script type="text/plain" id="...">`, which the browser neither runs nor shows, and whose content
 *              needs no escaping (except a closing script tag). Its indentation is removed.
 *
 * How it is shown:
 *
 *   title      heading of the listing (default: the file name, plus the region if any)
 *   lang       'js' | 'wgsl' | anything else for plain text (default: from the file extension)
 *   region     show only the lines between `// #region <name>` and `// #endregion` in the file
 *   collapsed  start with the listing closed
 *
 * And to show what changed since an earlier version (the diff is on by default, and can be toggled):
 *
 *   prev       like `src`, for the previous version (the same `region` is extracted from it)
 *   prevUrl    like `url`
 *   prevText   like `text`
 *   prevEl     like `el`
 *
 * @typedef {object} SnippetSpec
 * @property {string} [src]
 * @property {string} [url]
 * @property {string} [text]
 * @property {string} [el]
 * @property {string} [title]
 * @property {string} [lang]
 * @property {string} [region]
 * @property {boolean} [collapsed]
 * @property {string} [prev]
 * @property {string} [prevUrl]
 * @property {string} [prevText]
 * @property {string} [prevEl]
 */

const LANGUAGES = { wgsl: 'wgsl', js: 'js', mjs: 'js' };

const extensionOf = ( path ) => path.split( /[?#]/ )[ 0 ].split( '.' ).pop().toLowerCase();

const REGION_START = /^\s*(?:\/\/|\/\*)\s*#region\s+(\S+)/;
const REGION_END = /^\s*(?:\/\/|\/\*)\s*#endregion\b/;

/** Lines between `#region <name>` and its matching `#endregion`. Throws if the region does not exist. */
export function extractRegion( text, name ) {

    const lines = text.split( '\n' );
    const start = lines.findIndex( ( line ) => REGION_START.exec( line )?.[ 1 ] === name );
    if ( start < 0 ) throw new Error( `Region "${ name }" not found` );

    let depth = 1;
    for ( let i = start + 1; i < lines.length; i ++ ) {

        if ( REGION_START.test( lines[ i ] ) ) depth ++;
        else if ( REGION_END.test( lines[ i ] ) && -- depth === 0 ) return lines.slice( start + 1, i ).join( '\n' );

    }

    throw new Error( `Region "${ name }" is never closed` );

}

/** Removes the region marker lines, which are comments for the tooling and noise for the reader. */
export const stripRegionMarkers = ( text ) =>
    text.split( '\n' ).filter( ( line ) => ! REGION_START.test( line ) && ! REGION_END.test( line ) ).join( '\n' );

/** Removes the indentation shared by all non-blank lines. */
export function dedent( text ) {

    const lines = text.split( '\n' );
    const indents = lines.filter( ( line ) => line.trim() !== '' ).map( ( line ) => line.match( /^\s*/ )[ 0 ].length );
    const shared = indents.length > 0 ? Math.min( ...indents ) : 0;

    return lines.map( ( line ) => line.slice( shared ) ).join( '\n' );

}

/** The text of the element a selector designates. */
function textOfElement( selector ) {

    const element = document.querySelector( selector );
    if ( element === null ) throw new Error( `No element matches "${ selector }"` );
    return element.textContent;

}

/** Reads the snippet specs a page provides as JSON (see `SnippetSpec`). A single object is accepted too. */
export function parseSnippetSpecs( json ) {

    if ( ! json || json.trim() === '' ) return [];

    const parsed = JSON.parse( json );
    return Array.isArray( parsed ) ? parsed : [ parsed ];

}

/**
 * Loads a snippet and prepares it for display.
 *
 * @param {SnippetSpec} spec
 * @param {{ sourceBase: string }} context `sourceBase` is the URL `src` paths are relative to.
 * @returns {Promise<{ title?: string, lang: string, collapsed: boolean, source: string, previous: string|null }>}
 */
export async function loadSnippet( spec, { sourceBase } ) {

    const url = spec.url ?? ( spec.src !== undefined ? new URL( spec.src, sourceBase ).href : undefined );
    const prevUrl = spec.prevUrl ?? ( spec.prev !== undefined ? new URL( spec.prev, sourceBase ).href : undefined );

    if ( spec.text === undefined && spec.el === undefined && url === undefined )
        throw new Error( 'A snippet needs `src`, `url`, `text` or `el`' );

    const lang = spec.lang ?? ( url !== undefined ? LANGUAGES[ extensionOf( url ) ] : undefined ) ?? 'text';

    // `indented`: the text sits inside something else (a region of a file, an element of the page), which indents it.
    const prepare = ( text, indented ) => {

        if ( spec.region !== undefined ) text = extractRegion( text, spec.region );
        text = stripRegionMarkers( text );
        if ( lang === 'wgsl' ) text = parseParamPragmas( text ).source; // Slider declarations are not part of the code
        text = text.replace( /^\n+|\s+$/g, '' );
        return indented ? dedent( text ) : text;

    };

    const [ text, previousText ] = await Promise.all( [
        spec.text ?? ( spec.el !== undefined ? textOfElement( spec.el ) : fetchText( url ) ),
        spec.prevText ?? ( spec.prevEl !== undefined ? textOfElement( spec.prevEl ) : prevUrl !== undefined ? fetchText( prevUrl ) : null ),
    ] );

    const fileName = url?.split( /[?#]/ )[ 0 ].split( '/' ).pop();

    return {
        title: spec.title ?? ( fileName !== undefined ? ( spec.region ? `${ fileName } (${ spec.region })` : fileName ) : undefined ),
        lang,
        collapsed: spec.collapsed === true,
        source: prepare( text, spec.region !== undefined || spec.el !== undefined ),
        previous: previousText === null ? null : prepare( previousText, spec.region !== undefined || spec.prevEl !== undefined ),
    };

}
