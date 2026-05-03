import fs from 'fs';
import vm from 'vm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ================================
// 🔍 UTIL — extrai objetos do GAS
// ================================
function extractObjectLiteral(text, marker) {
  const start = text.indexOf(marker);
  if (start === -1) throw new Error(`Marker not found: ${marker}`);

  const braceStart = text.indexOf('{', start);
  let depth = 0, inStr = false, strQ = '', esc = false, inLine = false, inBlock = false;

  for (let i = braceStart; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1];

    if (inLine) { if (ch === '\n') inLine = false; continue; }
    if (inBlock) { if (ch === '*' && nx === '/') { inBlock = false; i++; } continue; }

    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === strQ) { inStr = false; strQ = ''; }
      continue;
    }

    if (ch === '/' && nx === '/') { inLine = true; i++; continue; }
    if (ch === '/' && nx === '*') { inBlock = true; i++; continue; }

    if (ch === '"' || ch === '\'' || ch === '`') { inStr = true; strQ = ch; continue; }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(braceStart, i + 1);
    }
  }

  throw new Error(`Unclosed object for marker: ${marker}`);
}

// ================================
// 📂 LOAD PLANNER SOURCE (Apps Script Export or raw .gs)
// ================================
/**
 * FINAL.JSON no projeto costuma ser o Code.gs colado — não é JSON válido.
 * Aceita também export JSON { files: { "1": { source } } } e tmp_final_code.gs.
 */
function loadPlannerSource() {
  const simple = [
    join(ROOT, 'google-apps-script', 'FINAL.JSON'),
    join(ROOT, 'google-apps-script', 'LessonPlanner_FINAL.gs'),
    join(ROOT, 'google-apps-script', 'Code.gs'),
    join(ROOT, 'FINAL.json'),
    join(ROOT, 'FINAL.JSON'),
    join(ROOT, 'tmp_final_code.gs')
  ];
  const tmpFallback = join(ROOT, 'tmp_final_code.gs');

  for (const p of simple) {
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, 'utf8');
    try {
      const parsed = JSON.parse(raw);
      const fromExport = parsed?.files?.['1']?.source ?? parsed?.source;
      if (typeof fromExport === 'string' && fromExport.trim()) return fromExport;
    } catch (_) {
      if (/function\s+doGet\b/.test(raw) && /processarTextoComHorario/.test(raw)) return raw;
    }
  }

  if (fs.existsSync(tmpFallback)) return fs.readFileSync(tmpFallback, 'utf8');
  throw new Error(
    'Nenhuma fonte do planejador encontrada. Use google-apps-script/FINAL.JSON (Code.gs colado) ou tmp_final_code.gs na raiz do projeto.'
  );
}

const source = loadPlannerSource();

// ================================
// 🧠 EXTRAÇÃO
// ================================
const objectivesLiteral = extractObjectLiteral(source, 'const allLearningObjectives');
const lessonsLiteral = extractObjectLiteral(source, 'const livros');

const rawObjectives = vm.runInNewContext(`(${objectivesLiteral})`);
const rawLessons = vm.runInNewContext(`(${lessonsLiteral})`);

// ================================
// 🔄 NORMALIZAÇÃO
// ================================
const listaReviews = ["1111","2222","3333","4444","5555","6666","7777","8888","9999","1010"];
const ulBooks = ["NG", "NK2", "NT2", "NW2"];
const siglasEspeciais = ["UL", "WL", "PP", "WE", "CP"];

function normalizarReviewParaCodigo(inp) {
  const s = (inp || "").toString().trim().toUpperCase();

  if (s === "WL" || s === "UL") return "1000";
  if (s === "PP") return "1001";
  if (s === "WE") return "1002";
  if (s === "CP") return "1005";

  const m = s.match(/^R(EVIEW)?\s*(\d+)$/i);
  if (m) {
    const num = m[2];
    return num === "10" ? "1010" : num.repeat(4);
  }

  if (/^(\d)\1{3}$/.test(s)) return s;

  return s;
}

// ================================
// 📚 PROCESSA DADOS
// ================================
const lessons = {};
Object.entries(rawLessons).forEach(([book, seq]) => {
  lessons[book] = seq.map(x => normalizarReviewParaCodigo(x));
});

const learningObjectives = {};
Object.entries(rawObjectives).forEach(([book, data]) => {
  learningObjectives[book] = {};
  Object.entries(data).forEach(([key, value]) => {
    learningObjectives[book][normalizarReviewParaCodigo(key)] = value;
  });
});

// ================================
// 👥 INPUT (SIMULAÇÃO)
// ================================
const alunos = [
  { nome: "João", livro: "NW2", numeroRaw: "2" },
  { nome: "Maria", livro: "NW2", numeroRaw: "R1" },
  { nome: "Pedro", livro: "NW2", numeroRaw: "3" }
];

const horarioStr = "19:00";

// ================================
// 🧠 LÓGICA PRINCIPAL
// ================================
function processarPlanejamento(alunos) {

  let resultado = alunos.map(a => {
    const seqOriginal = rawLessons[a.livro];
    if (!seqOriginal) return null;

    const seqCod = seqOriginal.map(x => normalizarReviewParaCodigo(x));
    const atualCod = normalizarReviewParaCodigo(a.numeroRaw);

    const idx = seqCod.indexOf(atualCod);
    if (idx === -1) return null;

    const proxRaw = seqOriginal[idx + 1];

    if (!proxRaw || proxRaw === "000") {
      return {
        nome: a.nome,
        livro: a.livro,
        proximaLicao: "Finished",
        objetivos: "Final Test"
      };
    }

    const proxCod = normalizarReviewParaCodigo(proxRaw);
    const objectivesData = learningObjectives[a.livro];

    let objetivos = objectivesData?.[proxCod] || "No objective found";

    return {
      nome: a.nome,
      livro: a.livro,
      proximaLicao: proxCod,
      objetivos
    };

  }).filter(Boolean);

  return resultado;
}

// ================================
// ⏱️ HORÁRIOS
// ================================
function adicionarMinutos(horaStr, min) {
  const [h, m] = horaStr.split(":").map(Number);
  const tot = h * 60 + m + min;
  const nh = Math.floor(tot / 60);
  const nm = tot % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

// ================================
// 📊 PLANEJAMENTO FINAL (POR TURMA)
// ================================
function gerarPlanejamento(alunos) {

  const resultado = processarPlanejamento(alunos);

  const fimAula = adicionarMinutos(horarioStr, 60);

  resultado.forEach((r, i) => {
    r.horario = adicionarMinutos(fimAula, -5 * (resultado.length - i));
  });

  const linhas = [];

  linhas.push("=== CLASS PLANNING ===\n");

  resultado.forEach(r => {
    linhas.push(`👤 ${r.nome}`);
    linhas.push(`📘 Lesson: ${r.proximaLicao}`);
    linhas.push(`⏰ Time: ${r.horario}`);
    linhas.push(`🎯 ${r.objetivos}`);
    linhas.push("");
  });

  return linhas.join("\n");
}

// ================================
// 📋 EXECUÇÃO
// ================================
const planejamento = gerarPlanejamento(alunos);

console.log(planejamento);

// ================================
// 📋 COPY (Node CLI)
// ================================
function copiarPlanejamento(texto) {
  fs.writeFileSync("planejamento.txt", texto);
  console.log("📋 Planning saved to planejamento.txt");
}

copiarPlanejamento(planejamento);