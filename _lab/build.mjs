// Bundles the interactive demos in _lab/ into assets/lab/, which Jekyll then publishes as static files.
//
//   npm run build   minified, one-off (what CI runs)
//   npm run dev     unminified, rebuilds on change (run it next to `jekyll serve`)
//
// Output:
//   assets/lab/boot.js          tiny entry point, the only script the page references
//   assets/lab/chunks/*.js      lazy chunks: three.js + viewport, one per demo (code splitting)
//   assets/lab/**/*.wgsl        shader sources, copied verbatim; the page fetches them to display *and* run them
//
// Everything in assets/lab/ is generated and git-ignored.

import { build, context } from 'esbuild';
import { cpSync, mkdirSync, readdirSync, rmSync, watch } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..' );
const src = join( root, '_lab' );
const out = join( root, 'assets', 'lab' );
const watching = process.argv.includes( '--watch' );

const options = {
    entryPoints: [ join( src, 'boot.js' ) ],
    outdir: out,
    bundle: true,
    splitting: true,
    format: 'esm',
    loader: { '.wgsl': 'text' }, // lets demos import a shader as a string
    target: 'es2022',
    minify: ! watching,
    sourcemap: watching ? 'linked' : false, // not worth publishing ~6 MB of maps
    entryNames: '[name]',
    chunkNames: 'chunks/[name]-[hash]',
    logLevel: 'info',
};

function* walk( dir ) {

    for ( const entry of readdirSync( dir, { withFileTypes: true } ) ) {

        const path = join( dir, entry.name );
        if ( entry.isDirectory() ) yield* walk( path );
        else yield path;

    }

}

function copyShaders() {

    for ( const file of walk( src ) ) {

        if ( ! file.endsWith( '.wgsl' ) ) continue;
        const dest = join( out, relative( src, file ) );
        mkdirSync( dirname( dest ), { recursive: true } );
        cpSync( file, dest );

    }

}

rmSync( out, { recursive: true, force: true } );

if ( watching ) {

    const ctx = await context( options );
    await ctx.watch();
    copyShaders();

    // .wgsl files are fetched at runtime, not imported, so esbuild does not see them change.
    watch( src, { recursive: true }, ( _, name ) => {

        if ( name?.endsWith( '.wgsl' ) ) copyShaders();

    } );

    console.log( 'Watching _lab/ …' );

} else {

    await build( options );
    copyShaders();

}
