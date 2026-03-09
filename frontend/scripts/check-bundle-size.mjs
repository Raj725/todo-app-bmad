import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST_ASSETS_DIR = "dist/assets";
const MAX_MAIN_BUNDLE_BYTES = 350 * 1024;

function findMainBundleSizeBytes() {
  const files = readdirSync(DIST_ASSETS_DIR);
  const candidate = files.find((file) => /^index-.*\.js$/.test(file));

  if (!candidate) {
    throw new Error(`No main JS bundle found in ${DIST_ASSETS_DIR}`);
  }

  const fullPath = join(DIST_ASSETS_DIR, candidate);
  return {
    file: candidate,
    size: statSync(fullPath).size,
  };
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
