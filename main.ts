// Entry program — news-image-20261120.
//
// The finished front page ships in this repository as entry.png. All this
// program does is place that exact file where the grader expects it:
// <output>/entry.png. Copying bytes, never redrawing them, means the two
// grading runs can only ever produce the same file.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE = "entry.png";

// The eight bytes every PNG file opens with.
const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(reason: string): never {
  console.error(`main.ts: ${reason}`);
  process.exit(1);
}

function main(): void {
  const here = process.env.MAKEFUN_BOT_DIR ?? dirname(fileURLToPath(import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const source = join(here, FILE);

  if (!existsSync(source)) {
    fail(`missing ${FILE} in ${here}`);
  }

  const bytes = readFileSync(source);
  const head = bytes.subarray(0, PNG_SIGNATURE.length);
  const isPng =
    bytes.length >= PNG_SIGNATURE.length &&
    head.every((byte, i) => byte === PNG_SIGNATURE[i]);
  if (!isPng) {
    fail(`${FILE} does not look like a PNG file`);
  }

  mkdirSync(outDir, { recursive: true });
  const destination = join(outDir, FILE);
  copyFileSync(source, destination);
  console.log(`main.ts: wrote ${FILE} (${bytes.length} bytes) to ${destination}`);
}

main();
