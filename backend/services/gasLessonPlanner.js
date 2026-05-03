/**
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
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  const alunos = linhas.map((l) => {
    const [nome, livro, numeroRaw] = l.split(/\t| {2,}/);
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
        .split("\n")
        .map(l => l.trim())
        .filter(l => l !== "");

    const alunos = linhas.map(l => {
        // Usa regex para lidar com TAB (\t) ou múltiplos espaços ( {2,}) como separador
        const [nome, livro, numeroRaw] = l.split(/\t| {2,}/);
        return { nome: nome ? nome.trim() : "", livro: livro ? livro.trim().toUpperCase() : "", numeroRaw: numeroRaw ? numeroRaw.trim() : "" };
    }).filter(a => a.nome && a.livro && a.numeroRaw); // Garante que há dados válidos



    const allLearningObjectives = learningObjectivesData;
    const livros = livrosData;

    const listaReviews = ["1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1010"];

    const ulBooks = ["NG", "NK2", "NT2", "NW2"];

    const siglasEspeciais = ["UL", "WL", "PP", "WE", "CP"];


    function normalizarReviewParaCodigo(inp) {

        const s = (inp || "").toString().trim().toUpperCase();

        if (s === "WL" || s === "UL") return "1000";

        if (s === "PP") return "1001";

        if (s === "WE") return "1002";

        if (s === "CP") return "1005";

        const m = s.match(/^R(EVIEW)?\s*(\d+)$/i) || s.match(/^R(X|EVIEW)?\s*(\d+)$/i);

        if (m) {

            const num = m[2];

            return num === "10" ? "1010" : num.repeat(4);

        }

        if (/^(\d)\1{3}$/.test(s)) return s;

        return s;

    }


    function converterCodigoParaRX(codigo) {

        if (codigo === "1010") return "R10";

        const m = codigo.match(/^(\d)\1{3}$/);

        return m ? "R" + m[1] : codigo;

    }


    function categoria(item) {

        const v = item.proximaLicao;

        if (siglasEspeciais.includes(v)) return 5;

        if (v === "Finished the Book/EC") return 4;

        if (/^R\d+$/.test(v)) return 3;

        const n = parseInt(v, 10);

        return (n % 2 === 0) ? 1 : 2;

    }


    function valorParaOrdenar(item) {

        const v = item.proximaLicao;

        const cat = categoria(item);

        if (cat === 3) return parseInt(v.slice(1), 10);

        if (cat === 1 || cat === 2) return parseInt(v, 10);

        return Infinity;

    }


    // 4) Processa cada aluno

alunos.forEach((a, i) => {
  const seqOriginal = livros[a.livro];
  if (!seqOriginal) return null;
  else {
    const seqCod = seqOriginal.map(x => normalizarReviewParaCodigo(x));
    const atualCod = normalizarReviewParaCodigo(a.numeroRaw);
    const idx = seqCod.indexOf(atualCod);
    if (idx === -1) return null;
    else {} 
  }
});

    let resultado = alunos.map(a => {

        const seqOriginal = livros[a.livro];

        if (!seqOriginal) return null;

        const seqCod = seqOriginal.map(x => normalizarReviewParaCodigo(x));
        
        const atualCod = normalizarReviewParaCodigo(a.numeroRaw);

        const idx = seqCod.indexOf(atualCod);

        if (idx === -1) return null;


        const proxRaw = seqOriginal[idx + 1];

        let objetivos = "";


        if (!proxRaw || proxRaw === "000") {
            // Caso de livro concluído
            return { nome: a.nome, livro: a.livro, proximaLicao: "Finished the Book/EC", objetivos: "Livro Concluído. Prova Final/End of Course (EC)." };
        }


        const proxCod = normalizarReviewParaCodigo(proxRaw);

        let proxFmt;

        if (listaReviews.includes(proxCod)) proxFmt = converterCodigoParaRX(proxCod);

        else if (proxCod === "1000") proxFmt = ulBooks.includes(a.livro) ? "UL" : "WL";

        else if (proxCod === "1001") proxFmt = "PP";

        else if (proxCod === "1002") proxFmt = "WE";

        else if (proxCod === "1005") proxFmt = "CP";

        else proxFmt = proxCod;


        // ====================================================================================
        // Lógica Única para BUSCA DE OBJETIVOS
        // ====================================================================================
        const objectivesData = allLearningObjectives[a.livro];
        
        // Define a chave de busca para os objetivos (usa a próxima lição formatada como string)
        let objectiveKey = proxFmt;
        const proxLessonNum = parseInt(proxFmt, 10);

        // Se for uma lição numérica (par ou ímpar), a chave de busca é a lição ímpar principal (Lesson N)
        if (!isNaN(proxLessonNum)) {
            // Se for lição par, busca o objetivo da lição ímpar anterior (Lesson N-1)
            objectiveKey = (proxLessonNum % 2 === 0) ? (proxLessonNum - 1).toString() : proxFmt;
        }

        // Casos especiais onde a chave é a lição em si (1000, 1001, 1002, 1005 ou 1010)
        if (proxFmt === "WL" || proxFmt === "UL") objectiveKey = "1000";
        if (proxFmt === "PP") objectiveKey = "1001";
        if (proxFmt === "WE") objectiveKey = "1002";
        if (proxFmt === "CP") objectiveKey = "1005";
        if (proxFmt === "R10") objectiveKey = "1010";


        if (objectivesData) {
            objetivos = objectivesData[objectiveKey] || objectivesData[proxFmt] || `Objetivo não especificado para ${proxFmt} (Lição complementar ou não mapeada).`;
        } else {
            // Se o livro inteiro ainda não foi mapeado
            objetivos = `Objetivos não mapeados para o livro ${a.livro}.`;
        }

        // Formatação final para Reviews (R1 a R9)
        if (proxFmt.startsWith("R") && !objetivos.includes("Objetivo não especificado")) {
            if (objetivos.length < 50) { // Se for um objetivo genérico curto (como "Lição de Revisão")
                 objetivos = `Lição de Revisão (${proxFmt}).`;
            }
        }
        
        // Formatação final para Welcome/UL (1000)
        if (proxFmt === "WL" || proxFmt === "UL") {
            if (objetivos.length < 50 && !objetivos.includes("Objetivo não especificado")) {
                 objetivos = "Lição de Boas-Vindas/Nivelamento (WL/UL).";
            }
        }
        


        return { nome: a.nome, livro: a.livro, proximaLicao: proxFmt, objetivos: objetivos };

}).filter(Boolean);



    // 5) Ordena resultado

    resultado.sort((a, b) => {

        const ca = categoria(a), cb = categoria(b);

        if (ca !== cb) return ca - cb;

        return valorParaOrdenar(a) - valorParaOrdenar(b);

    });


    // 6) Calcula horários de checagem

    function adicionarMinutos(horaStr, min) {

        const [h, m] = horaStr.split(":").map(Number);

        const tot = h * 60 + m + min;

        const nh = ((Math.floor(tot / 60) % 24) + 24) % 24;

        const nm = (tot % 60 + 60) % 60;

        return (nh < 10 ? "0" : "") + nh + ":" + (nm < 10 ? "0" : "") + nm;

    }


    let checks = [];

    if (horarioStr) {

        const fimAula = adicionarMinutos(horarioStr, 60); // horário final

        const n = resultado.length;

        // último aluno começa 5 min antes do fim

        for (let i = 0; i < n; i++) {

            checks[i] = adicionarMinutos(fimAula, -5 * (n - i));

        }

    }


    // 7) Monta saída final na ordem: Aluno | Livro | Lição | Horário | Learning Objectives
const linhasSaida = resultado.map((r, i) => {

    let linha = `${r.nome}\t${r.livro}\t${r.proximaLicao}`;

    // Adiciona o horário de checagem no meio
    if (horarioStr) {
        linha += `\t${checks[i]}`;
    }

    // Adiciona os objetivos no final
    linha += `\t${r.objetivos}`;

    return linha;
});

return linhasSaida.join("\n");
}

// Agora aceita texto e horário opcional (terceiro parâmetro ignorado — contrato do formulario.html)
export function validateTexto(texto) {
  const alunos = extrairAlunosDoTexto(texto);
  const livros = livrosData;

  function normalizarReviewParaCodigo(inp) {
    const s = (inp || "").toString().trim().toUpperCase();
    if (s === "WL" || s === "UL") return "1000";
    if (s === "PP") return "1001";
    if (s === "WE") return "1002";
    if (s === "CP") return "1005";
    const m = s.match(/^R(EVIEW)?\s*(\d+)$/i) || s.match(/^R(X|EVIEW)?\s*(\d+)$/i);
    if (m) {
      const num = m[2];
      return num === "10" ? "1010" : num.repeat(4);
    }
    if (/^(\d)\1{3}$/.test(s)) return s;
    return s;
  }

  const unknownBooks = [];
  const invalidLessons = [];
  let validCount = 0;

  alunos.forEach(a => {
    const seqOriginal = livros[a.livro];
    if (!seqOriginal) {
      unknownBooks.push(`${a.livro} (${a.nome})`);
      return;
    }
    const seqCod = seqOriginal.map(x => normalizarReviewParaCodigo(x));
    const atualCod = normalizarReviewParaCodigo(a.numeroRaw);
    const idx = seqCod.indexOf(atualCod);
    if (idx === -1) {
      invalidLessons.push(`${a.numeroRaw} in ${a.livro} (${a.nome})`);
      return;
    }
    validCount++;
  });

  return {
    alunosCount: alunos.length,
    validCount,
    issues: { unknownBooks: [...new Set(unknownBooks)], invalidLessons: [...new Set(invalidLessons)] }
  };
}

export async function processarTexto(texto, horarioStr, objectivesVisible, professorUserId) {
    const output = processarTextoComHorario(texto, horarioStr);
    try {
        await launchClass(output, extrairAlunosDoTexto(texto), professorUserId);
    } catch (e) {
        console.error("launchClass", e);
    }
    return output;
}
