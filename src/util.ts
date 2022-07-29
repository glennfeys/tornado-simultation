import ndarray from "ndarray";
import cwise from "cwise";

export const fill: (
  array: ndarray<any>,
  f: (...index: number[]) => any
) => void = cwise({
  funcName: "fill",
  args: ["array", "index", "scalar"],
  body: new Function("out", "ind", "f", "out = f.apply(undefined, ind);")
} as any);

export const map: (
  array: ndarray<any>,
  f: (...index: any[]) => any
) => void = cwise({
  funcName: "map",
  args: ["array", "index", "scalar"],
  body: new Function(
    "out",
    "ind",
    "f",
    "ind.push(out); out = f.apply(undefined, ind); ind.pop();"
  )
} as any);

export const forEach: (
  array: ndarray<any>,
  f: (...index: any[]) => void
) => void = cwise({
  funcName: "forEach",
  args: ["array", "index", "scalar"],
  body: new Function(
    "out",
    "ind",
    "f",
    "ind.push(out); f.apply(undefined, ind); ind.pop();"
  )
} as any);
