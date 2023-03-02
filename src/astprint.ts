import assert from "assert";

import {
  ArrayLitExpression,
  AssignmentExpression,
  Ast,
  AstNode,
  AstNodeList,
  AstVisitor,
  BinaryExpression,
  BoolLit,
  BracketExpression,
  CallExpression,
  CharacterLit,
  ClosureExpression,
  CodeBlock,
  DotExpression,
  ExpressionStatement,
  FloatLit,
  FunctionDeclaration,
  GroupingExpression,
  Identifier,
  IntegerLit,
  MemberAccessExpression,
  NewExpression,
  PostfixExpression,
  PrefixExpression,
  PrimitiveIdent,
  Program,
  SpreadExpression,
  StringExpression,
  StringLit,
  StructLitExpression,
  TernaryExpression,
  TupleExpression,
  UnaryExpression,
  VariableDeclaration,
  YieldExpression,
} from "./ast";
import { fmtKeyword, fmtLiteral, fmtReset, fmtString } from "./format";
import { TOKEN_LIST } from "./token";

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

  visitPrimitive(node: PrimitiveIdent): void {
    write(`${fmtKeyword}${TOKEN_LIST[node.tok].s}${fmtReset}`);
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
    write(TOKEN_LIST[node.op].s);
    this.visit(node.expr);
  }

  visitPostfixExpression(node: PostfixExpression): void {
    this.visit(node.expr);
    write(TOKEN_LIST[node.op].s);
  }

  visitUnaryExpression(node: UnaryExpression): void {
    write(TOKEN_LIST[node.op].s);
    this.visit(node.expr);
  }

  visitBinaryExpression(node: BinaryExpression): void {
    this.visit(node.lhs);
    write(" ", TOKEN_LIST[node.op].s, " ");
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
    write(" ", TOKEN_LIST[node.op].s, " ");
    this.visit(node.rhs);
  }

  visitCallExpression(node: CallExpression): void {
    this.visit(node.expr);
    write("(");
    var arg = node.args.first;
    while (arg) {
      this.visit(arg);
      arg = arg.next;
      if (arg) write(", ");
    }
    write(")");
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
    this.visit(node.index);
    write("]");
  }

  visitDotExpression(node: DotExpression): void {
    write(".");
    this.visit(node.expr);
  }

  visitMemberAccessExpression(node: MemberAccessExpression): void {
    if (node.dot) write(".");
    this.visit(node.target);
    write(TOKEN_LIST[node.op].s);
    this.visit(node.member);
  }

  printAstNodeList(list: AstNodeList, sep: string = ", "): void {
    var expr = list.first;
    while (expr) {
      this.visit(expr);
      expr = expr.next;
      if (expr) write(sep);
    }
  }

  visitTupleLitExpression(node: TupleExpression): void {
    write("(");
    this.printAstNodeList(node.exprs);
    write(")");
  }

  visitStructLitExpression(node: StructLitExpression): void {
    write("{");
    this.printAstNodeList(node.exprs);
    write("}");
  }

  visitArrayLitExpression(node: ArrayLitExpression): void {
    write("[");
    this.printAstNodeList(node.exprs);
    write("]");
  }

  visitClosureExpression(node: ClosureExpression): void {
    if (node.isAsync) write(fmtKeyword, "async", fmtReset, " ");
    this.visit(node.signature);
    write(" => ");
    this.visit(node.body);
  }

  visitVariableDeclaration(node: VariableDeclaration): void {
    write(
      this.#indent,
      `${fmtKeyword}${TOKEN_LIST[node.modifier].s}${fmtReset} `
    );
    this.visit(node.varible);
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
    write(this.#indent);
    this.visit(node.expr);
  }

  visitCodeBlock(node: CodeBlock): void {
    write(this.#indent, "{\n");
    this.#push();
    this.printAstNodeList(node.nodes, "\n");
    this.#pop();
    write("\n", this.#indent, "}");
  }

  visitFunctionDeclaration(node: FunctionDeclaration): void {
    write(this.#indent);
    if (node.isAsync) write(fmtKeyword, "async ", fmtReset);
    write(fmtKeyword, "func", fmtReset);
    write(" ", node.name);
    this.visit(node.args);
    write(" ");
    if (node.ret) {
      write(": ");
      this.visit(node.ret);
      write(" ");
    }
    if (node.body.id !== Ast.Block) write("= ");
    this.visit(node.body);
  }
}
