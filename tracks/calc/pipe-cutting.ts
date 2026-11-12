/**
 * Cutting plan for stainless pipe: pack the pieces of an isometric cut list into the fewest 6 m bars
 * per diameter, with a cutting allowance per piece. The instance is built so the optimum equals the
 * lower bound but first-fit decreasing needs one bar more per diameter. Traps: a cancelled riser
 * whose pieces stay in the cut list, the allowance on every piece, and the tight packing itself.
 * Graded per diameter on a valid plan (every piece exactly once, no bar over length) and on reaching
 * the optimal bar count with it, plus the total bar count.
 */
import { LANGS, type Check, type Lang, type Task } from "../../src/types";
import { BAR, DIAMETERS, KERF, OPTIMUM, PIECES, PLAN, RULES, STRANDS } from "./fixtures/pipe-cutting";
import { calculateTool, localize, matches, object, ok, page, refuse } from "./shared";

type Answer = { plans: Array<{ dn: number; bars: Array<{ pieceIds: string[] }> }>; totalBars: number };

const NAMES_DE = { id: "id", name: "bezeichnung", status: "status", strands: "straenge", strand: "strang", dn: "dn", lengthMm: "laengeMm", document: "dokument" };

const live = (dn: number) => PIECES.filter((piece) => piece.dn === dn && !STRANDS.find((strand) => strand.id === piece.strand)!.cancelled);

/** Bars a plan uses for a diameter, or undefined when the plan misses, repeats or overfills. */
const validBars = (answer: Answer | undefined, dn: number) => {
  const plan = Array.isArray(answer?.plans) ? answer.plans.find((entry) => Number(entry?.dn) === dn) : undefined;
  if (!plan || !Array.isArray(plan.bars)) return undefined;
  const wanted = new Map(live(dn).map((piece) => [piece.id, piece.length]));
  const used = new Set<string>();
  for (const bar of plan.bars) {
    if (!Array.isArray(bar?.pieceIds)) return undefined;
    let length = 0;
    for (const raw of bar.pieceIds) {
      const id = String(raw).trim().toUpperCase();
      if (!wanted.has(id) || used.has(id)) return undefined;
      used.add(id);
      length += wanted.get(id)! + KERF;
    }
    if (length > BAR) return undefined;
  }
  return used.size === wanted.size ? plan.bars.filter((bar) => bar.pieceIds.length).length : undefined;
};

const TEXT = {
  de: {
    status: { active: "aktiv", cancelled: "entfällt" },
    system: "Du bist Arbeitsvorbereiter im SHK-Handwerk und erstellst Schnittpläne mit den Werkzeugen. Die Daten erreichst du nur über die Werkzeuge; rechne mit calculate. Lies die Zuschnittregeln vollständig, bevor du planst. Rufe unabhängige Werkzeuge parallel auf. Wenn du fertig bist, rufe submit mit deinem Ergebnis auf.",
    prompt: "Erstelle für die Trinkwasser-Stränge der Wohnanlage Birkenhof den Schnittplan für das Edelstahl-Pressrohr nach den Zuschnittregeln: je Durchmesser so wenige Stangen wie möglich.",
    tools: {
      list_strands: "Gibt die Strangliste zurück: Strang-ID, Bezeichnung, Status.",
      list_pieces: "Listet die Stückliste aus der Isometrie seitenweise: Stück-ID, Strang, DN, Länge in mm. Höchstens 10 Stücke je Aufruf; optional nach DN gefiltert.",
      get_rules: "Gibt die Zuschnittregeln zurück.",
    },
    answer: "Der Schnittplan je Durchmesser.",
    fields: {
      plans: "Ein Schnittplan je Durchmesser",
      dn: "Durchmesser, 15 oder 22",
      bars: "Die Stangen dieses Durchmessers",
      pieceIds: "Stück-IDs, die aus dieser Stange geschnitten werden",
      totalBars: "Anzahl der Stangen über alle Durchmesser",
    },
  },
  en: {
    status: { active: "active", cancelled: "cancelled" },
    system: "You are a work planner at a plumbing contractor preparing cutting plans with the tools. You reach the data only through the tools; calculate with calculate. Read the cutting rules completely before you plan. Call independent tools in parallel. When you are done, call submit with your result.",
    prompt: "Prepare the cutting plan for the stainless press-fit pipe of the drinking water risers of the residential complex Birkenhof according to the cutting rules: as few bars as possible per diameter.",
    tools: {
      list_strands: "Returns the riser list: riser id, name, status.",
      list_pieces: "Lists the cut list from the isometric page by page: piece id, riser, DN, length in mm. At most 10 pieces per call; optionally filtered by DN.",
      get_rules: "Returns the cutting rules.",
    },
    answer: "The cutting plan per diameter.",
    fields: {
      plans: "One cutting plan per diameter",
      dn: "Diameter, 15 or 22",
      bars: "The bars of this diameter",
      pieceIds: "Ids of the pieces cut from this bar",
      totalBars: "Number of bars over all diameters",
    },
  },
};

