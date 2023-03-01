import {
  AssignmentExpression,
  AstNode,
  AstNodeList,
  BinaryExpression,
  BoolLit,
  BracketExpression,
  CallExpression,
  CharacterLit,
  FloatLit,
  GroupingExpression,
  Identifier as Identifier,
  IntegerLit,
  MemberAccessExpression,
  NewExpression,
  PostfixExpression,
  PrefixExpression,
  SpreadExpression,
  StringExpression,
  StringLit,
  TernaryExpression,
  TupleExpression,
  UnaryExpression,
  YieldExpression,
} from "./ast";
import { Logger } from "./diagnostics";
import { Lexer } from "./lexer";
import { Range } from "./source";
import { Tok, Token } from "./token";

export class Parser {
  la: [Token, Token, Token, Token] = [
    new Token(Tok.Eof),
    new Token(Tok.Eof),
    new Token(Tok.Eof),
    new Token(Tok.Eof),
  ];

  constructor(private L: Logger, private lexer: Lexer) {
    this.la[1] = this.lexer.next();
    this.la[2] = this.lexer.next();
    this.la[3] = this.lexer.next();
  }

  parse(): AstNode {
    return this.expression();
  }

  private advance(): Token {
    var tok = this.la[1];
    this.la.shift()!;
    this.la[3] = this.lexer.next();
    return tok;
  }

  private previous(): Token {
    return this.la[0];
  }

  private peek(at: 1 | 2 | 3 = 1): Token {
    return this.la[at];
  }

  private check(...ids: Tok[]): Token | undefined {
    const tok = this.peek();
    if (ids.includes(tok.id)) return tok;
  }

  private match(...ids: Tok[]): Token | undefined {
    const tok = this.peek();
    if (ids.includes(tok.id)) {
      this.advance();
      return tok;
    }
  }

  private consume(id: Tok, msg?: string): Token {
    const tok = this.check(id);
    if (!tok) {
      const curr = this.peek();
      this.L.error(curr.range!, msg);
      throw Error();
    }
    this.advance();
    return tok;
  }

  private error(msg: string) {
    this.L.error(this.peek().range!, msg);
    throw Error();
  }

  private expression(): AstNode {
    return this.ternary();
  }

  private spread(): AstNode {
    if (this.match(Tok.DotDotDot)) {
      const range = this.previous().range;
      const expr = this.yieldExpr();
      return new SpreadExpression(expr, Range.extend(range, expr.range));
    }

    return this.yieldExpr();
  }

  private yieldExpr(): AstNode {
    if (this.match(Tok.Yield)) {
      const range = this.previous().range;
      const hasStar = this.match(Tok.Multiply) !== undefined;
      const expr = this.ternary();
      return new YieldExpression(
        expr,
        hasStar,
        Range.extend(expr.range, range)
      );
    }

    return this.ternary();
  }

  private ternary(): AstNode {
    var expr = this.assignment();
    if (this.match(Tok.Question)) {
      const ifTrue = this.ternary();

      this.consume(
        Tok.Colon,
        "expecting a colon ':' to separate a ternary expression."
      );

      const ifFalse = this.ternary();
      expr = new TernaryExpression(expr, ifTrue, ifFalse, expr.range);
      expr.range = Range.extend(expr.range, ifFalse.range);
    }

    return expr;
  }

  private assignment(): AstNode {
    var expr = this.coalescing();
    switch (this.peek().id) {
      case Tok.Assign:
      case Tok.MinusEq:
      case Tok.PlusEq:
      case Tok.MultEq:
      case Tok.DivEq:
      case Tok.ModEq:
      case Tok.ShlEq:
      case Tok.ShrEq:
      case Tok.AShrEq:
      case Tok.BAndEq:
      case Tok.BOrEq:
      case Tok.BXorEq:
      case Tok.LAndEq:
      case Tok.LOrEq:
      case Tok.PowEq:
      case Tok.DQuestionEq:
        const op = this.advance().id;
        const value = this.assignment();
        expr = new AssignmentExpression(expr, op, value, expr.range);
        expr.range = Range.extend(expr.range, value.range);
        return expr;
      default:
        break;
    }

    return expr;
  }

