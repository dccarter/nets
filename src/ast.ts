import { List, ListItem } from "./list";
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
  MacroCallExpr,
  SpreadExpr,
  YieldExpr,
  NewExpr,
  BracketExpr,
  DotExpr,
  MemberAccessExpr,
  TupleExpr,
  StructExpr,
  ArrayExpr,
  StructFieldExpr,
  TypedExpr,
  Signature,
  ClosureExpr,
  Block,
  VariableDecl,
  FuncDecl,
  UnionDecl,
  TypeAlias,
  EnumDecl,
  EnumOption,
  StructDecl,
  StructField,
  ExpressionStmt,
  TupleType,
  ArrayType,
  FuncType,
  PointerType,
  GTypeParam,
  AttributeValue,
  Attribute,
  FuncParams,
  FuncParam,
  IfStmt,
  WhileStmt,
  ForStmt,
  DeferStmt,
  ReturnStmt,
  ContinueStmt,
  BreakStmt,
}

export interface Operation {
  id: Tok;
  range?: Range;
}

export class AstNode extends ListItem {
  public parent?: AstNode = undefined;

  constructor(public readonly id: Ast, public range?: Range) {
    super();
  }

  clone(): AstNode {
    return new AstNode(this.id, this.range);
  }

  toString() {
    return Ast[this.id];
  }
}

export class AstNodeList extends List<AstNode> {}

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

export class PrimitiveType extends AstNode {
  constructor(public op: Tok, range?: Range) {
    super(Ast.Primitive, range);
  }

  clone(): AstNode {
    return new PrimitiveType(this.op, this.range);
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
  constructor(
    public readonly parts: AstNodeList = new AstNodeList(),
    range?: Range
  ) {
    super(Ast.StrExpr, range);
  }

  add(part: AstNode) {
    this.parts.add(part);
  }

  clone(): AstNode {
    return new StringExpression(this.parts.clone(), this.range);
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
  constructor(public op: Operation, public expr: AstNode, range?: Range) {
    super(Ast.PrefixExpr, range);
  }

  clone(): AstNode {
    return new PrefixExpression(
      { ...{ ...this.op } },
      this.expr.clone(),
      this.range
    );
  }
}

export class PostfixExpression extends AstNode {
  constructor(public op: Operation, public expr: AstNode, range?: Range) {
    super(Ast.PostfixExpr, range);
  }

  clone(): AstNode {
    return new PostfixExpression({ ...this.op }, this.expr.clone(), this.range);
  }
}

export class UnaryExpression extends AstNode {
  constructor(public op: Operation, public expr: AstNode, range?: Range) {
    super(Ast.UnaryExpr, range);
  }

  clone(): AstNode {
    return new UnaryExpression({ ...this.op }, this.expr.clone(), this.range);
  }
}

export class BinaryExpression extends AstNode {
  constructor(
    public lhs: AstNode,
    public op: Operation,
    public rhs: AstNode,
    range?: Range
  ) {
    super(Ast.BinaryExpr, range);
  }

  clone(): AstNode {
    return new BinaryExpression(
      this.lhs.clone(),
      { ...this.op },
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
    public op: Operation,
    public rhs: AstNode,
    range?: Range
  ) {
    super(Ast.AssignmentExpr, range);
  }

  clone(): AstNode {
    return new AssignmentExpression(
      this.lhs.clone(),
      { ...this.op },
      this.rhs.clone(),
      this.range
    );
  }
}

export class CallExpression extends AstNode {
  constructor(public callee: AstNode, public args: AstNodeList, range?: Range) {
    super(Ast.CallExpr, range);
  }

  clone(): AstNode {
    const expr = new CallExpression(
      this.callee.clone(),
      this.args.clone(),
      this.range
    );

    return expr;
  }
}

export class MacroCallExpression extends AstNode {
  constructor(
    public readonly callee: AstNode,
    public readonly args?: AstNodeList,
    range?: Range
  ) {
    super(Ast.MacroCallExpr, range);
  }

  clone(): AstNode {
    const expr = new MacroCallExpression(
      this.callee.clone(),
      this.args?.clone(),
      this.range
    );

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
    public op: Operation,
    public member: AstNode,
    range?: Range,
    public dot?: boolean
  ) {
    super(Ast.MemberAccessExpr, range);
  }

  clone(): AstNode {
    return new MemberAccessExpression(
      this.target.clone(),
      { ...this.op },
      this.member.clone(),
      this.range,
      this.dot
    );
  }
}

export class TupleExpression extends AstNode {
  constructor(public elements: AstNodeList, range?: Range) {
    super(Ast.TupleExpr, range);
  }

  clone(): AstNode {
    return new TupleExpression(this.elements.clone(), this.range);
  }

  add(node: AstNode) {
    this.elements.add(node);
  }
}

export class StructExpression extends AstNode {
  constructor(
    public readonly lhs: AstNode,
    public readonly fields: AstNodeList,
    range?: Range
  ) {
    super(Ast.StructExpr, range);
  }

  clone(): AstNode {
    return new StructExpression(
      this.lhs.clone(),
      this.fields.clone(),
      this.range
    );
  }

  add(node: AstNode) {
    this.fields.add(node);
  }
}

export class StructFieldExpression extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly value: AstNode,
    range?: Range
  ) {
    super(Ast.StructFieldExpr, range);
  }

  clone(): AstNode {
    return new StructFieldExpression(
      this.name.clone(),
      this.value.clone(),
      this.range
    );
  }
}

export class AttributeValue extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly value: AstNode,
    range?: Range
  ) {
    super(Ast.AttributeValue, range);
  }

  clone(): AstNode {
    return new AttributeValue(
      this.name.clone(),
      this.value.clone(),
      this.range
    );
  }
}

