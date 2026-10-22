import { Vector3 } from 'three/webgpu';

/** Slider schema for a directional light described by two angles. */
export const LIGHT_PARAMS = {
    azimuth: { label: 'Light azimuth (°)', min: 0, max: 360, value: 35, step: 1, int: true },
    elevation: { label: 'Light elevation (°)', min: 5, max: 90, value: 45, step: 1, int: true },
};

/**
 * Converts the `azimuth` / `elevation` slider values into a unit vector pointing from the scene towards the light.
 *
 * @param {Record<string, any>} values The `values` object returned by `viewport.setParams`.
 * @param {Vector3} [target]
 */
export function lightDirectionFromParams( values, target = new Vector3() ) {

    const az = ( values.azimuth ?? LIGHT_PARAMS.azimuth.value ) * Math.PI / 180;
    const el = ( values.elevation ?? LIGHT_PARAMS.elevation.value ) * Math.PI / 180;

    return target.set( Math.cos( el ) * Math.sin( az ), Math.sin( el ), Math.cos( el ) * Math.cos( az ) );

}
