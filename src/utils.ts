import { assert } from "console";

export function countBits(n: number): number {
  var bits = 0;
  if (n < 0) {
    bits++;
    n = -n;
  }

  while (n) {
    n = n >> 1;
    bits++;
  }
  return bits;
}

export function countBytes(n: number): number {
  const bits = countBits(n);
  return (bits >> 3) + ((bits & 7) === 0 ? 0 : 1);
}

export function getIntegerSize(n: number): number {
  const bytes = countBytes(n);
  if (bytes <= 1) return 1;
  if (bytes <= 2) return 2;
  if (bytes <= 4) return 4;

  assert(bytes <= 8);
  return 8;
}
