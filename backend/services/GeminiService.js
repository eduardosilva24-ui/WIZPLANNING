const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const MAX_PLAN_LENGTH = 18_000;
const MAX_REVIEW_OUTPUT_TOKENS = 2400;
const REVIEW_SECTIONS = [
  'INTRODUÇÃO',
  'PEER WORK (DUPLAS/GRUPOS)',
  'WARM-UP (ATIVAÇÃO INICIAL)',
  'CLOSING (ENCERRAMENTO)',
  'ORIENTAÇÃO FINAL AO PROFESSOR'
];

const REVIEW_SYSTEM_INSTRUCTION = `Você é o assistente pedagógico do WizPlanning, especializado no ensino de inglês e na metodologia Wizard by Pearson. Transforme exclusivamente os dados fornecidos em um relatório profissional, personalizado, objetivo e aplicável.

PRECISÃO E DADOS
- Os dados podem conter nome, livro, número da lição, conteúdo/objetivo, última lição estudada, observações e histórico. Considere somente o que estiver presente; a entrada habitual contém nome, livro, lição, horário opcional e objetivo.
- Preserve nomes, livros e lições. Inclua todos os alunos. Não confunda lição atual com última estudada. Não invente conteúdo, objetivos, nível, dificuldade, personalidade ou dados pessoais. Não deduza o conteúdo pelo código/número da lição. Se faltar informação essencial, declare a limitação com clareza.
- Resuma o objetivo informado em português, priorizando o que cada aluno aprenderá a compreender, dizer, perguntar, responder ou escrever. Não acrescente sugestão de atividade na introdução.

PEER WORK — SOMENTE ORGANIZAÇÃO
- Informe apenas pares elegíveis; o exercício em si já consta no livro. Não crie, descreva, adapte ou substitua a atividade de Peer Work.
- A paridade é o próprio número da lição informado: lição numérica par (por exemplo, 24) participa; lição numérica ímpar não participa. Não deduza o número ou a paridade quando a lição não for numérica/estiver ausente.
- Uma dupla é elegível se ambos estão na mesma lição do mesmo livro; ou se estão em lições posteriores do mesmo livro e o aluno mais avançado já estudou a lição atual do colega. Para a segunda condição, exija evidência explícita de conclusão. Nunca compare números de livros diferentes nem crie critérios adicionais.
- Analise a turma toda antes de agrupar; maximize alunos em duplas válidas, sem repetir nenhum. Não force combinações. Se um aluno estiver comprovadamente no livro/lição mais avançados e não tiver par, indique “Peer Work com o professor.” Se não for possível confirmar isso, indique que o professor precisa confirmar. Se faltar evidência de que o aluno da lição posterior já concluiu a lição do colega, não presuma; informe que o professor precisa confirmar. Não invente combinações.

WARM-UP
- Crie uma única ativação de 3–5 minutos que contemple os cinco pilares: interação, integração, produção, reprodução ativa de conteúdo já trabalhado e quebra de estado com propósito pedagógico. Se o histórico de conteúdo anterior não vier nos dados, não invente o que já foi estudado: peça ao professor que selecione para a retomada um item que a turma já praticou.
- Em turma multinível, mantenha dinâmica comum e adapte os desafios aos objetivos de cada aluno; não force todos ao mesmo conteúdo. Evite atividade anterior quando houver histórico. Use pouca preparação e materiais simples.
- Informe Nome, Duração, Materiais, Objetivo, Execução numerada e exemplos em inglês quando pertinentes. Dê passos concretos e imediatamente executáveis; não escreva apenas “faça perguntas”.

CLOSING
- Sugira um encerramento curto e viável nos minutos finais, relacionado aos objetivos individuais, permitindo que cada aluno demonstre o que aprendeu. Pode ser revisão, reflexão, produção ou desafio breve; não transforme em segunda aula ou avaliação extensa.
- Informe Nome, Duração, Materiais, Execução clara e Objetivo pedagógico.

FORMATO OBRIGATÓRIO
Entregue somente o relatório em português, nesta ordem e com estes títulos exatos: ${REVIEW_SECTIONS.join(' | ')}. Use títulos, listas e parágrafos curtos. INTRODUÇÃO deve citar todos os alunos com livro/lição e resumo individual (uma ou duas frases por aluno). PEER WORK deve conter apenas a organização e limitações de elegibilidade. Termine com orientação ao professor de 1–3 frases, sustentada pelos dados. Não inclua comentários sobre IA ou processo.`;

const COMPACT_RETRY_INSTRUCTION = `

RETRY DE COMPLETUDE: A tentativa anterior não concluiu todas as seções/alunos dentro do limite. Gere agora um relatório completo e mais conciso, ainda obedecendo a todas as regras: mantenha exatamente os cinco títulos e sua ordem; uma frase objetiva por aluno na INTRODUÇÃO; Peer Work apenas com elegibilidade confirmada ou a limitação dos dados; um Warm-up completo com nome, duração, materiais, objetivo, passos numerados e exemplos curtos em inglês; um Closing completo com nome, duração, materiais, execução e objetivo pedagógico; orientação final de 1–3 frases. Não omita nenhum aluno nem nenhum campo obrigatório. Use frases enxutas e não repita explicações.`;

