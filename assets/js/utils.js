import { Var, Abs, App } from "./ast.js";

export function freeVars(t) {
  switch (t.type) {
    case "Var":
      return [t.name];

    case "Abs":
      return freeVars(t.body).filter(x => x !== t.param);

    case "App":
      return uniq([
        ...freeVars(t.left),
        ...freeVars(t.right)
      ]);
  }
}

function uniq(arr) {
  return [...new Set(arr)];
}

export function newFreeVar(x, xs) {
  let y = x + "s";
  while (xs.includes(y)) {
    y += "s";
  }
  return y;
}
