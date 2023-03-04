import assert from "assert";

import {
  ArrayExpression,
  ArrayType,
  AssignmentExpression,
  Ast,
  AstNode,
  AstNodeList,
  AstVisitor,
  Attribute,
  AttributeValue,
  BinaryExpression,
  BoolLit,
  BracketExpression,
  CallExpression,
  CharacterLit,
  ClosureExpression,
  CodeBlock,
  DeferStatement,
  DotExpression,
  ExpressionStatement,
  FloatLit,
  ForStatement,
  FunctionDeclaration,
  FunctionParam,
  FunctionParams,
  FunctionType,
  GenericTypeParam,
  GroupingExpression,
  Identifier,
  IfStatement,
  IntegerLit,
  MacroCallExpression,
  MemberAccessExpression,
  NewExpression,
  PointerType,
  PostfixExpression,
  PrefixExpression,
  PrimitiveType,
  Program,
  SignatureExpression,
  SpreadExpression,
  StringExpression,
  StringLit,
  StructExpression,
  StructFieldExpression,
  TernaryExpression,
  TupleExpression,
  TupleType,
  UnaryExpression,
  VariableDeclaration,
  WhileStatement,
  YieldExpression,
} from "./ast";
import { fmtKeyword, fmtLiteral, fmtReset, fmtString } from "./format";
import { isKeyword, isKeywordString, TOKEN_LIST } from "./token";

function write(...strs: string[]) {
  for (const str of strs) {
    process.stdout.write(str);
  }
}

export class AstPrinter extends AstVisitor {
  #indent = "";
  #push() {
    return (this.#indent = " ".repeat(this.#indent.length + 2));
  }

