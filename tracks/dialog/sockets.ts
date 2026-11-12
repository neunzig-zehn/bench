/**
 * A fully specified item: the series comes from the Baubeschreibung, the cable length from the LV
 * long text, the mounting height from the installation plan. Nothing needs asking and nothing needs
 * flagging; every question and every issue is a mistake. Traps: a white and an IP55 variant of the
 * series, flush-mounted sockets of the other series, cable per 100 m, a held-back item in the email,
 * conduit that the Kalkulationsgrundlagen include in the cable price, and RAL 7035 in the plan,
 * which is the Baubeschreibung's light grey.
 * Graded on asking nothing (weight 2), no issues, and the item total (weight 4).
 */
import { exact, toNumber } from "../../src/score";
import type { Lang, Task } from "../../src/types";
import { answerSchema, dialogTools, gradeDialog, round2, SYSTEM, unitPrice, type Scenario, type State } from "./dialog";
import { SOCKET_DOCS } from "./fixtures/sockets";

type Answer = { total: unknown; issues: string[] };

export const SOCKET_TOTAL = round2(
  14 *
    unitPrice([
      ["S-3202", 1],
      ["K-1025", 12],
    ]),
);

export const SOCKET_SCENARIO: Scenario = {
  facts: [],
  documented: [{ id: "anything", match: [/\S/u] }],
  flags: [],
  noQuestions: true,
};

const TEXT = {
  de: {
    prompt: "Was kostet Pos. 05.02 im LV Kita Sonnenblume insgesamt? Ich brauche den Gesamtpreis der Position. Danke, Lea",
    answer: "Übergibt den Gesamtpreis von Pos. 05.02 und die Punkte für das Angebot.",
    total: "Gesamtpreis von Pos. 05.02 (Menge × Einheitspreis) in € netto, 2 Nachkommastellen.",
  },
  en: {
    prompt: "What does item 05.02 in the Kita Sonnenblume LV cost in total? I need the item's total price. Thanks, Lea",
    answer: "Submits the total price of item 05.02 and the points for the offer.",
    total: "Total price of item 05.02 (quantity × unit price) in EUR net, 2 decimals.",
  },
};

export const socketsFullySpecified = (lang: Lang): Task<State, Answer> => ({
  id: "dialog-sockets-fully-specified-" + lang,
  track: "dialog",
  lang,
  title: "A fully specified item: nothing to ask",
  description:
    "Price an item whose parameters are spread over the LV long text, the Baubeschreibung, and the installation plan. Asking anything or flagging anything is a mistake. Traps: colour and IP variants of the series, the other series, cable per 100 m, a held-back item in an email, conduit already included by the estimating rules, RAL 7035 = light grey. Graded on asking nothing (weight 2), no issues, and the item total (weight 4).",
  system: SYSTEM[lang],
  prompt: TEXT[lang].prompt,
  init: () => ({ questions: [] }),
  tools: dialogTools(lang, SOCKET_DOCS, SOCKET_SCENARIO),
  answer: {
    description: TEXT[lang].answer,
    schema: answerSchema(lang, { total: { type: "number", description: TEXT[lang].total } }),
  },
  grade: (answer, state) =>
    gradeDialog(SOCKET_SCENARIO, answer, state, {
      "item total": { score: exact(toNumber(answer?.total), SOCKET_TOTAL, 0.05) ? 1 : 0, weight: 4 },
    }),
  reference: { total: SOCKET_TOTAL, issues: [] },
  maxTurns: 30,
});
