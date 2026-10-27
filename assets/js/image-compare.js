// Keeps the divider of every `.compare` (_includes/image-compare.liquid) at its slider's position.
// One delegated listener serves all comparisons on the page, including ones added later.

document.addEventListener( 'input', ( event ) => {

    const slider = event.target;
    if ( ! slider.classList?.contains( 'compare-slider' ) ) return;

    slider.closest( '.compare' ).style.setProperty( '--pos', `${ slider.value }%` );

} );
