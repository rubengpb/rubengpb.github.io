import { Var, Abs, App } from "./ast.js";
import { tokenize } from "./lexer.js";

export function parse(input) {
  const tokens = tokenize(input);
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function expect(type) {
    const t = consume();
    if (!t || t.type !== type) {
      throw new Error(`Expected ${type}`);
    }
    return t;
  }

  // term := \x.term | app
  function parseTerm() {
    if (peek()?.type === "LAMBDA") {
      consume(); // λ
      const param = expect("IDENT").value;
      expect("DOT");
      const body = parseTerm();
      return new Abs(param, body);
    }

    return parseApp();
  }

  // app := atom atoms
  function parseApp() {
    let node = parseAtom();

    while (true) {
      const next = peek();
      if (!next || next.type === "RPAREN" || next.type === "DOT") {
        break;
      }

      const right = parseAtom();
      node = new App(node, right);
    }

    return node;
  }

  // atom := IDENT | (term)
  function parseAtom() {
    const t = peek();

    if (!t) throw new Error("Unexpected end of input");

    if (t.type === "IDENT") {
      consume();
      return new Var(t.value);
    }

    if (t.type === "LPAREN") {
      consume();
      const expr = parseTerm();
      expect("RPAREN");
      return expr;
    }

    throw new Error(`Unexpected token: ${t.type}`);
  }

  return parseTerm();
}
