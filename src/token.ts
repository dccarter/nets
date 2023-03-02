import { Range } from "src/source";
import { escapeCharaterString } from "./char";

export enum Tok {
  Eof,
  Any,
  KwStart = Any,
  As,
  Assert,
  Auto,
  Bool,
  Break,
  Case,
  Catch,
  Char,
  Class,
  Continue,
  Const,
  Debugger,
  Default,
  Defer,
  Delete,
  Do,
  Else,
  Enum,
  Export,
  Extends,
  F32,
  F64,
  False,
  Finally,
  For,
  From,
  Func,
  If,
  Import,
  In,
  I8,
  I16,
  I32,
  I64,
  I128,
  Instanceof,
  Interface,
  Is,
  Keyof,
  Let,
  New,
  Null,
  Package,
  Private,
  Protected,
  Public,
  Override,
  Return,
  Satisfies,
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
  U8,
  U16,
  U32,
  U64,
  U128,
  Undefined,
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

export enum TFlags {
  UnaryOp = 0b0000000000000001,
  BinaryOp = 0b0000000000000010,
  LogicOp = 0b0000000000000100,
  TernaryOp = 0b0000000000001000,
  AssignmentOp = 0b0000000000010000,
  PrefixOp = 0b0000000000100000,
  PostfixOp = 0b0000000001000000,
  Keyword = 0b0000000010000000,
  Type = 0b0000000100000000,
}

/**
 * List of tokens supported by our Lexer
 */
export const TOKEN_LIST: { [key: string]: any }[] = [
  { s: "<eof>", flags: TFlags.Keyword },
  { s: "any", flags: TFlags.Keyword | TFlags.Type },
  { s: "as", flags: TFlags.Keyword },
  { s: "assert", flags: TFlags.Keyword },
  { s: "auto", flags: TFlags.Keyword },
  { s: "bool", flags: TFlags.Keyword | TFlags.Type },
  { s: "break", flags: TFlags.Keyword },
  { s: "case", flags: TFlags.Keyword },
  { s: "catch", flags: TFlags.Keyword },
  { s: "char", flags: TFlags.Keyword | TFlags.Type },
  { s: "class", flags: TFlags.Keyword },
  { s: "continue", flags: TFlags.Keyword },
  { s: "const", flags: TFlags.Keyword },
  { s: "debugger", flags: TFlags.Keyword },
  { s: "default", flags: TFlags.Keyword },
  { s: "defer", flags: TFlags.Keyword },
  { s: "delete", flags: TFlags.Keyword | TFlags.PrefixOp },
  { s: "do", flags: TFlags.Keyword },
  { s: "else", flags: TFlags.Keyword },
  { s: "enum", flags: TFlags.Keyword },
  { s: "export", flags: TFlags.Keyword },
  { s: "extends", flags: TFlags.Keyword },
  { s: "f32", flags: TFlags.Keyword | TFlags.Type },
  { s: "f64", flags: TFlags.Keyword | TFlags.Type },
  { s: "false", flags: TFlags.Keyword },
  { s: "finally", flags: TFlags.Keyword },
  { s: "for", flags: TFlags.Keyword },
  { s: "from", flags: TFlags.Keyword },
  { s: "func", flags: TFlags.Keyword },
  { s: "if", flags: TFlags.Keyword },
  { s: "import", flags: TFlags.Keyword },
  { s: "in", flags: TFlags.Keyword | TFlags.BinaryOp | TFlags.LogicOp },
  { s: "i8", flags: TFlags.Keyword | TFlags.Type },
  { s: "i16", flags: TFlags.Keyword | TFlags.Type },
  { s: "i32", flags: TFlags.Keyword | TFlags.Type },
  { s: "i64", flags: TFlags.Keyword | TFlags.Type },
  { s: "i128", flags: TFlags.Keyword | TFlags.Type },
  { s: "instanceof", flags: TFlags.Keyword | TFlags.BinaryOp | TFlags.LogicOp },
  { s: "interface", flags: TFlags.Keyword },
  { s: "is", flags: TFlags.Keyword },
  { s: "keyof", flags: TFlags.Keyword },
  { s: "let", flags: TFlags.Keyword },
  { s: "new", flags: TFlags.Keyword },
  { s: "null", flags: TFlags.Keyword },
  { s: "package", flags: TFlags.Keyword },
  { s: "private", flags: TFlags.Keyword },
  { s: "protected", flags: TFlags.Keyword },
  { s: "public", flags: TFlags.Keyword },
  { s: "override", flags: TFlags.Keyword },
  { s: "return", flags: TFlags.Keyword },
  { s: "satisfies", flags: TFlags.Keyword },
  { s: "static", flags: TFlags.Keyword },
  { s: "string", flags: TFlags.Keyword | TFlags.Type },
  { s: "super", flags: TFlags.Keyword },
  { s: "switch", flags: TFlags.Keyword },
  { s: "symbol", flags: TFlags.Keyword },
  { s: "this", flags: TFlags.Keyword },
  { s: "throw", flags: TFlags.Keyword },
  { s: "true", flags: TFlags.Keyword },
  { s: "try", flags: TFlags.Keyword },
  { s: "type", flags: TFlags.Keyword | TFlags.Type },
  { s: "typeof", flags: TFlags.Keyword | TFlags.PrefixOp },
  { s: "u8", flags: TFlags.Keyword | TFlags.Type },
  { s: "u16", flags: TFlags.Keyword | TFlags.Type },
  { s: "u32", flags: TFlags.Keyword | TFlags.Type },
  { s: "u64", flags: TFlags.Keyword | TFlags.Type },
  { s: "u128", flags: TFlags.Keyword | TFlags.Type },
  { s: "undefined", flags: TFlags.Keyword },
  { s: "var", flags: TFlags.Keyword },
  { s: "void", flags: TFlags.Keyword | TFlags.PrefixOp | TFlags.Type },
  { s: "while", flags: TFlags.Keyword },
  { s: "with", flags: TFlags.Keyword },
  { s: "yield", flags: TFlags.Keyword },
  { s: "async", flags: TFlags.Keyword },
  { s: "await", flags: TFlags.Keyword | TFlags.PrefixOp },
  { s: "of", flags: TFlags.Keyword },
  { s: "<bool>" },
  { s: "<char>" },
  { s: "<int>" },
  { s: "<float>" },
  { s: "<ident>" },
  { s: "<string>" },
  { s: "+", flags: TFlags.UnaryOp | TFlags.BinaryOp },
  { s: "-", flags: TFlags.UnaryOp | TFlags.BinaryOp },
  { s: "*", flags: TFlags.BinaryOp },
  { s: "/", flags: TFlags.BinaryOp },
  { s: "%", flags: TFlags.BinaryOp },
  { s: "**", flags: TFlags.BinaryOp },
  { s: "++", flags: TFlags.PrefixOp | TFlags.PostfixOp },
  { s: "--", flags: TFlags.PrefixOp | TFlags.PostfixOp },
  { s: "&", flags: TFlags.BinaryOp },
  { s: "|", flags: TFlags.BinaryOp },
  { s: "^", flags: TFlags.BinaryOp },
  { s: "<<", flags: TFlags.BinaryOp },
  { s: ">>", flags: TFlags.BinaryOp },
  { s: ">>>", flags: TFlags.BinaryOp },
  { s: "~", flags: TFlags.UnaryOp },
  { s: "!", flags: TFlags.UnaryOp },
  { s: ">", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "<", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: ">=", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "<=", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "==", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "!=", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "===", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "!==", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "&&", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "||", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "?", flags: TFlags.TernaryOp },
  { s: "??", flags: TFlags.BinaryOp | TFlags.LogicOp },
  { s: "?." },
  { s: "=", flags: TFlags.AssignmentOp },
  { s: "+=", flags: TFlags.AssignmentOp, sop: Tok.Plus },
  { s: "-=", flags: TFlags.AssignmentOp, sop: Tok.Minus },
  { s: "*=", flags: TFlags.AssignmentOp, sop: Tok.Multiply },
  { s: "/=", flags: TFlags.AssignmentOp, sop: Tok.Divide },
  { s: "%=", flags: TFlags.AssignmentOp, sop: Tok.Mod },
  { s: "&=", flags: TFlags.AssignmentOp, sop: Tok.BAnd },
  { s: "|=", flags: TFlags.AssignmentOp, sop: Tok.BOr },
  { s: "^=", flags: TFlags.AssignmentOp, sop: Tok.BXor },
  { s: "<<=", flags: TFlags.AssignmentOp, sop: Tok.Shl },
  { s: ">>=", flags: TFlags.AssignmentOp, sop: Tok.Shr },
  { s: ">>>=", flags: TFlags.AssignmentOp, sop: Tok.AShr },
  { s: "&&=", flags: TFlags.AssignmentOp, sop: Tok.LAnd },
  { s: "||=", flags: TFlags.AssignmentOp, sop: Tok.LOr },
  { s: "**=", flags: TFlags.AssignmentOp, sop: Tok.Pow },
  { s: "??=", flags: TFlags.AssignmentOp, sop: Tok.DQuestion },
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
  { s: ":", flags: TFlags.AssignmentOp },
  { s: "=>" },
  { s: "<`" },
  { s: "`>" },
  { s: "<error>" },
];

const hasFlag = (value: { [key: string]: any }, flag: TFlags) =>
  ((value.flags || 0) & flag) == flag;
const buildTokenGroup = (flag: TFlags) =>
  TOKEN_LIST.map((info, op) => ({
    op,
    info,
  })).filter(({ info }) => hasFlag(info, flag));

export const BINARY_OPS = buildTokenGroup(TFlags.BinaryOp);
export const UNARY_OPS = buildTokenGroup(TFlags.UnaryOp);
export const TERNARY_OPS = buildTokenGroup(TFlags.TernaryOp);
export const ASSIGNMENT_OPS = buildTokenGroup(TFlags.AssignmentOp);
export const LOGIC_OPS = buildTokenGroup(TFlags.LogicOp);
export const PREFIX_OPS = buildTokenGroup(TFlags.PrefixOp);
export const POSTFIX_OPS = buildTokenGroup(TFlags.PostfixOp);
export const KEYWORDS = buildTokenGroup(TFlags.Keyword);
export const PRIMITIVE_TYPES = buildTokenGroup(TFlags.Type);

type TokenValue = number | string | undefined | boolean;

export function isLogicOperator(id: Tok): boolean {
  return ((TOKEN_LIST[id].flags || 0) & TFlags.LogicOp) === TFlags.LogicOp;
}

export function isPrimitiveType(id: Tok): boolean {
  return ((TOKEN_LIST[id].flags || 0) & TFlags.Type) === TFlags.Type;
}

export function isKeyword(ident: string): Tok | undefined {
  const c1 = ident[0].toUpperCase();
  if (c1 == ident[0]) return undefined;

  ident = c1 + ident.slice(1);
  var value: Tok = (<any>Tok)[ident];

  if (value) {
    if (value >= Tok.KwStart || value <= Tok.KwEnd) return value;
  }
  return undefined;
}

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
