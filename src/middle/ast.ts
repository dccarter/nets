import { List, ListItem } from "../utils/list";
import { Range } from "../common/source";
import { Symbol } from "./symbol";
import { Tok } from "../frontend/token";

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
  FieldExpr,
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
  DeclMember,
  StructDecl,
  ClassDecl,
  DeclField,
  ExpressionStmt,
  TupleType,
  ArrayType,
  FuncType,
  PointerType,
  OptionalType,
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
  public symbol?: Symbol = undefined;

  constructor(
    public readonly id: Ast,
    public range?: Range,
  ) {
    super();
  }

  clone(): AstNode {
    return new AstNode(this.id, this.range);
  }

  toString() {
    return Ast[this.id];
  }

  isClassOrStruct() {
    return this.id == Ast.ClassDecl || this.id == Ast.StructDecl;
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
  constructor(
    public op: Tok,
    range?: Range,
  ) {
    super(Ast.Primitive, range);
  }

  clone(): AstNode {
    return new PrimitiveType(this.op, this.range);
  }
}

export class BoolLit extends AstNode {
  constructor(
    public value: boolean,
    range?: Range,
  ) {
    super(Ast.BoolLit, range);
  }

  clone(): AstNode {
    return new BoolLit(this.value, this.range);
  }
}

export class IntegerLit extends AstNode {
  constructor(
    public value: number,
    range?: Range,
  ) {
    super(Ast.IntLit, range);
  }

  clone(): AstNode {
    return new IntegerLit(this.value, this.range);
  }
}

export class FloatLit extends AstNode {
  constructor(
    public value: number,
    range?: Range,
  ) {
    super(Ast.FloatLit, range);
  }

  clone(): AstNode {
    return new FloatLit(this.value, this.range);
  }
}

export class StringLit extends AstNode {
  constructor(
    public value: string,
    range?: Range,
  ) {
    super(Ast.StrLit, range);
  }

  clone(): AstNode {
    return new StringLit(this.value, this.range);
  }
}

export class CharacterLit extends AstNode {
  constructor(
    public value: string,
    range?: Range,
  ) {
    super(Ast.CharLit, range);
  }

  clone(): AstNode {
    return new CharacterLit(this.value, this.range);
  }
}

export class Identifier extends AstNode {
  constructor(
    public name: string,
    range?: Range,
  ) {
    super(Ast.Identifier, range);
  }

  clone(): AstNode {
    return new Identifier(this.name, this.range);
  }
}

export class StringExpression extends AstNode {
  constructor(
    public readonly parts: AstNodeList = new AstNodeList(),
    range?: Range,
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
  constructor(
    public expr: AstNode,
    range?: Range,
  ) {
    super(Ast.GroupingExpr, range);
  }

  clone(): AstNode {
    return new GroupingExpression(this.expr.clone(), this.range);
  }
}

export class PrefixExpr extends AstNode {
  constructor(
    public op: Operation,
    public expr: AstNode,
    range?: Range,
  ) {
    super(Ast.PrefixExpr, range);
  }

  clone(): AstNode {
    return new PrefixExpr({ ...{ ...this.op } }, this.expr.clone(), this.range);
  }
}

export class PostfixExpr extends AstNode {
  constructor(
    public op: Operation,
    public expr: AstNode,
    range?: Range,
  ) {
    super(Ast.PostfixExpr, range);
  }

  clone(): AstNode {
    return new PostfixExpr({ ...this.op }, this.expr.clone(), this.range);
  }
}

export class UnaryExpr extends AstNode {
  constructor(
    public op: Operation,
    public expr: AstNode,
    range?: Range,
  ) {
    super(Ast.UnaryExpr, range);
  }

  clone(): AstNode {
    return new UnaryExpr({ ...this.op }, this.expr.clone(), this.range);
  }
}

export class BinaryExpr extends AstNode {
  constructor(
    public lhs: AstNode,
    public op: Operation,
    public rhs: AstNode,
    range?: Range,
  ) {
    super(Ast.BinaryExpr, range);
  }

