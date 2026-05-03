/**
 * Builds google-apps-script/Code.gs by joining the untouched planner fragments
 * with shared/learningObjectives.json and shared/Lessons.json (same data as the inline GAS blobs).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const head = fs.readFileSync(path.join(root, "google-apps-script/fragments/planner-head.gs"), "utf8");
const tail = fs.readFileSync(path.join(root, "google-apps-script/fragments/planner-tail.gs"), "utf8");
const objectives = fs.readFileSync(path.join(root, "shared/learningObjectives.json"), "utf8").trim();
const lessons = fs.readFileSync(path.join(root, "shared/Lessons.json"), "utf8").trim();

const mid = `\n    const allLearningObjectives = ${objectives};\n\n    const livros = ${lessons};\n\n`;

const code = head + mid + tail;
const outPath = path.join(root, "google-apps-script/Code.gs");
fs.writeFileSync(outPath, code, "utf8");
console.log("Wrote", outPath, "(" + code.length + " chars)");
