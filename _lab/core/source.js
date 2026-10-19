// Helpers for shader source files shared between "what runs" and "what the article shows".

const cache = new Map();

/** Fetches a text file once. */
export function fetchText( url ) {

    if ( ! cache.has( url ) ) {

        cache.set( url, fetch( url ).then( ( r ) => {

            if ( ! r.ok ) throw new Error( `Failed to load ${ url } (${ r.status })` );
            return r.text();

        } ) );

    }

    return cache.get( url );

}

/**
 * Source files can declare viewport controls in header comments, next to the code they control:
 *
 *     // @param <name> <min> <max> <default> <step> <label...>
 *
 * A step written without a decimal point (`1`) makes an integer control. These lines are removed from
 * the code that gets compiled and displayed, so they never show up in listings or diffs.
 *
 * @param {string} source
 * @returns {{ source: string, schema: Record<string, object> }}
 */
export function parseParamPragmas( source ) {

    const schema = {};
    const kept = [];

    for ( const line of source.split( '\n' ) ) {

        const m = line.match( /^\s*\/\/\s*@param\s+(\w+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)$/ );

        if ( m === null ) {

            kept.push( line );
            continue;

        }

        const [ , name, min, max, value, step, label ] = m;
        schema[ name ] = {
            label: label.trim() || name,
            min: Number( min ), max: Number( max ), value: Number( value ), step: Number( step ),
            int: ! step.includes( '.' ),
        };

    }

    // Drop blank lines left at the top by removed pragmas.
    while ( kept.length > 0 && kept[ 0 ].trim() === '' ) kept.shift();

    return { source: kept.join( '\n' ), schema };

}

/** Fetches a source file and splits off its `@param` pragmas. */
export async function loadSource( url ) {

    return parseParamPragmas( await fetchText( url ) );

}

/**
 * Line diff (LCS). Returns one entry per line of the merged view:
 * `{ type: 'same' | 'add' | 'del', text, before, after }`, where `before` / `after` are the index of the line in
 * each version (-1 when the line is not in that version): 'del' lines only exist before, 'add' lines only after.
 */
export function diffLines( before, after ) {

    const a = before.split( '\n' );
    const b = after.split( '\n' );
    const n = a.length, m = b.length;

    // lcs[i][j] = length of the LCS of a[i..] and b[j..]
    const lcs = Array.from( { length: n + 1 }, () => new Uint16Array( m + 1 ) );
    for ( let i = n - 1; i >= 0; i -- )
        for ( let j = m - 1; j >= 0; j -- )
            lcs[ i ][ j ] = a[ i ] === b[ j ] ? lcs[ i + 1 ][ j + 1 ] + 1 : Math.max( lcs[ i + 1 ][ j ], lcs[ i ][ j + 1 ] );

    const out = [];
    let i = 0, j = 0;
    while ( i < n && j < m ) {

        if ( a[ i ] === b[ j ] ) { out.push( { type: 'same', text: b[ j ], before: i, after: j } ); i ++; j ++; }
        else if ( lcs[ i + 1 ][ j ] >= lcs[ i ][ j + 1 ] ) { out.push( { type: 'del', text: a[ i ], before: i, after: - 1 } ); i ++; }
        else { out.push( { type: 'add', text: b[ j ], before: - 1, after: j } ); j ++; }

    }
    while ( i < n ) { out.push( { type: 'del', text: a[ i ], before: i, after: - 1 } ); i ++; }
    while ( j < m ) { out.push( { type: 'add', text: b[ j ], before: - 1, after: j } ); j ++; }

    return out;

}
