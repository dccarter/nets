import assert from "assert";

import {
  ArrayExpr,
  ArrayType,
  AssignmentExpr,
  Ast,
  AstNode,
  AstNodeList,
  AstVisitor,
  Attribute,
  AttributeValue,
  BinaryExpr,
  BoolLit,
  BracketExpr,
  CallExpr,
  CharacterLit,
  ClosureExpr,
  CodeBlock,
  Declaration,
  DeferStmt,
  DotExpr,
  EnumDecl,
  EnumOption,
  ExpressionStmt,
  FloatLit,
  ForStmt,
  FunctionDecl,
  FunctionParam,
  FunctionParams,
  FunctionType,
  GenericTypeParam,
  GroupingExpression,
  Identifier,
  IfStmt,
  IntegerLit,
  MacroCallExpr,
  MemberExpr,
  NewExpr,
  OptionalType,
  PointerType,
  PostfixExpr,
  PrefixExpr,
  PrimitiveType,
  Program,
  ReturnStmt,
  SignatureExpr,
  SpreadExpr,
  StringExpression,
  StringLit,
  StructDecl,
  StructExpr,
  FieldDecl,
  StructFieldExpr,
  TernaryExpr,
  TupleExpr,
  TupleType,
  TypeAlias,
  TypedExpr,
  UnaryExpr,
  UnionDecl,
  VariableDecl,
  WhileStmt,
  YieldExpr,
  MemberDecl,
} from "../middle/ast";
import { fmtKeyword, fmtLiteral, fmtReset, fmtString } from "../common/format";
import { isKeyword, isKeywordString, TOKEN_LIST } from "../frontend/token";

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

  private printAstNodeList(
    list: AstNodeList,
    parent?: AstNode,
    sep: string = ", ",
    indent: boolean = false,
  ): void {
    var expr = list.first;
    while (expr) {
      if (indent) write(this.#indent);
      this.visit(<AstNode>expr, parent);
      expr = expr.next;
      if (expr) write(sep);
    }
  }

  private visitDeclaration(decl: Declaration) {
    if (decl.attrs && decl.attrs.count) {
      write("@[");
      this.printAstNodeList(decl.attrs);
      write("]\n");
      write(this.#indent);
    }

    if (decl.isOpaque || decl.isExport) {
      if (decl.isExport) write(fmtKeyword, "export ");
      if (decl.isOpaque) write(fmtKeyword, "opaque ");
    }
  }

  visitProgram(node: Program): void {
    var next = node.nodes.first;
    while (next) {
      this.visit(<AstNode>next);
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
    var part = node.parts.first as AstNode;
    while (part) {
      if (part.id == Ast.StrLit) {
        write(fmtString, (<StringLit>part).value, fmtReset);
      } else {
        write(fmtLiteral, "${", fmtReset);
        this.visit(part);
        write(fmtLiteral, "}", fmtReset);
      }
      part = <AstNode>part.next;
    }
    write(`${fmtString}\`${fmtReset}`);
  }

  visitGroupingExpression(node: GroupingExpression): void {
    write("(");
    this.visit(node.expr);
    write(")");
  }

  visitPrefixExpr(node: PrefixExpr): void {
    if (isKeyword(node.op.id))
      write(fmtKeyword, TOKEN_LIST[node.op.id].s, fmtReset, " ");
    else write(TOKEN_LIST[node.op.id].s);
    this.visit(node.expr);
  }

  visitPostfixExpr(node: PostfixExpr): void {
    this.visit(node.expr);
    write(TOKEN_LIST[node.op.id].s);
  }

  visitUnaryExpr(node: UnaryExpr): void {
    if (isKeyword(node.op.id))
      write(fmtKeyword, TOKEN_LIST[node.op.id].s, fmtReset, " ");
    else write(TOKEN_LIST[node.op.id].s);
    this.visit(node.expr);
  }

  visitBinaryExpr(node: BinaryExpr): void {
    this.visit(node.lhs);
    write(" ", TOKEN_LIST[node.op.id].s, " ");
    this.visit(node.rhs);
  }

  visitTernaryExpr(node: TernaryExpr): void {
    this.visit(node.cond);
    if (node.ifTrue) {
      write("? ");
      this.visit(node.ifTrue);
      write(" : ");
    } else {
      write(" ?: ");
    }

    this.visit(node.ifFalse);
  }

  visitAssignmentExpr(node: AssignmentExpr): void {
    this.visit(node.lhs);
    write(" ", TOKEN_LIST[node.op.id].s, " ");
    this.visit(node.rhs);
  }

  visitCallExpr(node: CallExpr): void {
    this.visit(node.callee);
    write("(");
    var arg = node.args.first;
    while (arg) {
      this.visit(<AstNode>arg);
      arg = arg.next;
      if (arg) write(", ");
    }
    write(")");
  }

  visitMacroCallExpr(node: MacroCallExpr): void {
    this.visit(node.callee);
    write("!");
    if (node.args) {
      write("(");
      this.printAstNodeList(node.args);
      write(")");
    }
  }

  visitSpreadExpr(node: SpreadExpr): void {
    write("...");
    this.visit(node.expr);
  }

  visitYieldExpr(node: YieldExpr): void {
    write(`${fmtKeyword}yield${fmtReset}`);
    if (node.starred) write("*");
    write(" ");
    this.visit(node.expr);
  }

  visitNewExpr(node: NewExpr): void {
    write(`${fmtKeyword}new${fmtReset} `);
    this.visit(node.expr);
  }

  visitBracketExpr(node: BracketExpr): void {
    this.visit(node.target);
    write("[");
    this.printAstNodeList(node.indices);
    write("]");
  }

  visitDotExpr(node: DotExpr): void {
    write(".");
    this.visit(node.expr);
  }

  visitMemberExpr(node: MemberExpr): void {
    if (node.dot) write(".");
    this.visit(node.target);
    write(TOKEN_LIST[node.op.id].s);
    this.visit(node.member);
  }

  visitTupleExpr(node: TupleExpr): void {
    write("(");
    this.printAstNodeList(node.elements);
    write(")");
  }

  visitStructExpr(node: StructExpr): void {
    this.visit(node.lhs);
    write("{");
    this.printAstNodeList(node.fields);
    write("}");
  }

  visitArrayExpr(node: ArrayExpr): void {
    write("[");
    this.printAstNodeList(node.elements);
    write("]");
  }

  visitSignatureExpr(node: SignatureExpr, parent: AstNode): void {
    this.visit(node.params);
    if (node.ret) {
      if (parent.id === Ast.TupleExpr) write(" -> ");
      else write(" : ");
      this.visit(node.ret);
    }
  }

  visitClosureExpr(node: ClosureExpr): void {
    if (node.isAsync) write(fmtKeyword, "async", fmtReset, " ");
    this.visit(node.signature, node);
    write(" => ");
    this.visit(node.body);
  }

  visitTypedExpr(node: TypedExpr): void {
    this.visit(node.expr);
    write(" : ");
    this.visit(node.type);
  }

  visitVariableDecl(node: VariableDecl): void {
    this.visitDeclaration(<Declaration>node);
    write(`${fmtKeyword}${TOKEN_LIST[node.modifier].s}${fmtReset} `);

    if (node.variable.count === 1) {
      this.visit(<AstNode>node.variable.first!);
    } else {
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

  visitExpressionStmt(node: ExpressionStmt): void {
    this.visit(node.expr);
  }

  visitCodeBlock(node: CodeBlock): void {
    write("{\n");
    this.#push();
    this.printAstNodeList(node.nodes, node, "\n", true);
    this.#pop();
    write("\n", this.#indent, "}");
  }

  visitFunctionDecl(node: FunctionDecl, parent?: AstNode): void {
    if (parent?.isClassOrStruct()) {
      write("\n", this.#indent);
    }

    this.visitDeclaration(<Declaration>node);
    if (node.isAsync) write(fmtKeyword, "async ", fmtReset);
    write(fmtKeyword, "func", fmtReset);
    write(" ", node.name);
    if (node.genericParams && node.genericParams.count) {
      write("[");
      this.printAstNodeList(node.genericParams, node);
      write("]");
    }

    this.visit(node.signature, node);
    write(" ");
    if (node.body) {
      if (node.body.id !== Ast.Block) write("=> ");
      this.visit(node.body);
    }
    write("\n");
  }

  visitTypeAlias(node: TypeAlias): void {
    this.visitDeclaration(<Declaration>node);
    write(fmtKeyword, "type ", fmtReset);
    this.visit(node.name);
    if (node.params && node.params.count) {
      write("[");
      this.printAstNodeList(node.params, node);
      write("]");
    }
    if (node.aliased) {
      write(" = ");
      this.visit(node.aliased);
    }
    write("\n");
  }

  visitUnionDecl(node: UnionDecl, parent?: AstNode): void {
    this.visitDeclaration(<Declaration>node);
    write(fmtKeyword, "type ", fmtReset);
    this.visit(node.name);
    if (node.params && node.params.count) {
      write("[");
      this.printAstNodeList(node.params, node);
      write("]");
    }
    write(" = ");
    this.printAstNodeList(node.members, node, " | ");
    write("\n");
  }

  visitEnumDecl(node: EnumDecl, parent?: AstNode): void {
    this.visitDeclaration(<Declaration>node);
    write(fmtKeyword, "enum ", fmtReset);
    this.visit(node.name);
    if (node.base) {
      write(": ");
      this.visit(node.base);
    }
    write(" {\n");
    this.#push();
    this.printAstNodeList(node.options, node, ",\n", true);
    this.#pop();
    write("\n}");
  }

  visitEnumOption(node: EnumOption): void {
    if (node.attrs && node.attrs.count) {
      write("@[");
      this.printAstNodeList(node.attrs, node, ", ");
      write("]\n", this.#indent);
    }
    this.visit(node.name);
    if (node.value) {
      write(" = ");
      this.visit(node.value);
    }
  }

  visitStructDecl(node: StructDecl): void {
    this.visitDeclaration(<Declaration>node);
    write(fmtKeyword, "struct ", fmtReset);
    this.visit(node.name);
    if (node.params && node.params.count) {
      write("[");
      this.printAstNodeList(node.params, node);
      write("]");
    }
    if (node.base) {
      write(" : ");
      this.visit(node.base);
    }

    write(" {\n");
    this.#push();
    if (node.fields) this.printAstNodeList(node.fields, node, "\n", true);
    this.#pop();
    write("\n");
    write(this.#indent, "}\n");
  }

  visitFieldDecl(node: FieldDecl): void {
    if (node.attrs && node.attrs.count === 1) {
      write("@[");
      this.printAstNodeList(node.attrs, node, ", ");
      write("]\n", this.#indent);
    }
    this.visit(node.name);
    write(": ");
    this.visit(node.type);
    if (node.value) {
      write(" = ");
      this.visit(node.value);
    }
  }

  visitMemberDecl(node: MemberDecl, parent: AstNode): void {
    if (node.isPrivate) write("- ");
    this.visit(node.member, parent);
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

  visitOptionalType(node: OptionalType): void {
    this.visit(node.option);
    write("?");
  }

  visitGenericTypeParam(node: GenericTypeParam): void {
    this.visit(node.name);
    if (node.constraints.count) {
      write(": ");
      this.printAstNodeList(node.constraints, node, " | ");
    }
  }

  visitStructFieldExpr(node: StructFieldExpr): void {
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

  visitIfStmt(node: IfStmt): void {
    write(fmtKeyword, "if", fmtReset);
    write(" (");
    this.visit(node.cond);
    write(") ");
    this.visit(node.ifTrue);
    if (node.ifFalse) {
      write(fmtKeyword, " else ", fmtReset);
      this.visit(node.ifFalse);
    }
  }

  visitWhileStmt(node: WhileStmt): void {
    write(fmtKeyword, "while", fmtReset);
    write(" (");
    this.visit(node.cond);
    write(") ");
    this.visit(node.body);
  }

  visitForStmt(node: ForStmt): void {
    write(fmtKeyword, "for", fmtReset);
    write(" (");
    this.visit(node.init);
    write(" : ");
    this.visit(node.expr);
    write(") ");
    this.visit(node.body);
  }

  visitDeferStmt(node: DeferStmt): void {
    write(fmtKeyword, "defer ", fmtReset);
    this.visit(node.body);
  }

  visitReturnStmt(node: ReturnStmt): void {
    write(fmtKeyword, "return", fmtReset);
    if (node.value) {
      write(" ");
      this.visit(node.value);
    }
    write(";");
  }

  visitContinueStmt(node: AstNode): void {
    write(fmtKeyword, "continue", fmtReset, ";");
  }

  visitBreakStmt(node: AstNode): void {
    write(fmtKeyword, "break", fmtReset, ";");
  }
}
