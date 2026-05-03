/**
 * Emits backend/services/gasLessonPlanner.js: direct port of processarTextoComHorario
 * (fragments/planner-tail.gs + shared/*.json data), unchanged algorithm.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const tailPath = path.join(root, "google-apps-script/fragments/planner-tail.gs");
const outPath = path.join(root, "backend/services/gasLessonPlanner.js");

const tail = fs.readFileSync(tailPath, "utf8");

const header = `/**
 * Google Apps Script Lesson Planner — direct Node port.
 * Data: shared/learningObjectives.json, shared/Lessons.json (same blobs as GAS).
 * Do not edit the algorithm block manually; change fragments + re-run: npm run build:gas-node-planner
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

// Principal: texto + horário ("HH:mm") → NAME, BOOK, LESSON, OBJECTIVES, CHECK TIME
export function processarTextoComHorario(texto, horarioStr) {
    // 1) Quebra o texto em linhas úteis
    const linhas = texto
        .trim()
        .split("\\n")
        .map(l => l.trim())
        .filter(l => l !== "");

    const alunos = linhas.map(l => {
        // Usa regex para lidar com TAB (\\t) ou múltiplos espaços ( {2,}) como separador
        const [nome, livro, numeroRaw] = l.split(/\\t| {2,}/);
        return { nome: nome ? nome.trim() : "", livro: livro ? livro.trim().toUpperCase() : "", numeroRaw: numeroRaw ? numeroRaw.trim() : "" };
    }).filter(a => a.nome && a.livro && a.numeroRaw); // Garante que há dados válidos

    const allLearningObjectives = learningObjectivesData;
    const livros = livrosData;

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

fs.writeFileSync(outPath, header + tail + footer, "utf8");
console.log("Wrote", outPath);
