import { Var, Abs, App } from "./ast.js";

export function prettyPrint(t) {
  return go(t);
}

function go(t) {
  switch (t.type) {

    case "Var":
      return t.name;

    case "Abs":
      return `\\${t.param}.${go(t.body)}`;

    case "App":
      return printApp(t);
  }
}

function printApp(t) {
  const { left: t1, right: t2 } = t;

  if (t1.type === "Var" && t2.type === "Var") {
    return `${t1.name} ${t2.name}`;
  }

  if (t1.type === "Var") {
    return `${t1.name} (${go(t2)})`;
  }

  if (t1.type === "App" && t2.type === "Var") {
    return `${go(t1)} ${t2.name}`;
  }

  if (t1.type === "App" && t2.type === "Abs") {
    return `${go(t1)} (${go(t2)})`;
  }

  if (t1.type === "App") {
    return `${go(t1)} (${go(t2)})`;
  }
  if (t2.type === "Var") {
    return `(${go(t1)}) ${t2.name}`;
  }

  return `(${go(t1)}) (${go(t2)})`;
}
