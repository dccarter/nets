import {
  fmcCyan,
  fmcRed,
  fmcYellow,
  fmsBold,
  fmt,
  fmtLoc,
  fmtReset,
  FormatStyle,
} from "./format.js";
import { Range } from "./source.js";

export enum Level {
  INFO,
  WARN,
  ERROR,
}

export interface Diagnostic {
  level: Level;
  range?: Range;
  message: string[];
}

export class Logger {
  readonly diagnostics: Diagnostic[] = [];
  errorCount: number = 0;
  warningCount: number = 0;

  log(level: Level, range: Range, ...args: any) {
    var diagnostic: Diagnostic = { level, range, message: [] };
    for (const arg of args) {
      diagnostic.message.push(arg.toString());
    }
    this.diagnostics.push(diagnostic);
  }

  error(range: Range, ...args: any) {
    this.log(Level.ERROR, range, args);
    this.errorCount++;
  }

  warn(range: Range, ...args: any) {
    this.log(Level.WARN, range, args);
    this.warningCount++;
  }

  info(range: Range, ...args: any) {
    this.log(Level.INFO, range, args);
  }

  msg(level: Level, ...args: any) {
    var diagnostic: Diagnostic = { level, message: [] };
    for (const arg of args) {
      diagnostic.message.push(arg.toString());
    }
    this.diagnostics.push(diagnostic);
  }

  errorMsg(...args: any) {
    this.msg(Level.ERROR, args);
    this.errorCount++;
  }

  warnMsg(...args: any) {
    this.msg(Level.WARN, args);
    this.warningCount++;
  }

  infoMsg(...args: any) {
    this.msg(Level.INFO, args);
  }

  print(
    printer: (diag: Diagnostic, index: number) => void = defaultPrintDiagnostic
  ) {
    if (!printer) return;

    this.diagnostics.forEach((diag, index) => printer(diag, index));
  }
}

function defaultPrintDiagnostic(diag: Diagnostic) {
  const header: [string, FormatStyle][] = [
    ["note", [fmsBold, fmcCyan]],
    ["warning", [fmsBold, fmcYellow]],
    ["error", [fmsBold, fmcRed]],
  ];

  const write = (msg: string) => process.stdout.write(msg);

  const style = header[diag.level];
  write(`${fmt(style[1])}${style[0]}${fmt(fmtReset)}: `);
  for (const str of diag.message) {
    write(str);
  }
  write("\n");

  if (diag.range) {
    const fname = diag.range.source.fname;
    const coord = diag.range.start.coord;
    write(
      `  ${fmt(fmtLoc)}${fname}${coord.line}:${coord.column}\n${fmt(fmtReset)}`
    );
  }
}
