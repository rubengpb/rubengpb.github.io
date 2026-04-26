export function tokenize(input) {
  const tokens = [];
  let i = 0;

  const isLetter = (c) => /[a-zA-Z]/.test(c);

  while (i < input.length) {
    const c = input[i];

    if (/\s/.test(c)) {
      i++;
      continue;
    }

    if (c === "\\" || input.startsWith("lambda", i)) {
      tokens.push({ type: "LAMBDA" });
      i += c === "\\" ? 1 : 6;
      continue;
    }

    if (c === ".") {
      tokens.push({ type: "DOT" });
      i++;
      continue;
    }

    if (c === "(") {
      tokens.push({ type: "LPAREN" });
      i++;
      continue;
    }

    if (c === ")") {
      tokens.push({ type: "RPAREN" });
      i++;
      continue;
    }

    if (isLetter(c)) {
      let start = i;
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        i++;
      }

      const value = input.slice(start, i);
      tokens.push({ type: "IDENT", value });
      continue;
    }

    throw new Error(`Unknown character: ${c}`);
  }

  return tokens;
}
