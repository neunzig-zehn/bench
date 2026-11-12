/**
 * Lighting section total across contradicting documents. The LV has 10 downlights where the newer
 * lighting plan has 12, NYM cable in a required corridor where the Baubeschreibung demands
 * halogen-free cable, a panel make that does not meet the UGR < 19 it requires, and a contract
 * deadline that a later email moves. The colleague settles the count (12) and the cable
 * (halogen-free), confirms the UGR variant if asked, and cannot settle the deadline. The foyer
 * downlights hang in a two-storey void, so the height surcharge applies without any document saying
 * so. Decoys: neutral white is 4000 K, 4 × 2 panels match 8, and a contingency item stays out of the
 * total. Graded on
 * both facts asked, redundant questions, the four contradictions flagged, spurious issues, and the
 * total (weight 4).
 */
import { exact, toNumber } from "../../src/score";
import type { Lang, Task } from "../../src/types";
import { answerSchema, date, DEADLINE_WORDS, deadlineFlag, dialogTools, gradeDialog, replay, round2, SYSTEM, unitPrice, type Bi, type Scenario, type State } from "./dialog";
import { LIGHTING_DOCS } from "./fixtures/lighting";

type Answer = { total: unknown; issues: string[] };

export const LIGHTING_TOTAL = round2(
  12 * unitPrice([["L-2200", 1]]) +
    8 * unitPrice([["L-6263", 1]]) +
    4 * unitPrice([["L-9001", 1]]) +
    60 * unitPrice([["K-H015", 1]]) +
    6 * unitPrice([["L-2150", 1]], 1.25),
);

export const LIGHTING_SCENARIO: Scenario = {
  facts: [
    {
      id: "luminaire count",
      required: true,
      match: [
        /einbau|downlight|03\.?01|dl-?200|wartezimmer|waiting|typ a\b|type a\b|leuchtenanzahl|anzahl (der )?leuchten|number of (luminaires|lights|fittings)|luminaire count|\b10\b.*\b12\b|\b12\b.*\b10\b|zehn|zwoelf|\bten\b|twelve/u,
        /anzahl|wie viele|how many|menge|stueck|quantity|number|count|\b10\b|\b12\b|zehn|zwoelf|\bten\b|twelve|gilt|gelten|apply|applies|correct|richtig|stimmt|plan|widerspr|abweich|contradict|differ|discrepan|mismatch|conflict/u,
      ],
      answer: {
        de: "Der Leuchtenplan Index C ist aktuell, der Bauherr will 12 Downlights im Wartezimmer. Bitte mit 12 kalkulieren; das LV wird nicht mehr angepasst.",
        en: "Lighting plan revision C is current; the client wants 12 downlights in the waiting room. Please price 12; the LV will not be updated.",
      },
    },
    {
      id: "cable type",
      required: true,
      match: [
        /halogen|nhxmh|nym|leitung|kabel|cable|\bwire|wiring|03\.?04/u,
        /halogen|nhxmh|\btyp|\btype|\bart\b|kind|which|welche|gilt|apply|applies|zulaessig|permitted|allowed|required|vorgeschrieben|rettungsweg|escape|notwendig|flur|corridor|baubeschreibung|specification|widerspr|contradict|differ|conflict|statt|instead/u,
      ],
      answer: {
        de: "Es gilt die Baubeschreibung: im Flur halogenfrei, also NHXMH-J 3x1,5 mm² kalkulieren.",
        en: "The Baubeschreibung applies: halogen-free in the corridor, so price NHXMH-J 3x1.5 mm².",
      },
    },
    {
      id: "foyer height",
      required: false,
      match: [/foyer|luftraum|\bvoid\b|atrium|lobby|entrance hall|03\.?06/u, /hoehe|height|\bhoch\b|\bhigh\b|geschoss|storey|stories|stockwerk/u],
      answer: { de: "Das Foyer ist bis zur Decke 5,60 m hoch.", en: "The foyer is 5.60 m high up to the ceiling." },
    },
    {
      id: "panel type",
      required: false,
      match: [/raster|panel|625|03\.?02|rl-?625|behandlung|treatment/u, /\bugr|blend|glare|variante|variant|\btyp|\btype|fabrikat|\bmake\b|model/u],
      answer: {
        de: "UGR < 19 ist in den Behandlungsräumen Pflicht. Bitte die UGR-Variante kalkulieren.",
        en: "UGR < 19 is mandatory in the treatment rooms. Please price the UGR variant.",
      },
    },
    {
      id: "deadline",
      required: false,
      match: [new RegExp(DEADLINE_WORDS + "|" + date(15, 5) + "|" + date(30, 4) + "|eroeffn|opening", "u")],
      answer: { de: "Weiß ich nicht. Welcher Termin gilt, muss der Bauherr erst klären.", en: "I don't know. The client still has to clarify which date applies." },
    },
  ],
  documented: [
    { id: "colour temperature", match: [/farbtemperatur|kelvin|lichtfarbe|neutralweiss|warmweiss|colou?r temperature|neutral white|warm white|colou?r of (the )?light|light colou?r|\bcct\b/u] },
    { id: "panel count", match: [/raster|panel|625|03\.?02|behandlung|treatment/u, /anzahl|wie viele|how many|menge|quantity|number|count|stueck/u] },
    { id: "emergency luminaires", match: [/rettungszeichen|sicherheitsleuchte|notleucht|notbeleucht|emergency|exit sign|03\.?03|batterie|battery|betriebsdauer|duration/u] },
    { id: "height", match: [/raumhoehe|deckenhoehe|montagehoehe|\bhoehe|height|how high|wie hoch/u] },
    { id: "make", match: [/fabrikat|hersteller|marke|brand|manufactur|gleichwertig|equivalent/u] },
    { id: "contingency item", match: [/eventual|bedarfspos|contingen|stundenlohn|daywork|hourly/u] },
  ],
  flags: [
    {
      id: "luminaire count",
      match: [
        /einbau|downlight|leuchte|luminaire|\blights?\b|fitting|03\.?01|wartezimmer|waiting|typ a\b|type a\b/u,
        /\b10\b|\b12\b|zehn|zwoelf|\bten\b|twelve|anzahl|menge|stueck|quantity|count|number/u,
      ],
    },
    deadlineFlag(date(15, 5), date(30, 4)),
    { id: "halogen-free cable", match: [/halogen|nhxmh/u] },
    { id: "panel UGR", match: [/\bugr|blend|glare/u] },
  ],
  tolerated: [[/eventual|bedarfspos|contingen|stundenlohn|daywork|hourly/u]],
};

