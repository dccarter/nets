import { AstPrinter } from "./src/astprint";
import { Logger } from "./src/diagnostics";
import { Lexer } from "./src/lexer";
import { Parser } from "./src/parser";
import { Source } from "./src/source";
import { Timers } from "./src/timer";

const L = new Logger();
const src = new Source(
  "<stdin>",
  `
func name(cb: (a: b) -> name) = true
`
);
const lexer = new Lexer(L, src);

const parser = new Parser(L, lexer);

Timers.start("Parse");

const ast = parser.parse();

Timers.stop("Parse");
Timers.print();
L.print();
if (L.errorCount || !ast) process.exit(1);

const printer = new AstPrinter();
printer.visit(ast!);
