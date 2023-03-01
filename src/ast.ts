import { Range } from "./source";
import { Tok } from "./token";

export enum Ast {
  Null,
  Undefined,
  BoolLit,
  CharLit,
  IntLit,
  FloatLit,
  StrLit,
  Identifier,
  StrExpr,
  GroupingExpr,
  PrefixExpr,
  PostfixExpr,
  UnaryExpr,
  BinaryExpr,
  TernaryExpr,
  AssignmentExpr,
  CallExpr,
  SpreadExpr,
  YieldExpr,
  NewExpr,
  BracketExpr,
  MemberAccessExpr,
  TupleExpr,
}

export class AstNode {
  public next?: AstNode = undefined;

  constructor(public readonly id: Ast, public range?: Range) {}

  clone(): AstNode {
    return new AstNode(this.id, this.range);
  }

  toString() {
    return Ast[this.id];
  }
}

export class AstNodeList {
  first?: AstNode = undefined;
  last?: AstNode = undefined;
  count: number = 0;

  add(node: AstNode) {
    if (!this.first) {
      this.first = node;
    } else if (this.last) {
      this.last.next = node;
    }
    this.last = node;
    this.count++;
  }

  clone(): AstNodeList {
    const copy = new AstNodeList();
    var node = this.first;
    while (node) {
      copy.add(node.clone());
      node = node.next;
    }
    return copy;
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

export class Identifier extends AstNode {
  constructor(public name: string, range?: Range) {
    super(Ast.Identifier, range);
  }

  clone(): AstNode {
    return new Identifier(this.name, this.range);
  }
}

export class StringExpression extends AstNode {
  parts: AstNodeList = new AstNodeList();
  constructor(range?: Range) {
    super(Ast.StrExpr, range);
  }

  add(part: AstNode) {
    this.parts.add(part);
  }

  clone(): AstNode {
    const copy = new StringExpression(this.range);
    var node = this.parts.first;
    while (node) {
      copy.parts.add(node.clone());
      node = node.next;
    }
    return copy;
  }
}

export class GroupingExpression extends AstNode {
  constructor(public expr: AstNode, range?: Range) {
    super(Ast.GroupingExpr, range);
  }

  clone(): AstNode {
    return new GroupingExpression(this.expr.clone(), this.range);
  }
}

export class PrefixExpression extends AstNode {
  constructor(public op: Tok, public expr: AstNode, range?: Range) {
    super(Ast.PrefixExpr, range);
  }

  clone(): AstNode {
    return new PrefixExpression(this.op, this.expr.clone(), this.range);
  }
}

export class PostfixExpression extends AstNode {
  constructor(public op: Tok, public expr: AstNode, range?: Range) {
    super(Ast.PostfixExpr, range);
  }

  clone(): AstNode {
    return new PostfixExpression(this.op, this.expr.clone(), this.range);
  }
}

export class UnaryExpression extends AstNode {
  constructor(public op: Tok, public expr: AstNode, range?: Range) {
    super(Ast.UnaryExpr, range);
  }

  clone(): AstNode {
    return new UnaryExpression(this.op, this.expr.clone(), this.range);
  }
}

export class BinaryExpression extends AstNode {
  constructor(
    public lhs: AstNode,
    public op: Tok,
    public rhs: AstNode,
    range?: Range
  ) {
    super(Ast.BinaryExpr, range);
  }

  clone(): AstNode {
    return new BinaryExpression(
      this.lhs.clone(),
      this.op,
      this.rhs.clone(),
      this.range
    );
  }
}

export class TernaryExpression extends AstNode {
  constructor(
    public cond: AstNode,
    public ifTrue: AstNode,
    public ifFalse: AstNode,
    range?: Range
  ) {
    super(Ast.TernaryExpr, range);
  }

  clone(): AstNode {
    return new TernaryExpression(
      this.cond.clone(),
      this.ifTrue.clone(),
      this.ifFalse.clone(),
      this.range
    );
  }
}

export class AssignmentExpression extends AstNode {
  constructor(
    public lhs: AstNode,
    public op: Tok,
    public rhs: AstNode,
    range?: Range
  ) {
    super(Ast.AssignmentExpr, range);
  }

  clone(): AstNode {
    return new AssignmentExpression(
      this.lhs.clone(),
      this.op,
      this.rhs.clone(),
      this.range
    );
  }
}

export class CallExpression extends AstNode {
  constructor(public expr: AstNode, public args: AstNodeList, range?: Range) {
    super(Ast.CallExpr, range);
  }

  clone(): AstNode {
    const expr = new CallExpression(
      this.expr.clone(),
      new AstNodeList(),
      this.range
    );
    var node = this.args.first;
    while (node) {
      expr.args.add(node.clone());
      node = node.next;
    }

    return expr;
  }
}

export class SpreadExpression extends AstNode {
  constructor(public expr: AstNode, range?: Range) {
    super(Ast.SpreadExpr, range);
  }

  clone(): AstNode {
    return new SpreadExpression(this.expr.clone(), this.range);
  }
}

export class YieldExpression extends AstNode {
  constructor(public expr: AstNode, public starred?: boolean, range?: Range) {
    super(Ast.YieldExpr, range);
  }

  clone(): AstNode {
    return new YieldExpression(this.expr.clone(), this.starred, this.range);
  }
}

export class NewExpression extends AstNode {
  constructor(public expr: AstNode, range?: Range) {
    super(Ast.NewExpr, range);
  }

  clone(): AstNode {
    return new NewExpression(this.expr.clone(), this.range);
  }
}

export class BracketExpression extends AstNode {
  constructor(public target: AstNode, public index: AstNode, range?: Range) {
    super(Ast.BracketExpr, range);
  }

  clone(): AstNode {
    return new BracketExpression(
      this.target.clone(),
      this.index.clone(),
      this.range
    );
  }
}

export class MemberAccessExpression extends AstNode {
  constructor(
    public target: AstNode,
    public op: Tok,
    public member: AstNode,
    range?: Range
  ) {
    super(Ast.MemberAccessExpr, range);
  }

  clone(): AstNode {
    return new MemberAccessExpression(
      this.target.clone(),
      this.op,
      this.member.clone(),
      this.range
    );
  }
}

export class TupleExpression extends AstNode {
  constructor(public exprs: AstNodeList, range?: Range) {
    super(Ast.TupleExpr, range);
  }

  clone(): AstNode {
    return new TupleExpression(this.exprs.clone(), this.range);
  }

  add(node: AstNode) {
    this.exprs.add(node);
  }
}

export abstract class AstVisitor<T = void> {
  dispatch: { [TNode in Ast as AstNode["id"]]: (node: AstNode) => T | void } = {
    [Ast.Null]: (curr: AstNode) => this.visitNull(curr),
    [Ast.Undefined]: (curr: AstNode) => this.visitUndefined(curr),
    [Ast.BoolLit]: (curr: AstNode) => this.visitBoolLiteral(<BoolLit>curr),
    [Ast.CharLit]: (curr: AstNode) =>
      this.visitCharacterLiteral(<CharacterLit>curr),
    [Ast.IntLit]: (curr: AstNode) => this.visitIntegerLiteral(<IntegerLit>curr),
    [Ast.FloatLit]: (curr: AstNode) => this.visitFloatLiteral(<FloatLit>curr),
    [Ast.StrLit]: (curr: AstNode) => this.visitStringLiteral(<StringLit>curr),
    [Ast.Identifier]: (curr: AstNode) => this.visitIdentifier(<Identifier>curr),
    [Ast.StrExpr]: (curr: AstNode) =>
      this.visitStringExpression(<StringExpression>curr),
    [Ast.GroupingExpr]: (curr: AstNode) =>
      this.visitGroupingExpression(<GroupingExpression>curr),
    [Ast.PrefixExpr]: (curr: AstNode) =>
      this.visitPrefixExpression(<PrefixExpression>curr),
    [Ast.PostfixExpr]: (curr: AstNode) =>
      this.visitPostfixExpression(<PostfixExpression>curr),
    [Ast.UnaryExpr]: (curr: AstNode) =>
      this.visitUnaryExpression(<UnaryExpression>curr),
    [Ast.BinaryExpr]: (curr: AstNode) =>
      this.visitBinaryExpression(<BinaryExpression>curr),
    [Ast.TernaryExpr]: (curr: AstNode) =>
      this.visitTernaryExpression(<TernaryExpression>curr),
    [Ast.AssignmentExpr]: (curr: AstNode) =>
      this.visitAssignmentExpression(<AssignmentExpression>curr),
    [Ast.CallExpr]: (curr: AstNode) =>
      this.visitCallExpression(<CallExpression>curr),
    [Ast.SpreadExpr]: (curr: AstNode) =>
      this.visitSpreadExpression(<SpreadExpression>curr),
    [Ast.YieldExpr]: (curr: AstNode) =>
      this.visitYieldExpression(<YieldExpression>curr),
    [Ast.NewExpr]: (curr: AstNode) =>
      this.visitNewExpression(<NewExpression>curr),
    [Ast.BracketExpr]: (curr: AstNode) =>
      this.visitBracketExpression(<BracketExpression>curr),
    [Ast.MemberAccessExpr]: (curr: AstNode) =>
      this.visitMemberAccessExpression(<MemberAccessExpression>curr),
    [Ast.TupleExpr]: (curr: AstNode) =>
      this.visitTupleExpression(<TupleExpression>curr),
  };

  visit(node: AstNode): T | void {
    return this.dispatch[node.id](node);
  }

  visitNull(node: AstNode): T | void {}
  visitUndefined(node: AstNode): T | void {}
  visitBoolLiteral(node: BoolLit): T | void {}
  visitCharacterLiteral(node: CharacterLit): T | void {}
  visitIntegerLiteral(node: IntegerLit): T | void {}
  visitFloatLiteral(node: FloatLit): T | void {}
  visitStringLiteral(node: StringLit): T | void {}
  visitIdentifier(node: Identifier): T | void {}
  visitStringExpression(node: StringExpression): T | void {}
  visitGroupingExpression(node: GroupingExpression): T | void {}
  visitPrefixExpression(node: PrefixExpression): T | void {}
  visitPostfixExpression(node: PostfixExpression): T | void {}
  visitUnaryExpression(node: UnaryExpression): T | void {}
  visitBinaryExpression(node: BinaryExpression): T | void {}
  visitTernaryExpression(node: TernaryExpression): T | void {}
  visitAssignmentExpression(node: AssignmentExpression): T | void {}
  visitCallExpression(node: CallExpression): T | void {}
  visitSpreadExpression(node: SpreadExpression): T | void {}
  visitYieldExpression(node: YieldExpression): T | void {}
  visitNewExpression(node: NewExpression): T | void {}
  visitBracketExpression(node: BracketExpression): T | void {}
  visitMemberAccessExpression(node: MemberAccessExpression): T | void {}
  visitTupleExpression(node: TupleExpression): T | void {}
}
