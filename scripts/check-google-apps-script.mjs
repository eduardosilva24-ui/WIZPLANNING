import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const gasDirectory = path.join(root, "google-apps-script");
const codePath = path.join(gasDirectory, "Code.gs");
const entries = readdirSync(gasDirectory).sort();

if (entries.length !== 1 || entries[0] !== "Code.gs") {
  throw new Error(`Apps Script must contain only Code.gs; found: ${entries.join(", ") || "no files"}`);
}

const source = readFileSync(codePath, "utf8");
const requiredPatterns = [
  [/^function doGet\(e\)\s*\{/gm, "single doGet entry point"],
  [/^function handleApiGet_\(e\)\s*\{/gm, "GET API router"],
  [/^function doPost\(e\)\s*\{/gm, "POST API entry point"],
  [/^var PLANNER_HTML = "<!DOCTYPE html>/m, "embedded planner HTML"],
  [/\/\/ BEGIN EMBEDDED COURSE DATA[\s\S]*?\/\/ END EMBEDDED COURSE DATA/, "embedded course data"]
];

for (const [pattern, description] of requiredPatterns) {
  const matches = source.match(pattern) || [];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${description}; found ${matches.length}.`);
  }
}

if (/createHtmlOutputFromFile|createTemplateFromFile/.test(source)) {
  throw new Error("Code.gs still depends on an external Apps Script HTML file.");
}

const requiredAiReviewPatterns = [
  [/max_output_tokens:\s*2400/, "the 2,400-token AI response cap"],
  [/thinking_level:\s*["']low["']/, "low Gemini thinking level"],
  [/providerStatus\s*!==\s*["']incomplete["']/, "incomplete Gemini response handling"],
  [/function\s+isCompleteLessonReview_\s*\(/, "AI report section and student completeness validation"],
  [/paridade[^\n]+número par[^\n]+número ímpar/i, "lesson-number parity rule"]
];
for (const [pattern, description] of requiredAiReviewPatterns) {
  if (!pattern.test(source)) throw new Error(`Code.gs is missing ${description}.`);
}

const declarations = new Map();
for (const [, name] of source.matchAll(/^\s*function\s+([\w$]+)\s*\(/gm)) {
  declarations.set(name, (declarations.get(name) || 0) + 1);
}
const duplicates = [...declarations].filter(([, count]) => count > 1).map(([name]) => name);
if (duplicates.length) {
  throw new Error(`Duplicate function declarations: ${duplicates.join(", ")}`);
}

const syntaxCheck = spawnSync(process.execPath, ["--check"], {
  input: source,
  encoding: "utf8"
});
if (syntaxCheck.status !== 0) {
  process.stderr.write(syntaxCheck.stderr || syntaxCheck.stdout);
  process.exit(syntaxCheck.status || 1);
}

console.log("Apps Script is a syntactically valid, self-contained Code.gs.");
