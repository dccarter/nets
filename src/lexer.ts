import { Ascii, Char, isAlpha, isAlphaNum, isDigit, isHexDigit, isSpace } from "./char"
import { Logger } from "./diagnostics"
import { LineColumn, Range, Source } from "./source"
import { CharToken, FloatToken, IdentToken, IntegerToken, isKeyword, StringToken, Tok, Token } from "./token"

function invalidToken(range?: Range) {
    return new Token(Tok.Invalid, range)
}

const isOctal = (ch: Char) => ch >= Ascii["0"] && ch <= Ascii["7"]

export class Lexer {
    _index: number = 0
    _inStrExpr: boolean = false
    _rStrExpr?: Token = undefined;
    _fStrExpr?: Token = undefined;
    _pos: LineColumn = { line: 1, column: 0 }

    constructor(private L: Logger, private source: Source) {

    }

    getChar(index?: number): Char {
        index ??= this._index
        return index >= this.source.content.length ? Ascii.EoF : this.source.content[index] as Char
    }

    peekChar(off: number = 1): Char {
        return this.getChar(this._index + off)
    }

    skipChar() {
        if (this.getChar() == Ascii.NL) {
            this._pos.line++;
            this._pos.column = 1;
        }
        else {
            this._pos.column++;
        }
        this._index++;
    }

    acceptChar(ch: keyof typeof Ascii): boolean {
        if (this.getChar() == Ascii[ch]) {
            this.skipChar();
            return true;
        }
        return false;
    }

    skipSpaces() {
        while (isSpace(this.getChar()))
            this.skipChar()
    }

    skipSingleLineComment() {
        while (this.getChar() != Ascii.NL)
            this.skipChar()
    }

    skipMultiLineComment() {
        var nest = 1
        const p = this._index
        while (nest) {
            const ch = this.getChar()
            if (ch === Ascii.EoF) {
                this.L.error(new Range(this.source, p, this._index), "unterminated multi-line comment")
                break
            }
            else if (this.acceptChar("*")) {
                if (this.getChar() === Ascii["/"])
                    nest--;
            }
            else if (this.acceptChar("/")) {
                if (this.getChar() === Ascii["*"])
                    nest++;
            }
            this.skipChar();
        }
    }

    range(start: number, end?: number): Range {
        return new Range(this.source, start, end || this._index)
    }

    parseIdent(p: number): Token {
        while (true) {
            const n = this.getChar()
            if (!isAlphaNum(n) && n !== Ascii['_'])
                break

            this.skipChar()
        }

        const ident = this.range(p);
        const name = ident.str()
        const kw = isKeyword(name);
        if (kw)
            return new Token(kw, ident)
        else
            return new IdentToken(ident.str(), ident)
    }

    parseNumber(zero: boolean, p: number): Token {
        if (zero) {
            if (this.acceptChar('b')) {
                // Binary literal
                const start = this._index
                const isBinary = (ch: Char) => ch === Ascii["0"] || ch === Ascii["1"]
                while (isBinary(this.getChar()))
                    this.skipChar();

                const num = parseInt(
                    this.source.content.subarray(start, this._index).toString(),
                    2)

                if (!isNaN(num))
                    return new IntegerToken(num, this.range(p));

                this.L.error(this.range(p), "invalid binary decimal")
                return invalidToken(this.range(p));
            }
            else if (this.acceptChar('x')) {
                // Hexadecimal literal
                const start = this._index
                while (isHexDigit(this.getChar()))
                    this.skipChar();


                const num = parseInt(
                    this.source.content.subarray(start, this._index).toString(),
                    16)

                if (!isNaN(num))
                    return new IntegerToken(num, this.range(p));

                this.L.error(this.range(p), "invalid hex decimal")
                return invalidToken(this.range(p));
            }
            else if (this.acceptChar('o')) {
                // Octal literal
                const start = this._index
                while (isOctal(this.getChar()))
                    this.skipChar();


                const num = parseInt(
                    this.source.content.subarray(start, this._index).toString(),
                    8)

                if (!isNaN(num))
                    return new IntegerToken(num, this.range(p));

                this.L.error(this.range(p), "invalid octal decimal")
                return invalidToken(this.range(p));
            }
        }

        // Parse integral part
        while (isDigit(this.getChar()))
            this.skipChar();

        var hasDot = false;
        if (this.acceptChar('.')) {
            hasDot = true;
            // Parse fractional part
            while (isDigit(this.getChar()))
                this.skipChar();

            // Parse exponent
            if (this.acceptChar('e')) {
                // Accept `+`/`-` signs
                if (!this.acceptChar('+'))
                    this.acceptChar('-');

                while (isDigit(this.getChar()))
                    this.skipChar();
            }
        }

        const str = this.source.content.subarray(p, this._index).toString()

        return hasDot ?
            new FloatToken(parseFloat(str), this.range(p)) :
            new IntegerToken(parseInt(str), this.range(p))
    }

    consumeStringUntil(end: string) {
        while (!this.acceptChar(end)) {
            if (this.getChar() == Ascii['\\'])
                this.skipChar();
            this.skipChar();
        }
    }