  #pop() {
    assert(this.#indent.length !== 0);
    return (this.#indent = " ".repeat(this.#indent.length - 2));
  }

  visitProgram(node: Program): void {
    var next = node.nodes.first;
    while (next) {
      this.visit(next);
      write("\n");
      next = next.next;
    }
  }

  visitNull(node: AstNode): void {
    write(`${fmtLiteral}null${fmtReset}`);
  }

  visitUndefined(node: AstNode): void {
    write(`${fmtKeyword}undefined${fmtReset}`);
  }

  visitPrimitive(node: PrimitiveType): void {
    write(`${fmtKeyword}${TOKEN_LIST[node.op].s}${fmtReset}`);
  }

  visitBoolLiteral(node: BoolLit): void {
    write(`${fmtKeyword}${node.value}${fmtReset}`);
  }

  visitCharacterLiteral(node: CharacterLit): void {
    write(`${fmtLiteral}'${node.value}'${fmtReset}`);
  }

  visitIntegerLiteral(node: IntegerLit): void {
    write(`${fmtLiteral}${node.value}${fmtReset}`);
  }

  visitFloatLiteral(node: FloatLit): void {
    write(`${fmtLiteral}${node.value}${fmtReset}`);
  }

  visitStringLiteral(node: StringLit): void {
    write(`${fmtLiteral}"${node.value}"${fmtReset}`);
  }

  visitIdentifier(node: Identifier): void {
    write(node.name);
  }

  visitStringExpression(node: StringExpression): void {
    write(`${fmtString}\`${fmtReset}`);
    var part = node.parts.first;
    while (part) {
      if (part.id == Ast.StrLit) {
        write(fmtString, (<StringLit>part).value, fmtReset);
      } else {
        write(fmtLiteral, "${", fmtReset);
        this.visit(part);
        write(fmtLiteral, "}", fmtReset);
      }
      part = part.next;
    }
    write(`${fmtString}\`${fmtReset}`);
  }

  visitGroupingExpression(node: GroupingExpression): void {
    write("(");
    this.visit(node.expr);
    write(")");
  }

  visitPrefixExpression(node: PrefixExpression): void {
    if (isKeyword(node.op.id))
      write(fmtKeyword, TOKEN_LIST[node.op.id].s, fmtReset, " ");
    else write(TOKEN_LIST[node.op.id].s);
    this.visit(node.expr);
  }

  visitPostfixExpression(node: PostfixExpression): void {
    this.visit(node.expr);
    write(TOKEN_LIST[node.op.id].s);
  }

  visitUnaryExpression(node: UnaryExpression): void {
    if (isKeyword(node.op.id))
      write(fmtKeyword, TOKEN_LIST[node.op.id].s, fmtReset, " ");
    else write(TOKEN_LIST[node.op.id].s);
    this.visit(node.expr);
  }

  visitBinaryExpression(node: BinaryExpression): void {
    this.visit(node.lhs);
    write(" ", TOKEN_LIST[node.op.id].s, " ");
    this.visit(node.rhs);
  }

  visitTernaryExpression(node: TernaryExpression): void {
    this.visit(node.cond);
    write("? ");
    this.visit(node.ifTrue);
    write(" : ");
    this.visit(node.ifFalse);
  }

  visitAssignmentExpression(node: AssignmentExpression): void {
    this.visit(node.lhs);
    write(" ", TOKEN_LIST[node.op.id].s, " ");
    this.visit(node.rhs);
  }

  visitCallExpression(node: CallExpression): void {
    this.visit(node.callee);
    write("(");
    var arg = node.args.first;
    while (arg) {
      this.visit(arg);
      arg = arg.next;
      if (arg) write(", ");
    }
    write(")");
  }

  visitMacroCallExpression(node: MacroCallExpression): void {
    this.visit(node.callee);
    write("!");
    if (node.args) {
      write("(");
      this.printAstNodeList(node.args);
      write(")");
    }
  }

  visitSpreadExpression(node: SpreadExpression): void {
    write("...");
    this.visit(node.expr);
  }

  visitYieldExpression(node: YieldExpression): void {
    write(`${fmtKeyword}yield${fmtReset}`);
    if (node.starred) write("*");
    write(" ");
    this.visit(node.expr);
  }

  visitNewExpression(node: NewExpression): void {
    write(`${fmtKeyword}new${fmtReset} `);
    this.visit(node.expr);
  }

  visitBracketExpression(node: BracketExpression): void {
    this.visit(node.target);
    write("[");
    this.printAstNodeList(node.indices);
    write("]");
  }

  visitDotExpression(node: DotExpression): void {
    write(".");
    this.visit(node.expr);
  }

  visitMemberAccessExpression(node: MemberAccessExpression): void {
    if (node.dot) write(".");
    this.visit(node.target);
    write(TOKEN_LIST[node.op.id].s);
    this.visit(node.member);
  }

  printAstNodeList(
    list: AstNodeList,
    parent?: AstNode,
    sep: string = ", ",
    indent: boolean = false
  ): void {
    var expr = list.first;
    while (expr) {
      if (indent) write(this.#indent);
      this.visit(expr, parent);
      expr = expr.next;
      if (expr) write(sep);
    }
  }

  visitTupleExpression(node: TupleExpression): void {
    write("(");
    this.printAstNodeList(node.elements);
    write(")");
  }

  visitStructExpression(node: StructExpression): void {
    this.visit(node.lhs);
    write("{");
    this.printAstNodeList(node.fields);
    write("}");
  }

  visitArrayLitExpression(node: ArrayExpression): void {
    write("[");
    this.printAstNodeList(node.elements);
    write("]");
  }

  visitSignatureExpression(node: SignatureExpression, parent: AstNode): void {
    this.visit(node.params);
    if (node.ret) {
      if (parent.id === Ast.TupleExpr) write(" -> ");
      else write(" : ");
      this.visit(node.ret);
    }
  }

  visitClosureExpression(node: ClosureExpression): void {
    if (node.isAsync) write(fmtKeyword, "async", fmtReset, " ");
    this.visit(node.signature, node);
    write(" => ");
    this.visit(node.body);
  }

  visitVariableDeclaration(node: VariableDeclaration): void {
    if (node.isPublic) write(`${fmtKeyword}pub${fmtReset} `);
    write(`${fmtKeyword}${TOKEN_LIST[node.modifier].s}${fmtReset} `);

    if (node.variable.count === 1) this.visit(node.variable.first!);
    else {
      write("(");
      this.printAstNodeList(node.variable);
      write(")");
    }
    if (node.type) {
      write(" : ");
      this.visit(node.type);
    }

    if (node.init) {
      write(" = ");
      this.visit(node.init);
    }
  }

  visitExpressionStatement(node: ExpressionStatement): void {
    this.visit(node.expr);
  }

  visitCodeBlock(node: CodeBlock): void {
    write("{\n");
    this.#push();
    this.printAstNodeList(node.nodes, node, "\n", true);
    this.#pop();
    write("\n", this.#indent, "}");
  }

  visitFunctionDeclaration(node: FunctionDeclaration): void {
    if (node.isAsync) write(fmtKeyword, "async ", fmtReset);
    write(fmtKeyword, "func", fmtReset);
    write(" ", node.name);
    this.visit(node.signature, node);
    write(" ");
    if (node.body) {
      if (node.body.id !== Ast.Block) write("= ");
      this.visit(node.body);
    } else {
      write(";");
    }
  }

  visitTupleType(node: TupleType): void {
    write("(");
    this.printAstNodeList(node.elements);
    write(")");
  }

  visitArrayType(node: ArrayType): void {
    this.visit(node.elementType);
    write("[");
    if (node.size) this.visit(node.size);
    write("]");
  }

  visitFunctionType(node: FunctionType): void {
    if (node.isAsync) write(fmtKeyword, "async", fmtReset, " ");
    write(fmtKeyword, "func", fmtReset);
    this.visit(node.params);
    write(" -> ");
    this.visit(node.ret);
  }

  visitFuncParams(node: FunctionParams): void {
    write("(");
    this.printAstNodeList(node.params);
    write(")");
  }

  visitFuncParam(node: FunctionParam): void {
    if (node.isVariadic) write("...");
    this.visit(node.name);
    write(": ");
    this.visit(node.type);
  }

  visitPointerType(node: PointerType): void {
    write("&");
    if (node.isConst) write(fmtKeyword, "const ", fmtReset);
    this.visit(node.pointee);
  }

  visitGenericTypeParam(node: GenericTypeParam): void {
    this.visit(node.name);
    if (node.constraints.count) {
      write(": ");
      this.printAstNodeList(node.constraints, node, " | ");
    }
  }

  visitStructFieldExpression(node: StructFieldExpression): void {
    this.visit(node.name);
    write(": ");
    this.visit(node.value);
  }

  visitAttributeValue(node: AttributeValue): void {
    this.visit(node.name);
    write(": ");
    this.visit(node.value);
  }

  visitAttribute(node: Attribute): void {
    this.visit(node.name);
    if (node.values.count) {
      write("(");
      this.printAstNodeList(node.values);
      write(")");
    }
  }

  visitIfStatement(node: IfStatement): void {
    write(fmtKeyword, "if", fmtReset);
    write(" (");
    this.visit(node.cond);
    write(") ");
    this.visit(node.ifTrue);
    if (node.ifFalse) {
      write(fmtKeyword, "else ", fmtReset);
      this.visit(node.ifFalse);
    }
  }

  visitWhileStatement(node: WhileStatement): void {
    write(fmtKeyword, "while", fmtReset);
    write(" (");
    this.visit(node.cond);
    write(") ");
    this.visit(node.body);
  }

  visitForStatement(node: ForStatement): void {
    write(fmtKeyword, "for", fmtReset);
    write(" (");
    this.visit(node.init);
    write(" : ");
    this.visit(node.expr);
    write(") ");
    this.visit(node.body);
  }

  visitDeferStatement(node: DeferStatement): void {
    write(fmtKeyword, "defer ", fmtReset);
    this.visit(node.body);
  }
}
