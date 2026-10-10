import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GeminiService, GeminiServiceError } from './GeminiService.js';

const plan = [
  'Ana Silva\tNW2\t24\t19:00\tCan talk about food and express quantities.',
  'Bruno Lima\tNW2\t25\t19:05\tCan describe actions happening now.'
].join('\n');

function report({ includeBruno = true } = {}) {
  return [
    'INTRODUÇÃO',
    '- Ana Silva (NW2, Lição 24): praticará falar sobre alimentos e quantidades.',
    ...(includeBruno ? ['- Bruno Lima (NW2, Lição 25): praticará descrever ações em andamento.'] : []),
    '',
    'PEER WORK (DUPLAS/GRUPOS)',
    '- Ana Silva: confirme com o professor a elegibilidade de Peer Work.',
    '- Bruno Lima: aula ímpar; não participa.',
    '',
    'WARM-UP (ATIVAÇÃO INICIAL)',
    'Nome: Troca-relâmpago. Duração: 4 minutos. Materiais: nenhum.',
    'Objetivo: ativar a fala e retomar conteúdo já estudado, escolhido pelo professor.',
    'Execução: 1. O professor dá um tema. 2. Em duplas, cada aluno pergunta e responde. 3. Trocam de parceiro.',
    'Exemplos em inglês: “What do you eat?”; “What are you doing?”',
    '',
    'CLOSING (ENCERRAMENTO)',
    'Nome: Uma frase de saída. Duração: 3 minutos. Materiais: nenhum.',
    'Execução: cada aluno produz uma frase ligada ao seu objetivo e a compartilha.',
    'Objetivo pedagógico: observar uma evidência breve da aprendizagem individual.',
    '',
    'ORIENTAÇÃO FINAL AO PROFESSOR',
    'Ofereça modelos de linguagem adequados a cada lição e confirme a elegibilidade do Peer Work quando necessário.'
  ].join('\n');
}

function stubGemini(t, payloads) {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousFetch = globalThis.fetch;
  const sentBodies = [];
  process.env.GEMINI_API_KEY = 'test-only-key';
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    sentBodies.push(body);
    assert.equal(body.generationConfig.maxOutputTokens, 2400);
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'low');
    const next = payloads.shift();
    if (!next) throw new Error('Unexpected extra Gemini request');
    return { ok: true, json: async () => next };
  };
  t.after(() => {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
  });
  return sentBodies;
}

function completed(text) {
  return {
    candidates: [{ finishReason: 'STOP', content: { parts: [{ text }] } }]
  };
}

test('returns the complete report in one request while keeping the 2,400-token cap', async (t) => {
  const sentBodies = stubGemini(t, [completed(report())]);
  const result = await GeminiService.reviewLessonPlan(plan);

  assert.equal(result.text, report());
  assert.equal(sentBodies.length, 1);
  assert.match(sentBodies[0].systemInstruction.parts[0].text, /paridade é o próprio número da lição/);
  assert.match(sentBodies[0].systemInstruction.parts[0].text, /WARM-UP \(ATIVAÇÃO INICIAL\)/);
});

test('retries incomplete or omitted-student reports concisely without raising the token cap', async (t) => {
  const sentBodies = stubGemini(t, [
    { status: 'incomplete', steps: [{ type: 'model_output', content: [{ type: 'text', text: 'INTRODUÇÃO\n- Ana Silva' }] }] },
    completed(report())
  ]);
  const result = await GeminiService.reviewLessonPlan(plan);

  assert.equal(result.text, report());
  assert.equal(sentBodies.length, 2);
  assert.match(sentBodies[1].systemInstruction.parts[0].text, /RETRY DE COMPLETUDE/);
  assert.ok(sentBodies.every((body) => body.generationConfig.maxOutputTokens === 2400));
});

test('retries a nominally completed response that omitted a student from the introduction', async (t) => {
  const sentBodies = stubGemini(t, [completed(report({ includeBruno: false })), completed(report())]);
  const result = await GeminiService.reviewLessonPlan(plan);

  assert.match(result.text, /Bruno Lima/);
  assert.equal(sentBodies.length, 2);
});

test('never returns an incomplete report after the concise retry also fails', async (t) => {
  stubGemini(t, [
    { status: 'incomplete', steps: [{ type: 'model_output', content: [{ type: 'text', text: 'resposta parcial' }] }] },
    { status: 'incomplete', steps: [{ type: 'model_output', content: [{ type: 'text', text: 'outra resposta parcial' }] }] }
  ]);

  await assert.rejects(
    GeminiService.reviewLessonPlan(plan),
    (error) => error instanceof GeminiServiceError && /2\.400 tokens/.test(error.message)
  );
});
