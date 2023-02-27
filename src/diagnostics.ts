import { Range } from "./source.js";

export enum Level {
    INFO,
    WARN,
    ERROR
}

export interface Diagnostic {
    level: Level
    range?: Range
    message: string[]
}

export class Logger {
    readonly diagnostics: Diagnostic[] = []
    errorCount: number = 0
    warningCount: number = 0

    log(level: Level, range: Range, ...args: any) {
        var diagnostic: Diagnostic = { level, range, message: [] }
        for (const arg of args) {
            diagnostic.message.push(arg.toString())
        }
        this.diagnostics.push(diagnostic)
    }

    error(range: Range, ...args: any) {
        this.log(Level.ERROR, range, args)
        this.errorCount++
    }

    warn(range: Range, ...args: any) {
        this.log(Level.WARN, range, args)
        this.warningCount++
    }

    info(range: Range, ...args: any) {
        this.log(Level.INFO, range, args)
    }

    msg(level: Level, ...args: any) {
        var diagnostic: Diagnostic = { level, message: [] }
        for (const arg of args) {
            diagnostic.message.push(arg.toString())
        }
        this.diagnostics.push(diagnostic)
    }

    errorMsg(...args: any) {
        this.msg(Level.ERROR, args)
        this.errorCount++
    }

    warnMsg(...args: any) {
        this.msg(Level.WARN, args)
        this.warningCount++
    }

    infoMsg(...args: any) {
        this.msg(Level.INFO, args)
    }
}
