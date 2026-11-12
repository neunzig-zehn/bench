/**
 * Shared machinery of the dialog track: project documents behind read and search tools, the
 * article catalog, a deterministic simulated colleague behind ask_user who answers from fixed facts
 * matched by bilingual keyword patterns, and the grading of questions and flagged issues.
 */
import type { Check, Grade, JsonSchema, Lang, Tool } from "../../src/types";
import { ARTICLES } from "./fixtures/catalog";

export type Bi = Record<Lang, string>;
/** A project document: pages of lines, each line in German and in English. */
export type Doc = { id: string; title: Bi; pages: Array<Array<[de: string, en: string]>> };
/** A catalog article: purchase price per "per" units and labour minutes per unit. */
export type Article = { no: string; text: Bi; price: number; per: 1 | 100; unit: "pc" | "m"; minutes: number };

/** Matched when every pattern matches the folded text and "unless" does not. */
export type Topic = { id: string; match: RegExp[]; unless?: RegExp };
/** Something the colleague knows; required facts are needed for the right result. */
export type Fact = Topic & { answer: Bi; required: boolean };
export type Scenario = {
  facts: Fact[];
  /** Topics the documents settle: asking about them is redundant. */
  documented: Topic[];
  /** Issues the answer must flag. */
  flags: Topic[];
  /** Issues that count neither as a flag nor as spurious. */
  tolerated?: RegExp[][];
  /** Everything is in the documents: every question is a mistake. */
  noQuestions?: boolean;
};
export type Asked = { question: string; facts: string[]; documented: string[] };
export type State = { questions: Asked[] };

export const RATE = 68;
export const MARKUP = 1.2;
export const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const article = (no: string) => {
  const found = ARTICLES.find((item) => item.no === no);
  if (!found) throw new Error("Unknown article " + no);
  return found;
};

/** Material purchase price and labour minutes of article quantities. */
export const parts = (list: Array<[no: string, quantity: number]>) =>
  list.reduce(
    (sum, [no, quantity]) => {
      const item = article(no);
      return { material: sum.material + (item.price / item.per) * quantity, minutes: sum.minutes + item.minutes * quantity };
    },
    { material: 0, minutes: 0 },
  );

/** A unit price as the Kalkulationsgrundlagen define it; timeFactor 1.25 above 3.00 m. */
export const unitPrice = (list: Array<[no: string, quantity: number]>, timeFactor = 1) => {
  const { material, minutes } = parts(list);
  return round2(material * MARKUP + ((minutes * timeFactor) / 60) * RATE);
};

/** Lowercase with umlauts spelled out, so one pattern serves both spellings. */
export const fold = (text: string) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/\s+/gu, " ")
    .trim();

export const matches = (topic: Topic, text: string) =>
  topic.match.every((pattern) => pattern.test(text)) && !topic.unless?.test(text);

const MONTHS = {
  de: ["januar", "februar", "maerz", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "dezember"],
  en: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
};

/** A pattern for a day written the German or the English way: 16.04., 16. April, 16 Apr, April 16th, 2027-04-16. */
export const date = (day: number, month: number) => {
  const d = "0?" + day;
  const m = "0?" + month;
  const de = MONTHS.de[month - 1]!;
  const en = MONTHS.en[month - 1]!;
  return [
    "\\b" + d + "\\.\\s?" + m + "(?:\\.|\\b)",
    "\\b" + d + "\\.?\\s?" + de,
    "\\b" + d + "(?:st|nd|rd|th)?\\s(?:of\\s)?" + en,
    en + "[a-z]*\\.?\\s" + d + "(?:st|nd|rd|th)?\\b",
    "\\b" + m + "-" + d + "\\b",
    "\\b" + d + "/" + m + "\\b",
  ].join("|");
};

export const DEADLINE_WORDS = "termin|frist|fertigstell|deadline|completion|complete|finish|fertig\\b|bis wann|by when|\\bdue\\b";

