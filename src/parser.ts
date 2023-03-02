import {
  ArrayLitExpression,
  AssignmentExpression,
  Ast,
  AstNode,
  AstNodeList,
  BinaryExpression,
  BoolLit,
  BracketExpression,
  CallExpression,
  CharacterLit,
  ClosureExpression,
  CodeBlock,
  DotExpression,
  ExpressionStatement,
  FloatLit,
  FunctionDeclaration,
  GroupingExpression,
  Identifier,
  IntegerLit,
  MemberAccessExpression,
  NewExpression,
  PostfixExpression,
  PrefixExpression,
  PrimitiveIdent,
  Program,
  SignatureExpression,
  SpreadExpression,
  StringExpression,
  StringLit,
  StructLitExpression,
  TernaryExpression,
  TupleExpression,
  UnaryExpression,
  VariableDeclaration,
  YieldExpression,
} from "./ast";
import { Ascii } from "./char";
import { Logger } from "./diagnostics";
import { Lexer } from "./lexer";
import { Range } from "./source";
import { isPrimitiveType, Tok, Token, TOKEN_LIST } from "./token";

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

  private sanitizeTuple(tup: TupleExpression) {
    var named = false,
      unnamed = false;
    tup.exprs.each((node: AstNode): any => {
      var rhs = node;
      if (node.id === Ast.AssignmentExpr) {
        if (unnamed) {
          this.error(
            "adding unnamed member in a named tuple not supported",
            node.range
          );
        }

        const assign = <AssignmentExpression>node;
        if (assign.op !== Tok.Colon) {
          this.error(
            "named tuple member must be separated by a colon",
            node.range
          );
        }

        if (assign.lhs.id !== Ast.Identifier) {
          this.error("expecting the name of a tuple member", assign.lhs.range);
        }
        named = true;
        rhs = assign.rhs;
      } else {
        if (named) {
          this.error(
            "adding named member in a unnamed tuple not supported",
            node.range
          );
        }
        unnamed = true;
      }
      this.requireType(rhs);
    });
  }

  private sanitizeStructLiteralType(node: StructLitExpression) {
    node.exprs.each((node: AstNode): any => {
      if (node.id !== Ast.AssignmentExpr) {
        this.error(
          "adding unnamed member in a struct literal is not supported",
          node.range
        );
      }

      const assign = <AssignmentExpression>node;
      if (assign.op !== Tok.Colon) {
        this.error(
          "struct literal member name and type must be separated by a colon ':'",
          node.range
        );
      }

      if (assign.lhs.id !== Ast.Identifier) {
        this.error(
          "expecting the name of a struct literal member",
          assign.lhs.range
        );
      }

      this.requireType(assign.rhs);
    });
  }

  private sanitizeBracketType(expr: BracketExpression) {
    this.requireType(expr.target);
    expr.indices.each((node: AstNode): any => {
      switch (node.id) {
        case Ast.BoolLit:
        case Ast.CharLit:
        case Ast.IntLit:
        case Ast.FloatLit:
        case Ast.StrLit:
          break;
        default:
          this.requireType(node);
      }
    });
  }

  private sanitizeClosureType(cl: ClosureExpression) {
    if (cl.signature) {
      this.error(
        "invalid token before closure return type, expecting '=>'",
        cl.signature.range
      );
    }
    this.requireType(cl.body);
  }

  private sanitizeSignature(sig: SignatureExpression) {
    var params = sig.params;
    if (params.id === Ast.GroupingExpr) {
      const members = new AstNodeList();
      members.add((<GroupingExpression>params).expr);
      params = new TupleExpression(members, params.range);
    }
  }

  private requireType(node: AstNode) {
    switch (node.id) {
      case Ast.Identifier:
      case Ast.Primitive:
        break;
      case Ast.TupleExpr:
        this.sanitizeTuple(<TupleExpression>node);
        break;
      case Ast.BracketExpr:
        this.sanitizeBracketType(<BracketExpression>node);
        break;
      case Ast.StructLitExpr:
        this.sanitizeStructLiteralType(<StructLitExpression>node);
        break;
      case Ast.ClosureExpr:
        this.sanitizeClosureType(<ClosureExpression>node);
        break;
      case Ast.Signature:
        this.sanitizeSignature(<SignatureExpression>node);
        break;
      default:
        this.error(
          `invalid type, expecting a type name or type expression ${
            Ast[node.id]
          }`,
          node.range
        );
    }
  }

  private convertToTuple(node: AstNode): AstNode {
    if (node.id === Ast.GroupingExpr) {
      const members = new AstNodeList();
      members.add((<GroupingExpression>node).expr);
      return new TupleExpression(members, node.range);
    } else if (node.id === Ast.Identifier) {
      const members = new AstNodeList();
      members.add(node);
      return new TupleExpression(members, node.range);
    } else if (node.id !== Ast.TupleExpr) {
      this.error("unexpected tokens, expecting tuple", node.range);
    }
    return node;
  }

  private requireParam(node: AstNode) {
    if (node.id !== Ast.AssignmentExpr) {
      this.error(
        `unexpected tokens ${Ast[node.id]}, expecting a function parameter`,
        node.range
      );
    }

    var assign = <AssignmentExpression>node;
    var lhs = assign.lhs,
      rhs = assign.rhs;

    if (lhs.id === Ast.AssignmentExpr) {
      assign = <AssignmentExpression>lhs;
      lhs = assign.lhs;

      rhs = new SignatureExpression(
        this.convertToTuple(assign.rhs),
        rhs,
        Range.extend(assign.rhs.range, rhs.range)
      );
    }

    if (lhs.id === Ast.SpreadExpr) lhs = (<SpreadExpression>lhs).expr;

    if (lhs.id !== Ast.Identifier) {
      this.error("unexpected tokens, expecting a parameter name", lhs.range);
    }

    if (rhs.id === Ast.GroupingExpr) {
      rhs = this.convertToTuple(rhs);
    }

    this.requireType(rhs);
  }

  private requireClosureSignature(sig: AstNode): [AstNode, AstNode?] {
    var params = sig,
      ret: AstNode | undefined = undefined;
    if (sig.id === Ast.AssignmentExpr) {
      const assign = <AssignmentExpression>sig;
      if (assign.op !== Tok.Colon) {
        this.error("unexpected token after function parameters", assign.range);
      }

      params = assign.lhs;
      ret = assign.rhs;
      this.requireType(ret);
    }

    if (params.id === Ast.GroupingExpr) {
      const members = new AstNodeList();
      members.add((<GroupingExpression>params).expr);
      params = new TupleExpression(members, params.range);
    }

    if (params.id !== Ast.TupleExpr) {
      this.error(
        "unexpected tokens, expecting function parameters",
        params.range
      );
    }

    (<TupleExpression>params).exprs.each((node: AstNode): any => {
      this.requireParam(node);
    });

    return [params, ret];
  }

  parse(): AstNode | undefined {
    try {
      const program = new Program();
      while (!this.check(Tok.Eof)) {
        program.add(this.declaration());
      }
      return program;
    } catch (e) {
      return undefined;
    }
    // return this.expression();
  }

  private declaration(): AstNode {
    switch (this.peek().id) {
      case Tok.Var:
      case Tok.Const:
        return this.variable();
      case Tok.Async:
      case Tok.Func:
        return this.func();
      case Tok.Class:
        return this.klass();
      case Tok.Enum:
        return this.enumeration();
      case Tok.LBrace:
        return this.block();
    }
    return this.statement();
  }

  private klass(): AstNode {}

  private enumeration(): AstNode {}

  private block(): AstNode {
    if (!this.match(Tok.LBrace)) {
      return this.expression();
    }

    const nodes = new CodeBlock();
    while (!this.check(Tok.RBrace) && !this.Eof()) {
      if (this.check(Tok.Class, Tok.Interface)) {
        this.error(
          "declaring a class or interface inside a block is not supported"
        );
      }
      nodes.add(this.declaration());
    }

    this.consume(Tok.RBrace);

    return nodes;
  }

  private func(): AstNode {
    if (this.check(Tok.Async)) {
      if (this.peek(2).id !== Tok.Func) return this.expression();
    }

    const isAsync = this.match(Tok.Async);
    const tok = this.consume(Tok.Func);
    const name = this.consume(Tok.Ident);

    const expr = this.tupleOrGroup((node: AstNode) => {
      this.requireParam(node);
    });

    var args: AstNode, ret: AstNode | undefined;
    if (expr.id === Ast.GroupingExpr) {
      const exprs = new AstNodeList();
      exprs.add((<GroupingExpression>expr).expr);
      args = new TupleExpression(exprs, expr.range);
    } else if (expr.id === Ast.TupleExpr) {
      args = expr;
    } else {
      this.error(`${Ast[expr.id]} invalid function signature`, expr.range);
    }

    if (this.match(Tok.Colon)) {
      ret = this.primary();
      this.requireType(ret);
    }

    if (this.match(Tok.Assign) && this.check(Tok.LBrace)) {
      this.error(
        "simple function should be followed by an expression statement"
      );
    }

    const body = this.block();
    return new FunctionDeclaration(
      name.value as string,
      new SignatureExpression(
        args!,
        ret,
        ret ? Range.extend(args!.range, ret.range) : args!.range
      ),
      body,
      isAsync !== undefined,
      Range.extend(isAsync ? isAsync.range : tok.range, body.range)
    );
  }

  private variable(): AstNode {
    const modifier = this.advance();
    var variable = this.compound()!;
    var varType: AstNode | undefined, varInit: AstNode | undefined;

    if (variable.id === Ast.GroupingExpr) {
      variable = (<GroupingExpression>variable).expr;
    }

    if (variable.id === Ast.TupleExpr) {
      const tup = <TupleExpression>variable;
      if (tup.exprs.count === 0) {
        this.error("missing variable name in variable declaration", tup.range);
      }

      tup.exprs.each((node: AstNode): any => {
        if (node.id !== Ast.Identifier) {
          this.error(
            "only identifiers supported in variable names",
            node.range
          );
        }
      });
    } else if (variable.id !== Ast.Identifier) {
      this.error(
        "only identifiers supported in variable names",
        variable.range
      );
    }

    if (this.match(Tok.Colon)) {
      varType = this.bracket()!;
      this.requireType(varType);
    }

    if (this.match(Tok.Assign)) {
      varInit = this.expression();
    } else if (modifier.id === Tok.Const) {
      this.error(
        "`const` variable declaration must be initialized",
        Range.extend(modifier.range, variable.range)
      );
    }

    return new VariableDeclaration(
      modifier.id,
      variable,
      varType,
      varInit,
      Range.extend(modifier.range, variable.range)
    );
  }

  private statement(): AstNode {
    const expr = this.expression();
    this.match(Tok.Semicolon);
    return new ExpressionStatement(expr, expr.range);
  }

  private expression(): AstNode {
    return this.spread();
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
      const expr = this.closure();
      return new YieldExpression(
        expr,
        hasStar,
        Range.extend(expr.range, range)
      );
    }

    return this.closure();
  }

  private closure(): AstNode {
    const isAsync = this.match(Tok.Async);
    const expr = this.binding();

    if (this.match(Tok.FatArrow)) {
      const [params, ret] = this.requireClosureSignature(expr);
      const body = this.block();
      const range = isAsync
        ? Range.extend(isAsync.range, params.range)
        : params.range;
      return new ClosureExpression(
        new SignatureExpression(
          params,
          ret,
          ret ? Range.extend(params.range, ret.range) : params.range
        ),
        body,
        isAsync !== undefined,
        Range.extend(range, body.range)
      );
    }

    return expr;
  }

  private binding(): AstNode {
    var expr = this.ternary();

    if (this.match(Tok.Colon)) {
      const rhs = this.ternary();
      expr = new AssignmentExpression(
        expr,
        Tok.Colon,
        rhs,
        Range.extend(expr.range, rhs.range)
      );
    }

    if (this.match(Tok.Arrow)) {
      const ret = this.bracket();
      expr = new AssignmentExpression(
        expr,
        Tok.Arrow,
        ret,
        Range.extend(expr.range, ret.range)
      );
    }

    return expr;
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
        const value = this.expression();
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
        while (!this.check(Tok.RParen) && !this.Eof()) {
          args.add(this.expression());
          this.match(Tok.Comma);
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
      var indices = new AstNodeList();
      while (!this.check(Tok.RBracket) && !this.Eof()) {
        indices.add(this.expression());
        this.match(Tok.Comma);
      }
      this.consume(Tok.RBracket, "expecting a closing bracket ']'");
      expr = new BracketExpression(
        expr,
        indices,
        Range.extend(range, this.previous().range)
      );
    }

    return expr;
  }

  private memberAccess(): AstNode {
    const dot = this.match(Tok.Dot);
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
    if (dot) {
      expr = new DotExpression(expr, Range.extend(dot.range, expr.range));
    }
    return expr;
  }

  private primary(): AstNode {
    const lit = this.literal();
    if (lit) {
      this.advance();
      return lit;
    }

    if (this.check(Tok.LStrExpr)) {
      return this.stringExpression();
    }

    return this.compound()!;
  }

  private compound(): AstNode | undefined {
    if (this.check(Tok.Ident)) {
      var tok = this.advance();
      return new Identifier(tok?.value as string, tok?.range);
    }

    if (isPrimitiveType(this.peek().id)) {
      var tok = this.advance();
      return new PrimitiveIdent(tok?.id, tok?.range);
    }

    if (this.check(Tok.LParen)) {
      return this.tupleOrGroup();
    }

    if (this.check(Tok.LBrace)) {
      return this.structLiteral();
    }

    if (this.match(Tok.LBracket)) {
      return this.arrayLiteral();
    }

    this.error("unexpected token, expecting an expression");
  }

  private tupleOrGroup(check?: (node: AstNode) => void): AstNode {
    this.consume(Tok.LParen);
    const range = this.previous().range;
    const exprs = new AstNodeList();
    while (!this.check(Tok.RParen) && !this.Eof()) {
      const expr = this.expression();
      if (check) check(expr);
      exprs.add(expr);
      this.match(Tok.Comma);
    }
    this.consume(
      Tok.RParen,
      "expecting a closing ')' to close a tuple/group expression."
    );

    return exprs.count === 1
      ? new GroupingExpression(
          exprs.first!,
          Range.extend(range, this.previous().range)
        )
      : new TupleExpression(exprs, Range.extend(range, this.previous().range));
  }

  private structLiteral(): AstNode {
    this.consume(Tok.LBrace);
    const range = this.previous().range;
    var init = new StructLitExpression(new AstNodeList(), range);

    while (!this.check(Tok.RBrace) && !this.Eof()) {
      init.add(this.expression());
      this.match(Tok.Comma);
    }

    this.consume(
      Tok.RBrace,
      "expecting a closing '}' to close a struct literal expression."
    );
    init.range = Range.extend(range, this.previous().range);
    return init;
  }

  private arrayLiteral(): AstNode {
    this.consume(Tok.LBracket);
    const range = this.previous().range;
    var init = new ArrayLitExpression(new AstNodeList(), range);

    while (!this.check(Tok.RBracket) && !this.Eof()) {
      init.add(this.expression());
      this.match(Tok.Comma);
    }

    this.consume(
      Tok.RBracket,
      "expecting a closing ']' to close an array literal expression."
    );
    init.range = Range.extend(range, this.previous().range);
    return init;
  }

  private stringExpression(): AstNode {
    var tok = this.consume(Tok.LStrExpr);
    var str = new StringExpression(tok?.range);
    while (!this.match(Tok.RStrExpr) && !this.Eof()) {
      str.add(this.expression());
      tok = this.peek();
    }

    str.range = Range.extend(tok.range, this.previous().range);
    return str;
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
