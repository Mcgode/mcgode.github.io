import { loadSource, diffLines, highlightWgslLine } from './source.js';

/**
 * Renders a source listing, with an optional "show changes since previous step" toggle.
 * Needs no GPU, so it is mounted as soon as the page loads.
 *
 * @param {HTMLElement} container
 * @param {{ url: string, prevUrl?: string, title?: string }} options
 */
export async function mountCodeView( container, { url, prevUrl, title } ) {

    const [ current, previous ] = await Promise.all( [
        loadSource( url ),
        prevUrl ? loadSource( prevUrl ) : null,
    ] );

    const details = document.createElement( 'details' );
    details.open = true;

    const summary = document.createElement( 'summary' );
    summary.textContent = title ?? url.split( '/' ).pop();
    details.append( summary );

    const pre = document.createElement( 'pre' );
    const code = document.createElement( 'code' );
    pre.append( code );

    const render = ( showDiff ) => {

        const lines = showDiff && previous
            ? diffLines( previous.source, current.source )
            : current.source.split( '\n' ).map( ( text ) => ( { type: 'same', text } ) );

        code.replaceChildren( ...lines.map( ( { type, text } ) => {

            const el = document.createElement( 'span' );
            el.className = `lab-line lab-line-${ type }`;
            el.innerHTML = highlightWgslLine( text ) || ' ';
            return el;

        } ) );

    };

    if ( previous ) {

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
    render( !! previous );

    container.replaceChildren( details );
    container.hidden = false;

}
