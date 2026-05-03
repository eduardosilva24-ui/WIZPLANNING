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



    const allLearningObjectives = {
  "NW2": {
      "1" : "• Can name some kinds of foods and drinks. • Can say what they eat and what they drink.",
      "3": "• Can name some foods. • Can state what they want and what they like. • Can talk about what they eat and drink for their meals. • Can say simple sentences in the negative form.",
      "5": "• Can name a few foods. • Can state what they prefer and what they love. • Can ask simple questions.",
      "7": "• Can name a few languages. • Can state what languages they speak and study. • Can name some parts of the day. • Can recognize and use the letters of the alphabet in English.",
      "9": "• Can say the name of a few languages and countries. • Can say basic greetings. • Can say where they live. • Can state where they study or live. • Can ask where other people live. • Can ask and give some personal information.",
      "11": "• Can name some members of the family and some acquaintances. • Can name a few countries. • Can say some places they go to. • Can say what they do at some places.",
      "13": "• Can name a few everyday items. • Can state the things they have or don’t have, and what they have or dont have to do. • Can state the things they need or don’t need, and what they need or don’t need to do. • Can recognize basic forms of singular and plural. • Can recognize and say the numbers up to 10.",
      "15": "• Can ask for and give e-mail addresses. • Can name a few places in the city. • Can say where they go or want to go.",
      "17": "• Can name a few places in the city. • Can describe their routine with simple short sentences. • Can express contrasting ideas in a simple way. • Can say and recognize the numbers from 11 up to 29.",
      "19": "• Can name a few dishes. • Can name a few household goods. • Can name some parts of the house. • Can ask and tell the time. • Can talk about quantity in a very simple way. • Can say a few household tasks. • Can say the numbers up to 60.",
      "21": "• Can say and recognize the days of the week. • Can give very limited personal information using basic fixed expressions. • Can use some expressions to talk about frequency. • Can describe their routine using simple short sentences.",
      "23": "• Can name a few subjects. • Can describe their routine with simple short sentences. • Can say things they or others know how to do.",
      "25": "• Can name a few items related to traveling. • Can ask and answer about prices. • Can use adjectives in fixed expressions. • Can say and recognize the numbers from 70 to 100. • Can ask and answer about quantities.",
      "27": "• Can ask and answer about quantities. • Can say what they do at some places. • Can name some places in the city. • Can say where they go or want to go to.",
      "29": "• Can name a few means of transportation. • Can ask and give simple directions. • Can give simple commands and make simple requests. • Can recognize a few familiar everyday words, if delivered slowly and clearly. • Can ask about and give their home address. • Can say their zip code.",
      "31": "• Can talk about plans and wishes in a simple way. • Can talk about their and somebody else’s tasks and activities. • Can invite people to do an activity in a simple way. • Can name more parts of the day.",
      "33": "• Can state which topics they like or don’t like to talk about. • Can talk about entertainment using very simple sentences. • Can ask and answer basic questions about family and friends in a limited way. • Can ask and answer simple questions on very familiar topics.",
      "35": "• Can state what they think and give their opinion using very simple adjectives and phrases. • Can ask someones opinion. • Can ask questions using why and give explanations using because.",
      "37": "• Can talk about health issues in a simple way. • Can say what they and other people do for a living. • Can say where they and other people are. • Can express that they feel pain using fixed phrases.",
      "39": "• Can say how they feel using basic adjectives. • Can describe objects and situations using basic adjectives. • Can say what they and other people do for a living. • Can say where they and other people are not. • Can say some ordinal numbers.",
      "41": "• Can name the months of the year. • Can say when their birthday is. • Can say and ask someone’s age. • Can find out who someone is. • Can say some ordinal numbers.",
      "43": "• Can talk about food and dishes. • Can refer to quantity in a simple way.",
      "45": "• Can name some kitchen utensils. • Can ask for a drink or food in a limited way. • Can name some places in the city to eat. • Can talk about things in a general way.",
      "47": "• Can talk about diet and lifestyles using simple sentences. • Can ask about frequency and answer using some adverbs. • Can use conjunction so to connect clauses.",
      "49": "• Can name a few pieces of clothing. • Can interact with a sales clerk using a few simple phrases. • Can say what they are doing. • Can name some colors.",
      "51": "• Can say what they are or are not doing. • Can interact with a sales clerk using a few simple phrases. • Can name a few items related to shopping and making a purchase.",
      "53": "• Can name a few objects for storing things. • Can use some prepositions to indicate place and position. • Can say things they do in general.",
      "55": "• Can name a few hobbies. • Can name a few sports. • Can name a few musical instruments. • Can express ability and permission, and make offers and requests in a simple way.",
      "57": "• Can talk about traveling and vacations. • Can express their likes and dislikes using simple phrases. • Can express ability and permission, and make offers and requests in a simple way.",
      "59": "• Can use there to be to describe places or situations. • Can name a few hotel facilities. • Can name some countries and nationalities. • Can use a few expressions related to checking in and checking out at an airport or a hotel."},

  "PT": {
      "1" : "Learning Objective: Can say where they live in a simple way. Can understand and answer simple questions about personal information if spoken slowly and clearly. Can ask and answer how they go to or come from school or home.Can recognize familiar words in short phrases and sentences spoken slowly and clearly if supportedby pictures or gestures.Grammar:Simple Present of the verbs to live, to go, and tocome in the affirmative and interrogative formswith pronouns I, you, we, they. Question words where and how. Possessive adjectives my and your. Preposition by and phrase on foot (transportation). Prepositions of place near, in, on, and to. Preposition with (with my friends). Indefinite articles a and an.",
      "3": "Learning Objective: Can talk about what they eat and drink for breakfast in a simple way. Can understand and answer simple questions about their daily routines using short, fixed expressions. Can say what time they do something in full hours. Can understand simple phrases related to familiar topics if spoken slowly and clearly and supported by pictures. Can understand basic information in short passages about everyday activities or routines if spoken slowly and clearly and supported by prompts. Grammar: Simple Present of the verbs to eat, to drink, and to wake up in the affirmative, negative, and interrogative forms with pronouns I, you, we, they. Prepositions in (in the morning) and for (for breakfast). Question words what and what time. Adverbs early and late.",
      "5": "Learning Objective: Can ask about and understand simple phrases related to daily activities. Can understand basic information in short passages about extracurricular activities or routines if spoken slowly and clearly and supported by prompts. Can describe a sequence of events in a simple manner. Grammar: Simple Present of the verbs to do, to arrive, and to have in the affirmative and interrogative forms with pronouns I, you, we, and they. Prepositions of time until, after, before, and at. Preposition of place from. Possessive adjectives my and your. Question words what and what time.",
      "7": "Learning Objective: Can understand simple phrases related to familiar topics if spoken slowly and clearly and supported by pictures or gestures. Can talk about personal possessions (e.g., toys, pets) using simple language. Can name everyday objects from spoken descriptions if supported by pictures. Can understand basic sentences about household tasks they do to help at home. Can talk about things they share or don’t share. Grammar: Simple Present of the verbs to share and to help in the affirmative, negative, and interrogative forms (1st and 2nd person singular). Object pronouns him, her, it, and them. Preposition with. Question word how.",
      "9": "Learning Objective: Can recognize a few familiar everyday nouns and adjectives if spoken slowly and clearly. Can talk about extended family members in a simple manner. Can answer simple questions about familiar topics if delivered slowly and clearly. Can produce short, fixed expressions, using gestures and asking for help when necessary. Can say how often they and others do common everyday activities, using basic frequency expressions. Grammar: Simple Present of the verbs to talk, to be, and to see in the affirmative, negative, and interrogative forms (1st and 2nd person singular and plural). Question words who and how often. Adverbs of frequency always, never, and sometimes. Demonstrative pronouns this and these. Preposition to (talk to)",
      "11": "Learning Objective: Can ask and answer simple questions about what they like doing using basic phrases. Can answer simple questions about familiar topics if delivered slowly and clearly. Can write simple sentences about their life and routines. Can mention some free time activities they and other people do. Can make and accept or refuse invitations using simple language. Grammar: Simple Present of the verbs to enjoy and to watch in the affirmative and interrogative forms (1st and 2nd person singular and plural). Gerund after enjoy, like, and love. Gerund after What about?",
      "13": "Learning Objective: Can understand and use language related to basic actions (e.g., climb, show, walk). Can ask and answer simple questions about familiar topics if delivered slowly and clearly. Can thank people for doing something. Can ask for permission and respond to it in a simple manner. Can make and respond to requests using simple language. Grammar: Simple Present of the verbs to show, to climb, and to walk in the affirmative, negative, and interrogative forms (1st and 2nd person singular and plural). Gerund after preposition for (Thanks for helping me). Modal verb can to talk about permission and make requests. Prepositions for (for one hour), on (on the trail, on the path), up (go up), and down (go down)",
      "15": "Learning Objective: Can understand simple phrases related to familiar topics if spoken slowly and clearly and supported by pictures. Can ask about and say what they can or can’t do at the beach. Can talk about how well they can do things. Can say things they are (not) afraid of and (not) good at. Can talk about the weather using simple language. Grammar: Modal verb can to express ability in the affirmative, negative, and interrogative forms. Verb phrases be good at and be afraid of + nouns.",
      "17": "Learning Objective: Can ask for and provide reasons for doing or not doing something. Can ask to borrow something and grant or deny permission. Can ask how others perform an action. Can describe levels of difficulty in a simple manner. Can name a few parts of the body. Grammar: Modal verb can to make requests. Modal verb can to express ability in the affirmative, negative, and interrogative forms. Question word why to ask about reasons. Conjunction because to give reasons. Adverb too to indicate an excessive degree of something.",
      "19": "Learning Objective: Can ask and answer questions about collections using simple language. Can ask and answer simple questions about numbers of objects using a basic phrase. Can say how they organize their collections and where they display them. Can express preferences. Grammar: Simple Present of the verbs to collect, to organize, and to display in the affirmative, negative, and interrogative forms. How many to ask about quantity. Prepositions in (in a binder) and on (on a shelf). Irregular plural forms.",
      "21": "Learning Objective: Can understand simple phrases related to familiar topics if spoken slowly and clearly and supported by pictures. Can name some shapes and colors. Can name materials and supplies used to do arts and crafts. Can give instructions on how to do something. Grammar: Imperative in the affirmative and negative forms.",
      "23": "Learning Objective: Can talk about what to do to put on a theater play. Can say the order in which things happen. Can use vocabulary related to theater plays, artists, and roles. Grammar: Simple Present of the verbs to think, to write, and to perform in the affirmative and negative forms. Sequence words first, next, then, after that, and finally.",
      "25": "Learning Objective: Can name some appliances and rooms in a house. Can describe some chores done at home. Can understand basic information about someone’s house. Can talk about other people’s daily activities. Grammar: Simple Present in the affirmative form (3rd person singular). Possessive adjectives his and her.",
      "27": "Learning Objective: Can say what someone else does or doesn’t do. Can talk about taking care of plants. Can name a few pieces of furniture and give an opinion about them. Can talk about what they do to rest. Grammar: Simple Present in the negative form (3rd person singular).",
      "29": "Learning Objective: Can say what they have in their bedrooms and living rooms. Can name a few pieces of furniture and other objects. Can ask and answer questions about what someone else has or does. Can welcome people to their homes using fixed expressions. Grammar: Simple Present in the interrogative form (3rd person singular). Yes/No questions and short answers. Indefinite articles a and an.",
      "31": "Learning Objective: Can give spoken descriptions of how to carry out a procedure. Can say what they and other people are doing at the moment of speaking. Grammar: Present Continuous in the affirmative form. Adverbs really and carefully. Definite article the.",
      "33": "Learning Objective: Can name a few foods. Can say what they and other people are not doing at the moment of speaking. Can talk about ways to cook and prepare food. Grammar: Present Continuous in the negative form. Irregular plural of nouns.",
      "35": "Learning Objective: Can ask and answer what someone is doing at the moment of speaking. Can talk about how some foods and drinks taste. Grammar: Present Continuous in the interrogative form. Yes/No questions and short answers in the Present Continuous.",
      "37": "Learning Objective: Can talk about prices in a store. Can indicate the presence or absence of something. Can name a few items of clothing. Can ask for and give an opinion using basic phrases. Can describe the size of clothes using simple language. Grammar: There + to be in the affirmative and negative forms to indicate the presence or absence of something. Adverb too to indicate an excessive degree of something.",
      "39": "Learning Objective: Can ask and answer how much something costs using simple language. Can say a range of basic numbers, quantities, and prices. Can ask and answer how much they spend on specific items. Can talk about payment methods. Grammar: Simple Present in the interrogative form. Question words how and how much.",
      "41": "Learning Objective: Can talk about saving and spending money. Can ask questions about the presence or existence of something. Grammar: There + to be in the interrogative form to ask about the presence or existence of something. Indefinite pronouns some and any.",
      "43": "Learning Objective: Can talk about pets, wild animals, and natural elements. Can ask about and indicate possession. Grammar: Genitive case. Question word whose. Possessive adjectives his and her.",
      "45": "Learning Objective: Can talk about caring for pets. Can name some animal body parts. Can ask and describe what some animals are like and what they look like. Grammar: Simple Present tense for descriptions. Possessive adjectives our and their.",
      "47": "Learning Objective: Can identify and describe service dogs and their abilities. Can express how animals help people. Can say a few commands to pets. Grammar: Adverb even. Quantifier lots of.",
      "49": "Learning Objective: Can ask for and give suggestions. Can talk about different kinds of parties. Can talk about types of music and food needed for a party using simple language. Grammar: Modal verb should for suggestions.",
      "51": "Learning Objective: Can make and respond to polite requests using simple language. Can share the tasks when preparing a party. Grammar: Modal verb can to make requests.",
      "53": "Learning Objective: Can talk about special moments and party items. Can describe emotions. Can say goodbye. Grammar: Demonstrative pronouns this, these, that, and those.",
      "55": "Learning Objective: Can talk about travel arrangements. Can describe travel situations. Grammar: Review of Simple Present + Wh- questions. Review of Present Continuous.",
      "57": "Learning Objective: Can discuss travel plans. Can recognize and talk about landmarks and tourist attractions. Can name a few countries and capitals. Grammar: Review of Simple Present. Review of Present Continuous. Review of can and should for suggestions",
      "59": "Learning Objective: Can express opinions about cultural experiences and landmarks. Can talk about a trip and describe memorable moments. Grammar: Review of Simple Present. Review of Present Continuous. Review of There + to be. Review of should for suggestions."},


   "NW4": {
      "61": "• Can name some furniture. • Can describe some rooms in the house. • Can give some directions. • Can ask questions using there to be in the interrogative form. • Can use there to be in the negative form.",
      "63": "• Can describe where they live. • Can say things they have. • Can review the use of indefinite somebody and anybody. • Can use indefinite pronouns like nobody and everybody.",
      "65": "• Can talk about things they can lose. • Can talk about things they need to find. • Can use object pronouns. • Can review prepositions of place and use the preposition behind.",
      "67": "• Can describe how they feel about something. • Can name the seasons of the year. • Can use expressions of time in the past. • Can use verb to be in the past in the affirmative and negative forms.",
      "69": "• Can describe the weather. • Can describe people or things. • Can use verb to be in the Past tense in the interrogative form.",
      "71": "• Can talk about their marital status. • Can describe people or things. • Can use verb to be in the past with Wh- questions.",
      "73": "• Can describe the TV shows by mentioning scenes, episodes, and seasons. • Can use whose to ask who something belongs to. • Can use genitive case with singular nouns. • Can form questions with whose and use genitive case.",
      "75": "• Can talk about different kinds of music and movie genres. • Can talk about things they were doing at a certain moment in the past. • Can use past continuous in the affirmative and negative forms.",
      "77": "• Can talk about Internet and its main features. • Can talk about social media content. • Can use past continuous in the interrogative form.",
      "79": "• Can say what they eat and drink. • Can name some food services. • Can use simple past affirmative form of regular and irregular verbs.",
      "81": "• Can name some places in the city. • Can talk about some leisure activities. • Can use simple past affirmative form of regular and irregular verbs. • Can use there to be in the past tense.",
      "83": "• Can talk about traveling. • Can talk about where to stay when traveling. • Can handle situations at the airport. • Can use simple past affirmative form of regular and irregular verbs. • Can understand the difference between the simple past and the past continuous.",
      "85": "• Can talk about professional experiences. • Can talk about job opportunities and career choices. • Can use vocabulary related to a job routine. • Can say what somebody does for a living. • Can use simple past in the negative form.",
      "87": "• Can talk about academic past and present experiences. • Can talk about courses and school subjects. • Can use interrogative form of simple past.",
      "89": "• Can talk about past and current relationships. • Can share their relationship status in a simple discussion on the topic. • Can say to someone what was said by someone else. • Can review simple past in the affirmative, negative, and interrogative forms. • Can use indefinite pronouns: somewhere, anywhere, nowhere. • Can use reported speech.",
      "91": "• Can identify key details of academic matters. • Can write basic descriptions about abilities on academic activities. • Can identify information about language skills. • Can express ability or lack of ability using can or can’t. • Can ask for and give permission using can. • Can make suggestions using can. • Can make requests using can.",
      "93": "• Can talk about some outdoor activities. • Can mention some places we can go for outdoor activities. • Can talk about memories and activities from the past. • Can use modal could in the affirmative, negative, and interrogative forms.",
      "95": "• Can ask and give advice about diet and physical activities. • Can understand instructions and advice concerning health and diet plans. • Can use would in the affirmative, negative, and interrogative forms, for wish, requests, and offers.",
      "97": "• Can ask and give information about physical appearance. • Can ask questions using how (how long, how tall, how big, etc). • Can use question words like how big, how tall, and how long.",
      "99": "• Can ask and give information about physical appearance. • Can ask how tall, how long, and how big something is. • Can say what people are like. • Can make comparisons of equality and superiority. • Can use comparative of equality. • Can use comparative of superiority with long adjectives.",
      "101": "• Can compare things, places, and people. • Can use comparative of superiority using short adjectives.",
      "103": "• Can deal with some situations related to payment. • Can say how they feel in certain situations, especially when waiting for something. • Can understand simple questions related to ordering and paying for food. • Can use superlative of long adjectives.",
      "105": "• Can show their feelings toward something in the present or in the past using the verbs hate and love. • Can say they preferred something in a past situation. • Can describe people or things by using one-syllable adjectives. • Can use superlative of one-syllable adjectives.",
      "107": "• Can talk about lending things to people. • Can talk about borrowing things from people. • Can talk about some school and office materials. • Can review the degree of adjectives.",
      "109": "• Can use language related to telephone features. • Can use language related to telephone conversations. • Can use simple future in the affirmative form.",
      "111": "• Can talk about sending different kinds of messages. • Can use simple future in the interrogative and negative forms.",
      "113": "• Can express results or consequences. • Can make requests and offers. • Can make a decision at the moment of speaking. • Can use conjunction so. • Can use simple future.",
      "115": "• Can talk about some academic topics. • Can talk about future plans and intentions. • Can use future with going to in the affirmative form.",
      "117": "• Can talk about some events people can attend. • Can talk about coming situations. • Can use future with going to in the negative and interrogative forms.",
      "119": "• Can talk about buying and selling things. • Can use vocabulary related to shopping. • Can express ideas using past, present, and future tenses. • Can use future with will and future with going to."},

  "NW6": {
      "121": "• Can speculate about the future. • Can talk about plans and situations for the future. • Can talk about different kinds of trips. • Can review future tenses; • Can review may, would, can, could, should + infinitive.",
      "123": "• Can talk about past experiences using Simple Past and Present Perfect. • Can review Present Perfect for past experiences.",
      "125": "• Can understand content related to interviews. • Can use adjectives with the correct negative prefix. • Can ask questions using the Present Perfect with ever. • Can review adjectives negative prefixes; • Can review Present Perfect with ever.",
      "127": "• Can construct sentences with wh-question words followed by verbs in the infinitive. • Can give someone clear and detailed directions. • Can follow detailed directions. • Can review wh- question words followed by verbs in the infinitive; • Can review requests with will.",
      "129": "• Can express obligation. • Can use language related to airport environment. • Can express the absence of obligation in the present. • Can review each other and reflexive pronouns; • Can review have to for obligations; • Can review needn’t and don’t/doesn’t have to for absence of obligation.",
      "131": "• Can follow detailed instructions. • Can talk about obligations and prohibition. • Can understand some rules and regulations. • Can review must for obligation and necessity in the present and near future; • Can review must not for prohibition in the present and near future.",
      "133": "• Can describe plans and arrangements. • Can express purpose and intention. • Can talk about permission. • Can understand language related to going through customs or airport immigration. • Can review in order to to express purpose and intention. • Can review permission using allowed or permitted to.",
      "135": "• Can talk about things that are done by others. • Can use language related to a hotel or hotels facilities. • Can understand a conversation related to a trip. • Can review causative verbs get and/or have to refer to having things done by other people.",
      "137": "• Can explain a problem and demand a resolution. • Can talk about past possibilities using may and might. • Can review modals may and/or might (not) have + Past Participle for past possibilities; • Can review Past Passive.",
      "139": "• Can express preferences about foods and drinks. • Can review would rather (than) to express preference; • Can review prefer with to.",
      "141": "• Can identify and understand content related to financial planning for traveling. • Can identify and understand some financial topics. • Can review express sufficiency and insufficiency with enough and too; • Can review common quantifiers such as a lot and much as adverbs, and high as adjective.",
      "143": "• Can talk about unpleasant symptoms. • Can ask for simple medical information. • Can give advice using If I were you ... • Can review Second Conditional for advice.",
      "145": "• Can ask people if something has been done using yet. • Can talk about things that remain the same using still. • Can express agreement and disagreement. • Can use language related to business. • Can review Present Perfect with still and yet; • Can review ... hope so or not for agreement or disagreement.",
      "147": "• Can say that something is going to happen on the condition that something else happens. • Can talk about results and consequences. • Can review First Conditional; • Can review so + (adjective/quantifier) + that for result and consequences.",
      "149": "• Can give a short presentation on a familiar topic. • Can say that something has just/already been done. • Can review Present Perfect Passive using just and already.",
      "151": "• Can talk about the duration of an action. • Can use words that specify a period of time. • Can review Present Perfect tense with since and for; • Can review prepositions of time.",
      "153": "• Can confirm some information by using tag questions. • Can talk about permission. • Can review question tags with different time tenses.",
      "155": "• Can make suggestions. • Can refer to future eventualities. • Can review function in case for future eventualities; • Can review How/What about with verbs in the gerund for suggestions.",
      "157": "• Can understand words (or terminology) related to cooking. • Can talk about possible future conditions. • Can say when something is a result of something else. • Can review First Conditional; • Can review Zero Conditional.",
      "159": "• Can talk about situations that just happened. • Can talk about weather forecast. • Can review Present Perfect with just.",
      "161": "• Can emphasize adjectives by using such. • Can talk about impossible or imaginary situations. • Can review Second Conditional; • Can review First Conditional; • Can review such (a/an) as a determiner and predeterminer.",
      "163": "• Can talk about ways of living. • Can review adverbials composed of wh- words + ever; • Can review hyphenated compound adjectives.",
      "165": "• Can talk about plans and intentions. • Can describe things, places, and situations using a variety of words. • Can review to plan and to intent + infinitive; • Can review suffixes to make adjectives from nouns and verbs.",
      "167": "• Can understand and use language related to politics. • Can say that something is done by someone. • Can review Present Simple Passive; • Can review Present Perfect Passive.",
      "169": "• Can talk about two situations in the past, one before another. • Can report orders and requests. • Can understand different kinds of crime. • Can review Past Perfect; • Can review reporting past orders and requests using the verbs tell and ask.",
      "171": "• Can report past questions. • Can link sentences with a range of connectors. • Can understand language used when agreeing or disagreeing with someone. • Can review conjuctions; • Can review reported speech of wh- words.",
      "173": "• Can use neither ... nor to link two negative ideas. • Can use either to agree with a negative statement. • Can use language about cybercrime prevention. • Can review neither ... nor; • Can review (not) either.",
      "175": "• Can ask negative questions to confirm information. • Can start a sentence using an action word. • Can review negative questions; • Can review gerund as a subject of a sentence.",
      "177": "• Can use who, that, or which to refer to something or somebody. • Can use adjectives and/or adverbs that intensify something. • Can review adverbial intensifiers with adjectives; • Can review relative pronouns who, that, and which.",
      "179": "• Can distinguish between something in the past or that started in the past and continues in the present. • Can talk about special moments in their lives. • Can review Present Perfect vs. Present Perfect Continuous; • Can review Present Perfect with been and gone."},

  "NW8": {
      "181": "• Can talk about different kinds of news sources. • Can report questions. • Can review reported questions making tense changes – present to past tenses; • Can review reported questions using if and whether.",
      "183": "• Can report recommendations or suggestions. • Can talk about problems related to the news. • Can review reported speech making tense changes – present to past tenses; • Can review reported speech with modals should and would; • Can review reporting verbs followed by that.",
      "185": "• Can give or seek personal views and opinions when discussing sources of information. • Can report past situations. • Can review reporting questions and direct sentences with will using the modal would; • Can review relative clauses with infinitive verb phrases.",
      "187": "• Can discuss topics related to being an active citizen. • Can talk about duties and obligations. • Can talk about conditions and consequences. • Can review Zero and First conditionals; • Can review unless, as long as, as soon as, and in case for conditional clauses.",
      "189": "• Can say what can be done to help people. • Can say what can be done to improve the conditions of the places where they live. • Can talk about conditions and consequences. • Can review Second conditional; • Can review lack of and to be needed.",
      "191": "• Can discuss options and possible actions. • Can understand and discuss information related to humanitarian matters. • Can review conditional sentences with modal verbs: may, might, had better, could, and should.",
      "193": "• Can talk about sustainability and ecological awareness. • Can talk about things based on the action instead of the agent in the present and in the past. • Can review passive voice in the Simple Present and Simple Past tenses; • Can review Passive voice with the modals can and could.",
      "195": "• Can talk about things in the future based on the action instead of the agent. • Can give opinions on how to be more committed to the future of the planet. • Can discuss the 3Rs (Reduce, Reuse, and Recycle). • Can review Passive Simple Future with modal verb will; • Can review Passive voice with the modals may and might.",
      "197": "• Can discuss some causes of climate change. • Can say what can be done to change the reality of the planet. • Can review Passive voice in the Simple Present, Simple Past, and Simple Future tenses; • Can review active vs. passive sentences.",
      "199": "• Can discuss technology and its impact on daily routine. • Can understand, talk about, and describe situations that occur in the future. • Can review Simple Future (will), Future going to, and Present Continuous as Future; • Can review Future Continuous; • Can review shall be –ing vs. will; • Can review stative verbs vs. Future Continuous.",
      "201": "• Can talk about completed actions in the future. • Can discuss technological innovations. • Can review Future Perfect tense.",
      "203": "• Can understand and express degrees of certainty about future situations. • Can discuss the influence of technology in one’s life. • Can relate entertainment to technology. • Can review mixed Future tenses and various degrees of likelihood; • Can review Future tenses to show hope, certainty, expectation, fear, offer, promises, and refusals.",
      "205": "• Can talk about how they balance their professional and personal lives. • Can discuss sedentary vs. active lifestyles. • Can analyze and use proper structures to describe situations in the past. • Can describe repeated situations or actions that no longer happen. • Can review past tenses: Simple Past, Present Perfect, and Past Perfect; • Can review used to to describe regular past actions; • Can review Past Continuous tense with when and while.",
      "207": "• Can talk about sports achievements and life goals. • Can describe hypothetical past results of a past action. • Can review Third conditional; • Can review What if for hypothetical questions; • Can review Third conditional with modals could and might.",
      "209": "• Can talk about extreme sports. • Can express wishes and regrets. • Can review wish + Past Perfect tense; • Can review if only + Past Perfect tense; • Can review What if for hypothetical questions; • Can review wish + could + have + past participle.",
      "211": "• Can talk about art in general. • Can discuss issues related to professions in general. • Can understand and use various phrasal verbs to describe everyday situations. • Can review non-separable phrasal verbs.",
      "213": "• Can classify and discuss art and social manifestations. • Can understand and use various phrasal verbs to describe everyday situations. • Can use conjunctions to connect ideas. • Can review separable phrasal verbs; • Can review conjunctions however, though, and although to express concession.",
      "215": "• Can talk about new concepts for cities. • Can discuss public art displayed in cities. • Can understand and use various phrasal-prepositional verbs to describe everyday situations. • Can compare and contrast actions and situations. • Can review phrasal-prepositional verbs; • Can review compare and contrast actions and situations with while and whereas.",
      "217": "• Can talk about nurturing body and mind. • Can talk about different kinds of diets. • Can use modals to add or change the meaning of verbs in situations related to health habits. • Can review modal verbs and modal verbs in the passive voice.",
      "219": "• Can analyze and discuss different alternative treatments for diseases. • Can talk about alternatives for the health of body and mind. • Can describe hypothetical situations. • Can review modal verbs in Present Perfect tense.",
      "221": "• Can describe a fitness lifestyle. • Can use language to express causation and consequence. • Can describe goals and achievements related to exercising. • Can review due to and owing to to express causation and consequence.",
      "223": "• Can talk about what’s on streaming. • Can discuss movies. • Can use sense verbs to describe things, reactions, and situations. • Can review structure it + seems / appears / looks like (that); • Can review sense verbs.",
      "225": "• Can give and understand a personal interpretation of movies, series, or plays. • Can express how they feel when watching a movie or series. • Can reproduce rumors. • Can give stress and emphasis on information they deliver. • Can review auxiliary verbs do, does, and did for stress or emphasis; • Can review to hear that + complement clause to talk about rumors.",
      "227": "• Can discuss movies, books, or plays. • Can say sentences giving emphasis on new information. • Can use passive reporting structures to report information in a formal way. • Can review cleft sentences; • Can review structure it’s + thought / believed / considered + that + complement.",
      "229": "• Can discuss food relationships with people. • Can interpret how food affects interactions among people. • Can make requests in a polite and soft way. • Can use verbs to give cooking instructions. • Can review verbs think, believe, wonder, and modal verbs could and would to make requests; • Can review will + infinitive for orders and instructions; • Can review Imperative.",
      "231": "• Can discuss eating habits. • Can describe actions that happened after something else. • Can mention actions that started in the past and continued up until another past time. • Can use idioms for various situations. • Can review Past Perfect Continuous; • Can review as soon as with Simple Past and Past Perfect tense.",
      "233": "• Can discuss topics related to food processing. • Can explain the cons of certain food intake. • Can express negative purpose using fixed expressions. • Can use a few fixed expressions to describe everyday situations. • Can review negative purpose with so as not to and in order not to.",
      "235": "• Can describe and compare different lifestyles. • Can explain how some situations affect someone’s mental and physical health. • Can give people suggestions and recommendations. • Can report speech related to actions that happened and finished in the past. • Can review verbs of advice and recommendation with noun phrases and verbs in the infinitive; • Can review reported speech: from Simple Past to Past Perfect.",
      "237": "• Can name a few parenting styles and challenges of modern parenting. • Can make comparisons between two actions or two things. • Can use chunks of language to make conditional clauses. • Can identify and discuss the benefits of education styles. • Can report speech related to actions that happened in the past which have consequences in the present. • Can review complex comparisons between verb or noun phrases; • Can review reported speech: from Present Perfect to Past Perfect.",
      "239": "• Can discuss issues related to lifestyle and different types of relationships. • Can use expressions to describe the state of a relationship. • Can report actions that will have finished sometime in the future. • Can review reported speech for Future Perfect."},

  
  "NW10": {
      "241": "• Can work collaboratively with people who have different cultural orientations, discussing similarities and differences in views and perspectives. • Can understand the main ideas of complex technical discussions in their field. • Can understand similarities and differences between points of view in extended texts. • Can distinguish between fact and opinion in informal discussion at natural speed. • Can add non-essential information to a sentence. • Non-restrictive relative clauses.",
      "243": "• Can work collaboratively with people who have different cultural orientations, discussing similarities and differences in views and perspectives. • Can synthesize information from different sources in order to give a written or oral summary. • Can follow a wide range of factual and creative texts and summarize themes and opinions. • Can produce sentences using defining relative clauses and omitting the relative pronoun. • Omission of relative pronouns in defining (restrictive) relative clauses.",
      "245": "• Can talk about what can affect a culture. • Can talk about glocalization and globalization. • Can summarize a wide range of texts, discussing contrasting points and main themes. • Can systematically develop an argument, giving the reasons for or against a point of view. • Can use restrictive and non-restrictive relative clauses. • Restrictive and non-restrictive relative clauses.",
      "247": "• Can build on people’s ideas and link them into coherent lines of thinking. • Can write about feelings and the personal significance of experiences in detail. • Can identify key information in linguistically complex conversation at a natural speed. • Can recognize contrasting arguments in a structured, discursive text. • Can give arguments emphasizing that something is always true, no matter the conditions. • Use of no matter + Relative Pronoun.",
      "249": "• Can defend arguments on polemic issues. • Can rationalize their actions. • Can recognize a feeling from a tone of voice. • Can discuss trends in a particular country. • Can explain the purpose of something. • So as to with infinitive clauses.",
      "251": "• Can build on people’s ideas and link them into coherent lines of thinking. • Can defend arguments on polemic issues. • Can rationalize their actions. • Can talk about trends in a particular country. • Can scan a text for key information. • Can develop arguments on a given topic. • Can recognize the difference between culture and subculture. • Adverbial phrases in comments.",
      "253": "• Can give a reasoned opinion of a project, showing awareness of the thematic and structural features and referring to the opinions and arguments of others. • Can write an accurate summary of an essay or article on a familiar topic. • Can extract the main points from news items, etc. with opinions and arguments. • Can recognize the tone and intended audience of a structured text. • Can formulate questions and feedback to encourage people to expand on their thinking and justify or clarify their opinions. • Use of It’s time + Simple Past and would rather + Simple Past.",
      "255": "• Can give a reasoned opinion of a project, showing awareness of the thematic, structural, and formal features and referring to the opinions and arguments of others. • Can highlight the main issue that needs to be resolved in a complex task and the important aspects that need to be taken into account. • Can give a structured written explanation of a problem. • Can summarize, comment on, and discuss a wide range of factual and imaginative texts. • Can formulate questions and feedback to encourage people to expand on their thinking and justify or clarify their opinions. • Comparison between clauses.",
      "257": "• Can adjust to the changes of direction, style, and emphasis normally found in conversation. • Can write a detailed, reasoned argument for or against a case. • Can understand summaries of data or research used to support an extended argument. • Can identify key information in a linguistically complex text. • Can formulate questions and feedback to encourage people to expand on their thinking and justify or clarify their opinions. • Not only ... but also ... to add information.",
      "259": "• Can ask people to explain how an idea fits with the main topic under discussion. • Can structure longer texts in clear, logical paragraphs. • Can understand cause and effect relationships in informal conversations at natural speed. • Can understand the positive and negative connotations of words that have similar meanings. • As if and as though + Simple Present.",
      "261": "• Can compare the advantages and disadvantages of possible approaches and solutions to an issue or a problem. • Can express the same idea with a different level of formality appropriate to the audience. • Can recognize repetition of ideas through substitution, paraphrasing, etc. in complex arguments. • Can synthesize information from different sources in order to give a written or oral summary. • As if and as though + Simple Past.",
      "263": "• Can talk in detail about choices that have been significant or life-changing using linguistically complex language. • Can make the content of a text on a subject in his/her field of interest more accessible to a target audience by adding examples, reasoning and explanatory comments. • Can follow extended speech expressing unstructured ideas and thoughts. • Can identify specific information in a linguistically complex factual text. • As if and as though + Past Perfect.",
      "265": "• Can speculate about a future event using a range of linguistic devices. • Can take accurate notes in meetings and seminars on most matters likely to arise within his/her field of interest. • Can understand the speaker’s point of view on most topics delivered at natural speed and in standard language. • Can summarize, comment on, and discuss factual and imaginative texts. • Question with to be + it and complement clauses.",
      "267": "• Can convey information and ideas on abstract and concrete topics. • Can paraphrase an idea using a range of linguistic devices. • Can understand inferred meaning in formal structured text. • Can emphasize an idea by introducing a sentence with a relative clause. • Cleft sentences in the present, past, and future.",
      "269": "• Can get the gist of specialized articles and technical texts outside their field. • Can use inversion for emphasis, dramatic purposes, or formality. • Can distinguish between a fact and an opinion. • Inversion of subject and verb after initial complex adverbials.",
      "271": "• Can summarize the statements made by two sides, highlighting areas of agreement and obstacles to agreement. • Can make accessible for others the main contents of a text on a subject of interest (e.g. an essay, a forum discussion, a presentation) by paraphrasing in simpler language. • Can understand the speaker’s point of view on most topics delivered at natural speed and in standard language. • Can recognize the repetition of ideas expressed by substitution, paraphrasing, etc. • Third Conditional: If + Past Perfect + would have + past participle; • Mixed Conditional: If + Past Perfect + would + infinitive.",
      "273": "• Can talk about hypothetical events and actions and their possible consequences. • Can understand the speaker’s point of view on most topics delivered at natural speed and in standard language. • Can find solutions to a problem or dilemma. • Should in hypothetical statements about the present and near future with inversion and omission of if.",
      "275": "• Can get the gist of specialized articles and technical texts outside their field. • Can understand summaries of data or research used to support an extended argument. • Can write a detailed, reasoned argument for or against a case. • Can express emphasis, dramatic purpose, or formality in a speech. • Only if with inversion of subject and object for hypothetical present and future situations.",
      "277": "• Can express opinions about news stories using a wide range of everyday language. • Can synthesize and evaluate familiar information and arguments from a number of sources. • Can recognize the tone and intended audience of a formal presentation. • Can summarize, comment on, and discuss a wide range of factual and imaginative texts. • It’s / was + believed / reported that ... to report beliefs, information, and rumors.",
      "279": "• Can give a reasoned opinion of a project, showing awareness of the thematic, structural, and formal features and referring to the opinions and arguments of others. • Can highlight the main issue that needs to be resolved in a complex task and the important aspects that need to be taken into account. • Can understand most of a TV program aimed at a general audience. • Can summarize, comment on, and discuss a wide range of factual and imaginative texts. • Beliefs and opinions with is / are / was / were + thought / believed to ...",
      "281": "• Can adjust to the changes of direction, style, and emphasis normally found in conversation. • Can write a detailed, reasoned argument for or against a case. • Can understand summaries of data or research used to support an extended argument. • Can identify key information in a linguistically complex text. • Can formulate questions and feedback to encourage people to expand on their thinking and justify or clarify their opinions. • Thought / believed to ... to express impersonal belief.",
      "283": "• Can introduce new information during a formal discussion or presentation. • Can express news and views effectively in writing and relate to those of others. • Can understand cause and effect relationships in informal conversation at natural speed. • Reduced adverbial clauses with present participle or having + past participle.",
      "285": "• Can present factual information in an objective way in extended spoken discourse. • Can make a specific, complex piece of information in his/her field clearer and more explicit for others by paraphrasing it in simpler language. • Can understand when something is being said ironically in a casual conversation. • Can talk about imminent events in the present and past. • On the point of... to talk about imminent events in the present or past.",
      "287": "LEARNING OBJECTIVES: • Can make a complicated issue easier to understand by presenting the components of the argument separately. • Can put forward a well-written and logically structured argument, highlighting significant points. • Can get the gist of specialized articles and technical texts outside their field. • Can quickly scan long, complex texts for key information. GRAMMAR: • One and one’s as an impersonal possessive adjective.",
      "289": "LEARNING OBJECTIVES: • Can encourage members of a group to describe and elaborate on their thinking. • Can identify related or repeated information in different parts of a text and merge it in order to make the essential message clearer. • Can understand the purposes for some actions. • Can quickly scan long, complex texts for key information. • Can express purpose and intention. GRAMMAR: • Purpose of, purpose to, and purpose for.",
      "291": "LEARNING OBJECTIVES: • Can give a reasoned opinion of a project, showing awareness of the thematic, structural, and formal features and referring to the opinions and arguments of others. • Can understand summaries of data or research used to support an extended argument. • Can give a structured oral explanation of a problem. • Can formulate questions and feedback to encourage people to expand on their thinking and justify or clarify their opinions. • Can write relevant subheadings to structure longer, more complex texts. • Can identify key information in linguistically complex conversations at natural speed. GRAMMAR: • Appended clauses with present participles and/or passive participles.",
      "293": "LEARNING OBJECTIVES: • Can adjust to the changes of direction, style, and emphasis normally found in conversation. • Can get the gist of specialized articles and technical texts outside their field. • Can identify key information in a linguistically complex text. • Can formulate questions and feedback to encourage people to expand on their thinking and justify or clarify their opinions. GRAMMAR: • Since to talk about reasons, causes, and explanations.",
      "295": "LEARNING OBJECTIVES: • Can formulate questions and feedback to encourage people to expand on their thinking and justify or clarify their opinions. • Can present the conditions needed for an action to take place. • Can understand the main points of complex and abstract presentations. • Can understand advice given in a linguistically complex text. GRAMMAR: • Conditional phrases with omission of verb to be; • Wishes and intentions using shall.",
      "297": "LEARNING OBJECTIVES: • Can ask detailed questions in discussions on contemporary social issues and current affairs. • Can understand the main points of complex academic / professional presentations. • Can produce summaries of data or research used to support an extended argument. • Can formulate questions and feedback to encourage people to expand on their thinking and justify or clarify their opinions. • Can report actions to be completed by a specific time in the future. • Can identify key information in linguistically complex conversations at natural speed. GRAMMAR: • Future Perfect.",
      "299": "LEARNING OBJECTIVES: • Can exploit knowledge of sociocultural conventions in order to establish a consensus in an unfamiliar situation. • Can explain technical topics within his / her field, using suitably non-technical language for a recipient who does not have specialist knowledge. • Can refer to actions that will continue up to a certain point in the future. • Can identify key information in a linguistically complex text. GRAMMAR: • Future Perfect Passive." },


  "NW12": {
     "301": "• Can extract information, ideas, and opinions from highly specialized sources. • Can follow presentations on abstract and complex topics. • Can understand stories being told by a fluent speaker using colloquial language. • Can demonstrate sensitivity to different viewpoints, also demonstrating a detailed understanding of each party’s requirements for an agreement. • Can write a clear summary of a complex factual text, maintaining its original tone and message. GRAMMAR: • Modal verb would vs. used to.",
      "303": "• Can understand most of a linguistically complex podcast. • Can comment in detail on the content of a linguistically complex radio program or podcast in which people describe reactions or opinions. • Can outline their interpretation of a character in a work: their psychological/emotional state, the motives for their actions, and the consequences of these actions. • Can answer questions about abstract topics clearly and in detail. • Can write essays and reports synthesizing information from a number of sources. GRAMMAR: • To be likely/unlikely/bound to.",
      "305": "• Can infer meaning, opinion, attitude, etc. in fast-paced conversations between fluent speakers. • Can critically evaluate a writer’s choice of words to express nuances of meaning in an argumentative text. • Can show sensitivity to different perspectives within a group, acknowledging contributions and formulating any reservations, disagreements, or criticisms in such a way as to avoid or minimize any offense. • Can confidently argue a case in writing, specifying needs and objectives precisely and justifying them as necessary. GRAMMAR: • No article, an, a, the.",
      "307": "• Can understand the details of extended and linguistically complex talks on a range of political, environmental, and social issues. • Can explain technical terminology and difficult concepts when communicating with non-experts about matters within their field of specialization. • Can identify inferred meaning in a linguistically complex text. • Can paraphrase and interpret complex, technical texts, using suitably non-technical language for a recipient who does not have specialist knowledge. GRAMMAR: • Verb tense review: Simple Present, Present Continuous, Present Perfect, Present Perfect Continuous.",
      "309": "• Can follow complex arguments on topics that are not very familiar to them. • Can extract information, ideas, and opinions from highly specialized sources. • Can contribute to group discussions even when speech is fast and colloquial. • Can express themselves fluently in writing, adapting the level of formality to the context. GRAMMAR: • Verbs that take both gerunds and infinitives with a change in meaning.",
      "311": "• Can understand the details of long, complex texts in their field without needing to reread. • Can paraphrase and interpret complex, technical texts using suitably non-technical language. • Can describe in detail their personal interpretation of a work, outlining their reactions to certain features and explaining their significance. • Can summarize and comment on the content of a linguistically complex text. • Can write an accurate summary of a complex, discursive text. GRAMMAR: • Compound adjectives containing verbs.",
      "313": "• Can follow a fast-paced conversation between fluent speakers well enough to be able to contribute. • Can identify examples that support a particular interpretation of a linguistically complex text. • Can answer questions about abstract topics clearly and in detail. • Can substitute an equivalent term for familiar words and expressions. • Can confidently argue a case in writing, specifying needs and objectives precisely and justifying them as necessary. GRAMMAR: • But for to give reasons.",
      "315": "• Can understand the details in a linguistically complex audio recording. • Can critically evaluate a writer’s choice of words to express nuances of meaning in an argumentative text. • Can summarize and comment on the content of a linguistically complex text. • Can participate in linguistically complex discussions about attitudes and opinions. • Can take notes to summarize the key points made during a technical or linguistically complex discussion. GRAMMAR: • Language used for speculating.",
      "317": "• Can extract information, ideas, and opinions from highly specialized sources. • Can identify inferred meaning in a linguistically complex text. • Can identify examples that support a particular interpretation of a linguistically complex audio passage. • Can describe the details of problem-solution relationships using a range of linguistic devices. • Can answer questions about abstract topics clearly and in detail. • Can summarize in writing a long and complex text for a specific audience, respecting the style and register of the original. GRAMMAR: • Uses of the infinitive.",
      "319": "• Can follow video extracts employing a considerable degree of idiomatic usage. • Can understand colloquial language in unstructured texts that use complex structures. • Can participate in linguistically complex discussions about attitudes and opinions. • Can edit and add to a linguistically complex text to make it clearer or more concise. GRAMMAR: • Uses of the verb to wish.",
      "321": "• Can understand the details in a linguistically complex audio recording. • Can identify examples that support a particular interpretation of a linguistically complex text. • Can participate in discussions to help people establish a link to a given subject. • Can participate in linguistically complex discussions about a variety of subjects. • Can summarize in writing a long and complex text for a specific audience, respecting the style and register of the original. GRAMMAR: • Parallel comparisons: the... the...",
      "323": "• Can understand the double meaning of a word used in speech or text. • Can extract information, ideas, and opinions from highly specialized sources. • Can make complex, challenging content more accessible by explaining difficult aspects more explicitly and adding helpful detail. • Can summarize group discussions on a wide range of linguistically complex topics. • Can take notes to summarize the key points made during a technical or linguistically complex discussion. GRAMMAR: • Uses of the verb to get.",
      "325": "• Can follow presentations on abstract and complex topics. • Can critically evaluate a writer’s choice of words. • Can identify inferred meaning in a linguistically complex text. • Can answer questions about abstract topics clearly and in detail. • Can make the main points contained in a complex text more accessible to the target audience. GRAMMAR: • The future seen from the past.",
      "327": "• Can understand stories being told by a fluent speaker using colloquial language. • Can critically evaluate a writer’s choice of words. • Can substitute an equivalent term for a word they can’t recall. • Can participate in linguistically complex discussions about attitudes and opinions. • Can summarize and comment on the content of a linguistically complex text. • Can take notes to summarize the key points made during a technical or linguistically complex discussion. GRAMMAR: • Perfect Infinitive form.",
      "329": "• Can recognize a speaker’s feelings or attitude in linguistically complex speech. • Can identify inferred meaning in a linguistically complex text. • Can participate in a fast-paced conversation with fluent speakers. • Can comment on the content of a linguistically complex text. • Can describe and comment on ways in which the work engages the audience (e.g., by building up and subverting expectations). GRAMMAR: • Phrasal verbs that need a direct object.",
      "331": "• Can substitute an equivalent term for another word. • Can contribute to group discussions even when speech is fast and colloquial. • Can answer questions about abstract topics clearly and in detail. • Can summarize in writing a long and complex text. REITERATIVE LEARNING OBJECTIVES: • Can substitute an equivalent term for another word. • Can contribute to group discussions even when speech is fast and colloquial. • Can answer questions about abstract topics clearly and in detail. • Can summarize in writing a long and complex text. GRAMMAR: • Concession clauses.",
      "333": "• Can understand most of a linguistically complex podcast. • Can understand linguistically complex factual texts, appreciating distinctions of style. • Can summarize and comment on the content of a linguistically complex text. • Can explain technical terminology and difficult concepts. • Can make the main points contained in a complex text more accessible to the target audience by checking for redundancy, explaining, and modifying style and register. GRAMMAR: • Future Perfect Passive.",
      "335": "• Can understand complex arguments in newspaper articles. • Can understand the details in a linguistically complex audio recording. • Can describe the details of problem-solution relationships using a range of linguistic devices. • Can reformulate what they want to say during a conversation or discussion using linguistically complex language. • Can edit and add to a linguistically complex text to make it clearer or more concise. GRAMMAR: • Expressing hypothetical preferences.",
      "337": "• Can recognize a wide range of idiomatic expressions and colloquialisms, appreciating register shifts. • Can understand the details of extended and linguistically complex talks on social and historical issues. • Can understand complex arguments in articles. • Can smoothly switch between a range of writing styles to address specific audiences and topics. GRAMMAR: • Gerunds as nouns and after prepositions.",
      "339": "• Can understand the details in a linguistically complex audio recording. • Can infer meaning in a linguistically complex text. • Can answer questions about historical and abstract topics clearly and in detail. • Can substitute an equivalent term for another word or phrase without any difficulty. • Can identify examples that support a particular interpretation of a linguistically complex text. • Can make the main points contained in a complex text more accessible to the target audience by adding redundancy, explaining and modifying style, and registering. GRAMMAR: • It as an empty object.",
      "341": "• Can understand complex arguments in newspaper articles. • Can understand the details of extended and linguistically complex talks on a range of political, environmental, and social issues. • Can summarize and comment on the content of a linguistically complex text. • Can extract information, ideas, and opinions from highly specialized sources. GRAMMAR: • The passive voice for formality and emphasis.",
      "343": "• Can recognize a wide range of idiomatic expressions and colloquialisms. • Can critically evaluate a writer’s choice of words. • Can follow fast-paced discussions and debates. • Can follow most aspects of complex discussions about abstract and technical topics. GRAMMAR: • Nouns that describe feelings.",
      "345": "• Can follow highly complex conversations and discussions. • Can summarize complex texts clearly and coherently. • Can explain technical subjects clearly to a non-expert audience. • Can adapt their register according to the context and audience. GRAMMAR: • Future Continuous vs. Future Perfect.",
      "347": "• Can understand complex arguments in newspaper articles. • Can answer questions about abstract topics clearly and in detail. • Can participate in a discussion of controversial ideas using a range of linguistic devices. • Can describe and comment on ways in which the work engages the audience. GRAMMAR: • Past tenses review.",
      "349": "• Can critically evaluate a writer’s choice of words. • Can summarize group discussions on a wide range of linguistically complex topics. • Can infer meaning, opinion, attitude, etc. in fast-paced conversations between fluent speakers. • Can answer questions about abstract topics clearly and in detail. • Can edit a linguistically complex text to make it clearer or more concise. GRAMMAR: • Relative clauses with prepositions.",
      "351": "• Can understand the details in a linguistically complex audio recording. • Can make complex, challenging content more accessible by explaining difficult aspects more explicitly and adding helpful detail. • Can adapt their language in order to make a complex topic accessible to recipients who are not familiar with it. • Can talk about complex financial problems in detail. • Can summarize in writing a long and complex text, respecting the style and register of the original. GRAMMAR: • To be to + infinitive to describe official plans and arrangements; • To be due to + infinitive to describe a formal arrangement.",
      "353": "• Can understand complex arguments in newspaper articles. • Can recognize a speaker’s feelings or attitude in linguistically complex speech. • Can use persuasive language in a discussion where there are disagreements. • Can talk about complex financial problems in detail. • Can take notes to summarize the key points made during a technical or linguistically complex speech. GRAMMAR: • Uses of such.",
      "355": "• Can identify examples that support a particular interpretation of a linguistically complex text. • Can summarize and comment on the content of a linguistically complex text. • Can spontaneously pose a series of questions to encourage people to think about their prior knowledge of an abstract issue. • Can adapt their language in order to make a topic accessible to recipients who are not familiar with it. GRAMMAR: • Introducing opinions.",
      "357": "• Can understand the details of extended and linguistically complex audio recordings. • Can identify examples that support a particular interpretation of a linguistically complex text. • Can participate in discussions in order to try to reach a consensus. • Can frame a discussion to decide on a course of action with a partner or group, elaborating and weighing up multiple points of view. • Can make the main points contained in a complex text more accessible to the target audience by adding redundancy or explaining and modifying style and register. GRAMMAR: • Expressions to describe habits and tendencies.",
      "359": "• Can identify inferred meaning in a linguistically complex text. • Can answer questions about abstract topics clearly and in detail. • Can substitute an equivalent term for a word they can’t recall. • Can describe and present arguments related to a subject using a range of linguistic devices. • Can take notes to summarize the key points made during a technical or linguistically complex discussion. GRAMMAR: • Inversion after neither and nor."},
  
  "NG": {
      "1": "Can name a few languages. Can use simple greetings. Can understand very basic common classroom instructions. Can link groups of words in a sentence. Grammar: simple present 1st and 2nd person singular in the affirmative form; personal pronouns I and You; conjunction and; phrases at school and very well; possessive adjectives my and your.",
      "3": "Can name a few dishes and flavors. Can say where they do an activity in a simple manner. Grammar: simple present 1st and 2nd person singular in the negative form; phrases a piece of and a glass of; preposition at the.",
      "5": "Can name a few places. Can say where they go in a simple manner. Can express very basic contrast. Grammar: simple present 1st and 2nd person singular in the negative form; conjunction but; phrase in the morning; adverb every day; prepositions to and to the.",
      "7": "Can talk about other people’s activities in a simple manner. Can name a few relatives. Can express wishes or intentions in a very simple manner. Can express quantity in a very simple manner. Grammar: simple present 1st, 2nd, and 3rd person plural in the affirmative form; phrase in the afternoon; determiner some; demonstrative pronoun that.",
      "9": "Can name a few everyday objects. Can understand numbers from 0 to 20. Can explain wishes and intentions in a very simple manner. Can use simple adjectives. Grammar: simple present 1st, 2nd, and 3rd person plural in the negative form; phrase for my birthday; demonstrative pronoun this; articles a and an; adverb today; collocation to buy for.",
      "11": "Can say the days of the week. Can make questions and give short and complete answers. Can say at what part of the day they do an activity. Grammar: simple present 2nd person singular in the interrogative form; short answers; phrases in the evening and see you; question phrase What about you?.",
      "13": "Can talk about some sports and where they play them. Can make questions about other people and give short answers. Can say at what part of the day they do an activity. Can choose from simple options. Grammar: simple present 1st, 2nd, and 3rd person plural in the interrogative form; short answers; phrase at night; adverb again; conjunction or; phrase with me.",
      "15": "Can talk about likes and dislikes in a simple manner. Can make questions using What. Can name a few relatives, colors, and items. Grammar: interrogative form with question pronoun What; adverb tomorrow; phrases really like and (not) very much; definite article the; phrase to read something on.",
      "17": "Can name a few pieces of clothing and colors. Can say when they or other people do some activities. Grammar: interrogative form with question pronoun When; phrase this morning; phrases it's cold and see you tomorrow; phrasal verb to put on.",
      "19": "Can name a few places. Can describe things and places in a simple manner. Can ask and answer about where they and other people live. Grammar: interrogative form with question pronoun Where; adjectives big and small; adverb alone; prepositions near and far from; prepositions of place.",
      "21": "Can name a few professions. Can say how old they are and where they are from using fixed expressions. Can understand main information when people introduce themselves. Can count from 21 to 50. Can say where they and other people are. Grammar: verb to be with I, you, he, she, we, they in the affirmative form; personal pronouns he and she; collocations I’m from and I’m... years old.",
      "23": "Can understand the letters of the alphabet and spelling. Can introduce people using simple language. Can talk about things they know in a simple manner. Can ask for and provide simple personal information. Grammar: verb to be 3rd person singular in the affirmative form; personal pronoun it; determiners this and that; fixed phrase Who’s this?; expressions How do you spell? and What’s the meaning of?.",
      "25": "Can understand and tell the time. Can use time expressions. Can say when they or other people do some activities. Grammar: telling the time; preposition at + time; phrase o’clock; expressions to get up, to take a shower, and to have breakfast.",
      "27": "Can talk about entertainment and television in a simple manner. Can talk about how often they do an activity. Can talk about quantity in a simple manner. Grammar: question word How often; adverbs of frequency; fixed expression it’s better to; quantifier a lot of; adverb tonight.",
      "29": "Can name a few topics of conversation and relatives. Can invite or suggest what to do in a simple manner. Grammar: phrase Let’s + verb; phrase stay home; time expression this afternoon.",
      "31": "Can name a few foods and drinks. Can use adjectives to describe food. Can talk about their and other people’s preferences. Grammar: simple present 3rd person singular in the affirmative form; personal pronouns he, she, it; phrases a cup of and for lunch; collocation to prefer something to another.",
      "33": "Can name a few instruments. Can talk about musical tastes and artists in a simple manner. Can use phrases containing the days of the week. Can understand simple expressions about likes and dislikes. Can talk about their and other people’s preferences. Grammar: simple present 3rd person singular in the negative form; phrase I am a big fan of; phrase Saturday night; collocation to play the + instrument.",
      "35": "Can name a few places and activities related to vacations and leisure. Can name a few pets. Can talk about hobbies and interests using simple language. Can talk about their and other people’s preferences. Grammar: simple present 3rd person singular in the interrogative form; phrase to go fishing; expression It’s awesome!; collocation to go downtown.",
      "37": "Can use words related to traveling. Can name a few animals. Can describe vacations using simple language. Can name a few periods of the year. Grammar: simple present 3rd person in the affirmative, negative, and interrogative forms; question words What, When, Where, and How often; collocations to take a picture and to go on a trip; phrases this week, this month, and this year.",
      "39": "Can name a few souvenirs and school items. Can ask and answer about prices using simple language. Can talk about quantity in a simple manner. Grammar: question word How much; adverb only; determiner these; phrases It’s cheap and It’s expensive.",
      "41": "Can understand simple commands or instructions. Can identify some objects and foods. Grammar: imperative form in the affirmative and negative; demonstrative pronouns this, that, these, and those; collocation to go to bed; phrases a can of and for me.",
      "43": "Can make and answer simple inquiries, giving simple reasons. Can recognize basic plural forms of nouns. Can name a few pieces of clothing. Grammar: question word Why and answer with because; question What size do you wear?; phrase a pair of; collocation to sell to.",
      "45": "Can understand and ask for simple directions for how to get somewhere. Can name a few means of transportation. Grammar: imperative form in the affirmative and negative to give directions; prepositions of place in front of, across from, between, at, and on; adverb straight ahead; question How do I get to?; expression to take + means of transportation; preposition by + means of transportation; expression on foot.",
      "47": "Can express ability and lack of ability in a simple manner. Can talk about permission in a simple manner. Can name a few items and places in the house. Can talk about everyday activities in a simple manner. Grammar: modal verb can in the affirmative and negative forms; phrase it’s dirty; collocation all day long; adverb later; prepositions after and before + noun.",
      "49": "Can express ability and lack of ability in a simple manner. Can talk about permission in a simple manner. Can name a few dishes and foods. Can talk about everyday activities in a simple manner. Grammar: modal verb can in the affirmative, negative, and interrogative forms; phrases I’m hungry and I’m thirsty; phrase a slice of.",
      "51": "Can say the months of the year. Can ask for and give the day and date. Can talk about special dates and celebrations in a simple manner. Can say when they or other people do some activities. Grammar: date format using month + day; ordinal numbers up to 31st; question What day is it today?; phrase every week.",
      "53": "Can name a few pieces of technology. Can talk about other people’s possessions. Can refer to quantity in a simple manner. Can count from 51 to 100. Can talk about when they or other people do some activities. Grammar: possessive adjectives his and her; phrase every month; quantifiers lots and more; cardinal numbers up to 100.",
      "55": "Can use some collocations with the verb to make. Can ask and talk about quantity. Can name a few fruits. Grammar: collocations with to make; question word How many; phrases for dinner and for breakfast; quantifiers many, some, lots of, a lot of, and more.",
      "57": "Can use collocations with the verb to do. Can describe their routine in a simple manner. Can talk about abilities and lack of abilities. Can talk about permission in a simple manner. Can count up to 1000. Grammar: collocations with to do; quantifier a little; phrases I’m late for and I’m sorry; numbers from 101 to 1000.",
      "59": "Can talk about special events and celebrations. Can talk about when they or other people do some activities. Grammar: indefinite pronouns something and anything; adverb so; preposition during; phrases throw a party, ride a bike, and every year."
    },

    "NT2": {
      "1": "Can name some foods and drinks. Can say what they eat and drink for breakfast. Can use and to link nouns and noun phrases. Grammar: Simple Present tense in the affirmative form; subject pronouns I and you; conjunction and.",
      "3": "Can name some foods and drinks. Can say what they eat and drink for their meals. Can say what they love and hate eating and drinking. Can say simple sentences in the negative form. Can use but to link clauses and sentences. Grammar: Simple Present tense in the negative form; regular plural noun ending in -es; conjunction but.",
      "5": "Can ask someone’s name and tell others their names. Can say where they live, what they like, where others live, and what others like. Can ask and answer questions with what / where. Can use a and an with single countable nouns. Can answer questions using short answers. Grammar: Simple Present tense in the interrogative form; word order adjective + noun; indefinite articles a and an; question words what and where; preposition of place in; possessive adjectives my and your.",
      "7": "Can name a few languages and say the ones they and others speak. Can name a few school subjects. Can say what they and others like to study. Can recognize the letters of the alphabet and spell words. Can say what they do at different periods of the day. Grammar: Simple Present tense in the affirmative form; verbs followed by the infinitive form; subject pronouns we and they; prepositions with and at; definite article the.",
      "9": "Can name a few everyday items. Can say what they and others want to have or don't want to have and want to do or don’t want to do. Can tell others things they have or don't have. Can say what they have to do. Can name a few colors. Can invite others to do a certain activity with them. Grammar: Simple Present tense in the negative form; subject pronouns we and they; demonstrative pronouns this and that; have to to talk about obligations; word order; review preposition in; review of indefinite articles a and an.",
      "11": "Can state what they read and write. Can ask and answer what someone’s phone number is. Can mention things they do at different periods of the day. Can recognize and use ordinal numbers up to 20. Can ask questions related to them and others. Grammar: Simple Present tense in the interrogative form; subject pronouns we and they; word online as adjective and as adverb; review of word order; prepositions to, in, and on.",
      "13": "Can say what people and things are. Can name some members of a family. Can say where they and others are from. Can ask the meaning of words they don't know. Can name some occupations. Grammar: verb to be in the affirmative form; personal pronouns he and she; possessive adjectives his and her; preposition from; review of demonstrative pronouns this and that.",
      "15": "Can say what people and things are not. Can name some members of a family. Can describe someone's personality and physical appearance using a few adjectives. Can ask questions with How many and Who. Can use the verb to be in the contracted form. Grammar: verb to be in the negative form; contracted form of the verb to be; pronoun who.",
      "17": "Can ask questions about what things and people are. Can ask someone’s age and say how old they are. Can say the months of the year. Can say in which month their birthday is and ask someone about their birthday. Can use questions to interact at a party. Grammar: verb to be in the interrogative form; review of preposition in; preposition on; question word when.",
      "19": "Can name a few means of transportation. Can ask someone’s address and say theirs. Can name some places in the city. Can say how they and others get to places. Can ask how others get to places. Can say where they go at different periods of the day. Grammar: verb to go followed by the preposition to + article the; question word how.",
      "21": "Can tell the time in full and half hours. Can ask the time. Can say when something starts and finishes. Can say basic sentences about their and others’ routines. Grammar: Simple Present tense in the affirmative form 3rd person singular; subject pronoun it; prepositions at and by to talk about time.",
      "23": "Can name some parts of a house. Can describe their and others’ daily routines and chores in a simple way. Can say what activities other people do and don’t do. Can say the days of the week. Grammar: Simple Present tense in the negative form 3rd person; prepositions in and on; review word order.",
      "25": "Can name a few sports, musical instruments, and games. Can say what they and other people play. Can say what they are good or bad at. Can ask what others do. Can use the verb to have to talk about different daily activities. Grammar: Simple Present tense 3rd person in the interrogative form; preposition in + article the for places.",
      "27": "Can express ability and lack of ability. Can use a few personal pronouns as objects and complements. Can name some languages and objects. Can use language to say their likes and dislikes. Grammar: modal verb can in the affirmative and negative forms; preposition for; object pronouns him and her.",
      "29": "Can ask about one’s abilities. Can ask for permission. Can make a few basic requests related to immediate personal needs. Grammar: modal can in the interrogative form; prepositions to and in.",
      "31": "Can name some movie genres. Can state what they think about something using simple adjectives. Can ask someone’s opinion about something. Can use why to ask the reasons for something. Can use because to provide explanations. Can ask others what their favorite kind of movie is and say theirs. Grammar: question word why; conjunction because at the beginning and in the middle of clauses; regular plural noun ending in -ies; review preposition in.",
      "33": "Can name some musical genres. Can say what they and others like to talk about and listen to. Can give opinions about kinds of music using simple adjectives. Can use some fixed expressions to say how much they like or dislike something. Grammar: verbs like, want, love, have, start followed by infinitive; prepositions to, about, and on.",
      "35": "Can say the things they and others prefer. Can name some fruits and desserts. Can say what foods and drinks they and others have for certain meals. Can offer someone foods and drinks. Can make and accept offers. Grammar: determiners some and any; regular plural nouns ending in -ies; prepositions on, for, and to.",
      "37": "Can describe their and others’ habits and routines. Can express some actions according to some weather conditions. Can say what the weather is like using basic phrases. Can name a few everyday objects and pieces of clothing. Grammar: adverbs of frequency with Simple Present tense and verb to be; relative pronoun when; review prepositions at, to, and, on.",
      "39": "Can name a few kitchen utensils. Can name a few pets. Can ask others how often they do some activities. Can say what their favorite pet is and ask others about theirs. Grammar: question word How often; review prepositions in and on.",
      "41": "Can name different everyday objects. Can tell others some of their hobbies. Can count from 30 to 100. Can say their and others’ abilities or lack of abilities. Can say what people and things are or are not. Grammar: review of verb to be; preposition to; review of modal can; object pronoun me.",
      "43": "Can name a few pieces of clothing. Can describe what they and others are wearing. Can describe what action they and others are doing. Can say the size clothing they and others wear. Grammar: Present Continuous tense in the affirmative form; review verb to be.",
      "45": "Can ask about the price of something. Can say words related to entertainment. Can say things they and others are not doing. Can say a range of numbers, quantities, and prices. Can name a few currencies. Grammar: Present Continuous tense in the negative form; Prepositions on and for.",
      "47": "Can give simple information about the location of a place. Can name a few places in a city. Can use the fixed expression Let’s to make suggestions. Can ask what others are doing. Grammar: Present Continuous tense in the interrogative form; review pronoun who; prepositions on, at, and for; prepositions of place.",
      "49": "Can describe someone’s physical appearance. Can describe someone’s personality. Can ask what someone looks like. Grammar: adjective order; prepositions to, for, and about; review of the verb to be.",
      "51": "Can express immediate needs. Can say how they feel by using simple adjectives. Can ask someone how they feel. Can use some fixed expressions to describe their feelings. Grammar: question word how; review verb to be and the Present Continuous tense.",
      "53": "Can say words related to illnesses. Can describe some common illnesses and symptoms. Can name a few professions. Grammar: possessive adjectives our and their; preposition for.",
      "55": "Can talk about places to visit. Can say what there is or there isn’t in a certain place. Can describe things and places using simple adjectives. Can name some types of travel accommodations. Grammar: there to be in the affirmative and negative forms; review prepositions in and on.",
      "57": "Can ask people what there is or what there isn’t in a certain place. Can name some natural attractions people can visit. Can name some objects one can take when exploring the outdoors. Grammar: there to be in the interrogative form; review prepositions in, on, and in front of.",
      "59": "Can give orders and commands. Can suggest actions for recycling. Can understand what the 3 Rs are. Grammar: verbs in the imperative form."
    },

  "NT4": {
      "1": "Can ask and answer about what people are going to do using be going to.",
      "41": "Can talk about plans, intentions and future actions using will/won’t.",
      "81": "Can express an action that is being done using the present continuous.",
      "121": "Can ask and answer about things people do in their free time.",
      "161": "Can ask and answer about abilities using can and cannot.",
      "201": "Can ask and answer about objects using is there/are there and there is/there are.",
      "241": "Can talk about a long action in the past and a short action that interrupts it using the past continuous and the simple past.",
      "281": "Can talk about things they like or dislike doing using the verb + gerund or the verb + infinitive.",
      "321": "Can talk about things they have and do not have using have got/has got and its negative forms.",
      "361": "Can exchange information about things people did or did not do in the past using the simple past."
  },


  "NT6": {
      "121": "Students will be able to say when an action takes place in the future, describe experiences with feelings and reactions, express spontaneous decisions and unplanned events, talk about moving and changes with phrasal verbs, and discuss experiences related to their birthplace using the simple future will.",
      "123": "Students will be able to describe planned future events, talk about academic plans, use adjectives for descriptions, explain reasons for opinions and goals, and understand or write a basic letter of application using be going to.",
      "125": "Students will be able to use idiomatic expressions about dreams, discuss future goals and plans, and express decisions and promises for the future using will and be going to.",
      "127": "Students will be able to talk about food items, use modals for probability, identify key factual information, scan texts for details, and use fixed expressions about quantity with may and might.",
      "129": "Students will be able to talk about obligations and strong advice, discuss health and dieting giving opinions, describe cooking methods, and identify main ideas in short dialogues using must and should.",
      "131": "Students will be able to talk about symptoms of illness, express necessity and recommendation, understand podcasts, write get-well wishes, and make people feel better using there + modals.",
      "133": "Students will be able to describe how art makes them feel, discuss the arts, use interrogative negatives to confirm information, and identify speakers’ opinions using interrogative negatives with to be and auxiliaries.",
      "135": "Students will be able to write a simple review, discuss movies and books, express thoughts on cultural topics, extract key information from conversations, and use expressions to agree or disagree using negative questions with modals.",
      "137": "Students will be able to understand descriptions, write about experiences and dreams, identify prefixes’ meanings, understand short conversations, and use tag questions to confirm information.",
      "139": "Students will be able to discuss accessibility, identify problems and solutions, express opinions and advice, find specific information in texts, and make comparisons and describe positions using interrogative negatives.",
      "141": "Students will be able to talk about environmental problems, agriculture, and eco-friendly actions, compare products, express opinions, and understand talks using less/fewer than.",
      "143": "Students will be able to talk about accessibility, immigrants, and refugees, locate information in short texts, show contrasting ideas, and follow talks using getting/becoming + comparative.",
      "145": "Students will be able to contrast present and past generations, discuss past situations no longer true, find specific information, and identify details in conversations about family using used to.",
      "147": "Students will be able to report what someone said or asked, make tense changes in reported speech, use vocabulary about relationships, and make inferences about speakers’ feelings using reported speech.",
      "149": "Students will be able to describe possible future outcomes, describe scenes in detail, evaluate hypothetical proposals, and identify basic listening information using the first conditional.",
      "151": "Students will be able to write descriptions of real or imagined events, follow chronological sequences, talk about trips, and identify sequences in narratives using the simple past with time markers.",
      "153": "Students will be able to talk about past experiences, introduce topics with the present perfect, infer information from articles, and use food idioms with ever, never, and already.",
      "155": "Students will be able to talk about recent and unfinished facts, describe events, extract and give opinions on information, and add detail to descriptions using just and yet.",
      "157": "Students will be able to talk about travel experiences, describe past events and activities, and discuss places they have visited using present perfect with ever, never, and been.",
      "159": "Students will be able to talk about natural disasters, describe situations, express possibility, and ask about past experiences using question words with present perfect.",
      "161": "Students will be able to talk about facts continuing to the present, discuss environmental issues and solutions, locate specific information, and explain main ideas using for and since.",
      "163": "Students will be able to talk about behavior, clothing, and lifestyle, express opinions, and understand detailed short texts using present perfect review with time expressions.",
      "165": "Students will be able to confirm information with tag questions, talk about free time activities, and describe past experiences using present perfect tag questions.",
      "167": "Students will be able to talk about experiences and extreme sports, identify topics in structured texts, and use reflexive pronouns and it’s been + since.",
      "169": "Students will be able to discuss inventions, innovation, and technology, identify conversation details, give opinions about tech use, and extract video information using passive voice.",
      "171": "Students will be able to react to surprising news, discuss telemedicine, and summarize main points of familiar news stories using future passive voice.",
      "173": "Students will be able to ask for clarification, identify subjects in relative clauses, and understand job descriptions and talks using who, that, which, when, where, and whose.",
      "175": "Students will be able to talk about ongoing experiences, hobbies, and personal interests, identify oral details, and understand familiar texts using present perfect continuous affirmative.",
      "177": "Students will be able to say something is not being done, talk about ongoing experiences, find information about sports, and discuss sportspeople using present perfect continuous negative.",
      "179": "Students will be able to talk about ongoing experiences, ask about activities that started in the past, buy tickets, understand advertisements, and give opinions about athletes using present perfect continuous interrogative."},

  "NT8": {
      "181": "Can deduce the general meaning of a passage from context in a longer, structured text. Can introduce a conversation topic about situations and experiences that started in the past. Can talk about emotional skills. Can distinguish supporting details from the main points in a text. Can write a concise summary of the main ideas of a longer structured text. Grammar: Review of Present Perfect with for, since, already, yet, never, and just in the affirmative, negative, and question forms.",
      "183": "Can exchange information on the topic of the lesson with some confidence. Can recognize the writer’s point of view in a structured text. Can write a concise summary of the main ideas of a text. Grammar: Clauses with 'What ...' to emphasize the topic or main point.",
      "185": "Can express opinions and disagreement in a manner that shows they were actively listening to the other person. Can recognize the general line of a written argument though not necessarily all the details. Can write a concise summary of the main ideas of a longer structured text. Grammar: Despite/In spite of with noun phrases to express a contrast between two things.",
      "187": "Can pass on a detailed piece of information reliably. Can comment on factual information. Can extract the main points from news items, etc. with opinions, arguments, and discussion. Can make inferences or predictions about the content of newspaper and magazine articles from headings, titles, or headlines. Can write a concise summary of the main ideas of a longer structured text. Grammar: Present Perfect passive with yet, just, and already.",           
      "189": "Can express their opinions in discussions on contemporary social issues and current affairs. Can understand most of a podcast about a familiar topic. Can understand main points and check comprehension by using contextual clues. Can identify key information in a text or article. Can write a concise summary of the main ideas of a longer structured text. Grammar: Common reporting verbs with that + complement clause.",
      "191": "Can exchange information on a wide range of topics within their field with some confidence. Can follow most of a structured presentation about a topic they are familiar with. Can understand a text about financial education and comment on it. Can write a concise summary of the main ideas of a longer structured text. Grammar: Present or future outcomes of a hypothetical situation using even if.",
      "193": "Can express their opinions in discussions on contemporary social issues and current affairs. Can recognize the writer’s point of view in a structured text. Can support ideas by using conditional sentences. Can understand most of an audio extract about a familiar topic. Can present ideas to raise awareness of an issue. Can write a concise summary of the main ideas of a longer structured text. Grammar: Unless, as long as, as soon as, and in case in conditional clauses.",
      "195": "Can recognize a point of view presented in a structured text. Can express their opinions in discussions on contemporary social issues and current affairs. Can explain what needs to be done in order for something else to happen. Can summarize factual information from a text. Can write a concise summary of the main ideas of a longer structured text. Grammar: Need with the passive infinitive to express necessity.",
      "197": "Can exchange information on a wide range of topics with some confidence. Can write a concise summary of the main ideas of a longer structured text. Grammar: Present Continuous Passive.",
      "199": "Can understand and give the advantages and disadvantages of various options on an issue. Can express views clearly and evaluate hypothetical proposals in informal discussions. Can talk about hypothetical events and actions and their possible consequences. Can write a concise summary of the main ideas of a longer structured text. Grammar: Hypothetical results of a current action or situation using the Second Conditional.",
      "201": "Can describe future plans and intentions in detail, giving degrees of probability. Can refer to certainty and probability using a variety of expressions. Can give brief reasons and explanations using simple language. Can understand the organization of and identify key information in a text or article. Can write a concise summary of the main ideas of a longer structured text. Grammar: Certainty and probability with certain, likely, unlikely, and due to with verb phrases.",
      "203": "Can describe objects and products in detail, including their characteristics and special features. Can deduce the general meaning of a passage from context in a longer, structured text. Can make a detailed description of an object, device, or product. Can report orders, requests, and advice with infinitive clauses. Can use arguments to defend a point of view. Can write a concise summary of the main ideas of a longer structured text. Grammar: Reported speech with modals should and would.",
      "205": "Can exchange information on a wide range of topics with some confidence. Can express beliefs and opinions politely. Can express an inference or assumption about a person. Can extract specific details from audio content about sports. Can understand details and the main points in a text. Can write a concise summary of the main ideas of a longer structured text. Grammar: seem and appear with verbs in the infinitive form.",
      "207": "Can briefly give reasons and explanations for intentions, plans, or goals. Can understand simple spoken expressions used to talk about a game or sport. Can understand the author’s purpose and intended audience of a text. Can write a concise summary of the main ideas of a longer structured text. Grammar: meant, planned, intended + to + infinitive for past plans and intentions.",
      "209": "Can bring relevant personal experiences into a conversation to illustrate a point. Can give advice on a wide range of subjects. Can recommend a course of action, giving reasons. Can scan a text in order to find specific information. Can write a concise summary of the main ideas of a longer structured text. Grammar: had/'d better (not) + verb for strong advice and recommendations.",
      "211": "Can order events when telling a story. Can write or talk about abstract or cultural topics. Can understand most of an audio passage about a familiar topic. Can write a concise summary of the main ideas of a longer structured text. Grammar: Past Perfect in the affirmative and negative forms.",
      "213": "Can talk about art in general. Can exchange information on a wide range of topics with some confidence. Can write or talk about abstract or cultural topics. Can understand statements with familiar but complex language. Can identify attitudes and feelings represented in a text. Can write a concise summary of the main ideas of a longer structured text. Grammar: Past Perfect in the interrogative form.",
      "215": "Can talk about specific elements within a group, using the correct language when defining the element. Can make comparisons between people, places, or things. Can recognize when examples are being given in a structured text or audio extract. Can write a concise summary of the main ideas of a longer structured text. Grammar: One of, some of, and among in phrases with superlative adjectives.",
      "217": "Can describe wishes, dreams, hopes, and ambitions. Can identify specific information in informal speech. Can generally understand details of events, feelings, and wishes in writing. Can write a concise summary of the main ideas of a longer structured text. Grammar: Wish and if only to express wishes related to the present or future.",
      "219": "Can talk about possibilities in the past. Can express inferences and assumptions about the past. Can understand main points of both oral and written content. Can identify key information in an extended text or article. Can write a concise summary of the main ideas of a longer structured text. Grammar: Could(n’t) have + past participle to talk about past possibilities. Must have + past participle to express inferences and assumptions about the past.",
      "221": "Can tell a short story about something funny or interesting that happened in the past. Can understand a story about extraordinary achievements with complex language. Can talk about people, places, and events using expressions for contrast. Can talk about abstract subjects such as persistence using a variety of language functions. Can write a concise summary of the main ideas of a longer structured text. Grammar: Past Perfect Continuous to refer to ongoing past situations in the past.",
      "223": "Can bring relevant personal experiences into a conversation to illustrate a point. Can compare and contrast actions and situations. Can understand news reports about celebrations in other countries. Can write a concise summary of the main ideas of a longer structured text. Grammar: While and whereas to contrast and compare actions and situations. Adverbial intensifiers with adjectives.",
      "225": "Can show emphasis, interest, and appreciation in conversation using a range of expressions. Can emphasize a statement. Can structure a narrative into an organized sequence of events. Can write a concise summary of the main ideas of a longer structured text. Can recognize the writer’s ideas in a written story. Grammar: Do or did for emphasis.",
      "227": "Can tell someone about a discussion or conversation in some detail. Can add emphasis to a statement. Can write a concise summary of the main ideas of a longer structured text. Grammar: So and such (a) with adjectives and nouns, respectively; Yes/No reported questions with if/whether.",
      "229": "Can discuss options and possible actions. Can deduce the general meaning of a passage from context in a longer structured text. Can follow the exchanges and be part of a discussion. Can write a concise summary of the main ideas of a longer structured text. Grammar: Conditional sentences with modal verbs may, might, had better, could, and should.",
      "231": "Can exchange information on a wide range of topics with some confidence. Can describe goals, intentions, and purpose using a range of expressions. Can recognize the speaker’s point of view and express their own in oral and written texts. Can have a discussion on the subject presented in a text. Can write a concise summary of the main ideas of a longer structured text. Grammar: Negative purpose with so as not to/in order not to.",
      "233": "Can express agreement or disagreement in a manner that shows they were actively listening to the other person. Can recognize the general line of an argument though not necessarily all the details. Can write a concise summary of the main ideas of a longer structured text. Grammar: So, either, and neither in short phrases to express agreement and disagreement.",
      "235": "Can bring relevant personal experiences into a conversation to illustrate a point. Can recognize the speaker’s point of view during a discussion. Can understand and talk about actions in progress in the future. Can write a structured text clearly signaling main points and supporting details. Can write a concise summary of the main ideas of a longer structured text. Grammar: Future Continuous for actions in progress at a specific time in the future.",
      "237": "Can justify and sustain views clearly by providing relevant explanations and arguments. Can understand cause and effect relationships in a structured text. Can follow most of a clearly structured talk or discussion. Can recognize the writer’s point of view in a structured text. Can write a concise summary of the main ideas of a longer structured text. Grammar: Due to and owing to to express causation and consequence.",
      "239": "Can suggest solutions to problems and explain why they would work. Can give advice by putting oneself in someone else’s position. Can understand the main points presented in a structured text. Can write a concise summary of the main ideas of a longer structured text. Grammar: If I were... for advice."
    }};

    const livros = {

    "NG": ["1000", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "1111", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "2222", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "3333", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "4444", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "5555", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "6666", "000"],
    
    "NK2": ["1000", "1", "2", "3", "4", "5", "6", "1111", "7", "8", "9", "10", "11", "12", "2222", "13", "14", "15", "16", "17", "18", "3333", "19", "20", "21", "22", "23", "24", "4444", "25", "26", "27", "28", "29", "30", "5555", "31", "32", "33", "34", "35", "36", "6666", "37", "38", "39", "40", "41", "42", "7777", "43", "44", "45", "46", "47", "48", "8888", "49", "50", "51", "52", "53", "54", "9999", "55", "56", "57", "58", "59", "60", "1010", "000"],

    "NK4": ["1000", "1", "2", "3", "4", "5", "6", "1111", "7", "8", "9", "10", "11", "12", "2222", "13", "14", "15", "16", "17", "18", "3333", "19", "20", "21", "22", "23", "24", "4444", "25", "26", "27", "28", "29", "30", "5555", "31", "32", "33", "34", "35", "36", "6666", "37", "38", "39", "40", "41", "42", "7777", "43", "44", "45", "46", "47", "48", "8888", "49", "50", "51", "52", "53", "54", "9999", "55", "56", "57", "58", "59", "60", "1010", "000"],

    "NT2": ["1000", "1", "2", "3", "4", "5", "6", "1111", "7", "8", "9", "10", "11", "12", "2222", "13", "14", "15", "16", "17", "18", "3333", "19", "20", "21", "22", "23", "24", "4444", "25", "26", "27", "28", "29", "30", "5555", "31", "32", "33", "34", "35", "36", "6666", "37", "38", "39", "40", "41", "42", "7777", "43", "44", "45", "46", "47", "48", "8888", "49", "50", "51", "52", "53", "54", "9999", "55", "56", "57", "58", "59", "60", "1010", "000"],

    "NW2": ["1000", "1", "2", "3", "4", "5", "6", "1111", "7", "8", "9", "10", "11", "12", "2222", "13", "14", "15", "16", "17", "18", "3333", "19", "20", "21", "22", "23", "24", "4444", "25", "26", "27", "28", "29", "30", "5555", "31", "32", "33", "34", "35", "36", "6666", "37", "38", "39", "40", "41", "42", "7777", "43", "44", "45", "46", "47", "48", "8888", "49", "50", "51", "52", "53", "54", "9999", "55", "56", "57", "58", "59", "60", "1010", "000"],

    "PT": ["1000", "1", "2", "3", "4", "5", "6", "1111", "7", "8", "9", "10", "11", "12", "2222", "13", "14", "15", "16", "17", "18", "3333", "19", "20", "21", "22", "23", "24", "4444", "25", "26", "27", "28", "29", "30", "5555", "31", "32", "33", "34", "35", "36", "6666", "37", "38", "39", "40", "41", "42", "7777", "43", "44", "45", "46", "47", "48", "8888", "49", "50", "51", "52", "53", "54", "9999", "55", "56", "57", "58", "59", "60", "1010", "000"],        

    "NT4": ["1000", "61", "62", "63", "64", "65", "66", "1111", "67", "68", "69", "70", "71", "72", "2222", "73", "74", "75", "76", "77", "78", "3333", "1005", "79", "80", "81", "82", "83", "84", "4444", "85", "86", "87", "88", "89", "90", "5555", "91", "92", "93", "94", "95", "96", "6666", "97", "98", "99", "100", "101", "102", "7777", "103", "104", "105", "106", "107", "108", "8888", "109", "110", "111", "112", "113", "114", "9999", "115", "116", "117", "118", "119", "120", "1010", "000"],

    "NW4": ["1000", "61", "62", "63", "64", "65", "66", "1111", "67", "68", "69", "70", "71", "72", "2222", "73", "74", "75", "76", "77", "78", "3333", "1005", "79", "80", "81", "82", "83", "84", "4444", "85", "86", "87", "88", "89", "90", "5555", "91", "92", "93", "94", "95", "96", "6666", "97", "98", "99", "100", "101", "102", "7777", "103", "104", "105", "106", "107", "108", "8888", "109", "110", "111", "112", "113", "114", "9999", "115", "116", "117", "118", "119", "120", "1010", "000"],

    "NT6": ["1001", "1002", "121", "122", "123", "124", "125", "126", "1111", "127", "128", "129", "130", "131", "132", "2222", "133", "134", "135", "136", "137", "138", "3333", "1005", "139", "140", "141", "142", "143", "144", "4444", "145", "146", "147", "148", "149", "150", "5555", "151", "152", "153", "154", "155", "156", "6666", "157", "158", "159", "160", "161", "162", "7777", "163", "164", "165", "166", "167", "168", "8888", "169", "170", "171", "172", "173", "174", "9999", "175", "176", "177", "178", "179", "180", "1010", "000"],

    "NW6": ["1000", "121", "122", "123", "124", "125", "126", "1111", "127", "128", "129", "130", "131", "132", "2222", "133", "134", "135", "136", "137", "138", "3333", "1005", "139", "140", "141", "142", "143", "144", "4444", "145", "146", "147", "148", "149", "150", "5555", "151", "152", "153", "154", "155", "156", "6666", "157", "158", "159", "160", "161", "162", "7777", "163", "164", "165", "166", "167", "168", "8888", "169", "170", "171", "172", "173", "174", "9999", "175", "176", "177", "178", "179", "180", "1010", "000"],

    "NT8": ["1001", "1002", "181", "182", "183", "184", "185", "186", "1111", "187", "188", "189", "190", "191", "192", "2222", "193", "194", "195", "196", "197", "198", "3333", "1005", "199", "200", "201", "202", "203", "204", "4444", "205", "206", "207", "208", "209", "210", "5555", "211", "212", "213", "214", "215", "216", "6666", "217", "218", "219", "220", "221", "222", "7777", "223", "224", "225", "226", "227", "228", "8888", "229", "230", "231", "232", "233", "234", "9999", "235", "236", "237", "238", "239", "240", "1010", "000"],

    "NW8": ["1000", "181", "182", "183", "184", "185", "186", "1111", "187", "188", "189", "190", "191", "192", "2222", "193", "194", "195", "196", "197", "198", "3333", "1005", "199", "200", "201", "202", "203", "204", "4444", "205", "206", "207", "208", "209", "210", "5555", "211", "212", "213", "214", "215", "216", "6666", "217", "218", "219", "220", "221", "222", "7777", "223", "224", "225", "226", "227", "228", "8888", "229", "230", "231", "232", "233", "234", "9999", "235", "236", "237", "238", "239", "240", "1010", "000"],

    "NW10": ["1000", "241", "242", "243", "244", "245", "246", "1111", "247", "248", "249", "250", "251", "252", "2222", "253", "254", "255", "256", "257", "258", "3333", "1005", "259", "260", "261", "262", "263", "264", "4444", "265", "266", "267", "268", "269", "270", "5555", "271", "272", "273", "274", "275", "276", "6666", "277", "278", "279", "280", "281", "282", "7777", "283", "284", "285", "286", "287", "288", "8888", "289", "290", "291", "292", "293", "294", "9999", "295", "296", "297", "298", "299", "300", "1010", "000"],

    "NW12": ["1000", "301", "302", "303", "304", "305", "306", "1111", "307", "308", "309", "310", "311", "312", "2222", "313", "314", "315", "316", "317", "318", "3333", "1005", "319", "320", "321", "322", "323", "324", "4444", "325", "326", "327", "328", "329", "330", "5555", "331", "332", "333", "334", "335", "336", "6666", "337", "338", "339", "340", "341", "342", "7777", "343", "344", "345", "346", "347", "348", "8888", "349", "350", "351", "352", "353", "354", "9999", "355", "356", "357", "358", "359", "360", "1010", "000"]

};

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
