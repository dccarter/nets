import {
  AstNode,
  AstNodeList,
  AstVisitor,
  BinaryExpression,
  FunctionDeclaration,
  FunctionParam,
  FunctionParams,
  GroupingExpression,
  Identifier,
  PostfixExpression,
  PrefixExpression,
  Program,
  SignatureExpression,
  StringExpression,
  TernaryExpression,
  UnaryExpression,
  VariableDeclaration,
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

  visitStringExpression(node: StringExpression, parent?: AstNode): void {
    this.#bindList(node.parts);
  }

  visitGroupingExpression(node: GroupingExpression): void {
    this.visit(node.expr);
  }

  visitPrefixExpression(node: PrefixExpression): void {
    this.visit(node.expr);
  }

  visitPostfixExpression(node: PostfixExpression): void {
    this.visit(node.expr);
  }

  visitUnaryExpression(node: UnaryExpression, parent?: AstNode): T | void {}
  visitBinaryExpression(node: BinaryExpression, parent?: AstNode): T | void {}
  visitTernaryExpression(node: TernaryExpression, parent?: AstNode): T | void {}

  visitSignatureExpression(node: SignatureExpression): void {
    this.visit(node.params);
    if (node.ret) this.visit(node.ret);
  }

  visitVariableDeclaration(node: VariableDeclaration): void {
    if (node.init) this.visit(node.init);

    const name = (<Identifier>node.variable).name;
    this.#scope.insert(name, node);

    if (node.type) {
      this.visit(node.type);
    }
  }

  visitFuncParam(node: FunctionParam): void {
    this.#scope.insert((<Identifier>node.name).name, node.name);
    this.visit(node.type);
  }

  visitFuncParams(node: FunctionParams): void {
    this.#bindList(node.params);
  }

  visitFunctionDeclaration(node: FunctionDeclaration): void {
    this.#push(node);
    this.visit(node.signature);
    if (node.body) this.visit(node.body);
    this.#pop();
  }
}
