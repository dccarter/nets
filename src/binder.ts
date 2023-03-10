import {
  AstNode,
  AstNodeList,
  AstVisitor,
  BreakStatement,
  CodeBlock,
  EnumDeclaration,
  ForStatement,
  FunctionDeclaration,
  FunctionParam,
  Identifier,
  IfStatement,
  MemberAccessExpression,
  Program,
  ReturnStatement,
  StructDeclaration,
  UnionDeclaration,
  Variable,
  WhileStatement,
} from "./ast";
import { Logger } from "./diagnostics";
import { Scope } from "./scope";

export class Binder extends AstVisitor {
  #scope: Scope;
  constructor(readonly L: Logger, readonly P: Program) {
    super();
    this.#scope = new Scope(L, P);
  }

  #push(node: AstNode) {
    this.#scope = this.#scope.pushScope(node);
  }

  #pop() {
    this.#scope = this.#scope.popScope();
  }

  #bindList(
    nodes: AstNodeList,
    bindOne: (node: AstNode) => void = (node) => this.visit(node)
  ) {
    nodes.each((node) => bindOne(node));
  }

  bind() {
    this.P.nodes.each((node) => {
      this.visit(node);
    });
  }

  visitIdentifier(node: Identifier): void {
    this.#scope.insert(node.name, node);
  }

  visitVariable(node: Variable): void {
    const sym = this.#scope.findSymbol(node.name, node.range!);
    if (sym) {
      node.declsite = sym;
    }
  }

  visitMemberAccessExpression(
    node: MemberAccessExpression,
    parent?: AstNode
  ): void {
    this.visit(node.target);
    // We don't know the type yet, so don't visit member
  }

  visitFuncParam(node: FunctionParam): void {
    this.visit(node.name);
    this.visit(node.type);
  }

  visitFunctionDeclaration(node: FunctionDeclaration): void {
    this.visit(node.name);
    this.#push(node);
    this.visit(node.signature);
    if (node.body) this.visit(node.body);
    this.#pop();
  }

  visitUnionDeclaration(node: UnionDeclaration): void {
    this.visit(node.name);
    this.#push(node);
    this.#bindList(node.members);
    this.#pop();
  }

  visitEnumDeclaration(node: EnumDeclaration): void {
    this.visit(node.name, node);
    if (node.base) this.visit(node.base);
    this.#push(node);
    this.#bindList(node.options);
    this.#pop();
  }

  visitStructDeclaration(node: StructDeclaration): void {
    this.visit(node.name, node);
    if (node.base) this.visit(node.base);
    this.#push(node);
    if (node.fields) this.#bindList(node.fields);
    this.#pop();
  }

  visitCodeBlock(node: CodeBlock): void {
    this.#push(node);
    this.#bindList(node.nodes);
    this.#pop();
  }

  visitIfStatement(node: IfStatement): void {
    this.#push(node); // because if (const x = ...)
    this.visit(node.cond, node);
    this.visit(node.ifTrue, node);
    if (node.ifFalse) this.visit(node.ifFalse, node);
    this.#pop();
  }

  visitWhileStatement(node: WhileStatement): void {
    this.visit(node.cond, node);
    this.#push(node);
    this.visit(node.body, node);
    this.#pop();
  }

  visitForStatement(node: ForStatement): void {
    this.#push(node);
    this.visit(node.init, node);
    this.visit(node.expr, node);
    this.visit(node.body, node);
    this.#pop();
  }

  visitReturnStatement(node: ReturnStatement): void {
    node.fun = this.#scope.findEnclosingFunction("return", node.range!);
    if (node.value) this.visit(node.value);
  }

  visitContinueStatement(node: BreakStatement): void {
    node.loop = this.#scope.findEnclosingLoop("continue", node.range!);
  }

  visitBreakStatement(node: BreakStatement): void {
    node.loop = this.#scope.findEnclosingLoop("break", node.range!);
  }
}
