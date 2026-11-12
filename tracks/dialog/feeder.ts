/**
 * Fixed price for outdoor works when one quantity is unknowable. The underground cable to the barn
 * is billed as measured and its route waits on the heritage authority: nobody, not even the
 * colleague, knows its length, and the site plan's 40 m is a straight line. The model must price the
 * rest (asking for the bollard colour chosen at the sampling), leave the cable out, and flag it,
 * despite the client's and the email's push for a fixed price. Graded on the colour asked, redundant
 * questions, the flag, spurious issues, the total without the cable (weight 4), and not adding an
 * invented cable length (weight 2).
 */
import { exact, toNumber } from "../../src/score";
import type { Lang, Task } from "../../src/types";
import { answerSchema, dialogTools, gradeDialog, replay, round2, SYSTEM, unitPrice, type Bi, type Scenario, type State } from "./dialog";
import { FEEDER_DOCS } from "./fixtures/feeder";

type Answer = { total: unknown; issues: string[] };

export const FEEDER_TOTAL = round2(
  6 *
    unitPrice([
      ["O-7080", 1],
      ["O-7090", 1],
    ]) +
    2 * unitPrice([["O-7500", 1]]) +
    85 * unitPrice([["K-Y525", 1]]),
);
export const FEEDER_CABLE_PRICE = unitPrice([["K-Y516", 1]]);

export const FEEDER_SCENARIO: Scenario = {
  facts: [
    {
      id: "bollard colour",
      required: true,
      match: [
        /poller|bollard|04\.?02|pl-?80|aussenleuchte|outdoor (light|luminaire)|wegeleuchte|path light|\bleuchten?\b|\bluminaires?\b/u,
        /farbe|colou?r|ausfuehrung|finish|anthrazit|anthracite|edelstahl|stainless|bemuster|sampling|sample|variante|variant|oberflaeche|surface|\bral\b/u,
      ],
      answer: { de: "Anthrazit. Das hat der Bauherr bei der Bemusterung letzte Woche entschieden.", en: "Anthracite. The client decided that at the sampling last week." },
    },
    {
      id: "cable length",
      required: false,
      match: [
        /kabel|leitung|cable|nyy|5x16|04\.?01|scheune|barn|nebengebaeude|outbuilding|hauptverteil|main distribution|trasse|route/u,
        /laenge|\blang|length|\blong|meter|metre|menge|quantity|trasse|route|aufmass|measure|distanz|distance|entfernung|abstand|\b40\b|wie weit|how far/u,
      ],
      unless: /steckdosensaeule|socket|04\.?04|5x2[.,]?5|poller|bollard/u,
      answer: {
        de: "Weiß ich nicht, und das weiß im Moment auch niemand: Die Trasse hängt von der Denkmalschutzbehörde ab, die noch nicht entschieden hat. Die 40 m im Lageplan sind nur Luftlinie.",
        en: "I don't know, and right now nobody does: the route depends on the heritage authority, which hasn't decided yet. The 40 m on the site plan is only the straight-line distance.",
      },
    },
  ],
  documented: [
    { id: "trench", match: [/graben|trench|erdarbeit|earthwork|excavat|aushub|tiefbau/u, /\bwer\b|\bwho\b|enthalten|included|umfang|scope|herstell|\bdig|verfuell|backfill|uebernimmt|eigenleistung/u] },
    { id: "socket column", match: [/steckdosensaeule|socket column|04\.?03|\bcee\b/u, /\btyp|\btype|ausstattung|equipment|fabrikat|which|welche|wie viele|how many|anzahl|\bip\d/u] },
    { id: "foundation", match: [/fundament|foundation/u] },
    { id: "loop cable length", match: [/steckdosensaeule|socket|04\.?04|5x2[.,]?5|poller|bollard/u, /laenge|length|meter|metre|menge|quantity|wie lang|how long/u] },
    { id: "bollard height and count", match: [/poller|bollard|04\.?02|pl-?80/u, /\bhoehe|height|anzahl|wie viele|how many|menge|quantity|stueckzahl/u] },
  ],
  flags: [
    {
      id: "cable length unknown",
      unless: /poller|bollard|steckdosensaeule|socket column/u,
      match: [
        /nyy|5x16|04\.?01|scheune|barn|nebengebaeude|outbuilding|erdkabel|underground|hauptverteil|main distribution|trasse|route/u,
        /laenge|length|menge|quantity|trasse|route|aufmass|measure|meter|metre|unbekannt|unknown|offen|\bopen|festgelegt|not (yet )?(fixed|defined|determined|known|decided)|fehlt|missing|nicht (bepreist|kalkuliert|enthalten)|not (priced|included)|ausgeklammert|excluded/u,
      ],
    },
  ],
  tolerated: [[/graben|trench|erdarbeit|earthwork|bauseits|eigenleistung/u], [/denkmal|heritage|monument/u], [/festpreis|fixed price|pauschal|lump.?sum/u]],
};

