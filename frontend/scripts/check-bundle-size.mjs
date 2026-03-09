import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST_ASSETS_DIR = "dist/assets";
const MAX_MAIN_BUNDLE_BYTES = 350 * 1024;

function findMainBundleSizeBytes() {
  const files = readdirSync(DIST_ASSETS_DIR);
  // Find the largest JS file starting with "index-", assuming it's the main entry bundle
  const candidates = files
    .filter((file) => /^index-.*\.js$/.test(file))
    .map((file) => ({
      file,
      size: statSync(join(DIST_ASSETS_DIR, file)).size,
    }))
    .sort((a, b) => b.size - a.size);

  if (candidates.length === 0) {
    throw new Error(`No main JS bundle found in ${DIST_ASSETS_DIR}`);
  }

  return candidates[0];
}

const { file, size } = findMainBundleSizeBytes();

if (size > MAX_MAIN_BUNDLE_BYTES) {
  throw new Error(
    `Performance budget exceeded: ${file} is ${size} bytes (limit ${MAX_MAIN_BUNDLE_BYTES} bytes)`
  );
}

console.log(
  `Performance budget check passed: ${file} is ${size} bytes (limit ${MAX_MAIN_BUNDLE_BYTES} bytes)`
);
