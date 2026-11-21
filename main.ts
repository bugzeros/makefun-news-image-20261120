// news-image-20261120 v4 — entry program (Node 22, ESM, stdlib only).
//
// The entry image is fixed: this program copies entry.png byte-for-byte into
// the output directory the grader provides (MAKEFUN_OUTPUT_DIR, falling back
// to /output), after checking that the file is a real PNG of exactly the
// size the rules allow: at most 1 MiB (1,048,576 bytes) and exactly
// 1024x1024 pixels. Anything else fails loudly with exit code 1 so a bad
// file is never submitted as if it were fine.

import { copyFileSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1048576; // RULES.txt: PNG or JPEG, at most 1 MiB
const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;

const here = resolve(fileURLToPath(new URL(".", import.meta.url)));
const source = join(here, "entry.png");
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
const target = join(outDir, "entry.png");

const bytes = readFileSync(source);
if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
  console.error("entry.png is not a PNG file (bad magic bytes)");
  process.exit(1);
}
if (bytes.length > MAX_BYTES) {
  console.error(
    `entry.png is ${bytes.length} bytes, over the 1 MiB limit (${MAX_BYTES})`,
  );
  process.exit(1);
}
// PNG header: width at bytes 16-19, height at bytes 20-23, big-endian uint32.
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
  console.error(
    `entry.png is ${width}x${height}, expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`,
  );
  process.exit(1);
}

copyFileSync(source, target);
const copied = statSync(target).size;
if (copied !== bytes.length) {
  console.error(`copy failed: wrote ${copied} of ${bytes.length} bytes`);
  process.exit(1);
}
// Verify the copy byte-for-byte: re-read the output and compare its full
// contents with the source, so a truncated or corrupted write is caught
// even when the size happens to match.
const written = readFileSync(target);
if (!written.equals(bytes)) {
  console.error("copy failed: output bytes differ from entry.png");
  process.exit(1);
}
console.log(`wrote ${target} (${copied} bytes, ${width}x${height})`);
