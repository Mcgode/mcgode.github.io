import { uniform } from 'three/tsl';

/**
 * Builds a small control panel and keeps a TSL uniform in sync with every control.
 *
 * Schema entries: `{ label, min, max, value, step, int? }` for sliders, `{ label, value: boolean }` for checkboxes.
 *
 * @param {HTMLElement} container
 * @param {Record<string, object>} schema
 * @param {() => void} onChange Called after any value changed.
 * @returns {{ values: Record<string, number|boolean>, uniforms: Record<string, any> }}
 */
export function buildParamsPanel( container, schema, onChange ) {

    container.replaceChildren();

    const values = {};
    const uniforms = {};

    for ( const [ key, def ] of Object.entries( schema ) ) {

        const row = document.createElement( 'label' );
        row.className = 'lab-param';

        const name = document.createElement( 'span' );
        name.className = 'lab-param-label';
        name.textContent = def.label ?? key;

        const input = document.createElement( 'input' );
        const readout = document.createElement( 'output' );
        readout.className = 'lab-param-value';

        if ( typeof def.value === 'boolean' ) {

            input.type = 'checkbox';
            input.checked = def.value;
            values[ key ] = def.value;
            uniforms[ key ] = uniform( def.value ? 1 : 0 );

            input.addEventListener( 'input', () => {

                values[ key ] = input.checked;
                uniforms[ key ].value = input.checked ? 1 : 0;
                onChange();

            } );

        } else {

            input.type = 'range';
            input.min = def.min; input.max = def.max; input.step = def.step ?? 'any';
            input.value = def.value;

            const format = ( v ) => def.int ? String( v ) : Number( v ).toPrecision( 3 );
            readout.textContent = format( def.value );

            values[ key ] = def.value;
            uniforms[ key ] = def.int ? uniform( def.value, 'int' ) : uniform( def.value );

            input.addEventListener( 'input', () => {

                const v = def.int ? Math.round( Number( input.value ) ) : Number( input.value );
                values[ key ] = v;
                uniforms[ key ].value = v;
                readout.textContent = format( v );
                onChange();

            } );

        }

        row.append( name, input, readout );
        container.append( row );

    }

    container.hidden = Object.keys( schema ).length === 0;

    return { values, uniforms };

}
