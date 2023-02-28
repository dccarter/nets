import assert from "assert";
import * as fs from "fs";
import { Ascii } from "./char";

export interface LineColumn {
  line: number;
  column: number;
}

export class Source {
  public readonly content: Buffer;
  constructor(public readonly fname: string, source?: string) {
    if (source) {
      this.content = Buffer.from(source);
    } else {
      assert(fs.existsSync(fname), "file ${fname} does not exist");
      this.content = fs.readFileSync(fname);
    }
  }
}

export interface Location {
  pos: number;
  coord: LineColumn;
}

export class Range {
  constructor(
    readonly source: Source,
    public start: Location,
    public end: Location
  ) {
    assert(
      start.pos <= end.pos,
      `Range start '${start.pos}' must be <=  end '${end.pos}'`
    );
  }

  enclosingLine(): Range {
    const content = this.source.content;
    var start = this.start;
    var end = this.start;

    while (start.pos > 0 && content[start.pos - 1] != Ascii.NL) {
      start.pos = start.pos - 1;
    }
    this.start.coord.column = 1;

    var length = content.length;
    while (end.pos < length && content[end.pos] != Ascii.NL) {
      end.pos = end.pos + 1;
    }
    this.end.coord.column = end.pos - start.pos;

    return new Range(this.source, start, end);
  }

  merge(range: Range): Range {
    assert(
      this.source == range.source,
      "Can only merge ranges from same source"
    );
    assert(
      this.start.pos <= range.start.pos,
      `range merge this.start (=${this.start.pos}) must be <= range.start (=${range.start.pos})`
    );
    assert(
      this.end.pos <= range.end.pos,
      `range merge this.end (=${this.end.pos}) must be <= range.end (=${range.end.pos})`
    );

    return new Range(this.source, this.start, range.end);
  }

  str(): string {
    return this.source.content
      .subarray(this.start.pos, this.end.pos)
      .toString();
  }
}
