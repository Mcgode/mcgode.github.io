// Small syntax highlighters for the code listings: WGSL and JavaScript. Each produces HTML made of
// `<span class="tok-...">` elements (see lab.css), one string per source line.

const escapeHtml = ( s ) => s.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' );

const span = ( kind, text ) => `<span class="tok-${ kind }">${ escapeHtml( text ) }</span>`;

// WGSL

const WGSL_TOKEN = new RegExp( [
    '(?<comment>//.*)',
    '(?<keyword>\\b(?:fn|let|var|const|if|else|for|while|loop|return|break|continue|switch|case|default|struct|override|discard)\\b)',
    '(?<type>\\b(?:f32|f16|i32|u32|bool|vec[234][fiuh]?|mat[234]x[234][fh]?|array|ptr|sampler(?:_comparison)?|texture_\\w+)\\b)',
    '(?<builtin>\\b(?:textureSample\\w*|textureLoad|textureDimensions|select|clamp|mix|dot|cross|normalize|length|min|max|abs|floor|ceil|fract|sqrt|pow|sin|cos|any|all|saturate|smoothstep|step)\\b)',
    '(?<number>\\b\\d+(?:\\.\\d*)?(?:[eE][+-]?\\d+)?[fiu]?\\b)',
].join( '|' ), 'g' );

function highlightWgslLine( line ) {

    let out = '', last = 0;

    for ( const m of line.matchAll( WGSL_TOKEN ) ) {

        out += escapeHtml( line.slice( last, m.index ) );
        const kind = Object.keys( m.groups ).find( ( k ) => m.groups[ k ] !== undefined );
        out += span( kind, m[ 0 ] );
        last = m.index + m[ 0 ].length;

    }

    return out + escapeHtml( line.slice( last ) );

}

// JavaScript

const JS_KEYWORDS = [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete', 'do', 'else',
    'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'if', 'import', 'in', 'instanceof', 'let',
    'new', 'null', 'of', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
    'undefined', 'var', 'void', 'while', 'yield',
];

// Tried in order at each position (sticky). Comments and template literals are handled by the scanner, since they
// can span lines.
const JS_TOKEN = new RegExp( [
    `(?<string>'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")`,
    `(?<keyword>\\b(?:${ JS_KEYWORDS.join( '|' ) })\\b)`,
    '(?<number>\\b0[xX][0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)',
    '(?<type>\\b[A-Z][\\w$]*\\b)',
    '(?<builtin>[A-Za-z_$][\\w$]*(?=\\())', // a call
    '(?<ident>[A-Za-z_$][\\w$]*)', // anything else that looks like a name: consumed whole, left unstyled
].join( '|' ), 'y' );

/**
 * Highlights JavaScript, keeping track of block comments and template literals across lines.
 * Not a parser: regular expression literals and nested template expressions are not understood.
 */
function highlightJsLines( lines ) {

    let mode = null; // 'block' (inside /* */) or 'template' (inside `...`)

    return lines.map( ( line ) => {

        let out = '', pos = 0;

        while ( pos < line.length ) {

            if ( mode === 'block' ) {

                const end = line.indexOf( '*/', pos );
                const stop = end < 0 ? line.length : end + 2;
                out += span( 'comment', line.slice( pos, stop ) );
                pos = stop;
                if ( end >= 0 ) mode = null;
                continue;

            }

            if ( mode === 'template' ) {

                let i = pos;
                while ( i < line.length && line[ i ] !== '`' ) i += line[ i ] === '\\' ? 2 : 1;
                const stop = Math.min( i + 1, line.length );
                out += span( 'string', line.slice( pos, stop ) );
                pos = stop;
                if ( i < line.length ) mode = null;
                continue;

            }

            if ( line.startsWith( '//', pos ) ) { out += span( 'comment', line.slice( pos ) ); break; }
            if ( line.startsWith( '/*', pos ) ) { mode = 'block'; out += span( 'comment', '/*' ); pos += 2; continue; }
            if ( line[ pos ] === '`' ) { mode = 'template'; out += span( 'string', '`' ); pos += 1; continue; }

            JS_TOKEN.lastIndex = pos;
            const m = JS_TOKEN.exec( line );

            if ( m === null ) { out += escapeHtml( line[ pos ] ); pos += 1; continue; }

            const kind = Object.keys( m.groups ).find( ( k ) => m.groups[ k ] !== undefined );
            out += kind === 'ident' ? escapeHtml( m[ 0 ] ) : span( kind, m[ 0 ] );
            pos += m[ 0 ].length;

        }

        return out;

    } );

}

/**
 * @param {string} source
 * @param {'wgsl'|'js'|string} lang Anything else is shown as plain text.
 * @returns {string[]} One HTML string per line of `source`.
 */
export function highlightLines( source, lang ) {

    const lines = source.split( '\n' );

    switch ( lang ) {

        case 'wgsl': return lines.map( highlightWgslLine );
        case 'js': return highlightJsLines( lines );
        default: return lines.map( escapeHtml );

    }

}