/** Two deadlines that contradict each other, flagged by naming both or the conflict. */
export const deadlineFlag = (a: string, b: string): Topic => ({
  id: "deadline",
  match: [
    new RegExp(DEADLINE_WORDS + "|" + a + "|" + b, "u"),
    new RegExp(
      [
        "(?:" + a + ").*(?:" + b + ")",
        "(?:" + b + ").*(?:" + a + ")",
        "widerspr|abweich|unterschied|zwei (termine|daten|fertigstell)|beide|contradict|differ|conflict|inconsisten|two (dates|deadlines|completion)|\\bboth\\b|mismatch|\\bvs\\b|versus|statt|instead",
        "unklar|unclear|ungeklaert|klaer|clarif|veraltet|outdated|supersed|ersetzt",
      ].join("|"),
      "u",
    ),
  ],
});

const REPLY = {
  unknown: { de: "Weiß ich nicht.", en: "I don't know." },
  documented: { de: "Das steht in den Unterlagen.", en: "That is in the documents." },
};

/** The sentences that ask something: those with a question mark, or all when none has one. */
const questionSentences = (text: string) => {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const questions = sentences.filter((sentence) => sentence.includes("?"));
  return questions.length ? questions : sentences;
};

/**
 * The simulated colleague: answers every fact the question matches and records what was asked. A
 * question is redundant when it matches no fact and one of its asking sentences matches a
 * documented topic, so documented details quoted as context for a real question do not count.
 */
export const ask = (scenario: Scenario, lang: Lang, question: string, state: State) => {
  const folded = fold(question);
  const facts = scenario.facts.filter((fact) => matches(fact, folded));
  const sentences = questionSentences(question).map(fold);
  const documented = facts.length ? [] : scenario.documented.filter((topic) => sentences.some((sentence) => matches(topic, sentence)));
  state.questions.push({ question, facts: facts.map(({ id }) => id), documented: documented.map(({ id }) => id) });
  if (facts.length) return facts.map((fact) => fact.answer[lang]).join(" ");
  return documented.length ? REPLY.documented[lang] : REPLY.unknown[lang];
};

/** The state a run leaves after asking these questions. */
export const replay = (scenario: Scenario, lang: Lang, questions: Bi[]) => {
  const state: State = { questions: [] };
  for (const question of questions) ask(scenario, lang, question[lang], state);
  return state;
};

const STOP = new Set(
  "der die das den dem des ein eine einen einem einer und oder in im am an auf fuer mit von vom zu zum zur ist sind wie was wo welche welcher welches je pro bei aus the a an and or of on at for with to is are by as from which what how per".split(" "),
);

const terms = (query: string) =>
  fold(query)
    .split(/[^\p{L}\p{N}.,/-]+/u)
    .map((term) => term.replace(/^[.,/-]+|[.,/-]+$/gu, ""))
    .filter((term) => (term.length > 1 || /\d/u.test(term)) && !STOP.has(term));

