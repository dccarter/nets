import { expect, test, describe } from "bun:test";
import { Logger } from "./diagnostics";
import { Lexer } from "./lexer";
import { Source } from "./source";
import { Tok } from "./token";

function createLexer(source: string) {
  return new Lexer(new Logger(), new Source("<test>", source));
}

function expectTokens(
  lexer: Lexer,
  ...all: { id: Tok; value?: number | boolean | string }[]
) {
  for (const expected of all) {
    const tok = lexer.next();
    console.log(Tok[tok.id], Tok[expected.id], tok.value);

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
        { id: Tok.RStrExpr }
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
        { id: Tok.RStrExpr }
      );
    });

    test("Expression And Strings", () => {
      const lexer = createLexer(
        "`Your name is ${name}, you are ${age} years old`"
      );
      expectTokens(
        lexer,
        { id: Tok.LStrExpr },
        { id: Tok.StrLit, value: "Your name is " },
        { id: Tok.Ident, value: "name" },
        { id: Tok.StrLit, value: ", you are " },
        { id: Tok.Ident, value: "age" },
        { id: Tok.StrLit, value: " years old" },
        { id: Tok.RStrExpr }
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
        { id: Tok.RStrExpr }
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
        { id: Tok.Eof }
      );
    });
  });
});
