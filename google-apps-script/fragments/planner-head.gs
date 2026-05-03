// Assembled into Code.gs by scripts/assemble-google-apps-script-Code.gs.mjs
// Planner core is unchanged; learning objectives and livros are injected from shared/*.json.

function doGet() {
    return HtmlService.createHtmlOutputFromFile("formulario");
}

// Agora aceita texto e horário opcional (terceiro parâmetro do cliente é ignorado; mantém contrato da UI)
function processarTexto(texto, horarioStr, objectivesVisible) {
    var output = processarTextoComHorario(texto, horarioStr);
    try {
        registrarAulaPosPlanejamento_(output, texto);
    } catch (e) { }
    return output;
}

// Principal: texto + horário ("HH:mm") → NAME, BOOK, LESSON, OBJECTIVES, CHECK TIME
function processarTextoComHorario(texto, horarioStr) {

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


