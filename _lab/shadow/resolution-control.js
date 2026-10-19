export const MIN_EXPONENT = 6;  //   64 x 64
export const MAX_EXPONENT = 12; // 4096 x 4096

/**
 * Slider schema entry for the shadow map resolution. It is an exponent slider, so that it only visits powers of two;
 * `values.mapResolution` holds the exponent, and `2 ** values.mapResolution` is the size in texels.
 *
 * @param {number} resolution Initial size in texels, a power of two.
 */
export const resolutionParam = ( resolution ) => ( {
    label: 'Shadow map resolution',
    min: MIN_EXPONENT, max: MAX_EXPONENT, step: 1, int: true,
    value: Math.min( MAX_EXPONENT, Math.max( MIN_EXPONENT, Math.round( Math.log2( resolution ) ) ) ),
    format: ( exponent ) => `${ 2 ** exponent }`,
} );