export class Attribute extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly values: AstNodeList = new AstNodeList(),
    range?: Range
  ) {
    super(Ast.Attribute, range);
  }

  clone(): AstNode {
    return new Attribute(this.name.clone(), this.values.clone(), this.range);
  }
}

export class ArrayExpression extends AstNode {
  constructor(public elements: AstNodeList, range?: Range) {
    super(Ast.ArrayExpr, range);
  }

  clone(): AstNode {
    return new ArrayExpression(this.elements.clone(), this.range);
  }

  add(node: AstNode) {
    this.elements.add(node);
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

export class TypedExpression extends AstNode {
  constructor(public expr: AstNode, public type: AstNode, range?: Range) {
    super(Ast.TypedExpr, range);
  }

  clone(): AstNode {
    return new TypedExpression(this.expr.clone(), this.type.clone());
  }
}

export class Declaration extends AstNode {
  constructor(
    public readonly id: Ast,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    public attrs?: AstNodeList
  ) {
    super(id, range);
  }
}

export class VariableDeclaration extends Declaration {
  constructor(
    public modifier: Tok,
    public variable: AstNodeList,
    public type?: AstNode,
    public init?: AstNode,
    public isExport?: boolean,
    range?: Range,
    attrs?: AstNodeList
  ) {
    super(Ast.VariableDecl, isExport, false, range, attrs);
  }

  clone(): AstNode {
    return new VariableDeclaration(
      this.modifier,
      this.variable.clone(),
      this.type?.clone(),
      this.init?.clone(),
      this.isExport,
      this.range,
      this.attrs?.clone()
    );
  }
}

export class FunctionDeclaration extends Declaration {
  constructor(
    public readonly name: string,
    public readonly signature: AstNode,
    public readonly body?: AstNode,
    public readonly isAsync?: boolean,
    public readonly genericParams?: AstNodeList,
    public readonly isExport?: boolean,
    range?: Range,
    attrs?: AstNodeList
  ) {
    super(Ast.FuncDecl, isExport, false, range, attrs);
  }

  clone(): AstNode {
    return new FunctionDeclaration(
      this.name,
      this.signature.clone(),
      this.body?.clone(),
      this.isAsync,
      this.genericParams?.clone(),
      this.isExport,
      this.range,
      this.attrs?.clone()
    );
  }
}

export class TypeAlias extends Declaration {
  constructor(
    public readonly name: AstNode,
    public readonly aliased: AstNode,
    public readonly params?: AstNodeList,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    attrs?: AstNodeList
  ) {
    super(Ast.TypeAlias, isExport, isOpaque, range, attrs);
  }

  clone(): AstNode {
    return new TypeAlias(
      this.name,
      this.aliased.clone(),
      this.params?.clone(),
      this.isExport,
      this.isOpaque,
      this.range,
      this.attrs?.clone()
    );
  }
}

export class UnionDeclaration extends Declaration {
  constructor(
    public readonly name: AstNode,
    public readonly members: AstNodeList,
    public readonly params?: AstNodeList,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    attrs?: AstNodeList
  ) {
    super(Ast.UnionDecl, isExport, isOpaque, range, attrs);
  }

  clone(): AstNode {
    return new UnionDeclaration(
      this.name,
      this.members.clone(),
      this.params?.clone(),
      this.isExport,
      this.isOpaque,
      this.range,
      this.attrs?.clone()
    );
  }
}

export class EnumOption extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly value?: AstNode,
    public readonly attrs?: AstNodeList,
    range?: Range
  ) {
    super(Ast.EnumOption, range);
  }

