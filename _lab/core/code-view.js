import { diffLines } from './source.js';
import { highlightLines } from './highlight.js';
import { loadSnippet } from './snippets.js';

/**
 * Renders one code listing per snippet spec (see `SnippetSpec` in snippets.js), in order. A listing with a previous
 * version gets a "show changes" toggle. Needs no GPU, so it is mounted as soon as the page loads.
 *
 * A snippet that fails to load shows its error in place, without affecting the others.
 *
 * @param {HTMLElement} container
 * @param {import('./snippets.js').SnippetSpec[]} specs
 * @param {{ sourceBase: string }} context
 */
export async function mountCodeView( container, specs, context ) {

    container.replaceChildren();
    container.hidden = specs.length === 0;

    // Reserve each listing's place first, so that they stay in order whichever file arrives first.
    const slots = specs.map( () => {

        const slot = document.createElement( 'div' );
        slot.className = 'lab-snippet';
        container.append( slot );
        return slot;

    } );

    await Promise.all( specs.map( async ( spec, i ) => {

        try {

            slots[ i ].append( renderSnippet( await loadSnippet( spec, context ) ) );

        } catch ( e ) {

            console.error( e );
            const error = document.createElement( 'p' );
            error.className = 'lab-snippet-error';
            error.textContent = `Could not load ${ spec.title ?? spec.src ?? spec.url ?? 'this snippet' }: ${ e.message }`;
            slots[ i ].append( error );

        }

    } ) );

}

function renderSnippet( { title, lang, collapsed, source, previous } ) {

    const details = document.createElement( 'details' );
    details.open = ! collapsed;

    if ( title !== undefined ) {

        const summary = document.createElement( 'summary' );
        summary.textContent = title;
        details.append( summary );

    }

    const pre = document.createElement( 'pre' );
    const code = document.createElement( 'code' );
    code.className = `lab-lang-${ lang }`;
    pre.append( code );

    // Highlight each version as a whole, so that multi-line comments and strings stay correct, then pick lines.
    const currentHtml = highlightLines( source, lang );
    const previousHtml = previous === null ? null : highlightLines( previous, lang );

    const render = ( showDiff ) => {

        const lines = showDiff && previous !== null
            ? diffLines( previous, source ).map( ( { type, before, after } ) => ( {
                type, html: type === 'del' ? previousHtml[ before ] : currentHtml[ after ],
            } ) )
            : currentHtml.map( ( html ) => ( { type: 'same', html } ) );

        code.replaceChildren( ...lines.map( ( { type, html } ) => {

            const el = document.createElement( 'span' );
            el.className = `lab-line lab-line-${ type }`;
            el.innerHTML = html || ' ';
            return el;

        } ) );

    };

    if ( previous !== null ) {

        const toggle = document.createElement( 'label' );
        toggle.className = 'lab-code-toggle';
        const box = document.createElement( 'input' );
        box.type = 'checkbox';
        box.checked = true;
        box.addEventListener( 'input', () => render( box.checked ) );
        toggle.append( box, ' Show changes from the previous step' );
        details.append( toggle );

    }

    details.append( pre );
    render( previous !== null );

    return details;

}
