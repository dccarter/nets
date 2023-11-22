import { expect, test, describe } from "bun:test";

import {
  AssignmentExpr,
  Ast,
  AstNode,
  AstNodeList,
  BinaryExpr,
  BoolLit,
  CallExpr,
  CharacterLit,
  FloatLit,
  FunctionDecl,
  GroupingExpression,
  IntegerLit,
  PostfixExpr,
  PrefixExpr,
  Program,
  StringExpression,
  StringLit,
  StructExpr,
  StructFieldExpr as FieldExpr,
  TernaryExpr,
  TupleExpr,
  UnaryExpr,
  ArrayExpr,
  DotExpr,
  Identifier,
  MemberExpr,
} from "../middle/ast";
import { Logger } from "../common/diagnostics";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Source } from "../common/source";
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
  const func = `func X() => ${code}`;
  const prog = parse(func);
  expect(prog.id).toBe(Ast.Program);
  expect((<Program>prog).nodes.count).toBe(1);
  const fn = (<Program>prog).nodes.first!;
  expect(fn.id).toBe(Ast.FuncDecl);
  expect((<FunctionDecl>fn).body).not.toBeUndefined();
  return (<FunctionDecl>fn).body!;
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

function checkNodeList(
  list: AstNodeList,
  ...checkers: ((node: AstNode) => void)[]
) {
  expect(list.count).toBe(checkers ? checkers.length : 0);
  if (checkers) {
    var node = list.first;
    var i = 0;
    while (node) {
      checkers[i++](<AstNode>node);
      node = node.next;
    }
  }
}