  clone(): AstNode {
    return new EnumOption(
      this.name,
      this.value,
      this.attrs?.clone(),
      this.range
    );
  }
}

export class EnumDeclaration extends Declaration {
  constructor(
    public readonly name: AstNode,
    public readonly options: AstNodeList,
    public readonly base?: AstNode,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    attrs?: AstNodeList
  ) {
    super(Ast.EnumDecl, isExport, isOpaque, range, attrs);
  }

  clone(): AstNode {
    return new EnumDeclaration(
      this.name,
      this.options.clone(),
      this.base?.clone(),
      this.isExport,
      this.isOpaque,
      this.range,
      this.attrs?.clone()
    );
  }
}

export class StructField extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly type: AstNode,
    public readonly value?: AstNode,
    public readonly attrs?: AstNodeList,
    range?: Range
  ) {
    super(Ast.StructField, range);
  }

  clone(): AstNode {
    return new EnumOption(
      this.name,
      this.value,
      this.attrs?.clone(),
      this.range
    );
  }
}

export class StructDeclaration extends Declaration {
  constructor(
    public readonly name: AstNode,
    public readonly fields?: AstNodeList,
    public readonly params?: AstNodeList,
    public readonly base?: AstNode,
    public readonly isTupleLike?: boolean,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    attrs?: AstNodeList
  ) {
    super(Ast.StructDecl, isExport, isOpaque, range, attrs);
  }

  clone(): AstNode {
    return new StructDeclaration(
      this.name,
      this.fields?.clone(),
      this.params?.clone(),
      this.base?.clone(),
      this.isTupleLike,
      this.isExport,
      this.isOpaque,
      this.range,
      this.attrs?.clone()
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

export class TupleType extends AstNode {
  constructor(public readonly elements: AstNodeList, range?: Range) {
    super(Ast.TupleType, range);
  }

  clone(): AstNode {
    return new TupleType(this.elements.clone(), this.range);
  }

  add(node: AstNode) {
    this.elements.add(node);
  }
}

export class FunctionParams extends AstNode {
  constructor(public readonly params: AstNodeList, range?: Range) {
    super(Ast.FuncParams, range);
  }

  clone(): AstNode {
    return new FunctionParams(this.params.clone(), this.range);
  }

  add(node: AstNode) {
    this.params.add(node);
  }
}

export class FunctionParam extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly type: AstNode,
    public readonly isVariadic?: boolean,
    range?: Range
  ) {
    super(Ast.FuncParam, range);
  }

  clone(): AstNode {
    return new FunctionParam(
      this.name.clone(),
      this.type.clone(),
      this.isVariadic,
      this.range
    );
  }
}

export class ArrayType extends AstNode {
  constructor(
    public readonly elementType: AstNode,
    public readonly size?: AstNode,
    range?: Range
  ) {
    super(Ast.ArrayType, range);
  }