  private coalescing(): AstNode {
    var expr = this.lor();
    if (this.match(Tok.DQuestion)) {
      const rhs = this.lor();
      expr = new BinaryExpression(expr, Tok.DQuestion, rhs, expr.range);
      expr.range = Range.extend(expr.range, rhs.range);
    }

    return expr;
  }

  private lor(): AstNode {
    var expr = this.land();

    while (this.match(Tok.LOr)) {
      const right = this.land();
      expr = new BinaryExpression(expr, Tok.LOr, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private land(): AstNode {
    var expr = this.bor();

    while (this.match(Tok.LAnd)) {
      const right = this.bor();
      expr = new BinaryExpression(expr, Tok.LAnd, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private bor(): AstNode {
    var expr = this.bxor();

    while (this.match(Tok.BOr)) {
      const right = this.bxor();
      expr = new BinaryExpression(expr, Tok.BOr, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private bxor(): AstNode {
    var expr = this.band();

    while (this.match(Tok.BXor)) {
      const right = this.band();
      expr = new BinaryExpression(expr, Tok.BXor, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private band(): AstNode {
    var expr = this.equality();

    while (this.match(Tok.BAnd)) {
      const right = this.equality();
      expr = new BinaryExpression(expr, Tok.BAnd, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private equality(): AstNode {
    var expr = this.comparison();

    while (this.match(Tok.NotEq, Tok.Equal, Tok.StrictNotEq, Tok.StrictEq)) {
      const op = this.previous().id;
      const right = this.comparison();
      expr = new BinaryExpression(expr, op, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private comparison(): AstNode {
    var expr = this.bitshift();

    while (
      this.match(Tok.Gt, Tok.Gte, Tok.Lt, Tok.Lte, Tok.In, Tok.Instanceof)
    ) {
      const op = this.previous().id;
      const right = this.bitshift();
      expr = new BinaryExpression(expr, op, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private bitshift(): AstNode {
    var expr = this.terminal();

    while (this.match(Tok.Shl, Tok.Shr, Tok.AShr)) {
      const op = this.previous();
      const right = this.terminal();

      expr = new BinaryExpression(expr, op.id, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private terminal(): AstNode {
    var expr = this.factor();

    while (this.match(Tok.Minus, Tok.Plus)) {
      const op = this.previous().id;
      const right = this.factor();

      expr = new BinaryExpression(expr, op, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private factor(): AstNode {
    var expr = this.exponentiation();

    while (this.match(Tok.Divide, Tok.Multiply, Tok.Mod)) {
      const op = this.previous();
      const right = this.exponentiation();

      expr = new BinaryExpression(expr, op.id, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private exponentiation(): AstNode {
    var expr = this.nots();

    while (this.match(Tok.Pow)) {
      const right = this.nots();

      expr = new BinaryExpression(expr, Tok.Pow, right, expr.range);
      expr.range = Range.extend(expr.range, right.range);
    }

    return expr;
  }

  private nots(): AstNode {
    if (this.match(Tok.BNot, Tok.LNot)) {
      const op = this.previous();
      const right = this.nots();

      const expr = new UnaryExpression(op.id, right);
      expr.range = Range.extend(op.range, right.range);

      return expr;
    }

    return this.unary();
  }

  private unary(): AstNode {
    if (this.match(Tok.Plus, Tok.Minus)) {
      const op = this.previous();
      const right = this.unary();

      const expr = new UnaryExpression(op.id, right);
      expr.range = Range.extend(op.range, right.range);

      return expr;
    }

    return this.prefix();
  }

  private prefix(): AstNode {
    if (
      this.match(
        Tok.MinusMinus,
        Tok.PlusPlus,
        Tok.Typeof,
        Tok.Delete,
        Tok.Await,
        Tok.Void
      )
    ) {
      const op = this.previous();
      const right = this.prefix();

      const expr = new PrefixExpression(op.id, right);
      expr.range = Range.extend(op.range, right.range);

      return expr;
    }

    var expr = this.newExpr();
    while (this.match(Tok.MinusMinus, Tok.PlusPlus)) {
      const op = this.previous();
      expr = new PostfixExpression(op.id, expr);
      expr.range = Range.extend(expr.range, op.range);
    }

    return expr;
  }

  private newExpr(): AstNode {
    if (this.match(Tok.New)) {
      const range = this.previous().range;
      const expr = this.call();
      return new NewExpression(expr, Range.extend(range, expr.range));
    }

    return this.call();
  }

  private call(): AstNode {
    var expr = this.bracket()!;

    while (true) {
      if (this.match(Tok.LParen)) {
        const args = new AstNodeList();
        if (!this.check(Tok.RParen)) {
          do {
            const arg = this.expression();
            args.add(arg);
          } while (this.match(Tok.Comma));
        }

        const tok = this.consume(
          Tok.RParen,
          "expecting a closing paren '(' to end function arguments"
        );

        const call = new CallExpression(expr, args);
        call.range = Range.extend(expr?.range, tok!.range);
        expr = call;
      } else {
        break;
      }
    }

    return expr;
  }

  private bracket(): AstNode {
    var expr = this.memberAccess();

    while (this.match(Tok.LBracket)) {
      const range = expr?.range;
      const index = this.expression();
      this.consume(Tok.RBracket, "expecting a closing bracket ']'");
      expr = new BracketExpression(
        expr,
        index,
        Range.extend(range, index.range)
      );
    }

    return expr;
  }

  private memberAccess(): AstNode {
    var expr = this.primary()!;

    while (this.match(Tok.Dot, Tok.QuestionDot)) {
      const range = expr?.range;
      const op = this.previous().id;
      const member = this.expression();
      expr = new MemberAccessExpression(
        expr,
        op,
        member,
        Range.extend(range, member.range)
      );
    }

    return expr;
  }

  private primary(): AstNode | undefined {
    const lit = this.literal();
    if (lit) {
      this.advance();
      return lit;
    }

    if (this.check(Tok.LStrExpr)) {
      var tok = this.advance();
      var str = new StringExpression(tok?.range);
      while (!this.match(Tok.RStrExpr)) {
        str.add(this.expression());
        tok = this.peek();
      }

      str.range = Range.extend(tok.range, this.previous().range);
      return str;
    }

    if (this.check(Tok.Ident)) {
      var tok = this.advance();
      return new Identifier(tok?.value as string, tok?.range);
    }

    const range = this.peek().range;

    if (this.match(Tok.LParen)) {
      const range = this.previous().range;
      var expr = this.expression();
      if (this.check(Tok.Comma)) {
        // this should be a tuple expression
        var tuple = new TupleExpression(new AstNodeList(), range);
        tuple.add(expr);
        while (this.match(Tok.Comma)) {
          tuple.add(this.expression());
        }
        tuple.range = Range.extend(range, this.previous().range);
        return tuple;
      }

      this.consume(Tok.RParen, "expecting a closing ')' after expression.");

      return new GroupingExpression(
        expr,
        Range.extend(range, this.previous().range)
      );
    }

    this.error("unexpected token, expecting an expression");
  }

  private literal(): AstNode | undefined {
    const tok = this.peek();
    switch (tok?.id) {
      case Tok.True:
      case Tok.False:
        return new BoolLit(tok.id === Tok.True, tok.range);
      case Tok.CharLit:
        return new CharacterLit(tok.value as string, tok.range);
      case Tok.StrLit:
        return new StringLit(tok.value as string, tok.range);
      case Tok.IntLit:
        return new IntegerLit(tok.value as number, tok.range);
      case Tok.FloatLit:
        return new FloatLit(tok.value as number, tok.range);
      default:
        return undefined;
    }
  }
}
