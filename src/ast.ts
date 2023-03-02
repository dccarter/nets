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
  Signature,
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

  each(func: (node: AstNode) => true | undefined) {
    var node = this.first;
    while (node) {
      if (func(node)) break;
      node = node.next;
    }
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
  constructor(
    public target: AstNode,
    public indices: AstNodeList,
    range?: Range
  ) {
    super(Ast.BracketExpr, range);
  }

  clone(): AstNode {
    return new BracketExpression(
      this.target.clone(),
      this.indices.clone(),
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

export class SignatureExpression extends AstNode {
  constructor(public params: AstNode, public ret?: AstNode, range?: Range) {
    super(Ast.Signature, range);
  }

  clone(): AstNode {
    return new SignatureExpression(
      this.params.clone(),
      this.ret?.clone(),
      this.range
    );
  }
}

export class ClosureExpression extends AstNode {
  constructor(
    public signature: AstNode,
    public body: AstNode,
    public isAsync?: boolean,
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
    public variable: AstNode,
    public type?: AstNode,
    public init?: AstNode,
    range?: Range
  ) {
    super(Ast.VariableDecl, range);
  }

  clone(): AstNode {
    return new VariableDeclaration(
      this.modifier,
      this.variable.clone(),
      this.type?.clone(),
      this.init?.clone(),
      this.range
    );
  }
}

export class FunctionDeclaration extends AstNode {
  constructor(
    public name: string,
    public signature: AstNode,
    public body: AstNode,
    public isAsync?: boolean,
    range?: Range
  ) {
    super(Ast.FuncDecl, range);
  }

  clone(): AstNode {
    return new FunctionDeclaration(
      this.name,
      this.signature.clone(),
      this.body.clone(),
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
  dispatch: {
    [TNode in Ast as AstNode["id"]]: (
      node: AstNode,
      parent?: AstNode
    ) => T | void;
  } = {
    [Ast.Null]: (curr: AstNode, parent?: AstNode) =>
      this.visitNull(curr, parent),
    [Ast.Undefined]: (curr: AstNode, parent?: AstNode) =>
      this.visitUndefined(curr, parent),
    [Ast.Program]: (curr: AstNode, parent?: AstNode) =>
      this.visitProgram(<Program>curr, parent),
    [Ast.Primitive]: (curr: AstNode, parent?: AstNode) =>
      this.visitPrimitive(<PrimitiveIdent>curr, parent),
    [Ast.BoolLit]: (curr: AstNode, parent?: AstNode) =>
      this.visitBoolLiteral(<BoolLit>curr, parent),
    [Ast.CharLit]: (curr: AstNode, parent?: AstNode) =>
      this.visitCharacterLiteral(<CharacterLit>curr, parent),
    [Ast.IntLit]: (curr: AstNode, parent?: AstNode) =>
      this.visitIntegerLiteral(<IntegerLit>curr, parent),
    [Ast.FloatLit]: (curr: AstNode, parent?: AstNode) =>
      this.visitFloatLiteral(<FloatLit>curr, parent),
    [Ast.StrLit]: (curr: AstNode, parent?: AstNode) =>
      this.visitStringLiteral(<StringLit>curr, parent),
    [Ast.Identifier]: (curr: AstNode, parent?: AstNode) =>
      this.visitIdentifier(<Identifier>curr, parent),
    [Ast.StrExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitStringExpression(<StringExpression>curr, parent),
    [Ast.GroupingExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitGroupingExpression(<GroupingExpression>curr, parent),
    [Ast.PrefixExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitPrefixExpression(<PrefixExpression>curr, parent),
    [Ast.PostfixExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitPostfixExpression(<PostfixExpression>curr, parent),
    [Ast.UnaryExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitUnaryExpression(<UnaryExpression>curr, parent),
    [Ast.BinaryExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitBinaryExpression(<BinaryExpression>curr, parent),
    [Ast.TernaryExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitTernaryExpression(<TernaryExpression>curr, parent),
    [Ast.AssignmentExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitAssignmentExpression(<AssignmentExpression>curr, parent),
    [Ast.CallExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitCallExpression(<CallExpression>curr, parent),
    [Ast.SpreadExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitSpreadExpression(<SpreadExpression>curr, parent),
    [Ast.YieldExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitYieldExpression(<YieldExpression>curr, parent),
    [Ast.NewExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitNewExpression(<NewExpression>curr, parent),
    [Ast.BracketExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitBracketExpression(<BracketExpression>curr, parent),
    [Ast.DotExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitDotExpression(<DotExpression>curr, parent),
    [Ast.MemberAccessExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitMemberAccessExpression(<MemberAccessExpression>curr, parent),
    [Ast.TupleExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitTupleLitExpression(<TupleExpression>curr, parent),
    [Ast.StructLitExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitStructLitExpression(<StructLitExpression>curr, parent),
    [Ast.ArrayLitExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitArrayLitExpression(<ArrayLitExpression>curr, parent),
    [Ast.Signature]: (curr: AstNode, parent?: AstNode) =>
      this.visitSignatureExpression(<SignatureExpression>curr, parent),
    [Ast.ClosureExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitClosureExpression(<ClosureExpression>curr, parent),
    [Ast.VariableDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitVariableDeclaration(<VariableDeclaration>curr, parent),
    [Ast.FuncDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitFunctionDeclaration(<FunctionDeclaration>curr, parent),
    [Ast.ExpressionStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitExpressionStatement(<ExpressionStatement>curr, parent),
    [Ast.Block]: (curr: AstNode, parent?: AstNode) =>
      this.visitCodeBlock(<CodeBlock>curr, parent),
  };

  visit(node: AstNode, parent?: AstNode): T | void {
    return this.dispatch[node.id](node, parent);
  }

  visitProgram(node: Program, parent?: AstNode): T | void {}
  visitNull(node: AstNode, parent?: AstNode): T | void {}
  visitUndefined(node: AstNode, parent?: AstNode): T | void {}
  visitPrimitive(node: PrimitiveIdent, parent?: AstNode): T | void {}
  visitBoolLiteral(node: BoolLit, parent?: AstNode): T | void {}
  visitCharacterLiteral(node: CharacterLit, parent?: AstNode): T | void {}
  visitIntegerLiteral(node: IntegerLit, parent?: AstNode): T | void {}
  visitFloatLiteral(node: FloatLit, parent?: AstNode): T | void {}
  visitStringLiteral(node: StringLit, parent?: AstNode): T | void {}
  visitIdentifier(node: Identifier, parent?: AstNode): T | void {}
  visitStringExpression(node: StringExpression, parent?: AstNode): T | void {}
  visitGroupingExpression(
    node: GroupingExpression,
    parent?: AstNode
  ): T | void {}
  visitPrefixExpression(node: PrefixExpression, parent?: AstNode): T | void {}
  visitPostfixExpression(node: PostfixExpression, parent?: AstNode): T | void {}
  visitUnaryExpression(node: UnaryExpression, parent?: AstNode): T | void {}
  visitBinaryExpression(node: BinaryExpression, parent?: AstNode): T | void {}
  visitTernaryExpression(node: TernaryExpression, parent?: AstNode): T | void {}
  visitAssignmentExpression(
    node: AssignmentExpression,
    parent?: AstNode
  ): T | void {}
  visitCallExpression(node: CallExpression, parent?: AstNode): T | void {}
  visitSpreadExpression(node: SpreadExpression, parent?: AstNode): T | void {}
  visitYieldExpression(node: YieldExpression, parent?: AstNode): T | void {}
  visitNewExpression(node: NewExpression, parent?: AstNode): T | void {}
  visitBracketExpression(node: BracketExpression, parent?: AstNode): T | void {}
  visitDotExpression(node: DotExpression, parent?: AstNode): T | void {}
  visitMemberAccessExpression(
    node: MemberAccessExpression,
    parent?: AstNode
  ): T | void {}
  visitTupleLitExpression(node: TupleExpression, parent?: AstNode): T | void {}
  visitStructLitExpression(
    node: StructLitExpression,
    parent?: AstNode
  ): T | void {}
  visitArrayLitExpression(
    node: ArrayLitExpression,
    parent?: AstNode
  ): T | void {}
  visitSignatureExpression(
    node: SignatureExpression,
    parent?: AstNode
  ): T | void {}
  visitClosureExpression(node: ClosureExpression, parent?: AstNode): T | void {}
  visitVariableDeclaration(
    node: VariableDeclaration,
    parent?: AstNode
  ): T | void {}
  visitFunctionDeclaration(
    node: FunctionDeclaration,
    parent?: AstNode
  ): T | void {}
  visitExpressionStatement(
    node: ExpressionStatement,
    parent?: AstNode
  ): T | void {}
  visitCodeBlock(node: CodeBlock, parent?: AstNode): T | void {}
}