  clone(): AstNode {
    return new ArrayType(
      this.elementType.clone(),
      this.size?.clone(),
      this.range
    );
  }
}

export class FunctionType extends AstNode {
  constructor(
    public readonly params: AstNode,
    public readonly ret: AstNode,
    public readonly typeParams: AstNodeList = new AstNodeList(),
    public readonly isAsync?: boolean,
    range?: Range
  ) {
    super(Ast.FuncType, range);
  }

  clone(): AstNode {
    return new FunctionType(
      this.params.clone(),
      this.ret.clone(),
      this.typeParams.clone(),
      this.isAsync,
      this.range
    );
  }
}

export class PointerType extends AstNode {
  constructor(
    public readonly pointee: AstNode,
    public readonly isConst?: boolean,
    range?: Range
  ) {
    super(Ast.PointerType, range);
  }

  clone(): AstNode {
    return new PointerType(this.pointee.clone(), this.isConst, this.range);
  }
}

export class GenericTypeParam extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly constraints: AstNodeList = new AstNodeList(),
    range?: Range
  ) {
    super(Ast.GTypeParam, range);
  }

  clone(): AstNode {
    return new GenericTypeParam(
      this.name.clone(),
      this.constraints.clone(),
      this.range
    );
  }
}

export class IfStatement extends AstNode {
  constructor(
    public readonly cond: AstNode,
    public readonly ifTrue: AstNode,
    public readonly ifFalse?: AstNode,
    range?: Range
  ) {
    super(Ast.IfStmt, range);
  }

  clone(): AstNode {
    return new IfStatement(
      this.cond.clone(),
      this.ifTrue.clone(),
      this.ifFalse?.clone(),
      this.range
    );
  }
}

export class WhileStatement extends AstNode {
  constructor(
    public readonly cond: AstNode,
    public readonly body: AstNode,
    range?: Range
  ) {
    super(Ast.WhileStmt, range);
  }

  clone(): AstNode {
    return new WhileStatement(this.cond.clone(), this.body.clone(), this.range);
  }
}

export class ForStatement extends AstNode {
  constructor(
    public readonly init: AstNode,
    public readonly expr: AstNode,
    public readonly body: AstNode,
    range?: Range
  ) {
    super(Ast.ForStmt, range);
  }

  clone(): AstNode {
    return new ForStatement(
      this.init.clone(),
      this.expr.clone(),
      this.body.clone(),
      this.range
    );
  }
}

export class DeferStatement extends AstNode {
  constructor(public readonly body: AstNode, range?: Range) {
    super(Ast.DeferStmt, range);
  }

  clone(): AstNode {
    return new DeferStatement(this.body.clone(), this.range);
  }
}

export class ReturnStatement extends AstNode {
  constructor(public readonly value?: AstNode, range?: Range) {
    super(Ast.ReturnStmt, range);
  }