  clone(): AstNode {
    return new BinaryExpr(
      this.lhs.clone(),
      { ...this.op },
      this.rhs.clone(),
      this.range,
    );
  }
}

export class TernaryExpr extends AstNode {
  constructor(
    public cond: AstNode,
    public ifFalse: AstNode,
    public ifTrue?: AstNode,
    range?: Range,
  ) {
    super(Ast.TernaryExpr, range);
  }

  clone(): AstNode {
    return new TernaryExpr(
      this.cond.clone(),
      this.ifFalse.clone(),
      this.ifTrue?.clone(),
      this.range,
    );
  }
}

export class AssignmentExpr extends AstNode {
  constructor(
    public lhs: AstNode,
    public op: Operation,
    public rhs: AstNode,
    range?: Range,
  ) {
    super(Ast.AssignmentExpr, range);
  }

  clone(): AstNode {
    return new AssignmentExpr(
      this.lhs.clone(),
      { ...this.op },
      this.rhs.clone(),
      this.range,
    );
  }
}

export class CallExpr extends AstNode {
  constructor(
    public callee: AstNode,
    public args: AstNodeList,
    range?: Range,
  ) {
    super(Ast.CallExpr, range);
  }

  clone(): AstNode {
    const expr = new CallExpr(
      this.callee.clone(),
      this.args.clone(),
      this.range,
    );

    return expr;
  }
}

export class MacroCallExpr extends AstNode {
  constructor(
    public readonly callee: AstNode,
    public readonly args?: AstNodeList,
    range?: Range,
  ) {
    super(Ast.MacroCallExpr, range);
  }

  clone(): AstNode {
    const expr = new MacroCallExpr(
      this.callee.clone(),
      this.args?.clone(),
      this.range,
    );

    return expr;
  }
}

export class SpreadExpr extends AstNode {
  constructor(
    public expr: AstNode,
    range?: Range,
  ) {
    super(Ast.SpreadExpr, range);
  }

  clone(): AstNode {
    return new SpreadExpr(this.expr.clone(), this.range);
  }
}

export class YieldExpr extends AstNode {
  constructor(
    public expr: AstNode,
    public starred?: boolean,
    range?: Range,
  ) {
    super(Ast.YieldExpr, range);
  }

  clone(): AstNode {
    return new YieldExpr(this.expr.clone(), this.starred, this.range);
  }
}

export class NewExpr extends AstNode {
  constructor(
    public expr: AstNode,
    range?: Range,
  ) {
    super(Ast.NewExpr, range);
  }

  clone(): AstNode {
    return new NewExpr(this.expr.clone(), this.range);
  }
}

export class BracketExpr extends AstNode {
  constructor(
    public target: AstNode,
    public indices: AstNodeList,
    range?: Range,
  ) {
    super(Ast.BracketExpr, range);
  }

  clone(): AstNode {
    return new BracketExpr(
      this.target.clone(),
      this.indices.clone(),
      this.range,
    );
  }
}

// .a
export class DotExpr extends AstNode {
  constructor(
    public expr: AstNode,
    range?: Range,
  ) {
    super(Ast.DotExpr, range);
  }

  clone(): AstNode {
    return new DotExpr(this.expr.clone(), this.range);
  }
}

export class MemberExpr extends AstNode {
  constructor(
    public target: AstNode,
    public op: Operation,
    public member: AstNode,
    range?: Range,
    public dot?: boolean,
  ) {
    super(Ast.MemberAccessExpr, range);
  }

  clone(): AstNode {
    return new MemberExpr(
      this.target.clone(),
      { ...this.op },
      this.member.clone(),
      this.range,
      this.dot,
    );
  }
}

export class TupleExpr extends AstNode {
  constructor(
    public elements: AstNodeList,
    range?: Range,
  ) {
    super(Ast.TupleExpr, range);
  }

  clone(): AstNode {
    return new TupleExpr(this.elements.clone(), this.range);
  }

  add(node: AstNode) {
    this.elements.add(node);
  }
}

export class StructExpr extends AstNode {
  constructor(
    public readonly lhs: AstNode,
    public readonly fields: AstNodeList,
    range?: Range,
  ) {
    super(Ast.StructExpr, range);
  }

  clone(): AstNode {
    return new StructExpr(this.lhs.clone(), this.fields.clone(), this.range);
  }