const make = (lang: Lang): Task<Record<string, never>, Answer> => {
  const text = TEXT[lang];
  const out = (value: unknown) => ok(localize(lang, value, NAMES_DE));
  return {
    id: `calc-pipe-cutting-${lang}`,
    track: "calc",
    lang,
    title: "Cutting plan: fewest pipe bars",
    description:
      "Packs the pieces of an isometric cut list into the fewest 6 m bars per diameter with a cutting allowance per piece; the optimum equals the lower bound by construction, first-fit decreasing needs one bar more. Traps: a cancelled riser still in the cut list, the allowance on every piece, and the tight packing.",
    system: text.system,
    prompt: text.prompt,
    init: () => ({}),
    tools: [
      {
        name: "list_strands",
        description: text.tools.list_strands,
        parameters: object({}),
        run: () => out({ strands: STRANDS.map((strand) => ({ id: strand.id, name: strand.name[lang], status: text.status[strand.cancelled ? "cancelled" : "active"] })) }),
      },
      {
        name: "list_pieces",
        description: text.tools.list_pieces,
        parameters: object({ offset: { type: "integer", minimum: 0 }, limit: { type: "integer", minimum: 1, maximum: 10 }, dn: { type: "integer", enum: DIAMETERS } }, ["offset"]),
        run: (args) => {
          if (args.dn !== undefined && !DIAMETERS.includes(Number(args.dn))) return refuse(lang, `DN: ${DIAMETERS.join(", ")}`);
          const rows = args.dn === undefined ? PIECES : PIECES.filter((piece) => piece.dn === Number(args.dn));
          const { rows: pageRows, ...rest } = page(rows, args, 10);
          return out({ ...rest, rows: pageRows.map((piece) => ({ id: piece.id, strand: piece.strand, dn: piece.dn, lengthMm: piece.length })) });
        },
      },
      { name: "get_rules", description: text.tools.get_rules, parameters: object({}), run: () => out({ document: RULES[lang] }) },
      calculateTool(lang),
    ],
    answer: {
      description: text.answer,
      schema: object({
        plans: {
          type: "array",
          description: text.fields.plans,
          items: object({
            dn: { type: "integer", description: text.fields.dn },
            bars: { type: "array", description: text.fields.bars, items: object({ pieceIds: { type: "array", items: { type: "string" }, description: text.fields.pieceIds } }) },
          }),
        },
        totalBars: { type: "integer", description: text.fields.totalBars },
      }),
    },
    grade: (answer) => {
      const checks: Record<string, Check> = {};
      let extra = 0;
      for (const dn of DIAMETERS) {
        const bars = validBars(answer, dn);
        checks[`DN ${dn} valid plan`] = { score: bars === undefined ? 0 : 1, weight: 2 };
        checks[`DN ${dn} optimal bar count`] = { score: bars === OPTIMUM[dn] ? 1 : 0, weight: 3 };
        extra += bars === undefined ? 0 : bars - OPTIMUM[dn]!;
      }
      checks["total bars"] = matches(answer?.totalBars, DIAMETERS.reduce((sum, dn) => sum + OPTIMUM[dn]!, 0), 0);
      return { checks, metrics: { extraBars: extra } };
    },
    reference: {
      plans: DIAMETERS.map((dn) => {
        const pool = live(dn).map((piece) => ({ ...piece }));
        return {
          dn,
          bars: PLAN[dn]!.map((lengths) => ({
            pieceIds: lengths.map((length) => pool.splice(pool.findIndex((piece) => piece.length === length), 1)[0]!.id),
          })),
        };
      }),
      totalBars: DIAMETERS.reduce((sum, dn) => sum + OPTIMUM[dn]!, 0),
    },
  };
};

export const pipeCutting = LANGS.map(make);
