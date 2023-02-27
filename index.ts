import { Ascii } from "./src/char";
import { Logger } from "./src/diagnostics";
import { Lexer } from "./src/lexer";
import { Source, Range } from "./src/source";
import { Tok, Token } from "./src/token";

const L = new Logger();
const src = new Source("<stdin>", "``");
// const src = new Source("./src/lexer.ts");
const lexer = new Lexer(L, src)

while (true) {
    const tok = lexer.next()
    if (tok.id == Tok.Eof) {
        break
    }
    console.log(`${Tok[tok.id]}: ${tok.value ?? tok.info().s}`)
}