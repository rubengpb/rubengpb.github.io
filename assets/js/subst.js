import { Var, Abs, App } from "./ast.js";
import { freeVars, newFreeVar } from "./utils.js";

export function subst(n, x, b) {
  switch (b.type) {

    case "Var":
      return b.name === x ? n : b;

    case "App":
      return new App(
        subst(n, x, b.left),
        subst(n, x, b.right)
      );

    case "Abs": {
      const y = b.param;
      const body = b.body;

      if (x === y) return b;

      const freeBody = freeVars(body);
      const freeN = freeVars(n);

      if (!freeBody.includes(x)) {
        return b;
      }

      if (!freeN.includes(y)) {
        return new Abs(y, subst(n, x, body));
      }

      const z = newFreeVar(y, freeBody);

      const renamedBody = subst(new Var(z), y, body);
      return new Abs(z, subst(n, x, renamedBody));
    }
  }
}
