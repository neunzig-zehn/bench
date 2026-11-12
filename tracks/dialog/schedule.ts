/**
 * A go/no-go schedule decision. Installation hours come from the LV quantities and catalog times,
 * with the 25 % height surcharge for the open-plan office at 3.40 m. The LV's 36 downlights disagree
 * with the floor plan's room counts (14 + 3 × 6 = 32), which nothing points out; the colleague
 * confirms 32. The LV describes lay-in panels for a grid ceiling the plan does not have, another
 * contradiction nothing points out. The crew size is known only to the colleague, and the Baubeschreibung (30 Apr) and
 * the newer Bauzeitenplan (16 Apr) disagree on the deadline; the colleague says the Bauzeitenplan
 * binds. 33 working days are needed and 32 are
 * available (Berlin holidays: Women's Day, Easter), so the answer is no; skipping the height
 * surcharge (32 days) or the holidays (33 or 35 available) turns it into a wrong yes. Graded on both facts asked,
 * redundant questions, the three contradictions flagged, spurious issues, hours and working days (weight 2
 * each), and the decision (weight 3).
 */
import { exact, toNumber } from "../../src/score";
import type { Lang, Task } from "../../src/types";
import { answerSchema, article, date, DEADLINE_WORDS, deadlineFlag, dialogTools, fold, gradeDialog, replay, round2, SYSTEM, type Bi, type Scenario, type State } from "./dialog";
import { SCHEDULE_DOCS, SCHEDULE_ITEMS } from "./fixtures/schedule";

type Answer = { hours: unknown; workingDays: unknown; decision: unknown; issues: string[] };

const FITTERS = 2;
export const SCHEDULE_HOURS = round2(
  SCHEDULE_ITEMS.reduce((sum, [, no, quantity, high]) => sum + quantity * article(no).minutes * (high ? 1.25 : 1), 0) / 60,
);
export const SCHEDULE_DAYS = Math.ceil(SCHEDULE_HOURS / (FITTERS * 8));

