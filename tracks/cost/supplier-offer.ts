/**
 * Unit prices from a supplier offer the model can only search and read, as an estimator does: price
 * units, packaging, discounts, an erratum, tier prices over all Items, and Items no line fits.
 * Graded per Item by deviation from the actual unit price, and on the net material total.
 */
import { deviationScore, mean, relativeDeviation } from "../../src/score";
import type { Task, Tool } from "../../src/types";
import { CONDITIONS, GOLD, ITEMS, OFFER_LINES as LINES, TRAPS } from "./fixtures/supplier-offer";

type Priced = { kind: "price"; lines: string[]; unitPrice: number } | { kind: "unpriced"; reason: string };
type State = { prices: Record<string, Priced> };
type Answer = { netTotal: number; summary?: string };

const tokens = (text: string) =>
  text
    .toLowerCase()
    .replaceAll("½", "1/2")
    .replaceAll("¾", "3/4")
    .split(/[^a-z0-9äöüß/.,°²]+/u)
    .filter((token) => token.length > 1 || /\d/u.test(token));

const search = (query: string) => {
  const wanted = tokens(query);
  return LINES.map((line) => {
    const haystack = tokens(line.text).join(" ");
    return { line, score: wanted.filter((token) => haystack.includes(token)).length };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.line.id.localeCompare(b.line.id))
    .slice(0, 5)
    .map(({ line }) => ({ id: line.id, text: line.text, unit: line.unit, price: line.price }));
};

const ok = (output: unknown) => ({ output });
const refuse = (error: string) => ({ output: { error }, refused: true });
const known = (id: unknown) => ITEMS.some((item) => item.id === id);

const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

const TOOLS: Tool<State>[] = [
  {
    name: "list_items",
    description: "Lists LV Items in order: id, ordinal, short text, quantity, unit. At most 25 per call.",
    parameters: object({ offset: { type: "integer", minimum: 0 }, limit: { type: "integer", minimum: 1, maximum: 25 } }, ["offset", "limit"]),
    run: (args) => {
      const offset = Math.max(0, Number(args.offset ?? 0));
      const limit = Math.min(25, Math.max(1, Number(args.limit ?? 25)));
      return ok({
        total: ITEMS.length,
        items: ITEMS.slice(offset, offset + limit).map(({ long: _long, ...item }) => item),
        next: offset + limit < ITEMS.length ? offset + limit : null,
      });
    },
  },
  {
    name: "get_item",
    description: "Returns one Item with its long text.",
    parameters: object({ itemId: { type: "string" } }, ["itemId"]),
    run: (args) => (known(args.itemId) ? ok(ITEMS.find((item) => item.id === args.itemId)) : refuse(`Unknown item ${String(args.itemId)}`)),
  },
  {
    name: "get_offer_conditions",
    description: "Returns the offer's header: date, validity, and conditions.",
    parameters: object({}),
    run: () => ok({ conditions: CONDITIONS }),
  },
  {
    name: "search_offer_lines",
    description: "Searches the supplier offer's lines by words in their text. Returns up to 5 lines: id, text, unit, price.",
    parameters: object({ query: { type: "string" } }, ["query"]),
    run: (args) => ok(search(String(args.query ?? ""))),
  },
  {
    name: "get_offer_line",
    description: "Returns one offer line with article number, price unit, packaging, discount, and notes.",
    parameters: object({ lineId: { type: "string" } }, ["lineId"]),
    run: (args) => {
      const line = LINES.find(({ id }) => id === args.lineId);
      return line ? ok(line) : refuse(`Unknown line ${String(args.lineId)}`);
    },
  },
  {
    name: "set_item_price",
    description: "Writes an Item's unit price per LV unit (EUR net, 2 decimals) and the offer lines it comes from. A later write replaces an earlier one.",
    parameters: object(
      { itemId: { type: "string" }, offerLineIds: { type: "array", items: { type: "string" } }, unitPrice: { type: "number" }, note: { type: "string" } },
      ["itemId", "offerLineIds", "unitPrice"],
    ),
    run: (args, state) => {
      if (!known(args.itemId)) return refuse(`Unknown item ${String(args.itemId)}`);
      const ids = Array.isArray(args.offerLineIds) ? args.offerLineIds.map(String) : [];
      if (!ids.length || ids.some((id) => !LINES.some((line) => line.id === id))) return refuse(`Unknown offer lines ${JSON.stringify(ids)}`);
      if (typeof args.unitPrice !== "number") return refuse("unitPrice must be a number");
      state.prices[String(args.itemId)] = { kind: "price", lines: ids.sort(), unitPrice: args.unitPrice };
      return ok({ ok: true });
    },
  },
  {
    name: "mark_unpriced",
    description: "Marks an Item as unpriced because no offer line fits.",
    parameters: object({ itemId: { type: "string" }, reason: { type: "string" } }, ["itemId", "reason"]),
    run: (args, state) => {
      if (!known(args.itemId)) return refuse(`Unknown item ${String(args.itemId)}`);
      state.prices[String(args.itemId)] = { kind: "unpriced", reason: String(args.reason ?? "") };
      return ok({ ok: true });
    },
  },
];

/** The actual unit price of an Item; an Item allowing an equivalent takes the closest answer. */
const actualPrice = (id: string, price?: number) => {
  const gold = GOLD[id]!;
  if (gold === "unpriced") return undefined;
  return gold.map((answer) => answer.unitPrice).sort((a, b) => Math.abs(a - (price ?? a)) - Math.abs(b - (price ?? b)))[0]!;
};

const ACTUAL_TOTAL = Math.round(ITEMS.reduce((sum, item) => sum + item.quantity * (actualPrice(item.id) ?? 0), 0) * 100) / 100;

export const supplierOfferPricing: Task<State, Answer> = {
  id: "cost-supplier-offer-unit-prices-de",
  track: "cost",
  lang: "de",
  title: "Unit prices for an LV from a supplier offer",
  description:
    "Prices 40+ LV Items from a 100+ line supplier offer reachable only through search and read tools. Traps: price units (per 100), packaging, line and group discounts, a printed erratum, tier prices over the total of all Items, near-miss sizes, and Items no line fits. Graded per Item by log deviation from the actual unit price (0 at a factor of 1.5), unpriced Items by being marked unpriced, and the submitted net material total by deviation (weight 5).",
  system: `You price the Items of a German construction tender (LV) from a supplier offer, using the tools.

- Price every Item: the unit price per LV unit, in EUR net, rounded to 2 decimals.
- Use only the offer: its lines and its conditions. Search results are summaries; read a line's details before you use it.
- An Item gets the offer line that matches it exactly in type, size, and rating. The LV and the offer may name the same product differently. If nothing in the offer matches exactly, mark the Item unpriced and say why.
- Payment terms (Skonto) don't change unit prices.
- Call independent tools in parallel. Write each price with set_item_price or mark_unpriced, then submit the net material total: the sum of quantity × unit price over all priced Items.`,
  prompt: `Price all ${ITEMS.length} Items of the LV "Sanierung Sanitär Haus B" (Titel 01–04) from the offer of Haustechnik Müller GmbH (Angebot 2026-118).`,
  init: () => ({ prices: {} }),
  tools: TOOLS,
  answer: {
    description: "The net material total in EUR over all priced Items.",
    schema: object({ netTotal: { type: "number" }, summary: { type: "string" } }, ["netTotal"]),
  },
  maxTurns: 60,
  grade: (answer, state) => {
    const checks: Record<string, number | { score: number; weight: number }> = {};
    const deviations: number[] = [];
    for (const item of ITEMS) {
      const written = state.prices[item.id];
      const name = `${item.ordinal} ${TRAPS[item.id]}`;
      if (GOLD[item.id] === "unpriced") {
        checks[name] = written?.kind === "unpriced" ? 1 : 0;
        continue;
      }
      const price = written?.kind === "price" ? written.unitPrice : undefined;
      const actual = actualPrice(item.id, price)!;
      checks[name] = deviationScore(price, actual, 1.5);
      deviations.push(Math.min(1, relativeDeviation(price, actual)));
    }
    checks["net material total"] = { score: deviationScore(answer?.netTotal, ACTUAL_TOTAL, 1.5), weight: 5 };
    return {
      checks,
      metrics: {
        unitPriceDeviationPct: mean(deviations) * 100,
        totalDeviationPct: Math.min(1, relativeDeviation(answer?.netTotal, ACTUAL_TOTAL)) * 100,
      },
    };
  },
  reference: { netTotal: ACTUAL_TOTAL },
  referenceState: () => ({
    prices: Object.fromEntries(
      ITEMS.map((item) => {
        const gold = GOLD[item.id]!;
        return [item.id, gold === "unpriced" ? { kind: "unpriced", reason: "" } : { kind: "price", lines: gold[0]!.lines, unitPrice: gold[0]!.unitPrice }];
      }),
    ) as Record<string, Priced>,
  }),
};