  clone(): AstNode {
    return new ReturnStatement(this.value?.clone(), this.range);
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
      this.visitPrimitive(<PrimitiveType>curr, parent),
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
    [Ast.MacroCallExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitMacroCallExpression(<MacroCallExpression>curr, parent),
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
      this.visitTupleExpression(<TupleExpression>curr, parent),
    [Ast.StructFieldExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitStructFieldExpression(<StructFieldExpression>curr, parent),
    [Ast.StructExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitStructExpression(<StructExpression>curr, parent),
    [Ast.ArrayExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitArrayLitExpression(<ArrayExpression>curr, parent),
    [Ast.Signature]: (curr: AstNode, parent?: AstNode) =>
      this.visitSignatureExpression(<SignatureExpression>curr, parent),
    [Ast.ClosureExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitClosureExpression(<ClosureExpression>curr, parent),
    [Ast.TypedExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitTypedExpression(<TypedExpression>curr, parent),
    [Ast.VariableDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitVariableDeclaration(<VariableDeclaration>curr, parent),
    [Ast.FuncDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitFunctionDeclaration(<FunctionDeclaration>curr, parent),
    [Ast.TypeAlias]: (curr: AstNode, parent?: AstNode) =>
      this.visitTypeAlias(<TypeAlias>curr, parent),
    [Ast.UnionDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitUnionDeclaration(<UnionDeclaration>curr, parent),
    [Ast.EnumDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitEnumDeclaration(<EnumDeclaration>curr, parent),
    [Ast.EnumOption]: (curr: AstNode, parent?: AstNode) =>
      this.visitEnumOption(<EnumOption>curr, parent),
    [Ast.StructDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitStructDeclaration(<StructDeclaration>curr, parent),
    [Ast.StructField]: (curr: AstNode, parent?: AstNode) =>
      this.visitStructField(<StructField>curr, parent),
    [Ast.ExpressionStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitExpressionStatement(<ExpressionStatement>curr, parent),
    [Ast.Block]: (curr: AstNode, parent?: AstNode) =>
      this.visitCodeBlock(<CodeBlock>curr, parent),
    [Ast.TupleType]: (curr: AstNode, parent?: AstNode) =>
      this.visitTupleType(<TupleType>curr, parent),
    [Ast.ArrayType]: (curr: AstNode, parent?: AstNode) =>
      this.visitArrayType(<ArrayType>curr, parent),
    [Ast.FuncType]: (curr: AstNode, parent?: AstNode) =>
      this.visitFunctionType(<FunctionType>curr, parent),
    [Ast.FuncParams]: (curr: AstNode, parent?: AstNode) =>
      this.visitFuncParams(<FunctionParams>curr, parent),
    [Ast.FuncParam]: (curr: AstNode, parent?: AstNode) =>
      this.visitFuncParam(<FunctionParam>curr, parent),
    [Ast.PointerType]: (curr: AstNode, parent?: AstNode) =>
      this.visitPointerType(<PointerType>curr, parent),
    [Ast.GTypeParam]: (curr: AstNode, parent?: AstNode) =>
      this.visitGenericTypeParam(<GenericTypeParam>curr, parent),
    [Ast.AttributeValue]: (curr: AstNode, parent?: AstNode) =>
      this.visitAttributeValue(<AttributeValue>curr, parent),
    [Ast.Attribute]: (curr: AstNode, parent?: AstNode) =>
      this.visitAttribute(<Attribute>curr, parent),
    [Ast.IfStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitIfStatement(<IfStatement>curr, parent),
    [Ast.WhileStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitWhileStatement(<WhileStatement>curr, parent),
    [Ast.ForStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitForStatement(<ForStatement>curr, parent),
    [Ast.DeferStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitDeferStatement(<DeferStatement>curr, parent),
    [Ast.ReturnStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitReturnStatement(<ReturnStatement>curr, parent),
    [Ast.ContinueStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitContinueStatement(<AstNode>curr, parent),
    [Ast.BreakStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitContinueStatement(<AstNode>curr, parent),
  };

  visit(node: AstNode, parent?: AstNode): T | void {
    return this.dispatch[node.id](node, parent);
  }

  visitProgram(node: Program, parent?: AstNode): T | void {}
  visitNull(node: AstNode, parent?: AstNode): T | void {}
  visitUndefined(node: AstNode, parent?: AstNode): T | void {}
  visitPrimitive(node: PrimitiveType, parent?: AstNode): T | void {}
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
  visitMacroCallExpression(
    node: MacroCallExpression,
    parent?: AstNode
  ): T | void {}
  visitSpreadExpression(node: SpreadExpression, parent?: AstNode): T | void {}
  visitYieldExpression(node: YieldExpression, parent?: AstNode): T | void {}
  visitNewExpression(node: NewExpression, parent?: AstNode): T | void {}
  visitBracketExpression(node: BracketExpression, parent?: AstNode): T | void {}
  visitDotExpression(node: DotExpression, parent?: AstNode): T | void {}
  visitMemberAccessExpression(
    node: MemberAccessExpression,
    parent?: AstNode
  ): T | void {}
  visitTupleExpression(node: TupleExpression, parent?: AstNode): T | void {}
  visitStructExpression(node: StructExpression, parent?: AstNode): T | void {}
  visitArrayLitExpression(node: ArrayExpression, parent?: AstNode): T | void {}
  visitSignatureExpression(
    node: SignatureExpression,
    parent?: AstNode
  ): T | void {}
  visitClosureExpression(node: ClosureExpression, parent?: AstNode): T | void {}
  visitTypedExpression(node: TypedExpression, parent?: AstNode): T | void {}
  visitVariableDeclaration(
    node: VariableDeclaration,
    parent?: AstNode
  ): T | void {}
  visitFunctionDeclaration(
    node: FunctionDeclaration,
    parent?: AstNode
  ): T | void {}
  visitTypeAlias(node: TypeAlias, parent?: AstNode): T | void {}
  visitUnionDeclaration(node: UnionDeclaration, parent?: AstNode): T | void {}
  visitEnumDeclaration(node: EnumDeclaration, parent?: AstNode): T | void {}
  visitEnumOption(node: EnumOption, parent?: AstNode): T | void {}
  visitStructDeclaration(node: StructDeclaration, parent?: AstNode): T | void {}
  visitStructField(node: StructField, parent?: AstNode): T | void {}
  visitExpressionStatement(
    node: ExpressionStatement,
    parent?: AstNode
  ): T | void {}
  visitCodeBlock(node: CodeBlock, parent?: AstNode): T | void {}
  visitTupleType(node: TupleType, parent?: AstNode): T | void {}
  visitArrayType(node: ArrayType, parent?: AstNode): T | void {}
  visitFunctionType(node: FunctionType, parent?: AstNode): T | void {}
  visitFuncParams(node: FunctionParams, parent?: AstNode): T | void {}
  visitFuncParam(node: FunctionParam, parent?: AstNode): T | void {}
  visitPointerType(node: PointerType, parent?: AstNode): T | void {}
  visitGenericTypeParam(node: GenericTypeParam, parent?: AstNode): T | void {}
  visitStructFieldExpression(
    node: StructFieldExpression,
    parent?: AstNode
  ): T | void {}
  visitAttributeValue(node: AttributeValue, parent?: AstNode): T | void {}
  visitAttribute(node: Attribute, parent?: AstNode): T | void {}
  visitIfStatement(node: IfStatement, parent?: AstNode): T | void {}
  visitWhileStatement(node: WhileStatement, parent?: AstNode): T | void {}
  visitForStatement(node: ForStatement, parent?: AstNode): T | void {}
  visitDeferStatement(node: DeferStatement, parent?: AstNode): T | void {}
  visitReturnStatement(node: ReturnStatement, parent?: AstNode): T | void {}
  visitContinueStatement(node: AstNode, parent?: AstNode): T | void {}
  visitBreakStatement(node: AstNode, parent?: AstNode): T | void {}
}

export function isValueDeclaration(id: Ast): boolean {
  switch (id) {
    case Ast.FuncDecl:
    case Ast.VariableDecl:
      return true;
  }
  return false;
}
