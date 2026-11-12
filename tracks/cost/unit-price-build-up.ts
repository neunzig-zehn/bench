/**
 * Unit prices by costing over the offer total (Kalkulation über die Angebotssumme): the average wage
 * from a crew sheet (supervisor share in, apprentice out, on-costs not on travel allowance), labour
 * hours and material needs composed per Item from work-step norms (layers, sides, insulation, Q2 or
 * Q3 per side, a height surcharge found by cross-reference), priced from a merchant offer (pack
 * units, tier prices that depend on the total need of all base Items, a discount that skips
 * insulation), a discounted subcontract, site overhead from a sheet that needs the construction
 * period from the LV notes, general overhead and risk and profit as a share of the offer total (not
 * of cost), the rest spread over labour, daywork, and a provisional item left out of every sum.
 * Graded on the average wage, the labour surcharge, every unit price, and the offer total (weight
 * 3), each 1 within rounding and 0 at 20 % off.
 */
import { mean } from "../../src/score";
import type { Lang, Task } from "../../src/types";
import { AVERAGE_WAGE, buildUp, GOLD, LABOUR_SURCHARGE, OFFER_TOTAL } from "./fixtures/unit-price-build-up";
import { answerMap, calculator, costScore, deviationPct, documentTools, object, ok, ordinalKey, pick, refuse } from "./shared";

type Answer = { averageWage: number; labourSurchargePct: number; unitPrices: Array<{ ordinal: string; unitPrice: number }>; offerTotal: number };

const FACTOR = 1.2;

export const unitPriceBuildUp = (lang: Lang): Task<Record<string, never>, Answer> => {
  const t = pick(lang);
  const { items, docs } = buildUp(lang);
  return {
    id: `cost-unit-price-build-up-${lang}`,
    track: "cost",
    lang,
    title: "Unit prices by costing over the offer total",
    description:
      "Builds the unit prices of a 13-Item drywall LV by costing over the offer total, from the company's costing guideline, crew wage sheet, labour and material norms, LV notes, site overhead sheet, a merchant offer, and a subcontractor offer. Traps: supervisor share in and apprentice out of the average wage, on-costs not charged on the travel allowance, labour and material composed per Item from work-step norms (board layers, boarded sides, insulation thickness, Q2 or Q3 per side), a 20 % height surcharge on the foyer ceiling and on a foyer wall whose height is only given by cross-reference, labour norms per 100 m and in minutes, pack and per-100 price units, tier prices reached only by the total need of all base Items, a discount that excludes insulation, a near-miss board size, a subcontract discount, site overhead that needs the construction period from the LV notes, general overhead and risk and profit as a share of the offer total rather than of cost, the remainder spread over labour, daywork as labour, and a provisional item left out of every sum. Graded on the average wage, the labour surcharge, each unit price, and the offer total (weight 3): 1 within rounding, falling with the log deviation to 0 at 20 % off.",
    system: t(
      `Du kalkulierst als Kalkulator eines Trockenbauunternehmens Einheitspreise nach der Kalkulationsrichtlinie des Unternehmens. Die Positionen stehen im LV, alle Grundlagen in den Unterlagen; beides erreichst du nur über die Tools. Halte dich genau an die Richtlinie, auch beim Runden. Rufe unabhängige Tools parallel auf und reiche zum Schluss Mittellohn ASL, den Zuschlag auf Lohn, alle Einheitspreise und die Angebotssumme ein.`,
      `You are the estimator of a drywall contractor and build unit prices by the company's costing guideline. The Items are in the LV and every basis is in the documents; you reach both only through the tools. Follow the guideline exactly, rounding included. Call independent tools in parallel, and finally submit average wage ASL, the surcharge on labour, every unit price, and the offer total.`,
    ),
    prompt: t(
      "Kalkuliere die Einheitspreise aller Positionen des LV „Umbau Bürogeschoss 3. OG, Los Trockenbau“ und die Angebotssumme netto.",
      'Calculate the unit prices of all Items of the LV "Office floor conversion, 3rd floor, drywall lot" and the net offer total.',
    ),
    init: () => ({}),
    tools: [
      {
        name: "list_items",
        description: t(
          "Listet die LV-Positionen: Ordnungszahl, Kurztext, Menge, Einheit, Positionsart.",
          "Lists the LV Items: ordinal, short text, quantity, unit, item type.",
        ),
        parameters: object({}),
        run: () => ok(items.map(({ long: _long, ...item }) => item)),
      },
      {
        name: "get_item",
        description: t("Gibt eine Position mit Langtext zurück.", "Returns one Item with its long text."),
        parameters: object({ ordinal: { type: "string" } }, ["ordinal"]),
        run: (args) => {
          const item = items.find(({ ordinal }) => ordinalKey(ordinal) === ordinalKey(args.ordinal));
          return item ? ok(item) : refuse(t(`Unbekannte Position ${String(args.ordinal)}`, `Unknown item ${String(args.ordinal)}`));
        },
      },
      ...documentTools<Record<string, never>>(lang, docs),
      calculator(lang),
    ],
    answer: {
      description: t(
        "Mittellohn ASL in €/h, der Zuschlag auf Lohn in Prozent (z. B. 37.46), der Einheitspreis jeder Position in EUR netto und die Angebotssumme netto in EUR.",
        "Average wage ASL in EUR/h, the surcharge on labour in percent (e.g. 37.46), every Item's unit price in EUR net, and the net offer total in EUR.",
      ),
      schema: object(
        {
          averageWage: { type: "number" },
          labourSurchargePct: { type: "number" },
          unitPrices: {
            type: "array",
            items: object({ ordinal: { type: "string" }, unitPrice: { type: "number" } }, ["ordinal", "unitPrice"]),
          },
          offerTotal: { type: "number" },
        },
        ["averageWage", "labourSurchargePct", "unitPrices", "offerTotal"],
      ),
    },
    maxTurns: 40,
    grade: (answer) => {
      const prices = answerMap(answer?.unitPrices, "ordinal", "unitPrice", ordinalKey);
      const checks: Record<string, number | { score: number; weight: number }> = {
        "average wage ASL": costScore(answer?.averageWage, AVERAGE_WAGE, FACTOR),
        "surcharge on labour": costScore(answer?.labourSurchargePct, LABOUR_SURCHARGE, FACTOR),
      };
      for (const { ordinal, unitPrice, trap } of GOLD) checks[`${ordinal} ${trap}`] = costScore(prices.get(ordinalKey(ordinal)), unitPrice, FACTOR);
      checks["offer total"] = { score: costScore(answer?.offerTotal, OFFER_TOTAL, FACTOR), weight: 3 };
      return {
        checks,
        metrics: {
          unitPriceDeviationPct: mean(GOLD.map(({ ordinal, unitPrice }) => deviationPct(prices.get(ordinalKey(ordinal)), unitPrice))),
          totalDeviationPct: deviationPct(answer?.offerTotal, OFFER_TOTAL),
        },
      };
    },
    reference: {
      averageWage: AVERAGE_WAGE,
      labourSurchargePct: LABOUR_SURCHARGE,
      unitPrices: GOLD.map(({ ordinal, unitPrice }) => ({ ordinal, unitPrice })),
      offerTotal: OFFER_TOTAL,
    },
  };
};
