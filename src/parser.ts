import {
  ArrayExpression,
  ArrayType,
  AssignmentExpression,
  Ast,
  AstNode,
  AstNodeList,
  Attribute,
  AttributeValue,
  BinaryExpression,
  BoolLit,
  BracketExpression,
  CallExpression,
  CharacterLit,
  ClosureExpression,
  CodeBlock,
  Declaration,
  ExpressionStatement,
  FloatLit,
  FunctionDeclaration,
  FunctionParam,
  FunctionParams,
  FunctionType,
  GenericTypeParam,
  Identifier,
  IntegerLit,
  isValueDeclaration,
  MemberAccessExpression,
  Operation,
  PointerType,
  PostfixExpression,
  PrefixExpression,
  PrimitiveType,
  Program,
  SignatureExpression,
  StringExpression,
  StringLit,
  StructExpression,
  StructFieldExpression,
  TupleExpression,
  TupleType,
  UnaryExpression,
  VariableDeclaration,
} from "./ast";
import {
  ASSIGNMENT_OPS,
  binaryOperatorPrecedence,
  MAX_BINARY_OP_PRECEDENCE,
  PRIMITIVE_TYPES,
  Tok,
  Token,
  TOKEN_LIST,
} from "./token";

import { Logger } from "./diagnostics";
import { Lexer } from "./lexer";
import { Range } from "./source";

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

  private dumpTokenState() {
    console.log(
      Tok[this.la[0].id],
      `(${Tok[this.la[1].id]})`,
      Tok[this.la[2].id],
      Tok[this.la[3].id]
    );
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

  private Eof(): boolean {
    return this.peek().id === Tok.Eof;
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
      this.error(
        msg ||
          `unexpected token, expecting '${TOKEN_LIST[id].s}', but got '${
            TOKEN_LIST[curr.id].s
          }'`
      );
    }
    this.advance();
    return tok!;
  }

  private error(msg: string, range?: Range) {
    this.L.error(range || this.peek().range!, msg);
    throw Error(msg);
  }

  reportUnexpectedToken(expected: string, tok?: Token) {
    tok ??= this.peek();
    this.L.error(
      tok.range!,
      `unexpected token '${TOKEN_LIST[tok.id].s}', expecting ${expected}`
    );
    throw Error();
  }

  private parseNull(): AstNode {
    const tok = this.consume(Tok.Null);
    return new AstNode(Ast.Null, tok.range);
  }

  private parseUndefined(): AstNode {
    const tok = this.consume(Tok.Undefined);
    return new AstNode(Ast.Undefined, tok.range);
  }

  private bool(): AstNode {
    const tok = this.match(Tok.True, Tok.False);
    if (tok === undefined)
      this.reportUnexpectedToken(
        "boolean literals 'true'/'false'",
        this.advance()
      );
    return new BoolLit(tok!.id === Tok.True, tok!.range);
  }

  private character(): AstNode {
    const tok = this.consume(Tok.CharLit);
    return new CharacterLit(tok.value as string, tok.range);
  }

  private integer(): AstNode {
    const tok = this.consume(Tok.IntLit);
    return new IntegerLit(tok.value as number, tok.range);
  }

  private float(): AstNode {
    const tok = this.consume(Tok.FloatLit);
    return new FloatLit(tok.value as number, tok.range);
  }

  private string(): AstNode {
    const tok = this.consume(Tok.StrLit);
    return new StringLit(tok.value as string, tok.range);
  }

  private identifier(): Identifier {
    const tok = this.consume(Tok.Ident);
    return new Identifier(tok.value as string, tok.range);
  }

  private expression(): AstNode {
    return this.assign(() => this.primary(true));
  }

  private statement(): AstNode {
    switch (this.peek().id) {
      case Tok.Var:
      case Tok.Const:
        return this.variable();
      case Tok.Func:
        if (this.peek(2).id === Tok.Ident) return this.funcDecl();
      // fallthrough
      default:
        const expr = this.expression();
        return new ExpressionStatement(expr, expr.range);
    }
  }

  private many(stop: Tok, sep: Tok, one: () => AstNode): AstNodeList {
    const nodes = new AstNodeList();
    while (!this.check(stop) && !this.Eof()) {
      nodes.add(one());
      if (!this.match(sep) && !this.check(stop)) {
        this.reportUnexpectedToken(
          `a '${TOKEN_LIST[stop].s}' or '${TOKEN_LIST[sep].s}'`,
          this.advance()
        );
      }
    }
    return nodes;
  }

  private oneOrMore(
    msg: string,
    stop: Tok,
    sep: Tok,
    one: () => AstNode
  ): AstNodeList {
    const nodes = this.many(stop, sep, one);
    if (nodes.count === 0) {
      this.error(`expecting at least 1 ${msg}`);
    }
    return nodes;
  }

  private pathElement(): AstNode {
    const name = this.identifier();
    var typeArgs = undefined;
    if (this.match(Tok.LBracket)) {
      typeArgs = this.many(Tok.RBracket, Tok.Comma, () => this.parseType());
      this.consume(Tok.RBracket);

      return new BracketExpression(
        name,
        typeArgs,
        Range.extend(name.range, this.previous().range)
      );
    }

    return name;
  }

  private path(): AstNode {
    var target = this.pathElement();
    while (this.match(Tok.Dot, Tok.QuestionDot) && this.check(Tok.Ident)) {
      const op = this.previous();
      const member = this.pathElement();
      target = new MemberAccessExpression(
        target,
        { id: op.id, range: op.range },
        member,
        Range.extend(target.range, member.range)
      );
    }

    return target;
  }

  private member(op: Operation, target: AstNode): AstNode {
    var member: AstNode | undefined = undefined;

    if (this.peek().id == Tok.IntLit) {
      member = this.integer();
    } else {
      member = this.path();
    }

    return new MemberAccessExpression(
      target,
      op,
      member!,
      Range.extend(target.range, member!.range)
    );
  }

  private tuple(
    create: (args: AstNodeList, range?: Range) => AstNode,
    one: () => AstNode
  ): AstNode {
    const start = this.consume(Tok.LParen);
    const args = this.many(Tok.RParen, Tok.Comma, one);
    this.consume(Tok.RParen);

    return create(args, Range.extend(start.range, this.previous().range));
  }

  private tupleExpression(): AstNode {
    return this.tuple(
      (args, range) => new TupleExpression(args, range),
      () => this.expression()
    );
  }

  private callExpression(callee: AstNode): AstNode {
    const args = this.tupleExpression();

    return new CallExpression(
      callee,
      (<TupleExpression>args).elements,
      Range.extend(callee.range, args.range)
    );
  }

  private block(): AstNode {
    const tok = this.consume(Tok.LBrace);
    const stmts = new AstNodeList();
    while (!this.check(Tok.RBrace) && !this.Eof()) {
      this.synchronized(() => {
        stmts.add(this.statement());
        this.match(Tok.Semicolon);
      });
    }
    this.consume(Tok.RBrace);

    return new CodeBlock(stmts, Range.extend(tok.range, this.previous().range));
  }

  private array(): AstNode {
    const tok = this.consume(Tok.LBracket);
    const elems = this.many(Tok.RBracket, Tok.Comma, () => this.expression());
    this.consume(Tok.RBracket);

    return new ArrayExpression(
      elems,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private closure(): AstNode {
    const tok = this.peek();
    const isAsync = this.match(Tok.Async);
    this.consume(Tok.Func);
    const params = this.tuple(
      (args, range) => new FunctionParams(args, range),
      () => this.funcParam()
    );

    var ret: AstNode | undefined;
    if (this.match(Tok.Colon)) ret = this.parseType();

    this.consume(Tok.FatArrow);

    const body = this.expression();

    return new ClosureExpression(
      new SignatureExpression(
        params,
        ret,
        ret ? Range.extend(params.range, ret.range) : params.range
      ),
      body,
      isAsync !== undefined,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private struct(lhs: AstNode, field: () => AstNode): AstNode {
    const tok = this.consume(Tok.LBrace);
    const fields = this.many(Tok.RBrace, Tok.Comma, field);
    this.consume(Tok.RBrace);

    return new StructExpression(
      lhs,
      fields,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private field(parseValue: () => AstNode): AstNode {
    const name = this.identifier();
    this.consume(Tok.Colon);
    const val = parseValue();

    return new StructFieldExpression(
      name,
      val,
      Range.extend(name.range, val.range)
    );
  }

  private postfix(primary: () => AstNode): AstNode {
    var operand = primary();
    while (true) {
      switch (this.peek().id) {
        case Tok.PlusPlus:
        case Tok.MinusMinus:
          break;
        case Tok.Dot:
        case Tok.QuestionDot: {
          const tok = this.advance();
          operand = this.member({ ...tok }, operand);
          continue;
        }
        case Tok.LParen: {
          operand = this.callExpression(operand);
          continue;
        }
        default:
          return operand;
      }

      const tok = this.advance();
      return new PostfixExpression(
        { ...tok },
        operand,
        Range.extend(tok.range, operand.range)
      );
    }
  }

  private prefix(primary: () => AstNode): AstNode {
    switch (this.peek().id) {
      case Tok.PlusPlus:
      case Tok.MinusMinus:
      case Tok.Minus:
      case Tok.Plus:
      case Tok.LNot:
      case Tok.BNot:
      case Tok.BAnd:
      case Tok.Multiply:
      case Tok.Await:
      case Tok.Delete:
        break;
      default:
        return this.postfix(primary);
    }

    const tok = this.advance();
    const operand = this.prefix(primary);
    return new PrefixExpression(
      { ...tok },
      operand,
      Range.extend(tok.range, operand.range)
    );
  }

  private binary(lhs: AstNode, prec: number, primary: () => AstNode): AstNode {
    while (!this.Eof()) {
      const tok = this.peek();
      const nextPrecedence = binaryOperatorPrecedence(tok.id);

      if (nextPrecedence > prec) break;
      if (nextPrecedence < prec)
        lhs = this.binary(lhs, nextPrecedence, primary);
      else {
        this.advance();
        const rhs = this.prefix(primary);
        lhs = new BinaryExpression(
          lhs,
          { ...tok },
          rhs,
          Range.extend(lhs.range, rhs.range)
        );
      }
    }

    return lhs;
  }

  private assign(primary: () => AstNode): AstNode {
    const lhs = this.prefix(primary);
    const tok = this.peek();
    if (ASSIGNMENT_OPS.get(tok.id)) {
      this.advance();
      const rhs = this.assign(primary);
      return new AssignmentExpression(
        lhs,
        { ...tok },
        rhs,
        Range.extend(lhs.range, rhs.range)
      );
    }

    return this.binary(lhs, MAX_BINARY_OP_PRECEDENCE, primary);
  }

  private stringExpr(): AstNode {
    const tok = this.consume(Tok.LStrExpr);
    const parts = new AstNodeList();

    while (!this.check(Tok.RStrExpr) && !this.Eof()) {
      parts.add(this.expression());
    }
    this.consume(Tok.RStrExpr);

    return new StringExpression(
      parts,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private primary(allowStructs: boolean): AstNode {
    switch (this.peek().id) {
      case Tok.Null:
        return this.parseNull();
      case Tok.Undefined:
        return this.parseUndefined();
      case Tok.True:
      case Tok.False:
        return this.bool();
      case Tok.CharLit:
        return this.character();
      case Tok.IntLit:
        return this.integer();
      case Tok.FloatLit:
        return this.float();
      case Tok.StrLit:
        return this.string();
      case Tok.LParen:
        return this.tupleExpression();
      case Tok.LStrExpr:
        return this.stringExpr();
      case Tok.LBrace:
        return this.block();
      case Tok.LBracket:
        return this.array();
      case Tok.Ident: {
        const path = this.path();
        if (allowStructs && this.check(Tok.LBrace))
          return this.struct(path, () => this.field(() => this.expression()));
        return path;
      }
      case Tok.Async:
      case Tok.Func:
        return this.closure();
      default:
        this.reportUnexpectedToken("a primary expression", this.advance());
    }

    throw "UNREACHABLE";
  }

  private primitive(): AstNode {
    const tok = this.peek();
    if (!PRIMITIVE_TYPES.get(tok.id)) {
      this.reportUnexpectedToken("expecting a primitive type", this.advance());
    }
    this.advance();
    return new PrimitiveType(tok.id, tok.range);
  }

  private arrayType(): AstNode {
    const tok = this.consume(Tok.LBracket);
    const elementType = this.parseType();
    this.consume(Tok.RBracket);

    return new ArrayType(
      elementType,
      Range.extend(tok.range, this.previous().range)
    );
  }

  /**
   * @syntax `
   * constraint : identifier
   * constraints : constraint ('|' constraints)*
   * `
   */
  private genericTypeParamConstraints(): AstNodeList {
    const constraints = new AstNodeList();
    do {
      constraints.add(this.identifier());
    } while (this.match(Tok.BOr));
    return constraints;
  }

  /**
   * @syntax
   * `
   * type-param : identifier ( ':' constraints)?
   * `
   */
  private genericTypeParam(): AstNode {
    const name = this.identifier();
    var constraints: AstNodeList = new AstNodeList();
    if (this.match(Tok.Colon)) {
      constraints = this.genericTypeParamConstraints();
    }

    return new GenericTypeParam(
      name,
      constraints,
      Range.extend(name.range, this.previous().range)
    );
  }

  /**
   * @syntax
   * `
   * generic-type-params: type-param (',' type-param)*
   * `
   */
  private genericTypeParams(): AstNodeList {
    if (this.match(Tok.LBracket)) {
      const params = this.oneOrMore(
        "generic type parameters",
        Tok.RBracket,
        Tok.Comma,
        () => this.genericTypeParam()
      );
      this.consume(Tok.RBracket);
      return params;
    }

    return new AstNodeList();
  }

  /**
   * @syntax
   *
   * `
   * functype : `func` generic-type-params? tuple-type '->' type
   * `
   */
  private funcType(): AstNode {
    const isAsync = this.match(Tok.Async);
    const tok = this.consume(Tok.Func);

    const typeParams = this.genericTypeParams();

    const params = this.tuple(
      (args, range) => new TupleType(args, range),
      () => this.parseType()
    );

    this.consume(Tok.Arrow);
    const ret = this.parseType();

    return new FunctionType(
      params,
      ret,
      typeParams,
      isAsync != undefined,
      Range.extend(isAsync ? isAsync.range : tok.range, ret.range)
    );
  }

  private pointerType(): AstNode {
    const tok = this.consume(Tok.BAnd);
    const isConst = this.match(Tok.Const);
    const pointee = this.parseType();

    return new PointerType(
      pointee,
      isConst !== undefined,
      Range.extend(tok.range, pointee.range)
    );
  }

  private parseType(): AstNode {
    const tok = this.peek();
    if (PRIMITIVE_TYPES.get(tok.id)) {
      return this.primitive();
    }

    switch (tok.id) {
      case Tok.Ident:
        return this.path();
      case Tok.LParen:
        return this.tuple(
          (args, range) => new TupleType(args, range),
          () => this.parseType()
        );
      case Tok.LBracket:
        return this.arrayType();
      case Tok.Async:
      case Tok.Func:
        return this.funcType();
      case Tok.BAnd:
        return this.pointerType();
      default:
        this.reportUnexpectedToken("a type", this.advance());
    }

    throw "UNREACHABLE";
  }

  private attribute(): AstNode {
    const name = this.identifier();
    const params = new AstNodeList();
    if (this.match(Tok.LParen)) {
      while (!this.check(Tok.RParen) && !this.Eof()) {
        const pname = this.identifier();
        this.consume(Tok.Colon);
        var value: AstNode;
        switch (this.peek().id) {
          case Tok.True:
          case Tok.False:
            value = this.bool();
            break;
          case Tok.Char:
            value = this.character();
            break;
          case Tok.IntLit:
            value = this.integer();
            break;
          case Tok.FloatLit:
            value = this.float();
            break;
          case Tok.StrLit:
            value = this.string();
            break;
          default:
            this.reportUnexpectedToken("string/float/int/char/bool literal");
            break;
        }
        params.add(
          new AttributeValue(
            pname,
            value!,
            Range.extend(pname.range, value!.range)
          )
        );

        this.match(Tok.Comma);
      }
      this.consume(Tok.LParen);
    }

    return new Attribute(
      name,
      params,
      Range.extend(name.range, this.previous().range)
    );
  }

  private attributes(): AstNodeList {
    const tok = this.consume(Tok.At);
    var attrs: AstNodeList;
    if (this.check(Tok.LBracket)) {
      attrs = this.many(Tok.RBracket, Tok.Comma, () => this.attribute());
      this.consume(Tok.RBracket);
    } else {
      const attr = this.attribute();
      attrs = new AstNodeList();
      attrs.add(attr);
    }

    return attrs;
  }

  private variable(isPublic?: Token): AstNode {
    const tok = this.match(Tok.Const, Tok.Var);
    if (tok === undefined) {
      this.reportUnexpectedToken("'const' or 'var'", this.advance());
    }
    var names: AstNodeList;
    if (this.match(Tok.LParen)) {
      names = this.oneOrMore("variable names", Tok.RParen, Tok.Comma, () =>
        this.identifier()
      );
      this.consume(Tok.RParen);
    } else {
      const name = this.identifier();
      names = new AstNodeList();
      names.add(name);
    }

    var type: AstNode | undefined;
    if (this.match(Tok.Colon)) type = this.parseType();

    var init: AstNode | undefined;
    if (tok?.id === Tok.Const) this.consume(Tok.Assign);
    if (tok?.id === Tok.Const || this.match(Tok.Assign))
      init = this.expression();

    return new VariableDeclaration(
      tok!.id,
      names,
      type,
      init,
      isPublic !== undefined,
      Range.extend(tok?.range, this.previous().range)
    );
  }

  private funcParam(): AstNode {
    const tok = this.peek();
    const isVariadic = this.match(Tok.DotDotDot);
    const name = this.identifier();
    this.consume(Tok.Colon);
    const type = this.parseType();

    return new FunctionParam(
      name,
      type,
      isVariadic !== undefined,
      Range.extend(tok.range, type.range)
    );
  }

  private funcDecl(isPublic?: Token): AstNode {
    const tok = this.peek();
    const isAsync = this.match(Tok.Async);
    this.consume(Tok.Func);
    const name = this.identifier();
    const genericParams = this.genericTypeParams();
    const params = this.tuple(
      (args, range) => new FunctionParams(args, range),
      () => this.funcParam()
    );

    var ret: AstNode | undefined = undefined;
    if (this.match(Tok.Colon)) {
      ret = this.parseType();
    }

    var body: AstNode | undefined = undefined;
    if (this.match(Tok.Equal)) {
      body = this.expression();
    } else if (this.check(Tok.LBrace)) {
      body = this.block();
    } else this.match(Tok.Semicolon);

    return new FunctionDeclaration(
      name.name,
      new SignatureExpression(
        params,
        ret,
        ret ? Range.extend(params.range, ret.range) : params.range
      ),
      body,
      isAsync !== undefined,
      genericParams,
      isPublic !== undefined,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private delarationWithoutAttrs(isPublic?: Token, isOpaque?: Token): AstNode {
    switch (this.peek().id) {
      case Tok.Var:
      case Tok.Const:
        return this.variable(isPublic);
      case Tok.Func:
        return this.funcDecl(isPublic);
      default:
        this.reportUnexpectedToken("a declaration");
    }

    throw "UNREACHABLE";
  }

  private declaration() {
    var attrs: AstNodeList | undefined = undefined;
    if (this.check(Tok.At)) attrs = this.attributes();
    const isPublic = this.match(Tok.Public);
    const isOpaque: Token | undefined = isPublic
      ? this.match(Tok.Opaque)
      : undefined;
    const decl = this.delarationWithoutAttrs(isPublic, isOpaque);
    if (isOpaque && isValueDeclaration(decl.id)) {
      this.error(
        "cannot use `opaque` keyword with this declaration",
        isOpaque.range
      );
    }

    (<Declaration>decl).attrs = attrs;

    return decl;
  }

  private synchronize() {
    while (!this.Eof()) {
      switch (this.peek().id) {
        case Tok.Func:
        case Tok.Var:
        case Tok.Const:
        case Tok.Async:
          break;
        case Tok.Semicolon:
          this.advance();
          break;
        default:
          this.advance();
      }
    }
  }

  private synchronized(code: () => void) {
    try {
      code();
    } catch (e) {
      console.log(e);
      this.synchronize();
    }
  }

  parse(): Program {
    const program = new Program();
    while (!this.Eof()) {
      this.synchronized(() => {
        program.add(this.declaration());
      });
    }

    return program;
  }
}
