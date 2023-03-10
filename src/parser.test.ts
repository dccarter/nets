import { expect, test, describe } from "bun:test";

import {
  AssignmentExpression,
  Ast,
  AstNode,
  AstNodeList,
  BinaryExpression,
  BoolLit,
  CallExpression,
  CharacterLit,
  FloatLit,
  FunctionDeclaration,
  GroupingExpression,
  IntegerLit,
  PostfixExpression,
  PrefixExpression,
  Program,
  StringExpression,
  StringLit,
  TernaryExpression,
  UnaryExpression,
} from "./ast";
import { Logger } from "./diagnostics";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Source } from "./source";
import {
  ASSIGNMENT_OPS,
  BINARY_OPS,
  POSTFIX_OPS,
  PREFIX_OPS,
  Tok,
  UNARY_OPS,
} from "./token";

function parse(code: string): AstNode {
  const L = new Logger();
  const parser = new Parser(L, new Lexer(L, new Source("<test>", code)));
  return parser.parse();
}

function expression(code: string): AstNode {
  const func = `func X() = ${code}`;
  const prog = parse(func);
  expect(prog.id).toBe(Ast.Program);
  expect((<Program>prog).nodes.count).toBe(1);
  const fn = (<Program>prog).nodes.first!;
  expect(fn.id).toBe(Ast.FuncDecl);
  expect((<FunctionDeclaration>fn).body).not.toBeUndefined();
  return (<FunctionDeclaration>fn).body!;
}

function expectNodeList(list: AstNodeList, ...nodes: { id: Ast }[]) {
  expect(list.count).toBe(nodes ? nodes.length : 0);
  if (nodes) {
    var node = list.first;
    var i = 0;
    while (node) {
      expect(node.id).toBe(nodes[i++].id);
      node = node.next;
    }
  }
}

describe("Parser", () => {
  describe("Literals", () => {
    test("Character", () => {
      const ast = expression("'a'");
      expect(ast.id).toBe(Ast.CharLit);
      expect((<CharacterLit>ast).value).toEqual("a");
    });
    test("Boolean", () => {
      const ast = expression("true");
      expect(ast.id).toBe(Ast.BoolLit);
      expect((<BoolLit>ast).value).toBe(true);
    });
    test("Integer", () => {
      const ast = expression("0b101010");
      expect(ast.id).toBe(Ast.IntLit);
      expect((<IntegerLit>ast).value).toBe(0b101010);
    });
    test("Float", () => {
      const ast = expression("1.9e4");
      expect(ast.id).toBe(Ast.FloatLit);
      expect((<FloatLit>ast).value).toBe(1.9e4);
    });
    test("String", () => {
      const ast = expression('"Hello"');
      expect(ast.id).toBe(Ast.StrLit);
      expect((<StringLit>ast).value).toBe("Hello");
    });
  });

  describe("Expressions", () => {
    describe("String Expressions", () => {
      test("Simple", () => {
        const ast = expression("`Hello`");
        expect(ast.id).toBe(Ast.StrExpr);
        expectNodeList((<StringExpression>ast).parts, { id: Ast.StrLit });
      });

      test("With expressions", () => {
        const ast = expression("`Hello ${name}, your age is ${age + 10}`");
        expect(ast.id).toBe(Ast.StrExpr);
        expectNodeList(
          (<StringExpression>ast).parts,
          { id: Ast.StrLit },
          { id: Ast.Variable },
          { id: Ast.StrLit },
          { id: Ast.BinaryExpr }
        );
      });
    });

    describe("Postfix Expressions", () => {
      POSTFIX_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`a${info.s}`);
          expect(ast.id).toBe(Ast.PostfixExpr);
          expect((<PostfixExpression>ast).op.id).toBe(op);
        });
      });
    });

    describe("Prefix Expressions", () => {
      PREFIX_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`${info.s} a`);
          expect(ast.id).toBe(Ast.PrefixExpr);
          expect((<PrefixExpression>ast).op.id).toBe(op);
        });
      });
    });

    describe("Ternay Expressions", () => {
      test("Simple", () => {
        const ast = expression("a? b : c");
        expect(ast.id).toBe(Ast.TernaryExpr);
      });

      test("Recursive", () => {
        const ast = expression("a? b : (true? a : c)");
        expect(ast.id).toBe(Ast.TernaryExpr);
        var expr = (<TernaryExpression>ast).ifFalse;
        expect(expr.id).toBe(Ast.GroupingExpr);
        expr = (<GroupingExpression>expr).expr;
        expect(expr.id).toBe(Ast.TernaryExpr);
      });
    });

    describe("Unary Expression", () => {
      UNARY_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`${info.s} a`);
          expect(ast.id).toBe(Ast.PrefixExpr);
          expect((<UnaryExpression>ast).op.id).toBe(op);
        });
      });

      test("Recursive", () => {
        const ast = expression("-+a");
        expect(ast.id).toBe(Ast.PrefixExpr);
        expect((<UnaryExpression>ast).op.id).toBe(Tok.Minus);
        var expr = (<UnaryExpression>ast).expr;
        expect(expr.id).toBe(Ast.PrefixExpr);
        expect((<UnaryExpression>expr).op.id).toBe(Tok.Plus);
        expr = (<UnaryExpression>expr).expr;
        expect(expr.id).toBe(Ast.Variable);
      });
    });

    describe("Binary Expressions", () => {
      BINARY_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`a ${info.s} b`);
          expect(ast.id).toBe(Ast.BinaryExpr);
          expect((<BinaryExpression>ast).op.id).toBe(op);
        });
      });
    });

    describe("Assignment Expressions", () => {
      ASSIGNMENT_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`a ${info.s} b`);
          expect(ast.id).toBe(Ast.AssignmentExpr);
          expect((<AssignmentExpression>ast).op.id).toBe(op);
        });
      });
    });
  });

  describe("Call Expression", () => {
    test("No parameters", () => {
      const ast = expression("print()");
      expect(ast.id).toBe(Ast.CallExpr);
      expect((<CallExpression>ast).args.count).toBe(0);
    });

    test("With Multiple Parameters", () => {
      const ast = expression(`print(10, 'c', print(), (1, "String"))`);
      expect(ast.id).toBe(Ast.CallExpr);
      expectNodeList(
        (<CallExpression>ast).args,
        { id: Ast.IntLit },
        { id: Ast.CharLit },
        { id: Ast.CallExpr },
        { id: Ast.TupleExpr }
      );
    });
  });
});
