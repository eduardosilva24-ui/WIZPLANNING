/**
 * Emits the Node planner from the canonical Apps Script planner in Code.gs.
 * Course data is replaced with the shared JSON sources used by the Node app.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const codePath = path.join(root, "google-apps-script/Code.gs");
const outPath = path.join(root, "backend/services/gasLessonPlanner.js");

const code = fs.readFileSync(codePath, "utf8");
const plannerStart = code.indexOf("function processarTextoComHorario(texto, horarioStr) {");
const plannerEnd = code.indexOf("\n// END PLANNER CORE", plannerStart);
if (plannerStart < 0 || plannerEnd < 0) {
  throw new Error("Canonical planner markers were not found in google-apps-script/Code.gs.");
}

let planner = code.slice(plannerStart, plannerEnd);
const dataStart = planner.indexOf("    // BEGIN EMBEDDED COURSE DATA");
const dataEnd = planner.indexOf("    // END EMBEDDED COURSE DATA", dataStart);
if (dataStart < 0 || dataEnd < 0) {
  throw new Error("Embedded course data markers were not found in the planner function.");
}
planner = planner.slice(0, dataStart)
  + "    const allLearningObjectives = learningObjectivesData;\n\n    const livros = livrosData;\n"
  + planner.slice(dataEnd + "    // END EMBEDDED COURSE DATA".length);
planner = planner.replace(
  "function processarTextoComHorario(texto, horarioStr) {",
  "export function processarTextoComHorario(texto, horarioStr) {"
);

const header = `/**
 * Google Apps Script Lesson Planner — direct Node port.
 * Algorithm source: google-apps-script/Code.gs.
 * Data: shared/learningObjectives.json and shared/Lessons.json.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { launchClass } from "./lessonLaunchClass.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const learningObjectivesData = JSON.parse(
  readFileSync(join(__dirname, "../../shared/learningObjectives.json"), "utf8")
);
const livrosData = JSON.parse(readFileSync(join(__dirname, "../../shared/Lessons.json"), "utf8"));

export function extrairAlunosDoTexto(texto) {
  const linhas = texto
    .trim()
    .split("\\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  const alunos = linhas.map((l) => {
    const [nome, livro, numeroRaw] = l.split(/\\t| {2,}/);
    return {
      nome: nome ? nome.trim() : "",
      livro: livro ? livro.trim().toUpperCase() : "",
      numeroRaw: numeroRaw ? numeroRaw.trim() : ""
    };
  }).filter((a) => a.nome && a.livro && a.numeroRaw);

  return alunos;
}

`;

const footer = `
// Agora aceita texto e horário opcional (terceiro parâmetro ignorado — contrato do formulario.html)
export async function processarTexto(texto, horarioStr, objectivesVisible, professorUserId) {
    const output = processarTextoComHorario(texto, horarioStr);
    try {
        await launchClass(output, extrairAlunosDoTexto(texto), professorUserId);
    } catch (e) {
        console.error("launchClass", e);
    }
    return output;
}
`;

fs.writeFileSync(outPath, header + planner + footer, "utf8");
console.log("Wrote", outPath);
