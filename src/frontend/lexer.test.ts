import { expect, test, describe } from "bun:test";
import { Logger } from "../common/diagnostics";
import { Lexer } from "./lexer";
import { Source } from "../common/source";
import { KEYWORDS, TOKEN_LIST, Tok } from "./token";

function createLexer(source: string) {
  return new Lexer(new Logger(), new Source("<test>", source));
}

function expectTokens(
  lexer: Lexer,
  ...all: { id: Tok; value?: number | boolean | string }[]
) {
  for (const expected of all) {
    const tok = lexer.next();

    expect(tok.id).toBe(expected.id);
    expect(tok.value).toBe(expected.value);
  }
}

describe("Lexer", () => {
  describe("String Expression", () => {
    test("Empty", () => {
      const lexer = createLexer("``");
      expectTokens(lexer, { id: Tok.LStrExpr }, { id: Tok.RStrExpr });
    });

    test("No expressions", () => {
      const lexer = createLexer("`Hello World`");
      expectTokens(
        lexer,
        { id: Tok.LStrExpr },
        { id: Tok.StrLit, value: "Hello World" },
        { id: Tok.RStrExpr },
      );
    });

    test("Expressions Only", () => {
      const lexer = createLexer("`${a}${10}${'b'}`");
      expectTokens(
        lexer,
        { id: Tok.LStrExpr },
        { id: Tok.Ident, value: "a" },
        { id: Tok.IntLit, value: 10 },
        { id: Tok.CharLit, value: "b" },
        { id: Tok.RStrExpr },
      );
    });

    test("Expression And Strings", () => {
      const lexer = createLexer(
        "`Your name is ${name}, you are ${age} years old`",
      );
      expectTokens(
        lexer,
        { id: Tok.LStrExpr },
        { id: Tok.StrLit, value: "Your name is " },
        { id: Tok.Ident, value: "name" },
        { id: Tok.StrLit, value: ", you are " },
        { id: Tok.Ident, value: "age" },
        { id: Tok.StrLit, value: " years old" },
        { id: Tok.RStrExpr },
      );
    });

    test("Complex Expressions", () => {
      const lexer = createLexer("`a + b = ${a + (b * 2)}!`");
      expectTokens(
        lexer,
        { id: Tok.LStrExpr },
        { id: Tok.StrLit, value: "a + b = " },
        { id: Tok.Ident, value: "a" },
        { id: Tok.Plus },
        { id: Tok.LParen },
        { id: Tok.Ident, value: "b" },
        { id: Tok.Multiply },
        { id: Tok.IntLit, value: 2 },
        { id: Tok.RParen },
        { id: Tok.StrLit, value: "!" },
        { id: Tok.RStrExpr },
      );
    });

    test("Unsupported nesting", () => {
      const lexer = createLexer("`Hello ${`hello`} `");
      expectTokens(
        lexer,
        { id: Tok.LStrExpr },
        { id: Tok.StrLit, value: "Hello " },
        { id: Tok.StrLit, value: " " },
        { id: Tok.RStrExpr },
        { id: Tok.Eof },
      );
    });
  });

  describe("Floating Point", () => {
    test("Simple", () => {
      expectTokens(createLexer("0.0"), { id: Tok.FloatLit, value: 0.0 });
      expectTokens(createLexer(".0"), { id: Tok.FloatLit, value: 0.0 });
      expectTokens(createLexer("0."), { id: Tok.FloatLit, value: 0.0 });
      expectTokens(createLexer("0. "), { id: Tok.FloatLit, value: 0.0 });
      expectTokens(createLexer("0.10201"), {
        id: Tok.FloatLit,
        value: 0.10201,
      });
      expectTokens(createLexer("100.12900202"), {
        id: Tok.FloatLit,
        value: 100.12900202,
      });
    });

    test("Exponents", () => {
      expectTokens(createLexer("1.0e10"), { id: Tok.FloatLit, value: 1e10 });
      expectTokens(createLexer("1E10"), { id: Tok.FloatLit, value: 1e10 });
      expectTokens(createLexer("1e-10"), { id: Tok.FloatLit, value: 1e-10 });
      expectTokens(createLexer("0.001E+10"), {
        id: Tok.FloatLit,
        value: 0.001e10,
      });
      expectTokens(
        createLexer("0.001Ea"),
        { id: Tok.FloatLit, value: 0.001 },
        { id: Tok.Ident, value: "Ea" },
      );
      expectTokens(
        createLexer("1.0e"),
        { id: Tok.FloatLit, value: 1.0 },
        { id: Tok.Ident, value: "e" },
      );
    });
  });

  describe("Integers", () => {
    test("Base 10", () => {
      expectTokens(createLexer("0"), { id: Tok.IntLit, value: 0 });
      expectTokens(createLexer("1"), { id: Tok.IntLit, value: 1 });
      expectTokens(
        createLexer("1000 1000"),
        { id: Tok.IntLit, value: 1000 },
        { id: Tok.IntLit, value: 1000 },
      );
    });

    test("Other Bases", () => {
      expectTokens(createLexer("0xa"), { id: Tok.IntLit, value: 0xa });
      expectTokens(createLexer("0x00ef"), { id: Tok.IntLit, value: 0x00ef });
      expectTokens(
        createLexer("0x00efgfff"),
        { id: Tok.IntLit, value: 0x00ef },
        { id: Tok.Ident, value: "gfff" },
      );
      expectTokens(createLexer("0b01010101"), {
        id: Tok.IntLit,
        value: 0b01010101,
      });
      expectTokens(
        createLexer("0b0102000"),
        { id: Tok.IntLit, value: 0b010 },
        { id: Tok.IntLit, value: 2000 },
      );
      expectTokens(createLexer("0o760"), { id: Tok.IntLit, value: 0o760 });
      expectTokens(
        createLexer("0o760890"),
        { id: Tok.IntLit, value: 0o760 },
        { id: Tok.IntLit, value: 890 },
      );
    });
  });

  describe("Keywords", () => {
    for (let kw = Tok.KwStart; kw <= Tok.KwEnd; kw++) {
      const keyword: string = TOKEN_LIST[kw].s;
      test(keyword, () => {
        expectTokens(createLexer(keyword), { id: kw });
        expectTokens(createLexer(keyword + keyword), {
          id: Tok.Ident,
          value: keyword + keyword,
        });
        expectTokens(
          createLexer(keyword + " " + keyword),
          { id: kw },
          { id: kw },
        );
        expectTokens(
          createLexer(keyword + " hello "),
          { id: kw },
          { id: Tok.Ident, value: "hello" },
        );
      });
    }
  });
});
