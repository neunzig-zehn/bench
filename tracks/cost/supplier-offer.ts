/**
 * Unit prices from a supplier offer the model can only search and read, as an estimator does: price
 * units, packaging, discounts, an erratum, tier prices over all Items, and Items no line fits.
 * The offer fixes every price, so each Item scores 1 within rounding and falls to 0 at 5 % off;
 * unpriced Items score by being marked unpriced, and the net material total (weight 5) the same way.
 */
import { mean } from "../../src/score";
import type { Lang, Task, Tool } from "../../src/types";
import { supplierOffer, type Line } from "./fixtures/supplier-offer";
import { calculator, costScore, deviationPct, object, ok, pick, refuse, round2 } from "./shared";

type Priced = { kind: "price"; lines: string[]; unitPrice: number } | { kind: "unpriced"; reason: string };
type State = { prices: Record<string, Priced> };
type Answer = { netTotal: number; summary?: string };

const FACTOR = 1.05;

const tokens = (text: string) =>
  text
    .toLowerCase()
    .replaceAll("½", "1/2")
    .replaceAll("¾", "3/4")
    .split(/[^a-z0-9äöüß/.,°²]+/u)
    .filter((token) => token.length > 1 || /\d/u.test(token));

const search = (lines: Line[], query: string) => {
  const wanted = tokens(query);
  return lines
    .map((line) => {
      const haystack = tokens(line.text).join(" ");
      return { line, score: wanted.filter((token) => haystack.includes(token)).length };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.line.id.localeCompare(b.line.id))
    .slice(0, 5)
    .map(({ line }) => ({ id: line.id, text: line.text, unit: line.unit, price: line.price }));
};

export const supplierOfferPricing = (lang: Lang): Task<State, Answer> => {
  const t = pick(lang);
  const { OFFER_LINES: LINES, CONDITIONS, ITEMS, GOLD, TRAPS } = supplierOffer(lang);
  const known = (id: unknown) => ITEMS.some((item) => item.id === id);
  const unknownItem = (id: unknown) => refuse(t(`Unbekannte Position ${String(id)}`, `Unknown item ${String(id)}`));

  const tools: Tool<State>[] = [
    {
      name: "list_items",
      description: t(
        "Listet die LV-Positionen der Reihe nach: ID, Ordnungszahl, Kurztext, Menge, Einheit. Höchstens 25 je Aufruf.",
        "Lists the LV Items in order: id, ordinal, short text, quantity, unit. At most 25 per call.",
      ),
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
      description: t("Gibt eine Position mit Langtext zurück.", "Returns one Item with its long text."),
      parameters: object({ itemId: { type: "string" } }, ["itemId"]),
      run: (args) => (known(args.itemId) ? ok(ITEMS.find((item) => item.id === args.itemId)) : unknownItem(args.itemId)),
    },
    {
      name: "get_offer_conditions",
      description: t("Gibt den Kopf des Angebots zurück: Datum, Gültigkeit und Konditionen.", "Returns the offer's header: date, validity, and conditions."),
      parameters: object({}),
      run: () => ok({ conditions: CONDITIONS }),
    },
    {
      name: "search_offer_lines",
      description: t(
        "Durchsucht die Angebotszeilen nach Wörtern im Text. Gibt bis zu 5 Zeilen zurück: ID, Text, Einheit, Preis.",
        "Searches the supplier offer's lines by words in their text. Returns up to 5 lines: id, text, unit, price.",
      ),
      parameters: object({ query: { type: "string" } }, ["query"]),
      run: (args) => ok(search(LINES, String(args.query ?? ""))),
    },
    {
      name: "get_offer_line",
      description: t(
        "Gibt eine Angebotszeile mit Artikelnummer, Preiseinheit, Verpackung, Rabatt und Hinweisen zurück.",
        "Returns one offer line with article number, price unit, packaging, discount, and notes.",
      ),
      parameters: object({ lineId: { type: "string" } }, ["lineId"]),
      run: (args) => {
        const line = LINES.find(({ id }) => id === args.lineId);
        return line ? ok(line) : refuse(t(`Unbekannte Zeile ${String(args.lineId)}`, `Unknown line ${String(args.lineId)}`));
      },
    },
    {
      name: "set_item_price",
      description: t(
        "Schreibt den Einheitspreis einer Position je LV-Einheit (EUR netto, 2 Nachkommastellen) und die Angebotszeilen, aus denen er stammt. Ein späterer Aufruf ersetzt den früheren.",
        "Writes an Item's unit price per LV unit (EUR net, 2 decimals) and the offer lines it comes from. A later write replaces an earlier one.",
      ),
      parameters: object(
        { itemId: { type: "string" }, offerLineIds: { type: "array", items: { type: "string" } }, unitPrice: { type: "number" }, note: { type: "string" } },
        ["itemId", "offerLineIds", "unitPrice"],
      ),
      run: (args, state) => {
        if (!known(args.itemId)) return unknownItem(args.itemId);
        const ids = Array.isArray(args.offerLineIds) ? args.offerLineIds.map(String) : [];
        if (!ids.length || ids.some((id) => !LINES.some((line) => line.id === id)))
          return refuse(t(`Unbekannte Angebotszeilen ${JSON.stringify(ids)}`, `Unknown offer lines ${JSON.stringify(ids)}`));
        if (typeof args.unitPrice !== "number") return refuse(t("unitPrice muss eine Zahl sein", "unitPrice must be a number"));
        state.prices[String(args.itemId)] = { kind: "price", lines: ids.sort(), unitPrice: args.unitPrice };
        return ok({ ok: true });
      },
    },
    {
      name: "mark_unpriced",
      description: t("Markiert eine Position als nicht bepreisbar, weil keine Angebotszeile passt.", "Marks an Item as unpriced because no offer line fits."),
      parameters: object({ itemId: { type: "string" }, reason: { type: "string" } }, ["itemId", "reason"]),
      run: (args, state) => {
        if (!known(args.itemId)) return unknownItem(args.itemId);
        state.prices[String(args.itemId)] = { kind: "unpriced", reason: String(args.reason ?? "") };
        return ok({ ok: true });
      },
    },
    calculator(lang),
  ];

  const actualPrice = (id: string, price?: number) => {
    const gold = GOLD[id]!;
    if (gold === "unpriced") return undefined;
    return gold.map((answer) => answer.unitPrice).sort((a, b) => Math.abs(a - (price ?? a)) - Math.abs(b - (price ?? b)))[0]!;
  };
  const actualTotal = round2(ITEMS.reduce((sum, item) => sum + item.quantity * (actualPrice(item.id) ?? 0), 0));

  return {
    id: `cost-supplier-offer-unit-prices-${lang}`,
    track: "cost",
    lang,
    title: "Unit prices for an LV from a supplier offer",
    description:
      "Prices 63 LV Items from a 107-line supplier offer reachable only through search and read tools. Traps: price units (per 100), packaging, line and group discounts, a printed erratum, tier prices over the total of all Items, near-miss sizes, synonyms, and Items no line fits. The offer fixes every price, so each Item scores 1 within rounding and falls with the log deviation to 0 at 5 % off; unpriced Items score by being marked unpriced; the submitted net material total scores the same way (weight 5).",
    system: t(
      `Du bepreist die Positionen eines deutschen Leistungsverzeichnisses (LV) aus einem Lieferantenangebot, mit den Tools.

- Bepreise jede Position: Einheitspreis je LV-Einheit, in EUR netto, auf 2 Nachkommastellen gerundet.
- Verwende nur das Angebot: seine Zeilen und seine Konditionen. Suchergebnisse sind Zusammenfassungen; lies die Details einer Zeile, bevor du sie verwendest.
- Eine Position bekommt die Angebotszeile, die nach Art, Größe und Ausführung genau passt. LV und Angebot können dasselbe Produkt unterschiedlich benennen. Passt nichts im Angebot genau, markiere die Position als nicht bepreisbar und begründe es.
- Zahlungsbedingungen (Skonto) ändern keine Einheitspreise.
- Rufe unabhängige Tools parallel auf. Schreibe jeden Preis mit set_item_price oder mark_unpriced und reiche dann die Netto-Materialsumme ein: die Summe aus Menge × Einheitspreis über alle bepreisten Positionen.`,
      `You price the Items of a construction tender (LV) from a supplier offer, using the tools.

- Price every Item: the unit price per LV unit, in EUR net, rounded to 2 decimals.
- Use only the offer: its lines and its conditions. Search results are summaries; read a line's details before you use it.
- An Item gets the offer line that matches it exactly in type, size, and rating. The LV and the offer may name the same product differently. If nothing in the offer matches exactly, mark the Item unpriced and say why.
- Payment terms (cash discount) don't change unit prices.
- Call independent tools in parallel. Write each price with set_item_price or mark_unpriced, then submit the net material total: the sum of quantity × unit price over all priced Items.`,
    ),
    prompt: t(
      `Bepreise alle ${ITEMS.length} Positionen des LV "Sanierung Sanitär Haus B" (Titel 01–04) aus dem Angebot der Haustechnik Müller GmbH (Angebot 2026-118).`,
      `Price all ${ITEMS.length} Items of the LV "Plumbing refurbishment, Building B" (sections 01–04) from the offer of Haustechnik Müller GmbH (offer 2026-118).`,
    ),
    init: () => ({ prices: {} }),
    tools,
    answer: {
      description: t("Die Netto-Materialsumme in EUR über alle bepreisten Positionen.", "The net material total in EUR over all priced Items."),
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
        checks[name] = costScore(price, actual, FACTOR);
        deviations.push(deviationPct(price, actual));
      }
      checks["net material total"] = { score: costScore(answer?.netTotal, actualTotal, FACTOR), weight: 5 };
      return {
        checks,
        metrics: { unitPriceDeviationPct: mean(deviations), totalDeviationPct: deviationPct(answer?.netTotal, actualTotal) },
      };
    },
    reference: { netTotal: actualTotal },
    referenceState: () => ({
      prices: Object.fromEntries(
        ITEMS.map((item) => {
          const gold = GOLD[item.id]!;
          return [item.id, gold === "unpriced" ? { kind: "unpriced", reason: "" } : { kind: "price", lines: gold[0]!.lines, unitPrice: gold[0]!.unitPrice }];
        }),
      ) as Record<string, Priced>,
    }),
  };
};
