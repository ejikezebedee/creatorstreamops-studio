import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", "dist", "data", ".git", "coverage"]);
const unsafeImplementationPatterns = [
  new RegExp(["fake", "Engagement", "Implementation"].join(""), "i"),
  new RegExp(["unauthorized", "TikTok", "Scraper"].join(""), "i"),
  new RegExp(["credential", "Collector"].join(""), "i"),
];

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    if (entry.isFile() && /\.(ts|tsx|js|md|json)$/.test(entry.name))
      files.push(full);
  }
  return files;
}

let failed = false;
for (const file of await walk(root)) {
  const relative = path.relative(root, file);
  const text = await fs.readFile(file, "utf8");
  if (text.includes("\t")) {
    console.error(`Tab character found in ${relative}`);
    failed = true;
  }
  if (/[ \t]$/m.test(text)) {
    console.error(`Trailing whitespace found in ${relative}`);
    failed = true;
  }
  for (const pattern of unsafeImplementationPatterns) {
    if (pattern.test(text)) {
      console.error(
        `Forbidden or unsafe implementation wording matched ${pattern} in ${relative}`,
      );
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("Static lint checks passed.");
