import { Range } from "./source";

enum Ast {
  Null,
  Undefined,
  BoolLit,
  CharLit,
  IntLit,
  FloatLit,
  StrLit,
}

export class AstNode {
  constructor(public readonly id: Ast, public range?: Range) {}
  clone(): AstNode {
    return new AstNode(this.id, this.range);
  }
}

export class BoolLit extends AstNode {
  constructor(public value: boolean, range?: Range) {
    super(Ast.BoolLit, range);
  }

  clone(): AstNode {
    return new BoolLit(this.value, this.range);
  }
}

export class IntegerLit extends AstNode {
  constructor(public value: number, range?: Range) {
    super(Ast.IntLit, range);
  }

  clone(): AstNode {
    return new IntegerLit(this.value, this.range);
  }
}

export class FloatLit extends AstNode {
  constructor(public value: number, range?: Range) {
    super(Ast.FloatLit, range);
  }

  clone(): AstNode {
    return new FloatLit(this.value, this.range);
  }
}

export class StringLit extends AstNode {
  constructor(public value: string, range?: Range) {
    super(Ast.StrLit, range);
  }

  clone(): AstNode {
    return new StringLit(this.value, this.range);
  }
}

export class CharacterLit extends AstNode {
  constructor(public value: string, range?: Range) {
    super(Ast.CharLit, range);
  }

  clone(): AstNode {
    return new CharacterLit(this.value, this.range);
  }
}

export class Indentifier extends AstNode {
  constructor(public name: string, range?: Range) {
    super(Ast.CharLit, range);
  }

  clone(): AstNode {
    return new Indentifier(this.name, this.range);
  }
}

export const nullNode: AstNode = new AstNode(Ast.Null);
export const undefineNode: AstNode = new AstNode(Ast.Undefined);
