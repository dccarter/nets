import { Ascii } from "./src/char";
import { Logger } from "./src/diagnostics";
import { fmtComment, fmtReset, fmt, fmsBold, fmcCyan } from "./src/format";
import { Lexer } from "./src/lexer";
import { Parser } from "./src/parser";
import { Source } from "./src/source";
import { Tok } from "./src/token";

const L = new Logger();
const src = new Source("<stdin>", "1 20 30 40");
const lexer = new Lexer(L, src);
const parser = new Parser(L, lexer);

console.log(parser.parse());
console.log(parser.parse());
console.log(parser.parse());
console.log(parser.parse());
