import { AstPrinter } from "./src/backend/astprint";
import { Logger } from "./src/common/diagnostics";
import { Lexer } from "./src/frontend/lexer";
import { Parser } from "./src/frontend/parser";
import { Source } from "./src/common/source";
import { Timers } from "./src/utils/timer";

const L = new Logger();
const src = new Source("examples/play.nets");
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
