// makefun-news-image-20261120 — v3 entry program.
//
// The front page is pre-rendered as entry.png (1024x1024, drawn once with
// PIL so every glyph is pixel-perfect). This program only has to deliver
// that file into the output directory, unchanged, so the competition's two
// grading runs see byte-identical output.
//
// Guards, in order: the file must sit next to this program, it must really
// be a PNG (magic bytes), it must fit the 1 MiB cap in RULES.txt, and its
// dimensions must be exactly 1024x1024 (the page is drawn for that canvas;
// a wrongly-sized file would grade as a different image). Anything else is
// a hard failure (exit 1) instead of a silent bad entry.

import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ARTWORK_FILE = "entry.png";
const MAX_SIZE = 1048576; // RULES.txt: PNG at most 1 MiB
// RULES.txt: at most 1024x1024; our page is drawn at exactly 1024x1024.
const EXPECTED_WIDTH = 1024;
const EXPECTED_HEIGHT = 1024;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const SOURCE_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

async function run(): Promise<void> {
  const source = join(SOURCE_DIR, ARTWORK_FILE);
  const info = await stat(source).catch(() => null);
  if (info === null) {
    throw new Error(`${ARTWORK_FILE} is missing next to main.ts`);
  }
  if (info.size > MAX_SIZE) {
    throw new Error(
      `${ARTWORK_FILE} is ${info.size} bytes, over the 1 MiB limit (${MAX_SIZE})`,
    );
  }
  const bytes = await readFile(source);
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${ARTWORK_FILE} does not start with the PNG signature`);
  }
  // PNG IHDR chunk: width and height are big-endian uint32 at bytes 16-23.
  if (bytes.length < 24) {
    throw new Error(`${ARTWORK_FILE} is too short to hold a PNG IHDR`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== EXPECTED_WIDTH || height !== EXPECTED_HEIGHT) {
    throw new Error(
      `${ARTWORK_FILE} is ${width}x${height}, expected ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT}`,
    );
  }
  await mkdir(OUTPUT_DIR, { recursive: true });
  await copyFile(source, join(OUTPUT_DIR, ARTWORK_FILE));
  console.log(`entry: wrote ${ARTWORK_FILE} (${bytes.length} bytes) -> ${OUTPUT_DIR}`);
}

run().catch((err: unknown) => {
  console.error(`entry: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
