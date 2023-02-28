enum FormatMode {
  Normal = 0,
  Bold,
  Dim,
  Underline,
  Italic,
}

enum FormatColor {
  Normal = 0,
  Red,
  Green,
  Yellow,
  Blue,
  Magenta,
  Cyan,
  White,
}

export const fmsNormal = FormatMode.Normal;
export const fmsBold = FormatMode.Bold;
export const fmsDim = FormatMode.Dim;
export const fmsUnderline = FormatMode.Underline;
export const fmsItalic = FormatMode.Italic;

export const fmcNormal = FormatColor.Normal;
export const fmcRed = FormatColor.Red;
export const fmcGreen = FormatColor.Green;
export const fmcBlue = FormatColor.Blue;
export const fmcCyan = FormatColor.Cyan;
export const fmcMagenta = FormatColor.Magenta;
export const fmcYellow = FormatColor.Yellow;
export const fmcWhite = FormatColor.White;

export type FormatStyle = [FormatMode, FormatColor];

export function fmt(style: FormatStyle): string {
  var str = "";
  if (style[0] === fmsNormal || style[1] === fmcNormal) {
    str = "\33[0m";
    if (style[0] === fmsNormal && style[1] === fmcNormal) return str;
  }

  str += `\33[${style[0]}`;
  if (style[0] != fmsNormal) {
    str += ";";
  }

  return `${str}3${style[1]}m`;
}

export const fmtReset: FormatStyle = [fmsNormal, fmcNormal];
export const fmtError: FormatStyle = [fmsBold, fmcRed];
export const fmtLiteral: FormatStyle = [fmsNormal, fmcMagenta];
export const fmtKeyword: FormatStyle = [fmsBold, fmcBlue];
export const fmtComment: FormatStyle = [fmsNormal, fmcGreen];
export const fmtEllipsis: FormatStyle = [fmsNormal, fmcWhite];
export const fmtLoc: FormatStyle = [fmsBold, fmcWhite];