function expectFieldExpr(
  node: AstNode,
  expectedName: string,
  expectedValue: Ast,
) {
  expect(node.id == Ast.ArrayExpr);
  const field = <FieldExpr>node;
  expect(field.name.name).toBe(expectedName);
  expect(field.value.id).toBe(expectedValue);
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
          { id: Ast.Identifier },
          { id: Ast.StrLit },
          { id: Ast.BinaryExpr },
        );
      });
    });

    describe("Postfix Expressions", () => {
      POSTFIX_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`a${info.s}`);
          expect(ast.id).toBe(Ast.PostfixExpr);
          expect((<PostfixExpr>ast).op.id).toBe(op);
        });
      });
    });

    describe("Prefix Expressions", () => {
      PREFIX_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`${info.s} a`);
          expect(ast.id).toBe(Ast.PrefixExpr);
          expect((<PrefixExpr>ast).op.id).toBe(op);
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
        var expr = (<TernaryExpr>ast).ifFalse;
        expect(expr.id).toBe(Ast.GroupingExpr);
        expr = (<GroupingExpression>expr).expr;
        expect(expr.id).toBe(Ast.TernaryExpr);
      });

      test("If Not Condition", () => {
        const ast = expression("a ?: c");
        expect(ast.id).toBe(Ast.TernaryExpr);
        var expr = <TernaryExpr>ast;
        expect(expr.ifFalse.id).toBe(Ast.Identifier);
        expect(expr.ifTrue).toBeUndefined();
      });
    });

    describe("Unary Expression", () => {
      UNARY_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`${info.s} a`);
          expect(ast.id).toBe(Ast.PrefixExpr);
          expect((<UnaryExpr>ast).op.id).toBe(op);
        });
      });

      test("Recursive", () => {
        const ast = expression("-+a");
        expect(ast.id).toBe(Ast.PrefixExpr);
        expect((<UnaryExpr>ast).op.id).toBe(Tok.Minus);
        var expr = (<UnaryExpr>ast).expr;
        expect(expr.id).toBe(Ast.PrefixExpr);
        expect((<UnaryExpr>expr).op.id).toBe(Tok.Plus);
        expr = (<UnaryExpr>expr).expr;
        expect(expr.id).toBe(Ast.Identifier);
      });
    });

    describe("Binary Expressions", () => {
      BINARY_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`a ${info.s} b`);
          expect(ast.id).toBe(Ast.BinaryExpr);
          expect((<BinaryExpr>ast).op.id).toBe(op);
        });
      });
    });

    describe("Assignment Expressions", () => {
      ASSIGNMENT_OPS.forEach((info, op) => {
        test(`${info.s}`, () => {
          const ast = expression(`a ${info.s} b`);
          expect(ast.id).toBe(Ast.AssignmentExpr);
          expect((<AssignmentExpr>ast).op.id).toBe(op);
        });
      });
    });
  });

  describe("Call Expression", () => {
    test("No parameters", () => {
      const ast = expression("print()");
      expect(ast.id).toBe(Ast.CallExpr);
      expect((<CallExpr>ast).args.count).toBe(0);
    });

    test("With Multiple Parameters", () => {
      const ast = expression(`print(10, 'c', print(), (1, "String"))`);
      expect(ast.id).toBe(Ast.CallExpr);
      expectNodeList(
        (<CallExpr>ast).args,
        { id: Ast.IntLit },
        { id: Ast.CharLit },
        { id: Ast.CallExpr },
        { id: Ast.TupleExpr },
      );
    });
  });

  describe("Call Expression", () => {
    test("No parameters", () => {
      const ast = expression("print()");
      expect(ast.id).toBe(Ast.CallExpr);
      expect((<CallExpr>ast).args.count).toBe(0);
    });

    test("With Multiple Parameters", () => {
      const ast = expression(`print(10, 'c', print(), (1, "String"))`);
      expect(ast.id).toBe(Ast.CallExpr);
      expectNodeList(
        (<CallExpr>ast).args,
        { id: Ast.IntLit },
        { id: Ast.CharLit },
        { id: Ast.CallExpr },
        { id: Ast.TupleExpr },
      );
    });
  });

  describe("Tuple Expression", () => {
    test("Empty", () => {
      const ast = expression("()");
      expect(ast.id).toBe(Ast.TupleExpr);
      expect((<TupleExpr>ast).elements.count).toBe(0);
    });

    test("With Multiple Members", () => {
      const ast = expression(`(10, 'c', print(), (1, "String"))`);
      expect(ast.id).toBe(Ast.TupleExpr);
      expectNodeList(
        (<TupleExpr>ast).elements,
        { id: Ast.IntLit },
        { id: Ast.CharLit },
        { id: Ast.CallExpr },
        { id: Ast.TupleExpr },
      );
    });
  });

  describe("Struct Expression", () => {
    test("Empty", () => {
      const ast = expression("User{}");
      expect(ast.id).toBe(Ast.StructExpr);
      expect((<StructExpr>ast).fields.count).toBe(0);
    });

    test("With Multiple Members", () => {
      const ast = expression(
        `User{age: 33, name: "Green", address: Address{}}`,
      );
      expect(ast.id).toBe(Ast.StructExpr);
      checkNodeList(
        (<StructExpr>ast).fields,
        (node: AstNode) => {
          expectFieldExpr(node, "age", Ast.IntLit);
        },
        (node: AstNode) => {
          expectFieldExpr(node, "name", Ast.StrLit);
        },
        (node: AstNode) => {
          expectFieldExpr(node, "address", Ast.StructExpr);
        },
      );
    });
  });

  describe("Array Expression", () => {
    test("Empty", () => {
      const ast = expression("[]");
      expect(ast.id).toBe(Ast.ArrayExpr);
      expect((<ArrayExpr>ast).elements.count).toBe(0);
    });

    test("Trailing Comma Allowed", () => {
      const ast = expression("[10]");
      expect(ast.id).toBe(Ast.ArrayExpr);
      expect((<ArrayExpr>ast).elements.count).toBe(1);
    });

    test("With Multiple Elements", () => {
      const ast = expression(`[10, 20, add(10, 20)]`);
      expect(ast.id).toBe(Ast.ArrayExpr);
      checkNodeList(
        (<ArrayExpr>ast).elements,
        (node: AstNode) => {
          expect(node.id == Ast.IntLit);
        },
        (node: AstNode) => {
          expect(node.id == Ast.IntLit);
        },
        (node: AstNode) => {
          expect(node.id == Ast.CallExpr);
        },
      );
    });
  });

  describe("Dot Expression", () => {
    test("Single", () => {
      const ast = expression(".create");
      expect(ast.id).toBe(Ast.DotExpr);
      expect((<DotExpr>ast).expr.id).toBe(Ast.Identifier);
    });
  });

  describe("Member Expression", () => {
    test("Identifier", () => {
      const ast = expression("create");
      expect(ast.id).toBe(Ast.Identifier);
      expect((<Identifier>ast).name).toBe("create");
    });

    test("Member Access", () => {
      const ast = expression("user.tea");
      expect(ast.id).toBe(Ast.MemberAccessExpr);
      expect((<MemberExpr>ast).target.id).toBe(Ast.Identifier);
      expect((<MemberExpr>ast).member.id).toBe(Ast.Identifier);
    });

    test("Bracket Expr Target", () => {
      const ast = expression("Command[Tea].Create");
      expect(ast.id).toBe(Ast.MemberAccessExpr);
      expect((<MemberExpr>ast).target.id).toBe(Ast.BracketExpr);
      expect((<MemberExpr>ast).member.id).toBe(Ast.Identifier);
    });

    test("Dot Expr Target", () => {
      const ast = expression(".Command.Create");
      expect(ast.id).toBe(Ast.MemberAccessExpr);
      expect((<MemberExpr>ast).target.id).toBe(Ast.DotExpr);
      expect((<MemberExpr>ast).member.id).toBe(Ast.Identifier);
    });

    test("Integer Member", () => {
      const ast = expression("tuple.0");
      expect(ast.id).toBe(Ast.MemberAccessExpr);
      expect((<MemberExpr>ast).target.id).toBe(Ast.Identifier);
      expect((<MemberExpr>ast).member.id).toBe(Ast.IntLit);
    });

    test("Path Like", () => {
      const ast = expression("tuple.10.x");
      expect(ast.id).toBe(Ast.MemberAccessExpr);
      expect((<MemberExpr>ast).target.id).toBe(Ast.MemberAccessExpr);
      expect((<MemberExpr>ast).member.id).toBe(Ast.Identifier);

      const target = <MemberExpr>(<MemberExpr>ast).target;
      expect(target.member.id).toBe(Ast.IntLit);
      expect(target.target.id).toBe(Ast.Identifier);
    });

    test("Nested Tuple Member", () => {
      const ast = expression("tuple.10.0.1");
      expect(ast.id).toBe(Ast.MemberAccessExpr);
      expect((<MemberExpr>ast).target.id).toBe(Ast.MemberAccessExpr);
      expect((<MemberExpr>ast).member.id).toBe(Ast.IntLit);

      let target = <MemberExpr>(<MemberExpr>ast).target;
      expect(target.member.id).toBe(Ast.IntLit);
      expect(target.target.id).toBe(Ast.MemberAccessExpr);

      target = <MemberExpr>(<MemberExpr>target).target;
      expect(target.member.id).toBe(Ast.IntLit);
      expect(target.target.id).toBe(Ast.Identifier);
    });
  });
});
