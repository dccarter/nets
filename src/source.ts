import assert from "assert";
import * as fs from "fs"
import { Ascii } from "./char";

export interface LineColumn {
    line: number
    column: number
}

export class Source {
    public readonly content: Buffer
    constructor(public readonly fname: string, source?: string) {
        if (source) {
            this.content = Buffer.from(source)
        }
        else {
            assert(fs.existsSync(fname), "file ${fname} does not exist")
            this.content = fs.readFileSync(fname)
        }
    }
}

export class Range {
    constructor(readonly source: Source, public start: number, public end: number) {
        assert(start <= end, `Range start '${start}' must be <=  end '${end}'`)
    }

    enclosingLine(): Range {
        const content = this.source.content;
        var start = this.start;
        var end = this.start;

        while (start > 0 && content[start - 1] != Ascii.NL) {
            start = start - 1;
        }

        var length = content.length;
        while (end < length && content[end] != Ascii.NL) {
            end = end + 1;
        }

        return new Range(this.source, start, end);
    }

    merge(range: Range): Range {

        assert(this.source == range.source, "Can only merge ranges from same source");
        assert(this.start <= range.start,
            `range merge this.start (=${this.start}) must be <= range.start (=${range.start})`);
        assert(this.end <= range.end,
            `range merge this.end (=${this.end}) must be <= range.end (=${range.end})`);

        return new Range(this.source, this.start, range.end);
    }

    str(): string {
        return this.start === this.end ? "" : this.source.content.subarray(this.start, this.end).toString()
    }
}

