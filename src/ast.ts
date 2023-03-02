import { Range } from "./source";
import { Tok } from "./token";

export enum Ast {
  Null,
  Undefined,
  Program,
  Primitive,
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
  DotExpr,
  MemberAccessExpr,
  TupleExpr,
  StructLitExpr,
  ArrayLitExpr,
  ClosureExpr,
  Block,
  VariableDecl,
  FuncDecl,
  ExpressionStmt,
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

export class Program extends AstNode {
  constructor(public readonly nodes: AstNodeList = new AstNodeList()) {
    super(Ast.Program);
  }

  add(node: AstNode) {
    this.nodes.add(node);
  }

  clone(): AstNode {
    return new Program(this.nodes.clone());
  }
}

export class PrimitiveIdent extends AstNode {
  constructor(public tok: Tok, range?: Range) {
    super(Ast.Primitive, range);
  }

  clone(): AstNode {
    return new PrimitiveIdent(this.tok, this.range);
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

// .a
export class DotExpression extends AstNode {
  constructor(public expr: AstNode, range?: Range) {
    super(Ast.DotExpr, range);
  }

  clone(): AstNode {
    return new DotExpression(this.expr.clone(), this.range);
  }
}

export class MemberAccessExpression extends AstNode {
  constructor(
    public target: AstNode,
    public op: Tok,
    public member: AstNode,
    range?: Range,
    public dot?: boolean
  ) {
    super(Ast.MemberAccessExpr, range);
  }

  clone(): AstNode {
    return new MemberAccessExpression(
      this.target.clone(),
      this.op,
      this.member.clone(),
      this.range,
      this.dot
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

export class StructLitExpression extends AstNode {
  constructor(public exprs: AstNodeList, range?: Range) {
    super(Ast.StructLitExpr, range);
  }

  clone(): AstNode {
    return new StructLitExpression(this.exprs.clone(), this.range);
  }

  add(node: AstNode) {
    this.exprs.add(node);
  }
}

export class ArrayLitExpression extends AstNode {
  constructor(public exprs: AstNodeList, range?: Range) {
    super(Ast.ArrayLitExpr, range);
  }

  clone(): AstNode {
    return new ArrayLitExpression(this.exprs.clone(), this.range);
  }

  add(node: AstNode) {
    this.exprs.add(node);
  }
}

export class ClosureExpression extends AstNode {
  constructor(
    public signature: AstNode,
    public body: AstNode,
    public isAsync: boolean,
    range?: Range
  ) {
    super(Ast.ClosureExpr, range);
  }

  clone(): AstNode {
    return new ClosureExpression(
      this.signature.clone(),
      this.body.clone(),
      this.isAsync,
      this.range
    );
  }
}

export class VariableDeclaration extends AstNode {
  constructor(
    public modifier: Tok,
    public varible: AstNode,
    public type?: AstNode,
    public init?: AstNode,
    range?: Range
  ) {
    super(Ast.VariableDecl, range);
  }

  clone(): AstNode {
    return new VariableDeclaration(
      this.modifier,
      this.varible.clone(),
      this.type ? this.type.clone() : undefined,
      this.init ? this.init.clone() : undefined,
      this.range
    );
  }
}

export class FunctionDeclaration extends AstNode {
  constructor(
    public name: string,
    public args: AstNode,
    public body: AstNode,
    public ret?: AstNode,
    public isAsync?: boolean,
    range?: Range
  ) {
    super(Ast.FuncDecl, range);
  }

  clone(): AstNode {
    return new FunctionDeclaration(
      this.name,
      this.args.clone(),
      this.body.clone(),
      this.ret ? this.ret.clone() : undefined,
      this.isAsync,
      this.range
    );
  }
}

export class ExpressionStatement extends AstNode {
  constructor(public readonly expr: AstNode, range?: Range) {
    super(Ast.ExpressionStmt, range);
  }

  clone(): AstNode {
    return new ExpressionStatement(this.expr.clone(), this.range);
  }
}

export class CodeBlock extends AstNode {
  constructor(
    public readonly nodes: AstNodeList = new AstNodeList(),
    range?: Range
  ) {
    super(Ast.Block, range);
  }

  clone(): AstNode {
    return new CodeBlock(this.nodes.clone(), this.range);
  }

  add(node: AstNode) {
    this.nodes.add(node);
  }
}

export abstract class AstVisitor<T = void> {
  dispatch: { [TNode in Ast as AstNode["id"]]: (node: AstNode) => T | void } = {
    [Ast.Null]: (curr: AstNode) => this.visitNull(curr),
    [Ast.Undefined]: (curr: AstNode) => this.visitUndefined(curr),
    [Ast.Program]: (curr: AstNode) => this.visitProgram(<Program>curr),
    [Ast.Primitive]: (curr: AstNode) =>
      this.visitPrimitive(<PrimitiveIdent>curr),
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
    [Ast.DotExpr]: (curr: AstNode) =>
      this.visitDotExpression(<DotExpression>curr),
    [Ast.MemberAccessExpr]: (curr: AstNode) =>
      this.visitMemberAccessExpression(<MemberAccessExpression>curr),
    [Ast.TupleExpr]: (curr: AstNode) =>
      this.visitTupleLitExpression(<TupleExpression>curr),
    [Ast.StructLitExpr]: (curr: AstNode) =>
      this.visitStructLitExpression(<StructLitExpression>curr),
    [Ast.ArrayLitExpr]: (curr: AstNode) =>
      this.visitArrayLitExpression(<ArrayLitExpression>curr),
    [Ast.ClosureExpr]: (curr: AstNode) =>
      this.visitClosureExpression(<ClosureExpression>curr),
    [Ast.VariableDecl]: (curr: AstNode) =>
      this.visitVariableDeclaration(<VariableDeclaration>curr),
    [Ast.FuncDecl]: (curr: AstNode) =>
      this.visitFunctionDeclaration(<FunctionDeclaration>curr),
    [Ast.ExpressionStmt]: (curr: AstNode) =>
      this.visitExpressionStatement(<ExpressionStatement>curr),
    [Ast.Block]: (curr: AstNode) => this.visitCodeBlock(<CodeBlock>curr),
  };

  visit(node: AstNode): T | void {
    return this.dispatch[node.id](node);
  }

  visitProgram(node: Program): T | void {}
  visitNull(node: AstNode): T | void {}
  visitUndefined(node: AstNode): T | void {}
  visitPrimitive(node: PrimitiveIdent): T | void {}
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
  visitDotExpression(node: DotExpression): T | void {}
  visitMemberAccessExpression(node: MemberAccessExpression): T | void {}
  visitTupleLitExpression(node: TupleExpression): T | void {}
  visitStructLitExpression(node: StructLitExpression): T | void {}
  visitArrayLitExpression(node: ArrayLitExpression): T | void {}
  visitClosureExpression(node: ClosureExpression): T | void {}
  visitVariableDeclaration(node: VariableDeclaration): T | void {}
  visitFunctionDeclaration(node: FunctionDeclaration): T | void {}
  visitExpressionStatement(node: ExpressionStatement): T | void {}
  visitCodeBlock(node: CodeBlock): T | void {}
}
