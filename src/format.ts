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

export const fmtReset: string = fmt([fmsNormal, fmcNormal]);
export const fmtError: string = fmt([fmsBold, fmcRed]);
export const fmtLiteral: string = fmt([fmsNormal, fmcMagenta]);
export const fmtString: string = fmt([fmsNormal, fmcGreen]);
export const fmtKeyword: string = fmt([fmsBold, fmcBlue]);
export const fmtComment: string = fmt([fmsNormal, fmcGreen]);
export const fmtEllipsis: string = fmt([fmsNormal, fmcWhite]);
export const fmtLoc: string = fmt([fmsBold, fmcWhite]);
