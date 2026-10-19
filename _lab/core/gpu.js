// One GPUDevice shared by every viewport on the page.
// three.js' WebGPURenderer accepts an existing device, so N viewports cost N canvases, not N devices.

let devicePromise = null;

export const isWebGPUAvailable = () => typeof navigator !== 'undefined' && !! navigator.gpu;

/** @returns {Promise<GPUDevice>} */
export function getSharedDevice() {

    if ( devicePromise === null ) {

        devicePromise = ( async () => {

            const adapter = await navigator.gpu.requestAdapter();
            if ( adapter === null ) throw new Error( 'No WebGPU adapter available.' );

            // Same approach as three.js itself: enable everything the adapter offers.
            const device = await adapter.requestDevice( { requiredFeatures: [ ...adapter.features ] } );

            device.lost.then( ( info ) => {

                console.warn( `[lab] GPU device lost (${ info.reason }): ${ info.message }` );
                devicePromise = null; // Viewports mounted afterwards get a fresh device.

            } );

            return device;

        } )();

        // Don't cache a rejection forever.
        devicePromise.catch( () => { devicePromise = null; } );

    }

    return devicePromise;

}
