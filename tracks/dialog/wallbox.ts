/**
 * Wallbox unit price with missing parameters. The LV item leaves the make blank and the plan does
 * not dimension the supply cable, so the model must ask for both; mounting height and type, power,
 * cross-section, load management, protection, and quantity are in the documents, so asking for them
 * is redundant. The colleague's answer on the make points back to an old offer, which also holds an
 * outdated unit price and cable length that must not be reused. Traps: a 22 kW variant, a pedestal,
 * cable prices per 100 m. Graded on the two facts asked, redundant questions, spurious issues
 * (nothing is left to flag), and the unit price to the cent (weight 4).
 */
import { exact, toNumber } from "../../src/score";
import type { Lang, Task } from "../../src/types";
import { answerSchema, dialogTools, gradeDialog, replay, SYSTEM, unitPrice, type Bi, type Scenario, type State } from "./dialog";
import { WALLBOX_DOCS } from "./fixtures/wallbox";

type Answer = { unitPrice: unknown; issues: string[] };

export const WALLBOX_UNIT_PRICE = unitPrice([
  ["A-4103", 1],
  ["K-5060", 22],
]);

export const WALLBOX_SCENARIO: Scenario = {
  facts: [
    {
      id: "make",
      required: true,
      match: [
        /wallbox|ladestation|ladepunkt|charger|charging|fabrikat|hersteller|marke|manufactur|brand|02\.04/u,
        /fabrikat|hersteller|marke|modell|model|\btyp|\btype|\bmake\b|produkt|product|brand|manufactur|vendor|welche wallbox|which wallbox|welches geraet|which (unit|device)/u,
      ],
      answer: {
        de: "Der Bauherr will dasselbe Fabrikat und denselben Typ wie im 1. Bauabschnitt, ohne Alternative. Das steht in unserem damaligen Angebot.",
        en: "The client wants the same make and type as in construction phase 1, no alternative. It is in our offer from back then.",
      },
    },
    {
      id: "cable length",
      required: true,
      match: [
        /kabel|leitung|cable|\blead|feed|supply|wiring|\bwire|nym|5x6/u,
        /laenge|\blang|length|\blong|meter|metre|\d ?m\b|distanz|distance|entfernung|abstand|route|trasse|how far|wie weit/u,
      ],
      answer: {
        de: "Markus hat vor Ort gemessen: im Schnitt 22 m Zuleitung je Wallbox ab UV-TG. Damit bitte rechnen.",
        en: "Markus measured on site: 22 m of supply cable per wallbox from the UV-TG on average. Please use that.",
      },
    },
  ],
  documented: [
    { id: "mounting height", match: [/hoehe|height|wie hoch|how high|ueber (dem )?(fussboden|boden|ffb|okff)|above (the )?(finished )?floor/u] },
    { id: "mounting type", match: [/wandmontage|an der wand|\bwand\b|wall.?mount|on the wall|\bwall\b|stele|standsaeule|saeule|pedestal|\bpost\b|freistehend|free.?standing|montageart|mounting (type|method)|type of mounting/u] },
    { id: "power", match: [/ladeleistung|charging power|power rating|\bleistung\b|22 ?kw|kw-?variante/u] },
    { id: "cross-section", match: [/querschnitt|cross.?section|leitungstyp|kabeltyp|cable type|type of cable|cable size|leitungsart|kabelart|\bgauge/u] },
    { id: "load management", match: [/lastmanagement|load management|lastmanager|load balancing|\bdlm\b/u] },
    { id: "protection", match: [/fehlerstrom|\bfi\b|\brcd|leitungsschutz|absicherung|\bmcb|breaker|\bfuse|b32|residual/u] },
    {
      id: "quantity",
      match: [/anzahl|wie viele|how many|menge|quantity|stueckzahl|number of/u, /wallbox|ladepunkt|ladestation|ladeplaetze|stellplaetze|charger|charging point|parking|02\.04/u],
      unless: /meter|metre|laenge|length|kabel|leitung|cable/u,
    },
  ],
  flags: [],
};

const QUESTIONS: Bi[] = [
  { de: "Welches Wallbox-Fabrikat will der Bauherr?", en: "Which wallbox make does the client want?" },
  { de: "Wie lang ist die Zuleitung je Wallbox ab UV-TG?", en: "How long is the supply cable per wallbox from the UV-TG?" },
];

const TEXT = {
  de: {
    prompt: "Hallo, kannst du mir den Einheitspreis für Pos. 02.04 (Wallbox) im LV Lindenstraße ausrechnen? Danke, Jana",
    answer: "Übergibt den Einheitspreis von Pos. 02.04 und die Punkte für das Angebot.",
    unitPrice: "Einheitspreis von Pos. 02.04 in € netto, 2 Nachkommastellen.",
  },
  en: {
    prompt: "Hi, could you work out the unit price of item 02.04 (wallbox) in the Lindenstraße LV? Thanks, Jana",
    answer: "Submits the unit price of item 02.04 and the points for the offer.",
    unitPrice: "Unit price of item 02.04 in EUR net, 2 decimals.",
  },
};

export const wallboxUnitPrice = (lang: Lang): Task<State, Answer> => ({
  id: "dialog-wallbox-unit-price-" + lang,
  track: "dialog",
  lang,
  title: "Wallbox unit price with missing parameters",
  description:
    "Price one LV item whose make is blank and whose cable length nobody dimensioned. The model must ask for exactly these two facts; height, mounting, power, cross-section, load management, protection, and quantity are in the documents. The answer on the make refers to an old offer whose 2025 unit price and 18 m cable must not be reused. Traps: a 22 kW variant, a pedestal, cable prices per 100 m. Graded on facts asked, redundant questions, spurious issues, and the unit price to the cent (weight 4).",
  system: SYSTEM[lang],
  prompt: TEXT[lang].prompt,
  init: () => ({ questions: [] }),
  tools: dialogTools(lang, WALLBOX_DOCS, WALLBOX_SCENARIO),
  answer: {
    description: TEXT[lang].answer,
    schema: answerSchema(lang, { unitPrice: { type: "number", description: TEXT[lang].unitPrice } }),
  },
  grade: (answer, state) =>
    gradeDialog(WALLBOX_SCENARIO, answer, state, {
      "unit price": { score: exact(toNumber(answer?.unitPrice), WALLBOX_UNIT_PRICE, 0.011) ? 1 : 0, weight: 4 },
    }),
  reference: { unitPrice: WALLBOX_UNIT_PRICE, issues: [] },
  referenceState: () => replay(WALLBOX_SCENARIO, lang, QUESTIONS),
  maxTurns: 30,
});