export const SCHEDULE_SCENARIO: Scenario = {
  facts: [
    {
      id: "crew",
      required: true,
      match: [/monteur|kolonne|crew|\bteam|personal|staff|electrician|fitter|worker|\bleute|mitarbeiter|\bmann\b|\bmen\b|people|personen|besetzung|kapazitaet|capacity|manpower|ressourcen|resources/u],
      answer: {
        de: "Für das 2. OG haben wir zwei Monteure eingeplant; mehr sind in dem Zeitraum nicht frei.",
        en: "We have planned two fitters for the 2nd floor; nobody else is free in that period.",
      },
    },
    {
      id: "deadline",
      required: true,
      match: [new RegExp(DEADLINE_WORDS + "|" + date(16, 4) + "|" + date(30, 4), "u")],
      answer: {
        de: "Verbindlich ist der Bauzeitenplan Rev. 3, also Fertigstellung am 16.04.2027. Die Baubeschreibung ist da veraltet.",
        en: "Construction schedule rev. 3 is binding, so completion on 16 Apr 2027. The Baubeschreibung is out of date on that.",
      },
    },
    {
      id: "downlight count",
      required: true,
      match: [
        /downlight|dl-?150|02\.?02|typ d\b|type d\b|besprechung|meeting|\b3[26]\b/u,
        /anzahl|wie viele|how many|menge|stueck|quantity|number|count|\b32\b|\b36\b|gilt|apply|applies|correct|richtig|stimmt|plan|widerspr|abweich|contradict|differ|discrepan|mismatch|conflict/u,
      ],
      answer: {
        de: "Der Grundriss stimmt, es sind 32 Downlights. Das LV hat noch die alte Raumaufteilung mit vier Besprechungsräumen.",
        en: "The floor plan is right, it is 32 downlights. The LV still has the old layout with four meeting rooms.",
      },
    },
    {
      id: "panel mounting",
      required: false,
      match: [
        /raster|panel|625|02\.?01|rl-?625|typ r\b|type r\b|grossraum|open.?plan/u,
        /einlege|lay.?in|rasterdecke|grid ceiling|aufbau|surface.?mount|rohdecke|bare slab|montageart|mounting (type|method)|befestigung/u,
      ],
      answer: {
        de: "Es gilt der Plan: Aufbaumontage an der Rohdecke, eine Rasterdecke gibt es dort nicht. Den Aufbaurahmen liefert der Hersteller mit, die Montagezeit aus dem Artikelstamm passt.",
        en: "The plan applies: surface-mounted on the bare slab, there is no grid ceiling there. The manufacturer supplies the surface-mounting frame; the catalog installation time fits.",
      },
    },
    {
      id: "saturdays",
      required: false,
      match: [/samstag|saturday|wochenende|weekend|ueberstunde|overtime|sonntag|sunday|schicht|shift/u],
      answer: { de: "Nein, Samstage und Überstunden planen wir nicht ein.", en: "No, we don't plan Saturdays or overtime." },
    },
  ],
  documented: [
    { id: "start", match: [/\bbeginn|\bstart|anfang|anfangen|\bbegin|commence|baufreiheit|ab wann|from when|when can (we|you)/u] },
    { id: "holidays", match: [/feiertag|holiday|ostern|easter|frauentag|women/u] },
    { id: "hours per day", match: [/stunden (pro|je|am) tag|arbeitszeit|hours (per|a) day|working hours|8 ?h\b|8 stunden|8 hours|tagesarbeitszeit/u] },
    { id: "ceiling height", match: [/\bhoehe|height|ceiling|\bdecke|hubarbeit|aerial|steiger|work platform/u] },
    { id: "quantities", match: [/\bmengen?\b|quantit|stueckzahl/u] },
    { id: "labour times", match: [/montagezeit|zeitwert|labou?r time|installation time|\bminuten|\bminutes|time per/u] },
  ],
  flags: [
    deadlineFlag(date(30, 4), date(16, 4)),
    {
      id: "downlight count",
      match: [/downlight|dl-?150|02\.?02|typ d\b|type d\b|leuchte|luminaire/u, /\b32\b|\b36\b|anzahl|menge|stueck|quantity|count|number/u],
    },
    {
      id: "panel mounting",
      match: [
        /raster|panel|625|02\.?01|rl-?625|leuchte|luminaire|grossraum|open.?plan/u,
        /einlege|lay.?in|rasterdecke|grid ceiling|aufbau|surface|rohdecke|bare slab|montageart|mounting (type|method|style)/u,
      ],
    },
  ],
  tolerated: [
    [
      new RegExp(
        DEADLINE_WORDS +
          "|arbeitstag|working day|monteur|fitter|crew|kapazitaet|capacity|verzug|delay|nicht (haltbar|einzuhalten|zu schaffen|erreichbar|machbar)|not (feasible|achievable|met|possible)|cannot be met|zusaetzlich|additional|beschleunig|acceleration",
        "u",
      ),
    ],
  ],
};

const QUESTIONS: Bi[] = [
  { de: "Wie viele Monteure können wir im 2. OG einsetzen?", en: "How many fitters can we put on the 2nd floor?" },
  {
    de: "Pos. 02.02 nennt 36 Downlights, der Grundriss zeigt 14 im Flur und je 6 in B1–B3, also 32. Welche Menge gilt?",
    en: "Item 02.02 lists 36 downlights, the floor plan shows 14 in the corridor and 6 each in B1–B3, so 32. Which quantity applies?",
  },
  {
    de: "Die Baubeschreibung nennt den 30.04.2027, der Bauzeitenplan Rev. 3 den 16.04.2027. Welcher Fertigstellungstermin gilt?",
    en: "The Baubeschreibung says 30 Apr 2027, construction schedule rev. 3 says 16 Apr 2027. Which completion date applies?",
  },
];

