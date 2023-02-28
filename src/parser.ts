import {
  AstNode,
  CharacterLit,
  FloatLit,
  Indentifier,
  IntegerLit,
  StringLit,
} from "./ast";
import { Logger } from "./diagnostics";
import { Lexer } from "./lexer";
import { Tok, Token } from "./token";

export class Parser {
  la: [Token, Token, Token] = [
    new Token(Tok.Eof),
    new Token(Tok.Eof),
    new Token(Tok.Eof),
  ];

  constructor(private L: Logger, private lexer: Lexer) {
    this.la[0] = this.lexer.next();
    this.la[1] = this.lexer.next();
    this.la[2] = this.lexer.next();
  }

  parse(): AstNode {
    return this.terminal();
  }

  private advance() {
    const tok = this.la.shift();
    this.la[2] = this.lexer.next();
    return tok;
  }

  private peek(at: 0 | 1 | 2 = 0): Token {
    return this.la[at];
  }

  private check(...ids: Tok[]): Token | undefined {
    const tok = this.peek();
    if (ids.includes(tok.id)) return tok;
  }

  private consume(id: Tok, msg?: string): Token | undefined {
    const tok = this.check(id);
    if (!tok) {
      const curr = this.peek();
      this.L.error(curr.range!, msg);
      throw Error();
    }
    return tok;
  }

  private terminal(): AstNode {
    const tok = this.advance();
    switch (tok?.id) {
      case Tok.CharLit:
        return new CharacterLit(tok.value as string, tok.range);
      case Tok.StrLit:
        return new StringLit(tok.value as string, tok.range);
      case Tok.IntLit:
        return new IntegerLit(tok.value as number, tok.range);
      case Tok.FloatLit:
        return new FloatLit(tok.value as number, tok.range);
      case Tok.Ident:
        return new Indentifier(tok.value as string, tok.range);
      default:
        this.L.error(tok?.range!, "expecting a terminal token");
        throw Error();
    }
  }
}