function normalizeReportText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getPlanStudentNames(planText) {
  return String(planText || '')
    .split(/\r?\n/)
    .map((line) => line.split(/\t| {2,}/, 1)[0].trim())
    .filter(Boolean);
}

function isCompleteReviewReport(text, planText) {
  const reportLines = String(text || '').split(/\r?\n/);
  const normalizedLines = reportLines.map((line) => normalizeReportText(
    line.trim().replace(/^#{1,6}\s*/, '').replace(/^\*+|\*+$/g, '').trim()
  ));
  const sectionLineIndexes = REVIEW_SECTIONS.map((section) => normalizedLines.indexOf(normalizeReportText(section)));
  if (sectionLineIndexes.some((index, position) => index < 0 || (position > 0 && index <= sectionLineIndexes[position - 1]))) return false;

  const introduction = normalizedLines.slice(sectionLineIndexes[0] + 1, sectionLineIndexes[1]).join('\n');
  if (!getPlanStudentNames(planText).every((name) => introduction.includes(normalizeReportText(name)))) return false;

  const sectionBody = (sectionIndex) => reportLines
    .slice(sectionLineIndexes[sectionIndex] + 1, sectionLineIndexes[sectionIndex + 1] ?? reportLines.length)
    .join('\n')
    .replace(/[*_`]/g, '');
  const warmUp = normalizeReportText(sectionBody(2));
  const closing = normalizeReportText(sectionBody(3));
  const finalGuidance = sectionBody(4).trim();
  const hasLabels = (body, labels) => labels.every((label) => new RegExp(`${label}\\s*:`).test(body));

  return hasLabels(warmUp, ['nome', 'duracao', 'materiais', 'objetivo', 'execucao'])
    && hasLabels(closing, ['nome', 'duracao', 'materiais', 'execucao', 'objetivo pedagogico'])
    && Boolean(finalGuidance);
}

export class GeminiServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'GeminiServiceError';
    this.status = status;
  }
}

export class GeminiService {
  static get apiKey() {
    return String(process.env.GEMINI_API_KEY || '').trim();
  }

  static get model() {
    return String(process.env.GEMINI_MODEL || 'gemini-flash-latest').trim();
  }

  static async reviewLessonPlan(planText) {
    const normalizedPlan = String(planText || '').trim();
    if (!normalizedPlan) throw new GeminiServiceError('Generate a lesson plan before requesting an AI review.', 400);
    if (normalizedPlan.length > MAX_PLAN_LENGTH) throw new GeminiServiceError('This lesson plan is too large for an AI review.', 400);
    if (!this.apiKey) throw new GeminiServiceError('AI is not configured. Add GEMINI_API_KEY to the server environment.', 503);

    const requestReview = async (compactRetry) => {
      let response;
      try {
        response = await fetch(`${GEMINI_API_ROOT}/${encodeURIComponent(this.model)}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.apiKey
          },
          signal: AbortSignal.timeout(30_000),
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: REVIEW_SYSTEM_INSTRUCTION + (compactRetry ? COMPACT_RETRY_INSTRUCTION : '') }]
            },
            contents: [{
              role: 'user',
              parts: [{ text: `Revise este planejamento de aula:\n\n${normalizedPlan}` }]
            }],
            generationConfig: {
              thinkingConfig: { thinkingLevel: 'low' },
              maxOutputTokens: MAX_REVIEW_OUTPUT_TOKENS
            }
          })
        });
      } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        throw new GeminiServiceError(
          timedOut
            ? 'O serviço de IA demorou para responder. Tente novamente.'
            : 'Não foi possível acessar o serviço de IA. Tente novamente em instantes.',
          503
        );
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = String(payload?.error?.message || 'O serviço de IA recusou a solicitação.');
        const safeMessage = response.status === 401 || response.status === 403
          ? 'A chave de IA do servidor é inválida ou está indisponível.'
          : response.status === 429
            ? 'O limite de uso da IA foi atingido. Tente novamente em instantes.'
            : `Não foi possível gerar o relatório: ${detail}`;
        throw new GeminiServiceError(safeMessage, response.status === 429 ? 429 : 502);
      }
      return payload;
    };

    let payload;
    let text = '';
    for (let attempt = 0; attempt < 2; attempt += 1) {
      payload = await requestReview(attempt === 1);
      text = (payload?.candidates?.[0]?.content?.parts || [])
        .map((part) => String(part?.text || ''))
        .join('\n')
        .trim();
      const finishReason = String(payload?.candidates?.[0]?.finishReason || '').toUpperCase();
      const complete = text && finishReason !== 'MAX_TOKENS' && isCompleteReviewReport(text, normalizedPlan);
      if (complete) return { text, model: this.model };
      if (attempt === 1) {
        throw new GeminiServiceError(
          'A IA não conseguiu concluir o relatório completo dentro do limite de 2.400 tokens. Divida a turma em grupos menores e tente novamente.',
          502
        );
      }
    }

    throw new GeminiServiceError('A IA não retornou um relatório completo. Tente novamente.', 502);
  }
}

export default GeminiService;
