declare module "ndarray-linear-interpolate" {
  import ndarray from "ndarray";

  function interpolate(data: ndarray<number>, ...point: number[]): number;

  namespace interpolate {
    function d1(data: ndarray<number>, x: number): number;
    function d2(data: ndarray<number>, x: number, y: number): number;
    function d3(data: ndarray<number>, x: number, y: number, z: number): number;
  }

  export = interpolate;
}
