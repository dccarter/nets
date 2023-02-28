import { AssignmentExpression, Ast, AstNode, AstVisitor, BinaryExpression, BoolLit, CallExpression, CharacterLit, FloatLit, GroupingExpression, Identifier, IntegerLit, PostfixExpression, PrefixExpression, StringExpression, StringLit, TernaryExpression, UnaryExpression } from "./ast";
import { fmtKeyword, fmtLiteral, fmtReset, fmtString } from "./format";
import { TOKEN_LIST } from "./token";

function write(...strs: string[]) {
    for (const str of strs) {
        process.stdout.write(str)
    }
}

export class AstPrinter extends AstVisitor {
    visitNull(node: AstNode): void {
        write(`${fmtLiteral}null${fmtReset}`)
    }

    visitUndefined(node: AstNode): void {
        write(`${fmtKeyword}undefined${fmtReset}`)
    }
    visitBoolLiteral(node: BoolLit): void {
        write(`${fmtKeyword}${node.value}${fmtReset}`)
    }
    visitCharacterLiteral(node: CharacterLit): void {
        write(`${fmtLiteral}'${node.value}'${fmtReset}`)
    }
    visitIntegerLiteral(node: IntegerLit): void {
        write(`${fmtLiteral}${node.value}${fmtReset}`)
    }
    visitFloatLiteral(node: FloatLit): void {
        write(`${fmtLiteral}${node.value}${fmtReset}`)
    }
    visitStringLiteral(node: StringLit): void {
        write(`${fmtLiteral}"${node.value}"${fmtReset}`)
    }
    visitIdentifier(node: Identifier): void {
        write(node.name)
    }
    visitStringExpression(node: StringExpression): void {
        write(`${fmtString}\`${fmtReset}`)
        var part = node.parts.first
        while (part) {
            if (part.id == Ast.StrLit) {
                write(fmtString, (<StringLit>part).value, fmtReset)
            }
            else {
                write(fmtLiteral, '${', fmtReset)
                this.visit(part)
                write(fmtLiteral, '}', fmtReset)
            }
            part = part.next
        }
        write(`${fmtString}\`${fmtReset}`)
    }
    visitGroupingExpression(node: GroupingExpression): void {
        write('(');
        this.visit(node.expr)
        write(')')
    }
    visitPrefixExpression(node: PrefixExpression): void {
        write(TOKEN_LIST[node.op].s);
        this.visit(node.expr)
    }
    visitPostfixExpression(node: PostfixExpression): void {
        this.visit(node.expr)
        write(TOKEN_LIST[node.op].s);
    }
    visitUnaryExpression(node: UnaryExpression): void {
        write(TOKEN_LIST[node.op].s);
        this.visit(node.expr)
    }
    visitBinaryExpression(node: BinaryExpression): void {
        this.visit(node.lhs)
        write(' ', TOKEN_LIST[node.op].s, ' ');
        this.visit(node.rhs)
    }
    visitTernaryExpression(node: TernaryExpression): void {
        this.visit(node.cond)
        write('? ')
        this.visit(node.ifTrue)
        write(' : ');
        this.visit(node.ifFalse)
    }

    visitAssignmentExpression(node: AssignmentExpression): void {
        this.visit(node.lhs)
        write(' ', TOKEN_LIST[node.op].s, ' ');
        this.visit(node.rhs)
    }

    visitCallExpression(node: CallExpression): void {
        this.visit(node.expr)
        write('(');
        var arg = node.args.first
        while (arg) {
            this.visit(arg)
            arg = arg.next
            if (arg)
                write(', ')
        }
        write(')')
    }
}