    parseStringExpr(p: number): Token {
        var end = this._index;
        var next = false
        while (!this.acceptChar('`')) {
            if (this.getChar() == Ascii['\\']) {
                this.skipChar();
            } else if (this.getChar() == Ascii['$'] && this.peekChar() == Ascii['{']) {
                this.skipChar();
                this.skipChar();
                next = true
                break;
            }
            this.skipChar();
            end = this._index;
        }

        this._inStrExpr = next
        this._rStrExpr = next ? undefined : new Token(Tok.RStrExpr, this.range(this._index));

        const str = this.range(p, end);
        return new StringToken(str.str(), str)
    }

    next(): Token {
        while (true) {
            if (this._fStrExpr) {
                const ret = this._fStrExpr
                this._fStrExpr = undefined
                if (ret.value)
                    return ret;
            }

            if (this._rStrExpr) {
                const ret = this._rStrExpr
                this._rStrExpr = undefined
                return ret;
            }

            this.skipSpaces();

            var p = this._index
            const c = this.getChar()

            if (c === Ascii.EoF)
                return new Token(Tok.Eof, this.range(this._index))

            this.skipChar()

            switch (c) {
                case Ascii['(']:
                    return new Token(Tok.LParen, this.range(p))
                case Ascii[')']:
                    return new Token(Tok.RParen, this.range(p))
                case Ascii['[']:
                    return new Token(Tok.LBrace, this.range(p))
                case Ascii[']']:
                    return new Token(Tok.RBracket, this.range(p))
                case Ascii['{']:
                    return new Token(Tok.LBrace, this.range(p))

                case Ascii['}']:
                    if (this._inStrExpr) {
                        const str = this.parseStringExpr(this._index);
                        if (str.value)
                            return str;
                        continue
                    }
                    return new Token(Tok.RBrace, this.range(p))

                case Ascii['.']:
                    if (this.acceptChar('.')) {
                        if (this.acceptChar('.')) {
                            return new Token(Tok.DotDotDot, this.range(p))
                        }
                        return new Token(Tok.DotDot, this.range(p))
                    }
                    return new Token(Tok.Dot, this.range(p))
                case Ascii[',']:
                    return new Token(Tok.Comma, this.range(p))
                case Ascii[';']:
                    return new Token(Tok.Semicolon, this.range(p))
                case Ascii[':']:
                    return new Token(Tok.Colon, this.range(p))
                case Ascii['@']:
                    return new Token(Tok.At, this.range(p))
                case Ascii[';']:
                    return new Token(Tok.Hash, this.range(p))
                case Ascii['~']:
                    return new Token(Tok.BNot, this.range(p))

                case Ascii['?']:
                    if (this.acceptChar('?')) {
                        if (this.acceptChar('='))
                            return new Token(Tok.DQuestionEq, this.range(p))
                        return new Token(Tok.DQuestion, this.range(p))
                    }
                    return new Token(Tok.Question, this.range(p))

                case Ascii['+']:
                    if (this.acceptChar('+'))
                        return new Token(Tok.PlusPlus, this.range(p))
                    else if (this.acceptChar('='))
                        return new Token(Tok.PlusEq, this.range(p))
                    return new Token(Tok.Plus, this.range(p))

                case Ascii['-']:
                    if (this.acceptChar('-'))
                        return new Token(Tok.MinusMinus, this.range(p))
                    else if (this.acceptChar('='))
                        return new Token(Tok.MinusEq, this.range(p))
                    return new Token(Tok.Minus, this.range(p))

                case Ascii['*']:
                    if (this.acceptChar('*')) {
                        if (this.acceptChar('='))
                            return new Token(Tok.PowEq, this.range(p))
                        return new Token(Tok.Pow, this.range(p))
                    }
                    else if (this.acceptChar('='))
                        return new Token(Tok.MultEq, this.range(p))
                    return new Token(Tok.Multiply, this.range(p))

                case Ascii['/']:
                    if (this.acceptChar('/')) {
                        this.skipSingleLineComment();
                        continue
                    }

                    if (this.acceptChar('*')) {
                        this.skipMultiLineComment();
                        continue;
                    }

                    if (this.acceptChar('='))
                        return new Token(Tok.DivEq, this.range(p))
                    return new Token(Tok.Divide, this.range(p))

                case Ascii['%']:
                    if (this.acceptChar('='))
                        return new Token(Tok.ModEq, this.range(p))
                    return new Token(Tok.Mod, this.range(p))

                case Ascii['&']:
                    if (this.acceptChar('&')) {
                        if (this.acceptChar('='))
                            return new Token(Tok.LAndEq, this.range(p))
                        return new Token(Tok.LAnd, this.range(p))
                    }

                    if (this.acceptChar('='))
                        return new Token(Tok.BAndEq, this.range(p))
                    return new Token(Tok.BAnd, this.range(p))

                case Ascii['|']:
                    if (this.acceptChar('|')) {
                        if (this.acceptChar('='))
                            return new Token(Tok.LOrEq, this.range(p))
                        return new Token(Tok.LOr, this.range(p))
                    }

                    if (this.acceptChar('='))
                        return new Token(Tok.BOrEq, this.range(p))

                    return new Token(Tok.BOr, this.range(p))

                case Ascii['^']:
                    if (this.acceptChar('='))
                        return new Token(Tok.BXorEq, this.range(p))
                    return new Token(Tok.BXor, this.range(p))

                case Ascii['!']:
                    if (this.acceptChar('=')) {
                        if (this.acceptChar('-'))
                            return new Token(Tok.StrictNotEq, this.range(p))

                        return new Token(Tok.NotEq, this.range(p))
                    }
                    return new Token(Tok.BNot, this.range(p))

                case Ascii['%']:
                    if (this.acceptChar('='))
                        return new Token(Tok.ModEq, this.range(p))
                    return new Token(Tok.Mod, this.range(p))

                case Ascii['<']:
                    if (this.acceptChar('<')) {
                        if (this.acceptChar('='))
                            return new Token(Tok.ShlEq, this.range(p))

                        return new Token(Tok.Shl, this.range(p))
                    }
                    if (this.acceptChar('='))
                        return new Token(Tok.Lte, this.range(p))
                    return new Token(Tok.Lt, this.range(p))

                case Ascii['>']:
                    if (this.acceptChar('>')) {
                        if (this.acceptChar('>')) {
                            if (this.acceptChar('='))
                                return new Token(Tok.AShrEq, this.range(p))

                            return new Token(Tok.AShr, this.range(p))
                        }

                        if (this.acceptChar('='))
                            return new Token(Tok.ShrEq, this.range(p))

                        return new Token(Tok.Shr, this.range(p))
                    }

                    if (this.acceptChar('='))
                        return new Token(Tok.Gte, this.range(p))

                    return new Token(Tok.Gt, this.range(p))

                case Ascii['=']:
                    if (this.acceptChar('=')) {
                        if (this.acceptChar('='))
                            return new Token(Tok.StrictEq, this.range(p))
                        return new Token(Tok.Equal, this.range(p))
                    }

                    if (this.acceptChar('>'))
                        return new Token(Tok.Arrow, this.range(p))

                    return new Token(Tok.Assign, this.range(p))

                case Ascii["'"]:
                    var chr: number = 0;
                    if (this.acceptChar('\\')) {
                        if (this.acceptChar('x')) {
                            const s = this._index
                            for (let i = 0; i < 8 && isHexDigit(this.getChar()); i++)
                                this.skipChar();
                            chr = parseInt(this.source.content.subarray(s, this._index).toString(), 8)
                        }
                        else if (isDigit(this.getChar())) {
                            const s = this._index
                            for (let i = 0; i < 3 && isOctal(this.getChar()); i++)
                                this.skipChar();
                            chr = parseInt(this.source.content.subarray(s, this._index).toString(), 8)
                        }
                        else {
                            const cc = this.getChar();
                            this.skipChar();

                            switch (cc) {
                                case Ascii['n']: chr = Ascii.NL; break;
                                case Ascii['t']: chr = Ascii.TAB; break;
                                case Ascii['v']: chr = Ascii.vTAB; break;
                                case Ascii['r']: chr = Ascii.RET; break;
                                case Ascii['a']: chr = Ascii.AUDIO; break;
                                case Ascii['b']: chr = Ascii.BSPACE; break;
                                case Ascii['\\']: chr = Ascii['\\']; break
                                case Ascii['$']: chr = Ascii['$']; break
                                default:
                                    chr = cc;
                                    this.L.warn(this.range(this._index - 1),
                                        `unsupported escape character ${cc}`)
                            }
                        }

                        if (!this.acceptChar("'")) {
                            this.L.error(this.range(p), "unterminated character sequence");
                            continue;
                        }
                    }
                    else {
                        chr = this.getChar();
                        if (chr !== Ascii["'"])
                            this.skipChar();
                        else
                            chr = 0;

                        if (!this.acceptChar("'")) {
                            this.L.error(this.range(p), "unterminated character sequence");
                            continue;
                        }
                    }
                    return new CharToken(chr, this.range(p));

                case Ascii['`']:
                    p = this._index;
                    if (this._inStrExpr) {
                        this.consumeStringUntil('`')
                        this.L.error(this.range(p), "nested string expressions not supported")
                        return invalidToken(this.range(p))
                    }

                    this._fStrExpr = this.parseStringExpr(p);
                    return new Token(Tok.LStrExpr, this.range(p, p));

                case Ascii['"']: {
                    while (!this.acceptChar('"')) {
                        if (this.getChar() == Ascii['\\'])
                            this.skipChar();
                        this.skipChar();
                    }
                    const str = this.range(p + 1, this._index - 1);
                    return new StringToken(str.str(), str)
                }

                default:
                    if (isAlpha(c) || c === Ascii['_']) {
                        return this.parseIdent(p)
                    }

                    if (isDigit(c)) {
                        return this.parseNumber(c == Ascii['0'], p)
                    }

                    return new Token(Tok.Eof)
            }
        }
    }
}