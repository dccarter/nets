import { Range } from "src/source";
import { escapeCharaterString } from "./char";

export enum Tok {
  Eof,
  Abstract,
  KwStart = Abstract,
  Accessor,
  Any,
  As,
  Asserts,
  Assert,
  Bigint,
  Boolean,
  Break,
  Case,
  Catch,
  Class,
  Continue,
  Const,
  Constructor,
  Debugger,
  Declare,
  Default,
  Delete,
  Do,
  Else,
  Enum,
  Export,
  Extends,
  False,
  Finally,
  For,
  From,
  Function,
  Get,
  If,
  Implements,
  Import,
  In,
  Infer,
  Instanceof,
  Interface,
  Intrinsic,
  Is,
  Keyof,
  Let,
  Module,
  Namespace,
  Never,
  New,
  Null,
  Number,
  Object,
  Package,
  Private,
  Protected,
  Public,
  Override,
  Out,
  Readonly,
  Require,
  Global,
  Return,
  Satisfies,
  Set,
  Static,
  String,
  Super,
  Switch,
  Symbol,
  This,
  Throw,
  True,
  Try,
  Type,
  Typeof,
  Undefined,
  Unique,
  Unknown,
  Var,
  Void,
  While,
  With,
  Yield,
  Async,
  Await,
  Of,
  KwEnd = Of,
  BoolLit,
  CharLit,
  IntLit,
  FloatLit,
  Ident,
  StrLit,
  Plus,
  Minus,
  Multiply,
  Divide,
  Mod,
  Pow,
  PlusPlus,
  MinusMinus,
  BAnd,
  BOr,
  BXor,
  Shl,
  Shr,
  AShr,
  BNot,
  LNot,
  Gt,
  Lt,
  Gte,
  Lte,
  Equal,
  NotEq,
  StrictEq,
  StrictNotEq,
  LAnd,
  LOr,
  Question,
  DQuestion,
  QuestionDot,
  Assign,
  PlusEq,
  MinusEq,
  MultEq,
  DivEq,
  ModEq,
  BAndEq,
  BOrEq,
  BXorEq,
  ShlEq,
  ShrEq,
  AShrEq,
  LAndEq,
  LOrEq,
  PowEq,
  DQuestionEq,
  At,
  Hash,
  LBrace,
  RBrace,
  LParen,
  RParen,
  LBracket,
  RBracket,
  Dot,
  DotDot,
  DotDotDot,
  Comma,
  Semicolon,
  Colon,
  Arrow,
  LStrExpr,
  RStrExpr,
  Invalid,
}

const KEYWORDS_LIST: string | { [key: string]: any }[] = [
  { s: "abstract" },
  { s: "accessor" },
  { s: "any" },
  { s: "as" },
  { s: "asserts" },
  { s: "assert" },
  { s: "bigint" },
  { s: "boolean" },
  { s: "break" },
  { s: "case" },
  { s: "catch" },
  { s: "class" },
  { s: "continue" },
  { s: "const" },
  { s: "constructor" },
  { s: "debugger" },
  { s: "declare" },
  { s: "default" },
  { s: "delete" },
  { s: "do" },
  { s: "else" },
  { s: "enum" },
  { s: "export" },
  { s: "extends" },
  { s: "false" },
  { s: "finally" },
  { s: "for" },
  { s: "from" },
  { s: "function" },
  { s: "get" },
  { s: "if" },
  { s: "implements" },
  { s: "import" },
  { s: "in" },
  { s: "infer" },
  { s: "instanceof" },
  { s: "interface" },
  { s: "intrinsic" },
  { s: "is" },
  { s: "keyof" },
  { s: "let" },
  { s: "module" },
  { s: "namespace" },
  { s: "never" },
  { s: "new" },
  { s: "null" },
  { s: "number" },
  { s: "object" },
  { s: "package" },
  { s: "private" },
  { s: "protected" },
  { s: "public" },
  { s: "override" },
  { s: "out" },
  { s: "readonly" },
  { s: "require" },
  { s: "global" },
  { s: "return" },
  { s: "satisfies" },
  { s: "set" },
  { s: "static" },
  { s: "string" },
  { s: "super" },
  { s: "switch" },
  { s: "symbol" },
  { s: "this" },
  { s: "throw" },
  { s: "true" },
  { s: "try" },
  { s: "type" },
  { s: "typeof" },
  { s: "undefined" },
  { s: "unique" },
  { s: "unknown" },
  { s: "var" },
  { s: "void" },
  { s: "while" },
  { s: "with" },
  { s: "yield" },
  { s: "async" },
  { s: "await" },
  { s: "of" },
];

