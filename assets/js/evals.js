import { Var, Abs, App } from "./ast.js";
import { subst } from "./subst.js";

export function ao(t) {
  switch (t.type) {

    case "App": {
      const t1 = ao(t.left);

      if (t1.type === "Abs") {
        const arg = ao(t.right);
        const reduced = subst(arg, t1.param, t1.body);
        return ao(reduced);
      }

      return new App(t1, ao(t.right));
    }

    case "Abs":
      return new Abs(t.param, ao(t.body));

    case "Var":
      return t;
  }
}