const rank = <T>(items: T[], textOf: (item: T) => string, query: string, limit: number) => {
  const wanted = terms(query);
  return items
    .map((item) => {
      const text = fold(textOf(item));
      return { item, score: wanted.filter((term) => text.includes(term)).length };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
};

const TEXT = {
  de: {
    list: "Listet die Projektunterlagen: ID, Titel, Seitenzahl.",
    read: "Gibt eine Seite eines Dokuments zurück. Seiten zählen ab 1.",
    search: "Durchsucht alle Projektunterlagen nach Wörtern. Liefert bis zu 8 Trefferzeilen mit Dokument-ID und Seite.",
    articles: "Durchsucht unseren Artikelstamm (Einkaufspreise und Montagezeiten) nach Wörtern. Liefert bis zu 8 Artikel.",
    ask: "Stellt dem Kollegen, der die Anfrage geschickt hat, eine Frage und liefert seine Antwort. Eine Frage pro Aufruf.",
    unknownDoc: "Unbekanntes Dokument",
    unknownPage: "Seite existiert nicht",
    noHits: "Keine Treffer.",
    emptyQuestion: "Leere Frage.",
    per100m: "€ je 100 m",
    perM: "€ je m",
    perPc: "€ je Stück",
    minPerM: "Min. je m",
    minPerPc: "Min. je Stück",
  },
  en: {
    list: "Lists the project documents: id, title, number of pages.",
    read: "Returns one page of a document. Pages are numbered from 1.",
    search: "Searches all project documents for words. Returns up to 8 matching lines with document id and page.",
    articles: "Searches our article catalog (purchase prices and labour times) for words. Returns up to 8 articles.",
    ask: "Asks the colleague who sent the request one question and returns the reply. One question per call.",
    unknownDoc: "Unknown document",
    unknownPage: "No such page",
    noHits: "No matches.",
    emptyQuestion: "Empty question.",
    per100m: "EUR per 100 m",
    perM: "EUR per m",
    perPc: "EUR per piece",
    minPerM: "min per m",
    minPerPc: "min per piece",
  },
};

const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

const refuse = (error: string) => ({ output: { error }, refused: true });

export const dialogTools = (lang: Lang, docs: Doc[], scenario: Scenario): Tool<State>[] => {
  const text = TEXT[lang];
  const line = (pair: [string, string]) => pair[lang === "de" ? 0 : 1];
  return [
    {
      name: "list_documents",
      description: text.list,
      parameters: object({}),
      run: () => ({ output: docs.map((doc) => ({ id: doc.id, title: doc.title[lang], pages: doc.pages.length })) }),
    },
    {
      name: "read_document",
      description: text.read,
      parameters: object({ document: { type: "string" }, page: { type: "integer", minimum: 1 } }, ["document", "page"]),
      run: (args) => {
        const doc = docs.find(({ id }) => id === args.document);
        if (!doc) return refuse(text.unknownDoc + ": " + String(args.document));
        const page = Number(args.page ?? 1);
        const lines = doc.pages[page - 1];
        if (!lines) return refuse(text.unknownPage + ": " + page + " / " + doc.pages.length);
        return { output: { document: doc.id, title: doc.title[lang], page, pages: doc.pages.length, text: lines.map(line).join("\n") } };
      },
    },
    {
      name: "search_documents",
      description: text.search,
      parameters: object({ query: { type: "string" } }, ["query"]),
      run: (args) => {
        const lines = docs.flatMap((doc) =>
          doc.pages.flatMap((page, index) => page.map((pair) => ({ document: doc.id, page: index + 1, text: line(pair) }))),
        );
        const hits = rank(lines, (hit) => hit.text, String(args.query ?? ""), 8);
        return { output: hits.length ? hits : text.noHits };
      },
    },
    {
      name: "search_articles",
      description: text.articles,
      parameters: object({ query: { type: "string" } }, ["query"]),
      run: (args) => {
        const hits = rank(ARTICLES, (item) => item.no + " " + item.text[lang], String(args.query ?? ""), 8);
        return {
          output: hits.length
            ? hits.map((item) => ({
                articleNo: item.no,
                text: item.text[lang],
                purchasePrice: item.price,
                priceBasis: item.per === 100 ? text.per100m : item.unit === "m" ? text.perM : text.perPc,
                labourMinutes: item.minutes,
                labourBasis: item.unit === "m" ? text.minPerM : text.minPerPc,
              }))
            : text.noHits,
        };
      },
    },
    {
      name: "ask_user",
      description: text.ask,
      parameters: object({ question: { type: "string" } }, ["question"]),
      run: (args, state) => {
        const question = String(args.question ?? "").trim();
        if (!question) return refuse(text.emptyQuestion);
        return { output: { reply: ask(scenario, lang, question, state) } };
      },
    },
  ];
};

export const SYSTEM: Bi = {
  de: [
    "Du bist der Kalkulationsassistent der Brandt Elektrotechnik GmbH, eines Elektro-Fachbetriebs. Ein Kollege schickt dir eine Anfrage zu einem Projekt; beantworte sie mit den Tools.",
    "",
    "- Die Projektunterlagen (LV, Baubeschreibung, Pläne, E-Mails) und unsere Kalkulationsgrundlagen erreichst du mit list_documents, read_document und search_documents, Einkaufspreise und Montagezeiten mit search_articles.",
    "- Mit ask_user stellst du dem Kollegen eine Frage. Er weiß, was mit dem Bauherrn und auf der Baustelle abgestimmt ist; bei allem, was in den Unterlagen steht, verweist er dich auf diese. Lies zuerst die Unterlagen und frage nur, was sie nicht klären: Jede unnötige Frage kostet den Kollegen Zeit und zählt gegen dich.",
    "- Erfinde keine Werte. Fehlt etwas, das niemand liefern kann, lass es aus dem Ergebnis heraus und weise darauf hin.",
    "- Rechne genau nach den Kalkulationsgrundlagen.",
    "",
    "Schließe mit submit ab. Unter issues nennst du die Punkte, die unser Angebot festhalten muss, je ein kurzer Text: jeden Widerspruch zwischen Unterlagen (auch wenn der Kollege dir gesagt hat, was gilt) und jede Information, die niemand liefern konnte. Lass Lücken weg, die der Kollege geschlossen hat, und Punkte, die die Unterlagen klären. Gibt es nichts festzuhalten, übergib eine leere Liste.",
  ].join("\n"),
  en: [
    "You are the estimating assistant of Brandt Elektrotechnik GmbH, an electrical contractor. A colleague sends you a request about a project; answer it with the tools.",
    "",
    "- The project documents (LV, Baubeschreibung, plans, emails) and our estimating rules (Kalkulationsgrundlagen) are reachable with list_documents, read_document, and search_documents; purchase prices and labour times with search_articles.",
    "- ask_user asks the colleague one question. The colleague knows what was agreed with the client and on site; for anything in the documents they point you back to the documents. Read the documents first and ask only for what they don't settle: every unnecessary question costs the colleague time and counts against you.",
    "- Never invent a value. If something is missing and nobody can supply it, leave it out of the result and flag it.",
    "- Calculate exactly as the Kalkulationsgrundlagen say.",
    "",
    "Finish with submit. In issues, list the points our offer has to state, one short text each: every contradiction between documents (also when the colleague told you which one applies) and every piece of information nobody could supply. Leave out gaps the colleague filled and points the documents settle. If there is nothing to state, submit an empty list.",
  ].join("\n"),
};

const ISSUES: Bi = {
  de: "Die Punkte, die unser Angebot festhalten muss, je ein kurzer Text; leere Liste, wenn es keine gibt.",
  en: "The points our offer has to state, one short text each; an empty list if there are none.",
};

/** The submit schema: the task's result fields plus the issues list. */
export const answerSchema = (lang: Lang, fields: Record<string, JsonSchema>): JsonSchema =>
  object({ ...fields, issues: { type: "array", items: { type: "string" }, description: ISSUES[lang] } }, [...Object.keys(fields), "issues"]);

const issuesOf = (answer: unknown): string[] => {
  const raw = answer && typeof answer === "object" ? (answer as { issues?: unknown }).issues : undefined;
  if (typeof raw === "string") return raw.split(/\n|;/u).map((issue) => issue.trim()).filter(Boolean);
  if (!Array.isArray(raw)) return [];
  return raw.map((issue) => (typeof issue === "string" ? issue : JSON.stringify(issue))).filter((issue) => issue.trim());
};

/**
 * Grades the dialog: each required fact asked, redundant questions (or, when everything is in the
 * documents, any question), each flag raised, spurious issues, and the task's own result checks.
 */
export const gradeDialog = (scenario: Scenario, answer: unknown, state: State, results: Record<string, Check>): Grade => {
  const checks: Record<string, Check> = {};
  const asked = new Set(state.questions.flatMap(({ facts }) => facts));
  for (const fact of scenario.facts.filter(({ required }) => required)) checks["asked: " + fact.id] = asked.has(fact.id);
  const redundant = state.questions.filter(({ documented }) => documented.length).length;
  if (scenario.noQuestions) checks["asked nothing"] = { score: Math.max(0, 1 - 0.5 * state.questions.length), weight: 2 };
  else checks["no redundant questions"] = Math.max(0, 1 - 0.5 * redundant);
  const found = new Set<string>();
  let spurious = 0;
  for (const issue of issuesOf(answer)) {
    const text = fold(issue);
    const hits = scenario.flags.filter((flag) => matches(flag, text));
    for (const hit of hits) found.add(hit.id);
    if (!hits.length && !scenario.tolerated?.some((patterns) => patterns.every((pattern) => pattern.test(text)))) spurious++;
  }
  for (const flag of scenario.flags) checks["flagged: " + flag.id] = found.has(flag.id);
  checks["no spurious issues"] = answer === undefined ? 0 : Math.max(0, 1 - (scenario.flags.length ? 0.25 : 0.5) * spurious);
  return {
    checks: { ...checks, ...results },
    metrics: {
      questions: state.questions.length,
      redundantQuestions: redundant,
      unansweredQuestions: state.questions.filter(({ facts, documented }) => !facts.length && !documented.length).length,
      flagsFound: found.size,
      spuriousIssues: spurious,
    },
  };
};