export function isKeyword(ident: string): Tok | undefined {
  ident = ident.charAt(0).toUpperCase() + ident.slice(1);
  var value: Tok = (<any>Tok)[ident];
  if (value) {
    if (value >= Tok.KwStart || value <= Tok.KwEnd) return value;
  }
  return undefined;
}

/**
 * List of tokens supported by our Lexer
 */
const TOKEN_LIST: { [key: string]: any }[] = [
  { s: "<eof>" },
  ...KEYWORDS_LIST,
  { s: "<bool>" },
  { s: "<char>" },
  { s: "<int>" },
  { s: "<float>" },
  { s: "<ident>" },
  { s: "<string>" },
  { s: "+" },
  { s: "-" },
  { s: "*" },
  { s: "/" },
  { s: "%" },
  { s: "++" },
  { s: "--" },
  { s: "**" },
  { s: "&" },
  { s: "|" },
  { s: "^" },
  { s: "<<" },
  { s: ">>" },
  { s: ">>" },
  { s: "~" },
  { s: "!" },
  { s: ">" },
  { s: "<" },
  { s: ">=" },
  { s: "<=" },
  { s: "==" },
  { s: "!=" },
  { s: "===" },
  { s: "!==" },
  { s: "&&" },
  { s: "||" },
  { s: "?" },
  { s: "??" },
  { s: "?." },
  { s: "=" },
  { s: "+=" },
  { s: "-=" },
  { s: "*=" },
  { s: "/=" },
  { s: "%=" },
  { s: "&=" },
  { s: "|=" },
  { s: "^=" },
  { s: "<<=" },
  { s: ">>=" },
  { s: ">>=" },
  { s: "&&=" },
  { s: "||=" },
  { s: "**=" },
  { s: "??=" },
  { s: "@" },
  { s: "#" },
  { s: "{" },
  { s: "}" },
  { s: "(" },
  { s: ")" },
  { s: "[" },
  { s: "]" },
  { s: "." },
  { s: ".." },
  { s: "..." },
  { s: "," },
  { s: ";" },
  { s: ":" },
  { s: "=>" },
  { s: "<`" },
  { s: "`>" },
  { s: "<error>" },
];

type TokenValue = number | string | undefined | boolean;

export class Token {
  constructor(
    public readonly id: Tok,
    public readonly range?: Range,
    public readonly value?: TokenValue
  ) {}

  info(): { [key: string]: any } {
    return TOKEN_LIST[this.id];
  }

  toString(): string {
    return `${Tok[this.id]} -> ${
      this.value !== undefined ? this.value : this.info().s
    }`;
  }
}

export class BooleanToken extends Token {
  constructor(value: boolean, range?: Range) {
    super(Tok.BoolLit, range, value);
  }
}

export class CharToken extends Token {
  constructor(value: string, range?: Range) {
    super(Tok.CharLit, range, value);
  }

  toString(): string {
    return `${Tok[this.id]} -> '${escapeCharaterString(
      (this.value as string) || ""
    )}'`;
  }
}

export class IntegerToken extends Token {
  constructor(value: number, range?: Range) {
    super(Tok.IntLit, range, value);
  }
}

export class FloatToken extends Token {
  constructor(value: number, range?: Range) {
    super(Tok.FloatLit, range, value);
  }
}

export class StringToken extends Token {
  constructor(value: string, range?: Range) {
    super(Tok.StrLit, range, value);
  }
  toString(): string {
    return `${Tok[this.id]} -> "${this.value || ""}"`;
  }
}

export class IdentToken extends Token {
  constructor(value: string, range?: Range) {
    super(Tok.Ident, range, value);
  }
}

export class InvalidToken extends Token {
  constructor(range?: Range) {
    super(Tok.Invalid, range);
  }

  toString(): string {
    return "Invalid";
  }
}
