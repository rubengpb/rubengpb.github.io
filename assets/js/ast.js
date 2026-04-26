export class Var {
  constructor(name) {
    this.type = "Var";
    this.name = name;
  }
}

export class Abs {
  constructor(param, body) {
    this.type = "Abs";
    this.param = param;
    this.body = body;
  }
}

export class App {
  constructor(left, right) {
    this.type = "App";
    this.left = left;
    this.right = right;
  }
}