  add(node: AstNode) {
    this.fields.add(node);
  }
}

export class StructFieldExpr extends AstNode {
  #name: AstNode;
  constructor(
    name: AstNode,
    public readonly value: AstNode,
    range?: Range,
  ) {
    super(Ast.FieldExpr, range);
    this.#name = name;
  }

  clone(): AstNode {
    return new StructFieldExpr(
      this.#name.clone(),
      this.value.clone(),
      this.range,
    );
  }

  get name() {
    return <Identifier>this.#name;
  }
}

export class AttributeValue extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly value: AstNode,
    range?: Range,
  ) {
    super(Ast.AttributeValue, range);
  }

  clone(): AstNode {
    return new AttributeValue(
      this.name.clone(),
      this.value.clone(),
      this.range,
    );
  }
}

export class Attribute extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly values: AstNodeList = new AstNodeList(),
    range?: Range,
  ) {
    super(Ast.Attribute, range);
  }

  clone(): AstNode {
    return new Attribute(this.name.clone(), this.values.clone(), this.range);
  }
}

export class ArrayExpr extends AstNode {
  constructor(
    public elements: AstNodeList,
    range?: Range,
  ) {
    super(Ast.ArrayExpr, range);
  }

  clone(): AstNode {
    return new ArrayExpr(this.elements.clone(), this.range);
  }

  add(node: AstNode) {
    this.elements.add(node);
  }
}

export class SignatureExpr extends AstNode {
  constructor(
    public params: AstNode,
    public ret?: AstNode,
    range?: Range,
  ) {
    super(Ast.Signature, range);
  }

  clone(): AstNode {
    return new SignatureExpr(
      this.params.clone(),
      this.ret?.clone(),
      this.range,
    );
  }
}

export class ClosureExpr extends AstNode {
  constructor(
    public signature: AstNode,
    public body: AstNode,
    public isAsync?: boolean,
    range?: Range,
  ) {
    super(Ast.ClosureExpr, range);
  }

  clone(): AstNode {
    return new ClosureExpr(
      this.signature.clone(),
      this.body.clone(),
      this.isAsync,
      this.range,
    );
  }
}

export class TypedExpr extends AstNode {
  constructor(
    public expr: AstNode,
    public type: AstNode,
    range?: Range,
  ) {
    super(Ast.TypedExpr, range);
  }

  clone(): AstNode {
    return new TypedExpr(this.expr.clone(), this.type.clone());
  }
}

export class Declaration extends AstNode {
  constructor(
    public readonly id: Ast,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    public attrs?: AstNodeList,
  ) {
    super(id, range);
  }
}

export class VariableDecl extends Declaration {
  constructor(
    public modifier: Tok,
    public variable: AstNodeList,
    public type?: AstNode,
    public init?: AstNode,
    public isExport?: boolean,
    range?: Range,
    attrs?: AstNodeList,
  ) {
    super(Ast.VariableDecl, isExport, false, range, attrs);
  }

  clone(): AstNode {
    return new VariableDecl(
      this.modifier,
      this.variable.clone(),
      this.type?.clone(),
      this.init?.clone(),
      this.isExport,
      this.range,
      this.attrs?.clone(),
    );
  }
}

export class FunctionDecl extends Declaration {
  constructor(
    public readonly name: string,
    public readonly signature: AstNode,
    public readonly body?: AstNode,
    public readonly isAsync?: boolean,
    public readonly genericParams?: AstNodeList,
    public readonly isExport?: boolean,
    range?: Range,
    attrs?: AstNodeList,
  ) {
    super(Ast.FuncDecl, isExport, false, range, attrs);
  }

  clone(): AstNode {
    return new FunctionDecl(
      this.name,
      this.signature.clone(),
      this.body?.clone(),
      this.isAsync,
      this.genericParams?.clone(),
      this.isExport,
      this.range,
      this.attrs?.clone(),
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
    attrs?: AstNodeList,
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
      this.attrs?.clone(),
    );
  }
}

export class UnionDecl extends Declaration {
  constructor(
    public readonly name: AstNode,
    public readonly members: AstNodeList,
    public readonly params?: AstNodeList,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    attrs?: AstNodeList,
  ) {
    super(Ast.UnionDecl, isExport, isOpaque, range, attrs);
  }

