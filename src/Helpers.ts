//@ts-check
// Helper code goes in this file.
import ndarray from 'ndarray';


// The mass of a point in kg
const POINT_MASS = 1;

/*
    Y = second coordinate
    |  /
    | / Z = Third coordinate
    |/_______ X = First coordinat
 */
enum Direction {
    X = 0,
    Y = 1,
    Z = 2
}

/**
 * Method used to calculate the 1/Reynolds number for given parameters
 * 
 * @param {number} v The characteristic speed of the flow (in m/s)
 * @param {number} L The characteristic length of the flow (in m)
 * @param {number} rho The density of the flowing medium (in kg/m3)
 * @param {number} mu The dynamic viscosity of the flowing medium (in Pa.s)
 * 
 * Note:
 *      Default values for rho & mu are predefined for a flow
 *      of oxygen at 25 degrees C & at sea level.
 * 
 * Sources:
 *      Reynoldsgetal (from Wikipedia): https://nl.wikipedia.org/wiki/Reynoldsgetal
 *      Density (from Wikipedia): https://en.wikipedia.org/wiki/Density
 *      Viscosity (from Wikipedia): https://en.wikipedia.org/wiki/Viscosity
 */
function reynolds(v: number, L: number, rho: number = 1.2, mu: number = 18.5 * (10 ** -3)) {
    return mu / (v * L * rho);
}

export { reynolds };