const QUESTIONS: Bi[] = [
  {
    de: "Im LV stehen 10 Einbauleuchten fürs Wartezimmer, im Leuchtenplan Index C sind es 12. Mit welcher Anzahl soll ich kalkulieren?",
    en: "The LV lists 10 downlights for the waiting room, lighting plan revision C shows 12. Which quantity should I price?",
  },
  {
    de: "Pos. 03.04 sieht NYM-J vor, die Baubeschreibung verlangt im notwendigen Flur halogenfreie Leitungen. Welche Leitung soll ich kalkulieren?",
    en: "Item 03.04 specifies NYM-J, but the Baubeschreibung requires halogen-free cables in the required corridor. Which cable should I price?",
  },
  {
    de: "Die Baubeschreibung nennt den 15.05.2027 als Fertigstellung, das Planungsbüro den 30.04.2027. Welcher Termin gilt?",
    en: "The Baubeschreibung gives 15 May 2027 for completion, the planning office 30 Apr 2027. Which date applies?",
  },
];

const ISSUES: Bi[] = [
  { de: "Pos. 03.01: LV nennt 10 Einbauleuchten, Leuchtenplan Index C zeigt 12; kalkuliert mit 12.", en: "Item 03.01: the LV lists 10 downlights, lighting plan revision C shows 12; priced with 12." },
  {
    de: "Fertigstellungstermin widersprüchlich: Baubeschreibung 15.05.2027, Planungsbüro 30.04.2027; noch ungeklärt.",
    en: "Completion date contradictory: Baubeschreibung 15 May 2027, planning office 30 Apr 2027; not yet clarified.",
  },
  {
    de: "Pos. 03.04: LV nennt NYM-J, die Baubeschreibung verlangt im notwendigen Flur halogenfreie Leitungen; kalkuliert mit NHXMH-J.",
    en: "Item 03.04: the LV specifies NYM-J, the Baubeschreibung requires halogen-free cables in the required corridor; priced with NHXMH-J.",
  },
  {
    de: "Pos. 03.02: Das genannte Fabrikat RL-625/840 erfüllt UGR < 19 nicht; kalkuliert mit RL-625/840-UGR.",
    en: "Item 03.02: the named make RL-625/840 does not meet UGR < 19; priced with RL-625/840-UGR.",
  },
];

const TEXT = {
  de: {
    prompt: "Bitte kalkulier mir Titel 03 Beleuchtung für die Praxis Albers: Titelsumme netto. Und sag mir, was wir im Angebot klarstellen müssen. Gruß, Tom",
    answer: "Übergibt die Titelsumme von Titel 03 und die Punkte für das Angebot.",
    total: "Titelsumme von Titel 03 in € netto, 2 Nachkommastellen.",
  },
  en: {
    prompt: "Please price section 03 lighting for the Albers practice: the net section total. And tell me what we need to make clear in the offer. Cheers, Tom",
    answer: "Submits the section total of section 03 and the points for the offer.",
    total: "Section total of section 03 in EUR net, 2 decimals.",
  },
};

export const lightingContradictions = (lang: Lang): Task<State, Answer> => ({
  id: "dialog-lighting-contradictions-" + lang,
  track: "dialog",
  lang,
  title: "Lighting section total across contradicting documents",
  description:
    "Price an LV lighting section whose documents contradict each other: 10 vs 12 downlights, NYM vs required halogen-free cable, a named panel that misses the required UGR < 19, and two completion dates. The model must ask which count and cable apply, flag all four contradictions (the deadline stays open), apply the height surcharge to downlights in a two-storey foyer, skip a contingency item, and not flag the decoys (neutral white = 4000 K, 4 × 2 panels). Graded on facts asked, redundant questions, flags, spurious issues, and the section total (weight 4).",
  system: SYSTEM[lang],
  prompt: TEXT[lang].prompt,
  init: () => ({ questions: [] }),
  tools: dialogTools(lang, LIGHTING_DOCS, LIGHTING_SCENARIO),
  answer: {
    description: TEXT[lang].answer,
    schema: answerSchema(lang, { total: { type: "number", description: TEXT[lang].total } }),
  },
  grade: (answer, state) =>
    gradeDialog(LIGHTING_SCENARIO, answer, state, {
      "section total": { score: exact(toNumber(answer?.total), LIGHTING_TOTAL, 0.05) ? 1 : 0, weight: 4 },
    }),
  reference: { total: LIGHTING_TOTAL, issues: ISSUES.map((issue) => issue[lang]) },
  referenceState: () => replay(LIGHTING_SCENARIO, lang, QUESTIONS),
  maxTurns: 30,
});
