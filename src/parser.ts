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
  DeferStatement,
  EnumDeclaration,
  EnumOption,
  ExpressionStatement,
  FloatLit,
  ForStatement,
  FunctionDeclaration,
  FunctionParam,
  FunctionParams,
  FunctionType,
  GenericTypeParam,
  GroupingExpression,
  Identifier,
  IfStatement,
  IntegerLit,
  isValueDeclaration,
  MacroCallExpression,
  MemberAccessExpression,
  Operation,
  PointerType,
  PostfixExpression,
  PrefixExpression,
  PrimitiveType,
  Program,
  ReturnStatement,
  SignatureExpression,
  StringExpression,
  StringLit,
  StructDeclaration,
  StructExpression,
  StructField,
  StructFieldExpression,
  TernaryExpression,
  TupleExpression,
  TupleType,
  TypeAlias,
  TypedExpression,
  UnionDeclaration,
  Variable,
  VariableDeclaration,
  WhileStatement,
} from "./ast";
import {
  ASSIGNMENT_OPS,
  binaryOperatorPrecedence,
  isErrorBoundary,
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

  private variable(): Identifier {
    const tok = this.consume(Tok.Ident);
    return new Variable(tok.value as string, tok.range);
  }

  private expression(allowStructs: boolean = true): AstNode {
    const expr = this.ternary(() => this.primary(allowStructs));
    if (this.match(Tok.Colon)) {
      const type = this.parseType();
      return new TypedExpression(
        expr,
        type,
        Range.extend(expr.range, type.range)
      );
    }

    return expr;
  }

  private ifStatement(): AstNode {
    const tok = this.consume(Tok.If);
    var cond: AstNode | undefined;

    this.consume(Tok.LParen);
    if (this.check(Tok.Const, Tok.Var)) {
      // if (const x = expr)
      cond = this.variableDecl(undefined, true);
    } else {
      cond = this.expression(false);
    }
    this.consume(Tok.RParen);

    const ifTrue = this.statement();

    var ifFalse: AstNode | undefined;
    if (this.match(Tok.Else)) ifFalse = this.statement();

    return new IfStatement(
      cond,
      ifTrue,
      ifFalse,
      Range.extend(tok?.range, ifFalse ? ifFalse.range : ifTrue.range)
    );
  }

  private whileStatement(): AstNode {
    const tok = this.consume(Tok.While);
    var cond: AstNode | undefined;

    this.consume(Tok.LParen);
    if (this.check(Tok.Const, Tok.Var)) {
      // if (const x = expr)
      cond = this.variableDecl(undefined, true);
    } else {
      cond = this.expression(false);
    }
    this.consume(Tok.RParen);

    const body = this.statement();

    return new WhileStatement(cond, body, Range.extend(tok?.range, body.range));
  }

  private forStatement(): AstNode {
    const tok = this.consume(Tok.For);
    this.consume(Tok.LParen);
    const variable = this.variableDecl(undefined, true, true);

    this.consume(Tok.Colon);
    const range = this.expression(false);
    this.consume(Tok.RParen);

    const body = this.statement();

    return new ForStatement(
      variable,
      range,
      body,
      Range.extend(tok.range, body.range)
    );
  }

  private deferStatement(): AstNode {
    const tok = this.consume(Tok.Defer);
    var body;
    if (this.check(Tok.LBrace)) body = this.block();
    else body = this.expression();

    return new DeferStatement(body, Range.extend(tok.range, body.range));
  }

  private returnStatement(): AstNode {
    const tok = this.consume(Tok.Return);
    var value: AstNode | undefined;
    if (!this.check(Tok.Semicolon)) {
      value = this.expression();
    }
    this.consume(Tok.Semicolon);

    return new ReturnStatement(
      value,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private continueStatement(): AstNode {
    const tok = this.consume(Tok.Continue);
    this.consume(Tok.Semicolon);

    return new AstNode(
      Ast.ContinueStmt,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private breakStatement(): AstNode {
    const tok = this.consume(Tok.Break);
    this.consume(Tok.Semicolon);

    return new AstNode(
      Ast.BreakStmt,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private statement(): AstNode {
    switch (this.peek().id) {
      case Tok.If:
        return this.ifStatement();
      case Tok.For:
        return this.forStatement();
      case Tok.While:
        return this.whileStatement();
      case Tok.Defer:
        return this.deferStatement();
      case Tok.Break:

      case Tok.Return:
        return this.returnStatement();
      case Tok.Continue:
        return this.continueStatement();
      case Tok.Var:
      case Tok.Const:
        return this.variableDecl();
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
    const name = this.variable();
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

  private tupleExpression(orGroup: boolean = false): AstNode {
    return this.tuple(
      (args, range) => {
        if (args.count === 1 && orGroup)
          return new GroupingExpression(args.first!, args.first?.range);
        else return new TupleExpression(args, range);
      },
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

  private macroExpression(callee: AstNode): AstNode {
    this.consume(Tok.LNot);
    if (this.check(Tok.LParen)) {
      const args = this.tupleExpression();
      return new MacroCallExpression(
        callee,
        (<TupleExpression>args).elements,
        Range.extend(callee.range, args.range)
      );
    } else {
      return new MacroCallExpression(callee, undefined, callee.range);
    }
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
        case Tok.LNot:
          operand = this.macroExpression(operand);
          continue;
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
        Range.extend(operand.range, tok.range)
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

  private ternary(primary: () => AstNode): AstNode {
    const cond = this.assign(primary);
    if (this.match(Tok.Question)) {
      const _true = this.ternary(primary);
      this.consume(Tok.Colon);
      const _false = this.ternary(primary);
      return new TernaryExpression(
        cond,
        _true,
        _false,
        Range.extend(cond.range, _false.range)
      );
    }

    return cond;
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
        return this.tupleExpression(true);
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
    var node: AstNode;
    if (PRIMITIVE_TYPES.get(tok.id)) {
      node = this.primitive();
    } else {
      switch (tok.id) {
        case Tok.Ident:
          node = this.path();
          break;
        case Tok.LParen:
          node = this.tuple(
            (args, range) => new TupleType(args, range),
            () => this.parseType()
          );
          break;
        case Tok.Async:
        case Tok.Func:
          node = this.funcType();
          break;
        case Tok.BAnd:
          node = this.pointerType();
          break;
        default:
          this.reportUnexpectedToken("a type", this.advance());
      }
    }

    while (this.match(Tok.LBracket)) {
      var size: AstNode | undefined;
      if (!this.check(Tok.RBracket)) {
        switch (this.peek().id) {
          case Tok.IntLit:
            size = this.integer();
            break;
          case Tok.Ident:
            size = this.expression();
            break;
          default:
            this.reportUnexpectedToken("size of array, integer/macro call");
        }
      }
      this.consume(Tok.RBracket);
      node = new ArrayType(
        node!,
        size,
        size ? Range.extend(node!.range, size!.range) : node!.range
      );
    }

    return node!;
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
      this.consume(Tok.RParen);
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
    if (this.match(Tok.LBracket)) {
      attrs = this.many(Tok.RBracket, Tok.Comma, () => this.attribute());
      this.consume(Tok.RBracket);
    } else {
      const attr = this.attribute();
      attrs = new AstNodeList();
      attrs.add(attr);
    }

    return attrs;
  }

  private variableDecl(
    isExport?: Token,
    isExpression = false,
    noInitializer = false
  ): AstNode {
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
    if (!isExpression && this.match(Tok.Colon)) type = this.parseType();

    var init: AstNode | undefined;

    if (!noInitializer) {
      if (tok?.id === Tok.Const) this.consume(Tok.Assign);
      if (isExpression || tok?.id === Tok.Const || this.match(Tok.Assign))
        init = this.expression();
    }

    isExpression ||= noInitializer;

    if (!isExpression) {
      this.consume(
        Tok.Semicolon,
        `expecting ';', semicolon is required after variable declaration`
      );
    }

    return new VariableDeclaration(
      tok!.id,
      names,
      type,
      init,
      isExport !== undefined,
      Range.extend(
        isExport ? isExport.range : tok?.range,
        this.previous().range
      )
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

  private funcDecl(isExport?: Token): AstNode {
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
    if (this.match(Tok.Assign)) {
      body = this.expression();
      this.match(Tok.Semicolon);
    } else if (this.check(Tok.LBrace)) {
      body = this.block();
    } else {
      this.match(Tok.Semicolon);
    }
    return new FunctionDeclaration(
      name,
      new SignatureExpression(
        params,
        ret,
        ret ? Range.extend(params.range, ret.range) : params.range
      ),
      body,
      isAsync !== undefined,
      genericParams,
      isExport !== undefined,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private aliasDecl(isExport?: Token, isOpaque?: Token): AstNode {
    const tok = this.consume(Tok.Type);

    const name = this.identifier();
    const params = this.genericTypeParams();

    this.consume(Tok.Assign);

    const members = this.oneOrMore(
      "type parameter",
      Tok.Semicolon,
      Tok.BOr,
      () => this.parseType()
    );
    this.consume(Tok.Semicolon);

    if (members.count == 1) {
      return new TypeAlias(
        name,
        <AstNode>members.first!,
        params,
        isExport !== undefined,
        isOpaque !== undefined,
        Range.extend(tok.range, this.previous().range)
      );
    } else {
      return new UnionDeclaration(
        name,
        members,
        params,
        isExport !== undefined,
        isOpaque !== undefined,
        Range.extend(tok.range, this.previous().range)
      );
    }
  }

  private enumOption(): AstNode {
    const tok = this.peek();

    var attrs: AstNodeList | undefined = undefined;
    if (this.check(Tok.At)) attrs = this.attributes();

    const name = this.identifier();

    var value: AstNode | undefined;
    if (this.match(Tok.Assign)) {
      value = this.expression(false);
    }

    return new EnumOption(
      name,
      value,
      attrs,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private enumDecl(isExport?: Token, isOpaque?: Token): AstNode {
    const tok = this.consume(Tok.Enum);

    const name = this.identifier();

    var base: AstNode | undefined;
    if (this.match(Tok.Colon)) {
      base = this.parseType();
    }

    this.consume(Tok.LBrace);
    const options = this.oneOrMore("enum member", Tok.RBrace, Tok.Comma, () =>
      this.enumOption()
    );
    this.consume(Tok.RBrace);

    return new EnumDeclaration(
      name,
      options,
      base,
      isExport !== undefined,
      isOpaque !== undefined,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private fieldDecl(): AstNode {
    const tok = this.peek();

    var attrs: AstNodeList | undefined;
    if (this.check(Tok.At)) attrs = this.attributes();

    const name = this.identifier();
    this.consume(Tok.Colon);
    const type = this.parseType();

    var value: AstNode | undefined;
    if (this.match(Tok.Assign)) value = this.expression();

    return new StructField(
      name,
      type,
      value,
      attrs,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private structDecl(isExport?: Token, isOpaque?: Token): AstNode {
    const tok = this.consume(Tok.Struct);

    const name = this.identifier();
    const params = this.genericTypeParams();

    var base: AstNode | undefined;
    if (this.match(Tok.Colon)) {
      base = this.parseType();
    }

    var isTupleLike = false;
    var fields: AstNodeList | undefined = undefined;
    if (this.match(Tok.LBrace)) {
      fields = this.many(Tok.RBrace, Tok.Comma, () => this.fieldDecl());
      this.consume(Tok.RBrace);
    } else {
      isTupleLike = true;
      if (base === undefined && this.match(Tok.LParen)) {
        fields = this.oneOrMore(
          "struct field types",
          Tok.RParen,
          Tok.Comma,
          () => this.parseType()
        );
        this.consume(Tok.RParen);
      }
      this.consume(Tok.Semicolon);
    }

    return new StructDeclaration(
      name,
      fields,
      params,
      base,
      isTupleLike,
      isExport !== undefined,
      isOpaque !== undefined,
      Range.extend(tok.range, this.previous().range)
    );
  }

  private delarationWithoutAttrs(isExport?: Token, isOpaque?: Token): AstNode {
    switch (this.peek().id) {
      case Tok.Struct:
        return this.structDecl(isExport, isOpaque);
      case Tok.Enum:
        return this.enumDecl(isExport, isOpaque);
      case Tok.Type:
        return this.aliasDecl(isExport, isOpaque);
      case Tok.Var:
      case Tok.Const:
        return this.variableDecl(isExport);
      case Tok.Async:
      case Tok.Func:
        return this.funcDecl(isExport);
      default:
        this.reportUnexpectedToken("a declaration");
    }

    throw "UNREACHABLE";
  }

  private declaration() {
    var attrs: AstNodeList | undefined = undefined;
    if (this.check(Tok.At)) attrs = this.attributes();
    const isExport = this.match(Tok.Export);
    const isOpaque: Token | undefined = isExport
      ? this.match(Tok.Opaque)
      : undefined;
    const decl = this.delarationWithoutAttrs(isExport, isOpaque);
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
    if (isErrorBoundary(this.peek().id)) return;

    while (!this.Eof()) {
      if (isErrorBoundary(this.peek().id)) break;
      this.advance();
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