  clone(): AstNode {
    return new UnionDecl(
      this.name,
      this.members.clone(),
      this.params?.clone(),
      this.isExport,
      this.isOpaque,
      this.range,
      this.attrs?.clone(),
    );
  }
}

export class EnumOption extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly value?: AstNode,
    public readonly attrs?: AstNodeList,
    range?: Range,
  ) {
    super(Ast.EnumOption, range);
  }

  clone(): AstNode {
    return new EnumOption(
      this.name?.clone(),
      this.value?.clone(),
      this.attrs?.clone(),
      this.range,
    );
  }
}

export class EnumDecl extends Declaration {
  constructor(
    public readonly name: AstNode,
    public readonly options: AstNodeList,
    public readonly base?: AstNode,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    attrs?: AstNodeList,
  ) {
    super(Ast.EnumDecl, isExport, isOpaque, range, attrs);
  }

  clone(): AstNode {
    return new EnumDecl(
      this.name,
      this.options.clone(),
      this.base?.clone(),
      this.isExport,
      this.isOpaque,
      this.range,
      this.attrs?.clone(),
    );
  }
}

export class FieldDecl extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly type: AstNode,
    public readonly value?: AstNode,
    range?: Range,
    public readonly attrs?: AstNodeList,
  ) {
    super(Ast.DeclField, range);
  }

  clone(): AstNode {
    return new FieldDecl(
      this.name.clone(),
      this.type.clone(),
      this.value?.clone(),
      this.range,
      this.attrs?.clone(),
    );
  }
}

export class MemberDecl extends AstNode {
  constructor(
    public readonly member: AstNode,
    public readonly isPrivate?: boolean,
    range?: Range,
  ) {
    super(Ast.DeclMember, range);
  }

  clone(): AstNode {
    return new MemberDecl(this.member.clone(), this.isPrivate, this.range);
  }
}

export class StructDecl extends Declaration {
  constructor(
    public readonly name: AstNode,
    public readonly fields?: AstNodeList,
    public readonly params?: AstNodeList,
    public readonly base?: AstNode,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    attrs?: AstNodeList,
  ) {
    super(Ast.StructDecl, isExport, isOpaque, range, attrs);
  }

  clone(): AstNode {
    return new StructDecl(
      this.name,
      this.fields?.clone(),
      this.params?.clone(),
      this.base?.clone(),
      this.isExport,
      this.isOpaque,
      this.range,
      this.attrs?.clone(),
    );
  }
}

export class ClassDecl extends Declaration {
  constructor(
    public readonly name: AstNode,
    public readonly members?: AstNodeList,
    public readonly params?: AstNodeList,
    public readonly base?: AstNode,
    public readonly isExport?: boolean,
    public readonly isOpaque?: boolean,
    range?: Range,
    attrs?: AstNodeList,
  ) {
    super(Ast.StructDecl, isExport, isOpaque, range, attrs);
  }

  clone(): AstNode {
    return new ClassDecl(
      this.name,
      this.members?.clone(),
      this.params?.clone(),
      this.base?.clone(),
      this.isExport,
      this.isOpaque,
      this.range,
      this.attrs?.clone(),
    );
  }
}

export class ExpressionStmt extends AstNode {
  constructor(
    public readonly expr: AstNode,
    range?: Range,
  ) {
    super(Ast.ExpressionStmt, range);
  }

  clone(): AstNode {
    return new ExpressionStmt(this.expr.clone(), this.range);
  }
}

