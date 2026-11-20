// Entry program for the news-image-20261120 bounty (v2).
//
// The deliverable is a finished newspaper front page, entry.png, which
// ships in this repository next to this file. This program never draws
// anything: it simply places that exact file where the grader looks for
// it, at <output>/entry.png. A plain byte copy is deterministic, so the
// two grading runs can only ever produce identical output.

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ARTWORK = "entry.png";

// RULES.txt caps the entry image at 1 MiB (1,048,576 bytes). Reject an
// oversized file here instead of shipping one the judge will discard.
const MAX_BYTES = 1048576;

// The eight bytes at the start of every PNG file.
const PNG_HEADER = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

function abort(message: string): never {
  console.error(`entry: ${message}`);
  process.exit(1);
}

function isPng(bytes: Buffer): boolean {
  return (
    bytes.length >= PNG_HEADER.length &&
    PNG_HEADER.every((byte, index) => bytes[index] === byte)
  );
}

function main(): void {
  const here = process.env.MAKEFUN_BOT_DIR ?? dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
  const sourcePath = join(here, ARTWORK);

  if (!existsSync(sourcePath)) {
    abort(`cannot find ${ARTWORK} in ${here}`);
  }
  const bytes = readFileSync(sourcePath);
  if (!isPng(bytes)) {
    abort(`${ARTWORK} does not start with a PNG signature`);
  }
  if (bytes.length > MAX_BYTES) {
    abort(`${ARTWORK} is ${bytes.length} bytes, over the 1 MiB limit (${MAX_BYTES})`);
  }

  mkdirSync(outDir, { recursive: true });
  const targetPath = join(outDir, ARTWORK);
  copyFileSync(sourcePath, targetPath);
  console.log(`entry: wrote ${ARTWORK} (${bytes.length} bytes) -> ${targetPath}`);
}

main();
