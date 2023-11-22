import assert from "assert";
import { fmcNormal, fmsBold, fmt, fmtReset } from "../common/format";

export class Timers {
  static #timers: { [key: string]: { start: number; end?: number } } = {};
  private constructor() {}

  static start(name: string) {
    Timers.#timers[name] = { start: Date.now(), end: undefined };
  }

  static stop(name: string): number {
    assert(Timers.#timers[name] && Timers.#timers[name].end === undefined);
    Timers.#timers[name].end = Date.now();
    return Timers.#timers[name].end! - Timers.#timers[name].start;
  }

  static ellapsed(name: string): number {
    assert(Timers.#timers[name]);
    if (Timers.#timers[name].end)
      return Timers.#timers[name].end! - Timers.#timers[name].start;
    return Date.now() - Timers.#timers[name].start;
  }

  static print(
    printer: (data: string) => void = (data: string) =>
      process.stdout.write(data),
  ) {
    printer("Ellapsed (ms):\n");
    for (const name in Timers.#timers) {
      const ellapsed = this.ellapsed(name);
      printer(
        `  ${fmt([fmsBold, fmcNormal])}${name}${fmtReset}: ${ellapsed} ms\n`,
      );
    }
    printer("\n");
  }
}