export class CodeBlock extends AstNode {
  constructor(
    public readonly nodes: AstNodeList = new AstNodeList(),
    range?: Range,
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
  constructor(
    public readonly elements: AstNodeList,
    range?: Range,
  ) {
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
  constructor(
    public readonly params: AstNodeList,
    range?: Range,
  ) {
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
    range?: Range,
  ) {
    super(Ast.FuncParam, range);
  }

  clone(): AstNode {
    return new FunctionParam(
      this.name.clone(),
      this.type.clone(),
      this.isVariadic,
      this.range,
    );
  }
}

export class ArrayType extends AstNode {
  constructor(
    public readonly elementType: AstNode,
    public readonly size?: AstNode,
    range?: Range,
  ) {
    super(Ast.ArrayType, range);
  }

  clone(): AstNode {
    return new ArrayType(
      this.elementType.clone(),
      this.size?.clone(),
      this.range,
    );
  }
}

export class FunctionType extends AstNode {
  constructor(
    public readonly params: AstNode,
    public readonly ret: AstNode,
    public readonly isAsync?: boolean,
    range?: Range,
  ) {
    super(Ast.FuncType, range);
  }

  clone(): AstNode {
    return new FunctionType(
      this.params.clone(),
      this.ret.clone(),
      this.isAsync,
      this.range,
    );
  }
}

export class PointerType extends AstNode {
  constructor(
    public readonly pointee: AstNode,
    public readonly isConst?: boolean,
    range?: Range,
  ) {
    super(Ast.PointerType, range);
  }

  clone(): AstNode {
    return new PointerType(this.pointee.clone(), this.isConst, this.range);
  }
}

export class OptionalType extends AstNode {
  constructor(
    public readonly option: AstNode,
    range?: Range,
  ) {
    super(Ast.OptionalType, range);
  }

  clone(): AstNode {
    return new OptionalType(this.option.clone(), this.range);
  }
}

export class GenericTypeParam extends AstNode {
  constructor(
    public readonly name: AstNode,
    public readonly constraints: AstNodeList = new AstNodeList(),
    range?: Range,
  ) {
    super(Ast.GTypeParam, range);
  }

  clone(): AstNode {
    return new GenericTypeParam(
      this.name.clone(),
      this.constraints.clone(),
      this.range,
    );
  }
}

export class IfStmt extends AstNode {
  constructor(
    public readonly cond: AstNode,
    public readonly ifTrue: AstNode,
    public readonly ifFalse?: AstNode,
    range?: Range,
  ) {
    super(Ast.IfStmt, range);
  }

  clone(): AstNode {
    return new IfStmt(
      this.cond.clone(),
      this.ifTrue.clone(),
      this.ifFalse?.clone(),
      this.range,
    );
  }
}

export class WhileStmt extends AstNode {
  constructor(
    public readonly cond: AstNode,
    public readonly body: AstNode,
    range?: Range,
  ) {
    super(Ast.WhileStmt, range);
  }

  clone(): AstNode {
    return new WhileStmt(this.cond.clone(), this.body.clone(), this.range);
  }
}

export class ForStmt extends AstNode {
  constructor(
    public readonly init: AstNode,
    public readonly expr: AstNode,
    public readonly body: AstNode,
    range?: Range,
  ) {
    super(Ast.ForStmt, range);
  }

  clone(): AstNode {
    return new ForStmt(
      this.init.clone(),
      this.expr.clone(),
      this.body.clone(),
      this.range,
    );
  }
}

export class DeferStmt extends AstNode {
  constructor(
    public readonly body: AstNode,
    range?: Range,
  ) {
    super(Ast.DeferStmt, range);
  }

  clone(): AstNode {
    return new DeferStmt(this.body.clone(), this.range);
  }
}

export class ReturnStmt extends AstNode {
  constructor(
    public readonly value?: AstNode,
    range?: Range,
  ) {
    super(Ast.ReturnStmt, range);
  }

  clone(): AstNode {
    return new ReturnStmt(this.value?.clone(), this.range);
  }
}

export abstract class AstVisitor<T = void> {
  dispatch: {
    [TNode in Ast as AstNode["id"]]: (
      node: AstNode,
      parent?: AstNode,
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
      this.visitPrefixExpr(<PrefixExpr>curr, parent),
    [Ast.PostfixExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitPostfixExpr(<PostfixExpr>curr, parent),
    [Ast.UnaryExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitUnaryExpr(<UnaryExpr>curr, parent),
    [Ast.BinaryExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitBinaryExpr(<BinaryExpr>curr, parent),
    [Ast.TernaryExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitTernaryExpr(<TernaryExpr>curr, parent),
    [Ast.AssignmentExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitAssignmentExpr(<AssignmentExpr>curr, parent),
    [Ast.CallExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitCallExpr(<CallExpr>curr, parent),
    [Ast.MacroCallExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitMacroCallExpr(<MacroCallExpr>curr, parent),
    [Ast.SpreadExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitSpreadExpr(<SpreadExpr>curr, parent),
    [Ast.YieldExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitYieldExpr(<YieldExpr>curr, parent),
    [Ast.NewExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitNewExpr(<NewExpr>curr, parent),
    [Ast.BracketExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitBracketExpr(<BracketExpr>curr, parent),
    [Ast.DotExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitDotExpr(<DotExpr>curr, parent),
    [Ast.MemberAccessExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitMemberExpr(<MemberExpr>curr, parent),
    [Ast.TupleExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitTupleExpr(<TupleExpr>curr, parent),
    [Ast.FieldExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitStructFieldExpr(<StructFieldExpr>curr, parent),
    [Ast.StructExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitStructExpr(<StructExpr>curr, parent),
    [Ast.ArrayExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitArrayExpr(<ArrayExpr>curr, parent),
    [Ast.Signature]: (curr: AstNode, parent?: AstNode) =>
      this.visitSignatureExpr(<SignatureExpr>curr, parent),
    [Ast.ClosureExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitClosureExpr(<ClosureExpr>curr, parent),
    [Ast.TypedExpr]: (curr: AstNode, parent?: AstNode) =>
      this.visitTypedExpr(<TypedExpr>curr, parent),
    [Ast.VariableDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitVariableDecl(<VariableDecl>curr, parent),
    [Ast.FuncDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitFunctionDecl(<FunctionDecl>curr, parent),
    [Ast.TypeAlias]: (curr: AstNode, parent?: AstNode) =>
      this.visitTypeAlias(<TypeAlias>curr, parent),
    [Ast.UnionDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitUnionDecl(<UnionDecl>curr, parent),
    [Ast.EnumDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitEnumDecl(<EnumDecl>curr, parent),
    [Ast.EnumOption]: (curr: AstNode, parent?: AstNode) =>
      this.visitEnumOption(<EnumOption>curr, parent),
    [Ast.StructDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitStructDecl(<StructDecl>curr, parent),
    [Ast.DeclField]: (curr: AstNode, parent?: AstNode) =>
      this.visitFieldDecl(<FieldDecl>curr, parent),
    [Ast.ClassDecl]: (curr: AstNode, parent?: AstNode) =>
      this.visitClassDecl(<ClassDecl>curr, parent),
    [Ast.DeclMember]: (curr: AstNode, parent?: AstNode) =>
      this.visitMemberDecl(<MemberDecl>curr, parent),
    [Ast.ExpressionStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitExpressionStmt(<ExpressionStmt>curr, parent),
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
    [Ast.OptionalType]: (curr: AstNode, parent?: AstNode) =>
      this.visitOptionalType(<OptionalType>curr, parent),
    [Ast.GTypeParam]: (curr: AstNode, parent?: AstNode) =>
      this.visitGenericTypeParam(<GenericTypeParam>curr, parent),
    [Ast.AttributeValue]: (curr: AstNode, parent?: AstNode) =>
      this.visitAttributeValue(<AttributeValue>curr, parent),
    [Ast.Attribute]: (curr: AstNode, parent?: AstNode) =>
      this.visitAttribute(<Attribute>curr, parent),
    [Ast.IfStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitIfStmt(<IfStmt>curr, parent),
    [Ast.WhileStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitWhileStmt(<WhileStmt>curr, parent),
    [Ast.ForStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitForStmt(<ForStmt>curr, parent),
    [Ast.DeferStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitDeferStmt(<DeferStmt>curr, parent),
    [Ast.ReturnStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitReturnStmt(<ReturnStmt>curr, parent),
    [Ast.ContinueStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitContinueStmt(<AstNode>curr, parent),
    [Ast.BreakStmt]: (curr: AstNode, parent?: AstNode) =>
      this.visitContinueStmt(<AstNode>curr, parent),
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
    parent?: AstNode,
  ): T | void {}
  visitPrefixExpr(node: PrefixExpr, parent?: AstNode): T | void {}
  visitPostfixExpr(node: PostfixExpr, parent?: AstNode): T | void {}
  visitUnaryExpr(node: UnaryExpr, parent?: AstNode): T | void {}
  visitBinaryExpr(node: BinaryExpr, parent?: AstNode): T | void {}
  visitTernaryExpr(node: TernaryExpr, parent?: AstNode): T | void {}
  visitAssignmentExpr(node: AssignmentExpr, parent?: AstNode): T | void {}
  visitCallExpr(node: CallExpr, parent?: AstNode): T | void {}
  visitMacroCallExpr(node: MacroCallExpr, parent?: AstNode): T | void {}
  visitSpreadExpr(node: SpreadExpr, parent?: AstNode): T | void {}
  visitYieldExpr(node: YieldExpr, parent?: AstNode): T | void {}
  visitNewExpr(node: NewExpr, parent?: AstNode): T | void {}
  visitBracketExpr(node: BracketExpr, parent?: AstNode): T | void {}
  visitDotExpr(node: DotExpr, parent?: AstNode): T | void {}
  visitMemberExpr(node: MemberExpr, parent?: AstNode): T | void {}
  visitTupleExpr(node: TupleExpr, parent?: AstNode): T | void {}
  visitStructExpr(node: StructExpr, parent?: AstNode): T | void {}
  visitArrayExpr(node: ArrayExpr, parent?: AstNode): T | void {}
  visitSignatureExpr(node: SignatureExpr, parent?: AstNode): T | void {}
  visitClosureExpr(node: ClosureExpr, parent?: AstNode): T | void {}
  visitTypedExpr(node: TypedExpr, parent?: AstNode): T | void {}
  visitVariableDecl(node: VariableDecl, parent?: AstNode): T | void {}
  visitFunctionDecl(node: FunctionDecl, parent?: AstNode): T | void {}
  visitTypeAlias(node: TypeAlias, parent?: AstNode): T | void {}
  visitUnionDecl(node: UnionDecl, parent?: AstNode): T | void {}
  visitEnumDecl(node: EnumDecl, parent?: AstNode): T | void {}
  visitEnumOption(node: EnumOption, parent?: AstNode): T | void {}
  visitStructDecl(node: StructDecl, parent?: AstNode): T | void {}
  visitFieldDecl(node: FieldDecl, parent?: AstNode): T | void {}
  visitClassDecl(node: ClassDecl, parent?: AstNode): T | void {}
  visitMemberDecl(node: MemberDecl, parent?: AstNode): T | void {}
  visitExpressionStmt(node: ExpressionStmt, parent?: AstNode): T | void {}
  visitCodeBlock(node: CodeBlock, parent?: AstNode): T | void {}
  visitTupleType(node: TupleType, parent?: AstNode): T | void {}
  visitArrayType(node: ArrayType, parent?: AstNode): T | void {}
  visitFunctionType(node: FunctionType, parent?: AstNode): T | void {}
  visitFuncParams(node: FunctionParams, parent?: AstNode): T | void {}
  visitFuncParam(node: FunctionParam, parent?: AstNode): T | void {}
  visitPointerType(node: PointerType, parent?: AstNode): T | void {}
  visitOptionalType(node: OptionalType, parent?: AstNode): T | void {}
  visitGenericTypeParam(node: GenericTypeParam, parent?: AstNode): T | void {}
  visitStructFieldExpr(node: StructFieldExpr, parent?: AstNode): T | void {}
  visitAttributeValue(node: AttributeValue, parent?: AstNode): T | void {}
  visitAttribute(node: Attribute, parent?: AstNode): T | void {}
  visitIfStmt(node: IfStmt, parent?: AstNode): T | void {}
  visitWhileStmt(node: WhileStmt, parent?: AstNode): T | void {}
  visitForStmt(node: ForStmt, parent?: AstNode): T | void {}
  visitDeferStmt(node: DeferStmt, parent?: AstNode): T | void {}
  visitReturnStmt(node: ReturnStmt, parent?: AstNode): T | void {}
  visitContinueStmt(node: AstNode, parent?: AstNode): T | void {}
  visitBreakStmt(node: AstNode, parent?: AstNode): T | void {}
}

export function isValueDeclaration(id: Ast): boolean {
  switch (id) {
    case Ast.FuncDecl:
    case Ast.VariableDecl:
      return true;
  }
  return false;
}
