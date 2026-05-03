/**
 * Registro silencioso de aula + pontos (equivalente a classes.json / users.json via ScriptProperties).
 * Não altera processarTextoComHorario; invocado só após o planejamento em processarTexto.
 */

var LAUNCH_STORAGE_KEYS = {
    classes: "wiz_classes_json",
    users: "wiz_users_json"
};

var POINTS_PER_CLASS_LAUNCHED = 10;

function extrairAlunosDoTexto(texto) {
    const linhas = texto
        .trim()
        .split("\n")
        .map(function (l) { return l.trim(); })
        .filter(function (l) { return l !== ""; });

    const alunos = linhas.map(function (l) {
        const parts = l.split(/\t| {2,}/);
        var nome = parts[0];
        var livro = parts[1];
        var numeroRaw = parts[2];
        return {
            nome: nome ? nome.trim() : "",
            livro: livro ? livro.trim().toUpperCase() : "",
            numeroRaw: numeroRaw ? numeroRaw.trim() : ""
        };
    }).filter(function (a) { return a.nome && a.livro && a.numeroRaw; });

    return alunos;
}

function readClassesArray_() {
    var raw = PropertiesService.getScriptProperties().getProperty(LAUNCH_STORAGE_KEYS.classes);
    if (!raw) return [];
    try {
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function writeClassesArray_(classes) {
    PropertiesService.getScriptProperties().setProperty(
        LAUNCH_STORAGE_KEYS.classes,
        JSON.stringify(classes)
    );
}

function readUsersArray_() {
    var raw = PropertiesService.getScriptProperties().getProperty(LAUNCH_STORAGE_KEYS.users);
    if (!raw) return [];
    try {
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function writeUsersArray_(users) {
    PropertiesService.getScriptProperties().setProperty(
        LAUNCH_STORAGE_KEYS.users,
        JSON.stringify(users)
    );
}

/** Ranking atual: usuários por pontos (desc). */
function obterRanking() {
    var users = readUsersArray_().slice();
    users.sort(function (a, b) {
        return (b.points || 0) - (a.points || 0);
    });
    return users;
}

function ensureUserRecord_(users, professorId) {
    var id = String(professorId);
    for (var i = 0; i < users.length; i++) {
        if (users[i].id === id) return users[i];
    }
    var rec = { id: id, name: id, points: 0 };
    users.push(rec);
    return rec;
}

/** Identifica o professor sem UI (web app: e-mail quando a sessão expõe usuário). */
function resolverProfessorIdParaRegistro_() {
    try {
        var active = Session.getActiveUser();
        if (active) {
            var em = active.getEmail();
            if (em) return em;
        }
    } catch (e1) { }
    try {
        var em2 = Session.getEffectiveUser().getEmail();
        if (em2) return em2;
    } catch (e2) { }
    return "anonymous";
}

/**
 * Chamada após o planejamento: persiste classe, pontua professor, atualiza dados de ranking.
 */
function registrarAulaPosPlanejamento_(planningOutput, textoBruto) {
    var pid = resolverProfessorIdParaRegistro_();
    launchClass(planningOutput, extrairAlunosDoTexto(textoBruto), pid);
}

/**
 * @param {string} planningOutput
 * @param {Array} alunos — { nome, livro, numeroRaw }
 * @param {string} professorId
 */
function launchClass(planningOutput, alunos, professorId) {
    var classes = readClassesArray_();
    var id = Utilities.getUuid();
    var timestamp = new Date().toISOString();
    classes.push({
        id: id,
        professorId: String(professorId),
        timestamp: timestamp,
        alunos: alunos,
        planningOutput: planningOutput
    });
    writeClassesArray_(classes);

    var users = readUsersArray_();
    var u = ensureUserRecord_(users, professorId);
    u.points = (u.points || 0) + POINTS_PER_CLASS_LAUNCHED;
    writeUsersArray_(users);
}
