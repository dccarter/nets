import { expect, test, describe } from "bun:test";

import {
  AssignmentExpression,
  Ast,
  AstNode,
  AstNodeList,
  BinaryExpression,
  BoolLit,
  CharacterLit,
  FloatLit,
  GroupingExpression,
  IntegerLit,
  PostfixExpression,
  PrefixExpression,
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
      const ast = parse("'a'");
      expect(ast.id).toBe(Ast.CharLit);
      expect((<CharacterLit>ast).value).toEqual("a");
    });
    test("Boolean", () => {
      const ast = parse("true");
      expect(ast.id).toBe(Ast.BoolLit);
      expect((<BoolLit>ast).value).toBe(true);
    });
    test("Integer", () => {
      const ast = parse("0b101010");
      expect(ast.id).toBe(Ast.IntLit);
      expect((<IntegerLit>ast).value).toBe(0b101010);
    });
    test("Float", () => {
      const ast = parse("1.9e4");
      expect(ast.id).toBe(Ast.FloatLit);
      expect((<FloatLit>ast).value).toBe(1.9e4);
    });
    test("String", () => {
      const ast = parse('"Hello"');
      expect(ast.id).toBe(Ast.StrLit);
      expect((<StringLit>ast).value).toBe("Hello");
    });
  });

  describe("Expressions", () => {
    describe("String Expressions", () => {
      test("Simple", () => {
        const ast = parse("`Hello`");
        expect(ast.id).toBe(Ast.StrExpr);
        expectNodeList((<StringExpression>ast).parts, { id: Ast.StrLit });
      });

      test("With expressions", () => {
        const ast = parse("`Hello ${name}, your age is ${age + 10}`");
        expect(ast.id).toBe(Ast.StrExpr);
        expectNodeList(
          (<StringExpression>ast).parts,
          { id: Ast.StrLit },
          { id: Ast.Identifier },
          { id: Ast.StrLit },
          { id: Ast.BinaryExpr }
        );
      });
    });

    describe("Postfix Expressions", () => {
      POSTFIX_OPS.forEach(({ op, info }) => {
        test(`${info.s}`, () => {
          const ast = parse(`a${info.s}`);
          expect(ast.id).toBe(Ast.PostfixExpr);
          expect((<PostfixExpression>ast).op).toBe(op);
        });
      });

      test("Recursive", () => {
        const ast = parse("a++++--");
        expect(ast.id).toBe(Ast.PostfixExpr);
        expect((<PostfixExpression>ast).op).toBe(Tok.MinusMinus);
        var expr = (<PostfixExpression>ast).expr;
        expect(expr.id).toBe(Ast.PostfixExpr);
        expect((<PostfixExpression>expr).op).toBe(Tok.PlusPlus);
        expr = (<PostfixExpression>expr).expr;
        expect(expr.id).toBe(Ast.PostfixExpr);
        expect((<PostfixExpression>expr).op).toBe(Tok.PlusPlus);
        expr = (<PostfixExpression>expr).expr;
        expect(expr.id).toBe(Ast.Identifier);
      });
    });

    describe("Prefix Expressions", () => {
      PREFIX_OPS.forEach(({ op, info }) => {
        test(`${info.s}`, () => {
          const ast = parse(`${info.s} a`);
          expect(ast.id).toBe(Ast.PrefixExpr);
          expect((<PrefixExpression>ast).op).toBe(op);
        });
      });
    });

    describe("Ternay Expressions", () => {
      test("Simple", () => {
        const ast = parse("a? b : c");
        expect(ast.id).toBe(Ast.TernaryExpr);
      });

      test("Recursive", () => {
        const ast = parse("a? b : (true? a : c)");
        expect(ast.id).toBe(Ast.TernaryExpr);
        var expr = (<TernaryExpression>ast).ifFalse;
        expect(expr.id).toBe(Ast.GroupingExpr);
        expr = (<GroupingExpression>expr).expr;
        expect(expr.id).toBe(Ast.TernaryExpr);
      });
    });

    describe("Unary Expression", () => {
      UNARY_OPS.forEach(({ op, info }) => {
        test(`${info.s}`, () => {
          const ast = parse(`${info.s} a`);
          expect(ast.id).toBe(Ast.UnaryExpr);
          expect((<UnaryExpression>ast).op).toBe(op);
        });
      });

      test("Recursive", () => {
        const ast = parse("-+a");
        expect(ast.id).toBe(Ast.UnaryExpr);
        expect((<UnaryExpression>ast).op).toBe(Tok.Minus);
        var expr = (<UnaryExpression>ast).expr;
        expect(expr.id).toBe(Ast.UnaryExpr);
        expect((<UnaryExpression>expr).op).toBe(Tok.Plus);
        expr = (<UnaryExpression>expr).expr;
        expect(expr.id).toBe(Ast.Identifier);
      });
    });

    describe("Binary Expressions", () => {
      BINARY_OPS.forEach(({ op, info }) => {
        test(`${info.s}`, () => {
          const ast = parse(`a ${info.s} b`);
          expect(ast.id).toBe(Ast.BinaryExpr);
          expect((<BinaryExpression>ast).op).toBe(op);
        });
      });
    });

    describe("Assignment Expressions", () => {
      ASSIGNMENT_OPS.forEach(({ op, info }) => {
        test(`${info.s}`, () => {
          const ast = parse(`a ${info.s} b`);
          expect(ast.id).toBe(Ast.AssignmentExpr);
          expect((<AssignmentExpression>ast).op).toBe(op);
        });
      });
    });
  });
});
