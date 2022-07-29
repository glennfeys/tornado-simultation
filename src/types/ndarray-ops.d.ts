declare module "ndarray-ops" {
  import ndarray from "ndarray";

  namespace ops {
    function assign(out: ndarray, a: ndarray): void;
    function assigns(out: ndarray, a: number): void;

    function random(out: ndarray): void;

    function add(out: ndarray, a: ndarray, b: ndarray): void;
    function adds(out: ndarray, a: ndarray, b: number): void;
    function addeq(a: ndarray, b: ndarray): void;
    function addseq(a: ndarray, b: number): void;

    function sub(out: ndarray, a: ndarray, b: ndarray): void;
    function subs(out: ndarray, a: ndarray, b: number): void;
    function subeq(a: ndarray, b: ndarray): void;
    function subseq(a: ndarray, b: number): void;

    function mul(out: ndarray, a: ndarray, b: ndarray): void;
    function muls(out: ndarray, a: ndarray, b: number): void;
    function muleq(a: ndarray, b: ndarray): void;
    function mulseq(a: ndarray, b: number): void;

    function div(out: ndarray, a: ndarray, b: ndarray): void;
    function divs(out: ndarray, a: ndarray, b: number): void;
    function diveq(a: ndarray, b: ndarray): void;
    function divseq(a: ndarray, b: number): void;

    function mod(out: ndarray, a: ndarray, b: ndarray): void;
    function mods(out: ndarray, a: ndarray, b: number): void;
    function modeq(a: ndarray, b: ndarray): void;
    function modseq(a: ndarray, b: number): void;

    function band(out: ndarray, a: ndarray, b: ndarray): void;
    function bands(out: ndarray, a: ndarray, b: number): void;
    function bandeq(a: ndarray, b: ndarray): void;
    function bandseq(a: ndarray, b: number): void;

    function bor(out: ndarray, a: ndarray, b: ndarray): void;
    function bors(out: ndarray, a: ndarray, b: number): void;
    function boreq(a: ndarray, b: ndarray): void;
    function borseq(a: ndarray, b: number): void;

    function bxor(out: ndarray, a: ndarray, b: ndarray): void;
    function bxors(out: ndarray, a: ndarray, b: number): void;
    function bxoreq(a: ndarray, b: ndarray): void;
    function bxorseq(a: ndarray, b: number): void;

    function lshift(out: ndarray, a: ndarray, b: ndarray): void;
    function lshifts(out: ndarray, a: ndarray, b: number): void;
    function lshifteq(a: ndarray, b: ndarray): void;
    function lshiftseq(a: ndarray, b: number): void;

    function rshift(out: ndarray, a: ndarray, b: ndarray): void;
    function rshifts(out: ndarray, a: ndarray, b: number): void;
    function rshifteq(a: ndarray, b: ndarray): void;
    function rshiftseq(a: ndarray, b: number): void;

    function rrshift(out: ndarray, a: ndarray, b: ndarray): void;
    function rrshifts(out: ndarray, a: ndarray, b: number): void;
    function rrshifteq(a: ndarray, b: ndarray): void;
    function rrshiftseq(a: ndarray, b: number): void;

    function lt(out: ndarray, a: ndarray, b: ndarray): void;
    function lts(out: ndarray, a: ndarray, b: number): void;
    function lteq(a: ndarray, b: ndarray): void;
    function ltseq(a: ndarray, b: number): void;

    function gt(out: ndarray, a: ndarray, b: ndarray): void;
    function gts(out: ndarray, a: ndarray, b: number): void;
    function gteq(a: ndarray, b: ndarray): void;
    function gtseq(a: ndarray, b: number): void;

    function leq(out: ndarray, a: ndarray, b: ndarray): void;
    function leqs(out: ndarray, a: ndarray, b: number): void;
    function leqeq(a: ndarray, b: ndarray): void;
    function leqseq(a: ndarray, b: number): void;

    function geq(out: ndarray, a: ndarray, b: ndarray): void;
    function geqs(out: ndarray, a: ndarray, b: number): void;
    function geqeq(a: ndarray, b: ndarray): void;
    function geqseq(a: ndarray, b: number): void;

    function eq(out: ndarray, a: ndarray, b: ndarray): void;
    function eqs(out: ndarray, a: ndarray, b: number): void;
    function eqeq(a: ndarray, b: ndarray): void;
    function eqseq(a: ndarray, b: number): void;

    function neq(out: ndarray, a: ndarray, b: ndarray): void;
    function neqs(out: ndarray, a: ndarray, b: number): void;
    function neqeq(a: ndarray, b: ndarray): void;
    function neqseq(a: ndarray, b: number): void;

    function and(out: ndarray, a: ndarray, b: ndarray): void;
    function ands(out: ndarray, a: ndarray, b: number): void;
    function andeq(a: ndarray, b: ndarray): void;
    function andseq(a: ndarray, b: number): void;

    function or(out: ndarray, a: ndarray, b: ndarray): void;
    function ors(out: ndarray, a: ndarray, b: number): void;
    function oreq(a: ndarray, b: ndarray): void;
    function orseq(a: ndarray, b: number): void;

    function max(out: ndarray, a: ndarray, b: ndarray): void;
    function maxs(out: ndarray, a: ndarray, b: number): void;
    function maxeq(a: ndarray, b: ndarray): void;
    function maxseq(a: ndarray, b: number): void;

    function min(out: ndarray, a: ndarray, b: ndarray): void;
    function mins(out: ndarray, a: ndarray, b: number): void;
    function mineq(a: ndarray, b: ndarray): void;
    function minseq(a: ndarray, b: number): void;

    function not(out: ndarray, a: ndarray): void;
    function noteq(a: ndarray): void;

    function bnot(out: ndarray, a: ndarray): void;
    function bnoteq(a: ndarray): void;

    function neg(out: ndarray, a: ndarray): void;
    function negeq(a: ndarray): void;

    function recip(out: ndarray, a: ndarray): void;
    function recipeq(a: ndarray): void;

    function abs(out: ndarray, a: ndarray): void;
    function abseq(a: ndarray): void;

    function acos(out: ndarray, a: ndarray): void;
    function acoseq(a: ndarray): void;

    function asin(out: ndarray, a: ndarray): void;
    function asineq(a: ndarray): void;

    function atan(out: ndarray, a: ndarray): void;
    function ataneq(a: ndarray): void;

    function ceil(out: ndarray, a: ndarray): void;
    function ceileq(a: ndarray): void;

    function cos(out: ndarray, a: ndarray): void;
    function coseq(a: ndarray): void;

    function exp(out: ndarray, a: ndarray): void;
    function expeq(a: ndarray): void;

    function floor(out: ndarray, a: ndarray): void;
    function flooreq(a: ndarray): void;

    function log(out: ndarray, a: ndarray): void;
    function logeq(a: ndarray): void;

    function round(out: ndarray, a: ndarray): void;
    function roundeq(a: ndarray): void;

    function sin(out: ndarray, a: ndarray): void;
    function sineq(a: ndarray): void;

    function sqrt(out: ndarray, a: ndarray): void;
    function sqrteq(a: ndarray): void;

    function tan(out: ndarray, a: ndarray): void;
    function taneq(a: ndarray): void;

    function atan2(out: ndarray, a: ndarray, b: ndarray): void;
    function atan2s(out: ndarray, a: ndarray, b: number): void;
    function atan2eq(a: ndarray, b: ndarray): void;
    function atan2seq(a: ndarray, b: number): void;
    function atan2op(out: ndarray, a: ndarray, b: ndarray): void;
    function atan2sop(out: ndarray, a: ndarray, b: number): void;
    function atan2opeq(a: ndarray, b: ndarray): void;
    function atan2sopeq(a: ndarray, b: number): void;

    function pow(out: ndarray, a: ndarray, b: ndarray): void;
    function pows(out: ndarray, a: ndarray, b: number): void;
    function poweq(a: ndarray, b: ndarray): void;
    function powseq(a: ndarray, b: number): void;
    function powop(out: ndarray, a: ndarray, b: ndarray): void;
    function powsop(out: ndarray, a: ndarray, b: number): void;
    function powopeq(a: ndarray, b: ndarray): void;
    function powsopeq(a: ndarray, b: number): void;

    function equals(a: ndarray, b: ndarray): boolean;

    function any(a: ndarray): boolean;

    function all(a: ndarray): boolean;

    function sum(a: ndarray): number;

    function prod(a: ndarray): number;

    function norm2squared(a: ndarray): number;

    function norm2(a: ndarray): number;

    function norminf(a: ndarray): number;

    function norm1(a: ndarray): number;

    function sup(a: ndarray): number;

    function inf(a: ndarray): number;

    function argmin(a: ndarray): number;

    function argmax(a: ndarray): number;
  }

  export default ops;
}
