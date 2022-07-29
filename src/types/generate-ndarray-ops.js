// node generate-ndarray-ops.js > ndarray-ops.d.ts

const binaryOperators = [
  "add",
  "sub",
  "mul",
  "div",
  "mod",
  "band",
  "bor",
  "bxor",
  "lshift",
  "rshift",
  "rrshift",
  "lt",
  "gt",
  "leq",
  "geq",
  "eq",
  "neq",
  "and",
  "or",
  "max",
  "min"
];

const unaryOperators = [
  "not",
  "bnot",
  "neg",
  "recip",
  "abs",
  "acos",
  "asin",
  "atan",
  "ceil",
  "cos",
  "exp",
  "floor",
  "log",
  "round",
  "sin",
  "sqrt",
  "tan"
];

const nonSymmetricBinaryOperators = ["atan2", "pow"];

const mapReduceOperators = [
  ["any", "boolean"],
  ["all", "boolean"],
  ["sum", "number"],
  ["prod", "number"],
  ["norm2squared", "number"],
  ["norm2", "number"],
  ["norminf", "number"],
  ["norm1", "number"],
  ["sup", "number"],
  ["inf", "number"],
  ["argmin", "number"],
  ["argmax", "number"]
];

console.log(`\
declare module "ndarray-ops" {
  import ndarray from "ndarray";

  namespace ops {
    function assign(out: ndarray, a: ndarray): void;
    function assigns(out: ndarray, a: number): void;

    function random(out: ndarray): void;

${binaryOperators
  .map(b => {
    return `\
    function ${b}(out: ndarray, a: ndarray, b: ndarray): void;
    function ${b}s(out: ndarray, a: ndarray, b: number): void;
    function ${b}eq(a: ndarray, b: ndarray): void;
    function ${b}seq(a: ndarray, b: number): void;
`;
  })
  .join("\n")}\

${unaryOperators
  .map(b => {
    return `\
    function ${b}(out: ndarray, a: ndarray): void;
    function ${b}eq(a: ndarray): void;
`;
  })
  .join("\n")}\

${nonSymmetricBinaryOperators
  .map(b => {
    return `\
    function ${b}(out: ndarray, a: ndarray, b: ndarray): void;
    function ${b}s(out: ndarray, a: ndarray, b: number): void;
    function ${b}eq(a: ndarray, b: ndarray): void;
    function ${b}seq(a: ndarray, b: number): void;
    function ${b}op(out: ndarray, a: ndarray, b: ndarray): void;
    function ${b}sop(out: ndarray, a: ndarray, b: number): void;
    function ${b}opeq(a: ndarray, b: ndarray): void;
    function ${b}sopeq(a: ndarray, b: number): void;
`;
  })
  .join("\n")}\

    function equals(a: ndarray, b: ndarray): boolean;

${mapReduceOperators
  .map(([b, t]) => {
    return `\
    function ${b}(a: ndarray): ${t};
`;
  })
  .join("\n")}\
  }

  export default ops;
}`);
