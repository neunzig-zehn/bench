/**
 * Change order prices carried forward from a deposited original calculation (Urkalkulation) under
 * the contract's clauses: a changed tile format, an added uncoupling mat, a quantity increase over
 * 110 %, a quantity decrease under 90 %, daywork, and two quantity changes exactly on the 110 % and
 * 90 % thresholds that earn no new price. Traps: a contract discount that also applies to change
 * orders, openings deducted only above 1 m², a current wage sheet that must not be used, the right tile among near misses, a discount on tiles only, format-specific waste and
 * consumption, the original adhesive price rather than the new offer's, measured quantities summed
 * from rooms, site overhead dropped only above 110 %, and overheads spread over the executed
 * quantity. Graded per change order on the new unit price and the amount, each 1 within rounding and
 * 0 at 20 % off.
 */
import { mean } from "../../src/score";
import type { Lang, Task } from "../../src/types";
import { changeOrders, GOLD } from "./fixtures/change-order";
import { answerMap, calculator, costScore, deviationPct, documentTools, object, pick } from "./shared";

type Answer = { changeOrders: Array<{ id: string; unitPrice: number; amount: number }> };

const FACTOR = 1.2;
const idKey = (id: unknown) => String(id ?? "").toUpperCase().replace(/[^A-Z0-9]/gu, "");

export const changeOrderPricing = (lang: Lang): Task<Record<string, never>, Answer> => {
  const t = pick(lang);
  const { docs } = changeOrders(lang);
  return {
    id: `cost-change-order-pricing-${lang}`,
    track: "cost",
    lang,
    title: "Change order prices from the original calculation",
    description:
      "Prices seven change orders on a tiling contract from the deposited original calculation and the contract's change order clauses: a changed tile format, an added uncoupling mat, a quantity increase over 110 %, a decrease under 90 %, daywork, and two quantity changes exactly on the 110 % and 90 % thresholds. Traps: a contract discount in another clause that also applies to change orders, openings deducted only above 1 m² (1 m² itself measured over), thresholds that earn no new price, a newer wage sheet that the contract excludes, near-miss tiles in the supplier offer, a discount on tiles only, format-specific labour norms, waste, and consumption, the original adhesive price instead of the new offer's, quantities summed from a room-by-room measurement, site overhead dropped only for the quantity above 110 %, overheads of the shortfall spread over the executed quantity, and signed amounts. Graded per change order on the unit price and the amount: 1 within rounding, falling with the log deviation to 0 at 20 % off.",
    system: t(
      `Du bearbeitest als Kalkulator eines Fliesenlegerbetriebs Nachträge zu einem VOB-Bauvertrag. Vertrag, Urkalkulation, Anordnungen, Aufmaß und Angebote erreichst du nur über die Tools. Halte dich genau an die Nachtragsregelungen des Vertrags, auch beim Runden. Rufe unabhängige Tools parallel auf und reiche zum Schluss je Nachtrag den neuen EP und den Nachtragsbetrag ein.`,
      `You are the estimator of a tiling contractor and price change orders on a VOB construction contract. You reach the contract, the original calculation, the instructions, the measurement sheet, and the offers only through the tools. Follow the contract's change order clauses exactly, rounding included. Call independent tools in parallel, and finally submit each change order's new unit price and amount.`,
    ),
    prompt: t(
      "Ermittle für die Nachträge N1 bis N7 zum Los 4 der Kita Sonnenblume jeweils den neuen Einheitspreis und den Nachtragsbetrag.",
      "Work out the new unit price and the amount of each change order N1 to N7 on lot 4 of Kita Sonnenblume.",
    ),
    init: () => ({}),
    tools: [...documentTools<Record<string, never>>(lang, docs), calculator(lang)],
    answer: {
      description: t(
        "Je Nachtrag (N1–N7) der Einheitspreis, der nach dem Nachtrag gilt, in EUR netto (bei N3 der EP für die Menge über 110 %, bei N5 der Stundensatz; steht kein neuer Preis zu, der Vertrags-EP) und der Nachtragsbetrag in EUR netto, Minderungen negativ.",
        "For each change order (N1–N7) the unit price that applies after it, in EUR net (for N3 the unit price of the quantity above 110 %, for N5 the hourly rate; where no new price is due, the contract unit price) and the change order amount in EUR net, decreases negative.",
      ),
      schema: object(
        {
          changeOrders: {
            type: "array",
            items: object({ id: { type: "string" }, unitPrice: { type: "number" }, amount: { type: "number" } }, ["id", "unitPrice", "amount"]),
          },
        },
        ["changeOrders"],
      ),
    },
    maxTurns: 40,
    grade: (answer) => {
      const prices = answerMap(answer?.changeOrders, "id", "unitPrice", idKey);
      const amounts = answerMap(answer?.changeOrders, "id", "amount", idKey);
      const checks: Record<string, number> = {};
      for (const { id, trap, price, amount } of GOLD) {
        checks[`${id} unit price: ${trap}`] = costScore(prices.get(id), price, FACTOR);
        checks[`${id} amount`] = costScore(amounts.get(id), amount, FACTOR);
      }
      return {
        checks,
        metrics: {
          unitPriceDeviationPct: mean(GOLD.map(({ id, price }) => deviationPct(prices.get(id), price))),
          amountDeviationPct: mean(GOLD.map(({ id, amount }) => deviationPct(amounts.get(id), amount))),
        },
      };
    },
    reference: { changeOrders: GOLD.map(({ id, price, amount }) => ({ id, unitPrice: price, amount })) },
  };
};