const ISSUES: Bi[] = [
  {
    de: "Pos. 02.01: LV beschreibt Einlegeleuchten für Rasterdecke, laut Grundriss gibt es im Großraumbüro keine abgehängte Decke (Aufbaumontage an der Rohdecke).",
    en: "Item 02.01: the LV describes lay-in luminaires for a grid ceiling, but the floor plan shows no suspended ceiling in the open-plan office (surface mounting on the bare slab).",
  },
  {
    de: "Pos. 02.02: LV nennt 36 Downlights, Grundriss zeigt 32; gerechnet mit 32.",
    en: "Item 02.02: the LV lists 36 downlights, the floor plan shows 32; calculated with 32.",
  },
  {
    de: "Fertigstellungstermin widersprüchlich: Baubeschreibung 30.04.2027, Bauzeitenplan Rev. 3 16.04.2027 (laut Kollege verbindlich).",
    en: "Completion date contradictory: Baubeschreibung 30 Apr 2027, construction schedule rev. 3 16 Apr 2027 (binding per colleague).",
  },
];

const TEXT = {
  de: {
    prompt: "Schaffen wir die Elektroinstallation im 2. OG im Bürohaus Kanalstraße (LV Titel 02) bis zum Fertigstellungstermin? Ich muss dem Bauherrn morgen antworten. Gruß, Stefan",
    answer: "Übergibt Montagestunden, benötigte Arbeitstage, die Entscheidung und die Punkte für das Angebot.",
    hours: "Montagestunden für Titel 02 insgesamt, 2 Nachkommastellen.",
    days: "Benötigte Arbeitstage nach den Kalkulationsgrundlagen.",
    decision: "yes: wir schaffen den geltenden Fertigstellungstermin; no: wir schaffen ihn nicht; open: lässt sich mit den verfügbaren Informationen nicht entscheiden.",
  },
  en: {
    prompt: "Can we finish the electrical installation on the 2nd floor of the Kanalstraße office building (LV section 02) by the completion date? I have to answer the client tomorrow. Cheers, Stefan",
    answer: "Submits the installation hours, the working days needed, the decision, and the points for the offer.",
    hours: "Total installation hours for section 02, 2 decimals.",
    days: "Working days needed according to the Kalkulationsgrundlagen.",
    decision: "yes: we meet the applicable completion date; no: we don't; open: cannot be decided with the information available.",
  },
};

const decisionOf = (value: unknown) => {
  const text = fold(String(value ?? ""));
  return text === "nein" ? "no" : text === "ja" ? "yes" : text === "offen" ? "open" : text;
};

export const scheduleDecision = (lang: Lang): Task<State, Answer> => ({
  id: "dialog-schedule-decision-" + lang,
  track: "dialog",
  lang,
  title: "Go/no-go: can we meet the deadline?",
  description:
    "Decide whether two fitters finish an LV section by the deadline. The model must compute installation hours (with the 25 % height surcharge from the floor plan), ask the crew size, notice that the floor plan's room counts give fewer downlights than the LV and that the LV's lay-in panels have no grid ceiling, notice that the Baubeschreibung and the newer Bauzeitenplan give different deadlines, ask which applies, count Berlin working days, and flag all three contradictions. Graded on facts asked, redundant questions, the flag, spurious issues, hours and days (weight 2 each), and the decision (weight 3).",
  system: SYSTEM[lang],
  prompt: TEXT[lang].prompt,
  init: () => ({ questions: [] }),
  tools: dialogTools(lang, SCHEDULE_DOCS, SCHEDULE_SCENARIO),
  answer: {
    description: TEXT[lang].answer,
    schema: answerSchema(lang, {
      hours: { type: "number", description: TEXT[lang].hours },
      workingDays: { type: "integer", description: TEXT[lang].days },
      decision: { type: "string", enum: ["yes", "no", "open"], description: TEXT[lang].decision },
    }),
  },
  grade: (answer, state) =>
    gradeDialog(SCHEDULE_SCENARIO, answer, state, {
      "installation hours": { score: exact(toNumber(answer?.hours), SCHEDULE_HOURS, 0.05) ? 1 : 0, weight: 2 },
      "working days": { score: toNumber(answer?.workingDays) === SCHEDULE_DAYS ? 1 : 0, weight: 2 },
      decision: { score: answer && decisionOf(answer.decision) === "no" ? 1 : 0, weight: 3 },
    }),
  reference: { hours: SCHEDULE_HOURS, workingDays: SCHEDULE_DAYS, decision: "no", issues: ISSUES.map((issue) => issue[lang]) },
  referenceState: () => replay(SCHEDULE_SCENARIO, lang, QUESTIONS),
  maxTurns: 30,
});