const QUESTIONS: Bi[] = [
  { de: "Welche Farbe hat der Bauherr bei der Bemusterung für die Pollerleuchten gewählt?", en: "Which colour did the client choose for the bollard luminaires at the sampling?" },
  { de: "Wie lang wird das Erdkabel NYY-J 5x16 zur Scheune?", en: "How long will the NYY-J 5x16 underground cable to the barn be?" },
];

const ISSUES: Bi[] = [
  {
    de: "Pos. 04.01: Länge des Erdkabels unbekannt, Trasse noch nicht festgelegt (Denkmalschutz); nicht in der Summe, Abrechnung nach Aufmaß.",
    en: "Item 04.01: length of the underground cable unknown, route not yet fixed (heritage authority); not in the total, to be billed as measured.",
  },
];

const TEXT = {
  de: {
    prompt: "Familie Weiden will einen Festpreis für Titel 04 Außenanlagen (Hofgut Weiden). Was ist die Summe? Gruß, Jonas",
    answer: "Übergibt die Summe für Titel 04 und die Punkte für das Angebot.",
    total: "Summe für Titel 04 in € netto, 2 Nachkommastellen.",
  },
  en: {
    prompt: "The Weiden family wants a fixed price for section 04 outdoor works (Hofgut Weiden). What is the total? Cheers, Jonas",
    answer: "Submits the total for section 04 and the points for the offer.",
    total: "Total for section 04 in EUR net, 2 decimals.",
  },
};

/** At least 20 m of the unknowable cable in the total counts as an invented length. */
const invented = (total: number | undefined) => total === undefined || total >= FEEDER_TOTAL + 20 * FEEDER_CABLE_PRICE;

export const feederUnknownLength = (lang: Lang): Task<State, Answer> => ({
  id: "dialog-feeder-unknown-length-" + lang,
  track: "dialog",
  lang,
  title: "Fixed price with a quantity nobody knows",
  description:
    "Total an outdoor-works section for a client who wants a fixed price, although one cable is billed as measured and its route awaits the heritage authority. The model must ask the bollard colour, price the rest, leave the cable out, and flag it instead of using the plan's 40 m straight line or any other length. Graded on the fact asked, redundant questions, the flag, spurious issues, the total (weight 4), and no invented length in the total (weight 2).",
  system: SYSTEM[lang],
  prompt: TEXT[lang].prompt,
  init: () => ({ questions: [] }),
  tools: dialogTools(lang, FEEDER_DOCS, FEEDER_SCENARIO),
  answer: {
    description: TEXT[lang].answer,
    schema: answerSchema(lang, { total: { type: "number", description: TEXT[lang].total } }),
  },
  grade: (answer, state) => {
    const total = toNumber(answer?.total);
    return gradeDialog(FEEDER_SCENARIO, answer, state, {
      total: { score: exact(total, FEEDER_TOTAL, 0.05) ? 1 : 0, weight: 4 },
      "no invented cable length": { score: invented(total) ? 0 : 1, weight: 2 },
    });
  },
  reference: { total: FEEDER_TOTAL, issues: ISSUES.map((issue) => issue[lang]) },
  referenceState: () => replay(FEEDER_SCENARIO, lang, QUESTIONS),
  maxTurns: 30,
});
